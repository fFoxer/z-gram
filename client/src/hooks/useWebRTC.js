import { useState, useEffect, useRef, useCallback } from 'react';
import Peer from 'simple-peer';

export const useWebRTC = (socket, currentUserId) => {
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [stream, setStream] = useState(null);
  const [streamReady, setStreamReady] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [remoteVideoActive, setRemoteVideoActive] = useState(false);
  const [incomingVideo, setIncomingVideo] = useState(true);
  const [isReceivingCall, setIsReceivingCall] = useState(false);
  const [isCallingOut, setIsCallingOut] = useState(false);
  const [caller, setCaller] = useState('');
  const [callerSignal, setCallerSignal] = useState(null);
  const [currentCallTarget, setCurrentCallTarget] = useState('');
  const [callError, setCallError] = useState(null);

  const myVideo = useRef();
  const userVideo = useRef();
  const userAudio = useRef();
  const connectionRef = useRef();
  const answerHandlerRef = useRef();
  const rejectHandlerRef = useRef();
  const callRejectedHandlerRef = useRef();

  // Refs for stable access inside callbacks (avoid stale closures)
  const callTimeoutRef = useRef(null);
  const streamRef = useRef(null);
  const currentCallTargetRef = useRef('');
  const callerRef = useRef('');

  const checkWebRTCSupport = useCallback(() => {
    if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      console.error('❌ WebRTC требует HTTPS! Текущий протокол:', window.location.protocol);
      return false;
    }
    return true;
  }, []);

  const ensureStream = async (constraints = { video: true, audio: true }) => {
    if (streamRef.current) {
      const hasVideo = streamRef.current.getVideoTracks().length > 0;
      if (constraints.video === false && !hasVideo) return streamRef.current;
      if (constraints.video === true && hasVideo) return streamRef.current;
      try { streamRef.current.getTracks().forEach(t => t.stop()); } catch (e) {}
      streamRef.current = null;
      setStream(null);
    }

    const getUserMedia = navigator.mediaDevices?.getUserMedia?.bind(navigator.mediaDevices);
    if (!getUserMedia) {
      console.error('❌ getUserMedia is not available in this browser/context.');
      setStreamReady(false);
      return null;
    }

    try {
      const currentStream = await getUserMedia(constraints);
      streamRef.current = currentStream;
      setStream(currentStream);
      setStreamReady(true);
      setAudioEnabled(!!constraints.audio);
      setVideoEnabled(!!constraints.video && currentStream.getVideoTracks().length > 0);
      if (myVideo.current && currentStream.getVideoTracks().length > 0) myVideo.current.srcObject = currentStream;
      return currentStream;
    } catch (err) {
      console.error('❌ Camera access denied:', err);
      setStreamReady(false);
      return null;
    }
  };

  const toggleAudio = (enabled) => {
    const s = streamRef.current;
    if (!s) return;
    const audioTracks = s.getAudioTracks();
    if (!audioTracks || audioTracks.length === 0) return;
    const newState = typeof enabled === 'boolean' ? enabled : !audioEnabled;
    audioTracks.forEach(t => { t.enabled = newState; });
    setAudioEnabled(newState);
  };

  const toggleVideo = (enabled) => {
    const s = streamRef.current;
    if (!s) return;
    const videoTracks = s.getVideoTracks();
    if (!videoTracks || videoTracks.length === 0) return;
    const newState = typeof enabled === 'boolean' ? enabled : !videoEnabled;
    videoTracks.forEach(t => { t.enabled = newState; });
    setVideoEnabled(newState);
  };

  // Завершение звонка — использует refs, поэтому всегда видит актуальные значения
  const endCall = useCallback(() => {
    setCallEnded(true);

    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }

    if (connectionRef.current) {
      try { connectionRef.current.destroy(); } catch (e) { console.warn('Error destroying connection', e); }
      connectionRef.current = null;
    }

    const targetUser = currentCallTargetRef.current || callerRef.current;
    if (socket && targetUser) socket.emit('end-call', { to: targetUser });

    if (myVideo.current) myVideo.current.srcObject = null;
    if (userVideo.current) userVideo.current.srcObject = null;

    const currentStream = streamRef.current;
    if (currentStream) {
      try { currentStream.getTracks().forEach(track => track.stop()); } catch (e) { console.warn('Error stopping tracks', e); }
      streamRef.current = null;
      setStream(null);
      setStreamReady(false);
    }

    if (socket && answerHandlerRef.current) {
      try { socket.off('answer-made', answerHandlerRef.current); } catch (e) {}
      answerHandlerRef.current = null;
    }

    if (socket && callRejectedHandlerRef.current) {
      try { socket.off('call-rejected', callRejectedHandlerRef.current); } catch (e) {}
      callRejectedHandlerRef.current = null;
    }

    setRemoteVideoActive(false);
    setCallAccepted(false);
    setIsCallingOut(false);
    setIsReceivingCall(false);
    setCaller('');
    callerRef.current = '';
    setCallerSignal(null);
    setCurrentCallTarget('');
    currentCallTargetRef.current = '';
    setCallError(null);
  }, [socket]);

  // Инициация звонка
  const callUser = async (id, options = { video: true }) => {
    console.log('useWebRTC.callUser called', { id, socketConnected: !!socket?.connected, hasStream: !!streamRef.current, currentUserId });

    if (!checkWebRTCSupport()) {
      setCallError('WebRTC требует HTTPS соединения. Пожалуйста, используйте HTTPS.');
      return;
    }

    if (!socket) {
      console.error('❌ Cannot make call: socket is not connected');
      setCallError('Сокет не подключен. Попробуйте обновить страницу.');
      return;
    }
    if (!socket.connected) {
      console.error('❌ Cannot make call: socket exists but is not connected yet');
      setCallError('Сокет еще не подключен. Попробуйте через несколько секунд.');
      return;
    }

    setCurrentCallTarget(id);
    currentCallTargetRef.current = id;
    setCallError(null);

    const constraints = { audio: true, video: !!options.video };
    const currentStream = await ensureStream(constraints);
    if (!currentStream) {
      setCallError('Не удалось получить доступ к камере/микрофону. Звонок отменён.');
      currentCallTargetRef.current = '';
      setCurrentCallTarget('');
      return;
    }

    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: currentStream,
    });

    peer.on('signal', (data) => {
      socket.emit('call-user', {
        userToCall: id,
        signalData: data,
        from: currentUserId,
        video: !!options.video
      });
    });

    peer.on('stream', (remoteStream) => {
      if (userVideo.current) userVideo.current.srcObject = remoteStream;
      if (userAudio.current) userAudio.current.srcObject = remoteStream;
      setRemoteVideoActive(remoteStream?.getVideoTracks?.().length > 0);
    });

    const handleAnswerMade = (data) => {
      try {
        peer.signal(data.signal);
        setCallAccepted(true);
        setIsCallingOut(false);
        if (callTimeoutRef.current) {
          clearTimeout(callTimeoutRef.current);
          callTimeoutRef.current = null;
        }
      } catch (e) {
        console.error('Error handling answer-made', e);
      }
    };

    const handleCallRejected = () => {
      console.log('Звонок отклонен пользователем');
      setCallError('Пользователь отклонил звонок');
      endCall();
    };

    answerHandlerRef.current = handleAnswerMade;
    callRejectedHandlerRef.current = handleCallRejected;

    socket.on('answer-made', handleAnswerMade);
    socket.on('call-rejected', handleCallRejected);

    // Таймаут 30 секунд — сохраняем в ref, чтобы endCall всегда мог его очистить
    callTimeoutRef.current = setTimeout(() => {
      setCallError('Пользователь не ответил');
      endCall();
    }, 30000);

    peer.on('error', (err) => {
      console.error('Peer error', err);
      setCallError('Ошибка соединения: ' + err.message);
    });

    peer.on('close', () => {
      try { endCall(); } catch (e) {}
    });

    connectionRef.current = peer;
    setIsCallingOut(true);
  };

  // Ответ на звонок
  const answerCall = async ({ video } = {}) => {
    console.log('useWebRTC.answerCall called', { socketConnected: !!socket?.connected, caller, callerSignal });

    if (!checkWebRTCSupport()) {
      setCallError('WebRTC требует HTTPS соединения.');
      return;
    }

    if (!socket?.connected) {
      setCallError('Сокет не подключен.');
      return;
    }

    if (!callerSignal) {
      setCallError('Сигнал от звонящего еще не получен.');
      return;
    }

    const withVideo = video !== undefined ? !!video : incomingVideo;
    const currentStream = await ensureStream({ audio: true, video: withVideo });
    if (!currentStream) {
      setCallError('Не удалось получить доступ к камере/микрофону. Звонок не может быть принят.');
      return;
    }

    setCallAccepted(true);
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: currentStream,
    });

    peer.on('signal', (data) => {
      socket.emit('make-answer', {
        signalData: data,
        to: callerRef.current || caller
      });
    });

    peer.on('stream', (remoteStream) => {
      if (userVideo.current) userVideo.current.srcObject = remoteStream;
      if (userAudio.current) userAudio.current.srcObject = remoteStream;
      setRemoteVideoActive(remoteStream?.getVideoTracks?.().length > 0);
    });

    try {
      peer.signal(callerSignal);
    } catch (e) {
      console.error('Error signaling caller:', e);
      setCallError('Ошибка при установке соединения.');
      return;
    }

    peer.on('error', (err) => {
      console.error('Peer error', err);
      setCallError('Ошибка соединения: ' + err.message);
    });

    connectionRef.current = peer;
  };

  // Отклонение входящего звонка
  const rejectCall = () => {
    const target = callerRef.current || caller;
    if (socket && target) socket.emit('reject-call', { to: target });
    setIsReceivingCall(false);
    setCaller('');
    callerRef.current = '';
    setCallerSignal(null);
    setCallError(null);
  };

  const clearError = () => setCallError(null);

  useEffect(() => {
    if (!socket) return;

    const handleCallMade = (data) => {
      setIsReceivingCall(true);
      setCaller(data.from);
      callerRef.current = String(data.from);
      setCallerSignal(data.signal);
      setIncomingVideo(data.video !== false);
      setCallError(null);
    };

    const handleCallEnded = () => {
      setCallEnded(true);
      try { endCall(); } catch (e) {}
    };

    socket.on('call-made', handleCallMade);
    socket.on('call-ended', handleCallEnded);

    return () => {
      socket.off('call-made', handleCallMade);
      socket.off('call-ended', handleCallEnded);
      if (connectionRef.current) connectionRef.current.destroy();
      if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
    };
  }, [socket, endCall]);

  return {
    callAccepted,
    callEnded,
    stream,
    isReceivingCall,
    receivingCall: isReceivingCall,
    isCallingOut,
    caller,
    callerSignal,
    myVideo,
    userVideo,
    userAudio,
    callUser,
    answerCall,
    endCall,
    rejectCall,
    streamReady,
    remoteVideoActive,
    audioEnabled,
    videoEnabled,
    toggleAudio,
    toggleVideo,
    callError,
    clearError
  };
};
