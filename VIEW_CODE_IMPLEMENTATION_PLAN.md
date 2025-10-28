# View Code Feature - Implementation Plan

**Date**: 2025-01-24
**Status**: Planning Phase
**Based on**: Screenshot analysis, existing documentation, and codebase review

---

## 1. Requirement Understanding

### What We're Building
A **code preview/viewer feature** that allows users to view the generated Kedro project code **before exporting** it as a ZIP file.

### Key Requirements from Screenshot Analysis

From the provided screenshot, I can see:

1. **Directory Tree Structure** (Left Side):
   - Shows Kedro project directory structure
   - Expandable/collapsible folders (conf, data, notebooks, src)
   - File list under each folder
   - Visual hierarchy with folder icons and expand/collapse arrows

2. **Code Preview Panel** (Right Side):
   - Shows generated Python/YAML code
   - Syntax-highlighted code display
   - Multiple file contents in sequence:
     - `catalog.yml`
     - `nodes.py`
     - `pipeline.py`
   - Code comments showing file headers

3. **Navigation**:
   - File tree navigation on left
   - Click on file → shows content on right
   - Clear visual separation between tree and code

4. **Action Buttons**:
   - "Export" button (bottom right) to download the project

### Critical Business Rule
**Users can ONLY view code if the pipeline is free from validation errors.**
- Must run validation before enabling "View Code" button
- If `validationResult.isValid === false`, button stays disabled
- Only enable when `validationResult.isValid === true`

---

## 2. Current State Analysis

### What Already Exists

#### ✅ Code Generation Functions
All code generators are already implemented in `/src/utils/export/`:
- `catalogGenerator.ts` - Generates `catalog.yml`
- `nodesGenerator.ts` - Generates `nodes.py`
- `pipelineGenerator.ts` - Generates `pipeline.py`
- `registryGenerator.ts` - Generates `pipeline_registry.py` and `settings.py`
- `pyprojectGenerator.ts` - Generates `pyproject.toml`
- `staticFilesGenerator.ts` - Generates `README.md`, `__init__.py`, etc.
- `projectGenerator.ts` - Orchestrates all generators

#### ✅ Validation System
- `src/utils/validation.ts` - Complete validation with `ValidationResult` type
- Returns `{ errors, warnings, isValid }` structure
- Already used by Export Wizard

#### ✅ View Code Button
- Exists in `App.tsx` (lines 238-246)
- Currently **disabled** with title "View Code (Coming Soon)"
- Has `data-walkthrough="view-code-button"` attribute
- Uses `<Code>` icon from lucide-react

#### ✅ Redux State Infrastructure
- `ui` slice has `showCodePreview: boolean` field (currently unused)
- Can be used to toggle code viewer modal

### What's Missing

#### ❌ Code Viewer UI Component
- No `CodeViewer` or `CodePreview` component exists
- Need to create directory tree component
- Need to create syntax-highlighted code display

#### ❌ Enable/Disable Logic
- View Code button is hardcoded as `disabled`
- Need to connect to validation state

#### ❌ Syntax Highlighting Library
- No syntax highlighter installed
- Need to choose library (e.g., Prism.js, Highlight.js, or react-syntax-highlighter)

---

## 3. Technical Architecture

### Component Structure

```
CodeViewerModal (New)
├── CodeViewerHeader (New)
│   ├── Title: "Kedro Project Directory"
│   └── Close Button
├── CodeViewerContent (New)
│   ├── FileTree (New)
│   │   ├── TreeFolder (Recursive Component)
│   │   │   ├── Folder Icon + Name
│   │   │   ├── Expand/Collapse Arrow
│   │   │   └── Children (Files/Folders)
│   │   └── TreeFile
│   │       ├── File Icon
│   │       ├── File Name
│   │       └── onClick handler
│   └── CodeDisplay (New)
│       ├── File Header (e.g., "# catalog.yml")
│       ├── Syntax Highlighted Code
│       └── Copy to Clipboard Button (optional)
└── CodeViewerFooter (New)
    └── Export Button
```

### Data Flow

