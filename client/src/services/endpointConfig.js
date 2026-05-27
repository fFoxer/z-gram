const getHostUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL.replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    // Dev: React на :3000, API на :5000
    if (port === '3000') return `${protocol}//${hostname}:5000`;
    // Prod / ngrok: клиент и API на одном сервере/домене
    return `${protocol}//${hostname}${port ? ':' + port : ''}`;
  }

  return 'http://localhost:5000';
};

const API_URL = `${getHostUrl()}/api`;
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || getHostUrl();
const UPLOAD_URL = `${API_URL}/upload`;

const resolveUrl = (url) => {
  if (!url) return null;
  // Заменяем localhost/127.0.0.1 на актуальный хост (для LAN-пользователей)
  if (url.match(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/)) {
    try {
      const path = new URL(url).pathname;
      return `${getHostUrl()}${path}`;
    } catch { return url; }
  }
  if (url.startsWith('http')) return url;
  return `${getHostUrl()}${url}`;
};

export { API_URL, SOCKET_URL, UPLOAD_URL, resolveUrl };
