import React, { useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { createProject, closeProjectSetup } from '../../features/ui/uiSlice';
import './ProjectSetupModal.scss';

export const ProjectSetupModal: React.FC = () => {
  const dispatch = useDispatch();
  const [projectName, setProjectName] = useState('my-first-project');
  const [directory, setDirectory] = useState('');
  const [nameError, setNameError] = useState('');
  const [directoryError, setDirectoryError] = useState('');
  const directoryInputRef = useRef<HTMLInputElement>(null);

  // Validate project name (alphanumeric, hyphens, underscores, no spaces)
  const validateProjectName = (name: string): boolean => {
    if (!name.trim()) {
      setNameError('Project name is required');
      return false;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      setNameError('Only letters, numbers, hyphens, and underscores allowed');
      return false;
    }
    setNameError('');
    return true;
  };

  // Validate directory
  const validateDirectory = (dir: string): boolean => {
    if (!dir.trim()) {
      setDirectoryError('Save directory is required');
      return false;
    }
    setDirectoryError('');
    return true;
  };

  const handleBrowse = async () => {
    try {
      // Check if File System Access API is supported
      if ('showDirectoryPicker' in window) {
        // @ts-ignore - TypeScript may not have types for this API yet
        const dirHandle = await window.showDirectoryPicker();
        setDirectory(dirHandle.name);
        setDirectoryError('');
      } else {
        // Fallback: Focus on input for manual entry
        directoryInputRef.current?.focus();
        alert('Please enter the directory path manually. Browser does not support directory picker.');
      }
    } catch (error) {
      // User cancelled or error occurred
      console.log('Directory selection cancelled');
    }
  };

  const handleCreate = () => {
    const isNameValid = validateProjectName(projectName);
    const isDirValid = validateDirectory(directory);

    if (isNameValid && isDirValid) {
      dispatch(createProject({ name: projectName, directory }));
    }
  };

  const handleCancel = () => {
    dispatch(closeProjectSetup());
  };

  const handleProjectNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProjectName(e.target.value);
    if (nameError) validateProjectName(e.target.value);
  };

  const handleDirectoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDirectory(e.target.value);
    if (directoryError) validateDirectory(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreate();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className="project-setup-modal">
      <div className="project-setup-modal__backdrop" onClick={handleCancel} />

      <div className="project-setup-modal__container">
        <h2 className="project-setup-modal__title">Set up your project</h2>

        <div className="project-setup-modal__form">
          {/* Project Name */}
          <div className="project-setup-modal__field">
            <label htmlFor="project-name" className="project-setup-modal__label">
              Kedro project name<span className="project-setup-modal__required">*</span>
            </label>
            <input
              id="project-name"
              type="text"
              className={`project-setup-modal__input ${
                nameError ? 'project-setup-modal__input--error' : ''
              }`}
              value={projectName}
              onChange={handleProjectNameChange}
              onKeyDown={handleKeyDown}
              placeholder="my-first-project"
              autoFocus
            />
            {nameError && <span className="project-setup-modal__error">{nameError}</span>}
          </div>

          {/* Save Directory */}
          <div className="project-setup-modal__field">
            <label htmlFor="save-directory" className="project-setup-modal__label">
              Save directory<span className="project-setup-modal__required">*</span>
            </label>
            <div className="project-setup-modal__input-group">
              <input
                id="save-directory"
                type="text"
                ref={directoryInputRef}
                className={`project-setup-modal__input ${
                  directoryError ? 'project-setup-modal__input--error' : ''
                }`}
                value={directory}
                onChange={handleDirectoryChange}
                onKeyDown={handleKeyDown}
                placeholder="Add text"
              />
              <button
                type="button"
                className="project-setup-modal__browse-button"
                onClick={handleBrowse}
              >
                Browse
              </button>
            </div>
            {directoryError && <span className="project-setup-modal__error">{directoryError}</span>}
          </div>
        </div>

        {/* Actions */}
        <div className="project-setup-modal__actions">
          <button
            className="project-setup-modal__button project-setup-modal__button--cancel"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            className="project-setup-modal__button project-setup-modal__button--create"
            onClick={handleCreate}
          >
            Create Project
          </button>
        </div>
      </div>
    </div>
  );
};
