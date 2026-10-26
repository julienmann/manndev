/* Analytics only with consent (Québec Law 25, and the "no surveillance pixels"
   promise on the home page). Google Analytics is not loaded at all until the
   visitor says yes; the choice is remembered in localStorage. Until then,
   gtag() calls just queue in dataLayer and nothing leaves the browser.
   The question appears once, quietly, after the spotlight intro has finished. */
(function () {
  var ID = 'G-2ZEZB4R3CP', KEY = 'analytics';
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { dataLayer.push(arguments); };

  function load() {
    if (load.done) return;
    load.done = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
    document.head.appendChild(s);
    /* events queued before consent (the 404 page sends one) go after config, or GA drops them */
    var queued = dataLayer.splice(0);
    gtag('js', new Date());
    gtag('config', ID);
    queued.forEach(function (a) { dataLayer.push(a); });
  }
  function remember(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  var choice = null;
  try { choice = localStorage.getItem(KEY); } catch (e) {}
  if (choice === 'granted') { load(); return; }
  if (choice === 'denied') return;

  var fr = /^fr/i.test(document.documentElement.lang);
  var T = fr
    ? { text: 'Nous aimerions compter les visites avec Google Analytics, seulement si vous l’acceptez.', yes: 'Accepter', no: 'Non merci', label: 'Mesure d’audience' }
    : { text: 'We’d like to count visits with Google Analytics, only if you allow it.', yes: 'Allow', no: 'No thanks', label: 'Analytics' };

  function ask() {
    if (document.getElementById('consent')) return;
    var css = document.createElement('style');
    css.textContent =
      '#consent{position:fixed;left:1rem;bottom:1rem;z-index:60;max-width:min(26rem,calc(100vw - 2rem));' +
      'display:flex;flex-wrap:wrap;align-items:center;gap:.75rem 1.25rem;padding:1.1rem 1.25rem;' +
      'background:var(--surface,#252b34);border:1px solid var(--rule,rgba(240,242,244,.09));border-radius:20px;' +
      'box-shadow:0 16px 44px rgba(0,0,0,.3);font-family:var(--body,system-ui,sans-serif);font-size:.9rem;line-height:1.5;color:var(--mid,#969ba6);' +
      'opacity:0;transform:translateY(12px);transition:opacity .5s cubic-bezier(.22,1,.36,1),transform .5s cubic-bezier(.22,1,.36,1);}' +
      '#consent.is-in{opacity:1;transform:none;}' +
      '#consent p{flex:1 1 100%;margin:0;}' +
      '#consent button{font:600 .85rem/1 var(--body,system-ui,sans-serif);letter-spacing:.08em;text-transform:uppercase;cursor:pointer;' +
      'color:var(--accent,#f2c94c);background:none;border:1px solid transparent;border-radius:999px;padding:.75rem 1.2rem;min-height:44px;}' +
      '#consent .consent-yes{border-color:var(--accent,#f2c94c);}' +
      '@media(hover:hover){#consent .consent-yes:hover{background:rgba(242,201,76,.08);}#consent .consent-no:hover{color:var(--fg,#f0f2f4);}}' +
      '@media(prefers-reduced-motion:reduce){#consent{transition:none;}}';
    document.head.appendChild(css);

    var bar = document.createElement('div');
    bar.id = 'consent';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', T.label);
    bar.innerHTML = '<p></p><button type="button" class="consent-yes"></button><button type="button" class="consent-no"></button>';
    bar.querySelector('p').textContent = T.text;
    bar.querySelector('.consent-yes').textContent = T.yes;
    bar.querySelector('.consent-no').textContent = T.no;
    function close() {
      bar.classList.remove('is-in');
      setTimeout(function () { bar.remove(); }, 500);
    }
    bar.querySelector('.consent-yes').addEventListener('click', function () { remember('granted'); load(); close(); });
    bar.querySelector('.consent-no').addEventListener('click', function () { remember('denied'); close(); });
    document.body.appendChild(bar);
    requestAnimationFrame(function () { requestAnimationFrame(function () { bar.classList.add('is-in'); }); });
  }

  /* wait until the page has loaded and the intro (if any) has handed over */
  function whenSettled() {
    var root = document.documentElement;
    if (!root.classList.contains('js-intro')) { setTimeout(ask, 1200); return; }
    var mo = new MutationObserver(function () {
      if (!root.classList.contains('js-intro')) { mo.disconnect(); setTimeout(ask, 1200); }
    });
    mo.observe(root, { attributes: true, attributeFilter: ['class'] });
  }
  if (document.readyState === 'complete') whenSettled();
  else addEventListener('load', whenSettled, { once: true });
})();
