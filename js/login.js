import { loginUser, registerUser, setCurrentUser } from './app.js';

const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

const loginUsername = document.getElementById('loginUsername');
const loginPassword = document.getElementById('loginPassword');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');

const registerUsername = document.getElementById('registerUsername');
const registerPassword = document.getElementById('registerPassword');
const registerPasswordConfirm = document.getElementById('registerPasswordConfirm');
const registerBtn = document.getElementById('registerBtn');
const registerError = document.getElementById('registerError');
const registerSuccess = document.getElementById('registerSuccess');

/* ПРОВЕРКА СТАТУСА ОФЛАЙН отключает кнопки при отсутствии интернета */
function checkOfflineStatus() {
  if (!navigator.onLine) { // Проверяет есть ли интернет
    loginError.textContent = '⚠️ Brak internetu! Logowanie wymaga połączenia z siecią.';
    loginError.style.display = 'block';
    loginBtn.disabled = true; // Отключает кнопку логина в офлайне
    registerBtn.disabled = true; // Отключает кнопку регистрации в офлайне
  } else {
    loginError.style.display = 'none';
    loginBtn.disabled = false;
    registerBtn.disabled = false;
  }
}

checkOfflineStatus();
window.addEventListener('online', checkOfflineStatus);
window.addEventListener('offline', checkOfflineStatus);

function showTab(tab) {
  loginForm.classList.remove('active');
  registerForm.classList.remove('active');
  loginTab.classList.remove('active');
  registerTab.classList.remove('active');

  if (tab === 'login') {
    loginForm.classList.add('active');
    loginTab.classList.add('active');
  } else {
    registerForm.classList.add('active');
    registerTab.classList.add('active');
  }
}

loginTab.addEventListener('click', () => showTab('login'));
registerTab.addEventListener('click', () => showTab('register'));

/* Проверяет учетные данные при входе */
loginBtn.addEventListener('click', () => {
  const username = loginUsername.value.trim();
  const password = loginPassword.value;

  loginError.style.display = 'none';

  if (!username || !password) {
    loginError.textContent = 'Wpisz nazwę użytkownika i hasło.';
    loginError.style.display = 'block';
    return;
  }

  const result = loginUser(username, password); // Проверяет пароль в локалке
  if (!result.success) {
    loginError.textContent = result.error;
    loginError.style.display = 'block';
    return;
  }

  window.location.href = './index.html'; // Если успех переходит на главную
});

registerBtn.addEventListener('click', () => {
  const username = registerUsername.value.trim();
  const password = registerPassword.value;
  const passwordConfirm = registerPasswordConfirm.value;

  registerError.style.display = 'none';
  registerSuccess.style.display = 'none';

  if (!username || !password || !passwordConfirm) {
    registerError.textContent = 'Wypełnij wszystkie pola.';
    registerError.style.display = 'block';
    return;
  }

  if (username.length < 3) {
    registerError.textContent = 'Nazwa musi mieć co najmniej 3 znaki.';
    registerError.style.display = 'block';
    return;
  }

  if (password.length < 4) {
    registerError.textContent = 'Hasło musi mieć co najmniej 4 znaki.';
    registerError.style.display = 'block';
    return;
  }

  if (password !== passwordConfirm) {
    registerError.textContent = 'Hasła nie pasują do siebie.';
    registerError.style.display = 'block';
    return;
  }

  const result = registerUser(username, password); // Сохраняет нового пользователя в локалку
  if (!result.success) {
    registerError.textContent = result.error;
    registerError.style.display = 'block';
    return;
  }

  registerSuccess.textContent = 'Konto utworzone! Teraz się zaloguj.';
  registerSuccess.style.display = 'block';
  registerUsername.value = '';
  registerPassword.value = '';
  registerPasswordConfirm.value = '';

  setTimeout(() => {
    showTab('login'); // Преходит на логин после успешной регистрации
  }, 2000);
});
