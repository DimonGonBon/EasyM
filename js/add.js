import {
  loadItems,
  saveItems,
  setOnlineBadge,
  registerSW,
  requestLocation,
  fileToDataURL,
  setupOfflineBanner
} from './app.js';

setupOfflineBanner();
registerSW();
setOnlineBadge(document.getElementById('onlineBadge'));


const titleEl = document.getElementById('title');
const notesEl = document.getElementById('notes');
const photoEl = document.getElementById('photo');
const previewEl = document.getElementById('preview');
const noPreviewEl = document.getElementById('noPreview');
const saveBtn = document.getElementById('saveBtn');
const locBtn = document.getElementById('locBtn');
const locInfo = document.getElementById('locInfo');

let photoDataUrl = '';
let locationObj = null;



photoEl.addEventListener('change', async () => {
  const file = photoEl.files?.[0];
  if (!file) return;

  photoDataUrl = await fileToDataURL(file);

  // podgląd
  previewEl.src = photoDataUrl;
  previewEl.style.display = 'block';
  if (noPreviewEl) noPreviewEl.style.display = 'none';
});

locBtn.addEventListener('click', async () => {
  locInfo.textContent = 'Proszę o dostęp do lokalizacji…';
  try {
    locationObj = await requestLocation();
    locInfo.textContent = `OK: lat ${locationObj.lat.toFixed(5)}, lon ${locationObj.lon.toFixed(5)} (±${Math.round(locationObj.acc)} m)`;
  } catch (e) {
    locationObj = null;
    locInfo.textContent = 'Nie udało się pobrać lokalizacji (brak zgody lub GPS wyłączony).';
  }
});

saveBtn.addEventListener('click', () => {
  const title = (titleEl.value || '').trim();
  const notes = (notesEl.value || '').trim();

  if (!title && !notes && !photoDataUrl) {
    alert('Dodaj przynajmniej tytuł, opis albo zdjęcie.');
    return;
  }

  const items = loadItems();
  items.push({
    id: crypto.randomUUID?.() || String(Date.now()),
    title,
    notes,
    photoDataUrl,
    location: locationObj,
    createdAt: Date.now()
  });
  
  saveItems(items);
  window.location.href = './index.html';
});
