import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import SearchIcon from '../icons/SearchIcon';
import CallEndIcon from '../icons/CallEndIcon';
import MoreVertIcon from '../icons/MoreVertIcon';
import { IoPeople } from 'react-icons/io5';

const ChatHeader = ({ socket }) => {
  const activeChatId = useSelector((state) => state.chats?.activeChat);
  const chats = useSelector((state) => state.chats?.list) || [];
  const currentUserId = useSelector((state) => state.auth?.user?.id);
  const chat = chats.find((c) => c.id === activeChatId);

  const [isOnline, setIsOnline] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [participants, setParticipants] = useState([]);

  // ✅ Обновляем isOnline, когда меняется чат или его is_online из Redux
  useEffect(() => {
    if (chat?.type === 'private') {
      setIsOnline(chat.is_online || false);
    } else {
      setIsOnline(false);
    }
  }, [chat?.id, chat?.is_online]);

  // ✅ Загрузка участников для группового чата
  useEffect(() => {
    if (!chat || chat.type !== 'group') {
      setParticipants([]);
      return;
    }

    const token = localStorage.getItem('accessToken');
    axios.get(`http://localhost:5000/api/chats/${chat.id}/participants`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setParticipants(res.data))
    .catch(err => console.error('Error fetching participants:', err));
  }, [chat]);

  // Слушатели сокетов (онлайн / печатает)
  useEffect(() => {
    if (!socket || !chat) return;

    // ✅ Для личных чатов: получаем ID собеседника
    const otherUserId = chat.type === 'private' ? chat.user_id : null;

    const handleStatus = ({ userId, isOnline: status }) => {
      // ✅ Обновляем статус ТОЛЬКО если это собеседник в личном чате
      if (chat.type === 'private' && userId === otherUserId) {
        console.log(`🟢 Статус собеседника ${userId}: ${status ? 'ОНЛАЙН' : 'ОФФЛАЙН'}`);
        setIsOnline(status);
      }
    };

    const handleTyping = ({ userId, isTyping: typing }) => {
      // ✅ "Печатает" тоже только от собеседника
      if (chat.type === 'private' && userId === otherUserId) {
        console.log(`✍️ Пользователь ${userId} ${typing ? 'печатает' : 'перестал'}`);
        setIsTyping(typing);
      }
    };

    // ✅ Слушатель: новый участник в группе
    const handleParticipantAdded = ({ chatId, userId }) => {
      if (chatId === activeChatId && chat?.type === 'group') {
        const token = localStorage.getItem('accessToken');
        axios.get(`http://localhost:5000/api/chats/${chatId}/participants`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(res => setParticipants(res.data));
      }
    };

    socket.on('user_status_changed', handleStatus);
    socket.on('user_typing', handleTyping);
    socket.on('participant_added', handleParticipantAdded);

    return () => {
      socket.off('user_status_changed', handleStatus);
      socket.off('user_typing', handleTyping);
      socket.off('participant_added', handleParticipantAdded);
    };
  }, [socket, chat, activeChatId]);

  if (!chat) return null;

  // ✅ Формируем статус-текст
  const getStatusText = () => {
    if (chat.type === 'group') return `${participants.length} участников`;
    if (isTyping) return 'печатает...';
    return isOnline ? 'онлайн' : 'был(а) недавно';
  };

  return (
    <div className="h-[60px] bg-[#373737] border-b border-[#222] flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-[#484849] flex items-center justify-center text-white font-bold overflow-hidden">
             {chat.avatar ? (
               <img src={chat.avatar} className="w-full h-full object-cover" alt=""/>
             ) : chat.type === 'group' ? (
               <IoPeople size={24} className="text-gray-300" />
             ) : (
               chat.name?.[0]?.toUpperCase() || 'U'
             )}
          </div>
          {/* 🟢 Точка онлайн (только для личных чатов) */}
          {chat.type === 'private' && isOnline && !isTyping && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#373737]"></div>
          )}
        </div>
        <div>
          <h3 className="text-white font-bold text-base">
            {chat.name}
            {chat.type === 'group' && (
              <span className="ml-2 text-gray-400 font-normal text-xs">
                ({participants.length})
              </span>
            )}
          </h3>
          <p className={`text-xs transition-colors ${
            isTyping ? 'text-blue-400 animate-pulse' : 'text-gray-400'
          }`}>
            {getStatusText()}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-4 text-gray-400">
        <button className="hover:text-white transition">
          <SearchIcon className="w-5 h-5" />
        </button>
        <button className="hover:text-white transition">
          <CallEndIcon className="w-5 h-5" />
        </button>
        {chat.type === 'group' && (
          <button className="hover:text-white transition relative" title="Участники">
            <IoPeople size={20} />
            {participants.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-[9px] text-white rounded-full flex items-center justify-center">
                {participants.length}
              </span>
            )}
          </button>
        )}
        <button className="hover:text-white transition">
          <MoreVertIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;