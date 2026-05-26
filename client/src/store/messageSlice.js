import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../services/endpointConfig';


export const fetchMessages = createAsyncThunk(
  'messages/fetchMessages',
  async (chatId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/chats/${chatId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch messages' });
    }
  }
);

const messageSlice = createSlice({
  name: 'messages',
  initialState: {
    list: [],
    loading: false,
    error: null,
    chatId: null,
  },
  reducers: {
    addMessage: (state, action) => {
      state.list.push(action.payload);
    },
    clearMessages: (state) => {
      state.list = [];
      state.error = null;
    },
    // ✅ Обновить сообщение (редактирование)
        // ✅ Обновить сообщение (редактирование)
    updateMessage: (state, action) => {
      const { id, content, is_edited } = action.payload;
      const msg = state.list.find(m => m.id === id);
      if (msg) {
        msg.content = content;
        msg.is_edited = is_edited;
      }
    },
    // ✅ Удалить сообщение
    deleteMessage: (state, action) => {
      const id = action.payload;
      state.list = state.list.filter(m => m.id !== id);
    },
    // Пометить как прочитанное
    markAsRead: (state, action) => {
      state.list = state.list.map(msg => ({ ...msg, is_read: true }));
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMessages.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Unknown error';
      });
  },
});

export const { addMessage, clearMessages, updateMessage, deleteMessage, markAsRead } = messageSlice.actions;
export default messageSlice.reducer;