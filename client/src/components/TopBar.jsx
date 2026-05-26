import React from 'react';
import MenuIcon from '../icons/MenuIcon';

const TopBar = ({ onMenuClick }) => {
  return (
    <div className="h-14 w-full bg-[#484849] flex items-center justify-between px-4 shrink-0 z-50 mb-2 border-b border-[#111]">
      <button onClick={onMenuClick} className="text-gray-300 hover:text-white transition p-2 rounded-full hover:bg-[#555]">
        <MenuIcon className="w-6 h-6" />
      </button>

      <h1 className="text-3xl font-bold text-white tracking-wider absolute left-1/2 transform -translate-x-1/2 pointer-events-none select-none">
        Z-Gram
      </h1>

      <div className="w-10" />
    </div>
  );
};

export default TopBar;
