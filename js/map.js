(() => {
  const coordsEl = document.getElementById('coords');
  const statusEl = document.getElementById('status');
  const listEl = document.getElementById('list');
  const emptyEl = document.getElementById('empty');

  function renderList() {
    const items = window.EasyManualStore.getAll();
    const withGeo = items.filter(i => i.lat != null && i.lng != null);
    listEl.innerHTML = '';
    if (withGeo.length === 0) {
      emptyEl.style.display = 'block';
      return;
    }
    emptyEl.style.display = 'none';
    for (const it of withGeo) {
      const div = document.createElement('div');
      div.className = 'card';
      div.style.background = '#fff';
      div.innerHTML = `
        <div class="row" style="align-items:flex-start">
          <div style="flex:2">
            <strong>${escapeHtml(it.title || 'Bez nazwy')}</strong>
            <div class="small">${new Date(it.createdAt).toLocaleString()}</div>
            <div class="small">lat: ${it.lat.toFixed(6)}, lng: ${it.lng.toFixed(6)}</div>
          </div>
          <div style="flex:1">
            <a href="https://www.openstreetmap.org/?mlat=${it.lat}&mlon=${it.lng}#map=16/${it.lat}/${it.lng}" target="_blank" rel="noopener">Otwórz na mapie</a>
          </div>
        </div>
      `;
      listEl.appendChild(div);
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
        window.__lastCoords = { latitude, longitude };
      },
      (err) => {
        statusEl.textContent = `Błąd geolokalizacji: ${err.message}`;
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });

  document.getElementById('btnCopy').addEventListener('click', async () => {
    const c = window.__lastCoords;
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
})();
