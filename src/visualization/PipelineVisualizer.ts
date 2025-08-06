import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CPUSimulator } from '../core/CPUSimulator';
import { PipelineStage, PipelineState, Instruction, HazardType } from '../types';

export class PipelineVisualizer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private container: HTMLElement;
  private cpuSimulator: CPUSimulator;

  // 流水线阶段的3D对象
  private pipelineStages: Map<PipelineStage, THREE.Group> = new Map();
  private instructionObjects: Map<string, THREE.Mesh> = new Map();
  private animationMixers: THREE.AnimationMixer[] = [];

  // 颜色方案
  private colors = {
    stages: {
      IF: 0x4285f4,   // 蓝色
      ID: 0x34a853,   // 绿色
      EX: 0xfbbc04,   // 黄色
      MEM: 0xea4335,  // 红色
      WB: 0x9c27b0    // 紫色
    },
    instruction: {
      ALU: 0x00bcd4,
      LOAD: 0xff9800,
      STORE: 0xff5722,
      BRANCH: 0x795548,
      NOP: 0x9e9e9e
    },
    hazard: {
      DATA: 0xff0000,
      STRUCTURAL: 0xffa500,
      CONTROL: 0xffff00
    }
  };

  constructor(container: HTMLElement, cpuSimulator: CPUSimulator) {
    this.container = container;
    this.cpuSimulator = cpuSimulator;

    this.initializeScene();
    this.createPipeline();
    this.setupLighting();
    this.setupCamera();
  }

  private initializeScene(): void {
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);
    this.scene.fog = new THREE.Fog(0x1a1a2e, 10, 50);

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 10, 20);

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // 添加轨道控制器
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.set(0, 0, 0);
  }

  private createPipeline(): void {
    const stages = [PipelineStage.IF, PipelineStage.ID, PipelineStage.EX, PipelineStage.MEM, PipelineStage.WB];
    const stageWidth = 4;
    const stageHeight = 3;
    const stageDepth = 3;
    const spacing = 1;

    stages.forEach((stage, index) => {
      const group = new THREE.Group();
      
      // 创建阶段盒子
      const geometry = new THREE.BoxGeometry(stageWidth, stageHeight, stageDepth);
      const material = new THREE.MeshPhongMaterial({
        color: this.colors.stages[stage],
        transparent: true,
        opacity: 0.7
      });
      const box = new THREE.Mesh(geometry, material);
      box.castShadow = true;
      box.receiveShadow = true;
      
      // 添加边框
      const edges = new THREE.EdgesGeometry(geometry);
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
      const wireframe = new THREE.LineSegments(edges, lineMaterial);
      box.add(wireframe);

      // 添加文字标签
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.width = 256;
      canvas.height = 128;
      context.fillStyle = 'white';
      context.font = 'bold 48px Arial';
      context.textAlign = 'center';
      context.fillText(stage, 128, 64);

      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(2, 1, 1);
      sprite.position.y = 2;

      group.add(box);
      group.add(sprite);
      group.position.x = index * (stageWidth + spacing) - (stages.length - 1) * (stageWidth + spacing) / 2;
      
      this.pipelineStages.set(stage, group);
      this.scene.add(group);
    });

    // 添加连接管道
    this.createConnections();
  }

  private createConnections(): void {
    const stages = Array.from(this.pipelineStages.values());
    
    for (let i = 0; i < stages.length - 1; i++) {
      const start = stages[i].position;
      const end = stages[i + 1].position;
      
      const geometry = new THREE.CylinderGeometry(0.2, 0.2, 
        Math.abs(end.x - start.x) - 3.5, 8);
      const material = new THREE.MeshPhongMaterial({ 
        color: 0x666666,
        emissive: 0x222222
      });
      const pipe = new THREE.Mesh(geometry, material);
      
      pipe.rotation.z = Math.PI / 2;
      pipe.position.x = (start.x + end.x) / 2;
      pipe.position.y = 0;
      pipe.castShadow = true;
      
      this.scene.add(pipe);
    }
  }

  private setupLighting(): void {
    // 环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    // 主光源
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    this.scene.add(directionalLight);

    // 点光源
    const pointLight = new THREE.PointLight(0xffffff, 0.5, 100);
    pointLight.position.set(0, 10, 0);
    this.scene.add(pointLight);
  }

  private setupCamera(): void {
    this.camera.lookAt(0, 0, 0);
    this.controls.update();
  }

  // 创建指令对象
  private createInstructionObject(instruction: Instruction): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(0.5, 16, 16);
    const material = new THREE.MeshPhongMaterial({
      color: this.colors.instruction[instruction.type],
      emissive: this.colors.instruction[instruction.type],
      emissiveIntensity: 0.2
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    
    // 添加发光效果
    const glowGeometry = new THREE.SphereGeometry(0.6, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: this.colors.instruction[instruction.type],
      transparent: true,
      opacity: 0.3
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    mesh.add(glow);
    
    return mesh;
  }

  // 更新可视化
  public update(): void {
    // 更新控制器
    this.controls.update();

    // 获取流水线状态
    const pipelineStates = this.cpuSimulator.getPipelineStates();
    
    // 更新每个阶段的可视化
    pipelineStates.forEach(state => {
      this.updateStageVisualization(state);
    });

    // 更新动画
    this.animationMixers.forEach(mixer => {
      mixer.update(0.016); // 60 FPS
    });

    // 渲染场景
    this.renderer.render(this.scene, this.camera);
  }

  private updateStageVisualization(state: PipelineState): void {
    const stageGroup = this.pipelineStages.get(state.stage);
    if (!stageGroup) return;

    const box = stageGroup.children[0] as THREE.Mesh;
    
    // 更新阶段颜色（根据是否有停顿）
    if (state.stalled && state.hazard) {
      (box.material as THREE.MeshPhongMaterial).color.setHex(this.colors.hazard[state.hazard]);
      (box.material as THREE.MeshPhongMaterial).emissive = new THREE.Color(this.colors.hazard[state.hazard]);
      (box.material as THREE.MeshPhongMaterial).emissiveIntensity = 0.5;
    } else {
      (box.material as THREE.MeshPhongMaterial).color.setHex(this.colors.stages[state.stage]);
      (box.material as THREE.MeshPhongMaterial).emissiveIntensity = 0;
    }

    // 处理指令对象
    if (state.instruction) {
      let instructionMesh = this.instructionObjects.get(state.instruction.id);
      
      if (!instructionMesh) {
        // 创建新的指令对象
        instructionMesh = this.createInstructionObject(state.instruction);
        this.instructionObjects.set(state.instruction.id, instructionMesh);
        this.scene.add(instructionMesh);
      }

      // 更新指令位置（平滑移动）
      const targetPosition = stageGroup.position.clone();
      targetPosition.y = 0;
      
      instructionMesh.position.lerp(targetPosition, 0.1);
      
      // 添加旋转动画
      instructionMesh.rotation.y += 0.02;
      
      // 如果指令在WB阶段完成，添加消失动画
      if (state.stage === PipelineStage.WB && !state.stalled) {
        this.fadeOutInstruction(state.instruction.id);
      }
    }
  }

  private fadeOutInstruction(instructionId: string): void {
    const mesh = this.instructionObjects.get(instructionId);
    if (!mesh) return;

    // 创建消失动画
    const material = mesh.material as THREE.MeshPhongMaterial;
    const fadeOut = setInterval(() => {
      material.opacity -= 0.05;
      if (material.opacity <= 0) {
        clearInterval(fadeOut);
        this.scene.remove(mesh);
        this.instructionObjects.delete(instructionId);
      }
    }, 50);
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
