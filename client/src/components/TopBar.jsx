import React from 'react';
import { IoSearch } from 'react-icons/io5';
import MenuIcon from '../icons/MenuIcon';

const TopBar = ({ onMenuClick, searchQuery, onSearchChange }) => {
  return (
    <div className="h-14 w-full bg-[#484849] flex items-center px-3 shrink-0 z-50 mb-2 border-b border-[#111]">
      <button onClick={onMenuClick} className="text-gray-300 hover:text-white transition p-2 rounded-full hover:bg-[#555] flex-shrink-0">
        <MenuIcon className="w-6 h-6" />
      </button>

      <div className="w-[20%] flex items-center bg-[#2e2e2e] rounded-xl px-2 gap-1.5 h-8 ml-2 flex-shrink-0">
        <IoSearch className="text-gray-400 flex-shrink-0" size={14} />
        <input
          type="text"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Поиск"
          className="w-full bg-transparent text-white text-xs placeholder-gray-500 outline-none"
        />
      </div>

      <h1 className="text-3xl font-bold text-white tracking-wider absolute left-1/2 -translate-x-1/2 pointer-events-none select-none">
        Z-Gram
      </h1>
    </div>
  );
};

export default TopBar;
