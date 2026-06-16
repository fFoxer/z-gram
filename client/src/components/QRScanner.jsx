import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import axios from 'axios';
import { API_URL } from '../services/endpointConfig';
import { IoClose } from 'react-icons/io5';

const QRScanner = ({ onClose }) => {
  const scannerRef = useRef(null);
  const [status, setStatus] = useState('scanning'); // scanning | success | error
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const scannerId = 'qr-scanner-container';
    let html5QrCode = null;
    let cancelled = false;

    const start = async () => {
      // Ждём чтобы DOM-элемент точно был смонтирован
      await new Promise(r => setTimeout(r, 50));
      if (cancelled) return;

      html5QrCode = new Html5Qrcode(scannerId);
      scannerRef.current = html5QrCode;

      try {
        await html5QrCode.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          async (token) => {
            if (cancelled) return;
            try { await html5QrCode.stop(); } catch {}
            const accessToken = localStorage.getItem('accessToken');
            try {
              await axios.post(`${API_URL}/auth/qr/confirm`, { token }, {
                headers: { Authorization: `Bearer ${accessToken}` }
              });
              setStatus('success');
              setTimeout(onClose, 1500);
            } catch (err) {
              setErrorMsg(err.response?.data?.message || 'Ошибка подтверждения');
              setStatus('error');
            }
          },
          () => {}
        );
      } catch (err) {
        if (!cancelled) {
          setErrorMsg('Нет доступа к камере');
          setStatus('error');
        }
      }
    };

    start();

    return () => {
      cancelled = true;
      if (html5QrCode) {
        html5QrCode.isScanning && html5QrCode.stop().catch(() => {});
      }
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#2a2a2a] rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h3 className="text-white font-semibold text-sm">Сканировать QR-код</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <IoClose size={20} />
          </button>
        </div>

        <div className="p-4">
          {status === 'scanning' && (
            <>
              <p className="text-gray-400 text-xs text-center mb-3">
                Наведи камеру на QR-код со страницы входа
              </p>
              <div id="qr-scanner-container" className="rounded-xl overflow-hidden" />
            </>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center">
                <span className="text-green-400 text-3xl">✓</span>
              </div>
              <p className="text-white text-sm font-medium">Вход подтверждён!</p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <p className="text-red-400 text-sm text-center">{errorMsg}</p>
              <button
                onClick={onClose}
                className="bg-[#444] hover:bg-[#555] text-white text-sm px-6 py-2 rounded-lg transition"
              >
                Закрыть
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
