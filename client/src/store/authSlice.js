import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// === ASYNC THUNKS ===

export const login = createAsyncThunk(
  'auth/login',
  async ({ phone, password }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { phone, password });
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Login failed' });
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async ({ username, phone, password, country_code, full_name }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, { 
        username, phone, password, country_code, full_name 
      });
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Registration failed' });
    }
  }
);

// 1. Локальный выход (очистка фронта + сокет)
export const logoutStart = createAsyncThunk(
  'auth/logoutStart',
  async (_, { rejectWithValue }) => {
    try {
      // ✅ Уведомляем сервер о выходе (чтобы обновить статус в БД)
      const socket = window.__socket__;
      const userId = JSON.parse(atob(localStorage.getItem('accessToken')?.split('.')[1] || '{}'))?.id;
      
      if (socket?.connected && userId) {
        socket.emit('logout', userId);
      }
      
      // Локальный выход
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('activeChatId');
      return;
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

// 2. Серверный выход (запрос к API для инвалидации токенов)
export const logoutServer = createAsyncThunk(
  'auth/logoutServer',
  async (_, { rejectWithValue }) => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await axios.post(`${API_URL}/auth/logout`, { refreshToken });
    } catch (error) {
      // Игнорируем ошибки, если токен уже истёк
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (data, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.put(`${API_URL}/users/me`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Update failed' });
    }
  }
);

// === SLICE ===

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  },
  reducers: {
    // Синхронный редюсер для мгновенной очистки стейта
    clearAuth: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
      })
      // Register
      .addCase(register.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
      })
      // Logout
      .addCase(logoutStart.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
      })
      // Update Profile
      .addCase(updateProfile.fulfilled, (state, action) => {
        if (state.user) {
          state.user = { ...state.user, ...action.payload };
        }
      });
  },
});

export const { clearAuth } = authSlice.actions;
export default authSlice.reducer;