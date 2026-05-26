import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';
import { addMessage } from '../store/messageSlice';
import { fetchChats, incrementUnread, resetUnread, setUserStatus, updateChatPreview, updateChatMeta } from '../store/chatSlice';
import { SOCKET_URL } from '../services/endpointConfig';


const getLastMessageText = (message) => {
  if (message.type === 'voice') return '🎤 Голосовое';
  if (message.type === 'image') return '🖼 Изображение';
  if (message.type === 'video') return '📹 Видео';
  if (message.type === 'file') return '📎 Файл';
  return message.content || '';
};

export const useSocket = (chatId, currentUserId) => {
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);
  const currentUserIdRef = useRef(currentUserId);
  const dispatch = useDispatch();
  const chatListRef = useRef([]);
  const chatList = useSelector((state) => state.chats.list);

  useEffect(() => {
    chatListRef.current = chatList;
  }, [chatList]);
  
  const activeChatIdRef = useRef(chatId);
  useEffect(() => {
    activeChatIdRef.current = chatId;
  }, [chatId]);

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  // 1. Инициализация сокета
  useEffect(() => {
    if (!socketRef.current) {
      const newSocket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 3,
      });

      socketRef.current = newSocket;
      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('✅ Socket connected');
        if (currentUserIdRef.current) {
          newSocket.emit('authenticate', currentUserIdRef.current);
        }
      });
    } else if (currentUserId && socketRef.current.connected) {
      socketRef.current.emit('authenticate', currentUserId);
    }

    const activeSocket = socketRef.current;
    if (!activeSocket) return;

    // Обработка входящих сообщений
    const handleMessage = (message) => {
      const currentActive = activeChatIdRef.current;
      console.log('📨 Пришло сообщение | Чат:', message.chatId, '| Активный:', currentActive);

      const chatExists = chatListRef.current.some(c => c.id === message.chatId);

      if (!chatExists) {
        // Новый чат — перезагружаем список полностью
        dispatch(fetchChats());
      } else {
        // Обновляем превью (последнее сообщение + время) и поднимаем чат наверх
        dispatch(updateChatPreview({
          chatId: message.chatId,
          lastMessage: getLastMessageText(message),
          time: message.time,
        }));
      }

      if (message.chatId === currentActive) {
        dispatch(addMessage(message));
        activeSocket.emit('chat_read', { chatId: currentActive, userId: currentUserId });
        dispatch(resetUnread(currentActive));
      } else {
        dispatch(incrementUnread(message.chatId));
      }
    };

    const handleStatusChange = ({ userId, isOnline }) => {
      dispatch(setUserStatus({ userId, isOnline }));
    };

    const handleProfileUpdated = ({ userId, avatar_url, full_name, username }) => {
      dispatch(updateChatMeta({
        userId,
        avatar: avatar_url,
        name: full_name || username,
      }));
    };

    activeSocket.on('receive_message', handleMessage);
    activeSocket.on('user_status_changed', handleStatusChange);
    activeSocket.on('user_profile_updated', handleProfileUpdated);

    return () => {
      activeSocket.off('receive_message', handleMessage);
      activeSocket.off('user_status_changed', handleStatusChange);
      activeSocket.off('user_profile_updated', handleProfileUpdated);
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

  return socket;
};