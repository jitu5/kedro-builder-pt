import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ProjectState } from '../../types/redux';
import { KedroProject, ProjectMetadata } from '../../types/kedro';

const initialState: ProjectState = {
  current: null,
  savedList: [],
  lastSaved: null,
};

const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    createProject: (state, action: PayloadAction<Omit<KedroProject, 'id' | 'createdAt' | 'updatedAt'>>) => {
      const now = Date.now();
      state.current = {
        ...action.payload,
        id: `project-${now}`,
        createdAt: now,
        updatedAt: now,
      };
    },
    loadProject: (state, action: PayloadAction<KedroProject>) => {
      state.current = action.payload;
    },
    updateProject: (state, action: PayloadAction<Partial<KedroProject>>) => {
      if (state.current) {
        state.current = {
          ...state.current,
          ...action.payload,
          updatedAt: Date.now(),
        };
      }
    },
    setSavedList: (state, action: PayloadAction<ProjectMetadata[]>) => {
      state.savedList = action.payload;
    },
    setLastSaved: (state, action: PayloadAction<number>) => {
      state.lastSaved = action.payload;
    },
  },
});

export const {
  createProject,
  loadProject,
  updateProject,
  setSavedList,
  setLastSaved,
} = projectSlice.actions;

export default projectSlice.reducer;
