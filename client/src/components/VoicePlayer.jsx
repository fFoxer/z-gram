import React, { useRef, useState, useEffect } from 'react';
import { IoPlay, IoPause } from 'react-icons/io5';

const VoicePlayer = ({ url, durationString }) => {
console.log('🎵 VoicePlayer получил:', { url, durationString }); // ✅ ЛОГ
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Если durationString нет, будем пытаться считать его из файла
  const [displayDuration, setDisplayDuration] = useState(durationString || '0:00');

  // ✅ Эффект для получения длительности из аудиофайла
  useEffect(() => {
    if (audioRef.current) {
      // Если проп пустой, ждем загрузки метаданных
      if (!durationString) {
        const handleMeta = () => {
          const d = audioRef.current.duration;
          if (d) {
            const m = Math.floor(d / 60);
            const s = Math.floor(d % 60);
            setDisplayDuration(`${m}:${s.toString().padStart(2, '0')}`);
          }
        };
        audioRef.current.addEventListener('loadedmetadata', handleMeta);
        return () => audioRef.current.removeEventListener('loadedmetadata', handleMeta);
      } else {
        setDisplayDuration(durationString);
      }
    }
  }, [url, durationString]);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    const current = audioRef.current.currentTime;
    const duration = audioRef.current.duration;
    if (duration) {
      setProgress((current / duration) * 100);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  return (
    <div className="flex items-center gap-3 min-w-[200px]">
      <audio 
        ref={audioRef} 
        src={url} 
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        className="hidden"
        preload="metadata" // ✅ Важно для быстрого считывания длительности
      />

      {/* Кнопка Play/Pause */}
      <button 
        onClick={togglePlay}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition text-white"
      >
        {isPlaying ? <IoPause size={20} /> : <IoPlay size={20} className="ml-0.5" />}
      </button>

      {/* Визуальная часть */}
      <div className="flex flex-col gap-1 flex-1">
        {/* Полоска прогресса */}
        <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white transition-all duration-100" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        {/* ✅ Длительность */}
        <span className="text-xs text-gray-300 font-mono">{displayDuration}</span>
      </div>
    </div>
  );
};

export default VoicePlayer;