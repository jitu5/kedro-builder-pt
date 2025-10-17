import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ValidationState } from '../../types/redux';
import { ValidationError } from '../../types/kedro';

const initialState: ValidationState = {
  errors: [],
  warnings: [],
  isValid: true,
  lastChecked: null,
};

const validationSlice = createSlice({
  name: 'validation',
  initialState,
  reducers: {
    setValidationErrors: (state, action: PayloadAction<ValidationError[]>) => {
      const errors = action.payload.filter((e) => e.severity === 'error');
      const warnings = action.payload.filter((e) => e.severity === 'warning');

      state.errors = errors;
      state.warnings = warnings;
      state.isValid = errors.length === 0;
      state.lastChecked = Date.now();
    },
    clearValidation: (state) => {
      state.errors = [];
      state.warnings = [];
      state.isValid = true;
      state.lastChecked = null;
    },
  },
});

export const {
  setValidationErrors,
  clearValidation,
} = validationSlice.actions;

export default validationSlice.reducer;
