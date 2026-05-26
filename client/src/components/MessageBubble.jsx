import React, { useState } from 'react';
import MessageMenu from './MessageMenu';
import VoicePlayer from './VoicePlayer';
import { resolveUrl } from '../services/endpointConfig';

// ✅ Надёжная функция: превращает ВСЕ эмодзи в картинки (Twemoji с правильными CORS)
const renderRichContent = (text) => {
  if (!text || typeof text !== 'string') return text;

  const result = [];
  let lastIndex = 0;
  let keyIndex = 0;

  // Расширенный regex для всех популярных эмодзи
  const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{FE00}-\u{FE0F}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{1F004}]|[\u{1F0CF}]|[\u{1F170}-\u{1F171}]|[\u{1F17E}-\u{1F17F}]|[\u{1F18E}]|[\u{1F191}-\u{1F19A}]|[\u{1F201}-\u{1F202}]|[\u{1F21A}]|[\u{1F22F}]|[\u{1F232}-\u{1F23A}]|[\u{1F250}-\u{1F251}]|[\u{203C}]|[\u{2049}]|[\u{2122}]|[\u{2139}]|[\u{2194}-\u{2199}]|[\u{21A9}-\u{21AA}]|[\u{231A}-\u{231B}]|[\u{2328}]|[\u{23CF}]|[\u{23E9}-\u{23F3}]|[\u{23F8}-\u{23FA}]|[\u{24C2}]|[\u{25AA}-\u{25AB}]|[\u{25B6}]|[\u{25C0}]|[\u{25FB}-\u{25FE}]|[\u{2614}-\u{2615}]|[\u{2648}-\u{2653}]|[\u{267F}]|[\u{2693}]|[\u{26A1}]|[\u{26AA}-\u{26AB}]|[\u{26BD}-\u{26BE}]|[\u{26C4}-\u{26C5}]|[\u{26CE}]|[\u{26D4}]|[\u{26EA}]|[\u{26F2}-\u{26F3}]|[\u{26F5}]|[\u{26FA}]|[\u{26FD}]|[\u{2702}]|[\u{2705}]|[\u{2708}-\u{270D}]|[\u{270F}]|[\u{2712}]|[\u{2714}]|[\u{2716}]|[\u{271D}]|[\u{2721}]|[\u{2728}]|[\u{2733}-\u{2734}]|[\u{2744}]|[\u{2747}]|[\u{274C}]|[\u{274E}]|[\u{2753}-\u{2755}]|[\u{2757}]|[\u{2763}-\u{2764}]|[\u{2795}-\u{2797}]|[\u{27A1}]|[\u{27B0}]|[\u{27BF}]|[\u{2934}-\u{2935}]|[\u{2B05}-\u{2B07}]|[\u{2B1B}-\u{2B1C}]|[\u{2B50}]|[\u{2B55}]|[\u{3030}]|[\u{303D}]|[\u{3297}]|[\u{3299}]/gu;

  let match;
  while ((match = emojiRegex.exec(text)) !== null) {
    const emoji = match[0];
    const matchIndex = match.index;

    // Добавляем текст до эмодзи
    if (matchIndex > lastIndex) {
      const textBefore = text.slice(lastIndex, matchIndex);
      // Обрабатываем ссылки в тексте
      result.push(...processLinks(textBefore, keyIndex));
      keyIndex++;
    }

    // Добавляем эмодзи как картинку (Twemoji CDN)
    // ✅ ВАЖНО: для Twemoji код должен быть в нижнем регистре!
    const code = emoji.codePointAt(0).toString(16);
    const imgUrl = `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${code}.svg`;

    result.push(
      <img
        key={`emoji-${keyIndex}`}
        src={imgUrl}
        alt=""
        className="inline w-5 h-5 align-text-bottom mx-[1px] select-none object-contain"
        draggable="false"
        loading="lazy"
        onError={(e) => {
          // Fallback на системный эмодзи если картинка не грузится
          e.target.style.display = 'none';
          const span = document.createElement('span');
          span.textContent = emoji;
          span.className = 'inline w-5 h-5 text-base';
          e.target.parentNode.insertBefore(span, e.target.nextSibling);
        }}
      />
    );
    keyIndex++;

    lastIndex = matchIndex + emoji.length;
  }

  // Добавляем оставшийся текст после последнего эмодзи
  if (lastIndex < text.length) {
    const textAfter = text.slice(lastIndex);
    result.push(...processLinks(textAfter, keyIndex));
  }

  return result.length > 0 ? result : text;
};

// Отдельная функция для обработки ссылок
const processLinks = (text, baseKey) => {
  const urlRegex = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g;
  const parts = text.split(urlRegex);
  
  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={`link-${baseKey}-${i}`}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-300 underline hover:text-blue-200 break-all"
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

const getSenderColor = (userId) => {
  const colors = ['text-blue-400', 'text-green-400', 'text-yellow-400', 'text-red-400', 'text-purple-400', 'text-pink-400', 'text-indigo-400'];
  return colors[userId % colors.length];
};

const highlightText = (text, query) => {
  if (!query?.trim() || !text) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="bg-yellow-400/90 text-black rounded px-0.5">{part}</mark>
      : part
  );
};

