import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class PerformanceVisualizer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private container: HTMLElement;

  // 性能公式参数
  private instructionCount: number = 1000;
  private cpi: number = 1.5;
  private clockCycle: number = 1.0; // ns

  // 3D对象
  private formulaGroup: THREE.Group;
  private barGraph: THREE.Group;
  private animationClock: THREE.Clock;

  constructor(container: HTMLElement) {
    this.container = container;
    this.animationClock = new THREE.Clock();

    this.initializeScene();
    this.createFormulaVisualization();
    this.createBarGraph();
    this.setupLighting();
    this.setupCamera();
  }

  private initializeScene(): void {
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a0a);
    this.scene.fog = new THREE.Fog(0x0a0a0a, 10, 100);

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 5, 15);

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);

    // 添加轨道控制器
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.set(0, 0, 0);

    // 初始隐藏
    this.renderer.domElement.style.display = 'none';
  }

  private createFormulaVisualization(): void {
    this.formulaGroup = new THREE.Group();

    // 创建公式的各个部分
    const parts = [
      { text: '指令数', value: this.instructionCount, color: 0x4285f4, position: new THREE.Vector3(-6, 3, 0) },
      { text: '×', value: null, color: 0xffffff, position: new THREE.Vector3(-3, 3, 0) },
      { text: 'CPI', value: this.cpi, color: 0x34a853, position: new THREE.Vector3(0, 3, 0) },
      { text: '×', value: null, color: 0xffffff, position: new THREE.Vector3(3, 3, 0) },
      { text: '时钟周期', value: this.clockCycle, color: 0xfbbc04, position: new THREE.Vector3(6, 3, 0) }
    ];

    parts.forEach(part => {
      // 创建3D文本或数值盒子
      const boxGeometry = new THREE.BoxGeometry(2, 1, 0.5);
      const boxMaterial = new THREE.MeshPhongMaterial({
        color: part.color,
        emissive: part.color,
        emissiveIntensity: 0.2
      });
      const box = new THREE.Mesh(boxGeometry, boxMaterial);
      box.position.copy(part.position);
      box.castShadow = true;
      box.receiveShadow = true;

      // 添加文本标签
      const canvas = this.createTextCanvas(part.text, part.value);
      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(2, 1, 1);
      sprite.position.copy(part.position);
      sprite.position.z = 1;

      this.formulaGroup.add(box);
      this.formulaGroup.add(sprite);
    });

    // 添加等号和结果
    this.createResultDisplay();

    this.scene.add(this.formulaGroup);
  }

  private createTextCanvas(text: string, value: number | null): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 256;
    canvas.height = 128;

    context.fillStyle = 'white';
    context.font = 'bold 24px Arial';
    context.textAlign = 'center';
    context.fillText(text, 128, 50);

    if (value !== null) {
      context.font = '20px Arial';
      context.fillText(value.toString(), 128, 80);
    }

    return canvas;
  }

  private createResultDisplay(): void {
    // 等号
    const equalSign = this.create3DText('=', 0xffffff);
    equalSign.position.set(-2, 0, 0);
    this.formulaGroup.add(equalSign);

    // 结果盒子
    const resultGeometry = new THREE.BoxGeometry(4, 1.5, 0.5);
    const resultMaterial = new THREE.MeshPhongMaterial({
      color: 0xff4081,
      emissive: 0xff4081,
      emissiveIntensity: 0.3
    });
    const resultBox = new THREE.Mesh(resultGeometry, resultMaterial);
    resultBox.position.set(2, 0, 0);
    resultBox.castShadow = true;
    resultBox.name = 'resultBox';

    this.formulaGroup.add(resultBox);

    // 结果文本
    this.updateResultDisplay();
  }

  private create3DText(text: string, color: number): THREE.Sprite {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 128;
    canvas.height = 128;

    context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    context.font = 'bold 64px Arial';
    context.textAlign = 'center';
    context.fillText(text, 64, 80);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(1, 1, 1);

    return sprite;
  }

  private createBarGraph(): void {
    this.barGraph = new THREE.Group();
    this.barGraph.position.set(0, -3, 0);

    // 创建三个柱状图表示各个参数的贡献
    const bars = [
      { label: '指令数', height: this.instructionCount / 1000, color: 0x4285f4, x: -4 },
      { label: 'CPI', height: this.cpi * 2, color: 0x34a853, x: 0 },
      { label: '时钟周期', height: this.clockCycle * 2, color: 0xfbbc04, x: 4 }
    ];

    bars.forEach(bar => {
      const geometry = new THREE.CylinderGeometry(0.8, 0.8, bar.height, 32);
      const material = new THREE.MeshPhongMaterial({
        color: bar.color,
        emissive: bar.color,
        emissiveIntensity: 0.1
      });
      const cylinder = new THREE.Mesh(geometry, material);
      cylinder.position.set(bar.x, bar.height / 2 - 2, 0);
      cylinder.castShadow = true;
      cylinder.name = `bar_${bar.label}`;

      this.barGraph.add(cylinder);

      // 添加标签
      const labelCanvas = this.createTextCanvas(bar.label, null);
      const labelTexture = new THREE.CanvasTexture(labelCanvas);
      const labelMaterial = new THREE.SpriteMaterial({ map: labelTexture });
      const labelSprite = new THREE.Sprite(labelMaterial);
      labelSprite.scale.set(1.5, 0.75, 1);
      labelSprite.position.set(bar.x, -2.5, 0);

      this.barGraph.add(labelSprite);
    });

    // 添加基座
    const baseGeometry = new THREE.BoxGeometry(12, 0.2, 4);
    const baseMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = -2;
    base.receiveShadow = true;

    this.barGraph.add(base);
    this.scene.add(this.barGraph);
  }

  private setupLighting(): void {
    // 环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    this.scene.add(ambientLight);

    // 主光源
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    // 点光源（动态效果）
    const pointLight1 = new THREE.PointLight(0x4285f4, 0.5, 20);
    pointLight1.position.set(-5, 5, 5);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xfbbc04, 0.5, 20);
    pointLight2.position.set(5, 5, 5);
    this.scene.add(pointLight2);
  }

  private setupCamera(): void {
    this.camera.lookAt(0, 0, 0);
    this.controls.update();
  }

  public updateParameters(instructionCount: number, cpi: number, clockCycle: number): void {
    this.instructionCount = instructionCount;
    this.cpi = cpi;
    this.clockCycle = clockCycle;

    // 更新柱状图高度
    this.updateBarGraph();
    
    // 更新结果显示
    this.updateResultDisplay();
    
    // 更新公式数值显示
    this.updateFormulaDisplay();
  }

  private updateBarGraph(): void {
    const bars = this.barGraph.children.filter(child => child.name.startsWith('bar_'));
    
    // 更新指令数柱子
    const instructionBar = bars.find(bar => bar.name === 'bar_指令数') as THREE.Mesh;
    if (instructionBar) {
      const newHeight = this.instructionCount / 500;
      instructionBar.scale.y = newHeight / 2;
      instructionBar.position.y = newHeight / 2 - 2;
    }

    // 更新CPI柱子
    const cpiBar = bars.find(bar => bar.name === 'bar_CPI') as THREE.Mesh;
    if (cpiBar) {
      const newHeight = this.cpi * 2;
      cpiBar.scale.y = newHeight / 3;
      cpiBar.position.y = newHeight / 2 - 2;
    }

    // 更新时钟周期柱子
    const clockBar = bars.find(bar => bar.name === 'bar_时钟周期') as THREE.Mesh;
    if (clockBar) {
      const newHeight = this.clockCycle * 2;
      clockBar.scale.y = newHeight / 2;
      clockBar.position.y = newHeight / 2 - 2;
    }
  }

  private updateResultDisplay(): void {
    const executionTime = this.instructionCount * this.cpi * this.clockCycle;
    
    // 更新结果盒子的颜色强度
    const resultBox = this.formulaGroup.getObjectByName('resultBox') as THREE.Mesh;
    if (resultBox) {
      const material = resultBox.material as THREE.MeshPhongMaterial;
      material.emissiveIntensity = Math.min(0.5, executionTime / 10000);
    }

    // 创建或更新结果文本
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 512;
    canvas.height = 256;

    context.fillStyle = 'white';
    context.font = 'bold 32px Arial';
    context.textAlign = 'center';
    context.fillText('执行时间', 256, 80);
    context.font = '28px Arial';
    context.fillText(`${executionTime.toFixed(2)} ns`, 256, 130);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    
    // 移除旧的结果精灵
    const oldSprite = this.formulaGroup.getObjectByName('resultSprite');
    if (oldSprite) {
      this.formulaGroup.remove(oldSprite);
    }

    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(4, 2, 1);
    sprite.position.set(2, 0, 1);
    sprite.name = 'resultSprite';
    
    this.formulaGroup.add(sprite);
  }

  private updateFormulaDisplay(): void {
    // 更新公式中的数值
    // 这部分可以通过更新sprite材质来实现
  }

  public update(): void {
    const delta = this.animationClock.getDelta();
    
    // 旋转公式组
    this.formulaGroup.rotation.y = Math.sin(this.animationClock.getElapsedTime() * 0.5) * 0.1;
    
    // 柱状图动画
    this.barGraph.children.forEach((child, index) => {
      if (child.name.startsWith('bar_')) {
        child.rotation.y += delta * 0.5;
      }
    });

    // 更新控制器
    this.controls.update();

    // 渲染场景
    this.renderer.render(this.scene, this.camera);
  }

  public onResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public show(): void {
    this.renderer.domElement.style.display = 'block';
  }

  public hide(): void {
    this.renderer.domElement.style.display = 'none';
  }

  public dispose(): void {
    this.controls.dispose();
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}
