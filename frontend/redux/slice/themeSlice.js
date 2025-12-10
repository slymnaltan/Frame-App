import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Tema yükle
export const loadTheme = createAsyncThunk('theme/load', async () => {
  const savedTheme = await AsyncStorage.getItem('theme');
  return savedTheme || 'dark';
});

// Tema kaydet
export const saveTheme = createAsyncThunk('theme/save', async (theme) => {
  await AsyncStorage.setItem('theme', theme);
  return theme;
});

const initialState = {
  theme: 'dark',
  loading: false,
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadTheme.fulfilled, (state, action) => {
        state.theme = action.payload;
        state.loading = false;
      })
      .addCase(saveTheme.fulfilled, (state, action) => {
        state.theme = action.payload;
      });
  },
});

export const { toggleTheme } = themeSlice.actions;
export default themeSlice.reducer; 