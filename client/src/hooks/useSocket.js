import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';
import { addMessage } from '../store/messageSlice';
import { incrementUnread, resetUnread } from '../store/chatSlice';

const SOCKET_URL = 'http://localhost:5000';

export const useSocket = (chatId, currentUserId) => {
  const socketRef = useRef(null);
  const dispatch = useDispatch();
  
  // ✅ Ref для хранения актуального ID чата без пересоздания эффектов
  const activeChatIdRef = useRef(chatId);
  useEffect(() => {
    activeChatIdRef.current = chatId;
  }, [chatId]);

  // 1. Инициализация сокета (запускается 1 раз)
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

    // ✅ Глобальный слушатель (не отвязывается при смене чата)
    const handleMessage = (message) => {
      const currentActive = activeChatIdRef.current;
      console.log('📨 Пришло сообщение | Чат:', message.chatId, '| Активный:', currentActive);

      if (message.chatId === currentActive) {
        dispatch(addMessage(message));
        // Сразу помечаем как прочитанное
        socket.emit('chat_read', { chatId: currentActive, userId: currentUserId });
        dispatch(resetUnread(currentActive));
      } else {
        dispatch(incrementUnread(message.chatId));
      }
    };

    socket.on('receive_message', handleMessage);

    return () => {
      socket.off('receive_message', handleMessage);
    };
  }, [currentUserId, dispatch]); // ✅ chatId убран из зависимостей!

  // 2. Управление комнатами (запускается при смене чата)
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !chatId) return;

    socket.emit('join_chat', chatId);
    console.log(` Joined chat_${chatId}`);

    return () => {
      socket.emit('leave_chat', chatId);
      console.log(` Left chat_${chatId}`);
    };
  }, [chatId]);

  return socketRef.current;
};