import React, { useEffect, useRef, useState } from 'react';
import { IoClose, IoSend } from 'react-icons/io5';

const VoiceRecorder = ({ onSend, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null); // ✅ Запоминаем время начала

  useEffect(() => {
    startRecording();
    return () => {
      clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const formatTime = (secs) => {
    const minutes = Math.floor(secs / 60);
    const remainingSeconds = secs % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      startTimeRef.current = Date.now(); // ✅ Запоминаем когда начали

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        // ✅ Вычисляем длительность на основе реального времени
        const elapsedSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const duration = formatTime(elapsedSeconds);
        
        console.log('🎤 Остановка записи, длительность:', duration); // ✅ ЛОГ
        onSend(audioBlob, duration);
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      // Таймер только для отображения
      timerRef.current = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied:', err);
      alert('Не удалось получить доступ к микрофону');
      onCancel();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      streamRef.current.getTracks().forEach(track => track.stop());
      clearInterval(timerRef.current);
      setIsRecording(false);
    }
  };

  const handleCancel = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      streamRef.current.getTracks().forEach(track => track.stop());
      clearInterval(timerRef.current);
    }
    onCancel();
  };

  const formatDisplayTime = (secs) => {
    const minutes = Math.floor(secs / 60);
    const remainingSeconds = secs % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center justify-between w-full px-2">
      <button 
        onClick={handleCancel}
        className="p-2 text-gray-400 hover:text-red-400 transition"
      >
        <IoClose size={24} />
      </button>

      <div className="flex items-center gap-2 bg-[#484849] px-4 py-2 rounded-full">
        <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></div>
        <span className="text-white font-mono text-sm">{formatDisplayTime(seconds)}</span>
      </div>

      <button 
        onClick={stopRecording}
        disabled={!isRecording}
        className="p-2 text-gray-400 hover:text-blue-400 transition"
      >
        <IoSend size={24} />
      </button>
    </div>
  );
};

export default VoiceRecorder;