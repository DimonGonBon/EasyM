const STORAGE_KEY = 'instructions';

export function loadItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error(e);
    return [];
  }
}

export function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js');
  }
}



export function saveItems(items) {
  if (!Array.isArray(items)) {
    console.error('saveItems: invalid data');
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function setOnlineBadge(dotEl, textEl) {
  const update = () => {
    const online = navigator.onLine;
    if (dotEl) dotEl.classList.toggle('ok', online);
    if (dotEl) dotEl.classList.toggle('bad', !online);
    if (textEl) textEl.textContent = online ? 'ONLINE' : 'OFFLINE';
  };
  update();
  window.addEventListener('online', update);
  window.addEventListener('offline', update);

  setInterval(update, 1000);
}

export function setupOfflineBanner() {
  const banner = document.getElementById('offlineBanner');
  if (!banner) return;

  const update = () => {
    banner.hidden = navigator.onLine;
  };
  update();
  window.addEventListener('online', update);
  window.addEventListener('offline', update);

  setInterval(update, 1000);
}



export function requestLocation() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolokalizacja niedostępna'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        acc: pos.coords.accuracy
      }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

export async function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