```
User clicks "View Code"
    ↓
1. Run validation (validatePipeline(state))
    ↓
2. If errors exist → Show error toast, don't open
    ↓
3. If valid → Generate all code files
    ↓
4. Build file tree structure
    ↓
5. Open CodeViewerModal with file tree + first file
    ↓
User clicks on file in tree
    ↓
6. Update selected file
    ↓
7. Display file content with syntax highlighting
    ↓
User clicks "Export"
    ↓
8. Close modal, trigger export wizard
```

### State Management

```typescript
// Add to ui slice
interface UIState {
  showCodeViewer: boolean; // Rename from showCodePreview
  selectedCodeFile: string | null; // Track which file is selected
  // ... existing fields
}

// Actions needed
- openCodeViewer()
- closeCodeViewer()
- selectCodeFile(filepath: string)
```

### File Tree Data Structure

```typescript
interface FileNode {
  name: string;
  type: 'file' | 'folder';
  path: string; // Full path like 'conf/base/catalog.yml'
  content?: string; // Only for files
  children?: FileNode[]; // Only for folders
  expanded?: boolean; // For folders
}

interface GeneratedProject {
  files: FileNode[];
  rootFolder: FileNode; // Root of the tree
}
```

---

## 4. Implementation Steps

### Phase 1: Setup & Infrastructure (1-2 hours)

#### Step 1.1: Install Dependencies
```bash
npm install react-syntax-highlighter
npm install @types/react-syntax-highlighter --save-dev
```

#### Step 1.2: Update Redux UI Slice
**File**: `src/features/ui/uiSlice.ts`

Add state:
```typescript
showCodeViewer: false,
selectedCodeFile: 'conf/base/catalog.yml', // Default to catalog
```

Add actions:
```typescript
openCodeViewer(state) {
  state.showCodeViewer = true;
},
closeCodeViewer(state) {
  state.showCodeViewer = false;
  state.selectedCodeFile = null;
},
selectCodeFile(state, action: PayloadAction<string>) {
  state.selectedCodeFile = action.payload;
}
```

#### Step 1.3: Create File Tree Generator Utility
**File**: `src/utils/fileTreeGenerator.ts` (NEW)

```typescript
import { generateKedroProjectFiles } from './export';
import type { RootState } from '../types/redux';

export interface FileNode {
  name: string;
  type: 'file' | 'folder';
  path: string;
  content?: string;
  children?: FileNode[];
  expanded?: boolean;
  icon?: string; // For file type icons
}

/**
 * Generate file tree from Redux state
 */
export function generateFileTree(state: RootState): FileNode {
  // Use existing generators to get file contents
  const files = generateKedroProjectFiles(state);

  // Build tree structure
  const root: FileNode = {
    name: state.project.current?.name || 'kedro-project',
    type: 'folder',
    path: '/',
    expanded: true,
    children: [
      {
        name: 'conf',
        type: 'folder',
        path: 'conf',
        expanded: true,
        children: [
          {
            name: 'base',
            type: 'folder',
            path: 'conf/base',
            expanded: true,
            children: [
              {
                name: 'catalog.yml',
                type: 'file',
                path: 'conf/base/catalog.yml',
                content: files['conf/base/catalog.yml'],
              },
              {
                name: 'parameters.yml',
                type: 'file',
                path: 'conf/base/parameters.yml',
                content: files['conf/base/parameters.yml'],
              },
            ],
          },
        ],
      },
      {
        name: 'data',
        type: 'folder',
        path: 'data',
        children: [],
      },
      {
        name: 'notebooks',
        type: 'folder',
        path: 'notebooks',
        children: [],
      },
      {
        name: 'src',
        type: 'folder',
        path: 'src',
        expanded: true,
        children: [
          // Build pipeline folder dynamically
          {
            name: state.project.current?.pythonPackage || 'my_project',
            type: 'folder',
            path: `src/${state.project.current?.pythonPackage}`,
            expanded: true,
            children: [
              {
                name: 'pipelines',
                type: 'folder',
                path: `src/${pythonPackage}/pipelines`,
                children: [
                  {
                    name: state.project.current?.pipelineName,
                    type: 'folder',
                    path: `src/${pythonPackage}/pipelines/${pipelineName}`,
                    children: [
                      {
                        name: 'nodes.py',
                        type: 'file',
                        path: `src/${pythonPackage}/pipelines/${pipelineName}/nodes.py`,
                        content: files[...],
                      },
                      {
                        name: 'pipeline.py',
                        type: 'file',
                        path: `src/${pythonPackage}/pipelines/${pipelineName}/pipeline.py`,
                        content: files[...],
                      },
                      // ... more files
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        name: 'pyproject.toml',
        type: 'file',
        path: 'pyproject.toml',
        content: files['pyproject.toml'],
      },
      {
        name: 'README.md',
        type: 'file',
        path: 'README.md',
        content: files['README.md'],
      },
      {
        name: 'requirements.txt',
        type: 'file',
        path: 'requirements.txt',
        content: files['requirements.txt'],
      },
    ],
  };

  return root;
}

/**
 * Find file node by path
 */
export function findFileByPath(root: FileNode, path: string): FileNode | null {
  if (root.path === path) return root;
  if (root.children) {
    for (const child of root.children) {
      const found = findFileByPath(child, path);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Get file extension for syntax highlighting
 */
export function getFileLanguage(filename: string): string {
  if (filename.endsWith('.py')) return 'python';
  if (filename.endsWith('.yml') || filename.endsWith('.yaml')) return 'yaml';
  if (filename.endsWith('.toml')) return 'toml';
  if (filename.endsWith('.md')) return 'markdown';
  if (filename.endsWith('.txt')) return 'text';
  return 'text';
}
```

