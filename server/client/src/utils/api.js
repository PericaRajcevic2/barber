import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  withCredentials: false,
  timeout: 15000,
});

// Simple exponential backoff
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

api.interceptors.response.use(
  res => res,
  async (error) => {
    const config = error.config || {};
    const method = (config.method || 'get').toLowerCase();

    // Only retry idempotent or allowed methods
    const canRetry = ['get', 'put', 'delete'].includes(method) || (config.retryOnPost === true);

    config.__retryCount = config.__retryCount || 0;
    const maxRetries = (config.maxRetries != null) ? config.maxRetries : 3;

    const isNetworkError = !error.response;
    const is5xx = error.response && error.response.status >= 500;

    if (canRetry && config.__retryCount < maxRetries && (isNetworkError || is5xx)) {
      config.__retryCount += 1;
      const delay = Math.min(2000, 300 * Math.pow(2, config.__retryCount - 1));
      await sleep(delay);
      return api(config);
    }

    // If offline and it's a mutating request, queue it
    if (!navigator.onLine && ['post', 'put', 'delete'].includes(method)) {
      try {
        const payload = {
          url: config.url,
          method: config.method,
          data: config.data,
          headers: config.headers,
          timestamp: Date.now(),
        };
        const key = 'offlineQueue';
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        existing.push(payload);
        localStorage.setItem(key, JSON.stringify(existing));
        // Return a fake response so UI can continue optimistically
        return Promise.resolve({ data: { queued: true }, status: 202, config });
      } catch (e) {
        // Ignore
      }
    }

    return Promise.reject(error);
  }
);

export default api;
