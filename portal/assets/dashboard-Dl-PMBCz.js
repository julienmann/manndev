import{n as e,r as t,t as n}from"./session-Cxifpqtq.js";var r=`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`,i=`<div class="cta-underline-wrap"><div class="cta-underline"></div></div>`,a=document.querySelector(`#main`),o=document.querySelector(`#account-name`),s=document.querySelector(`#logout-btn`);function c(e){return e?new Date(e).toLocaleDateString(`en-US`,{month:`short`,day:`numeric`,year:`numeric`}):`—`}function l(){a.innerHTML=`
    <div class="dash-state">Something went wrong loading your files.</div>
    <button type="button" class="link-cta" id="retry-btn">
      Try again
      ${r}
      ${i}
    </button>
  `,document.querySelector(`#retry-btn`).addEventListener(`click`,f)}async function u(e){try{return(await fetch(`/client-files/${e}/preview/`,{method:`HEAD`,cache:`no-store`})).ok}catch{return!1}}function d(t,n,o){let s=`/client-files/${t}/preview/`,l=o?`
      <a class="link-cta" href="${s}" target="_blank" rel="noopener noreferrer">
        View live preview
        ${r}
        ${i}
      </a>
    `:`<span class="delivery-note">No live preview available yet.</span>`;a.innerHTML=`
    <div class="dash-greeting">
      <p class="dash-greeting-kicker">${e(n.name??`Your project`)}</p>
      <h1 class="dash-greeting-title">Your files</h1>
    </div>
    <div class="delivery">
      <div class="delivery-row">
        <span class="delivery-name">${e(n.file)}</span>
        <span class="delivery-date">Added ${c(n.uploadedAt)}</span>
      </div>
      <div class="delivery-actions">
        ${l}
      </div>
    </div>
  `}async function f(){let e=localStorage.getItem(n);if(!e){window.location.replace(`./index.html?expired=1`);return}let r=await t(e);if(!r.ok){r.reason===`network`?l():(localStorage.removeItem(n),window.location.replace(`./index.html?expired=1`));return}o.textContent=r.info.name??``;let i=await u(e);d(e,r.info,i)}s.addEventListener(`click`,()=>{localStorage.removeItem(n),window.location.replace(`./index.html`)}),f();