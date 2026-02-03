const CONFIG = {
  STORAGE_KEY: 'instructions',
  SERVICE_WORKER_PATH: '/service-worker.js',
  GEOLOCATION_NOT_AVAILABLE: 'Geolokalizacja niedostępna',
  GEOLOCATION_TIMEOUT: 10000,
  STATUS_UPDATE_INTERVAL: 1000,
  ONLINE_CLASS: 'ok',
  OFFLINE_CLASS: 'bad',
  ONLINE_TEXT: 'ONLINE',
  OFFLINE_TEXT: 'OFFLINE'
};

// Загружает пользователя из локалки со своим айди
export function loadItems() {
  try {
    const storageKey = getUserStorageKey('instructions'); // Генерирует ключ типа instructions_username
    const raw = localStorage.getItem(storageKey);
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error(e);
    return [];
  }
}

export function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register(CONFIG.SERVICE_WORKER_PATH);
  }
}

// Сохраняет инструкции в локалку под айди пользователя
export function saveItems(items) {
  if (!Array.isArray(items)) {
    console.error('saveItems: invalid data');
    return;
  }
  const storageKey = getUserStorageKey('instructions'); // Каждый пользователь имеет отдельное хранилище
  localStorage.setItem(storageKey, JSON.stringify(items));
}

export function setOnlineBadge(dotEl, textEl) {
  const update = () => {
    const online = navigator.onLine;
    if (dotEl) {
      dotEl.classList.toggle(CONFIG.ONLINE_CLASS, online);
      dotEl.classList.toggle(CONFIG.OFFLINE_CLASS, !online);
    }
    if (textEl) {
      textEl.textContent = online ? CONFIG.ONLINE_TEXT : CONFIG.OFFLINE_TEXT;
    }
  };
  update();
  window.addEventListener('online', update);
  window.addEventListener('offline', update);
  setInterval(update, CONFIG.STATUS_UPDATE_INTERVAL);
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
  setInterval(update, CONFIG.STATUS_UPDATE_INTERVAL);
}

export function requestLocation() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error(CONFIG.GEOLOCATION_NOT_AVAILABLE));
      return;
    }
    // Получает геолокацию высокой точности
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        acc: pos.coords.accuracy
      }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: CONFIG.GEOLOCATION_TIMEOUT }
    );
  });
}

export async function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    // Преобразует файл в датаюрл для сохранения в локалку
    reader.readAsDataURL(file);
  });
}

export function showConfirmModal(message) {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999';

    const dialog = document.createElement('div');
    dialog.style.cssText = 'background:white;padding:20px;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.2);max-width:400px;text-align:center';

    const text = document.createElement('p');
    text.textContent = message;
    text.style.marginBottom = '20px';

    const btnContainer = document.createElement('div');
    btnContainer.style.display = 'flex';
    btnContainer.style.gap = '10px';
    btnContainer.style.justifyContent = 'center';

    const btnYes = document.createElement('button');
    btnYes.textContent = 'Tak';
    btnYes.style.cssText = 'padding:8px 16px;cursor:pointer;background:#4CAF50;color:white;border:none;border-radius:4px';
    btnYes.addEventListener('click', () => {
      modal.remove();
      resolve(true);
    });

    const btnNo = document.createElement('button');
    btnNo.textContent = 'Nie';
    btnNo.style.cssText = 'padding:8px 16px;cursor:pointer;background:#f44336;color:white;border:none;border-radius:4px';
    btnNo.addEventListener('click', () => {
      modal.remove();
      resolve(false);
    });

    btnContainer.append(btnYes, btnNo);
    dialog.append(text, btnContainer);
    modal.appendChild(dialog);
    document.body.appendChild(modal);
  });
}

export function initializeUser() {
  const user = sessionStorage.getItem('currentUser');
  return user ? JSON.parse(user) : null;
}

// Сохраняет данные вошедшего пользователя в ссесию
export function setCurrentUser(username) {
  sessionStorage.setItem('currentUser', JSON.stringify({ username, loginTime: Date.now() }));
}

// Очищает данные после вылогина
export function logoutUser() {
  sessionStorage.removeItem('currentUser');
}

// Возвращает аткуальный логин пользователя
export function getCurrentUser() {
  const user = sessionStorage.getItem('currentUser');
  return user ? JSON.parse(user).username : null;
}

// генерирует уникальный ключ для каждого юзера 
export function getUserStorageKey(prefix = '') {
  const user = getCurrentUser();
  if (!user) throw new Error('No user logged in');
  return prefix ? `${prefix}_${user}` : `data_${user}`;
}

export function registerUser(username, password) {
  const users = JSON.parse(localStorage.getItem('users') || '{}');
  if (users[username]) {
    return { success: false, error: 'Użytkownik już istnieje' };
  }
  
  // Кодирует пароль в base64 и сохраняет нового пользователя
  const hashedPassword = btoa(password);
  users[username] = { password: hashedPassword, created: Date.now() };
  localStorage.setItem('users', JSON.stringify(users));
  return { success: true };
}

// Проверяет правильность пароля и устанавливает вошедшего пользователя
export function loginUser(username, password) {
  const users = JSON.parse(localStorage.getItem('users') || '{}');
  if (!users[username]) {
    return { success: false, error: 'Użytkownik nie znaleziony' };
  }
  
  const hashedPassword = btoa(password); // То же самое кодирование что и при регистрации
  if (users[username].password !== hashedPassword) {
    return { success: false, error: 'Niepoprawne hasło' };
  }
  
  setCurrentUser(username); // Сохраняет что этот пользователь вошёл в систему
  return { success: true };
}
// Инициализирует функцию установки приложения
export function setupInstallPrompt() {
  let deferredPrompt = null;

  // Перехватываем событие beforeinstallprompt
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    showInstallButton();
  });

  // Обработчик для кнопки установки
  const installLink = document.getElementById('installAppLink');
  if (installLink) {
    installLink.addEventListener('click', async (e) => {
      e.preventDefault();
      if (!deferredPrompt) {
        // Если nativePrompt не сработал, показываем инструкцию
        alert('Приложение можно установить через меню браузера (Share → Add to Home Screen на мобиле, или меню браузера на ПК)');
        return;
      }
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`Пользователь выбрал: ${outcome}`);
      deferredPrompt = null;
      hideInstallButton();
    });
  }

  // Скрываем кнопку при успешной установке
  window.addEventListener('appinstalled', () => {
    console.log('PWA была установлена');
    hideInstallButton();
  });
}

function showInstallButton() {
  const link = document.getElementById('installAppLink');
  if (link) {
    link.style.display = 'inline';
    link.style.color = '#1f5eff';
  }
}

function hideInstallButton() {
  const link = document.getElementById('installAppLink');
  if (link) {
    link.style.display = 'none';
  }
}