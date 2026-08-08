const PASSWORD_HASH = '61105e817f96d54deac74e37b490f2ade34516e836950cc921959ccd1579174f';
const SESSION_KEY = 'admin_unlocked';

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const gate = document.querySelector<HTMLDivElement>('#gate')!;
const gateForm = document.querySelector<HTMLFormElement>('#gate-form')!;
const gatePassword = document.querySelector<HTMLInputElement>('#gate-password')!;
const gateStatus = document.querySelector<HTMLParagraphElement>('#gate-status')!;

function unlock() {
  gate.remove();
}

if (sessionStorage.getItem(SESSION_KEY) === '1') {
  unlock();
} else {
  gateForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const hash = await sha256Hex(gatePassword.value);
    if (hash === PASSWORD_HASH) {
      sessionStorage.setItem(SESSION_KEY, '1');
      unlock();
    } else {
      gateStatus.textContent = 'Wrong password.';
      gateStatus.dataset.tone = 'error';
      gatePassword.value = '';
      gatePassword.focus();
    }
  });
}
