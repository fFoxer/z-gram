import React, { useState } from 'react';
import MessageMenu from './MessageMenu';
import VoicePlayer from './VoicePlayer';

// ✅ Функция для цвета имени (стабильный цвет по ID)
const getSenderColor = (userId) => {
  const colors = [
    'text-blue-400', 'text-green-400', 'text-yellow-400', 
    'text-red-400', 'text-purple-400', 'text-pink-400', 'text-indigo-400'
  ];
  return colors[userId % colors.length];
};

// ✅ Парсер ссылок (без изменений)
const parseMessageContent = (content) => {
  if (!content) return null;
  const urlRegex = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g;
  const parts = content.split(urlRegex);
  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-300 underline hover:text-blue-200 break-all">
          {part}
        </a>
      );
    }
    return part;
  });
};

const MessageBubble = ({ 
  message, 
  isMine, 
  onEdit, 
  onDelete, 
  currentUserId,
  isGroup = false,      // ✅ Новый проп
  senderName = ''       // ✅ Новый проп
}) => {
  const [menuPos, setMenuPos] = useState(null);

  const handleContextMenu = (e) => {
    if (isMine) { e.preventDefault(); setMenuPos({ x: e.clientX, y: e.clientY }); }
  };
  const handleClick = () => { if (menuPos) setMenuPos(null); };

  return (
    <>
      <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-1 group`} onContextMenu={handleContextMenu} onClick={handleClick}>
        <div className={`max-w-[65%] px-2 py-2 text-[15px] relative shadow-sm select-none ${
            isMine ? 'bg-[#2b5278] text-white rounded-2xl rounded-br-none' : 'bg-[#636364] text-white rounded-2xl rounded-bl-none'
          }`}>
          
          {/* ✅ Имя отправителя (только для групп и только для чужих сообщений) */}
          {isGroup && !isMine && senderName && (
            <p className={`text-xs font-bold mb-1 ${getSenderColor(message.sender_id)}`}>
              {senderName}
            </p>
          )}

          {/* ГОЛОСОВОЕ */}
          {message.type === 'voice' && (
            <div className="my-1">
              <VoicePlayer url={message.file_url} durationString={message.duration || '0:00'} />
            </div>
          )}

          {/* КАРТИНКА */}
          {message.type === 'image' && (
            <div className="mb-2 rounded-lg overflow-hidden max-w-[250px]">
              <img src={message.file_url} alt="img" className="w-full h-auto object-cover cursor-pointer" onClick={() => window.open(message.file_url, '_blank')} />
            </div>
          )}

          {/* ФАЙЛ */}
          {message.type === 'file' && (
            <a href={message.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-black/20 p-2 rounded mb-2 hover:bg-black/30 transition">
              <span className="text-2xl">📄</span>
              <span className="text-sm underline break-all">{message.content}</span>
            </a>
          )}

          {/* ТЕКСТ */}
          {message.type !== 'voice' && message.content && (
            <p className="break-words leading-snug px-2">
              {parseMessageContent(message.content)}
            </p>
          )}

          {/* Время и галочки */}
          <div className={`text-[10px] mt-1 flex justify-end items-center gap-1 ${isMine ? 'text-blue-200' : 'text-gray-300'}`}>
            <span className="px-2">{message.time}</span>
            {isMine && (
              <span className={`font-bold ${message.is_read ? 'text-blue-400' : 'text-blue-300/70'}`}>
                {message.is_read ? '✓✓' : '✓'}
              </span>
            )}
            {message.is_edited && <span className="text-[9px] italic opacity-70 ml-1">(изм.)</span>}
          </div>
        </div>
      </div>

      {menuPos && (
        <MessageMenu position={menuPos} currentUserId={currentUserId} onClose={() => setMenuPos(null)} onEdit={onEdit} onDelete={onDelete} initialText={message.content} messageId={message.id} />
      )}
    </>
  );
};

export default MessageBubble;