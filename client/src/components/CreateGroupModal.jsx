import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { setActiveChat, fetchChats } from '../store/chatSlice';
import { IoClose, IoSearch, IoCheckmark } from 'react-icons/io5';

const CreateGroupModal = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    if (query.length < 2) return setUsers([]);
    setLoading(true);
    const token = localStorage.getItem('accessToken');
    axios.get(`http://localhost:5000/api/users/search?q=${query}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => { setUsers(res.data); setLoading(false); })
      .catch(() => { setUsers([]); setLoading(false); });
  }, [query]);

  const toggleUser = (user) => {
    setSelected(prev => 
      prev.find(u => u.id === user.id) ? prev.filter(u => u.id !== user.id) : [...prev, user]
    );
  };

  const createGroup = async () => {
    if (!groupName.trim() || selected.length === 0) return;
    const token = localStorage.getItem('accessToken');
    try {
      const res = await axios.post('http://localhost:5000/api/chats/group', {
        name: groupName,
        participantIds: selected.map(u => u.id)
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      await dispatch(fetchChats());
      dispatch(setActiveChat(res.data.id));
      onClose();
    } catch (err) {
      console.error('Group creation error:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#373737] w-[450px] rounded-xl p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-white">Новая группа</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><IoClose size={24} /></button>
        </div>

        <input 
          value={groupName} onChange={e => setGroupName(e.target.value)} 
          placeholder="Название группы" 
          className="w-full bg-[#222] text-white p-3 rounded-lg mb-4 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />

        <div className="relative mb-2">
          <input 
            value={query} onChange={e => setQuery(e.target.value)} 
            placeholder="Добавить участников..." 
            className="w-full bg-[#222] text-white p-3 pl-10 rounded-lg focus:outline-none"
          />
          <IoSearch className="absolute left-3 top-3.5 text-gray-500" size={20} />
        </div>

        <div className="max-h-48 overflow-y-auto space-y-1 mb-4">
          {loading && <p className="text-gray-400 text-center py-2">Поиск...</p>}
          {users.map(u => {
            const isSelected = selected.find(s => s.id === u.id);
            return (
              <button key={u.id} onClick={() => toggleUser(u)} 
                className={`w-full flex items-center gap-3 p-2 rounded-lg transition text-left ${isSelected ? 'bg-blue-600/30' : 'hover:bg-[#444]'}`}>
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                  {(u.full_name || u.username || 'U')[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{u.full_name || u.username}</p>
                </div>
                {isSelected && <IoCheckmark className="text-blue-400" size={20} />}
              </button>
            );
          })}
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Выбрано: {selected.length}</span>
          <button onClick={createGroup} disabled={!groupName.trim() || selected.length === 0}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg transition font-medium">
            Создать
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;