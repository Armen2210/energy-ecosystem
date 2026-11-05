import { CALLTOUCH_MODULE } from './calltouch.js';
import { permittedEnvironment, safePath } from './policy.js';
// A dedicated document contains no contacts, questionnaire answers or files.
// Removing it on revoke destroys the vendor's timers and listeners as well.
let started = false;
function start() {
  if (started || window === parent || !permittedEnvironment(import.meta.env.PROD, import.meta.env.VITE_CALLTOUCH_ENABLED, location)
  || import.meta.env.VITE_CALLTOUCH_CONFIGURATION_APPROVED !== 'true') return;
  started = true;
  let path = '/';
  try { path = safePath(decodeURIComponent(location.hash.slice(1))); } catch { /* safe root */ }
  history.replaceState(null, '', path);
  window.CalltouchDataObject = 'ct';
  window.ct = function () { window.ct.callbacks.push(arguments); };
  window.ct.callbacks = []; window.ct.loaded = false; window.ct.counters = [CALLTOUCH_MODULE];
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://mod.calltouch.ru/${typeof Array.prototype.find === 'function' ? 'init-min.js' : 'init.js'}?id=${CALLTOUCH_MODULE}`;
  script.referrerPolicy = 'no-referrer';
  document.head.append(script);
  window.eeCalltouchSession = () => {
    try { return window.ct('calltracking_params', CALLTOUCH_MODULE)?.sessionId || null; } catch { return null; }
  };
}

window.addEventListener('message', event => {
  if (event.source === parent && event.origin === location.origin && event.data?.eeCalltouch === true && event.data.type === 'start') start();
});
