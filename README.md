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

### ✅ Core Features (COMPLETE)
- ✅ Visual pipeline building with ReactFlow
- ✅ Node and dataset configuration panels
- ✅ Connection management
- ✅ Validation system
- ✅ Kedro project code generation
- ✅ Export to ZIP download
- ✅ Interactive tutorial system
- ✅ Theme switching (light/dark)

### ✅ Phase 1: UX Improvements (COMPLETE - 2025-01-23)
**Critical canvas interaction and workflow improvements:**
- ✅ Spacebar + drag pan mode (like Figma)
- ✅ Improved connection selection (20px hitbox + hover state)
- ✅ Multi-select delete confirmations
- ✅ Auto-show config panel when dropping components
- ✅ Auto-close config panel when canvas is empty

See [PHASE_1_UX_IMPROVEMENTS.md](./PHASE_1_UX_IMPROVEMENTS.md) for complete details.

### 🔄 Next: Phase 2 - Tutorial & UI Polish
- Tutorial navigation (back button, pagination alignment)
- Tutorial mode protection
- Component palette reordering
- Empty state cleanup
- Dataset filepath UX improvements

See documentation files for implementation history and roadmap.

## 🎨 Development

\`\`\`bash
npm run dev          # Start dev server with HMR
npm run build        # Build for production
npm run preview      # Preview production build
\`\`\`

---

**Built with ❤️ for the Kedro community**