---

### Phase 2: UI Components (3-4 hours)

#### Step 2.1: Create CodeViewerModal Component
**File**: `src/components/CodeViewer/CodeViewerModal.tsx` (NEW)

```typescript
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { closeCodeViewer } from '../../features/ui/uiSlice';
import { FileTree } from './FileTree';
import { CodeDisplay } from './CodeDisplay';
import { X } from 'lucide-react';
import './CodeViewerModal.scss';

export const CodeViewerModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const showCodeViewer = useAppSelector((state) => state.ui.showCodeViewer);
  const projectName = useAppSelector((state) => state.project.current?.name);

  if (!showCodeViewer) return null;

  const handleClose = () => {
    dispatch(closeCodeViewer());
  };

  return (
    <div className="code-viewer-modal">
      <div className="code-viewer-modal__backdrop" onClick={handleClose} />
      <div className="code-viewer-modal__container">
        <header className="code-viewer-modal__header">
          <h2 className="code-viewer-modal__title">
            Kedro Project Directory
          </h2>
          <button
            className="code-viewer-modal__close"
            onClick={handleClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </header>

        <div className="code-viewer-modal__content">
          <aside className="code-viewer-modal__sidebar">
            <FileTree />
          </aside>
          <main className="code-viewer-modal__main">
            <CodeDisplay />
          </main>
        </div>

        <footer className="code-viewer-modal__footer">
          <button
            className="code-viewer-modal__export"
            onClick={() => {
              // Trigger export
              handleClose();
              // Dispatch open export wizard
            }}
          >
            Export
          </button>
        </footer>
      </div>
    </div>
  );
};
```

#### Step 2.2: Create FileTree Component
**File**: `src/components/CodeViewer/FileTree.tsx` (NEW)

