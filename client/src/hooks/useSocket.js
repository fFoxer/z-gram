import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useDispatch } from 'react-redux';
import { addMessage } from '../store/messageSlice';
import { incrementUnread, resetUnread, updateUserStatus } from '../store/chatSlice';

const SOCKET_URL = 'http://localhost:5000';

export const useSocket = (chatId, currentUserId) => {
  const socketRef = useRef(null);
  const dispatch = useDispatch();
  
  const activeChatIdRef = useRef(chatId);
  useEffect(() => {
    activeChatIdRef.current = chatId;
  }, [chatId]);

  // 1. Инициализация сокета
  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 3,
      });

      socketRef.current.on('connect', () => {
        console.log('✅ Socket connected');
        if (currentUserId) {
          socketRef.current.emit('authenticate', currentUserId);
        }
      });
    }

    const socket = socketRef.current;

    // Обработка входящих сообщений
    const handleMessage = (message) => {
      const currentActive = activeChatIdRef.current;
      console.log('📨 Пришло сообщение | Чат:', message.chatId, '| Активный:', currentActive);

      if (message.chatId === currentActive) {
        dispatch(addMessage(message));
        socket.emit('chat_read', { chatId: currentActive, userId: currentUserId });
        dispatch(resetUnread(currentActive));
      } else {
        dispatch(incrementUnread(message.chatId));
      }
    };

    // ✅ Обработка изменения статуса пользователя
    const handleStatusChange = ({ userId, isOnline }) => {
      console.log(`🟢 Статус пользователя ${userId}: ${isOnline ? 'онлайн' : 'оффлайн'}`);
      dispatch(updateUserStatus({ userId, isOnline }));
    };

    socket.on('receive_message', handleMessage);
    socket.on('user_status_changed', handleStatusChange);

    return () => {
      socket.off('receive_message', handleMessage);
      socket.off('user_status_changed', handleStatusChange);
    };
  }, [currentUserId, dispatch]);

  // 2. Управление комнатами
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !chatId) return;

    socket.emit('join_chat', chatId);
    console.log(`👥 Joined chat_${chatId}`);

    return () => {
      socket.emit('leave_chat', chatId);
      console.log(`👥 Left chat_${chatId}`);
    };
  }, [chatId]);

  return socketRef.current;
};