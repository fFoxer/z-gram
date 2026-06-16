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

const playNotificationSound = async () => {
  try {
    const volume = JSON.parse(localStorage.getItem('notif_volume') ?? '80');
    if (volume === 0) return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') await ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.value = (volume / 100) * 0.4;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.stop(ctx.currentTime + 0.35);
  } catch {}
};

const showBrowserNotification = (senderName, text) => {
  if (Notification.permission !== 'granted') return;
  try {
    new Notification(senderName || 'Z-Gram', {
      body: text,
      icon: '/favicon.ico',
    });
  } catch {}
};

export const useSocket = (chatId, currentUserId, onNotification) => {
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);
  const currentUserIdRef = useRef(currentUserId);
  const onNotificationRef = useRef(onNotification);
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

  useEffect(() => {
    onNotificationRef.current = onNotification;
  }, [onNotification]);

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

        const notifEnabled = JSON.parse(localStorage.getItem('notif_enabled') ?? 'false');
        const mutedChats = JSON.parse(localStorage.getItem('muted_chats') ?? '[]');
        const isMuted = mutedChats.includes(message.chatId);
        if (notifEnabled && !isMuted) {
          const chat = chatListRef.current.find(c => c.id === message.chatId);
          const text = getLastMessageText(message);
          console.log('🔔 Firing notification | chat:', chat?.name, '| text:', text);
          playNotificationSound();
          if (document.hidden) {
            showBrowserNotification(chat?.name || 'Z-Gram', text);
          }
          onNotificationRef.current?.({ name: chat?.name || 'Z-Gram', text, avatar: chat?.avatar });
        }
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

  // 2. Вступаем во все комнаты чатов чтобы получать сообщения из любого чата
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !chatList.length) return;
    chatList.forEach(chat => socket.emit('join_chat', chat.id));
  }, [chatList]);

  return socket;
};