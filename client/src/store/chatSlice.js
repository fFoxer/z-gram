import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';



export const fetchChats = createAsyncThunk(
  'chats/fetchChats',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/chats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch chats' });
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'messages/fetchMessages',
  async (chatId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/chats/${chatId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch messages' });
    }
  }
);

const chatSlice = createSlice({
  name: 'chats',
  initialState: {
    list: [],           // ✅ Список чатов
    messages: [],       // ✅ Сообщения текущего чата
    activeChat: localStorage.getItem('activeChatId') ? parseInt(localStorage.getItem('activeChatId')) : null,
    loading: false,
    error: null,
  },
  reducers: {
    incrementUnread: (state, action) => {
    const chatId = action.payload;
    const chat = state.list.find(c => c.id === chatId);
    if (chat) {
      chat.unread += 1;
    }
  },
  resetUnread: (state, action) => {
    const chatId = action.payload;
    const chat = state.list.find(c => c.id === chatId);
    if (chat) {
      chat.unread = 0;
    }
  },
    setActiveChat: (state, action) => {
      state.activeChat = action.payload;
      localStorage.setItem('activeChatId', action.payload);
    },
    clearActiveChat: (state) => {
      state.activeChat = null;
      localStorage.removeItem('activeChatId');
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    clearMessages: (state) => {
      state.messages = [];
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChats.pending, (state) => { state.loading = true; })
      .addCase(fetchChats.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchChats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
      })
      .addCase(fetchMessages.pending, (state) => { state.loading = true; })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = action.payload;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message;
      });
  },
});

export const { setActiveChat, clearActiveChat, addMessage, clearMessages, incrementUnread, resetUnread } = chatSlice.actions;
export default chatSlice.reducer; // ✅ Важный экспорт!