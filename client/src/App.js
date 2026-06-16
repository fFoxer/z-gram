import React, { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import AuthPage from './pages/AuthPage';
import Layout from './components/Layout';
import NoChatSelected from './components/NoChatSelected';
import ChatWindow from './components/ChatWindow';
import CallModal from './components/CallModal';
import NotificationToast from './components/NotificationToast';
import { useSocket } from './hooks/useSocket';
import { useWebRTC } from './hooks/useWebRTC';
import { initAuth } from './store/authSlice';

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(initAuth());
  }, [dispatch]);
  const activeChatId = useSelector((state) => state.chats.activeChat);
  const activeChat = useSelector((state) => state.chats.list?.find(c => c.id === state.chats.activeChat));
  const currentUserId = user?.id;

  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((notif) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, ...notif }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  // 1. Инициализируем сокет
  const socket = useSocket(activeChatId, currentUserId, addToast);

  // 2. Инициализируем WebRTC звонки
  const {
    callAccepted,
    isReceivingCall,
    isCallingOut,
    incomingVideo,
    caller,
    myVideo,
    userVideo,
    userAudio,
    stream,
    remoteStream,
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
  } = useWebRTC(socket, currentUserId);

  if (loading) {
    return <div className="h-screen flex items-center justify-center bg-[#0e1621] text-white">Загрузка...</div>;
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <>
      {/* Модальное окно звонка (поверх всего приложения) */}
      <CallModal
        isReceivingCall={isReceivingCall}
        isCallingOut={isCallingOut}
        incomingVideo={incomingVideo}
        caller={caller}
        callAccepted={callAccepted}
        myVideo={myVideo}
        userVideo={userVideo}
        userAudio={userAudio}
        stream={stream}
        remoteStream={remoteStream}
        remoteVideoActive={remoteVideoActive}
        remoteAvatar={activeChat?.avatar}
        remoteName={activeChat?.name}
        myAvatar={user?.avatar}
        answerCall={answerCall}
        rejectCall={rejectCall}
        endCall={endCall}
        audioEnabled={audioEnabled}
        videoEnabled={videoEnabled}
        toggleAudio={toggleAudio}
        toggleVideo={toggleVideo}
        callError={callError}
        clearError={clearError}
      />

      <NotificationToast notifications={toasts} onRemove={id => setToasts(prev => prev.filter(t => t.id !== id))} />

      <Layout>
        {activeChatId ? (
          <ChatWindow
            socket={socket}
            onStartCall={callUser}
            isCallReady={streamReady}
          />
        ) : (
          <NoChatSelected />
        )}
      </Layout>
    </>
  );
}

export default App;