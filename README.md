# Kedro Builder

**Visual Pipeline Builder for Kedro Projects**

A standalone web application that enables users with minimal coding experience to visually build Kedro data science pipelines using drag-and-drop, configure nodes and datasets through intuitive forms, and generate valid Kedro project code automatically.

## 🚀 Features

- 🎨 **Visual Pipeline Building** - Drag-and-drop interface for creating Kedro pipelines
- 🔧 **No-Code Configuration** - Configure nodes and datasets through forms (no YAML editing)
- 📦 **Code Generation** - Automatically generate valid Kedro project code
- ⬇️ **Downloadable Projects** - Download complete, runnable Kedro projects as ZIP files
- 📚 **Interactive Tutorials** - Learn Kedro concepts through guided walkthroughs
- 🌗 **Theme Support** - Light and dark themes with Kedro-Viz styling

## 🏗️ Technology Stack

- **React 18** with **TypeScript** (strict mode)
- **Redux Toolkit** for state management
- **ReactFlow** for visual pipeline canvas
- **Radix UI** - Accessible components
- **Lucide React** - Icons
- **SCSS Modules** with Kedro-Viz styling

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ (18.20.1 or higher)
- npm 10+

### Installation

\`\`\`bash
# Install dependencies
npm install

# Start development server
npm run dev
\`\`\`

The application will be available at [http://localhost:5173/](http://localhost:5173/)

## 📁 Project Status

### ✅ Phase 1: Foundation (COMPLETE)
- TypeScript setup with strict mode
- Redux Toolkit store with typed hooks
- SCSS with Kedro-Viz styling
- Basic three-panel layout
- Theme switching (light/dark)
- All core type definitions

See [PHASE_1_COMPLETE.md](./PHASE_1_COMPLETE.md) for details.

### 🔄 Next: Phase 2 - ReactFlow Canvas Setup
- ReactFlow integration
- Custom node components
- Drag-and-drop from sidebar
- Minimap and controls

See [UPDATED_IMPLEMENTATION_PLAN.md](../UPDATED_IMPLEMENTATION_PLAN.md) for full roadmap.

## 🎨 Development

\`\`\`bash
npm run dev          # Start dev server with HMR
npm run build        # Build for production
npm run preview      # Preview production build
\`\`\`

---

**Built with ❤️ for the Kedro community**
