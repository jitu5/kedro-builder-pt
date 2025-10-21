import { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { store } from '../../store';
import {
  setShowTutorial,
  openTutorial,
  startWalkthrough,
  reopenWalkthrough,
  setHasActiveProject,
} from '../../features/ui/uiSlice';
import { loadProject, clearProject } from '../../features/project/projectSlice';
import { clearNodes } from '../../features/nodes/nodesSlice';
import { clearDatasets } from '../../features/datasets/datasetsSlice';
import { clearConnections } from '../../features/connections/connectionsSlice';
import { addNode } from '../../features/nodes/nodesSlice';
import { addDataset } from '../../features/datasets/datasetsSlice';
import { addConnection } from '../../features/connections/connectionsSlice';
import { setValidationResults } from '../../features/validation/validationSlice';
import { loadProjectFromLocalStorage, clearProjectFromLocalStorage } from '../../utils/localStorage';
import { validatePipeline } from '../../utils/validation';
import type { ValidationResult } from '../../utils/validation';
import { ThemeToggle } from '../UI/ThemeToggle/ThemeToggle';
import { ComponentPalette } from '../Palette/ComponentPalette';
import { PipelineCanvas } from '../Canvas/PipelineCanvas';
import { ConfigPanel } from '../ConfigPanel/ConfigPanel';
import { TutorialModal } from '../Tutorial/TutorialModal';
import { WalkthroughOverlay } from '../Walkthrough/WalkthroughOverlay';
import { ProjectSetupModal } from '../ProjectSetup/ProjectSetupModal';
import { ValidationPanel } from '../ValidationPanel/ValidationPanel';
import { ExportWizard } from '../ExportWizard/ExportWizard';
import { generateKedroProject, downloadProject } from '../../utils/export';
import { Code, Download, Edit2, Plus } from 'lucide-react';
import './App.scss';

function App() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.theme.theme);
  const showConfigPanel = useAppSelector((state) => state.ui.showConfigPanel);
  const showWalkthrough = useAppSelector((state) => state.ui.showWalkthrough);
  const showProjectSetup = useAppSelector((state) => state.ui.showProjectSetup);
  const hasActiveProject = useAppSelector((state) => state.ui.hasActiveProject);
  const currentProject = useAppSelector((state) => state.project.current);

  const [isEditingProjectName, setIsEditingProjectName] = useState(false);
  const [tempProjectName, setTempProjectName] = useState('');
  const [showExportWizard, setShowExportWizard] = useState(false);
  const [exportValidationResult, setExportValidationResult] = useState<ValidationResult | null>(null);

  // Apply theme class to root element
  useEffect(() => {
    document.documentElement.className = `kedro-builder kui-theme--${theme}`;
  }, [theme]);

  // Initialize app state from localStorage (runs only once on mount)
  useEffect(() => {
    const tutorialCompleted = localStorage.getItem('kedro_builder_tutorial_completed');
    const walkthroughCompleted = localStorage.getItem('kedro_builder_walkthrough_completed');

    // Try to load saved project
    const savedProject = loadProjectFromLocalStorage();

    // Determine initial flow state
    if (!tutorialCompleted) {
      // Show tutorial first
      dispatch(setShowTutorial(true));
    } else if (!walkthroughCompleted) {
      // Show walkthrough after tutorial
      dispatch(startWalkthrough());
    } else if (savedProject) {
      // Clear any existing state first (in case of hot reload during development)
      dispatch(clearNodes());
      dispatch(clearDatasets());
      dispatch(clearConnections());

      // Load the saved project into Redux
      dispatch(loadProject(savedProject.project));

      // Load nodes
      savedProject.nodes.forEach(node => {
        dispatch(addNode(node));
      });

      // Load datasets
      savedProject.datasets.forEach(dataset => {
        dispatch(addDataset(dataset));
      });

      // Load connections
      savedProject.connections.forEach(connection => {
        dispatch(addConnection(connection));
      });

      dispatch(setHasActiveProject(true));
      console.log('📂 Project loaded from localStorage');
    } else {
      // Walkthrough done but no project created
      dispatch(setHasActiveProject(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - run only once on mount

  const handleOpenTutorial = () => {
    dispatch(openTutorial());
  };

  const handleOpenWalkthrough = () => {
    dispatch(reopenWalkthrough());
  };

  const handleResetProject = () => {
    if (confirm('Are you sure you want to reset the project? This will clear all current work.')) {
      // Clear all Redux state
      dispatch(clearProject());
      dispatch(clearNodes());
      dispatch(clearDatasets());
      dispatch(clearConnections());

      // Clear localStorage
      clearProjectFromLocalStorage();

      // Update UI state
      dispatch(setHasActiveProject(false));

      console.log('🗑️ Project cleared');
    }
  };

  // Editable project name handlers
  const handleStartEditProjectName = () => {
    if (currentProject) {
      setTempProjectName(currentProject.name);
      setIsEditingProjectName(true);
    }
  };

  const handleProjectNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempProjectName(e.target.value);
  };

  const handleSaveProjectName = () => {
    if (tempProjectName.trim() && /^[a-zA-Z0-9_-]+$/.test(tempProjectName) && currentProject) {
      dispatch(loadProject({
        ...currentProject,
        name: tempProjectName,
        pythonPackage: tempProjectName.replace(/-/g, '_'),
      }));
    }
    setIsEditingProjectName(false);
  };

  const handleCancelEditProjectName = () => {
    setIsEditingProjectName(false);
  };

  const handleProjectNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveProjectName();
    } else if (e.key === 'Escape') {
      handleCancelEditProjectName();
    }
  };

  const handleExport = () => {
    // Get current state from store
    const state = store.getState();

    // Run validation
    const validationResult = validatePipeline(state);

    // Store validation results in Redux (for ValidationPanel compatibility)
    dispatch(setValidationResults(validationResult));

    // Store validation results in local state for ExportWizard
    setExportValidationResult(validationResult);

    // Open export wizard (it will handle showing validation results)
    setShowExportWizard(true);
  };

  const handleConfirmExport = async (metadata: {
    projectName: string;
    pythonPackage: string;
    pipelineName: string;
    description: string;
  }) => {
    try {
      console.log('🚀 Generating Kedro project...');

      // Get current state
      const state = store.getState();

      // Generate ZIP file
      const zipBlob = await generateKedroProject(state, metadata);

      // Download the file
      downloadProject(zipBlob, metadata.projectName);

      // Close dialog
      setShowExportWizard(false);

      console.log('✅ Project exported successfully!');
      alert(
        `Project "${metadata.projectName}" exported successfully!\n\n` +
          'Next steps:\n' +
          '1. Extract the ZIP file\n' +
          `2. cd ${metadata.projectName}\n` +
          '3. pip install -e .\n' +
          '4. kedro run'
      );
    } catch (error) {
      console.error('❌ Export failed:', error);
      alert('Failed to export project. Please try again.');
    }
  };

  return (
    <div className="kedro-builder" data-theme={theme}>
      <div className="app">
        <header className="app__header">
          <div className="app__header-content">
            <div className="app__header-title">
              <svg className="app__kedro-icon" viewBox="0 0 32 32" fill="none">
                <path d="M16 0L6.55651e-07 16L16 32L32 16L16 0Z" fill="#FFC900" />
              </svg>
              <div className="app__header-project">
                <h1>Kedro</h1>
              </div>

              <div className="app__header-project-controls">
                {/* Editable project name */}
                <div className="app__project-name-container">
                  {isEditingProjectName ? (
                    <input
                      type="text"
                      className="app__project-name-input"
                      value={tempProjectName}
                      onChange={handleProjectNameChange}
                      onKeyDown={handleProjectNameKeyDown}
                      onBlur={handleSaveProjectName}
                      autoFocus
                    />
                  ) : (
                    <>
                      <p
                        className={`app__project-name ${!hasActiveProject ? 'app__project-name--disabled' : ''}`}
                      >
                        {currentProject ? currentProject.name : 'Untitled project'}
                      </p>
                      {hasActiveProject && (
                        <button
                          className="app__project-name-edit"
                          onClick={handleStartEditProjectName}
                          title="Edit project name"
                        >
                          <Edit2 size={16} />
                        </button>
                      )}
                    </>
                  )}
                </div>
                
                {/* Divider */}
                {currentProject && <div className="app__header-divider"></div>}

                {/* Reset Project Button */}
                {currentProject && <button
                  className="app__reset-project-button"
                  onClick={handleResetProject}
                  title="Reset Project"
                >
                  Reset Project
                </button>}
              </div>  
            </div>

            <div className="app__header-actions">
              <button
                className="app__header-button"
                onClick={handleOpenTutorial}
                title="Tutorial"
              >
                Tutorial
              </button>
              <button
                className="app__header-button"
                data-walkthrough="view-code-button"
                disabled={!hasActiveProject}
                title="View Code (Coming Soon)"
              >
                <Code size={18} />
                View Code
              </button>
              <button
                className="app__header-button app__header-button--primary"
                data-walkthrough="export-button"
                disabled={!hasActiveProject}
                onClick={handleExport}
                title="Export Kedro Project"
              >
                <Download size={18} />
                Export
              </button>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="app__main">
          <aside className="app__sidebar">
            <ComponentPalette />
          </aside>
          <div className="app__canvas">
            <PipelineCanvas />
          </div>
          {showConfigPanel && (
            <aside className="app__config-panel">
              <ConfigPanel />
            </aside>
          )}
        </main>
      </div>

      {/* Modals and overlays */}
      <TutorialModal />
      {showWalkthrough && <WalkthroughOverlay />}
      {showProjectSetup && <ProjectSetupModal />}
      <ValidationPanel />
      {exportValidationResult && (
        <ExportWizard
          isOpen={showExportWizard}
          onClose={() => setShowExportWizard(false)}
          validationResult={exportValidationResult}
          onExport={handleConfirmExport}
        />
      )}
    </div>
  );
}

export default App;