const MessageBubble = ({ message, isMine, onEdit, onDelete, currentUserId, isGroup = false, senderName = '', searchQuery = '', isCurrentMatch = false, msgId }) => {
  const [menuPos, setMenuPos] = useState(null);

  const handleContextMenu = (e) => {
    if (isMine) { e.preventDefault(); setMenuPos({ x: e.clientX, y: e.clientY }); }
  };
  const handleClick = () => { if (menuPos) setMenuPos(null); };

  const fileUrl = resolveUrl(message.file_url);
  const isVoice = message.type === 'voice';
  const isImage = message.type === 'image' || (fileUrl && /\.(jpg|jpeg|png|gif|webp)$/i.test(fileUrl));
  const isVideo = message.type === 'video' || (fileUrl && /\.(mp4|mov|avi|ogg|mkv)$/i.test(fileUrl));
  const isAudio = !isVoice && (message.type === 'audio' || (fileUrl && /\.(mp3|wav|ogg|flac|aac|m4a)$/i.test(fileUrl)));
  const isFile = message.type === 'file' && !isImage && !isVideo && !isAudio && !isVoice;
  const downloadedName = message.content || fileUrl?.split('/').pop();

  const renderDownloadLink = () => {
    if (!fileUrl || isVoice) return null;
    return (
      <a
        href={fileUrl}
        download={downloadedName}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-blue-200 underline hover:text-blue-100 block mt-1 break-all"
      >
        Скачать {downloadedName}
      </a>
    );
  };

  return (
    <>
      <div id={msgId} className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-1 group`} onContextMenu={handleContextMenu} onClick={handleClick}>
        <div className={`max-w-[65%] px-2 py-2 text-[15px] relative shadow-sm select-none transition-shadow ${
            isMine ? 'bg-[#2b5278] text-white rounded-2xl rounded-br-none' : 'bg-[#636364] text-white rounded-2xl rounded-bl-none'
          } ${isCurrentMatch ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-[#373737]' : ''}`}>
          
          {isGroup && !isMine && senderName && (
            <p className={`text-xs font-bold mb-1 ${getSenderColor(message.sender_id)}`}>{senderName}</p>
          )}

          {isImage && (
            <>
              <div className="mb-2 rounded-lg overflow-hidden max-w-[250px]"><img src={fileUrl} alt="" className="w-full h-auto object-cover cursor-pointer" onClick={() => window.open(fileUrl, '_blank')} /></div>
              {renderDownloadLink()}
            </>
          )}
          {isVideo && (
            <>
              <div className="mb-2 rounded-lg overflow-hidden max-w-[280px] bg-[#1a1a1a] border border-[#333]"><video src={fileUrl} controls playsInline preload="metadata" className="w-full h-auto max-h-[300px] object-contain" /></div>
              {renderDownloadLink()}
            </>
          )}
          {isAudio && (
            <>
              <div className="my-1"><VoicePlayer url={message.file_url} durationString={message.duration} /></div>
              {renderDownloadLink()}
            </>
          )}
          {isVoice && (
            <div className="my-1"><VoicePlayer url={message.file_url} durationString={message.duration || '0:00'} /></div>
          )}
          {isFile && (
            <>
              <a href={fileUrl} download={downloadedName} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-black/20 p-3 rounded-lg mb-2 hover:bg-black/30 transition min-w-[180px]"><span className="text-2xl">📄</span><span className="text-sm underline break-all">{message.content}</span></a>
            </>
          )}

          {message.content && message.type !== 'voice' && !isImage && !isVideo && !isAudio && !isFile && (
            <p className="break-words leading-snug px-2">
              {searchQuery ? highlightText(message.content, searchQuery) : renderRichContent(message.content)}
            </p>
          )}

          <div className={`text-[10px] mt-1 flex justify-end items-center gap-1 ${isMine ? 'text-blue-200' : 'text-gray-300'}`}>
            <span className="px-2">{message.time}</span>
            {isMine && <span className={`font-bold ${message.is_read ? 'text-blue-400' : 'text-blue-300/70'}`}>{message.is_read ? '✓✓' : '✓'}</span>}
            {message.is_edited && <span className="text-[9px] italic opacity-70 ml-1">(изм.)</span>}
          </div>
        </div>
      </div>

      {menuPos && <MessageMenu position={menuPos} currentUserId={currentUserId} onClose={() => setMenuPos(null)} onEdit={onEdit} onDelete={onDelete} initialText={message.content} messageId={message.id} />}
    </>
  );
};

export default MessageBubble;