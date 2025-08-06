import {
  Instruction,
  InstructionType,
  PipelineStage,
  PipelineState,
  CPUState,
  PerformanceMetrics,
  SimulatorConfig,
  SimulatorEvent,
  HazardType
} from '../types';

export class CPUSimulator {
  private state: CPUState;
  private config: SimulatorConfig;
  private instructionQueue: Instruction[] = [];
  private events: SimulatorEvent[] = [];
  private eventListeners: ((event: SimulatorEvent) => void)[] = [];

  constructor(config?: Partial<SimulatorConfig>) {
    this.config = {
      clockRate: 1000,
      simulationSpeed: 1,
      pipelineDepth: 5,
      enableForwarding: true,
      enableBranchPrediction: false,
      ...config
    };

    this.state = this.initializeState();
  }

  private initializeState(): CPUState {
    const pipeline = new Map<PipelineStage, PipelineState>();
    
    // 初始化流水线各阶段
    [PipelineStage.IF, PipelineStage.ID, PipelineStage.EX, PipelineStage.MEM, PipelineStage.WB].forEach(stage => {
      pipeline.set(stage, {
        stage,
        instruction: null,
        stalled: false
      });
    });

    return {
      cycle: 0,
      completedInstructions: 0,
      pipeline,
      registers: new Map<string, number>(),
      memory: new Map<number, number>(),
      stallCycles: 0,
      isRunning: false,
      clockRate: this.config.clockRate
    };
  }

  // 加载指令序列
  public loadInstructions(instructions: string[]): void {
    this.instructionQueue = instructions.map((instr, index) => 
      this.parseInstruction(instr, index)
    );
    this.reset();
    this.emitEvent({
      cycle: this.state.cycle,
      type: 'instruction',
      message: `加载了 ${instructions.length} 条指令`,
      severity: 'info'
    });
  }

  // 解析指令
  private parseInstruction(raw: string, index: number): Instruction {
    const parts = raw.trim().split(/[\s,]+/);
    const opcode = parts[0].toUpperCase();
    const operands = parts.slice(1);

    let type: InstructionType;
    let cycles = 1;

    // 根据操作码判断指令类型
    switch (opcode) {
      case 'ADD':
      case 'SUB':
      case 'MUL':
      case 'DIV':
      case 'AND':
      case 'OR':
      case 'XOR':
        type = InstructionType.ALU;
        cycles = opcode === 'MUL' || opcode === 'DIV' ? 3 : 1;
        break;
      case 'LOAD':
      case 'LW':
      case 'LD':
        type = InstructionType.LOAD;
        cycles = 2;
        break;
      case 'STORE':
      case 'SW':
      case 'SD':
        type = InstructionType.STORE;
        cycles = 2;
        break;
      case 'BEQ':
      case 'BNE':
      case 'JMP':
      case 'BR':
        type = InstructionType.BRANCH;
        cycles = 1;
        break;
      case 'NOP':
      default:
        type = InstructionType.NOP;
        cycles = 1;
        break;
    }

    return {
      id: `I${index}`,
      type,
      opcode,
      operands,
      raw,
      cycles
    };
  }

  // 执行一个时钟周期
  public step(): void {
    if (!this.state.isRunning && this.instructionQueue.length === 0) {
      return;
    }

    this.state.cycle++;

    // 检测冒险
    this.detectHazards();

    // 流水线推进（从后向前，避免覆盖）
    this.advancePipeline();

    // 获取新指令
    if (this.instructionQueue.length > 0 && !this.state.pipeline.get(PipelineStage.IF)?.stalled) {
      const newInstruction = this.instructionQueue.shift();
      if (newInstruction) {
        const ifStage = this.state.pipeline.get(PipelineStage.IF)!;
        ifStage.instruction = newInstruction;
        
        this.emitEvent({
          cycle: this.state.cycle,
          type: 'instruction',
          message: `获取指令: ${newInstruction.raw}`,
          severity: 'info',
          data: newInstruction
        });
      }
    }

    // 更新性能指标
    this.updateMetrics();
  }

