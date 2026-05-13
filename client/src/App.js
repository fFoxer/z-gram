import React from 'react';
import { useSelector } from 'react-redux';
import AuthPage from './pages/AuthPage';
import Layout from './components/Layout';
import NoChatSelected from './components/NoChatSelected';
import ChatWindow from './components/ChatWindow';

function App() {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
  const activeChatId = useSelector((state) => state.chats.activeChat);

  if (loading) {
    return <div className="h-screen flex items-center justify-center bg-[#0e1621] text-white">Загрузка...</div>;
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <Layout>
      {/* Если чат выбран - показываем окно чата, иначе заглушку */}
      {activeChatId ? <ChatWindow /> : <NoChatSelected />}
    </Layout>
  );
}

export default App;