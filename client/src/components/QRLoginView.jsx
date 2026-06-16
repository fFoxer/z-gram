import React, { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { API_URL, SOCKET_URL } from '../services/endpointConfig';
import { initAuth } from '../store/authSlice';

const QRLoginView = ({ onBack }) => {
  const [qrToken, setQrToken] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [status, setStatus] = useState('loading'); // loading | ready | expired | success | error
  const dispatch = useDispatch();

  const fetchToken = useCallback(async () => {
    setStatus('loading');
    setQrToken(null);
    setSecondsLeft(60);
    try {
      const res = await axios.get(`${API_URL}/auth/qr/generate`);
      setQrToken(res.data.token);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => { fetchToken(); }, [fetchToken]);

  // Обратный отсчёт
  useEffect(() => {
    if (status !== 'ready') return;
    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) { clearInterval(interval); setStatus('expired'); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [status, qrToken]);

  // Socket: ждём подтверждения от другого устройства
  useEffect(() => {
    if (!qrToken || status !== 'ready') return;
    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socket.on('connect', () => socket.emit('join_qr_room', qrToken));
    socket.on('qr_login_success', ({ accessToken, refreshToken }) => {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      setStatus('success');
      socket.disconnect();
      dispatch(initAuth());
    });
    return () => socket.disconnect();
  }, [qrToken, status, dispatch]);

  return (
    <div className="text-center flex flex-col items-center">

      {status === 'loading' && (
        <div className="flex items-center justify-center h-[220px]">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {status === 'ready' && qrToken && (
        <>
          <div className="bg-white p-3 rounded-xl mb-4 shadow-lg">
            <QRCodeSVG value={qrToken} size={190} level="M" />
          </div>
          <p className="text-gray-200 text-sm mb-2">Отсканируй в приложении телефона</p>
          <ol className="text-gray-400 text-xs text-left space-y-1 mb-4">
            <li>1. Открой Z-Gram на телефоне</li>
            <li>2. Настройки → Устройства → QR-code</li>
            <li>3. Отсканируй это изображение, чтоб войти</li>
          </ol>
          <p className="text-gray-500 text-xs">
            Код истекает через <span className="text-white font-mono font-bold">{secondsLeft}с</span>
          </p>
        </>
      )}

      {status === 'expired' && (
        <div className="flex flex-col items-center gap-4 py-10">
          <p className="text-gray-300 text-sm">QR код истёк</p>
          <button
            onClick={fetchToken}
            className="bg-[#444] hover:bg-[#555] text-white text-sm px-6 py-2 rounded-lg transition"
          >
            Обновить QR
          </button>
        </div>
      )}

      {status === 'success' && (
        <div className="flex flex-col items-center gap-3 py-10">
          <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center">
            <span className="text-green-400 text-3xl">✓</span>
          </div>
          <p className="text-white text-sm font-medium">Вход выполнен!</p>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center gap-4 py-10">
          <p className="text-red-400 text-sm">Ошибка загрузки QR</p>
          <button onClick={fetchToken} className="bg-[#444] hover:bg-[#555] text-white text-sm px-6 py-2 rounded-lg transition">
            Попробовать снова
          </button>
        </div>
      )}

      <button onClick={onBack} className="mt-5 bg-[#444] hover:bg-[#555] text-gray-300 text-sm px-4 py-2 rounded transition-colors">
        или войти по номеру телефона
      </button>
    </div>
  );
};

export default QRLoginView;
