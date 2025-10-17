import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ThemeState } from '../../types/redux';

const initialState: ThemeState = {
  theme: 'dark', // Default to dark theme (like Kedro-Viz)
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
  },
});

export const { setTheme, toggleTheme } = themeSlice.actions;
export default themeSlice.reducer;
