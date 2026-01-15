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
  if (!items.length) {
    listEl.innerHTML = '<div class="card"><small>Na razie pusto. Kliknij „Dodaj” i utwórz pierwszy wpis.</small></div>';
    return;
  }

  listEl.innerHTML = items
    .slice()
    .reverse()
    .map((it) => {
      const dt = new Date(it.createdAt).toLocaleString();
      return `
      <div class="item">
        <h3>${escapeHtml(it.title || 'Bez nazwy')}</h3>
        <p>${escapeHtml((it.notes || '').slice(0, 120))}${(it.notes||'').length>120?'…':''}</p>
        <p><small>${dt}${it.location ? ` • lat ${it.location.lat.toFixed(5)}, lon ${it.location.lon.toFixed(5)}` : ''}</small></p>
        ${it.photoDataUrl ? `<img class="thumb" src="${it.photoDataUrl}" alt="photo" loading="lazy" />` : ''}
      </div>`;
    })
    .join('');
}

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

clearBtn.addEventListener('click', () => {
  if (confirm('Na pewno usunąć wszystkie wpisy?')) {
    saveItems([]);
    render();
  }
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
