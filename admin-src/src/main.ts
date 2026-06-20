import './style.css';

const API = '/admin/api';

const STAGES = ['Brief & Discovery', 'Design', 'Build', 'Review & Refine', 'Launch'];

type Client = {
  user_id: string;
  email: string;
  created_at: string;
  business_name: string | null;
  stage: number | null;
  launched_at: string | null;
  live_url: string | null;
  last_updated_at: string | null;
  last_security_check_at: string | null;
  has_project: boolean;
  has_preview: boolean;
};

const statusEl = document.querySelector<HTMLDivElement>('#status')!;
const tableWrap = document.querySelector<HTMLDivElement>('#table-wrap')!;
const refreshBtn = document.querySelector<HTMLButtonElement>('#refresh-btn')!;

function setStatus(msg: string, tone?: 'error' | 'success') {
  statusEl.textContent = msg;
  if (tone) statusEl.dataset.tone = tone;
  else delete statusEl.dataset.tone;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function stageOptions(selected: number | null): string {
  const noneSelected = selected === null ? 'selected' : '';
  let html = `<option value="" ${noneSelected}>— none —</option>`;
  STAGES.forEach((name, i) => {
    const sel = selected === i ? 'selected' : '';
    html += `<option value="${i}" ${sel}>${String(i).padStart(2, '0')} — ${name}</option>`;
  });
  return html;
}

function rowHtml(c: Client): string {
  return `
    <tr data-user-id="${c.user_id}">
      <td data-label="Client">
        <span class="admin-email">${c.email}</span>
        <span class="admin-email-sub">${c.user_id}</span>
      </td>
      <td data-label="Business Name">
        <input class="admin-input" data-field="business_name" value="${c.business_name ?? ''}" placeholder="—">
      </td>
      <td data-label="Stage">
        <select class="admin-select" data-field="stage">${stageOptions(c.stage)}</select>
      </td>
      <td data-label="Launched">
        <label class="admin-checkbox">
          <input type="checkbox" data-field="launched" ${c.launched_at ? 'checked' : ''}>
          <span>${c.launched_at ? formatDate(c.launched_at) : 'Not yet'}</span>
        </label>
      </td>
      <td data-label="Live URL">
        <input class="admin-input is-url" data-field="live_url" value="${c.live_url ?? ''}" placeholder="https://…">
      </td>
      <td data-label="Last Updated">
        <div class="admin-date">${formatDate(c.last_updated_at)}</div>
        <button type="button" class="admin-touch" data-touch="last_updated_at">Touch now</button>
      </td>
      <td data-label="Security Check">
        <div class="admin-date">${formatDate(c.last_security_check_at)}</div>
        <button type="button" class="admin-touch" data-touch="last_security_check_at">Touch now</button>
      </td>
      <td data-label="Preview">
        <span class="admin-badge ${c.has_preview ? 'is-yes' : ''}">${c.has_preview ? 'Available' : 'None'}</span>
      </td>
      <td data-label="Actions">
        <div class="admin-row-actions">
          <button type="button" class="admin-btn is-primary" data-action="save">Save</button>
          <button type="button" class="admin-btn is-danger" data-action="delete" ${c.has_project ? '' : 'disabled'}>Delete</button>
        </div>
      </td>
    </tr>
  `;
}

let clients: Client[] = [];
let touchedFields: Record<string, { last_updated_at?: string; last_security_check_at?: string }> = {};

function render() {
  tableWrap.innerHTML = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>Client</th><th>Business Name</th><th>Stage</th><th>Launched</th>
          <th>Live URL</th><th>Last Updated</th><th>Security Check</th><th>Preview</th><th>Actions</th>
        </tr>
      </thead>
      <tbody>${clients.map(rowHtml).join('')}</tbody>
    </table>
  `;
  wireRowEvents();
}

function wireRowEvents() {
  tableWrap.querySelectorAll<HTMLTableRowElement>('tr[data-user-id]').forEach(row => {
    const userId = row.dataset.userId!;

    row.querySelectorAll<HTMLButtonElement>('[data-touch]').forEach(btn => {
      btn.addEventListener('click', () => {
        const field = btn.dataset.touch as 'last_updated_at' | 'last_security_check_at';
        touchedFields[userId] = touchedFields[userId] || {};
        touchedFields[userId][field] = new Date().toISOString();
        btn.previousElementSibling!.textContent = 'Just now';
        markDirty(row);
      });
    });

    row.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-field]').forEach(el => {
      el.addEventListener('input', () => markDirty(row));
    });

    row.querySelector('[data-action="save"]')!.addEventListener('click', () => saveRow(row, userId));
    row.querySelector('[data-action="delete"]')!.addEventListener('click', () => deleteRow(userId));
  });
}

function markDirty(row: HTMLTableRowElement) {
  row.querySelector('[data-action="save"]')!.classList.add('is-dirty');
}

async function saveRow(row: HTMLTableRowElement, userId: string) {
  const businessName = (row.querySelector('[data-field="business_name"]') as HTMLInputElement).value.trim();
  const stageRaw = (row.querySelector('[data-field="stage"]') as HTMLSelectElement).value;
  const launched = (row.querySelector('[data-field="launched"]') as HTMLInputElement).checked;
  const liveUrl = (row.querySelector('[data-field="live_url"]') as HTMLInputElement).value.trim();

  const existing = clients.find(c => c.user_id === userId);
  const touched = touchedFields[userId] || {};

  const payload = {
    business_name: businessName || null,
    stage: stageRaw === '' ? null : Number(stageRaw),
    launched_at: launched ? (existing?.launched_at ?? new Date().toISOString()) : null,
    live_url: liveUrl || null,
    last_updated_at: touched.last_updated_at ?? existing?.last_updated_at ?? null,
    last_security_check_at: touched.last_security_check_at ?? existing?.last_security_check_at ?? null,
  };

  setStatus('Saving…');
  try {
    const res = await fetch(`${API}/clients/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Save failed');
    delete touchedFields[userId];
    setStatus('Saved.', 'success');
    await loadClients();
  } catch (err) {
    setStatus(err instanceof Error ? err.message : 'Save failed', 'error');
  }
}

async function deleteRow(userId: string) {
  if (!confirm('Remove this client\'s project? This deletes their stage/status data — their login stays intact.')) return;
  setStatus('Deleting…');
  try {
    const res = await fetch(`${API}/clients/${userId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error((await res.json()).error || 'Delete failed');
    setStatus('Deleted.', 'success');
    await loadClients();
  } catch (err) {
    setStatus(err instanceof Error ? err.message : 'Delete failed', 'error');
  }
}

async function loadClients() {
  setStatus('Loading…');
  try {
    const res = await fetch(`${API}/clients`);
    if (!res.ok) throw new Error('Failed to load clients');
    const data = await res.json();
    clients = data.clients;
    touchedFields = {};
    render();
    setStatus(`${clients.length} client${clients.length === 1 ? '' : 's'} loaded.`);
  } catch (err) {
    setStatus(err instanceof Error ? err.message : 'Failed to load', 'error');
  }
}

refreshBtn.addEventListener('click', loadClients);
loadClients();
