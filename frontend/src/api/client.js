import axios from 'axios';

export const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // send the httpOnly auth cookie
  timeout: 180000, // AI series generation can take a while
});

// Broadcast session expiry so the app can redirect to login from anywhere.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const url = error.config?.url || '';
    if (error.response?.status === 401 && !url.includes('/auth/')) {
      window.dispatchEvent(new Event('slk:unauthorized'));
    }
    return Promise.reject(error);
  }
);

/** Normalises an axios error into { message, fields }. */
export function parseError(error, fallback = 'Something went wrong. Please try again.') {
  if (!error.response) {
    if (error.code === 'ECONNABORTED') return { message: 'The request timed out. Please try again.', fields: {} };
    return { message: 'Cannot reach the server. Check your connection and that the API is running.', fields: {} };
  }
  const data = error.response.data || {};
  return { message: data.message || fallback, fields: data.details || {} };
}

/** Downloads a file from an authenticated API route. */
export async function downloadFile(url, fallbackName) {
  const res = await api.get(url, { responseType: 'blob', timeout: 300000 });
  const disposition = res.headers['content-disposition'] || '';
  const match = disposition.match(/filename="?([^"]+)"?/);
  const name = match ? match[1] : fallbackName;
  const href = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = href;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

export default api;
