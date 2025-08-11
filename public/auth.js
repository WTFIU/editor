// auth.js — checks password against ADMIN_HASH (injected at build time)
import { hashString } from './hash.js';

// ADMIN_HASH will be provided via secrets/config.js created in Actions.
// In dev, you can copy secrets/config.example.js -> secrets/config.js and fill ADMIN_HASH manually.
import { ADMIN_HASH } from '../secrets/config.js';

const loginBtn = document.getElementById('login-btn');
const pwInput = document.getElementById('password');
const msg = document.getElementById('login-msg');
const loginPage = document.getElementById('login-page');
const editorPage = document.getElementById('editor-page');

loginBtn.addEventListener('click', async () => {
  const val = pwInput.value || '';
  msg.textContent = 'Checking...';
  const h = await hashString(val);
  if (h === ADMIN_HASH) {
    msg.textContent = 'Success — loading editor...';
    loginPage.classList.add('hidden');
    editorPage.classList.remove('hidden');
    // Fire editor init event
    document.dispatchEvent(new CustomEvent('editor:authenticated'));
  } else {
    msg.textContent = 'Incorrect password.';
  }
});

// allow enter key
pwInput.addEventListener('keydown', (e) => { if (e.key==='Enter') loginBtn.click(); });

window.logout = () => {
  pwInput.value = '';
  loginPage.classList.remove('hidden');
  editorPage.classList.add('hidden');
};
