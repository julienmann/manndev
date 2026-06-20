(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=`/admin/api`,t=[`Brief & Discovery`,`Design`,`Build`,`Review & Refine`,`Launch`],n=document.querySelector(`#status`),r=document.querySelector(`#table-wrap`),i=document.querySelector(`#refresh-btn`);function a(e,t){n.textContent=e,t?n.dataset.tone=t:delete n.dataset.tone}function o(e){return e?new Date(e).toLocaleDateString(`en-US`,{month:`short`,day:`numeric`,year:`numeric`}):`—`}function s(e){let n=`<option value="" ${e===null?`selected`:``}>— none —</option>`;return t.forEach((t,r)=>{n+=`<option value="${r}" ${e===r?`selected`:``}>${String(r).padStart(2,`0`)} — ${t}</option>`}),n}function c(e){return`
    <tr data-user-id="${e.user_id}">
      <td data-label="Client">
        <input class="admin-input admin-name" data-field="business_name" value="${e.business_name??``}" placeholder="Add a name…">
        <span class="admin-email">${e.email}</span>
        <span class="admin-email-sub">${e.user_id}</span>
      </td>
      <td data-label="Stage">
        <select class="admin-select" data-field="stage">${s(e.stage)}</select>
      </td>
      <td data-label="Launched">
        <label class="admin-checkbox">
          <input type="checkbox" data-field="launched" ${e.launched_at?`checked`:``}>
          <span>${e.launched_at?o(e.launched_at):`Not yet`}</span>
        </label>
      </td>
      <td data-label="Live URL">
        <input class="admin-input is-url" data-field="live_url" value="${e.live_url??``}" placeholder="https://…">
      </td>
      <td data-label="Last Updated">
        <div class="admin-date">${o(e.last_updated_at)}</div>
        <button type="button" class="admin-touch" data-touch="last_updated_at">Touch now</button>
      </td>
      <td data-label="Security Check">
        <div class="admin-date">${o(e.last_security_check_at)}</div>
        <button type="button" class="admin-touch" data-touch="last_security_check_at">Touch now</button>
      </td>
      <td data-label="Preview">
        <div class="admin-preview">
          <span class="admin-badge ${e.has_preview?`is-yes`:``}">${e.has_preview?`Available`:`None`}</span>
          <div class="admin-preview-actions">
            <label class="admin-upload-label" data-upload-label>
              Upload .zip
              <input type="file" accept=".zip" data-upload-input>
            </label>
            <button type="button" class="admin-preview-remove" data-action="remove-preview" ${e.has_preview?``:`disabled`}>Remove</button>
          </div>
        </div>
      </td>
      <td data-label="Actions">
        <div class="admin-row-actions">
          <button type="button" class="admin-btn is-primary" data-action="save">Save</button>
          <button type="button" class="admin-btn is-danger" data-action="delete" ${e.has_project?``:`disabled`}>Delete</button>
        </div>
      </td>
    </tr>
  `}var l=[],u={};function d(){r.innerHTML=`
    <table class="admin-table">
      <thead>
        <tr>
          <th>Client</th><th>Stage</th><th>Launched</th>
          <th>Live URL</th><th>Last Updated</th><th>Security Check</th><th>Preview</th><th>Actions</th>
        </tr>
      </thead>
      <tbody>${l.map(c).join(``)}</tbody>
    </table>
  `,f()}function f(){r.querySelectorAll(`tr[data-user-id]`).forEach(e=>{let t=e.dataset.userId;e.querySelectorAll(`[data-touch]`).forEach(n=>{n.addEventListener(`click`,()=>{let r=n.dataset.touch;u[t]=u[t]||{},u[t][r]=new Date().toISOString(),n.previousElementSibling.textContent=`Just now`,h(e)})}),e.querySelectorAll(`[data-field]`).forEach(t=>{t.addEventListener(`input`,()=>h(e))}),e.querySelector(`[data-action="save"]`).addEventListener(`click`,()=>g(e,t)),e.querySelector(`[data-action="delete"]`).addEventListener(`click`,()=>_(t)),e.querySelector(`[data-action="remove-preview"]`).addEventListener(`click`,()=>m(t));let n=e.querySelector(`[data-upload-input]`);n.addEventListener(`change`,()=>{let e=n.files?.[0];e&&p(t,e)})})}async function p(t,n){let i=r.querySelector(`tr[data-user-id="${t}"] [data-upload-label]`);i?.classList.add(`is-busy`),a(`Uploading preview…`);try{let r=new FormData;r.append(`zip`,n);let i=await fetch(`${e}/clients/${t}/preview`,{method:`POST`,body:r});if(!i.ok)throw Error((await i.json()).error||`Upload failed`);a(`Preview uploaded.`,`success`),await v()}catch(e){a(e instanceof Error?e.message:`Upload failed`,`error`),i?.classList.remove(`is-busy`)}}async function m(t){if(confirm(`Remove this client's live preview files?`)){a(`Removing preview…`);try{let n=await fetch(`${e}/clients/${t}/preview`,{method:`DELETE`});if(!n.ok)throw Error((await n.json()).error||`Remove failed`);a(`Preview removed.`,`success`),await v()}catch(e){a(e instanceof Error?e.message:`Remove failed`,`error`)}}}function h(e){e.querySelector(`[data-action="save"]`).classList.add(`is-dirty`)}async function g(t,n){let r=t.querySelector(`[data-field="business_name"]`).value.trim(),i=t.querySelector(`[data-field="stage"]`).value,o=t.querySelector(`[data-field="launched"]`).checked,s=t.querySelector(`[data-field="live_url"]`).value.trim(),c=l.find(e=>e.user_id===n),d=u[n]||{},f={business_name:r||null,stage:i===``?null:Number(i),launched_at:o?c?.launched_at??new Date().toISOString():null,live_url:s||null,last_updated_at:d.last_updated_at??c?.last_updated_at??null,last_security_check_at:d.last_security_check_at??c?.last_security_check_at??null};a(`Saving…`);try{let t=await fetch(`${e}/clients/${n}`,{method:`PUT`,headers:{"Content-Type":`application/json`},body:JSON.stringify(f)});if(!t.ok)throw Error((await t.json()).error||`Save failed`);delete u[n],a(`Saved.`,`success`),await v()}catch(e){a(e instanceof Error?e.message:`Save failed`,`error`)}}async function _(t){if(confirm(`Remove this client's project? This deletes their stage/status data — their login stays intact.`)){a(`Deleting…`);try{let n=await fetch(`${e}/clients/${t}`,{method:`DELETE`});if(!n.ok)throw Error((await n.json()).error||`Delete failed`);a(`Deleted.`,`success`),await v()}catch(e){a(e instanceof Error?e.message:`Delete failed`,`error`)}}}async function v(){a(`Loading…`);try{let t=await fetch(`${e}/clients`);if(!t.ok)throw Error(`Failed to load clients`);l=(await t.json()).clients,u={},d(),a(`${l.length} client${l.length===1?``:`s`} loaded.`)}catch(e){a(e instanceof Error?e.message:`Failed to load`,`error`)}}i.addEventListener(`click`,v),v();