import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { clearActiveChat, removeChat } from '../store/chatSlice';
import { clearMessages } from '../store/messageSlice';
import axios from 'axios';
import api from '../services/api';
import SearchIcon from '../icons/SearchIcon';
import { API_URL } from '../services/endpointConfig';
import CallEndIcon from '../icons/CallEndIcon';
import MoreVertIcon from '../icons/MoreVertIcon';
import {
  IoPeople, IoVideocam, IoArrowBack, IoChevronUp, IoChevronDown,
  IoNotificationsOff, IoNotifications, IoPerson, IoTrash, IoClose,
} from 'react-icons/io5';

const MenuItem = ({ icon: Icon, onClick, danger, children }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition text-left
      ${danger ? 'text-red-400 hover:bg-red-600/20' : 'text-gray-300 hover:bg-white/10'}`}
  >
    <Icon size={17} className="flex-shrink-0" />
    {children}
  </button>
);

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
  const [showMenu, setShowMenu] = useState(false);
  const [showConfirm, setShowConfirm] = useState(null); // 'clear' | 'delete'
  const [showProfile, setShowProfile] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const menuRef = useRef(null);

  const getMutedChats = () => {
    try { return JSON.parse(localStorage.getItem('muted_chats') || '[]'); } catch { return []; }
  };
  const isMuted = activeChatId ? getMutedChats().includes(activeChatId) : false;

  const handleMuteToggle = () => {
    const muted = getMutedChats();
    const updated = muted.includes(activeChatId)
      ? muted.filter(id => id !== activeChatId)
      : [...muted, activeChatId];
    localStorage.setItem('muted_chats', JSON.stringify(updated));
    setShowMenu(false);
  };

  const handleShowProfile = async () => {
    setShowMenu(false);
    if (!interlocutorId) return;
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.get(`${API_URL}/users/${interlocutorId}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfileData(res.data);
    } catch {
      setProfileData({ name: chat?.name, avatar: chat?.avatar });
    }
    setShowProfile(true);
  };

  const handleClearHistory = async () => {
    try {
      await api.delete(`/chats/${activeChatId}/messages`);
      dispatch(clearMessages());
    } catch {}
    setShowConfirm(null);
  };

  const handleDeleteChat = async () => {
    try {
      await api.delete(`/chats/${activeChatId}`);
      dispatch(removeChat(activeChatId));
    } catch {}
    setShowConfirm(null);
  };

  // Закрытие меню по клику вне
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

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
    <>
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
        {/* Кнопка "..." + дропдаун */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(v => !v)}
            className="hover:text-white transition"
          >
            <MoreVertIcon className="w-5 h-5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-8 w-56 bg-[#2a2a2a] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden py-1">
              <MenuItem icon={isMuted ? IoNotifications : IoNotificationsOff} onClick={handleMuteToggle}>
                {isMuted ? 'Включить уведомления' : 'Выключить уведомления'}
              </MenuItem>
              {chat.type === 'private' && (
                <MenuItem icon={IoPerson} onClick={handleShowProfile}>Показать профиль</MenuItem>
              )}
              <MenuItem icon={IoTrash} onClick={() => { setShowMenu(false); setShowConfirm('clear'); }}>
                Очистить историю
              </MenuItem>
              <MenuItem icon={IoClose} danger onClick={() => { setShowMenu(false); setShowConfirm('delete'); }}>
                Удалить чат
              </MenuItem>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Диалог подтверждения */}
    {showConfirm && (
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60" onClick={() => setShowConfirm(null)} />
        <div className="relative bg-[#2a2a2a] rounded-2xl border border-white/10 shadow-2xl p-6 w-full max-w-[320px] flex flex-col gap-4">
          <p className="text-white font-semibold text-center">
            {showConfirm === 'clear' ? 'Очистить историю сообщений?' : 'Удалить чат?'}
          </p>
          <p className="text-gray-400 text-sm text-center">
            {showConfirm === 'clear'
              ? 'Все сообщения будут удалены безвозвратно.'
              : 'Чат будет удалён для вас.'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowConfirm(null)}
              className="flex-1 py-2 rounded-xl bg-[#3a3a3a] text-gray-300 hover:bg-[#444] transition text-sm"
            >
              Отмена
            </button>
            <button
              onClick={showConfirm === 'clear' ? handleClearHistory : handleDeleteChat}
              className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white transition text-sm"
            >
              {showConfirm === 'clear' ? 'Очистить' : 'Удалить'}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Профиль собеседника */}
    {showProfile && (
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60" onClick={() => setShowProfile(false)} />
        <div className="relative bg-[#2a2a2a] rounded-2xl border border-white/10 shadow-2xl p-6 w-full max-w-[320px] flex flex-col items-center gap-3">
          <button
            onClick={() => setShowProfile(false)}
            className="absolute top-3 right-3 text-gray-400 hover:text-white transition"
          >
            <IoClose size={20} />
          </button>
          <div className="w-20 h-20 rounded-full overflow-hidden bg-[#484849] flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {(profileData?.avatar || chat?.avatar)
              ? <img src={profileData?.avatar || chat?.avatar} alt="" className="w-full h-full object-cover" />
              : (profileData?.full_name || chat?.name || '?')[0].toUpperCase()
            }
          </div>
          <p className="text-white font-bold text-lg">{profileData?.full_name || chat?.name}</p>
          {profileData?.username && <p className="text-gray-400 text-sm">@{profileData.username}</p>}
          {profileData?.phone && <p className="text-gray-400 text-sm">{profileData.phone}</p>}
          {profileData?.status && <p className="text-gray-500 text-xs text-center">{profileData.status}</p>}
        </div>
      </div>
    )}
  </>
  );
};

export default ChatHeader;