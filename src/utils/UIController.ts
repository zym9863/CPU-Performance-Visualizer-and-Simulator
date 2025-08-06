import { CPUSimulator } from '../core/CPUSimulator';
import { PipelineVisualizer } from '../visualization/PipelineVisualizer';
import { PerformanceVisualizer } from '../visualization/PerformanceVisualizer';
import { SimulatorEvent } from '../types';

export class UIController {
  private cpuSimulator: CPUSimulator;
  private pipelineVisualizer: PipelineVisualizer;
  private performanceVisualizer: PerformanceVisualizer;
  
  private simulationInterval: number | null = null;
  private simulationSpeed: number = 1;

  constructor(
    cpuSimulator: CPUSimulator,
    pipelineVisualizer: PipelineVisualizer,
    performanceVisualizer: PerformanceVisualizer
  ) {
    this.cpuSimulator = cpuSimulator;
    this.pipelineVisualizer = pipelineVisualizer;
    this.performanceVisualizer = performanceVisualizer;

    this.initializeEventListeners();
    this.setupSimulatorEventHandling();
    this.updateStatsDisplay();
  }

  private initializeEventListeners(): void {
    // 流水线控制
    this.setupPipelineControls();
    
    // 性能公式控制
    this.setupPerformanceControls();
  }

