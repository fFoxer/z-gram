import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchChats } from '../store/chatSlice';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import SidebarMenu from './SidebarMenu';

const Layout = ({ children, onStartCall }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dispatch = useDispatch();
  const activeChat = useSelector((state) => state.chats.activeChat);
  const chatsLoaded = useSelector((state) => state.chats.list.length > 0);

  useEffect(() => {
    if (!chatsLoaded) dispatch(fetchChats());
  }, [chatsLoaded, dispatch]);

  return (
    <div className="flex flex-col h-[100dvh] bg-[#181818] text-white overflow-hidden">

      {/* TopBar: на мобильном скрываем когда открыт чат */}
      <div className={activeChat ? 'hidden md:block' : 'block'}>
        <TopBar onMenuClick={() => setIsMenuOpen(true)} searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      </div>

      <SidebarMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <div className="flex flex-1 overflow-hidden md:px-2 md:pb-2 md:gap-2">

        {/* Сайдбар: на мобильном скрываем когда открыт чат */}
        <div className={`h-full md:rounded-xl overflow-hidden flex-shrink-0 ${activeChat ? 'hidden md:block' : 'block w-full md:w-auto'}`}>
          <Sidebar searchQuery={searchQuery} />
        </div>

        {/* Окно чата: на мобильном скрываем когда нет активного чата */}
        <div className={`flex-1 flex flex-col h-full relative overflow-hidden md:rounded-xl bg-[#181818] md:border md:border-[#111] ${activeChat ? 'flex' : 'hidden md:flex'}`}>
          {React.Children.map(children, child =>
            React.isValidElement(child)
              ? React.cloneElement(child, { onStartCall: child.props?.onStartCall ?? onStartCall })
              : child
          )}
        </div>

      </div>
    </div>
  );
};

export default Layout;
