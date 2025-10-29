// Flush queued offline actions when back online
import api from './api';

function getQueue() {
  try { return JSON.parse(localStorage.getItem('offlineQueue') || '[]'); } catch { return []; }
}
function setQueue(q) { localStorage.setItem('offlineQueue', JSON.stringify(q)); }

export async function flushQueue() {
  const queue = getQueue();
  if (!queue.length) return;
  const remaining = [];

  for (const item of queue) {
    try {
      await api({
        url: item.url,
        method: item.method,
        data: item.data,
        headers: item.headers,
        maxRetries: 2,
      });
    } catch (e) {
      remaining.push(item);
    }
  }

  setQueue(remaining);
}

export function setupOfflineQueue() {
  window.addEventListener('online', () => {
    flushQueue().catch(() => {});
  });

  // Attempt to flush on app start
  if (navigator.onLine) {
    flushQueue().catch(() => {});
  }
}

// Auto-setup on import
setupOfflineQueue();
