import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { clearActiveChat } from '../store/chatSlice';
import axios from 'axios';
import SearchIcon from '../icons/SearchIcon';
import { API_URL } from '../services/endpointConfig';
import CallEndIcon from '../icons/CallEndIcon';
import MoreVertIcon from '../icons/MoreVertIcon';
import { IoPeople, IoVideocam, IoArrowBack, IoChevronUp, IoChevronDown } from 'react-icons/io5';

const ChatHeader = ({
  socket, onStartCall, isCallReady,
  isSearchOpen, searchQuery, matchCount, currentMatchIdx,
  onSearchOpen, onSearchClose, onSearchChange, onSearchNavigate,
}) => {
  const dispatch = useDispatch();
  const activeChatId = useSelector((state) => state.chats?.activeChat);
  const chats = useSelector((state) => state.chats?.list) || [];
  const currentUserId = useSelector((state) => state.auth?.user?.id);
  const chat = chats.find((c) => c.id === activeChatId);

  // ✅ Глобальный словарь статусов из Redux
  const userStatuses = useSelector((state) => state.chats?.userStatuses || {});

  const [isTyping, setIsTyping] = useState(false);
  const [participants, setParticipants] = useState([]);

  // ✅ Находим ID собеседника
  const otherParticipant = chat?.participants?.find((participant) => {
    if (participant == null) return false;
    return typeof participant === 'object' ? participant.id !== currentUserId : participant !== currentUserId;
  });
  const otherParticipantId = typeof otherParticipant === 'object' ? otherParticipant.id : otherParticipant;
  const interlocutorId = chat?.type === 'private'
    ? (chat.userId || otherParticipantId)
    : null;
  const interlocutorKey = interlocutorId != null ? String(interlocutorId) : null;

  // ✅ Статус из Redux
  const isOnline = interlocutorKey ? userStatuses[interlocutorKey] : false;

  // Загрузка участников группы
  useEffect(() => {
    if (!chat || chat.type !== 'group') {
      setParticipants([]);
      return;
    }
    const token = localStorage.getItem('accessToken');
    axios.get(`${API_URL}/chats/${chat.id}/participants`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setParticipants(res.data))
      .catch(err => console.error('Error fetching participants:', err));
  }, [chat, chat?.id, chat?.type]);

  // Слушатели сокетов
  useEffect(() => {
    if (!socket || !chat) return;

    const handleTyping = ({ userId, isTyping: typing }) => {
      if (chat.type === 'private' && userId === interlocutorId) {
        setIsTyping(typing);
      }
    };

    const handleParticipantAdded = ({ chatId }) => {
      if (chatId === activeChatId && chat?.type === 'group') {
        const token = localStorage.getItem('accessToken');
        axios.get(`${API_URL}/chats/${chatId}/participants`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(res => setParticipants(res.data));
      }
    };

    socket.on('user_typing', handleTyping);
    socket.on('participant_added', handleParticipantAdded);

    return () => {
      socket.off('user_typing', handleTyping);
      socket.off('participant_added', handleParticipantAdded);
    };
  }, [socket, chat, activeChatId, interlocutorId]);

  if (!chat) return (
    <div className="h-[60px] bg-[#373737] border-b border-[#222] flex items-center px-4">
      <button onClick={() => dispatch(clearActiveChat())} className="md:hidden text-gray-400 hover:text-white transition p-1">
        <IoArrowBack size={22} />
      </button>
    </div>
  );

  const getStatusText = () => {
    if (chat.type === 'group') return `${participants.length} участников`;
    if (isTyping) return 'печатает...';
    return isOnline ? 'онлайн' : 'был(а) недавно';
  };

  // ✅ Обработчики начала звонка (разделены на видео/аудио)
  const handleStartVideoCall = () => {
    if (chat.type === 'private' && interlocutorId && onStartCall) {
      onStartCall(interlocutorId, { video: true });
    }
  };

  const handleStartAudioCall = () => {
    if (chat.type === 'private' && interlocutorId && onStartCall) {
      onStartCall(interlocutorId, { video: false });
    }
  };

  if (isSearchOpen) {
    const hasQuery = searchQuery.trim().length > 0;
    return (
      <div className="h-[60px] bg-[#373737] border-b border-[#222] flex items-center px-4 gap-3">
        <button onClick={onSearchClose} className="text-gray-400 hover:text-white transition flex-shrink-0">
          <IoArrowBack size={20} />
        </button>
        <input
          autoFocus
          type="text"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Поиск по сообщениям..."
          className="flex-1 bg-[#484849] text-white text-sm rounded-lg py-1.5 px-3 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
        />
        {hasQuery && (
          <span className="text-xs text-gray-400 flex-shrink-0 min-w-[52px] text-center">
            {matchCount > 0 ? `${currentMatchIdx + 1} / ${matchCount}` : 'Нет'}
          </span>
        )}
        <button
          onClick={() => onSearchNavigate(-1)}
          disabled={matchCount === 0}
          className="text-gray-400 hover:text-white transition disabled:opacity-30 flex-shrink-0"
          title="Предыдущее"
        >
          <IoChevronUp size={20} />
        </button>
        <button
          onClick={() => onSearchNavigate(1)}
          disabled={matchCount === 0}
          className="text-gray-400 hover:text-white transition disabled:opacity-30 flex-shrink-0"
          title="Следующее"
        >
          <IoChevronDown size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="h-[60px] bg-[#373737] border-b border-[#222] flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => dispatch(clearActiveChat())}
          className="md:hidden text-gray-400 hover:text-white transition p-1 flex-shrink-0"
        >
          <IoArrowBack size={22} />
        </button>
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
          {chat.type === 'private' && isOnline && !isTyping && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#373737]"></div>
          )}
        </div>
        <div>
          <h3 className="text-white font-bold text-base">
            {chat.name}
            {chat.type === 'group' && (
              <span className="ml-2 text-gray-400 font-normal text-xs">({participants.length})</span>
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
        <button onClick={onSearchOpen} className="hover:text-white transition" title="Поиск">
          <SearchIcon className="w-5 h-5" />
        </button>
        {chat.type === 'private' && isOnline && (
          <button className="transition hover:text-green-400" onClick={handleStartVideoCall} title="Начать видеозвонок">
            <IoVideocam size={20} />
          </button>
        )}
        {chat.type === 'private' && isOnline && (
          <button className="transition hover:text-white" onClick={handleStartAudioCall} title="Начать аудиозвонок">
            <CallEndIcon className="w-5 h-5" />
          </button>
        )}
        {chat.type === 'group' && (
          <button className="hover:text-white transition relative" title="Участники">
            <IoPeople size={20} />
            {participants.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-[9px] text-white rounded-full flex items-center justify-center">{participants.length}</span>
            )}
          </button>
        )}
        <button className="hover:text-white transition"><MoreVertIcon className="w-5 h-5" /></button>
      </div>
    </div>
  );
};

export default ChatHeader;