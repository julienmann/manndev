import{c as e,i as t,n,o as r,r as i,s as a,u as o}from"./session-jzfOmEGf.js";var s=`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`,c=`<div class="cta-underline-wrap"><div class="cta-underline"></div></div>`,l=document.querySelector(`#main`),u=document.querySelector(`#account-name`),d=document.querySelector(`#logout-btn`);function f(){l.innerHTML=`
    <div class="dash-state">Something went wrong loading your files.</div>
    <button type="button" class="link-cta" id="retry-btn">
      Try again
      ${s}
      ${c}
    </button>
  `,document.querySelector(`#retry-btn`).addEventListener(`click`,v)}async function p(e){try{return(await fetch(`/client-files/${e}/preview/`,{method:`HEAD`,cache:`no-store`})).ok}catch{return!1}}function m(n,r,i){let a=`/client-files/${n}/preview/`,o=i?`
      <a class="link-cta" href="${a}" target="_blank" rel="noopener noreferrer">
        View live preview
        ${s}
        ${c}
      </a>
    `:`<span class="delivery-note">No live preview available yet.</span>`;l.innerHTML=`
    <div class="dash-greeting">
      <p class="dash-greeting-kicker">${t(r.name??`Your project`)}</p>
      <h1 class="dash-greeting-title">Your files</h1>
    </div>
    <div class="delivery">
      <div class="delivery-row">
        <span class="delivery-name">${t(r.file)}</span>
        <span class="delivery-date">Added ${e(r.uploadedAt)}</span>
      </div>
      <div class="delivery-actions">
        ${o}
      </div>
    </div>
  `}var h=document.querySelector(`#pw-dialog`),g=document.querySelector(`#pw-open-btn`);function _(e){document.querySelector(`#pw-username`).textContent=e,document.querySelector(`#pw-username-field`).defaultValue=e,g.hidden=!1;let t=document.querySelector(`#pw-form`),r=document.querySelector(`#pw-current`),a=document.querySelector(`#pw-new`),s=document.querySelector(`#pw-confirm`),c=document.querySelector(`#pw-submit`),l=document.querySelector(`#pw-submit-label`),u=document.querySelector(`#pw-status`),d=(e,t)=>o(u,e,t),f;g.addEventListener(`click`,()=>{window.clearTimeout(f),t.reset(),d(``),h.showModal(),r.focus()}),document.querySelector(`#pw-close-btn`).addEventListener(`click`,()=>h.close());let p=e=>{let t=h.getBoundingClientRect();return e.target===h&&(e.clientX<t.left||e.clientX>t.right||e.clientY<t.top||e.clientY>t.bottom)},m=!1;h.addEventListener(`pointerdown`,e=>{m=p(e)}),h.addEventListener(`click`,e=>{m&&p(e)&&h.close(),m=!1}),t.addEventListener(`submit`,async o=>{if(o.preventDefault(),!r.value){d(`Enter your current password.`,`error`),r.focus();return}if(a.value.length<10){d(`Your new password needs at least 10 characters.`,`error`),a.focus();return}if(a.value!==s.value){d(`The new passwords don't match.`,`error`),s.focus();return}if(a.value===r.value){d(`Choose a password different from your current one.`,`error`),a.focus();return}c.disabled=!0,l.textContent=`Updating…`,d(``);try{let o=await i(e,r.value);if(o!==localStorage.getItem(`portal_key`)){d(`Your current password isn't right.`,`error`),r.value=``,r.focus();return}let s=await i(e,a.value),c=await fetch(`/api/change-password`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({oldKey:o,newKey:s})});c.ok?(localStorage.setItem(n,s),t.reset(),d(`Password updated. Use your new password next time you sign in.`,`success`),f=window.setTimeout(()=>h.close(),2200)):c.status===429?d(`Too many attempts. Wait a few minutes and try again.`,`error`):c.status===404?d(`Your current password isn't right.`,`error`):c.status===409?d(`Choose a different new password.`,`error`):d(`Couldn't update your password right now. Try again later, or get in touch.`,`error`)}catch{d(`Couldn't reach the server. Check your connection and try again.`,`error`)}finally{c.disabled=!1,l.textContent=`Update password`}})}async function v(){let e=localStorage.getItem(n);if(!e){window.location.replace(`./index.html?expired=1`);return}let t=await r(e);if(!t.ok)return y(t.reason);let[i,o]=await Promise.all([a(t.folder),p(t.folder)]);if(!i.ok)return y(i.reason);u.textContent=i.info.name??``,i.info.username&&_(i.info.username),m(t.folder,i.info,o)}function y(e){e===`network`?f():(localStorage.removeItem(n),window.location.replace(`./index.html?expired=1`))}d.addEventListener(`click`,()=>{localStorage.removeItem(n),window.location.replace(`./index.html`)}),v();