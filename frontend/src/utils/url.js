export const getMediaUrl = (url) => {
  if (!url) return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:8000'
      : ''
  );

  return `${BACKEND_URL}${url}`;
};
