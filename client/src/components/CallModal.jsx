import React, { useEffect, useState } from 'react';
import { IoCall, IoMic, IoMicOff, IoVideocam, IoVideocamOff, IoClose } from 'react-icons/io5';

const CallModal = ({
  isReceivingCall,
  isCallingOut,
  caller,
  callAccepted,
  myVideo,
  userVideo,
  userAudio,
  answerCall,
  rejectCall,
  endCall,
  audioEnabled,
  videoEnabled,
  toggleAudio,
  toggleVideo,
  stream,
  remoteVideoActive,
  remoteAvatar,
  remoteName,
  myAvatar,
  callError,
  clearError
}) => {
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (stream && myVideo?.current) {
      myVideo.current.srcObject = stream;
    }
  }, [stream, myVideo, videoEnabled]);

  useEffect(() => {
    if (callError) {
      setShowError(true);
      const timer = setTimeout(() => {
        setShowError(false);
        if (clearError) clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [callError, clearError]);

  // Входящий звонок — компактная карточка поверх чата
  if (isReceivingCall && !callAccepted) {
    const displayName = remoteName || (caller ? `ID: ${caller}` : 'Входящий звонок');
    const initial = remoteName?.[0]?.toUpperCase() || caller?.toString().charAt(0).toUpperCase() || '?';

    return (
      <div className="fixed top-16 right-4 z-[100] bg-[#2a2a2a] rounded-2xl p-5 shadow-2xl w-56 flex flex-col items-center border border-white/10">
        {showError && callError && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap">
            {callError}
          </div>
        )}

        {/* Аватар */}
        <div className="w-20 h-20 rounded-full overflow-hidden mb-3 ring-2 ring-white/10">
          {remoteAvatar ? (
            <img src={remoteAvatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-slate-600 flex items-center justify-center text-3xl font-bold text-white">
              {initial}
            </div>
          )}
        </div>

        {/* Имя */}
        <div className="text-white font-bold text-base mb-4 truncate max-w-full px-2">{displayName}</div>

        {/* Кнопки */}
        <div className="flex gap-4 items-center">
          {/* Видеозвонок */}
          <button
            onClick={() => answerCall({ video: true })}
            className="w-11 h-11 rounded-full bg-[#3a3a3a] hover:bg-[#4a4a4a] flex items-center justify-center transition text-white"
            title="Принять с видео"
          >
            <IoVideocam size={20} />
          </button>

          {/* Отклонить */}
          <button
            onClick={rejectCall}
            className="w-11 h-11 rounded-full bg-[#3a3a3a] hover:bg-[#4a4a4a] flex items-center justify-center transition text-white"
            title="Отклонить"
          >
            <IoClose size={20} />
          </button>

          {/* Аудиозвонок */}
          <button
            onClick={() => answerCall({ video: false })}
            className="w-11 h-11 rounded-full bg-[#3a3a3a] hover:bg-[#4a4a4a] flex items-center justify-center transition text-white"
            title="Принять (аудио)"
          >
            <IoCall size={20} />
          </button>
        </div>
      </div>
    );
  }

  // Нет активного звонка — ничего не рендерим
  if (!callAccepted && !isCallingOut) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-[#0e1621] flex flex-col items-center justify-center text-white">
      {/* Уведомление об ошибке */}
      {showError && callError && (
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-[110] flex items-center gap-3 max-w-md">
          <span className="flex-1">{callError}</span>
          <button onClick={() => { setShowError(false); if (clearError) clearError(); }} className="hover:bg-red-700 p-1 rounded">
            <IoClose size={20} />
          </button>
        </div>
      )}

      {/* Основной контент */}
      <div className="relative w-full h-full flex items-center justify-center bg-black">
        {callAccepted ? (
          <>
            <video
              playsInline
              ref={userVideo}
              autoPlay
              className={`absolute inset-0 w-full h-full object-cover ${remoteVideoActive ? '' : 'hidden'}`}
            />
            {!remoteVideoActive && <audio ref={userAudio} autoPlay className="hidden" />}
            {!remoteVideoActive && (
              <div className="flex flex-col items-center justify-center w-full h-full px-4">
                {remoteAvatar ? (
                  <img src={remoteAvatar} alt="" className="w-36 h-36 rounded-full object-cover border-4 border-white/20 shadow-2xl" />
                ) : (
                  <div className="w-36 h-36 rounded-full bg-slate-700 flex items-center justify-center text-4xl font-semibold text-white">
                    {remoteName?.[0]?.toUpperCase() || caller?.toString().charAt(0).toUpperCase() || '?'}
                  </div>
                )}
                <div className="mt-4 text-lg text-white/90">{remoteName || (caller ? `ID: ${caller}` : 'Собеседник')}</div>
              </div>
            )}
          </>
        ) : (
          /* Экран исходящего звонка */
          <div className="flex flex-col items-center justify-center w-full h-full">
            {remoteAvatar ? (
              <img src={remoteAvatar} alt="" className="w-36 h-36 rounded-full object-cover border-4 border-white/20 shadow-2xl" />
            ) : (
              <div className="w-36 h-36 rounded-full bg-slate-700 flex items-center justify-center text-4xl font-semibold text-white">
                {remoteName?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            <div className="mt-4 text-xl font-semibold">{remoteName || 'Собеседник'}</div>
            <div className="mt-2 text-gray-400 animate-pulse">Вызов...</div>
          </div>
        )}
      </div>

      {/* Моё видео (маленькое, поверх) — скрываем если камера выключена */}
      {callAccepted && videoEnabled && (
        <div className="absolute bottom-24 right-8 w-32 h-48 bg-black rounded-xl overflow-hidden shadow-2xl border-2 border-gray-600">
          {videoEnabled ? (
            <video playsInline ref={myVideo} autoPlay muted className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#111]">
              {myAvatar ? (
                <img src={myAvatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm text-white">Камера выкл.</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Панель управления */}
      <div className="absolute bottom-10 flex gap-6 z-10">
        {callAccepted && (
          <>
            <button
              onClick={() => toggleAudio && toggleAudio(!audioEnabled)}
              className={`p-4 rounded-full transition ${audioEnabled ? 'bg-[#2b5278] hover:bg-[#3a6d9e]' : 'bg-red-600 hover:bg-red-500'}`}
              title={audioEnabled ? 'Выключить микрофон' : 'Включить микрофон'}
            >
              {audioEnabled ? <IoMic size={24} /> : <IoMicOff size={24} />}
            </button>
            <button
              onClick={() => toggleVideo && toggleVideo(!videoEnabled)}
              className={`p-4 rounded-full transition ${videoEnabled ? 'bg-[#2b5278] hover:bg-[#3a6d9e]' : 'bg-red-600 hover:bg-red-500'}`}
              title={videoEnabled ? 'Выключить камеру' : 'Включить камеру'}
            >
              {videoEnabled ? <IoVideocam size={24} /> : <IoVideocamOff size={24} />}
            </button>
          </>
        )}
        <button
          onClick={endCall}
          className="p-4 bg-red-600 rounded-full hover:bg-red-500 transition shadow-lg shadow-red-900/50"
          title={isCallingOut && !callAccepted ? 'Отменить звонок' : 'Завершить звонок'}
        >
          <IoCall size={32} className="rotate-[135deg]" />
        </button>
      </div>
    </div>
  );
};

export default CallModal;
