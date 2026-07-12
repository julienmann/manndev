import { PIN_STORAGE_KEY } from './session';

const form = document.querySelector<HTMLFormElement>('#login-form')!;
const pinInput = document.querySelector<HTMLInputElement>('#pin')!;
const submitBtn = document.querySelector<HTMLButtonElement>('#submit-btn')!;
const submitLabel = document.querySelector<HTMLSpanElement>('#submit-label')!;
const status = document.querySelector<HTMLParagraphElement>('#status')!;

function setStatus(message: string, tone?: 'error' | 'success') {
  status.textContent = message;
  if (tone) status.dataset.tone = tone;
  else delete status.dataset.tone;
}

async function tryPin(pin: string): Promise<boolean> {
  const res = await fetch(`/client-files/${pin}/info.json`, { cache: 'no-store' });
  if (!res.ok) return false;
  localStorage.setItem(PIN_STORAGE_KEY, pin);
  window.location.replace('./dashboard.html');
  return true;
}

// Already have a valid code stored? Skip straight to the dashboard.
const storedPin = localStorage.getItem(PIN_STORAGE_KEY);
if (storedPin) tryPin(storedPin);

if (new URLSearchParams(window.location.search).has('expired')) {
  setStatus('Your session expired. Enter your access code again.');
}

pinInput.addEventListener('input', () => {
  pinInput.value = pinInput.value.replace(/\D/g, '').slice(0, 4);
  if (pinInput.value.length === 4) form.requestSubmit();
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const pin = pinInput.value.trim();
  if (pin.length !== 4) {
    setStatus('Enter your 4-digit access code.', 'error');
    return;
  }

  submitBtn.disabled = true;
  submitLabel.textContent = 'Checking…';
  setStatus('');

  const ok = await tryPin(pin);

  if (!ok) {
    submitBtn.disabled = false;
    submitLabel.textContent = 'Enter portal';
    setStatus("That code isn't right. Check it and try again.", 'error');
    pinInput.value = '';
    pinInput.focus();
  }
});
