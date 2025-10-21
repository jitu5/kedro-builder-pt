# Essential Context for Kedro Builder - Current State

## Project Status
- **Completed:** Phases 1-5 (Core Builder + UX + localStorage Persistence)
- **Latest Session:** Bug fixes (duplicate connections), theme persistence, UI improvements
- **Current:** All working features tested and stable
- **Dev Server:** http://localhost:5179/ (running, no errors)
- **Stack:** Vite 5.4.8, React 18, TypeScript (strict), Node 18.20.1
- **Last Updated:** 2025-10-17 (Session: Phase 5 Complete + Bug Fixes)
- **Documentation:** See PROJECT_ARCHITECTURE.md for comprehensive overview
- **Context Status:** 60% used, ready for Phase 6

## Core Dependencies
```json
{
  "@reduxjs/toolkit": "^2.5.0",
  "@xyflow/react": "^12.3.6",
  "react-hook-form": "^7.54.2",
  "@radix-ui/react-dialog": "^1.1.4",
  "@radix-ui/react-dropdown-menu": "^2.1.4",
  "@radix-ui/react-tooltip": "^1.1.6",
  "lucide-react": "^0.469.0",
  "classnames": "^2.5.1"
}
```

## Key Architecture Decisions
1. **Handles:** Top/bottom (NOT left/right) - vertical flow
2. **UI Components:** Hybrid - Custom Button/Input + Radix for Dialog/Dropdown/Tooltip
3. **Styling:** SCSS with BEM naming, CSS custom properties for theming
4. **Forms:** React Hook Form (no input/output fields in NodeConfigForm)
5. **Validation:** Only on generate/compile button (not real-time)
6. **ID Prefixes:** `node-*` for nodes, `dataset-*` for datasets

## Redux Store Structure
```typescript
{
  project: {
    current: KedroProject | null,  // { id, name, description, pythonPackage, pipelineName, createdAt, updatedAt }
    savedList: ProjectMetadata[],
    lastSaved: number | null
  }
  nodes: { byId: {}, allIds: [], selected: [] }  // Array for multi-select
  datasets: { byId: {}, allIds: [], selected: null }
  connections: { byId: {}, allIds: [], selected: [] }  // Array for multi-select
  ui: {
    showConfigPanel,
    selectedComponent,
    showTutorial,              // Tutorial modal state
    tutorialStep,              // Current step (0-4)
    tutorialCompleted,         // Persisted to localStorage
    showWalkthrough,           // Walkthrough overlay state
    walkthroughStep,           // Current step (1-4)
    walkthroughCompleted,      // Persisted to localStorage
    showProjectSetup,          // Project setup modal state
    hasActiveProject           // Track if project has been created
  }
  validation: { errors: [], warnings: [], isValidating }
  theme: { current: 'light' | 'dark' }
}
```

## Critical Type Definitions
```typescript
type NodeType = 'data_ingestion' | 'data_processing' | 'model_training' | 'model_evaluation' | 'custom';
type DatasetType = 'csv' | 'parquet' | 'json' | 'excel' | 'pickle' | 'memory' | 'sql';
type DataLayer = '01_raw' | '02_intermediate' | '03_primary' | '04_feature' | '05_model_input' | '06_models' | '07_model_output' | '08_reporting';

// KedroProject - Core project metadata
interface KedroProject {
  id: string;                    // "project-{timestamp}"
  name: string;                  // "my-first-project" (kebab-case)
  description: string;           // User-provided description
  pythonPackage: string;         // "my_first_project" (snake_case for Python imports)
  pipelineName: string;          // "__default__" or custom pipeline name
  createdAt: number;             // Timestamp
  updatedAt: number;             // Timestamp
}

interface KedroNode {
  id: string;
  name: string;
  type: NodeType;
  inputs: string[];
  outputs: string[];
  functionCode?: string;
  description?: string;
  position: { x: number; y: number };
}

interface KedroDataset {
  id: string;
  name: string;
  type: DatasetType;
  filepath?: string;
  layer?: DataLayer;
  position: { x: number; y: number };  // IMPORTANT: Added for canvas
}
```

