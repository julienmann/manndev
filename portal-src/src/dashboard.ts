import { SESSION_KEY, fetchClientInfo, deriveClientKey, escapeHtml, type ClientInfo } from './session';

const CTA_ARROW = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
const CTA_UNDERLINE = '<div class="cta-underline-wrap"><div class="cta-underline"></div></div>';

const main = document.querySelector<HTMLElement>('#main')!;
const accountName = document.querySelector<HTMLSpanElement>('#account-name')!;
const logoutBtn = document.querySelector<HTMLButtonElement>('#logout-btn')!;

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function renderError() {
  main.innerHTML = `
    <div class="dash-state">Something went wrong loading your files.</div>
    <button type="button" class="link-cta" id="retry-btn">
      Try again
      ${CTA_ARROW}
      ${CTA_UNDERLINE}
    </button>
  `;
  document.querySelector<HTMLButtonElement>('#retry-btn')!.addEventListener('click', init);
}

async function hasLivePreview(folder: string): Promise<boolean> {
  try {
    const res = await fetch(`/client-files/${folder}/preview/`, { method: 'HEAD', cache: 'no-store' });
    return res.ok;
  } catch {
    return false;
  }
}

function renderFiles(folder: string, info: ClientInfo, previewAvailable: boolean) {
  const previewUrl = `/client-files/${folder}/preview/`;
  const previewAction = previewAvailable
    ? `
      <a class="link-cta" href="${previewUrl}" target="_blank" rel="noopener noreferrer">
        View live preview
        ${CTA_ARROW}
        ${CTA_UNDERLINE}
      </a>
    `
    : `<span class="delivery-note">No live preview available yet.</span>`;

  main.innerHTML = `
    <div class="dash-greeting">
      <p class="dash-greeting-kicker">${escapeHtml(info.name ?? 'Your project')}</p>
      <h1 class="dash-greeting-title">Your files</h1>
    </div>
    <div class="delivery">
      <div class="delivery-row">
        <span class="delivery-name">${escapeHtml(info.file)}</span>
        <span class="delivery-date">Added ${formatDate(info.uploadedAt)}</span>
      </div>
      <div class="delivery-actions">
        ${previewAction}
      </div>
    </div>
  `;
}


const MIN_PASSWORD = 10;

const pwDialog = document.querySelector<HTMLDialogElement>('#pw-dialog')!;
const pwOpenBtn = document.querySelector<HTMLButtonElement>('#pw-open-btn')!;
let passwordFormBound = false;

// The "Change password" button in the top bar opens the form in a dialog.
function bindPasswordForm(username: string) {
  document.querySelector<HTMLElement>('#pw-username')!.textContent = username;
  document.querySelector<HTMLInputElement>('#pw-username-field')!.value = username;
  pwOpenBtn.hidden = false;
  if (passwordFormBound) return;
  passwordFormBound = true;

  const form = document.querySelector<HTMLFormElement>('#pw-form')!;
  const current = document.querySelector<HTMLInputElement>('#pw-current')!;
  const next = document.querySelector<HTMLInputElement>('#pw-new')!;
  const confirmInput = document.querySelector<HTMLInputElement>('#pw-confirm')!;
  const submit = document.querySelector<HTMLButtonElement>('#pw-submit')!;
  const label = document.querySelector<HTMLSpanElement>('#pw-submit-label')!;
  const status = document.querySelector<HTMLParagraphElement>('#pw-status')!;

  const say = (msg: string, tone?: 'error' | 'success') => {
    status.textContent = msg;
    if (tone) status.dataset.tone = tone; else delete status.dataset.tone;
  };

  let closeTimer: number | undefined;
  pwOpenBtn.addEventListener('click', () => {
    window.clearTimeout(closeTimer);
    form.reset();
    say('');
    pwDialog.showModal();
    current.focus();
  });
  document.querySelector<HTMLButtonElement>('#pw-close-btn')!.addEventListener('click', () => pwDialog.close());
  pwDialog.addEventListener('click', (e) => { if (e.target === pwDialog) pwDialog.close(); });   // backdrop

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!current.value) { say('Enter your current password.', 'error'); current.focus(); return; }
    if (next.value.length < MIN_PASSWORD) { say(`Your new password needs at least ${MIN_PASSWORD} characters.`, 'error'); next.focus(); return; }
    if (next.value !== confirmInput.value) { say("The new passwords don't match.", 'error'); confirmInput.focus(); return; }
    if (next.value === current.value) { say('Choose a password different from your current one.', 'error'); next.focus(); return; }

    submit.disabled = true;
    label.textContent = 'Updating…';
    say('');

    try {
      const oldKey = await deriveClientKey(username, current.value);
      if (oldKey !== localStorage.getItem(SESSION_KEY)) {
        say("Your current password isn't right.", 'error');
        current.value = '';
        current.focus();
        return;
      }
      const newKey = await deriveClientKey(username, next.value);
      const res = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldKey, newKey }),
      });
      if (res.ok) {
        localStorage.setItem(SESSION_KEY, newKey);
        form.reset();
        say('Password updated. Use your new password next time you sign in.', 'success');
        closeTimer = window.setTimeout(() => pwDialog.close(), 2200);
      } else if (res.status === 429) {
        say('Too many attempts. Wait a few minutes and try again.', 'error');
      } else if (res.status === 404) {
        say("Your current password isn't right.", 'error');
      } else if (res.status === 409) {
        say('Choose a different new password.', 'error');
      } else {
        say("Couldn't update your password right now. Try again later, or get in touch.", 'error');
      }
    } catch {
      say("Couldn't reach the server. Check your connection and try again.", 'error');
    } finally {
      submit.disabled = false;
      label.textContent = 'Update password';
    }
  });
}

async function init() {
  const key = localStorage.getItem(SESSION_KEY);

  if (!key) {
    window.location.replace('./index.html?expired=1');
    return;
  }

  const result = await fetchClientInfo(key);

  if (!result.ok) {
    if (result.reason === 'network') {
      renderError();
    } else {
      localStorage.removeItem(SESSION_KEY);
      window.location.replace('./index.html?expired=1');
    }
    return;
  }

  accountName.textContent = result.info.name ?? '';
  if (result.info.username) bindPasswordForm(result.info.username);
  const previewAvailable = await hasLivePreview(result.folder);
  renderFiles(result.folder, result.info, previewAvailable);
}

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem(SESSION_KEY);
  window.location.replace('./index.html');
});

init();
