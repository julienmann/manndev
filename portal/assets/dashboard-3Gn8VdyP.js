import{t as e}from"./session-BciRRoIT.js";var t=`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`,n=`<div class="cta-underline-wrap"><div class="cta-underline"></div></div>`,r=document.querySelector(`#main`),i=document.querySelector(`#account-name`),a=document.querySelector(`#logout-btn`);function o(e){return e?new Date(e).toLocaleDateString(`en-US`,{month:`short`,day:`numeric`,year:`numeric`}):`—`}function s(){r.innerHTML=`
    <div class="dash-state">Something went wrong loading your files.</div>
    <button type="button" class="link-cta" id="retry-btn">
      Try again
      ${t}
      ${n}
    </button>
  `,document.querySelector(`#retry-btn`).addEventListener(`click`,l)}function c(e,i){let a=`/client-files/${e}/${encodeURIComponent(i.file)}`;r.innerHTML=`
    <div class="dash-greeting">
      <p class="dash-greeting-kicker">${i.name??`Your project`}</p>
      <h1 class="dash-greeting-title">Your files</h1>
    </div>
    <div class="delivery">
      <div class="delivery-row">
        <span class="delivery-name">${i.file}</span>
        <span class="delivery-date">Added ${o(i.uploadedAt)}</span>
      </div>
      <a class="link-cta" href="${a}" download>
        Download
        ${t}
        ${n}
      </a>
    </div>
  `}async function l(){let t=localStorage.getItem(e);if(!t){window.location.replace(`./index.html?expired=1`);return}let n=await fetch(`/client-files/${t}/info.json`,{cache:`no-store`});if(n.status===404){localStorage.removeItem(e),window.location.replace(`./index.html?expired=1`);return}if(!n.ok){s();return}let r=await n.json();i.textContent=r.name??``,c(t,r)}a.addEventListener(`click`,()=>{localStorage.removeItem(e),window.location.replace(`./index.html`)}),l();