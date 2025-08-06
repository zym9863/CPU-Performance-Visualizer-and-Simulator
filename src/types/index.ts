// CPU指令类型
export interface Instruction {
  id: string;
  type: InstructionType;
  opcode: string;
  operands: string[];
  raw: string;
  cycles: number;
}

// 指令类型枚举
export enum InstructionType {
  ALU = 'ALU',        // 算术逻辑单元指令
  LOAD = 'LOAD',      // 加载指令
  STORE = 'STORE',    // 存储指令
  BRANCH = 'BRANCH',  // 分支指令
  NOP = 'NOP'         // 空操作
}

// 流水线阶段枚举
export enum PipelineStage {
  IF = 'IF',   // Instruction Fetch - 指令获取
  ID = 'ID',   // Instruction Decode - 指令解码
  EX = 'EX',   // Execute - 执行
  MEM = 'MEM', // Memory Access - 内存访问
  WB = 'WB'    // Write Back - 写回
}

// 流水线状态
export interface PipelineState {
  stage: PipelineStage;
  instruction: Instruction | null;
  stalled: boolean;
  hazard?: HazardType;
}

// 冒险类型
export enum HazardType {
  DATA = 'DATA',           // 数据冒险
  STRUCTURAL = 'STRUCTURAL', // 结构冒险
  CONTROL = 'CONTROL'      // 控制冒险
}

// CPU状态
export interface CPUState {
  cycle: number;
  completedInstructions: number;
  pipeline: Map<PipelineStage, PipelineState>;
  registers: Map<string, number>;
  memory: Map<number, number>;
  stallCycles: number;
  isRunning: boolean;
  clockRate: number; // MHz
}

// 性能指标
export interface PerformanceMetrics {
  ipc: number;              // Instructions Per Cycle
  cpi: number;              // Cycles Per Instruction
  throughput: number;       // 吞吐率
  efficiency: number;       // 流水线效率
  executionTime: number;    // 执行时间
  mips: number;            // Million Instructions Per Second
}

// 模拟器配置
export interface SimulatorConfig {
  clockRate: number;        // 时钟频率 (MHz)
  simulationSpeed: number;  // 模拟速度倍数
  pipelineDepth: number;    // 流水线深度
  enableForwarding: boolean; // 是否启用数据前递
  enableBranchPrediction: boolean; // 是否启用分支预测
}

// 事件类型
export interface SimulatorEvent {
  cycle: number;
  type: 'instruction' | 'hazard' | 'stall' | 'complete';
  message: string;
  severity: 'info' | 'warning' | 'error';
  data?: any;
}
