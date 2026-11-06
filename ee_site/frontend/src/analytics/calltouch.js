// Calltouch's project loader runs in the page so it can see phone links.
export function installCalltouch(win, doc) {
  if (win.ct || win.CalltouchDataObject) return;
  const modId = "q0fhtb2e";
  const ct = (...args) => { ct.callbacks.push(args); };
  ct.callbacks = [];
  ct.loaded = false;
  ct.counters = [modId];
  const script = doc.createElement("script");
  script.async = true;
  script.src = `https://mod.calltouch.ru/${typeof Array.prototype.find === "function" ? "init-min.js" : "init.js"}?id=${modId}`;
  win.CalltouchDataObject = "ct";
  win.ct = ct;
  doc.head.append(script);
}