```typescript
import { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { selectCodeFile } from '../../features/ui/uiSlice';
import { generateFileTree } from '../../utils/fileTreeGenerator';
import type { FileNode } from '../../utils/fileTreeGenerator';
import { ChevronRight, ChevronDown, Folder, File } from 'lucide-react';
import './FileTree.scss';

export const FileTree: React.FC = () => {
  const dispatch = useAppDispatch();
  const state = useAppSelector((state) => state);
  const selectedFile = useAppSelector((state) => state.ui.selectedCodeFile);

  const [fileTree, setFileTree] = useState<FileNode | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  useEffect(() => {
    const tree = generateFileTree(state);
    setFileTree(tree);

    // Auto-expand all folders by default
    const expanded = new Set<string>();
    const collectPaths = (node: FileNode) => {
      if (node.type === 'folder' && node.expanded) {
        expanded.add(node.path);
      }
      node.children?.forEach(collectPaths);
    };
    collectPaths(tree);
    setExpandedFolders(expanded);
  }, [state]);

  const handleFileClick = (path: string) => {
    dispatch(selectCodeFile(path));
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const renderNode = (node: FileNode, level: number = 0) => {
    if (node.type === 'folder') {
      const isExpanded = expandedFolders.has(node.path);
      return (
        <div key={node.path} className="file-tree__folder">
          <div
            className="file-tree__folder-header"
            style={{ paddingLeft: `${level * 16}px` }}
            onClick={() => toggleFolder(node.path)}
          >
            {isExpanded ? (
              <ChevronDown size={16} className="file-tree__chevron" />
            ) : (
              <ChevronRight size={16} className="file-tree__chevron" />
            )}
            <Folder size={16} className="file-tree__icon" />
            <span className="file-tree__name">{node.name}</span>
          </div>
          {isExpanded && node.children && (
            <div className="file-tree__children">
              {node.children.map((child) => renderNode(child, level + 1))}
            </div>
          )}
        </div>
      );
    } else {
      const isSelected = selectedFile === node.path;
      return (
        <div
          key={node.path}
          className={`file-tree__file ${isSelected ? 'file-tree__file--selected' : ''}`}
          style={{ paddingLeft: `${(level + 1) * 16}px` }}
          onClick={() => handleFileClick(node.path)}
        >
          <File size={16} className="file-tree__icon" />
          <span className="file-tree__name">{node.name}</span>
        </div>
      );
    }
  };

  if (!fileTree) return <div>Loading...</div>;

  return (
    <div className="file-tree">
      {renderNode(fileTree)}
    </div>
  );
};
```

#### Step 2.3: Create CodeDisplay Component
**File**: `src/components/CodeViewer/CodeDisplay.tsx` (NEW)

```typescript
import { useMemo } from 'react';
import { useAppSelector } from '../../store/hooks';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { generateFileTree, findFileByPath, getFileLanguage } from '../../utils/fileTreeGenerator';
import { Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import './CodeDisplay.scss';

export const CodeDisplay: React.FC = () => {
  const state = useAppSelector((state) => state);
  const theme = useAppSelector((state) => state.theme.theme);
  const selectedFilePath = useAppSelector((state) => state.ui.selectedCodeFile);

  const fileTree = useMemo(() => generateFileTree(state), [state]);

  const selectedFile = useMemo(() => {
    if (!selectedFilePath || !fileTree) return null;
    return findFileByPath(fileTree, selectedFilePath);
  }, [fileTree, selectedFilePath]);

  const handleCopy = () => {
    if (selectedFile?.content) {
      navigator.clipboard.writeText(selectedFile.content);
      toast.success('Copied to clipboard!');
    }
  };

  if (!selectedFile) {
    return (
      <div className="code-display code-display--empty">
        <p>Select a file to view its contents</p>
      </div>
    );
  }

  if (selectedFile.type === 'folder') {
    return (
      <div className="code-display code-display--empty">
        <p>This is a folder. Select a file to view its contents.</p>
      </div>
    );
  }

  const language = getFileLanguage(selectedFile.name);
  const syntaxTheme = theme === 'dark' ? vscDarkPlus : vs;

  return (
    <div className="code-display">
      <div className="code-display__header">
        <h3 className="code-display__filename">
          {selectedFile.path}
        </h3>
        <button
          className="code-display__copy"
          onClick={handleCopy}
          title="Copy to clipboard"
        >
          <Copy size={16} />
          Copy
        </button>
      </div>
      <div className="code-display__content">
        <SyntaxHighlighter
          language={language}
          style={syntaxTheme}
          showLineNumbers
          wrapLines
          customStyle={{
            margin: 0,
            borderRadius: 0,
            fontSize: '14px',
            lineHeight: '1.5',
          }}
        >
          {selectedFile.content || '// Empty file'}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};
```

---

### Phase 3: Styles (1 hour)

#### Step 3.1: CodeViewerModal Styles
**File**: `src/components/CodeViewer/CodeViewerModal.scss` (NEW)

