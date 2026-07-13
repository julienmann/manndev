import"./style-LhaIMbkN.js";import{n as e,t}from"./session-wjVPXH76.js";var n=`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`,r=`<div class="cta-underline-wrap"><div class="cta-underline"></div></div>`,i=document.querySelector(`#main`),a=document.querySelector(`#account-name`),o=document.querySelector(`#logout-btn`);function s(e){return e?new Date(e).toLocaleDateString(`en-US`,{month:`short`,day:`numeric`,year:`numeric`}):`—`}function c(){i.innerHTML=`
    <div class="dash-state">Something went wrong loading your files.</div>
    <button type="button" class="link-cta" id="retry-btn">
      Try again
      ${n}
      ${r}
    </button>
  `,document.querySelector(`#retry-btn`).addEventListener(`click`,d)}async function l(e){try{return(await fetch(`/client-files/${e}/preview/`,{method:`HEAD`,cache:`no-store`})).ok}catch{return!1}}function u(e,t,a){let o=`/client-files/${e}/${encodeURIComponent(t.file)}`,c=`/client-files/${e}/preview/`,l=a?`
      <a class="link-cta" href="${c}" target="_blank" rel="noopener noreferrer">
        View live preview
        ${n}
        ${r}
      </a>
    `:``;i.innerHTML=`
    <div class="dash-greeting">
      <p class="dash-greeting-kicker">${t.name??`Your project`}</p>
      <h1 class="dash-greeting-title">Your files</h1>
    </div>
    <div class="delivery">
      <div class="delivery-row">
        <span class="delivery-name">${t.file}</span>
        <span class="delivery-date">Added ${s(t.uploadedAt)}</span>
      </div>
      <div class="delivery-actions">
        ${l}
        <a class="link-cta" href="${o}" download>
          Download
          ${n}
          ${r}
        </a>
      </div>
    </div>
  `}async function d(){let n=localStorage.getItem(t);if(!n){window.location.replace(`./index.html?expired=1`);return}let r=await e(n);if(!r.ok){r.reason===`network`?c():(localStorage.removeItem(t),window.location.replace(`./index.html?expired=1`));return}a.textContent=r.info.name??``;let i=await l(n);u(n,r.info,i)}o.addEventListener(`click`,()=>{localStorage.removeItem(t),window.location.replace(`./index.html`)}),d();