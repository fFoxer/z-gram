import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { IoSend, IoClose } from 'react-icons/io5';
import AttachIcon from '../icons/AttachIcon';
import MicrophoneIcon from '../icons/MicrophoneIcon';
import MoodIcon from '../icons/MoodIcon';
import VoiceRecorder from './VoiceRecorder';
import axios from 'axios';
import { API_URL } from '../services/endpointConfig';
import EmojiPicker from 'emoji-picker-react';

const MessageInput = ({ socket, onFileUpload }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false); // ✅ Новый стейт
  
  const activeChatId = useSelector((state) => state.chats?.activeChat);
  const currentUserId = useSelector((state) => state.auth?.user?.id);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);
  const savedRangeRef = useRef(null);
  
  // ✅ Таймер для debouncing (чтобы не спамить событиями)
  const typingTimerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.emoji-picker-container') && 
          !e.target.closest('[aria-label="Emoji"]')) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ✅ Отправка события "печатает" на сервер
  const sendTypingEvent = (typing) => {
    if (!socket || !activeChatId || !currentUserId) return;
    
    // Не отправляем, если статус не изменился
    if (typing === isTyping) return;
    
    setIsTyping(typing);
    socket.emit('typing', {
      chatId: activeChatId,
      userId: currentUserId,
      isTyping: typing
    });
  };

  // ✅ Обработчик ввода: ставим "печатает", сбрасываем таймер
  const handleInput = () => {
    if (inputRef.current) {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        savedRangeRef.current = selection.getRangeAt(0).cloneRange();
      }
    }
    
    // Отправляем "начал печатать"
    sendTypingEvent(true);
    
    // Сбрасываем предыдущий таймер
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }
    
    // Через 1.5 сек без ввода — отправляем "перестал печатать"
    typingTimerRef.current = setTimeout(() => {
      sendTypingEvent(false);
    }, 1500);
  };

  const getContentForSending = () => {
    if (!inputRef.current) return '';
    let text = '';
    inputRef.current.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent;
      } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'IMG') {
        text += node.getAttribute('data-unicode') || '';
      }
    });
    return text.trim();
  };

  const handleSendText = (e) => {
    e?.preventDefault();
    e?.stopPropagation();

    const content = getContentForSending();
    if (!content || !socket || !activeChatId) return;
    
    // ✅ Перед отправкой — сбрасываем "печатает"
    sendTypingEvent(false);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    socket.emit('send_message', { 
      chatId: activeChatId, 
      content: content, 
      sender_id: currentUserId, 
      time,
      type: 'text'
    });
    
    inputRef.current.innerText = '';
    inputRef.current.focus();
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (files.length > 0 && onFileUpload) onFileUpload(files);
  };

  const handleVoiceSend = async (audioBlob, duration) => {
    try {
      const formData = new FormData();
      const file = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
      formData.append('file', file);
      const res = await axios.post(`${API_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      socket.emit('send_message', {
        chatId: activeChatId, content: 'Голосовое сообщение', sender_id: currentUserId,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        file_url: res.data.url, type: 'voice', duration
      });
      setIsRecording(false);
    } catch (error) { console.error('Voice upload error:', error); }
  };

  const handleEmojiButtonClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        savedRangeRef.current = selection.getRangeAt(0).cloneRange();
      }
    }
    setShowEmojiPicker(prev => !prev);
  };

  const handleEmojiClick = (emojiData) => {
    if (!inputRef.current) return;
    
    inputRef.current.focus();
    const selection = window.getSelection();
    
    if (savedRangeRef.current) {
      selection.removeAllRanges();
      selection.addRange(savedRangeRef.current);
    }
    
    const range = selection.getRangeAt(0);
    
    const img = document.createElement('img');
    const code = emojiData.unified || emojiData.emoji.codePointAt(0).toString(16);
    img.src = `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${code}.svg`;
    
    img.setAttribute('data-unicode', emojiData.emoji);
    img.className = 'inline w-5 h-5 align-text-bottom mx-[1px] select-none object-contain';
    img.draggable = false;
    img.alt = '';
    
    range.deleteContents();
    range.insertNode(img);
    
    const newRange = document.createRange();
    newRange.setStartAfter(img);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);
    
    savedRangeRef.current = newRange.cloneRange();
    
    // ✅ После вставки эмодзи — тоже считаем это "печатает"
    sendTypingEvent(true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => sendTypingEvent(false), 1500);
  };

  // ✅ Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, []);

  const hasContent = () => {
    if (!inputRef.current) return false;
    const text = inputRef.current.innerText.trim();
    const images = inputRef.current.querySelectorAll('img').length;
    return text.length > 0 || images > 0;
  };

  return (
    <div className="h-[60px] bg-[#373737] border-t border-[#222] flex items-center px-4 gap-3 relative">
      {!isRecording ? (
        <>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple />
          <button type="button" onClick={() => fileInputRef.current?.click()} className="text-gray-400 hover:text-white transition p-2">
            <AttachIcon className="w-6 h-6" />
          </button>
          
          <div
            ref={inputRef}
            contentEditable
            onInput={handleInput}
            onBlur={() => {
              // ✅ Если поле потеряло фокус — перестал печатать
              sendTypingEvent(false);
              if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendText(e);
              }
            }}
            placeholder="Напиши сообщение..."
            className="flex-1 bg-[#484849] text-white text-sm rounded-xl py-2.5 px-4 placeholder-gray-400 focus:outline-none min-h-[40px] max-h-[120px] overflow-y-auto empty:before:content-[attr(placeholder)] empty:before:text-gray-400"
            style={{ wordBreak: 'break-word' }}
            suppressContentEditableWarning={true}
          />
          
          <div className="flex items-center gap-1">
            <button 
              type="button"
              onClick={handleEmojiButtonClick}
              className="text-gray-400 hover:text-white transition p-2 relative"
              aria-label="Emoji"
            >
              <MoodIcon className="w-6 h-6" />
            </button>

            {showEmojiPicker && (
              <div className="emoji-picker-container absolute bottom-full right-0 mb-2 z-50 shadow-2xl rounded-xl overflow-hidden border border-[#444]">
                <button 
                  type="button"
                  onClick={() => setShowEmojiPicker(false)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-white z-10"
                >
                  <IoClose size={20} />
                </button>
                
                <EmojiPicker 
                  onEmojiClick={handleEmojiClick}
                  theme="dark"
                  emojiStyle="twitter"
                  searchDisabled={false}
                  previewConfig={{ showPreview: false }}
                  lazyLoadEmojis={true}
                />
              </div>
            )}

            {hasContent() ? (
              <button 
                type="button" 
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleSendText} 
                className="text-[#BBBCBF] hover:text-white transition p-2"
              >
                <IoSend size={24} />
              </button>
            ) : (
              <button 
                type="button" 
                onClick={() => setIsRecording(true)} 
                className="text-gray-400 hover:text-white transition p-2"
              >
                <MicrophoneIcon className="w-6 h-6" />
              </button>
            )}
          </div>
        </>
      ) : (
        <VoiceRecorder onSend={handleVoiceSend} onCancel={() => setIsRecording(false)} />
      )}
    </div>
  );
};

export default MessageInput;