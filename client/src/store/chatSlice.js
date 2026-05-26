import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL, resolveUrl } from '../services/endpointConfig';

const loadFromStorage = (key, fallback) => {
  try {
    const val = localStorage.getItem(key);
    return val !== null ? JSON.parse(val) : fallback;
  } catch { return fallback; }
};


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
    userStatuses: {},
    pinnedChats: loadFromStorage('pinnedChats', []),
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
    setUserStatus: (state, action) => {
      const { userId, isOnline } = action.payload;
      state.userStatuses[String(userId)] = isOnline;
    },
    togglePinChat: (state, action) => {
      const chatId = action.payload;
      const idx = state.pinnedChats.indexOf(chatId);
      if (idx !== -1) state.pinnedChats.splice(idx, 1);
      else state.pinnedChats.push(chatId);
      localStorage.setItem('pinnedChats', JSON.stringify(state.pinnedChats));
    },
    updateChatMeta: (state, action) => {
      const { userId, avatar, name } = action.payload;
      state.list.forEach(chat => {
        if (chat.type === 'private' && String(chat.userId) === String(userId)) {
          if (avatar !== undefined) chat.avatar = resolveUrl(avatar);
          if (name)                 chat.name   = name;
        }
      });
    },
    reorderPinned: (state, action) => {
      state.pinnedChats = action.payload;
      localStorage.setItem('pinnedChats', JSON.stringify(action.payload));
    },
    // Обновляет превью чата (последнее сообщение + время) и поднимает его наверх
    updateChatPreview: (state, action) => {
      const { chatId, lastMessage, time } = action.payload;
      const idx = state.list.findIndex(c => c.id === chatId);
      if (idx !== -1) {
        state.list[idx].last_message = lastMessage;
        state.list[idx].time = time;
        const [chat] = state.list.splice(idx, 1);
        state.list.unshift(chat);
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChats.pending, (state) => { state.loading = true; })
      .addCase(fetchChats.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.map(chat => ({
          ...chat,
          avatar: resolveUrl(chat.avatar_url || chat.avatar),
        }));
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
  setUserStatus,
  updateChatPreview,
  updateChatMeta,
  togglePinChat,
  reorderPinned,
} = chatSlice.actions;

export default chatSlice.reducer;