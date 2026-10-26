import { SESSION_KEY, MIN_PASSWORD, fetchFolder, fetchInfo, deriveClientKey, escapeHtml, formatDate, setStatus, type ClientInfo } from './session';

const CTA_ARROW = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
const CTA_UNDERLINE = '<div class="cta-underline-wrap"><div class="cta-underline"></div></div>';

const main = document.querySelector<HTMLElement>('#main')!;
const accountName = document.querySelector<HTMLSpanElement>('#account-name')!;
const logoutBtn = document.querySelector<HTMLButtonElement>('#logout-btn')!;

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


const pwDialog = document.querySelector<HTMLDialogElement>('#pw-dialog')!;
const pwOpenBtn = document.querySelector<HTMLButtonElement>('#pw-open-btn')!;

// The "Change password" button in the top bar opens the form in a dialog.
function bindPasswordForm(username: string) {
  document.querySelector<HTMLElement>('#pw-username')!.textContent = username;
  // defaultValue, not value: form.reset() would otherwise blank this hidden
  // field, and password managers read it to know which login to update.
  document.querySelector<HTMLInputElement>('#pw-username-field')!.defaultValue = username;
  pwOpenBtn.hidden = false;

  const form = document.querySelector<HTMLFormElement>('#pw-form')!;
  const current = document.querySelector<HTMLInputElement>('#pw-current')!;
  const next = document.querySelector<HTMLInputElement>('#pw-new')!;
  const confirmInput = document.querySelector<HTMLInputElement>('#pw-confirm')!;
  const submit = document.querySelector<HTMLButtonElement>('#pw-submit')!;
  const label = document.querySelector<HTMLSpanElement>('#pw-submit-label')!;
  const status = document.querySelector<HTMLParagraphElement>('#pw-status')!;

  const say = (msg: string, tone?: 'error' | 'success') => setStatus(status, msg, tone);

  let closeTimer: number | undefined;
  pwOpenBtn.addEventListener('click', () => {
    window.clearTimeout(closeTimer);
    form.reset();
    say('');
    pwDialog.showModal();
    current.focus();
  });
  document.querySelector<HTMLButtonElement>('#pw-close-btn')!.addEventListener('click', () => pwDialog.close());

  // Close on a backdrop click. The dialog's own padding is also the dialog
  // element, so check the point is outside its box, and that the press started
  // outside too: a text selection dragged out of an input mustn't close it.
  const outsideDialog = (e: MouseEvent) => {
    const box = pwDialog.getBoundingClientRect();
    return e.target === pwDialog
      && (e.clientX < box.left || e.clientX > box.right || e.clientY < box.top || e.clientY > box.bottom);
  };
  let pressedOutside = false;
  pwDialog.addEventListener('pointerdown', (e) => { pressedOutside = outsideDialog(e); });
  pwDialog.addEventListener('click', (e) => {
    if (pressedOutside && outsideDialog(e)) pwDialog.close();
    pressedOutside = false;
  });

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

  const pointer = await fetchFolder(key);
  if (!pointer.ok) return fail(pointer.reason);

  // Once the folder is known, info.json and the preview check are independent.
  const [result, previewAvailable] = await Promise.all([fetchInfo(pointer.folder), hasLivePreview(pointer.folder)]);
  if (!result.ok) return fail(result.reason);

  accountName.textContent = result.info.name ?? '';
  if (result.info.username) bindPasswordForm(result.info.username);
  renderFiles(pointer.folder, result.info, previewAvailable);
}

// A temporary problem gets a retry button; only a key that no longer exists
// signs the client out.
function fail(reason: 'invalid' | 'network') {
  if (reason === 'network') {
    renderError();
  } else {
    localStorage.removeItem(SESSION_KEY);
    window.location.replace('./index.html?expired=1');
  }
}

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem(SESSION_KEY);
  window.location.replace('./index.html');
});

init();
