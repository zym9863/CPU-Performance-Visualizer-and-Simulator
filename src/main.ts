import './styles/main.scss';
import { PipelineVisualizer } from './visualization/PipelineVisualizer';
import { PerformanceVisualizer } from './visualization/PerformanceVisualizer';
import { CPUSimulator } from './core/CPUSimulator';
import { UIController } from './utils/UIController';

// 应用程序主类
class CPUVisualizerApp {
  private pipelineVisualizer: PipelineVisualizer;
  private performanceVisualizer: PerformanceVisualizer;
  private cpuSimulator: CPUSimulator;
  private uiController: UIController;
  private currentMode: 'pipeline' | 'performance' = 'pipeline';

  constructor() {
    this.initializeComponents();
    this.setupEventListeners();
    this.start();
  }

  private initializeComponents(): void {
    const container = document.getElementById('three-canvas');
    if (!container) throw new Error('Canvas container not found');

    // 初始化CPU模拟器
    this.cpuSimulator = new CPUSimulator();

    // 初始化可视化器
    this.pipelineVisualizer = new PipelineVisualizer(container, this.cpuSimulator);
    this.performanceVisualizer = new PerformanceVisualizer(container);

    // 初始化UI控制器
    this.uiController = new UIController(
      this.cpuSimulator,
      this.pipelineVisualizer,
      this.performanceVisualizer
    );
  }

  private setupEventListeners(): void {
    // 模式切换按钮
    const pipelineBtn = document.getElementById('pipeline-mode');
    const performanceBtn = document.getElementById('performance-mode');

    pipelineBtn?.addEventListener('click', () => {
      this.switchMode('pipeline');
    });

    performanceBtn?.addEventListener('click', () => {
      this.switchMode('performance');
    });

    // 窗口大小调整
    window.addEventListener('resize', () => {
      if (this.currentMode === 'pipeline') {
        this.pipelineVisualizer.onResize();
      } else {
        this.performanceVisualizer.onResize();
      }
    });
  }

  private switchMode(mode: 'pipeline' | 'performance'): void {
    this.currentMode = mode;

    // 更新UI
    const pipelineControls = document.getElementById('pipeline-controls');
    const performanceControls = document.getElementById('performance-controls');
    const pipelineBtn = document.getElementById('pipeline-mode');
    const performanceBtn = document.getElementById('performance-mode');

    if (mode === 'pipeline') {
      pipelineControls!.style.display = 'block';
      performanceControls!.style.display = 'none';
      pipelineBtn?.classList.add('active');
      performanceBtn?.classList.remove('active');
      
      this.performanceVisualizer.hide();
      this.pipelineVisualizer.show();
    } else {
      pipelineControls!.style.display = 'none';
      performanceControls!.style.display = 'block';
      performanceBtn?.classList.add('active');
      pipelineBtn?.classList.remove('active');
      
      this.pipelineVisualizer.hide();
      this.performanceVisualizer.show();
    }
  }

  private start(): void {
    // 开始渲染循环
    this.animate();
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);

    if (this.currentMode === 'pipeline') {
      this.pipelineVisualizer.update();
    } else {
      this.performanceVisualizer.update();
    }
  };
}

// 当DOM加载完成后启动应用
document.addEventListener('DOMContentLoaded', () => {
  new CPUVisualizerApp();
});
