import React, { useState, useEffect } from 'react';
import { IoArrowBack, IoClose } from 'react-icons/io5';

const load = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};

const playTestSound = (volume) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.value = (volume / 100) * 0.4;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.stop(ctx.currentTime + 0.35);
  } catch {}
};

const NotificationsModal = ({ onBack, onClose }) => {
  const [enabled, setEnabled] = useState(() => load('notif_enabled', false));
  const [volume, setVolume] = useState(() => load('notif_volume', 80));
  const [permission, setPermission] = useState(Notification.permission);

  useEffect(() => {
    localStorage.setItem('notif_enabled', JSON.stringify(enabled));
    localStorage.setItem('notif_volume', JSON.stringify(volume));
  }, [enabled, volume]);

  const handleToggle = async () => {
    if (!enabled) {
      let perm = Notification.permission;
      if (perm === 'default') {
        perm = await Notification.requestPermission();
        setPermission(perm);
      }
      if (perm !== 'granted') return;
    }
    setEnabled(prev => !prev);
  };

  const permissionDenied = permission === 'denied';

  return (
    <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4">
      <div className="w-[calc(100vw-2rem)] max-w-[420px] bg-[#2a2a2a] rounded-2xl shadow-2xl overflow-hidden border border-white/10">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
          <button onClick={onBack} className="text-gray-400 hover:text-white transition p-1">
            <IoArrowBack size={20} />
          </button>
          <h2 className="text-white font-semibold flex-1 text-center">Уведомления и звуки</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition p-1">
            <IoClose size={20} />
          </button>
        </div>

        <div className="p-5 space-y-6">

          {/* Уведомления и звуки — тогл */}
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-3">Общие</p>
            <div className={`flex items-center justify-between px-4 py-3 rounded-xl ${permissionDenied ? 'opacity-50' : 'bg-[#1a1a1a]'}`}>
              <div>
                <p className="text-white text-sm font-medium">Уведомления и звуки</p>
                {permissionDenied && (
                  <p className="text-red-400 text-xs mt-0.5">Разрешение отклонено в браузере</p>
                )}
              </div>
              <button
                onClick={handleToggle}
                disabled={permissionDenied}
                className={`relative w-[50px] h-[26px] rounded-full transition-colors duration-200 flex-shrink-0 ${
                  enabled && !permissionDenied ? 'bg-blue-600' : 'bg-[#444]'
                }`}
              >
                <span className={`absolute top-[3px] left-[3px] w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                  enabled && !permissionDenied ? 'translate-x-[24px]' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>

          {/* Громкость */}
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-3">Громкость</p>
            <div className="bg-[#1a1a1a] px-4 py-4 rounded-xl">
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={volume}
                  onChange={e => setVolume(Number(e.target.value))}
                  onMouseUp={() => playTestSound(volume)}
                  onTouchEnd={() => playTestSound(volume)}
                  className="flex-1 accent-blue-500 h-1.5 cursor-pointer"
                />
                <span className="text-white text-sm font-mono w-10 text-right">{volume}%</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default NotificationsModal;
