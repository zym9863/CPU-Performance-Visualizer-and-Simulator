# CPU Performance Visualizer and Simulator

[中文](README.md) | **English**

An interactive web-based CPU performance visualization tool that helps understand processor architecture, pipeline technology, and performance evaluation.

## 🎯 Features

### 🔧 Dual Visualization Modes
- **Pipeline Mode**: Real-time display of CPU instruction pipeline execution
- **Performance Formula Mode**: Intuitive calculation and display of CPU performance metrics

### 📊 Core Functions
- **3D Visualization**: Three.js-powered 3D pipeline visualization
- **Real-time Simulation**: Dynamic instruction loading and execution simulation
- **Performance Analysis**: Real-time calculation of IPC, throughput, pipeline efficiency and other key metrics
- **Interactive Controls**: Play/Pause/Reset/Step execution controls
- **Parameter Adjustment**: Adjustable clock frequency, simulation speed and other parameters

### 📈 Performance Metrics
- Current execution cycles
- Completed instruction count
- IPC (Instructions Per Cycle)
- Throughput calculation
- Pipeline efficiency analysis
- Stall cycles statistics

## 🛠 Technology Stack

- **Frontend Framework**: Vite + TypeScript
- **3D Graphics**: Three.js
- **Styling**: SCSS
- **Build Tool**: Vite
- **Type Support**: TypeScript 5.8

## 📦 Project Structure

```
src/
├── core/                   # Core logic
│   └── CPUSimulator.ts    # CPU simulator
├── visualization/         # Visualization modules
│   ├── PipelineVisualizer.ts    # Pipeline visualization
│   └── PerformanceVisualizer.ts # Performance visualization
├── utils/                 # Utilities
│   └── UIController.ts    # UI controller
├── types/                 # Type definitions
│   └── index.ts
├── styles/                # Style files
│   └── main.scss
└── main.ts                # Application entry
```

## 🚀 Quick Start

### Install Dependencies
```bash
npm install
# or
yarn install
# or
pnpm install
```

### Development Environment
```bash
npm run dev
```
Visit `http://localhost:5173` to start exploring

### Build for Production
```bash
npm run build
```

### Preview Build
```bash
npm run preview
```

## 🎮 Usage Guide

### Pipeline Mode
1. Enter assembly instruction sequences in the input box (one per line)
2. Click "Load Instructions" button
3. Adjust clock frequency and simulation speed
4. Use control buttons to start/pause/reset simulation
5. Observe 3D pipeline visualization and real-time performance statistics

### Performance Formula Mode
1. Adjust parameters like instruction count, CPI, clock cycle
2. View real-time performance calculation results
3. Analyze metrics like execution time, frequency, MIPS

### Supported Instruction Types
- `ADD R1, R2, R3` - Addition operation
- `SUB R4, R1, R5` - Subtraction operation
- `MUL R6, R7, R8` - Multiplication operation
- More instruction types can be added through extension

## 🎓 Educational Value

This tool is perfect for:
- Computer Organization course teaching
- Processor architecture learning
- Performance optimization concept understanding
- Pipeline technology demonstration
- CPU design principle visualization

## 🔧 Configuration Options

### Pipeline Parameters
- Clock Frequency: 100-5000 MHz
- Simulation Speed: 0.1x-3.0x
- Support for step execution and continuous execution

### Performance Parameters
- Instruction Count: 100-10000
- CPI: 0.5-5.0
- Clock Cycle: 0.1-10.0 ns

## 🚧 Development Roadmap

- [ ] Support more instruction types
- [ ] Add cache simulation
- [ ] Implement branch prediction visualization
- [ ] Support multi-core processor simulation
- [ ] Add performance comparison features
- [ ] Export analysis reports

## 🤝 Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

## 📞 Contact

If you have any questions or suggestions, please contact us through:
- Submit an Issue
- Start a Discussion
- Contact project maintainers

---

⭐ If this project helps you, please give it a star!