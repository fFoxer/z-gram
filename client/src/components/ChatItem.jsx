import React from 'react';

const ChatItem = ({ chat, isActive, onClick }) => {
  const getAvatarColor = (name) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500'];
    return colors[name.charCodeAt(0) % colors.length];
  };

 return (
    <div
      onClick={onClick}
      className={`flex items-center p-2 mb-1 cursor-pointer rounded-lg transition-all ${
        isActive ? 'bg-[#887D7D]' : 'bg-[#373737] hover:bg-[#484849]'
      }`}
    >
      {/* Аватар */}
      <div className="relative flex-shrink-0 mr-3">
        {chat.avatar ? (
          <img src={chat.avatar} className="w-12 h-12 rounded-full object-cover" alt="" />
        ) : (
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${getAvatarColor(chat.name)}`}>
            {chat.name[0].toUpperCase()}
          </div>
        )}
        
        {/* ✅ Красный бейдж (поверх аватара или рядом) */}
        {chat.unread > 0 && !isActive && (
          <div className="absolute -bottom-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#373737]">
            {chat.unread > 99 ? '99+' : chat.unread}
          </div>
        )}
      </div>

      {/* Текст и время */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-1">
          <h3 className={`font-bold truncate ${isActive ? 'text-white' : 'text-gray-200'}`}>
            {chat.name}
          </h3>
          <span className={`text-xs ml-2 ${isActive ? 'text-blue-100' : 'text-gray-400'}`}>
            {chat.time}
          </span>
        </div>
        
        {/* ✅ Если есть непрочитанные, текст последнего сообщения жирнее/ярче */}
        <p className={`text-sm truncate ${
          chat.unread > 0 && !isActive ? 'text-white font-medium' : 'text-gray-400'
        }`}>
          {chat.last_message}
        </p>
      </div>
    </div>
  );
};

export default ChatItem;