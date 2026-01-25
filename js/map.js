import {
  registerSW,
  setupOfflineBanner,
  setOnlineBadge,
  loadItems,
  getCurrentUser,
  logoutUser
} from './app.js';

if (!getCurrentUser()) {
  window.location.href = './login.html';
}

const CONFIG = {
  COORDS_PRECISION: 6,
  GEOLOCATION_TIMEOUT: 8000,
  GEOLOCATION_UNSUPPORTED: 'Geolokalizacja nie jest wspierana w tej przeglądarce.',
  GEOLOCATION_REQUESTING: 'Proszę o dostęp do geolokalizacji…',
  GEOLOCATION_SUCCESS: 'Gotowe. (Zgoda przyznana)',
  GEOLOCATION_ERROR_PREFIX: 'Błąd geolokalizacji: ',
  COPY_PROMPT: 'Najpierw kliknij "Pobierz bieżącą lokalizację".',
  COPY_SUCCESS: 'Współrzędne skopiowano do schowka.',
  COPY_ERROR: 'Nie udało się skopiować (przeglądarka zablokowała)',
  NO_TITLE: 'Bez nazwy',
  OSM_URL: 'https://www.openstreetmap.org/',
  MAP_LINK_TEXT: 'Otwórz na mapie',
  CARD_CLASS: 'card',
  ROW_CLASS: 'row',
  SMALL_CLASS: 'small'
};

setupOfflineBanner();
registerSW();

setOnlineBadge(
  document.getElementById('statusDot'),
  document.getElementById('statusText')
);

const coordsEl = document.getElementById('coords');
const statusEl = document.getElementById('status');
const listEl = document.getElementById('list');
const emptyEl = document.getElementById('empty');
const btnLocate = document.getElementById('btnLocate');
const btnCopy = document.getElementById('btnCopy');
const logoutLink = document.getElementById('logoutLink');

let lastCoords = null;

logoutLink?.addEventListener('click', (e) => {
  e.preventDefault();
  logoutUser();
  window.location.href = './login.html';
});

function createMapCardElement(item) {
  const card = document.createElement('div');
  card.className = CONFIG.CARD_CLASS;

  const row = document.createElement('div');
  row.className = CONFIG.ROW_CLASS;
  row.style.alignItems = 'flex-start';

  const left = document.createElement('div');
  left.style.flex = '2';

  const title = document.createElement('strong');
  title.textContent = item.title || CONFIG.NO_TITLE;

  const date = document.createElement('div');
  date.className = CONFIG.SMALL_CLASS;
  date.textContent = new Date(item.createdAt).toLocaleString();

  const coords = document.createElement('div');
  coords.className = CONFIG.SMALL_CLASS;
  coords.textContent = `lat: ${item.location.lat.toFixed(CONFIG.COORDS_PRECISION)}, lng: ${item.location.lon.toFixed(CONFIG.COORDS_PRECISION)}`;

  left.append(title, date, coords);

  const right = document.createElement('div');
  right.style.flex = '1';

  const link = document.createElement('a');
  // Создаёт ссылку на OpenStreetMap с геолокацией
  link.href = `${CONFIG.OSM_URL}?mlat=${item.location.lat}&mlon=${item.location.lon}#map=16/${item.location.lat}/${item.location.lon}`;
  link.target = '_blank';
  link.rel = 'noopener';
  link.textContent = CONFIG.MAP_LINK_TEXT;

  right.appendChild(link);

  row.append(left, right);
  card.appendChild(row);
  return card;
}

function renderList() {
  const items = loadItems(); // Загружает все инструкции пользователя
  // Фильтрует только инструкции которые имеют сохранённую геолокацию
  const withGeo = items.filter(i => i.location?.lat != null && i.location?.lon != null);

  listEl.innerHTML = '';

  if (withGeo.length === 0) {
    emptyEl.style.display = 'block';
    return;
  }

  emptyEl.style.display = 'none';

  withGeo.forEach((item) => {
    const cardElement = createMapCardElement(item);
    listEl.appendChild(cardElement);
  });
}

btnLocate.addEventListener('click', () => {
  statusEl.textContent = '';
  if (!('geolocation' in navigator)) {
    statusEl.textContent = CONFIG.GEOLOCATION_UNSUPPORTED;
    return;
  }
  statusEl.textContent = CONFIG.GEOLOCATION_REQUESTING;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude, accuracy } = pos.coords;
      coordsEl.textContent = `Współrzędne: ${latitude.toFixed(CONFIG.COORDS_PRECISION)}, ${longitude.toFixed(CONFIG.COORDS_PRECISION)} (±${Math.round(accuracy)}m)`;
      statusEl.textContent = CONFIG.GEOLOCATION_SUCCESS;
      lastCoords = { latitude, longitude }; // Сохраняет текущие координаты в переменную
    },
    (err) => {
      statusEl.textContent = CONFIG.GEOLOCATION_ERROR_PREFIX + err.message;
    },
    { enableHighAccuracy: true, timeout: CONFIG.GEOLOCATION_TIMEOUT }
  );
});

btnCopy.addEventListener('click', async () => {
  if (!lastCoords) {
    statusEl.textContent = CONFIG.COPY_PROMPT;
    return;
  }
  const text = `${lastCoords.latitude}, ${lastCoords.longitude}`;
  try {
    await navigator.clipboard.writeText(text); // Копирует координаты в буфер обмена
    statusEl.textContent = CONFIG.COPY_SUCCESS;
  } catch {
    statusEl.textContent = CONFIG.COPY_ERROR;
  }
});

renderList();
