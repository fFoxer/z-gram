import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ProfileModal from './ProfileModal';
import QRScanner from './QRScanner';
import NotificationsModal from './NotificationsModal';
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
  IoQrCode,
  IoHandRight,
  IoWarning,
} from 'react-icons/io5';
import { logoutStart } from '../store/authSlice';
import api from '../services/api';

const staticMenuItems = [
  { icon: IoLockClosed, label: 'Конфиденциальность' },
  { icon: IoFolder,     label: 'Папки с чатами' },
  { icon: IoSettings,   label: 'Продвинутые настройки' },
  { icon: IoLanguage,   label: 'Язык' },
];

const SidebarMenu = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [showProfile, setShowProfile] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleLogout = () => {
    dispatch(logoutStart());
    onClose();
  };

  const handleDeleteAccount = async () => {
    try {
      await api.delete('/users/me');
      dispatch(logoutStart());
      onClose();
    } catch {
      setShowDeleteConfirm(false);
    }
  };

  if (!isOpen) return null;

  if (showQRScanner) {
    return <QRScanner onClose={() => setShowQRScanner(false)} />;
  }

  if (showNotifications) {
    return (
      <NotificationsModal
        onBack={() => setShowNotifications(false)}
        onClose={() => { setShowNotifications(false); onClose(); }}
      />
    );
  }

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
          <button
            onClick={() => setShowProfile(true)}
            className="w-full flex items-center gap-4 px-4 py-3 text-gray-300 hover:bg-[#3a3a3a] hover:text-white rounded-xl transition-all duration-150 text-left"
          >
            <IoPerson size={19} className="flex-shrink-0" />
            <span className="font-medium text-sm">Мой профиль</span>
          </button>

          <button
            onClick={() => setShowNotifications(true)}
            className="w-full flex items-center gap-4 px-4 py-3 text-gray-300 hover:bg-[#3a3a3a] hover:text-white rounded-xl transition-all duration-150 text-left"
          >
            <IoNotifications size={19} className="flex-shrink-0" />
            <span className="font-medium text-sm">Уведомления и звуки</span>
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

          <button
            onClick={() => setShowQRScanner(true)}
            className="w-full flex items-center gap-4 px-4 py-3 text-gray-300 hover:bg-[#3a3a3a] hover:text-white rounded-xl transition-all duration-150 text-left"
          >
            <IoQrCode size={19} className="flex-shrink-0" />
            <span className="font-medium text-sm">Устройства (QR-код)</span>
          </button>

          {/* Выход */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 text-red-400 hover:bg-red-600/20 hover:text-red-300 rounded-xl transition-all duration-150 mt-1"
          >
            <IoLogOut size={19} className="flex-shrink-0" />
            <span className="font-medium text-sm">Выйти</span>
          </button>

          {/* Удаление аккаунта */}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full flex items-center gap-4 px-4 py-3 text-red-400 hover:bg-red-600/20 hover:text-red-300 rounded-xl transition-all duration-150"
          >
            <IoHandRight size={19} className="flex-shrink-0" />
            <span className="font-medium text-sm">Удаление аккаунта</span>
          </button>
        </div>

        {/* Сноска */}
        <p className="text-center text-gray-600 text-xs pb-4 px-4">
          Часть функционала пока не работает — проект ещё в разработке
        </p>
      </div>

      {/* Диалог подтверждения удаления */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-[#2a2a2a] rounded-2xl shadow-2xl border border-white/10 w-full max-w-[340px] p-6 flex flex-col items-center gap-4">
            <IoWarning size={40} className="text-red-400" />
            <div className="text-center">
              <p className="text-white font-semibold text-base">Удалить аккаунт?</p>
              <p className="text-gray-400 text-sm mt-1">Все данные будут удалены безвозвратно. Это действие нельзя отменить.</p>
            </div>
            <div className="flex gap-3 w-full mt-1">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#3a3a3a] text-gray-300 hover:bg-[#444] transition text-sm font-medium"
              >
                Отмена
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white transition text-sm font-medium"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SidebarMenu;
