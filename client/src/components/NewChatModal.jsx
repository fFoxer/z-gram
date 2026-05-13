import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { setActiveChat } from '../store/chatSlice';
import { fetchChats } from '../store/chatSlice';
import { IoClose, IoSearch } from 'react-icons/io5';
import CreateGroupModal from './CreateGroupModal'; // ✅ Импорт модального окна группы

const NewChatModal = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('private'); // ✅ 'private' | 'group'
  const dispatch = useDispatch();

  // Поиск пользователей (только для личного чата)
  useEffect(() => {
    if (mode !== 'private' || query.length < 2) return setUsers([]);
    
    setLoading(true);
    const token = localStorage.getItem('accessToken');
    
    axios.get(`http://localhost:5000/api/users/search?q=${query}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      setUsers(res.data);
      setLoading(false);
    })
    .catch(error => {
      console.error('Search error:', error);
      setUsers([]);
      setLoading(false);
    });
  }, [query, mode]);

  const startChat = async (userId) => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.post('http://localhost:5000/api/chats', { userId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      await dispatch(fetchChats());
      dispatch(setActiveChat(res.data.id));
      onClose();
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#373737] w-[400px] rounded-xl p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-white">Новый чат</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <IoClose size={24} />
          </button>
        </div>

        {/* ✅ Переключатель режима */}
        <div className="flex bg-[#222] rounded-lg p-1 mb-4">
          <button 
            onClick={() => setMode('private')} 
            className={`flex-1 py-2 text-sm rounded-md transition font-medium ${
              mode === 'private' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            Личный
          </button>
          <button 
            onClick={() => setMode('group')} 
            className={`flex-1 py-2 text-sm rounded-md transition font-medium ${
              mode === 'group' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            Группа
          </button>
        </div>

        {/* ✅ Контент вкладки "Личный" (твой исходный код) */}
        {mode === 'private' && (
          <>
            <div className="relative mb-4">
              <input 
                value={query} 
                onChange={e => setQuery(e.target.value)} 
                placeholder="Поиск по имени или телефону..." 
                className="w-full bg-[#222] text-white p-3 pl-10 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
              <IoSearch className="absolute left-3 top-3.5 text-gray-500" size={20} />
            </div>

            <div className="max-h-64 overflow-y-auto space-y-1">
              {loading && <p className="text-gray-400 text-center text-sm py-4">Поиск...</p>}
              
              {users.map(u => (
                <button 
                  key={u.id} 
                  onClick={() => startChat(u.id)} 
                  className="w-full flex items-center gap-3 p-2 hover:bg-[#444] rounded-lg transition text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {(u.full_name || u.username || 'U')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">{u.full_name || u.username}</p>
                    <p className="text-gray-400 text-xs truncate">{u.is_online ? 'онлайн' : u.phone}</p>
                  </div>
                </button>
              ))}
              
              {!loading && users.length === 0 && query.length >= 2 && (
                <p className="text-gray-400 text-center text-sm py-4">Никого не найдено</p>
              )}
            </div>
          </>
        )}

        {/* ✅ Контент вкладки "Группа" */}
        {mode === 'group' && (
          <CreateGroupModal onClose={onClose} />
        )}
      </div>
    </div>
  );
};

export default NewChatModal;