## Project Structure
```
src/
├── components/
│   ├── App/                    # Main layout + header buttons
│   ├── Canvas/
│   │   ├── PipelineCanvas.tsx  # Main canvas (tracks drag state for EmptyState)
│   │   ├── CustomNode/         # Processing nodes (top/bottom handles)
│   │   ├── DatasetNode/        # Dataset visualization
│   │   ├── CustomEdge/
│   │   ├── EmptyState/         # Welcome screen + drag feedback
│   │   ├── BulkActionsToolbar/ # Multi-select actions
│   │   └── EdgeContextMenu/    # Right-click menu
│   ├── Palette/
│   │   ├── ComponentPalette.tsx
│   │   ├── NodeCard/           # Draggable nodes
│   │   └── DatasetCard/        # Draggable datasets
│   ├── ConfigPanel/
│   │   ├── NodeConfigForm/     # Name, Description, Code only
│   │   └── DatasetConfigForm/
│   ├── Tutorial/
│   │   ├── TutorialModal.tsx   # 5-step onboarding
│   │   └── tutorialContent.ts  # Step definitions
│   ├── Walkthrough/
│   │   ├── WalkthroughOverlay.tsx  # 4-step interactive guide
│   │   └── walkthroughContent.ts   # Step definitions with spotlight
│   ├── ProjectSetup/
│   │   └── ProjectSetupModal.tsx   # Project creation form
│   └── UI/                     # Button, Input, ThemeToggle
├── features/                   # Redux slices
├── store/
└── types/
```

## Recent Implementation (Critical Patterns)

### Tutorial System
- **localStorage Key:** `kedro_builder_tutorial_completed`
- **5 Steps:** Welcome → Datasets → Nodes → Connections → Generate
- **Icons:** Sparkles, Database, FunctionSquare, GitBranch, FolderTree
- **Auto-show:** On first visit, reopenable via header button

### Walkthrough System (Phase 4.5)
- **localStorage Key:** `kedro_builder_walkthrough_completed`
- **4 Steps:** Interactive guide with spotlight circles
  1. Sidebar → Spotlight on palette header (right)
  2. Drag & Drop → Spotlight on first node card (right)
  3. Connect Components → Spotlight on canvas (bottom)
  4. Project Setup → Spotlight on "Create New Project" button (top)
