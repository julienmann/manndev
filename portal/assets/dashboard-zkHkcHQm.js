import{t as e}from"./supabase-DzXzlQHk.js";var t=[{name:`Brief & Discovery`,note:`We're gathering your goals, audience, and what the site needs to do.`},{name:`Design`,note:`Establishing the visual language — typography, palette, layout.`},{name:`Build`,note:`Writing the site. You can ask for a preview link at any point.`},{name:`Review & Refine`,note:`Testing across devices, optimising performance, working through feedback.`},{name:`Launch`,note:`Deploying to your domain and wiring up analytics.`}],n=document.querySelector(`#main`),r=document.querySelector(`#account-email`),i=document.querySelector(`#logout-btn`);function a(e){return e?new Date(e).toLocaleDateString(`en-US`,{month:`short`,day:`numeric`,year:`numeric`}):`—`}function o(){n.innerHTML=`
    <div class="dash-greeting">
      <p class="dash-greeting-kicker">Not set up yet</p>
      <h1 class="dash-greeting-title">Hang tight</h1>
    </div>
    <p class="dash-note">We'll email you as soon as your project is ready to track here.</p>
  `}function s(){n.innerHTML=`
    <div class="dash-state">Something went wrong loading your project.</div>
    <button type="button" class="btn-retry" id="retry-btn">Try again</button>
  `,document.querySelector(`#retry-btn`).addEventListener(`click`,u)}function c(e,r){let i=e.stage??0,o=t.map((t,n)=>{let r=n<i?`done`:n===i?`current`:`upcoming`,o=r===`current`&&e.last_updated_at?`<div class="tracker-since">Since ${a(e.last_updated_at)}</div>`:``;return`
      <div class="tracker-step" data-state="${r}">
        <div class="tracker-num">${String(n+1).padStart(2,`0`)}</div>
        <div class="tracker-body">
          <div class="tracker-name">${t.name}</div>
          ${r===`current`?`<div class="tracker-note">${t.note}</div>${o}`:``}
        </div>
      </div>
    `}).join(``),s=r?`
      <div class="preview-panel">
        <div class="preview-bar">
          <span class="preview-dot"></span><span class="preview-dot"></span><span class="preview-dot"></span>
          <span class="preview-label">Live Preview</span>
          <a class="preview-open" href="${r}" target="_blank" rel="noopener noreferrer">Open full view ↗</a>
        </div>
        <iframe class="preview-frame" src="${r}" title="Live site preview" loading="lazy"></iframe>
      </div>
    `:``;n.innerHTML=`
    <div class="dash-greeting">
      <p class="dash-greeting-kicker">${e.business_name??`Your project`}</p>
      <h1 class="dash-greeting-title">In progress</h1>
    </div>
    ${s}
    <p class="tracker-kicker">Step ${i+1} of ${t.length}</p>
    <div class="tracker">${o}</div>
  `}function l(e){n.innerHTML=`
    <div class="dash-greeting">
      <p class="dash-greeting-kicker">${e.business_name??`Your site`}</p>
      <h1 class="dash-greeting-title">Live &amp; maintained</h1>
    </div>
    <div class="maint">
      <div class="maint-row">
        <span class="maint-label">Site status</span>
        <span class="maint-value is-live"><span class="live-dot" aria-hidden="true"></span>Live</span>
      </div>
      <div class="maint-row">
        <span class="maint-label">Last updated</span>
        <span class="maint-value">${a(e.last_updated_at)}</span>
      </div>
      <div class="maint-row">
        <span class="maint-label">Last security check</span>
        <span class="maint-value">${a(e.last_security_check_at)}</span>
      </div>
      <div class="maint-row">
        <span class="maint-label">Live site</span>
        <span class="maint-value">${e.live_url?`<a href="${e.live_url}" target="_blank" rel="noopener">${e.live_url.replace(/^https?:\/\//,``)} ↗</a>`:`—`}</span>
      </div>
    </div>
  `}async function u(){let{data:t}=await e.auth.getSession(),n=t.session;if(!n){window.location.replace(`./index.html?expired=1`);return}r.textContent=n.user.email??``;let{data:i,error:a}=await e.from(`client_projects`).select(`business_name, stage, launched_at, live_url, last_updated_at, last_security_check_at`).eq(`user_id`,n.user.id).maybeSingle();if(a){s();return}if(!i){o();return}if(i.launched_at)l(i);else{let e=`/client-previews/${n.user.id}/`;c(i,await fetch(e,{method:`HEAD`}).then(e=>e.ok).catch(()=>!1)?e:null)}}i.addEventListener(`click`,async()=>{await e.auth.signOut(),window.location.replace(`./index.html`)}),e.auth.onAuthStateChange(e=>{e===`SIGNED_OUT`&&window.location.replace(`./index.html`)}),u();