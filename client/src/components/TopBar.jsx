import React, { useState } from 'react';
import SearchIcon from '../icons/SearchIcon';
import MenuIcon from '../icons/MenuIcon';

const TopBar = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    // ✅ Изменен фон на #484849
    <div className="h-14 w-full bg-[#484849] flex items-center justify-between px-4 shrink-0 z-50 mb-2 border-b border-[#111]">
      
      <button className="text-gray-300 hover:text-white transition p-2 rounded-full hover:bg-[#555]">
        <MenuIcon className="w-6 h-6" />
      </button>

      <h1 className="text-3xl font-bold text-white tracking-wider absolute left-1/2 transform -translate-x-1/2 pointer-events-none select-none">
        Z-Gram
      </h1>

      <div className="relative w-64">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск"
          className="w-full bg-[#373737] text-white text-sm rounded-xl py-2 pl-10 pr-4 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-500 transition-all"
        />
        <div className="absolute left-3 top-2.5 text-gray-400">
          <SearchIcon className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};

export default TopBar;