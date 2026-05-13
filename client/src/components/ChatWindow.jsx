import React, { useRef, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMessages, clearMessages, updateMessage, deleteMessage } from '../store/messageSlice';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import { useSocket } from '../hooks/useSocket';
import axios from 'axios';
import { incrementUnread, resetUnread } from '../store/chatSlice';

const ChatWindow = () => {
  const dispatch = useDispatch();
  const activeChatId = useSelector((state) => state.chats?.activeChat);
  const { list: messages, loading } = useSelector((state) => state.messages || {});
  const currentUserId = useSelector((state) => state.auth?.user?.id);
  const chats = useSelector((state) => state.chats?.list) || [];
  
  const messagesEndRef = useRef(null);
  const socket = useSocket(activeChatId, currentUserId);
  const hasMarkedRead = useRef(false);
  
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
    axios.get(`http://localhost:5000/api/chats/${activeChatId}/participants`, {
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
        axios.get(`http://localhost:5000/api/chats/${chatId}/participants`, {
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
    if (file.size > 10 * 1024 * 1024) {
      alert('Файл слишком большой (макс 10МБ)');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const fileUrl = res.data.url;
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      socket.emit('send_message', {
        chatId: activeChatId,
        content: file.name,
        sender_id: currentUserId,
        time,
        file_url: fileUrl,
        type: file.type.startsWith('image/') ? 'image' : 'file'
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

  // Автоскролл
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

      <ChatHeader socket={socket} />

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && messages.length === 0 ? (
          <div className="flex justify-center mt-10"><div className="animate-spin h-6 w-6 border-2 border-gray-400 rounded-full border-t-transparent"></div></div>
        ) : messages.length === 0 ? (
           <div className="flex justify-center mt-10 text-gray-400 text-sm">Нет сообщений</div>
        ) : (
          messages.map((msg) => {
            // ✅ Находим имя отправителя для групповых чатов
            const sender = participants.find(p => p.id === msg.sender_id);
            const senderName = sender?.full_name || sender?.username || 'Пользователь';
            
            return (
              <MessageBubble
                key={msg.id}
                message={msg}
                isMine={msg.sender_id === currentUserId}
                currentUserId={currentUserId}
                isGroup={isGroupChat}
                senderName={senderName}
                onEdit={handleEditMessage}
                onDelete={handleDeleteMessage}
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