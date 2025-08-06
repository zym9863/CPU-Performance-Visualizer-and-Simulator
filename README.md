# CPU 性能可视化模拟器

**中文** | [English](README_EN.md)

一个基于 Web 的交互式 CPU 性能可视化工具，帮助理解处理器架构、流水线技术和性能评估。

## 🎯 项目特性

### 🔧 双重可视化模式
- **流水线模式**: 实时展示CPU指令流水线的执行过程
- **性能公式模式**: 直观计算和展示CPU性能指标

### 📊 核心功能
- **3D可视化**: 使用 Three.js 实现的立体流水线展示
- **实时模拟**: 支持动态指令加载和执行模拟
- **性能分析**: 实时计算IPC、吞吐率、流水线效率等关键指标
- **交互控制**: 播放/暂停/重置/单步执行控制
- **参数调节**: 可调节时钟频率、模拟速度等参数

### 📈 性能指标
- 当前执行周期数
- 已完成指令数
- IPC (Instructions Per Cycle)
- 吞吐率计算
- 流水线效率分析
- 停顿周期统计

## 🛠 技术栈

- **前端框架**: Vite + TypeScript
- **3D图形**: Three.js
- **样式**: SCSS
- **构建工具**: Vite
- **类型支持**: TypeScript 5.8

## 📦 项目结构

```
src/
├── core/                   # 核心逻辑
│   └── CPUSimulator.ts    # CPU模拟器
├── visualization/         # 可视化模块
│   ├── PipelineVisualizer.ts    # 流水线可视化
│   └── PerformanceVisualizer.ts # 性能可视化
├── utils/                 # 工具类
│   └── UIController.ts    # UI控制器
├── types/                 # 类型定义
│   └── index.ts
├── styles/                # 样式文件
│   └── main.scss
└── main.ts                # 应用入口
```

## 🚀 快速开始

### 安装依赖
```bash
npm install
# 或
yarn install
# 或
pnpm install
```

### 开发环境
```bash
npm run dev
```
访问 `http://localhost:5173` 开始体验

### 构建生产版本
```bash
npm run build
```

### 预览构建结果
```bash
npm run preview
```

## 🎮 使用指南

### 流水线模式
1. 在指令输入框中输入汇编指令序列（每行一条）
2. 点击"加载指令"按钮
3. 调节时钟频率和模拟速度
4. 使用控制按钮开始/暂停/重置模拟
5. 观察3D流水线可视化和实时性能统计

### 性能公式模式
1. 调节指令数、CPI、时钟周期等参数
2. 实时查看性能计算结果
3. 分析执行时间、主频、MIPS等指标

### 支持的指令类型
- `ADD R1, R2, R3` - 加法运算
- `SUB R4, R1, R5` - 减法运算
- `MUL R6, R7, R8` - 乘法运算
- 更多指令类型可通过扩展添加

## 🎓 教育价值

这个工具非常适合：
- 计算机组成原理课程教学
- 处理器架构学习
- 性能优化概念理解
- 流水线技术演示
- CPU设计原理可视化

## 🔧 配置选项

### 流水线参数
- 时钟频率: 100-5000 MHz
- 模拟速度: 0.1x-3.0x
- 支持单步执行和连续执行

### 性能参数
- 指令数: 100-10000
- CPI: 0.5-5.0
- 时钟周期: 0.1-10.0 ns

## 🚧 开发计划

- [ ] 支持更多指令类型
- [ ] 添加缓存模拟
- [ ] 实现分支预测可视化
- [ ] 支持多核处理器模拟
- [ ] 添加性能对比功能
- [ ] 导出分析报告

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 📞 联系方式

如果您有任何问题或建议，请通过以下方式联系：
- 提交 Issue
- 发起 Discussion
- 联系项目维护者

---

⭐ 如果这个项目对您有帮助，请给它一个星标！