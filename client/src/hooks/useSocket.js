import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useDispatch } from 'react-redux';
import { addMessage } from '../store/messageSlice';
import { incrementUnread } from '../store/chatSlice';

const SOCKET_URL = 'http://localhost:5000';

export const useSocket = (chatId, currentUserId) => {
  const socketRef = useRef(null);
  const dispatch = useDispatch();

  useEffect(() => {
    // Создаём сокет один раз
    if (!socketRef.current) {
      socketRef.current = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 3,
      });

      // ✅ Сохраняем глобально для доступа из authSlice
      if (typeof window !== 'undefined') {
        window.__socket__ = socketRef.current;
      }

      socketRef.current.on('connect', () => {
        console.log('✅ Socket connected:', socketRef.current.id);
        if (currentUserId) {
          socketRef.current.emit('authenticate', currentUserId);
        }
      });

      socketRef.current.on('connect_error', (err) => {
        console.error('❌ Socket connection error:', err.message);
      });
    }

    const socket = socketRef.current;

    // Авторизация при изменении userId
    if (socket?.connected && currentUserId) {
      socket.emit('authenticate', currentUserId);
    }

    // Комнаты
    if (chatId && socket) {
      socket.emit('join_chat', chatId);
    }

    // Сообщения
    const handleMessage = (message) => {
      // Если сообщение пришло в чат, который мы СЕЙЧАС не смотрим
      if (message.chatId !== chatId) {
        dispatch(incrementUnread(message.chatId)); // ✅ Обновляем счетчик в сайдбаре
      } else {
        // Если смотрим этот чат — просто добавляем сообщение
        dispatch(addMessage(message));
      }
    };

    if (socket) {
      socket.on('receive_message', handleMessage);
    }
    socket.on('participant_added', (data) => {
  if (data.chatId === chatId) {
    // Можно обновить список участников или показать уведомление
    console.log(' Новый участник в группе:', data.userId);
    // Если есть локальный стейт участников, обнови его здесь
  }
});

    // Очистка
    return () => {
      socket.off('participant_added');
      if (chatId && socket) socket.emit('leave_chat', chatId);
      if (socket) socket.off('receive_message', handleMessage);
    };
  }, [chatId, currentUserId, dispatch]);

  return socketRef.current;
};