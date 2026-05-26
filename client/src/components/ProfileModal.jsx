import React, { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import {
  IoArrowBack,
  IoClose,
  IoCamera,
  IoPerson,
  IoAt,
  IoCall,
  IoCalendar,
  IoCheckmark,
} from 'react-icons/io5';
import { updateProfile } from '../store/authSlice';
import { API_URL } from '../services/endpointConfig';
import ImageCropModal from './ImageCropModal';

const Field = ({ icon: Icon, label, value, editable, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');

  const handleEdit = () => {
    if (!editable) return;
    setDraft(value || '');
    setEditing(true);
  };

  const handleSave = () => {
    onSave(draft.trim());
    setEditing(false);
  };

  const handleCancel = () => {
    setEditing(false);
    setDraft(value || '');
  };

  return (
    <div
      className={`flex items-center gap-3 bg-[#373737] rounded-xl px-4 py-3 ${editable ? 'cursor-pointer hover:bg-[#3f3f3f] transition-colors' : ''}`}
      onClick={!editing ? handleEdit : undefined}
    >
      <div className="w-8 h-8 bg-[#2a2a2a] rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon size={16} className="text-gray-400" />
      </div>
      <span className="text-white font-semibold text-sm w-[140px] flex-shrink-0">{label}:</span>
      {editing ? (
        <div className="flex items-center gap-2 flex-1" onClick={e => e.stopPropagation()}>
          <input
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel(); }}
            className="flex-1 bg-[#2a2a2a] text-white text-sm rounded-lg px-3 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button onClick={handleSave} className="text-green-400 hover:text-green-300 transition">
            <IoCheckmark size={18} />
          </button>
          <button onClick={handleCancel} className="text-gray-400 hover:text-white transition">
            <IoClose size={18} />
          </button>
        </div>
      ) : (
        <span className="text-gray-300 text-sm flex-1 truncate">{value || '—'}</span>
      )}
    </div>
  );
};

const ProfileModal = ({ onBack, onClose }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const fileInputRef = useRef();
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [cropSrc, setCropSrc] = useState(null);

  const displayName = user?.full_name || user?.username || 'User';

  const handleSave = (field) => async (value) => {
    if (!value) return;
    setSaveError(null);
    try {
      await dispatch(updateProfile({ [field]: value })).unwrap();
    } catch (err) {
      setSaveError(err?.message || 'Ошибка при сохранении');
    }
  };

  // Шаг 1: открываем кроппер с предпросмотром
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setCropSrc(objectUrl);
    e.target.value = '';
  };

  // Шаг 2: получаем обрезанный blob и загружаем
  const handleCropConfirm = async (blob) => {
    setCropSrc(null);
    setAvatarLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', blob, 'avatar.jpg');
      const res = await axios.post(`${API_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await dispatch(updateProfile({ avatar: res.data.url })).unwrap();
    } catch (err) {
      setSaveError('Ошибка загрузки аватара');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleCropCancel = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  };

  if (cropSrc) {
    return (
      <ImageCropModal
        imageSrc={cropSrc}
        onConfirm={handleCropConfirm}
        onCancel={handleCropCancel}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-[90] flex items-center justify-center">
      <div className="w-[500px] bg-[#2a2a2a] rounded-2xl shadow-2xl border border-white/10 overflow-hidden">

        {/* Шапка */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <button onClick={onBack} className="text-gray-400 hover:text-white transition">
            <IoArrowBack size={22} />
          </button>
          <span className="text-white font-semibold text-base">Мой профиль</span>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <IoClose size={22} />
          </button>
        </div>

        {/* Аватар */}
        <div className="flex justify-center py-6 border-b border-white/10">
          <div
            className="relative cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-28 h-28 rounded-full overflow-hidden bg-[#484849] flex items-center justify-center text-white font-bold text-4xl">
              {user?.avatar
                ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                : displayName[0]?.toUpperCase() || 'U'
              }
            </div>
            <div className={`absolute bottom-1 right-1 bg-[#484849] border-2 border-[#2a2a2a] rounded-full p-1.5 transition ${avatarLoading ? 'opacity-50' : 'group-hover:bg-[#555]'}`}>
              <IoCamera size={16} className="text-white" />
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>

        {/* Поля */}
        <div className="p-5 space-y-2">
          {saveError && (
            <div className="bg-red-500/20 border border-red-500/40 text-red-400 text-sm rounded-xl px-4 py-2">
              {saveError}
            </div>
          )}
          <Field
            icon={IoPerson}
            label="Имя и фамилия"
            value={user?.full_name || user?.username}
            editable
            onSave={handleSave('full_name')}
          />
          <Field
            icon={IoAt}
            label="Имя пользователя"
            value={user?.username ? `@${user.username}` : ''}
            editable
            onSave={(v) => handleSave('username')(v.replace(/^@/, ''))}
          />

          <div className="bg-[#373737] rounded-xl px-4 py-3 text-sm text-gray-400 leading-relaxed">
            С помощью имени пользователя другие люди смогут связаться с Вами в Z-Gram, не зная Вашего телефона.
          </div>

          <Field
            icon={IoCall}
            label="Номер телефона"
            value={user?.phone}
            editable={false}
          />
          <Field
            icon={IoCalendar}
            label="Дата рождения"
            value={user?.birthday}
            editable
            onSave={handleSave('birthday')}
          />
        </div>

      </div>
    </div>
  );
};

export default ProfileModal;
