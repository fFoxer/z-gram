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
    list: [],
    messages: [],
    activeChat: localStorage.getItem('activeChatId') ? parseInt(localStorage.getItem('activeChatId')) : null,
    loading: false,
    error: null,
    userStatuses: {}
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
    },
    // ✅ Обновление статуса пользователя
    updateUserStatus: (state, action) => {
      const { userId, isOnline } = action.payload;
      state.userStatuses[userId] = isOnline;
      
      // Обновляем is_online в чатах
      state.list.forEach(chat => {
        if (chat.type === 'private') {
          // Проверяем, что это чат с этим пользователем
          if (chat.user_id === userId) {
            console.log(`📝 Обновляю статус чата "${chat.name}" (user_id=${userId}): ${isOnline ? 'ОНЛАЙН' : 'ОФФЛАЙН'}`);
            chat.is_online = isOnline;
          }
        }
      });
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

export const { 
  setActiveChat, 
  clearActiveChat, 
  addMessage, 
  clearMessages, 
  incrementUnread, 
  resetUnread,
  updateUserStatus 
} = chatSlice.actions;

export default chatSlice.reducer;