  // 推进流水线
  private advancePipeline(): void {
    const stages = [PipelineStage.WB, PipelineStage.MEM, PipelineStage.EX, PipelineStage.ID, PipelineStage.IF];
    
    // WB阶段完成
    const wbStage = this.state.pipeline.get(PipelineStage.WB)!;
    if (wbStage.instruction && !wbStage.stalled) {
      this.state.completedInstructions++;
      this.emitEvent({
        cycle: this.state.cycle,
        type: 'complete',
        message: `完成指令: ${wbStage.instruction.raw}`,
        severity: 'info',
        data: wbStage.instruction
      });
      wbStage.instruction = null;
    }

    // 其他阶段向前推进
    for (let i = 0; i < stages.length - 1; i++) {
      const currentStage = this.state.pipeline.get(stages[i])!;
      const prevStage = this.state.pipeline.get(stages[i + 1])!;
      
      if (!currentStage.stalled && !currentStage.instruction && prevStage.instruction && !prevStage.stalled) {
        currentStage.instruction = prevStage.instruction;
        prevStage.instruction = null;
      }
    }
  }

  // 检测冒险
  private detectHazards(): void {
    const pipeline = this.state.pipeline;
    
    // 检测数据冒险 (RAW - Read After Write)
    const exStage = pipeline.get(PipelineStage.EX)!;
    const idStage = pipeline.get(PipelineStage.ID)!;
    
    if (exStage.instruction && idStage.instruction) {
      // 简化的数据冒险检测：如果ID阶段的指令使用了EX阶段指令的目标寄存器
      const exTarget = exStage.instruction.operands[0];
      const idSources = idStage.instruction.operands.slice(1);
      
      if (idSources.includes(exTarget)) {
        if (!this.config.enableForwarding) {
          // 没有前递，需要停顿
          idStage.stalled = true;
          idStage.hazard = HazardType.DATA;
          this.state.stallCycles++;
          
          this.emitEvent({
            cycle: this.state.cycle,
            type: 'hazard',
            message: `数据冒险: ${idStage.instruction.raw} 等待 ${exStage.instruction.raw}`,
            severity: 'warning',
            data: { type: HazardType.DATA }
          });
        }
      }
    }

    // 检测结构冒险（简化版本）
    const memStage = pipeline.get(PipelineStage.MEM)!;
    const ifStage = pipeline.get(PipelineStage.IF)!;
    
    if (memStage.instruction?.type === InstructionType.LOAD && ifStage.instruction) {
      // 内存访问冲突
      ifStage.stalled = true;
      ifStage.hazard = HazardType.STRUCTURAL;
      this.state.stallCycles++;
      
      this.emitEvent({
        cycle: this.state.cycle,
        type: 'hazard',
        message: `结构冒险: 内存访问冲突`,
        severity: 'warning',
        data: { type: HazardType.STRUCTURAL }
      });
    }

    // 清除上一周期的停顿状态
    pipeline.forEach(stage => {
      if (stage.stalled && stage.hazard) {
        stage.stalled = false;
        stage.hazard = undefined;
      }
    });
  }

  // 更新性能指标
  private updateMetrics(): void {
    // 指标计算将在获取时动态进行
  }

  // 获取性能指标
  public getMetrics(): PerformanceMetrics {
    const cycles = this.state.cycle || 1;
    const completed = this.state.completedInstructions;
    
    const ipc = completed / cycles;
    const cpi = cycles / (completed || 1);
    const clockPeriod = 1000 / this.state.clockRate; // ns
    const executionTime = cycles * clockPeriod;
    const throughput = completed / (executionTime / 1000); // instructions per microsecond
    const efficiency = (cycles - this.state.stallCycles) / cycles;
    const mips = (completed / executionTime) * 1000;

    return {
      ipc,
      cpi,
      throughput,
      efficiency,
      executionTime,
      mips
    };
  }

  // 控制方法
  public start(): void {
    this.state.isRunning = true;
  }

  public pause(): void {
    this.state.isRunning = false;
  }

  public reset(): void {
    this.state = this.initializeState();
    this.events = [];
  }

  public isRunning(): boolean {
    return this.state.isRunning;
  }

  // 配置方法
  public setClockRate(rate: number): void {
    this.state.clockRate = rate;
    this.config.clockRate = rate;
  }

  public setSimulationSpeed(speed: number): void {
    this.config.simulationSpeed = speed;
  }

  // 获取状态
  public getState(): CPUState {
    return { ...this.state };
  }

  public getPipelineStates(): PipelineState[] {
    return Array.from(this.state.pipeline.values());
  }

  // 事件处理
  public addEventListener(listener: (event: SimulatorEvent) => void): void {
    this.eventListeners.push(listener);
  }

  private emitEvent(event: SimulatorEvent): void {
    this.events.push(event);
    this.eventListeners.forEach(listener => listener(event));
  }

  public getEvents(): SimulatorEvent[] {
    return [...this.events];
  }
}
