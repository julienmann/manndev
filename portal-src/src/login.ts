import { SESSION_KEY, deriveClientKey, fetchClientInfo, setStatus as showStatus } from './session';

const form = document.querySelector<HTMLFormElement>('#login-form')!;
const usernameInput = document.querySelector<HTMLInputElement>('#username')!;
const passwordInput = document.querySelector<HTMLInputElement>('#password')!;
const submitBtn = document.querySelector<HTMLButtonElement>('#submit-btn')!;
const submitLabel = document.querySelector<HTMLSpanElement>('#submit-label')!;
const status = document.querySelector<HTMLParagraphElement>('#status')!;

const setStatus = (message: string, tone?: 'error' | 'success') => showStatus(status, message, tone);

async function tryKey(key: string): Promise<boolean> {
  const result = await fetchClientInfo(key);
  if (!result.ok) return false;
  localStorage.setItem(SESSION_KEY, key);
  window.location.replace('./dashboard.html');
  return true;
}

// Already signed in on this device? Skip straight to the dashboard.
const storedKey = localStorage.getItem(SESSION_KEY);
if (storedKey) tryKey(storedKey);

if (new URLSearchParams(window.location.search).has('expired')) {
  setStatus('Your session expired. Sign in again.');
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  if (!username || !password) {
    setStatus('Enter your username and password.', 'error');
    (username ? passwordInput : usernameInput).focus();
    return;
  }

  submitBtn.disabled = true;
  submitLabel.textContent = 'Checking…';
  setStatus('');

  const ok = await tryKey(await deriveClientKey(username, password));

  if (!ok) {
    submitBtn.disabled = false;
    submitLabel.textContent = 'Enter portal';
    setStatus("That username and password don't match. Check them and try again.", 'error');
    passwordInput.value = '';
    passwordInput.focus();
  }
});
