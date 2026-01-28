import {
  loadItems,
  saveItems,
  setOnlineBadge,
  registerSW,
  requestLocation,
  fileToDataURL,
  setupOfflineBanner,
  getCurrentUser,
  logoutUser
} from './app.js';

if (!getCurrentUser()) {
  window.location.href = './login.html';
}

const CONFIG = {
  MESSAGES: {
    REQUESTING_LOCATION: 'Proszę o dostęp do lokalizacji…',
    LOCATION_ERROR: 'Nie udało się pobrać lokalizacji (brak zgody lub GPS wyłączony).',
    EMPTY_FORM: 'Dodaj przynajmniej tytuł, opis albo zdjęcie.',
    REDIRECT_PATH: './index.html'
  },
  DISPLAY: {
    LOCATION_PRECISION: 5,
    ACCURACY_PRECISION: 0
  }
};

setupOfflineBanner();
registerSW();
setOnlineBadge(
  document.getElementById('statusDot'),
  document.getElementById('statusText')
);

const titleEl = document.getElementById('title');
const notesEl = document.getElementById('notes');
const photoEl = document.getElementById('photo');
const previewEl = document.getElementById('preview');
const noPreviewEl = document.getElementById('noPreview');
const saveBtn = document.getElementById('saveBtn');
const locBtn = document.getElementById('locBtn');
const locInfo = document.getElementById('locInfo');
const logoutLink = document.getElementById('logoutLink');

let photoDataUrl = '';
let locationObj = null;

logoutLink?.addEventListener('click', (e) => {
  e.preventDefault();
  logoutUser();
  window.location.href = './login.html';
});

/* Фото преобразует файл в Data URL для сохранения */
photoEl.addEventListener('change', async () => {
  const file = photoEl.files?.[0];
  if (!file) return;

  photoDataUrl = await fileToDataURL(file); // Преобразует файл в датаюрл для сохранения локалку
  previewEl.src = photoDataUrl;
  previewEl.style.display = 'block';
  if (noPreviewEl) noPreviewEl.style.display = 'none';
});

/*Получение локации */
locBtn.addEventListener('click', async () => {
  locInfo.textContent = CONFIG.MESSAGES.REQUESTING_LOCATION;
  try {
    locationObj = await requestLocation(); // Получает GPS позицию с устройства
    const latFixed = locationObj.lat.toFixed(CONFIG.DISPLAY.LOCATION_PRECISION);
    const lonFixed = locationObj.lon.toFixed(CONFIG.DISPLAY.LOCATION_PRECISION);
    const accRounded = Math.round(locationObj.acc);
    locInfo.textContent = `OK: lat ${latFixed}, lon ${lonFixed} (±${accRounded} m)`;
  } catch (e) {
    locationObj = null;
    locInfo.textContent = CONFIG.MESSAGES.LOCATION_ERROR;
  }
});

/* Сохранение инструкций записывает данные в локалку*/
saveBtn.addEventListener('click', () => {
  const title = (titleEl.value || '').trim();
  const notes = (notesEl.value || '').trim();

  if (!title && !notes && !photoDataUrl) {
    alert(CONFIG.MESSAGES.EMPTY_FORM);
    return;
  }

  const items = loadItems(); // Загружает все инструкции пользователя
  items.push({
    id: crypto.randomUUID?.() || String(Date.now()), // Генерирует уникальный ID для инструкции
    title,
    notes,
    photoDataUrl, // Сохраняет изображение как датаюрл басе 64
    location: locationObj ? { // Сохраняет локацию если пользователь её получил
      lat: locationObj.lat,
      lon: locationObj.lon,
      acc: locationObj.acc
    } : null,
    createdAt: Date.now(),
    steps: [] 
  });

  saveItems(items); // Сохраняет весь массив в локалку с новой инструкцией
  window.location.href = CONFIG.MESSAGES.REDIRECT_PATH;
});
