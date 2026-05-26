import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ProfileModal from './ProfileModal';
import {
  IoPerson,
  IoNotifications,
  IoLockClosed,
  IoFolder,
  IoSettings,
  IoLanguage,
  IoLogOut,
  IoClose,
  IoShareSocial,
  IoEllipsisVertical,
} from 'react-icons/io5';
import { logoutStart } from '../store/authSlice';

const staticMenuItems = [
  { icon: IoNotifications, label: 'Уведомления и звуки' },
  { icon: IoLockClosed,   label: 'Конфиденциальность' },
  { icon: IoFolder,       label: 'Папки с чатами' },
  { icon: IoSettings,     label: 'Продвинутые настройки' },
  { icon: IoLanguage,     label: 'Язык' },
];

const SidebarMenu = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [showProfile, setShowProfile] = useState(false);

  const handleLogout = () => {
    dispatch(logoutStart());
    onClose();
  };

  if (!isOpen) return null;

  if (showProfile) {
    return (
      <ProfileModal
        onBack={() => setShowProfile(false)}
        onClose={() => { setShowProfile(false); onClose(); }}
      />
    );
  }

  const displayName = user?.full_name || user?.username || 'User';
  const handle = user?.username ? `@${user.username}` : '';
  const phone = user?.phone || '';

  return (
    <>
      {/* Затемнение фона */}
      <div className="fixed inset-0 bg-black/50 z-[60]" onClick={onClose} />

      {/* Карточка меню */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-2rem)] max-w-[480px] bg-[#2a2a2a] rounded-2xl shadow-2xl z-[70] border border-white/10 overflow-hidden">

        {/* Шапка профиля */}
        <div className="p-5">
          <div className="flex items-start gap-4">

            {/* Аватар */}
            <div className="w-[72px] h-[72px] rounded-full overflow-hidden flex-shrink-0 bg-[#484849] flex items-center justify-center text-white font-bold text-2xl">
              {user?.avatar
                ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                : displayName[0]?.toUpperCase() || 'U'
              }
            </div>

            {/* Имя + handle + телефон */}
            <div className="flex-1 min-w-0 pt-1">
              <h3 className="text-white font-bold text-base leading-tight truncate">{displayName}</h3>
              {handle && <p className="text-gray-400 text-sm mt-0.5">{handle}</p>}
              {phone && <p className="text-gray-400 text-sm mt-0.5">{phone}</p>}
            </div>

            {/* Правая колонка: кнопки + QR */}
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              {/* Кнопки действий */}
              <div className="flex items-center gap-1">
                <button className="text-gray-400 hover:text-white transition p-1.5 rounded-lg hover:bg-white/10">
                  <IoShareSocial size={17} />
                </button>
                <button className="text-gray-400 hover:text-white transition p-1.5 rounded-lg hover:bg-white/10">
                  <IoEllipsisVertical size={17} />
                </button>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition p-1.5 rounded-lg hover:bg-white/10"
                >
                  <IoClose size={17} />
                </button>
              </div>

            </div>

          </div>
        </div>

        <div className="border-t border-white/10" />

        {/* Пункты меню */}
        <div className="p-3 space-y-0.5">
          {/* Мой профиль — с обработчиком */}
          <button
            onClick={() => setShowProfile(true)}
            className="w-full flex items-center gap-4 px-4 py-3 text-gray-300 hover:bg-[#3a3a3a] hover:text-white rounded-xl transition-all duration-150 text-left"
          >
            <IoPerson size={19} className="flex-shrink-0" />
            <span className="font-medium text-sm">Мой профиль</span>
          </button>

          {staticMenuItems.map((item) => (
            <button
              key={item.label}
              className="w-full flex items-center gap-4 px-4 py-3 text-gray-300 hover:bg-[#3a3a3a] hover:text-white rounded-xl transition-all duration-150 text-left"
            >
              <item.icon size={19} className="flex-shrink-0" />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}

          {/* Выход */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 text-red-400 hover:bg-red-600/20 hover:text-red-300 rounded-xl transition-all duration-150 mt-1"
          >
            <IoLogOut size={19} className="flex-shrink-0" />
            <span className="font-medium text-sm">Выйти</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default SidebarMenu;
