import { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import {
  setShowTutorial,
  openTutorial,
  startWalkthrough,
  reopenWalkthrough,
  setHasActiveProject,
  updateProjectName,
} from '../../features/ui/uiSlice';
import { ThemeToggle } from '../UI/ThemeToggle/ThemeToggle';
import { ComponentPalette } from '../Palette/ComponentPalette';
import { PipelineCanvas } from '../Canvas/PipelineCanvas';
import { ConfigPanel } from '../ConfigPanel/ConfigPanel';
import { TutorialModal } from '../Tutorial/TutorialModal';
import { WalkthroughOverlay } from '../Walkthrough/WalkthroughOverlay';
import { ProjectSetupModal } from '../ProjectSetup/ProjectSetupModal';
import { Code, Download, Edit2 } from 'lucide-react';
import './App.scss';

function App() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.theme.theme);
  const showConfigPanel = useAppSelector((state) => state.ui.showConfigPanel);
  const showWalkthrough = useAppSelector((state) => state.ui.showWalkthrough);
  const showProjectSetup = useAppSelector((state) => state.ui.showProjectSetup);
  const hasActiveProject = useAppSelector((state) => state.ui.hasActiveProject);
  const projectName = useAppSelector((state) => state.ui.projectName);

  const [isEditingProjectName, setIsEditingProjectName] = useState(false);
  const [tempProjectName, setTempProjectName] = useState('');

  // Apply theme class to root element
  useEffect(() => {
    document.documentElement.className = `kedro-builder kui-theme--${theme}`;
  }, [theme]);

  // Initialize app state from localStorage
  useEffect(() => {
    const tutorialCompleted = localStorage.getItem('kedro_builder_tutorial_completed');
    const walkthroughCompleted = localStorage.getItem('kedro_builder_walkthrough_completed');
    const hasProject = localStorage.getItem('kedro_builder_has_project');
    const savedProjectName = localStorage.getItem('kedro_builder_project_name');
    const savedDirectory = localStorage.getItem('kedro_builder_project_directory');

    // Determine initial flow state
    if (!tutorialCompleted) {
      // Show tutorial first
      dispatch(setShowTutorial(true));
    } else if (!walkthroughCompleted) {
      // Show walkthrough after tutorial
      dispatch(startWalkthrough());
    } else if (hasProject && savedProjectName) {
      // User has a project, load it
      dispatch(setHasActiveProject(true));
      dispatch(updateProjectName(savedProjectName));
    } else {
      // Walkthrough done but no project created
      dispatch(setHasActiveProject(false));
    }
  }, [dispatch]);

  const handleOpenTutorial = () => {
    dispatch(openTutorial());
  };

  const handleOpenWalkthrough = () => {
    dispatch(reopenWalkthrough());
  };

  // Editable project name handlers
  const handleStartEditProjectName = () => {
    setTempProjectName(projectName);
    setIsEditingProjectName(true);
  };

  const handleProjectNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempProjectName(e.target.value);
  };

  const handleSaveProjectName = () => {
    if (tempProjectName.trim() && /^[a-zA-Z0-9_-]+$/.test(tempProjectName)) {
      dispatch(updateProjectName(tempProjectName));
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
                        {hasActiveProject ? projectName : 'Untitled project'}
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
                title="Export Project (Coming Soon)"
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
    </div>
  );
}

export default App;
