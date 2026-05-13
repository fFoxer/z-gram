import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import chatReducer from './chatSlice';
import messageReducer from './messageSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chats: chatReducer,
    messages: messageReducer,
  },
});

export default store;