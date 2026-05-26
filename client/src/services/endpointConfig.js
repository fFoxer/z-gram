const getHostUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL.replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    return `${protocol}//${hostname}:5000`;
  }

  return 'http://localhost:5000';
};

const API_URL = `${getHostUrl()}/api`;
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || getHostUrl();
const UPLOAD_URL = `${API_URL}/upload`;

const resolveUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${getHostUrl()}${url}`;
};

export { API_URL, SOCKET_URL, UPLOAD_URL, resolveUrl };
