import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { createProject as createProjectAction } from '../../features/project/projectSlice';
import { closeProjectSetup, setHasActiveProject } from '../../features/ui/uiSlice';
import './ProjectSetupModal.scss';

export const ProjectSetupModal: React.FC = () => {
  const dispatch = useDispatch();
  const [projectName, setProjectName] = useState('my-first-project');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState('');

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

  const handleCreate = () => {
    const isNameValid = validateProjectName(projectName);

    if (isNameValid) {
      // Create project with generated ID, timestamps, etc.
      dispatch(createProjectAction({
        name: projectName,
        description: description.trim(),
        pythonPackage: projectName.replace(/-/g, '_'), // Convert kebab-case to snake_case
        pipelineName: '__default__',
      }));

      // Set hasActiveProject to true so EmptyState is hidden
      dispatch(setHasActiveProject(true));

      // Close the modal
      dispatch(closeProjectSetup());
    }
  };

  const handleCancel = () => {
    dispatch(closeProjectSetup());
  };

  const handleProjectNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProjectName(e.target.value);
    if (nameError) validateProjectName(e.target.value);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
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
              Project name<span className="project-setup-modal__required">*</span>
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
            <span className="project-setup-modal__helper">
              Use lowercase letters, numbers, hyphens, and underscores
            </span>
          </div>

          {/* Description */}
          <div className="project-setup-modal__field">
            <label htmlFor="project-description" className="project-setup-modal__label">
              Description
            </label>
            <textarea
              id="project-description"
              className="project-setup-modal__textarea"
              value={description}
              onChange={handleDescriptionChange}
              placeholder="Describe what this pipeline does..."
              rows={3}
            />
            <span className="project-setup-modal__helper">
              Optional: Add a brief description of your pipeline
            </span>
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