- **Z-Index Hierarchy:** Overlay: 99999, Spotlight: 99999, Tooltip/Modal: 100000
- **Theme Support:** Uses CSS variables (var(--color-bg-2), var(--color-text))
- **Spotlight Style:** Circular (max 150px), Kedro yellow (#ffb800), no shadow/backdrop
- **Data Attributes:** `data-walkthrough="target-id"` for element targeting
- **Viewport Detection:** Tooltip positioning adjusts to stay within screen bounds

### Empty State + Drag Feedback
- **Pattern:** PipelineCanvas tracks `isDraggingOver` state, passes to EmptyState
- **CSS:** `pointer-events: none` on EmptyState to allow drops through
- **Visual:** Pulsing blue dashed border appears on drag hover
- **Reset:** `isDraggingOver` reset to false on drop/dragLeave
- **Z-Index:** EmptyState z-index: 1 (below walkthrough)

### Project Setup Modal (Phase 5 Update)
- **Validation:** Real-time validation for project name (removed directory field)
- **Pattern:** Alphanumeric, hyphens, underscores only (no spaces)
- **Fields:** Name (required) + Description (optional)
- **Auto-generated:** Project ID (`project-${timestamp}`), createdAt, updatedAt
- **Keyboard:** Enter to submit, Escape to cancel
- **Theme Support:** CSS variables for colors

### localStorage Persistence System (Phase 5 - NEW)
- **Storage Keys:**
  - `kedro_builder_current_project` - Project + pipeline state
  - `kedro_builder_theme` - Theme preference (light/dark)
  - `kedro_builder_tutorial_completed` - Tutorial completion
  - `kedro_builder_walkthrough_completed` - Walkthrough completion
- **Auto-save:** Debounced 500ms after any state change
- **Auto-load:** On app start, loads saved project into Redux
- **Middleware:** Custom Redux middleware triggers saves on specific actions
- **Data Structure:**
  ```typescript
  {
    project: { id, name, description, pythonPackage, pipelineName, createdAt, updatedAt },
    nodes: KedroNode[],
    datasets: KedroDataset[],
    connections: KedroConnection[]
  }
  ```
- **Size Capacity:** 5MB browser limit = ~5,000-10,000 nodes (sufficient for any realistic pipeline)
- **Utility Functions:** `saveProjectToLocalStorage()`, `loadProjectFromLocalStorage()`, `clearProjectFromLocalStorage()`
- **New Project:** "New Project" button clears Redux + localStorage, confirms before clearing
- **Theme Persistence:** Saves immediately on theme change, loads on app start
- **Benefits:** No work lost on refresh, instant persistence, works offline

### Recent Bug Fixes & Improvements (Latest Session)
1. **Duplicate Connections Fixed:** Added duplicate check in `addConnection` to prevent same ID in `allIds`
2. **useEffect Dependency Fixed:** Changed from `[dispatch]` to `[]` to prevent multiple loads
3. **State Clearing on Load:** Clear existing state before loading from localStorage
4. **Theme Persistence:** Theme now saves to localStorage and loads on app start
5. **EmptyState Display Fix:** Added `setHasActiveProject(true)` after project creation
6. **UI Improvement:** Moved "New Project" button to header left (between logo and project name)
7. **Divider Visibility:** Updated divider to use `var(--color-text-alt)` for both themes

### Previous Bug Fixes (Earlier Phases)
1. **Dataset Position Updates:** Added `updateDatasetPosition` action, ID-based routing
2. **Edge Clicking:** 20px transparent stroke in CSS, 3px visual stroke
3. **Delete Key:** Loop IDs, check prefix, dispatch correct action
4. **Right-Click Menu:** Proper EdgeMouseHandler typing
5. **Walkthrough Z-Index:** Increased to 99999/100000 to appear above all content
6. **Circular Spotlight:** Use max dimension for both width/height
7. **Theme-Aware Colors:** Changed hardcoded colors to CSS variables

## Critical Code Patterns

### Position Update (IMPORTANT)
```typescript
// In PipelineCanvas handleNodesChange
if (change.id.startsWith('node-')) {
  dispatch(updateNodePosition({ id, position }));
} else if (change.id.startsWith('dataset-')) {
  dispatch(updateDatasetPosition({ id, position }));
}
```

### Delete Handler (IMPORTANT)
```typescript
selectedNodeIds.forEach((id) => {
  if (id.startsWith('node-')) {
    dispatch(deleteNodes([id]));
  } else if (id.startsWith('dataset-')) {
    dispatch(deleteDataset(id));
  }
});
```

### Edge CSS (IMPORTANT)
```scss
.react-flow__edge {
  path:first-child {
    stroke: transparent;
    stroke-width: 20px; // Wide click area
  }
  &-path {
    stroke-width: 3px; // Visual stroke
  }
}
```

### Walkthrough Spotlight Positioning (IMPORTANT)
```typescript
// Calculate circular spotlight (max 150px)
const diameter = Math.min(Math.max(rect.width, rect.height) + 10, 150);

setCirclePosition({
  x: rect.left + rect.width / 2,
  y: rect.top + rect.height / 2,
  width: diameter,
  height: diameter,
});
```

### Data Attribute Targeting (IMPORTANT)
```tsx
// Target elements for walkthrough spotlight
<div data-walkthrough="palette-header">...</div>
<button data-walkthrough="create-project-button">...</button>

// In WalkthroughOverlay
const targetElement = document.querySelector(`[data-walkthrough="${step.target}"]`);
```

### Z-Index Hierarchy (IMPORTANT)
```scss
// EmptyState
.empty-state { z-index: 1; }

// Walkthrough Overlay
.walkthrough-overlay { z-index: 99999; }
.walkthrough-overlay__spotlight { z-index: 99999; }
.walkthrough-overlay__tooltip { z-index: 100000; }
.walkthrough-overlay__modal { z-index: 100000; }
```

### localStorage Auto-save Pattern (Phase 5 - IMPORTANT)
```typescript
// Auto-save middleware (src/store/middleware/autoSaveMiddleware.ts)
const SAVE_TRIGGER_ACTIONS = [
  'project/createProject', 'project/updateProject',
  'nodes/addNode', 'nodes/updateNode', 'nodes/deleteNode',
  'datasets/addDataset', 'datasets/updateDataset',
  'connections/addConnection', 'connections/deleteConnection'
];

// Debounced save (500ms)
setTimeout(() => {
  const state = store.getState();
  saveProjectToLocalStorage(state);
}, 500);

// Auto-load on app start (App.tsx)
const savedProject = loadProjectFromLocalStorage();
if (savedProject) {
  dispatch(loadProject(savedProject.project));
  savedProject.nodes.forEach(node => dispatch(addNode(node)));
  savedProject.datasets.forEach(dataset => dispatch(addDataset(dataset)));
  savedProject.connections.forEach(conn => dispatch(addConnection(conn)));
}
```

## Working Features
### Phase 1-4 (Core Builder)
✅ Drag nodes/datasets from sidebar
✅ Drop on canvas (stays in place)
✅ Connect with top/bottom handles
✅ Multi-select (Cmd/Ctrl + Click, Box selection)
✅ Delete with Delete key
✅ Right-click edges for context menu
✅ Configure nodes (3 fields: name, description, code)
✅ Configure datasets (5 fields)
✅ Bulk actions toolbar
✅ Theme switching (light/dark)
✅ Keyboard shortcuts (Delete, Escape, Cmd+A)

### Phase 4.5: Tutorial & Walkthrough (Completed)
✅ 5-step tutorial modal with animations
✅ Tutorial auto-shows on first visit
✅ Tutorial button in header (can reopen)
✅ 4-step interactive walkthrough with spotlight
✅ Walkthrough button in header
✅ Spotlight circles with Kedro yellow (#ffb800)
✅ Theme-aware walkthrough UI (light/dark)
✅ Viewport-aware tooltip positioning
✅ Project setup modal with validation
✅ Empty state with welcome message
✅ Quick action buttons (Dataset, Function Node)
✅ Drag-and-drop visual feedback (pulsing border)
✅ Kedro logo in header
✅ Consistent handle colors (#c0c5c9)
✅ Z-index hierarchy for layered modals

### Phase 5: localStorage Persistence (Completed - NEW!)
✅ Project metadata with id, description, timestamps
✅ Auto-save middleware (debounced 500ms)
✅ Auto-load on app start
✅ localStorage utility functions
✅ Project setup modal updated (removed directory, added description)
✅ New Project button (clears all state)
✅ Overloaded addNode/addDataset actions (accept full objects or create new)
✅ Clear actions for all slices (clearProject, clearNodes, clearDatasets, clearConnections)
✅ Persist entire pipeline: project + nodes + datasets + connections
✅ No work lost on browser refresh

## Files to Re-Read When Needed
- Component implementations: Can use Read tool
- Documentation: PHASE_*_COMPLETE.md files
- Implementation plan: UPDATED_IMPLEMENTATION_PLAN.md

## Next Steps (Remaining Phases)

### Phase 6: Validation System (NEXT)
- Circular dependency detection
- Orphaned nodes/datasets check
- Type compatibility validation
- Missing input/output warnings
- Validation panel with error/warning lists

### Phase 7: Code Generation & Preview
- Handlebars templates (catalog.yml, nodes.py, pipeline.py)
- Syntax-highlighted code preview
- Live updates as pipeline changes
- Copy-to-clipboard buttons

### Phase 7: ZIP Download
- JSZip integration for project export
- Full Kedro project structure generation
- Include all data layers, conf/, src/ folders
- Download button functionality

### Phase 8: Export & Multi-Project
- Export project as JSON file (download)
- Import project from JSON file
- Multi-project support in localStorage
- Project list management UI

### Phase 9: Advanced Features
- Undo/redo with Redux middleware
- Additional keyboard shortcuts
- Template library (pre-built pipelines)
- Error boundaries

### Phase 10: Deployment
- Production build optimization
- GitHub Pages deployment
- Documentation

## Key Implementation Notes
- ReactFlow state syncs to Redux on drag end (not during drag)
- Selection state: nodes array, datasets null, connections array
- No real-time validation (only on button click)
- Connections infer inputs/outputs (not manual entry)
- Datasets rendered as nodes on canvas (not separate layer)
- Edge interaction: CSS-based wide click area (not JS)

## Testing Checklist Template
When building new features, test:
- [ ] Drag & drop from sidebar
- [ ] Click to select
- [ ] Multi-select with modifiers
- [ ] Delete key
- [ ] Position persists after drag
- [ ] Theme switching works
- [ ] Config panel opens/closes
- [ ] Redux state updates correctly
