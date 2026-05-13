import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchChats, setActiveChat } from '../store/chatSlice';
import ChatItem from './ChatItem';
import NewChatModal from './NewChatModal';
import { FaPlus } from 'react-icons/fa';

const Sidebar = () => {
  const dispatch = useDispatch();
  const { list, loading } = useSelector((state) => state.chats);
  const activeChatId = useSelector((state) => state.chats.activeChat);
  const [showNewChat, setShowNewChat] = useState(false);

  useEffect(() => {
    dispatch(fetchChats());
  }, [dispatch]);

  return (
    <div className="w-[360px] bg-[#373737] flex flex-col h-full flex-shrink-0">
      
      {/* Список чатов */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          list.map((chat) => (
            <ChatItem 
              key={chat.id} 
              chat={chat} 
              isActive={activeChatId === chat.id}
              onClick={() => dispatch(setActiveChat(chat.id))}
            />
          ))
        )}
      </div>

      {/* Кнопка "Новый чат" - без отступов и скруглений */}
      <div className="border-t border-[#222] bg-[#484849]">
  <button
    onClick={() => setShowNewChat(true)}
    className="w-full bg-[#484849] hover:bg-[#555] text-white font-medium py-3 px-4 transition text-[25px] text-center"
  >
    Новый чат
  </button>
</div>

      {showNewChat && <NewChatModal onClose={() => setShowNewChat(false)} />}
    </div>
  );
};

export default Sidebar;