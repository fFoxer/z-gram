import React from 'react';
import { useSelector } from 'react-redux';
import AuthPage from './pages/AuthPage';
import Layout from './components/Layout';
import NoChatSelected from './components/NoChatSelected';
import ChatWindow from './components/ChatWindow';
import CallModal from './components/CallModal';
import { useSocket } from './hooks/useSocket';
import { useWebRTC } from './hooks/useWebRTC';

function App() {
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth);
  const activeChatId = useSelector((state) => state.chats.activeChat);
  const activeChat = useSelector((state) => state.chats.list?.find(c => c.id === state.chats.activeChat));
  const currentUserId = user?.id;

  // 1. Инициализируем сокет
  const socket = useSocket(activeChatId, currentUserId);

  // 2. Инициализируем WebRTC звонки
  const {
    callAccepted,
    isReceivingCall,
    isCallingOut,
    caller,
    myVideo,
    userVideo,
    userAudio,
    stream,
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
        caller={caller}
        callAccepted={callAccepted}
        myVideo={myVideo}
        userVideo={userVideo}
        userAudio={userAudio}
        stream={stream}
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

      <Layout>
        {activeChatId ? (
          <ChatWindow 
            socket={socket} 
            onStartCall={callUser} // ✅ Передаём функцию звонка вниз
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