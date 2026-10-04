import { createApp } from './core/app.js';

const app = createApp({
  document,
  window,
  localStorage: window.localStorage,
  sessionStorage: window.sessionStorage
});

app.start();
