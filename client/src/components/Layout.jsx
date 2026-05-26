import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import SidebarMenu from './SidebarMenu';

const Layout = ({ children, onStartCall }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-[#181818] text-white overflow-hidden">

      <TopBar onMenuClick={() => setIsMenuOpen(true)} />

      <SidebarMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <div className="flex flex-1 overflow-hidden px-2 pb-2 gap-2">

        <div className="h-full rounded-xl overflow-hidden">
          <Sidebar />
        </div>

        <div className="flex-1 flex flex-col h-full relative overflow-hidden rounded-xl bg-[#181818] border border-[#111]">
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
