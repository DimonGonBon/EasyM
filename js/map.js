import {
  registerSW,
  setupOfflineBanner,
  setOnlineBadge,
  loadItems
} from './app.js';
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

  let lastCoords = null;

function renderList() {
  const items = loadItems();
  const withGeo = items.filter(i => i.lat != null && i.lng != null);

  listEl.innerHTML = '';

  if (withGeo.length === 0) {
    emptyEl.style.display = 'block';
    return;
  }

  emptyEl.style.display = 'none';

  for (const it of withGeo) {
    const card = document.createElement('div');
    card.className = 'card';

    const row = document.createElement('div');
    row.className = 'row';
    row.style.alignItems = 'flex-start';

    const left = document.createElement('div');
    left.style.flex = '2';

    const title = document.createElement('strong');
    title.textContent = it.title || 'Bez nazwy';

    const date = document.createElement('div');
    date.className = 'small';
    date.textContent = new Date(it.createdAt).toLocaleString();

    const coords = document.createElement('div');
    coords.className = 'small';
    coords.textContent = `lat: ${it.lat.toFixed(6)}, lng: ${it.lng.toFixed(6)}`;

    left.append(title, date, coords);

    const right = document.createElement('div');
    right.style.flex = '1';

    const link = document.createElement('a');
    link.href = `https://www.openstreetmap.org/?mlat=${it.lat}&mlon=${it.lng}#map=16/${it.lat}/${it.lng}`;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = 'Otwórz na mapie';

    right.appendChild(link);

    row.append(left, right);
    card.appendChild(row);
    listEl.appendChild(card);
  }
}


  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  }

  document.getElementById('btnLocate').addEventListener('click', () => {
    statusEl.textContent = '';
    if (!('geolocation' in navigator)) {
      statusEl.textContent = 'Geolokalizacja nie jest wspierana w tej przeglądarce.';
      return;
    }
    statusEl.textContent = 'Proszę o dostęp do geolokalizacji…';
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        coordsEl.textContent = `Współrzędne: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (±${Math.round(accuracy)}m)`;
        statusEl.textContent = 'Gotowe. (Zgoda przyznana)';
        lastCoords = { latitude, longitude };

      },
      (err) => {
        statusEl.textContent = `Błąd geolokalizacji: ${err.message}`;
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });

  document.getElementById('btnCopy').addEventListener('click', async () => {
     const c = lastCoords;
    if (!c) {
      statusEl.textContent = 'Najpierw kliknij „Pobierz bieżącą lokalizację”.';
      return;
    }
    const text = `${c.latitude}, ${c.longitude}`;
    try {
      await navigator.clipboard.writeText(text);
      statusEl.textContent = 'Współrzędne skopiowano do schowka.';
    } catch {
      statusEl.textContent = 'Nie udało się skopiować (przeglądarka zablokowała).';
    }
  });

  renderList();