```scss
.code-viewer-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;

  &__backdrop {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
  }

  &__container {
    position: relative;
    width: 90vw;
    height: 85vh;
    max-width: 1400px;
    background: var(--color-bg-0);
    border-radius: 8px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem 2rem;
    border-bottom: 1px solid var(--color-border-line);
  }

  &__title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-text);
    margin: 0;
  }

  &__close {
    background: none;
    border: none;
    color: var(--color-text-alt);
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 4px;
    transition: all 0.2s;

    &:hover {
      background: var(--color-bg-1);
      color: var(--color-text);
    }
  }

  &__content {
    flex: 1;
    display: flex;
    overflow: hidden;
  }

  &__sidebar {
    width: 300px;
    border-right: 1px solid var(--color-border-line);
    overflow-y: auto;
    background: var(--color-bg-0);
  }

  &__main {
    flex: 1;
    overflow: auto;
    background: var(--color-bg-1);
  }

  &__footer {
    padding: 1rem 2rem;
    border-top: 1px solid var(--color-border-line);
    display: flex;
    justify-content: flex-end;
  }

  &__export {
    padding: 0.75rem 2rem;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: var(--color-primary-dark);
    }
  }
}
```

#### Step 3.2: FileTree Styles
**File**: `src/components/CodeViewer/FileTree.scss` (NEW)

```scss
.file-tree {
  padding: 1rem 0;

  &__folder-header,
  &__file {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    cursor: pointer;
    color: var(--color-text);
    font-size: 0.875rem;
    transition: background 0.2s;

    &:hover {
      background: var(--color-bg-1);
    }
  }

  &__file {
    &--selected {
      background: var(--color-primary-light);
      color: var(--color-primary);
      font-weight: 500;
    }
  }

  &__chevron {
    flex-shrink: 0;
    color: var(--color-text-alt);
  }

  &__icon {
    flex-shrink: 0;
    color: var(--color-text-alt);
  }

  &__name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__children {
    // Nested children styles handled by recursive rendering
  }
}
```

#### Step 3.3: CodeDisplay Styles
**File**: `src/components/CodeViewer/CodeDisplay.scss` (NEW)

```scss
.code-display {
  height: 100%;
  display: flex;
  flex-direction: column;

  &--empty {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-alt);
    font-size: 0.875rem;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--color-border-line);
    background: var(--color-bg-0);
  }

  &__filename {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text);
    margin: 0;
    font-family: 'Courier New', monospace;
  }

  &__copy {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: var(--color-bg-1);
    border: 1px solid var(--color-border-line);
    border-radius: 4px;
    color: var(--color-text);
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: var(--color-bg-2);
    }
  }

  &__content {
    flex: 1;
    overflow: auto;

    pre {
      margin: 0 !important;
      font-size: 14px !important;
      line-height: 1.5 !important;
    }

    code {
      font-family: 'Courier New', Consolas, Monaco, monospace !important;
    }
  }
}
```

---

### Phase 4: Integration with App.tsx (30 mins)

#### Step 4.1: Enable View Code Button
**File**: `src/components/App/App.tsx`

**Change from:**
```typescript
<button
  className="app__header-button"
  data-walkthrough="view-code-button"
  disabled
  title="View Code (Coming Soon)"
>
  <Code size={18} />
  View Code
</button>
```

**Change to:**
```typescript
const handleViewCode = () => {
  // Run validation first
  const validationResult = validatePipeline(store.getState());

  if (!validationResult.isValid) {
    toast.error('Cannot view code: Please fix validation errors first');
    return;
  }

  // Open code viewer
  dispatch(openCodeViewer());
};

// ... in JSX
<button
  className="app__header-button"
  data-walkthrough="view-code-button"
  disabled={!hasActiveProject || !hasPipelineContent}
  onClick={handleViewCode}
  title="View Generated Code"
>
  <Code size={18} />
  View Code
</button>
```

#### Step 4.2: Add CodeViewerModal to App
```typescript
import { CodeViewerModal } from '../CodeViewer/CodeViewerModal';

// In render:
{/* Modals and overlays */}
<TutorialModal />
{showWalkthrough && <WalkthroughOverlay />}
{showProjectSetup && <ProjectSetupModal />}
<CodeViewerModal /> {/* ADD THIS */}
<ValidationPanel />
```

