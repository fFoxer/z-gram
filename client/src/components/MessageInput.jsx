import React, { useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { IoSend } from 'react-icons/io5';
import AttachIcon from '../icons/AttachIcon';
import MicrophoneIcon from '../icons/MicrophoneIcon';
import MoodIcon from '../icons/MoodIcon';
import VoiceRecorder from './VoiceRecorder'; // ✅ Импорт
import axios from 'axios';

const MessageInput = ({ socket, onFileUpload }) => {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false); // ✅ Состояние записи
  const activeChatId = useSelector((state) => state.chats?.activeChat);
  const currentUserId = useSelector((state) => state.auth?.user?.id);
  const fileInputRef = useRef(null);

  const handleSendText = () => {
    if (!text.trim() || !socket || !activeChatId) return;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    socket.emit('send_message', { 
      chatId: activeChatId, 
      content: text.trim(), 
      sender_id: currentUserId, 
      time 
    });
    setText('');
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files.length > 0 && onFileUpload) {
      onFileUpload(files);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ✅ Логика отправки голосового
  const handleVoiceSend = async (audioBlob, duration) => {
  console.log('🎤 Отправка голосового:', { duration, blobSize: audioBlob.size }); // ✅ ЛОГ

  try {
    const formData = new FormData();
    const file = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
    formData.append('file', file);

    const res = await axios.post('http://localhost:5000/api/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    const fileUrl = res.data.url;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    console.log('📤 Emit send_message с данными:', {
      chatId: activeChatId,
      content: 'Голосовое сообщение',
      type: 'voice',
      duration: duration, // ✅ Проверь это значение
      file_url: fileUrl
    });

    socket.emit('send_message', {
      chatId: activeChatId,
      content: 'Голосовое сообщение',
      sender_id: currentUserId,
      time,
      file_url: fileUrl,
      type: 'voice',
      duration: duration // ✅ Обязательно передаём
    });
    
    setIsRecording(false);
  } catch (error) {
    console.error('Voice upload error:', error);
  }
};

  return (
    <div className="h-[60px] bg-[#373737] border-t border-[#222] flex items-center px-4 gap-3 relative">
      
      {/* Если не записываем - обычный интерфейс */}
      {!isRecording ? (
        <>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
          />

          <button onClick={() => fileInputRef.current?.click()} className="text-gray-400 hover:text-white transition p-2">
            <AttachIcon className="w-6 h-6" />
          </button>
          
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
            placeholder="Напиши сообщение..."
            className="flex-1 bg-[#484849] text-white text-sm rounded-xl py-2.5 px-4 placeholder-gray-400 focus:outline-none"
          />
          
          <div className="flex items-center gap-1">
            {text.trim() ? (
              <button onClick={handleSendText} className="text-[#BBBCBF] hover:text-white transition p-2">
                <IoSend size={24} />
              </button>
            ) : (
              <>
                <button className="text-gray-400 hover:text-white transition p-2">
                  <MoodIcon className="w-6 h-6" />
                </button>
                {/* ✅ Кнопка микрофона запускает запись */}
                <button onClick={() => setIsRecording(true)} className="text-gray-400 hover:text-white transition p-2">
                  <MicrophoneIcon className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
        </>
      ) : (
        // ✅ Если записываем - показываем VoiceRecorder
        <VoiceRecorder 
          onSend={handleVoiceSend} 
          onCancel={() => setIsRecording(false)} 
        />
      )}
    </div>
  );
};

export default MessageInput;