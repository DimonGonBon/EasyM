import {
  loadItems,
  saveItems,
  setOnlineBadge,
  registerSW,
  setupOfflineBanner
} from './app.js';

setupOfflineBanner();
registerSW();

setOnlineBadge(
  document.getElementById('statusDot'),
  document.getElementById('statusText')
);

const listEl = document.getElementById('list');
const clearBtn = document.getElementById('clearBtn');

function render() {
  const items = loadItems();
  listEl.innerHTML = '';

  if (!items.length) {
    const empty = document.createElement('div');
    empty.className = 'card';

    const small = document.createElement('small');
    small.textContent =
      'Na razie pusto. Kliknij „Dodaj” i utwórz pierwszy wpis.';

    empty.appendChild(small);
    listEl.appendChild(empty);
    return;
  }
  

items
  .slice()
  .reverse()
  .forEach((it) => {
    const item = document.createElement('div');
    item.className = 'item';

    const h3 = document.createElement('h3');
    h3.textContent = it.title || 'Bez nazwy';

    const p = document.createElement('p');
    p.textContent =
      it.notes && it.notes.length > 120
        ? it.notes.slice(0, 120) + '…'
        : it.notes || '';

    const small = document.createElement('small');
    small.textContent = new Date(it.createdAt).toLocaleString();

    item.append(h3, p, small);

    if (it.photoDataUrl) {
      const img = document.createElement('img');
      img.src = it.photoDataUrl;
      img.className = 'thumb';
      img.alt = 'Zdjęcie instrukcji';
      item.appendChild(img);
    }

    listEl.appendChild(item);
  });
}

clearBtn.addEventListener('click', () => {
  const agree = window.confirm('Na pewno usunąć wszystkie wpisy?');
  if (!agree) return;

  saveItems([]);
  render();
});


let deferredPrompt = null;
const installBtn = document.getElementById('installBtn');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.style.display = 'block';
});

installBtn.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.style.display = 'none';
});

render();

