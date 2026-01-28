import {
  loadItems,
  saveItems,
  setOnlineBadge,
  registerSW,
  setupOfflineBanner,
  showConfirmModal,
  getCurrentUser,
  logoutUser
} from './app.js';

if (!getCurrentUser()) {
  window.location.href = './login.html';
}

setupOfflineBanner();
registerSW();

setOnlineBadge(
  document.getElementById('statusDot'),
  document.getElementById('statusText')
);

const params = new URLSearchParams(window.location.search);
const itemId = params.get('id');

if (!itemId) {
  window.location.href = './index.html';
}

const titleDisplay = document.getElementById('titleDisplay');
const instructionTitle = document.getElementById('instructionTitle');
const editTitleBtn = document.getElementById('editTitleBtn');
const saveTitleBtn = document.getElementById('saveTitleBtn');
const cancelTitleBtn = document.getElementById('cancelTitleBtn');

const photoContainer = document.getElementById('photoContainer');
const instructionPhoto = document.getElementById('instructionPhoto');

const locationContainer = document.getElementById('locationContainer');
const locationDisplay = document.getElementById('locationDisplay');

const createdAtDisplay = document.getElementById('createdAtDisplay');

const addStepToggleBtn = document.getElementById('addStepToggleBtn');
const addStepForm = document.getElementById('addStepForm');
const newStepText = document.getElementById('newStepText');
const addStepBtn = document.getElementById('addStepBtn');
const cancelAddBtn = document.getElementById('cancelAddBtn');
const stepsList = document.getElementById('stepsList');

const deleteBtn = document.getElementById('deleteBtn');
const logoutLink = document.getElementById('logoutLink');

let instruction = null;
let editingTitle = false;

function loadInstruction() {
  const items = loadItems();
  instruction = items.find(i => i.id === itemId);
  
  if (!instruction) {
    window.location.href = './index.html';
    return;
  }

  if (!instruction.steps) {
    instruction.steps = [];
  }

  displayInstruction();
}

function displayInstruction() {
  titleDisplay.textContent = instruction.title || 'Bez nazwy';
  instructionTitle.value = instruction.title || '';

  if (instruction.photoDataUrl) {
    photoContainer.style.display = 'block';
    instructionPhoto.src = instruction.photoDataUrl;
  }

  if (instruction.location?.lat != null && instruction.location?.lon != null) {
    locationContainer.style.display = 'block';
    const { lat, lon } = instruction.location;
    locationDisplay.textContent = `Lat: ${lat.toFixed(6)}, Lon: ${lon.toFixed(6)}`;
  }

  createdAtDisplay.textContent = new Date(instruction.createdAt).toLocaleString();

  renderSteps();
}

// Показывает список шагов инструкции
function renderSteps() {
  stepsList.innerHTML = '';

  if (!instruction.steps || instruction.steps.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'sub';
    empty.textContent = 'Brak kroków. Dodaj pierwszy krok aby rozpocząć.';
    stepsList.appendChild(empty);
    return;
  }

  instruction.steps.forEach((step, index) => {
    const stepItem = document.createElement('div');
    stepItem.className = 'step-item';

    const stepNumber = document.createElement('span');
    stepNumber.className = 'step-number';
    stepNumber.textContent = `${index + 1}.`;

    const stepText = document.createElement('span');
    stepText.className = 'step-text';
    stepText.textContent = step.text;

    const stepActions = document.createElement('div');
    stepActions.className = 'step-actions';

    const deleteStepBtn = document.createElement('button');
    deleteStepBtn.textContent = 'Usuń';
    deleteStepBtn.className = 'delete';
    /* Удаляет шаг из массива и сохраняет изменения */
    deleteStepBtn.addEventListener('click', () => {
      instruction.steps.splice(index, 1); // Удаляет шаг из массива
      saveItems(loadItems().map(i => i.id === itemId ? instruction : i)); // Сохраняет всю инструкцию с изменениями
      renderSteps(); // Обновляет 
    });

    stepActions.appendChild(deleteStepBtn);
    stepItem.append(stepNumber, stepText, stepActions);
    stepsList.appendChild(stepItem);
  });
}

editTitleBtn.addEventListener('click', () => {
  editingTitle = true;
  titleDisplay.style.display = 'none';
  instructionTitle.style.display = 'block';
  editTitleBtn.style.display = 'none';
  saveTitleBtn.style.display = 'inline-block';
  cancelTitleBtn.style.display = 'inline-block';
});

saveTitleBtn.addEventListener('click', () => {
  const newTitle = instructionTitle.value.trim();
  if (!newTitle) {
    alert('Tytuł nie może być pusty.');
    return;
  }

  instruction.title = newTitle; // Меняет заголовок инструкции
  const items = loadItems(); // Подключает все инструкции из локалки
  const index = items.findIndex(i => i.id === itemId); // Ищет нужную инструкцию
  if (index >= 0) {
    items[index] = instruction; // Заменяет измененную инструкцию
    saveItems(items); // Записывает все данные в локалку
  }

  editingTitle = false;
  titleDisplay.textContent = newTitle;
  titleDisplay.style.display = 'block';
  instructionTitle.style.display = 'none';
  saveTitleBtn.style.display = 'none';
  cancelTitleBtn.style.display = 'none';
  editTitleBtn.style.display = 'inline-block';
});

cancelTitleBtn.addEventListener('click', () => {
  editingTitle = false;
  instructionTitle.value = instruction.title || '';
  titleDisplay.style.display = 'block';
  instructionTitle.style.display = 'none';
  saveTitleBtn.style.display = 'none';
  cancelTitleBtn.style.display = 'none';
  editTitleBtn.style.display = 'inline-block';
});

addStepToggleBtn.addEventListener('click', () => {
  addStepForm.style.display = 'block';
  addStepToggleBtn.style.display = 'none';
  newStepText.focus();
});

cancelAddBtn.addEventListener('click', () => {
  addStepForm.style.display = 'none';
  addStepToggleBtn.style.display = 'block';
  newStepText.value = '';
});

/* Добавляет шаг к инструкции */
addStepBtn.addEventListener('click', () => {
  const stepText = newStepText.value.trim();
  if (!stepText) {
    alert('Krok nie może być pusty.');
    return;
  }

  instruction.steps.push({ text: stepText, createdAt: Date.now() }); // добавляет новый шаг в массив
  const items = loadItems(); // Подключает все инструкции из локалки
  const index = items.findIndex(i => i.id === itemId); // Ищет нужную инструкцию
  if (index >= 0) {
    items[index] = instruction; // Обновляет инструкцию с новым шагом
    saveItems(items); // Сохраняет все изменения
  }

  newStepText.value = '';
  addStepForm.style.display = 'none';
  addStepToggleBtn.style.display = 'block';
  renderSteps();
});

/* Удаляет всю инструкцию и возвращает на список */
deleteBtn.addEventListener('click', async () => {
  const confirmed = await showConfirmModal('Na pewno usunąć tę instrukcję?');
  if (!confirmed) return;

  const items = loadItems(); // Подключает все инструкции 
  const filtered = items.filter(i => i.id !== itemId); // Удаляет текущую инструкцию из массива
  saveItems(filtered); // Записывает все оставшиеся
  window.location.href = './index.html'; // Возвращается на главный экран
});

logoutLink?.addEventListener('click', (e) => {
  e.preventDefault();
  logoutUser();
  window.location.href = './login.html';
});

loadInstruction();
