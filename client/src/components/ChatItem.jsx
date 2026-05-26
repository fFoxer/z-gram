import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BsPinAngleFill } from 'react-icons/bs';
import { TbPin, TbPinnedOff } from 'react-icons/tb';

const ChatItem = ({ chat, isActive, onClick, isPinned, onTogglePin }) => {
  const userStatuses = useSelector((state) => state.chats.userStatuses);
  const [contextMenu, setContextMenu] = useState(null);

  const showOnline = chat.type === 'private' && chat.userId
    ? !!userStatuses[String(chat.userId)]
    : false;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: chat.id, disabled: !isPinned });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
    position: 'relative',
  };

  const getAvatarColor = (name) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500'];
    return colors[name.charCodeAt(0) % colors.length];
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [contextMenu]);

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={onClick}
        onContextMenu={handleContextMenu}
        className={`flex items-center p-2 mb-1 cursor-pointer rounded-lg transition-all select-none ${
          isDragging
            ? 'bg-[#555] shadow-lg'
            : isActive
            ? 'bg-[#887D7D]'
            : 'bg-[#373737] hover:bg-[#484849]'
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

          {showOnline && !isActive && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#373737]"></div>
          )}

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
            <div className="flex items-center gap-1 ml-2 flex-shrink-0">
              {isPinned && <BsPinAngleFill size={11} className="text-blue-400 opacity-80" />}
              <span className={`text-xs ${isActive ? 'text-blue-100' : 'text-gray-400'}`}>
                {chat.time}
              </span>
            </div>
          </div>

          <p className={`text-sm truncate ${
            chat.unread > 0 && !isActive ? 'text-white font-medium' : 'text-gray-400'
          }`}>
            {chat.last_message}
          </p>
        </div>
      </div>

      {/* Контекстное меню */}
      {contextMenu && (
        <div
          className="fixed z-[500] bg-[#2a2a2a] border border-[#444] rounded-lg shadow-2xl py-1 min-w-[160px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full text-left px-4 py-2 text-sm text-white hover:bg-[#3a3a3a] flex items-center gap-2 transition-colors"
            onClick={() => { onTogglePin(); setContextMenu(null); }}
          >
            {isPinned
              ? <><TbPinnedOff size={15} /> Открепить</>
              : <><TbPin size={15} /> Закрепить</>
            }
          </button>
        </div>
      )}
    </>
  );
};

export default ChatItem;
