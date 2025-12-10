import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Dil yükle
export const loadLanguage = createAsyncThunk('language/load', async () => {
  const savedLanguage = await AsyncStorage.getItem('language');
  return savedLanguage || 'tr';
});

// Dil kaydet
export const saveLanguage = createAsyncThunk('language/save', async (language) => {
  await AsyncStorage.setItem('language', language);
  return language;
});

const initialState = {
  language: 'tr',
  loading: false,
};

const languageSlice = createSlice({
  name: 'language',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadLanguage.fulfilled, (state, action) => {
        state.language = action.payload;
        state.loading = false;
      })
      .addCase(saveLanguage.fulfilled, (state, action) => {
        state.language = action.payload;
      });
  },
});

export default languageSlice.reducer; 