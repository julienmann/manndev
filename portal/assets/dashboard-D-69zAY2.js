import{a as e,i as t,o as n,r}from"./session-BSs1XoME.js";var i=`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`,a=`<div class="cta-underline-wrap"><div class="cta-underline"></div></div>`,o=document.querySelector(`#main`),s=document.querySelector(`#account-name`),c=document.querySelector(`#logout-btn`);function l(e){return e?new Date(e).toLocaleDateString(`en-US`,{month:`short`,day:`numeric`,year:`numeric`}):`—`}function u(){o.innerHTML=`
    <div class="dash-state">Something went wrong loading your files.</div>
    <button type="button" class="link-cta" id="retry-btn">
      Try again
      ${i}
      ${a}
    </button>
  `,document.querySelector(`#retry-btn`).addEventListener(`click`,v)}async function d(e){try{return(await fetch(`/client-files/${e}/preview/`,{method:`HEAD`,cache:`no-store`})).ok}catch{return!1}}function f(t,n,r){let s=`/client-files/${t}/preview/`,c=r?`
      <a class="link-cta" href="${s}" target="_blank" rel="noopener noreferrer">
        View live preview
        ${i}
        ${a}
      </a>
    `:`<span class="delivery-note">No live preview available yet.</span>`;o.innerHTML=`
    <div class="dash-greeting">
      <p class="dash-greeting-kicker">${e(n.name??`Your project`)}</p>
      <h1 class="dash-greeting-title">Your files</h1>
    </div>
    <div class="delivery">
      <div class="delivery-row">
        <span class="delivery-name">${e(n.file)}</span>
        <span class="delivery-date">Added ${l(n.uploadedAt)}</span>
      </div>
      <div class="delivery-actions">
        ${c}
      </div>
    </div>
  `}var p=10,m=document.querySelector(`#pw-dialog`),h=document.querySelector(`#pw-open-btn`),g=!1;function _(e){if(document.querySelector(`#pw-username`).textContent=e,document.querySelector(`#pw-username-field`).value=e,h.hidden=!1,g)return;g=!0;let n=document.querySelector(`#pw-form`),i=document.querySelector(`#pw-current`),a=document.querySelector(`#pw-new`),o=document.querySelector(`#pw-confirm`),s=document.querySelector(`#pw-submit`),c=document.querySelector(`#pw-submit-label`),l=document.querySelector(`#pw-status`),u=(e,t)=>{l.textContent=e,t?l.dataset.tone=t:delete l.dataset.tone},d;h.addEventListener(`click`,()=>{window.clearTimeout(d),n.reset(),u(``),m.showModal(),i.focus()}),document.querySelector(`#pw-close-btn`).addEventListener(`click`,()=>m.close()),m.addEventListener(`click`,e=>{e.target===m&&m.close()}),n.addEventListener(`submit`,async l=>{if(l.preventDefault(),!i.value){u(`Enter your current password.`,`error`),i.focus();return}if(a.value.length<p){u(`Your new password needs at least ${p} characters.`,`error`),a.focus();return}if(a.value!==o.value){u(`The new passwords don't match.`,`error`),o.focus();return}if(a.value===i.value){u(`Choose a password different from your current one.`,`error`),a.focus();return}s.disabled=!0,c.textContent=`Updating…`,u(``);try{let o=await t(e,i.value);if(o!==localStorage.getItem(`portal_key`)){u(`Your current password isn't right.`,`error`),i.value=``,i.focus();return}let s=await t(e,a.value),c=await fetch(`/api/change-password`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({oldKey:o,newKey:s})});c.ok?(localStorage.setItem(r,s),n.reset(),u(`Password updated. Use your new password next time you sign in.`,`success`),d=window.setTimeout(()=>m.close(),2200)):c.status===429?u(`Too many attempts. Wait a few minutes and try again.`,`error`):c.status===404?u(`Your current password isn't right.`,`error`):c.status===409?u(`Choose a different new password.`,`error`):u(`Couldn't update your password right now. Try again later, or get in touch.`,`error`)}catch{u(`Couldn't reach the server. Check your connection and try again.`,`error`)}finally{s.disabled=!1,c.textContent=`Update password`}})}async function v(){let e=localStorage.getItem(r);if(!e){window.location.replace(`./index.html?expired=1`);return}let t=await n(e);if(!t.ok){t.reason===`network`?u():(localStorage.removeItem(r),window.location.replace(`./index.html?expired=1`));return}s.textContent=t.info.name??``,t.info.username&&_(t.info.username);let i=await d(t.folder);f(t.folder,t.info,i)}c.addEventListener(`click`,()=>{localStorage.removeItem(r),window.location.replace(`./index.html`)}),v();