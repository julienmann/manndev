import { supabase } from './supabase';

const STAGES = [
  { name: 'Brief & Discovery', note: "We're gathering your goals, audience, and what the site needs to do." },
  { name: 'Design', note: 'Establishing the visual language — typography, palette, layout.' },
  { name: 'Build', note: 'Writing the site. You can ask for a preview link at any point.' },
  { name: 'Review & Refine', note: 'Testing across devices, optimising performance, working through feedback.' },
  { name: 'Launch', note: 'Deploying to your domain and wiring up analytics.' },
] as const;

type ClientProject = {
  business_name: string | null;
  stage: number | null;
  launched_at: string | null;
  live_url: string | null;
  last_updated_at: string | null;
  last_security_check_at: string | null;
};

const main = document.querySelector<HTMLElement>('#main')!;
const accountEmail = document.querySelector<HTMLSpanElement>('#account-email')!;
const logoutBtn = document.querySelector<HTMLButtonElement>('#logout-btn')!;

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function renderEmpty() {
  main.innerHTML = `
    <div class="dash-state">
      Your project hasn't been set up in the portal yet.<br>
      We'll email you as soon as it's ready to track here.
    </div>
  `;
}

function renderError() {
  main.innerHTML = `<div class="dash-state">Something went wrong loading your project. Try refreshing, or get in touch.</div>`;
}

function renderTracker(project: ClientProject, previewUrl: string | null) {
  const currentStage = project.stage ?? 0;
  const stageRows = STAGES.map((stage, i) => {
    const state = i < currentStage ? 'done' : i === currentStage ? 'current' : 'upcoming';
    return `
      <div class="tracker-step" data-state="${state}">
        <div class="tracker-num">${String(i + 1).padStart(2, '0')}</div>
        <div class="tracker-body">
          <div class="tracker-name">${stage.name}</div>
          ${state === 'current' ? `<div class="tracker-note">${stage.note}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');

  const previewBlock = previewUrl
    ? `
      <div class="preview-panel">
        <div class="preview-bar">
          <span class="preview-dot"></span><span class="preview-dot"></span><span class="preview-dot"></span>
          <span class="preview-label">Live Preview</span>
        </div>
        <iframe class="preview-frame" src="${previewUrl}" title="Live site preview" loading="lazy"></iframe>
      </div>
    `
    : '';

  main.innerHTML = `
    <div class="dash-greeting">
      <p class="dash-greeting-kicker">${project.business_name ?? 'Your project'}</p>
      <h1 class="dash-greeting-title">In progress</h1>
    </div>
    ${previewBlock}
    <div class="tracker">${stageRows}</div>
  `;
}

function renderMaintenance(project: ClientProject) {
  main.innerHTML = `
    <div class="dash-greeting">
      <p class="dash-greeting-kicker">${project.business_name ?? 'Your site'}</p>
      <h1 class="dash-greeting-title">Live &amp; maintained</h1>
    </div>
    <div class="maint">
      <div class="maint-row">
        <span class="maint-label">Site status</span>
        <span class="maint-value is-live"><span class="live-dot" aria-hidden="true"></span>Live</span>
      </div>
      <div class="maint-row">
        <span class="maint-label">Last updated</span>
        <span class="maint-value">${formatDate(project.last_updated_at)}</span>
      </div>
      <div class="maint-row">
        <span class="maint-label">Last security check</span>
        <span class="maint-value">${formatDate(project.last_security_check_at)}</span>
      </div>
      <div class="maint-row">
        <span class="maint-label">Live site</span>
        <span class="maint-value">${
          project.live_url
            ? `<a href="${project.live_url}" target="_blank" rel="noopener">${project.live_url.replace(/^https?:\/\//, '')} ↗</a>`
            : '—'
        }</span>
      </div>
    </div>
  `;
}

async function init() {
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData.session;

  if (!session) {
    window.location.replace('./index.html?expired=1');
    return;
  }

  accountEmail.textContent = session.user.email ?? '';

  const { data: project, error } = await supabase
    .from('client_projects')
    .select('business_name, stage, launched_at, live_url, last_updated_at, last_security_check_at')
    .eq('user_id', session.user.id)
    .maybeSingle<ClientProject>();

  if (error) {
    renderError();
    return;
  }

  if (!project) {
    renderEmpty();
    return;
  }

  if (project.launched_at) {
    renderMaintenance(project);
  } else {
    const previewPath = `/client-previews/${session.user.id}/`;
    const hasPreview = await fetch(previewPath, { method: 'HEAD' }).then(r => r.ok).catch(() => false);
    renderTracker(project, hasPreview ? previewPath : null);
  }
}

logoutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut();
  window.location.replace('./index.html');
});

supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') window.location.replace('./index.html');
});

init();