---

## 5. Testing Checklist

### Validation Tests
- [ ] View Code button is disabled when no project exists
- [ ] View Code button is disabled when pipeline is empty
- [ ] View Code button is disabled when validation errors exist
- [ ] View Code button is enabled when validation passes
- [ ] Clicking View Code with errors shows error toast

### File Tree Tests
- [ ] Directory structure matches Kedro project structure
- [ ] Folders can be expanded/collapsed
- [ ] Clicking on file selects it (visual feedback)
- [ ] conf, src folders are expanded by default
- [ ] data, notebooks folders are collapsed by default

### Code Display Tests
- [ ] Selecting file shows its content
- [ ] Syntax highlighting works for Python files
- [ ] Syntax highlighting works for YAML files
- [ ] Syntax highlighting works for TOML files
- [ ] Copy button copies code to clipboard
- [ ] Empty state shows when no file is selected

### Theme Tests
- [ ] Code viewer works in light theme
- [ ] Code viewer works in dark theme
- [ ] Syntax highlighting matches theme

### Edge Cases
- [ ] Works with empty pipeline (no nodes/datasets)
- [ ] Works with long file names
- [ ] Works with deep folder nesting
- [ ] Scrolling works for long file contents
- [ ] Modal closes on backdrop click
- [ ] Modal closes on X button click
- [ ] Modal closes on Export button click

---

## 6. File Checklist

### New Files to Create
- [ ] `src/utils/fileTreeGenerator.ts`
- [ ] `src/components/CodeViewer/CodeViewerModal.tsx`
- [ ] `src/components/CodeViewer/CodeViewerModal.scss`
- [ ] `src/components/CodeViewer/FileTree.tsx`
- [ ] `src/components/CodeViewer/FileTree.scss`
- [ ] `src/components/CodeViewer/CodeDisplay.tsx`
- [ ] `src/components/CodeViewer/CodeDisplay.scss`
- [ ] `src/components/CodeViewer/index.ts` (barrel export)

### Files to Modify
- [ ] `src/features/ui/uiSlice.ts` - Add state + actions
- [ ] `src/components/App/App.tsx` - Enable button + add modal
- [ ] `package.json` - Add syntax highlighter dependencies

---

## 7. Estimated Timeline

| Phase | Task | Time Estimate |
|-------|------|---------------|
| 1 | Setup & Infrastructure | 1-2 hours |
| 2 | UI Components | 3-4 hours |
| 3 | Styles | 1 hour |
| 4 | Integration | 30 mins |
| 5 | Testing & Bug Fixes | 1-2 hours |
| **Total** | | **6-9 hours** |

---

## 8. Open Questions / Decisions Needed

1. **Should we show all files or only key files?**
   - Option A: Show complete Kedro structure (including empty folders like data/, notebooks/)
   - Option B: Show only files with content (recommended)
   - **Recommendation**: Option B for cleaner UX

2. **Should Export button in modal trigger full export wizard or direct download?**
   - Option A: Close modal, open Export Wizard (current flow)
   - Option B: Direct download without wizard (faster)
   - **Recommendation**: Option A to maintain consistency

3. **Should we cache generated code or regenerate on each open?**
   - Option A: Regenerate every time (ensures fresh data)
   - Option B: Cache until pipeline changes (performance)
   - **Recommendation**: Option A for simplicity

4. **Should we add search functionality in file tree?**
   - Nice-to-have for future enhancement
   - **Recommendation**: Not in initial version

---

## 9. Success Criteria

The View Code feature will be considered complete when:

1. ✅ Users can click "View Code" button (only when validation passes)
2. ✅ Modal opens showing Kedro project structure
3. ✅ Users can navigate file tree (expand/collapse folders)
4. ✅ Users can click on files to view content
5. ✅ Code is syntax-highlighted correctly
6. ✅ Users can copy code to clipboard
7. ✅ Users can export project from modal
8. ✅ Modal works in both light and dark themes
9. ✅ All edge cases are handled gracefully

---

**Ready to implement? Let me know if you approve this plan or if you'd like any changes!**
