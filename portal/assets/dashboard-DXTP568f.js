import{a as e,c as t,i as n,n as r,o as i,r as a}from"./session-CVtAS-hL.js";var o=`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`,s=`<div class="cta-underline-wrap"><div class="cta-underline"></div></div>`,c=document.querySelector(`#main`),l=document.querySelector(`#account-name`),u=document.querySelector(`#logout-btn`);function d(){c.innerHTML=`
    <div class="dash-state">Something went wrong loading your files.</div>
    <button type="button" class="link-cta" id="retry-btn">
      Try again
      ${o}
      ${s}
    </button>
  `,document.querySelector(`#retry-btn`).addEventListener(`click`,_)}async function f(e){try{return(await fetch(`/client-files/${e}/preview/`,{method:`HEAD`,cache:`no-store`})).ok}catch{return!1}}function p(e,t,r){let a=`/client-files/${e}/preview/`,l=r?`
      <a class="link-cta" href="${a}" target="_blank" rel="noopener noreferrer">
        View live preview
        ${o}
        ${s}
      </a>
    `:`<span class="delivery-note">No live preview available yet.</span>`;c.innerHTML=`
    <div class="dash-greeting">
      <p class="dash-greeting-kicker">${n(t.name??`Your project`)}</p>
      <h1 class="dash-greeting-title">Your files</h1>
    </div>
    <div class="delivery">
      <div class="delivery-row">
        <span class="delivery-name">${n(t.file)}</span>
        <span class="delivery-date">Added ${i(t.uploadedAt)}</span>
      </div>
      <div class="delivery-actions">
        ${l}
      </div>
    </div>
  `}var m=document.querySelector(`#pw-dialog`),h=document.querySelector(`#pw-open-btn`);function g(e){document.querySelector(`#pw-username`).textContent=e,document.querySelector(`#pw-username-field`).value=e,h.hidden=!1;let n=document.querySelector(`#pw-form`),i=document.querySelector(`#pw-current`),o=document.querySelector(`#pw-new`),s=document.querySelector(`#pw-confirm`),c=document.querySelector(`#pw-submit`),l=document.querySelector(`#pw-submit-label`),u=document.querySelector(`#pw-status`),d=(e,n)=>t(u,e,n),f;h.addEventListener(`click`,()=>{window.clearTimeout(f),n.reset(),d(``),m.showModal(),i.focus()}),document.querySelector(`#pw-close-btn`).addEventListener(`click`,()=>m.close()),m.addEventListener(`click`,e=>{e.target===m&&m.close()}),n.addEventListener(`submit`,async t=>{if(t.preventDefault(),!i.value){d(`Enter your current password.`,`error`),i.focus();return}if(o.value.length<10){d(`Your new password needs at least 10 characters.`,`error`),o.focus();return}if(o.value!==s.value){d(`The new passwords don't match.`,`error`),s.focus();return}if(o.value===i.value){d(`Choose a password different from your current one.`,`error`),o.focus();return}c.disabled=!0,l.textContent=`Updating…`,d(``);try{let t=await a(e,i.value);if(t!==localStorage.getItem(`portal_key`)){d(`Your current password isn't right.`,`error`),i.value=``,i.focus();return}let s=await a(e,o.value),c=await fetch(`/api/change-password`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({oldKey:t,newKey:s})});c.ok?(localStorage.setItem(r,s),n.reset(),d(`Password updated. Use your new password next time you sign in.`,`success`),f=window.setTimeout(()=>m.close(),2200)):c.status===429?d(`Too many attempts. Wait a few minutes and try again.`,`error`):c.status===404?d(`Your current password isn't right.`,`error`):c.status===409?d(`Choose a different new password.`,`error`):d(`Couldn't update your password right now. Try again later, or get in touch.`,`error`)}catch{d(`Couldn't reach the server. Check your connection and try again.`,`error`)}finally{c.disabled=!1,l.textContent=`Update password`}})}async function _(){let t=localStorage.getItem(r);if(!t){window.location.replace(`./index.html?expired=1`);return}let n=await e(t);if(!n.ok){n.reason===`network`?d():(localStorage.removeItem(r),window.location.replace(`./index.html?expired=1`));return}l.textContent=n.info.name??``,n.info.username&&g(n.info.username);let i=await f(n.folder);p(n.folder,n.info,i)}u.addEventListener(`click`,()=>{localStorage.removeItem(r),window.location.replace(`./index.html`)}),_();