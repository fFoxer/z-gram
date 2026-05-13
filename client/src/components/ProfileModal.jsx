import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateProfile, logout } from '../store/authSlice';
import { IoClose, IoLogOut } from 'react-icons/io5';

const ProfileModal = ({ onClose }) => {
  const user = useSelector(state => state.auth.user);
  const dispatch = useDispatch();
  const [form, setForm] = useState({ full_name: '', status: '', avatar_url: '' });

  useEffect(() => {
    if (user) setForm({ full_name: user.full_name || '', status: user.status || '', avatar_url: user.avatar_url || '' });
  }, [user]);

  const handleSave = () => {
    dispatch(updateProfile(form));
    onClose();
  };

  const handleLogout = () => {
  // 1. Сначала очищаем фронт
  dispatch(logoutStart());
  // 2. Затем делаем запрос на сервер (опционально, для инвалидации токена)
  dispatch(logoutServer());
  // 3. Редирект
  navigate('/auth');
  onClose();
};

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#373737] w-[450px] rounded-xl p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><IoClose size={24} /></button>
        
        <h2 className="text-xl font-bold text-white mb-6">Профиль</h2>
        
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
            {form.full_name ? form.full_name[0] : 'U'}
          </div>
          <div>
            <p className="text-white font-medium">{form.full_name || user?.username}</p>
            <p className="text-gray-400 text-sm">{user?.phone}</p>
          </div>
        </div>

        <div className="space-y-4">
          <input placeholder="Имя" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} className="w-full bg-[#222] text-white p-3 rounded-lg focus:outline-none" />
          <input placeholder="О себе" value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full bg-[#222] text-white p-3 rounded-lg focus:outline-none" />
          <input placeholder="Ссылка на аватар" value={form.avatar_url} onChange={e => setForm({...form, avatar_url: e.target.value})} className="w-full bg-[#222] text-white p-3 rounded-lg focus:outline-none text-sm" />
        </div>

        <div className="flex justify-between mt-8 pt-4 border-t border-gray-600">
          <button onClick={handleLogout} className="flex items-center gap-2 text-red-400 hover:text-red-300">
            <IoLogOut size={20} /> Выйти
          </button>
          <button onClick={handleSave} className="bg-[#2b5278] hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium">
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;