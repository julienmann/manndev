import { PIN_STORAGE_KEY, fetchClientInfo, type ClientInfo } from './session';

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

function renderFiles(pin: string, info: ClientInfo) {
  const downloadUrl = `/client-files/${pin}/${encodeURIComponent(info.file)}`;
  main.innerHTML = `
    <div class="dash-greeting">
      <p class="dash-greeting-kicker">${info.name ?? 'Your project'}</p>
      <h1 class="dash-greeting-title">Your files</h1>
    </div>
    <div class="delivery">
      <div class="delivery-row">
        <span class="delivery-name">${info.file}</span>
        <span class="delivery-date">Added ${formatDate(info.uploadedAt)}</span>
      </div>
      <a class="link-cta" href="${downloadUrl}" download>
        Download
        ${CTA_ARROW}
        ${CTA_UNDERLINE}
      </a>
    </div>
  `;
}

async function init() {
  const pin = localStorage.getItem(PIN_STORAGE_KEY);

  if (!pin) {
    window.location.replace('./index.html?expired=1');
    return;
  }

  const result = await fetchClientInfo(pin);

  if (!result.ok) {
    if (result.reason === 'network') {
      renderError();
    } else {
      localStorage.removeItem(PIN_STORAGE_KEY);
      window.location.replace('./index.html?expired=1');
    }
    return;
  }

  accountName.textContent = result.info.name ?? '';
  renderFiles(pin, result.info);
}

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem(PIN_STORAGE_KEY);
  window.location.replace('./index.html');
});

init();
