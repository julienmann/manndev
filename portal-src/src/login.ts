import { SESSION_KEY, deriveClientKey, fetchClientInfo, setStatus as showStatus } from './session';

const form = document.querySelector<HTMLFormElement>('#login-form')!;
const usernameInput = document.querySelector<HTMLInputElement>('#username')!;
const passwordInput = document.querySelector<HTMLInputElement>('#password')!;
const submitBtn = document.querySelector<HTMLButtonElement>('#submit-btn')!;
const submitLabel = document.querySelector<HTMLSpanElement>('#submit-label')!;
const status = document.querySelector<HTMLParagraphElement>('#status')!;

const setStatus = (message: string, tone?: 'error' | 'success') => showStatus(status, message, tone);

// Signs in with the key if it's a real login. Otherwise returns why not: a
// wrong username/password ('invalid') or a connection/server problem ('network').
async function tryKey(key: string): Promise<'invalid' | 'network' | null> {
  const result = await fetchClientInfo(key);
  if (!result.ok) return result.reason;
  localStorage.setItem(SESSION_KEY, key);
  window.location.replace('./dashboard.html');
  return null;
}

// Already signed in on this device? Skip straight to the dashboard, which
// checks the key itself and sends an expired one back here with ?expired=1.
if (localStorage.getItem(SESSION_KEY)) window.location.replace('./dashboard.html');

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

  const failure = await tryKey(await deriveClientKey(username, password));
  if (!failure) return;

  submitBtn.disabled = false;
  submitLabel.textContent = 'Enter portal';
  if (failure === 'network') {
    // Not their fault: keep the password so they can just try again.
    setStatus("Couldn't reach the portal. Check your connection and try again.", 'error');
  } else {
    setStatus("That username and password don't match. Check them and try again.", 'error');
    passwordInput.value = '';
  }
  passwordInput.focus();
});
