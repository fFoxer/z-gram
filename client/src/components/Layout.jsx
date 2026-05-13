import React from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const Layout = ({ children }) => {
  return (
    <div className="flex flex-col h-screen bg-[#181818] text-white overflow-hidden">
      
      {/* 1. Верхняя панель (на всю ширину, без отступов по бокам) */}
      <TopBar />

      {/* 2. Основная область (с отступами по бокам и снизу) */}
      <div className="flex flex-1 overflow-hidden px-2 pb-2 gap-2">
        
        {/* Сайдбар */}
        <div className="h-full rounded-xl overflow-hidden">
            <Sidebar />
        </div>

        {/* Область чата */}
        <div className="flex-1 flex flex-col h-full relative overflow-hidden rounded-xl bg-[#181818] border border-[#111]">
          {children}
        </div>
        
      </div>
    </div>
  );
};

export default Layout;