  private setupPipelineControls(): void {
    // 加载指令按钮
    const loadBtn = document.getElementById('load-instructions');
    const instructionInput = document.getElementById('instruction-input') as HTMLTextAreaElement;
    
    loadBtn?.addEventListener('click', () => {
      const instructions = instructionInput.value
        .split('\n')
        .filter(line => line.trim().length > 0);
      
      if (instructions.length > 0) {
        this.cpuSimulator.loadInstructions(instructions);
        this.logEvent('加载了 ' + instructions.length + ' 条指令', 'info');
      }
    });

    // 播放/暂停/重置按钮
    const playBtn = document.getElementById('play-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const resetBtn = document.getElementById('reset-btn');
    const stepBtn = document.getElementById('step-btn');

    playBtn?.addEventListener('click', () => {
      this.startSimulation();
    });

    pauseBtn?.addEventListener('click', () => {
      this.pauseSimulation();
    });

    resetBtn?.addEventListener('click', () => {
      this.resetSimulation();
    });

    stepBtn?.addEventListener('click', () => {
      this.stepSimulation();
    });

    // 时钟频率滑块
    const clockRateSlider = document.getElementById('clock-rate') as HTMLInputElement;
    const clockRateValue = document.getElementById('clock-rate-value');
    
    clockRateSlider?.addEventListener('input', () => {
      const rate = parseInt(clockRateSlider.value);
      clockRateValue!.textContent = rate.toString();
      this.cpuSimulator.setClockRate(rate);
      this.updateStatsDisplay();
    });

    // 模拟速度滑块
    const simSpeedSlider = document.getElementById('sim-speed') as HTMLInputElement;
    const simSpeedValue = document.getElementById('sim-speed-value');
    
    simSpeedSlider?.addEventListener('input', () => {
      const speed = parseFloat(simSpeedSlider.value);
      simSpeedValue!.textContent = speed.toFixed(1);
      this.simulationSpeed = speed;
      this.cpuSimulator.setSimulationSpeed(speed);
      
      // 如果正在运行，重新启动以应用新速度
      if (this.simulationInterval !== null) {
        this.pauseSimulation();
        this.startSimulation();
      }
    });

    // 添加默认指令集
    this.loadDefaultInstructions();
  }

  private setupPerformanceControls(): void {
    // 指令数滑块
    const instructionCountSlider = document.getElementById('instruction-count') as HTMLInputElement;
    const instructionCountValue = document.getElementById('instruction-count-value');
    
    instructionCountSlider?.addEventListener('input', () => {
      const count = parseInt(instructionCountSlider.value);
      instructionCountValue!.textContent = count.toString();
      this.updatePerformanceCalculation();
    });

    // CPI滑块
    const cpiSlider = document.getElementById('cpi') as HTMLInputElement;
    const cpiValue = document.getElementById('cpi-value');
    
    cpiSlider?.addEventListener('input', () => {
      const cpi = parseFloat(cpiSlider.value);
      cpiValue!.textContent = cpi.toFixed(1);
      this.updatePerformanceCalculation();
    });

    // 时钟周期滑块
    const clockCycleSlider = document.getElementById('clock-cycle') as HTMLInputElement;
    const clockCycleValue = document.getElementById('clock-cycle-value');
    
    clockCycleSlider?.addEventListener('input', () => {
      const cycle = parseFloat(clockCycleSlider.value);
      clockCycleValue!.textContent = cycle.toFixed(1);
      this.updatePerformanceCalculation();
    });
  }

  private loadDefaultInstructions(): void {
    const defaultInstructions = [
      'ADD R1, R2, R3',
      'SUB R4, R1, R5',
      'MUL R6, R7, R8',
      'LOAD R9, 100',
      'ADD R10, R9, R1',
      'STORE R10, 200',
      'BEQ R4, R6, 10',
      'ADD R11, R12, R13'
    ];

    const instructionInput = document.getElementById('instruction-input') as HTMLTextAreaElement;
    if (instructionInput) {
      instructionInput.value = defaultInstructions.join('\n');
    }
  }

  private startSimulation(): void {
    if (this.simulationInterval !== null) return;

    this.cpuSimulator.start();
    
    const intervalTime = 1000 / this.simulationSpeed; // 基础间隔为1秒
    this.simulationInterval = window.setInterval(() => {
      this.cpuSimulator.step();
      this.updateStatsDisplay();
    }, intervalTime);

    this.logEvent('模拟开始', 'info');
  }

  private pauseSimulation(): void {
    if (this.simulationInterval !== null) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    
    this.cpuSimulator.pause();
    this.logEvent('模拟暂停', 'info');
  }

  private resetSimulation(): void {
    this.pauseSimulation();
    this.cpuSimulator.reset();
    this.updateStatsDisplay();
    this.clearEventLog();
    this.logEvent('模拟重置', 'info');
  }

  private stepSimulation(): void {
    this.cpuSimulator.step();
    this.updateStatsDisplay();
  }

  private updateStatsDisplay(): void {
    const state = this.cpuSimulator.getState();
    const metrics = this.cpuSimulator.getMetrics();

    // 更新基本统计
    document.getElementById('current-cycle')!.textContent = state.cycle.toString();
    document.getElementById('completed-instructions')!.textContent = state.completedInstructions.toString();
    document.getElementById('stall-cycles')!.textContent = state.stallCycles.toString();

    // 更新性能指标
    document.getElementById('ipc')!.textContent = metrics.ipc.toFixed(2);
    document.getElementById('throughput')!.textContent = metrics.throughput.toFixed(2);
    document.getElementById('efficiency')!.textContent = (metrics.efficiency * 100).toFixed(1) + '%';
  }

  private updatePerformanceCalculation(): void {
    const instructionCount = parseInt((document.getElementById('instruction-count') as HTMLInputElement).value);
    const cpi = parseFloat((document.getElementById('cpi') as HTMLInputElement).value);
    const clockCycle = parseFloat((document.getElementById('clock-cycle') as HTMLInputElement).value);

    // 计算性能指标
    const executionTime = instructionCount * cpi * clockCycle;
    const frequency = 1000 / clockCycle; // MHz
    const mips = instructionCount / executionTime * 1000;

    // 更新显示
    document.getElementById('exec-time')!.textContent = executionTime.toFixed(2);
    document.getElementById('freq')!.textContent = frequency.toFixed(2);
    document.getElementById('mips')!.textContent = mips.toFixed(2);

    // 更新3D可视化
    this.performanceVisualizer.updateParameters(instructionCount, cpi, clockCycle);
  }

  private setupSimulatorEventHandling(): void {
    this.cpuSimulator.addEventListener((event: SimulatorEvent) => {
      this.handleSimulatorEvent(event);
    });
  }

  private handleSimulatorEvent(event: SimulatorEvent): void {
    // 将事件添加到日志
    this.logEvent(event.message, event.severity);

    // 根据事件类型更新UI
    switch (event.type) {
      case 'complete':
        this.updateStatsDisplay();
        break;
      case 'hazard':
        // 可以添加特殊的视觉效果
        break;
      case 'stall':
        // 更新停顿计数
        this.updateStatsDisplay();
        break;
    }
  }

  private logEvent(message: string, severity: 'info' | 'warning' | 'error'): void {
    const logContainer = document.getElementById('event-log');
    if (!logContainer) return;

    const logEntry = document.createElement('div');
    logEntry.className = `log-entry log-${severity}`;
    
    const timestamp = new Date().toLocaleTimeString();
    logEntry.innerHTML = `
      <span class="log-time">[${timestamp}]</span>
      <span class="log-message">${message}</span>
    `;

    logContainer.insertBefore(logEntry, logContainer.firstChild);

    // 限制日志数量
    while (logContainer.children.length > 50) {
      logContainer.removeChild(logContainer.lastChild!);
    }
  }

  private clearEventLog(): void {
    const logContainer = document.getElementById('event-log');
    if (logContainer) {
      logContainer.innerHTML = '';
    }
  }
}
