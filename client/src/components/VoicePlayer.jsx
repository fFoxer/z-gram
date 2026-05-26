import React, { useRef, useState, useEffect } from 'react';
import { IoPlay, IoPause } from 'react-icons/io5';

const VoicePlayer = ({ url, durationString }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [displayDuration, setDisplayDuration] = useState(durationString || '0:00');

  // ✅ Безопасная очистка: проверяем, существует ли ref
  const cleanupAudio = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeEventListener('loadedmetadata', handleMeta);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('canplay', handleCanPlay);
    }
  };

  const handleMeta = () => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return; // ✅ Защита от null
    
    if (!durationString) {
      const d = audio.duration;
      const m = Math.floor(d / 60);
      const s = Math.floor(d % 60);
      setDisplayDuration(`${m}:${s.toString().padStart(2, '0')}`);
    }
  };

  const handleCanPlay = () => {
    setIsReady(true);
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return; // ✅ Защита от null
    
    const current = audio.currentTime;
    const duration = audio.duration;
    if (duration) {
      setProgress((current / duration) * 100);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !isReady) return; // ✅ Защита от null и готовности
    
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error('Playback error:', err);
        setIsPlaying(false);
      });
    }
  };

  // ✅ Основной эффект: навешиваем/снимаем слушатели
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Навешиваем слушатели
    audio.addEventListener('loadedmetadata', handleMeta);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('canplay', handleCanPlay);

    setIsReady(false);
    setProgress(0);
    setIsPlaying(false);

    // Если src уже загружен, кнопка должна быть доступна
    if (audio.readyState >= 3) {
      setIsReady(true);
    }

    // Принудительно подгружаем новый аудиофайл, чтобы не пропустить события
    audio.load();
    
    // Если длительность пришла из пропсов — используем её
    if (durationString) {
      setDisplayDuration(durationString);
    }

    // ✅ Cleanup при размонтировании
    return () => {
      cleanupAudio();
    };
  }, [url, durationString]); // ✅ Пересоздаём при смене URL

  // ✅ Отдельный эффект для сброса состояния при смене файла
  useEffect(() => {
    setProgress(0);
    setIsPlaying(false);
    if (durationString) {
      setDisplayDuration(durationString);
    } else {
      setDisplayDuration('0:00');
    }
  }, [url]);

  return (
    <div className="flex items-center gap-3 min-w-[200px]">
      <audio 
        ref={audioRef} 
        src={url} 
        className="hidden"
        preload="metadata"
      />

      {/* Кнопка Play/Pause */}
      <button 
        onClick={togglePlay}
        disabled={!isReady}
        className={`w-10 h-10 flex items-center justify-center rounded-full transition text-white ${
          isReady ? 'bg-white/20 hover:bg-white/30' : 'bg-gray-600 cursor-not-allowed'
        }`}
      >
        {isPlaying ? <IoPause size={20} /> : <IoPlay size={20} className="ml-0.5" />}
      </button>

      {/* Прогресс и длительность */}
      <div className="flex flex-col gap-1 flex-1">
        <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white transition-all duration-100" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <span className="text-xs text-gray-300 font-mono">{displayDuration}</span>
      </div>
    </div>
  );
};

export default VoicePlayer;