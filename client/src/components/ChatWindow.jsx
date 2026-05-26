import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMessages, clearMessages, updateMessage, deleteMessage } from '../store/messageSlice';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import axios from 'axios';
import { API_URL } from '../services/endpointConfig';
import { incrementUnread, resetUnread } from '../store/chatSlice';

// ✅ 1. Принимаем onStartCall и socket в пропсах
const ChatWindow = ({ socket, onStartCall, isCallReady }) => {
  const dispatch = useDispatch();
  
  const activeChatId = useSelector((state) => state.chats?.activeChat);
  const { list: messages, loading } = useSelector((state) => state.messages || {});
  const currentUserId = useSelector((state) => state.auth?.user?.id);
  const chats = useSelector((state) => state.chats?.list) || [];
  
  const messagesEndRef = useRef(null);
  const hasMarkedRead = useRef(false);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMatchIdx, setCurrentMatchIdx] = useState(0);

  // ✅ Участники группового чата
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    if (activeChatId) {
      dispatch(clearMessages());
      dispatch(fetchMessages(activeChatId));
      hasMarkedRead.current = false;
      
      // ✅ 1. Обнуляем счетчик в Redux
      dispatch(resetUnread(activeChatId));
      
      // ✅ 2. Обнуляем счетчик в БД через сокет
      if (socket && currentUserId) {
        socket.emit('chat_read', { chatId: activeChatId, userId: currentUserId });
      }
    }
  }, [activeChatId, dispatch, socket, currentUserId]);

  // ✅ Загрузка участников для группового чата
  useEffect(() => {
    if (!activeChatId) return;
    
    const currentChat = chats.find(c => c.id === activeChatId);
    if (currentChat?.type !== 'group') {
      setParticipants([]);
      return;
    }

    const token = localStorage.getItem('accessToken');
    axios.get(`${API_URL}/chats/${activeChatId}/participants`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setParticipants(res.data))
    .catch(err => console.error('Error loading participants:', err));
  }, [activeChatId, chats]);

  // Прочтение сообщений
  useEffect(() => {
    if (!activeChatId || !currentUserId || !socket || loading || hasMarkedRead.current) return;
    const hasUnread = messages.some(msg => !msg.is_read && msg.sender_id !== currentUserId);
    if (hasUnread) {
      socket.emit('mark_read', { chatId: activeChatId, userId: currentUserId });
      hasMarkedRead.current = true;
    }
  }, [messages, activeChatId, currentUserId, socket, loading]);

  // Слушатели сокетов
  useEffect(() => {
    if (!socket) return;

    const handleMessageEdited = (data) => {
      dispatch(updateMessage({ id: data.id, content: data.content, is_edited: true }));
    };

    const handleMessageDeleted = (data) => {
      dispatch(deleteMessage(data.id));
    };

    const handleParticipantAdded = ({ chatId }) => {
      if (chatId === activeChatId) {
        // Перезагружаем участников при добавлении нового
        const token = localStorage.getItem('accessToken');
        axios.get(`${API_URL}/chats/${chatId}/participants`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(res => setParticipants(res.data));
      }
    };

    socket.on('message_edited', handleMessageEdited);
    socket.on('message_deleted', handleMessageDeleted);
    socket.on('participant_added', handleParticipantAdded);

    return () => {
      socket.off('message_edited', handleMessageEdited);
      socket.off('message_deleted', handleMessageDeleted);
      socket.off('participant_added', handleParticipantAdded);
    };
  }, [socket, activeChatId, dispatch]);

  // ✅ Единая функция загрузки файлов
  const handleFileUpload = async (files) => {
  if (!files || files.length === 0 || !socket || !activeChatId) return;

  const file = files[0];
  if (file.size > 50 * 1024 * 1024) { // 50 МБ
    alert('Файл слишком большой (макс 50МБ)');
    return;
  }

  try {
    const formData = new FormData();
    formData.append('file', file);

    const res = await axios.post(`${API_URL}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    const fileUrl = res.data.url;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // ✅ Определяем тип: image, video или file
    let contentType = 'file';
    if (file.type.startsWith('image/')) contentType = 'image';
    else if (file.type.startsWith('video/')) contentType = 'video';
    else if (file.type.startsWith('audio/') || file.name.match(/\.(mp3|wav|ogg|flac|aac|m4a)$/i)) {
  contentType = 'audio'; // ✅ Теперь аудиофайлы помечаются как 'audio'
}

    socket.emit('send_message', {
      chatId: activeChatId,
      content: file.name,
      sender_id: currentUserId,
      time,
      file_url: fileUrl,
      type: contentType // ✅ Теперь будет 'video' для видеофайлов
    });
  } catch (error) {
    console.error('Upload error:', error);
  }
};

  // ✅ Drag & Drop обработчики
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFileUpload(files);
  };

  // Обработчики редактирования/удаления
  const handleEditMessage = (messageId, newContent) => {
    if (!socket || !activeChatId || !currentUserId) return;
    socket.emit('edit_message', { messageId, chatId: activeChatId, newContent, senderId: currentUserId });
  };

  const handleDeleteMessage = (messageId) => {
    if (!socket || !activeChatId || !currentUserId) return;
    socket.emit('delete_message', { messageId, chatId: activeChatId, senderId: currentUserId });
  };

  // Сброс поиска при смене чата
  useEffect(() => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setCurrentMatchIdx(0);
  }, [activeChatId]);

  // Список ID сообщений, совпадающих с поисковым запросом
  const matchingMsgIds = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return messages
      .filter(m => m.content && m.content.toLowerCase().includes(q))
      .map(m => m.id);
  }, [messages, searchQuery]);

  const currentMatchId = matchingMsgIds.length > 0 ? matchingMsgIds[currentMatchIdx] : null;

  // Скролл к текущему совпадению
  useEffect(() => {
    if (!currentMatchId) return;
    document.getElementById(`msg-${currentMatchId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [currentMatchId]);

  const handleSearchNavigate = (dir) => {
    if (matchingMsgIds.length === 0) return;
    setCurrentMatchIdx(prev => (prev + dir + matchingMsgIds.length) % matchingMsgIds.length);
  };

  const handleSearchClose = () => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setCurrentMatchIdx(0);
  };

  // Автоскролл (только когда поиск закрыт)
  useEffect(() => {
    if (isSearchOpen) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSearchOpen]);

  // ✅ Определяем, является ли текущий чат групповым
  const currentChat = chats.find(c => c.id === activeChatId);
  const isGroupChat = currentChat?.type === 'group';

  return (
    <div
      className="flex flex-col h-full bg-[#373737] relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Оверлей для Drag & Drop */}
      {isDragging && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 pointer-events-none backdrop-blur-sm">
          <div className="bg-[#484849] border-2 border-dashed border-blue-400 rounded-2xl p-8 text-center shadow-2xl transform scale-105">
            <p className="text-white text-xl font-bold">Перетащите файлы сюда</p>
            <p className="text-gray-300 text-sm mt-2">Отпустите для отправки</p>
          </div>
        </div>
      )}

      <ChatHeader
        socket={socket}
        onStartCall={onStartCall}
        isCallReady={isCallReady}
        isSearchOpen={isSearchOpen}
        searchQuery={searchQuery}
        matchCount={matchingMsgIds.length}
        currentMatchIdx={currentMatchIdx}
        onSearchOpen={() => setIsSearchOpen(true)}
        onSearchClose={handleSearchClose}
        onSearchChange={(q) => { setSearchQuery(q); setCurrentMatchIdx(0); }}
        onSearchNavigate={handleSearchNavigate}
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && messages.length === 0 ? (
          <div className="flex justify-center mt-10"><div className="animate-spin h-6 w-6 border-2 border-gray-400 rounded-full border-t-transparent"></div></div>
        ) : messages.length === 0 ? (
           <div className="flex justify-center mt-10 text-gray-400 text-sm">Нет сообщений</div>
        ) : (
          messages.map((msg) => {
            const sender = participants.find(p => p.id === msg.sender_id);
            const senderName = sender?.full_name || sender?.username || 'Пользователь';
            return (
              <MessageBubble
                key={msg.id}
                msgId={`msg-${msg.id}`}
                message={msg}
                isMine={msg.sender_id === currentUserId}
                currentUserId={currentUserId}
                isGroup={isGroupChat}
                senderName={senderName}
                onEdit={handleEditMessage}
                onDelete={handleDeleteMessage}
                searchQuery={searchQuery}
                isCurrentMatch={currentMatchId === msg.id}
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <MessageInput socket={socket} onFileUpload={handleFileUpload} />
    </div>
  );
};

export default ChatWindow;