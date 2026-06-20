import { supabase } from './supabase';

const form = document.querySelector<HTMLFormElement>('#login-form')!;
const emailInput = document.querySelector<HTMLInputElement>('#email')!;
const submitBtn = document.querySelector<HTMLButtonElement>('#submit-btn')!;
const submitLabel = document.querySelector<HTMLSpanElement>('#submit-label')!;
const status = document.querySelector<HTMLParagraphElement>('#status')!;

function setStatus(message: string, tone?: 'error' | 'success') {
  status.textContent = message;
  if (tone) status.dataset.tone = tone;
  else delete status.dataset.tone;
}

// Already signed in? Skip straight to the dashboard.
supabase.auth.getSession().then(({ data }) => {
  if (data.session) window.location.replace('./dashboard.html');
});

if (new URLSearchParams(window.location.search).has('expired')) {
  setStatus("You've been signed out. Enter your email to get a new link.");
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = emailInput.value.trim();
  if (!email) {
    setStatus('Enter your email address first.', 'error');
    return;
  }

  submitBtn.disabled = true;
  submitLabel.textContent = 'Sending…';
  setStatus('');

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: new URL('dashboard.html', window.location.href).toString(),
    },
  });

  if (error) {
    submitBtn.disabled = false;
    submitLabel.textContent = 'Send secure link';
    if (error.status === 429 || /rate limit/i.test(error.message)) {
      setStatus("You've requested a few of these already — check your inbox, or try again in a minute.", 'error');
    } else {
      setStatus("Couldn't send that link. Check the email address and try again.", 'error');
    }
    return;
  }

  submitLabel.textContent = 'Link sent';
  setStatus(`Check ${email} for a link to your portal. It's valid for 1 hour.`, 'success');
});
