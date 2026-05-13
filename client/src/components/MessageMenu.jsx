import React, { useEffect, useRef, useState } from 'react';
import { IoCreateOutline, IoTrashOutline } from 'react-icons/io5';

const MessageMenu = ({ position, onClose, onEdit, onDelete, initialText, messageId }) => {
  const menuRef = useRef(null);
  const [showEditInput, setShowEditInput] = useState(false);
  const [editText, setEditText] = useState(initialText);

  // Закрытие по клику вне меню или при скролле
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
    };
    const handleScroll = () => onClose();

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [onClose]);

  const handleEdit = () => {
    if (editText.trim() && editText !== initialText) {
      onEdit(messageId, editText.trim());
    }
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm('Удалить сообщение?')) {
      onDelete(messageId);
      onClose();
    }
  };

  // Защита от выхода за границы экрана
  const MENU_W = 190;
  const MENU_H = showEditInput ? 130 : 96;
  let top = position.y;
  let left = position.x;

  if (left + MENU_W > window.innerWidth) left = window.innerWidth - MENU_W - 10;
  if (top + MENU_H > window.innerHeight) top = window.innerHeight - MENU_H - 10;

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] bg-[#484849] rounded-lg shadow-2xl border border-[#555] overflow-hidden"
      style={{ top, left, width: MENU_W }}
    >
      {showEditInput ? (
        <div className="p-3">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full bg-[#373737] text-white text-sm rounded p-2 mb-2 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            rows="3"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEdit(); }
              if (e.key === 'Escape') { setShowEditInput(false); }
            }}
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowEditInput(false)} className="px-3 py-1 text-xs text-gray-300 hover:text-white">Отмена</button>
            <button onClick={handleEdit} className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded">Сохранить</button>
          </div>
        </div>
      ) : (
        <>
          <button onClick={() => setShowEditInput(true)} className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-gray-200 hover:bg-[#555] transition">
            <IoCreateOutline size={18} /> Редактировать
          </button>
          <button onClick={handleDelete} className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-red-400 hover:bg-[#555] transition border-t border-[#555]">
            <IoTrashOutline size={18} /> Удалить
          </button>
        </>
      )}
    </div>
  );
};

export default MessageMenu;