import {
  loadItems,
  saveItems,
  setOnlineBadge,
  registerSW,
  setupOfflineBanner,
  showConfirmModal,
  getCurrentUser,
  logoutUser,
  setupInstallPrompt
} from './app.js';

const CONFIG = {
  EMPTY_MESSAGE: 'Na razie pusto. Kliknij "Dodaj" i utwórz pierwszy wpis.',
  NO_TITLE: 'Bez nazwy',
  NOTES_LENGTH_LIMIT: 120,
  TRUNCATE_SUFFIX: '…',
  IMAGE_ALT: 'Zdjęcie instrukcji',
  ITEM_CLASS: 'item',
  THUMB_CLASS: 'thumb',
  CARD_CLASS: 'card',
  CONFIRM_DELETE_ALL: 'Na pewno usunąć wszystkie wpisy?',
  DISPLAY_BLOCK: 'block',
  DISPLAY_NONE: 'none'
};

if (!getCurrentUser()) {
  window.location.href = './login.html';
}

setupOfflineBanner();
registerSW();
setupInstallPrompt();

setOnlineBadge(
  document.getElementById('statusDot'),
  document.getElementById('statusText')
);

const listEl = document.getElementById('list');
const clearBtn = document.getElementById('clearBtn');
const installBtn = document.getElementById('installBtn');
const logoutLink = document.getElementById('logoutLink');

logoutLink?.addEventListener('click', (e) => {
  e.preventDefault();
  logoutUser();
  window.location.href = './login.html';
});

function createEmptyState() {
  const empty = document.createElement('div');
  empty.className = CONFIG.CARD_CLASS;
  const small = document.createElement('small');
  small.textContent = CONFIG.EMPTY_MESSAGE;
  empty.appendChild(small);
  return empty;
}

function createItemElement(item) {
  const element = document.createElement('div');
  element.className = CONFIG.ITEM_CLASS;
  element.style.cursor = 'pointer';
  element.addEventListener('click', () => {
    window.location.href = `./details.html?id=${item.id}`;
  });

  const h3 = document.createElement('h3');
  h3.textContent = item.title || CONFIG.NO_TITLE;

  const p = document.createElement('p');
  const noteText = item.notes || '';
  p.textContent = noteText.length > CONFIG.NOTES_LENGTH_LIMIT
    ? noteText.slice(0, CONFIG.NOTES_LENGTH_LIMIT) + CONFIG.TRUNCATE_SUFFIX
    : noteText;

  const small = document.createElement('small');
  small.textContent = new Date(item.createdAt).toLocaleString();

  element.append(h3, p, small);

  if (item.photoDataUrl) {
    const img = document.createElement('img');
    img.src = item.photoDataUrl;
    img.className = CONFIG.THUMB_CLASS;
    img.alt = CONFIG.IMAGE_ALT;
    element.appendChild(img);
  }

  return element;
}

function render() {
  const items = loadItems();
  listEl.innerHTML = '';

  if (!items.length) {
    listEl.appendChild(createEmptyState());
    return;
  }

  items
    .slice()
    .reverse()
    .forEach((item) => {
      listEl.appendChild(createItemElement(item));
    });
}

/* Удаление всех инструкций */
clearBtn.addEventListener('click', async () => {
  const confirmed = await showConfirmModal(CONFIG.CONFIRM_DELETE_ALL);
  if (!confirmed) return;
  saveItems([]);
  render();
});

/* Рендер списка при загрузке страницы */
render();
