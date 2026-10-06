// Browser instrumentation shared by the general and focused local runners.
// DOM confirmation is sampled in rAF before paint; it is NOT paint completion or INP.
export function installInteractionTiming() {
  const serializeEvent = e => ({ name: e.name, startTime: e.startTime,
    duration: e.duration, processingStart: e.processingStart,
    processingEnd: e.processingEnd, interactionId: e.interactionId });
  const serializeTask = e => ({ startTime: e.startTime, duration: e.duration });
  const events = [], tasks = [];
  const eventObserver = new PerformanceObserver(list => events.push(...list.getEntries().map(serializeEvent)));
  eventObserver.observe({ type: 'event', durationThreshold: 16, buffered: true });
  const taskObserver = new PerformanceObserver(list => tasks.push(...list.getEntries().map(serializeTask)));
  taskObserver.observe({ type: 'longtask', buffered: true });
  window.qualityTiming = { events, tasks, eventObserver, taskObserver, serializeEvent, serializeTask };
}

export async function measureInteraction(page, { name, selector, predicate }) {
  const target = page.locator(`${selector}:visible`).first();
  await target.scrollIntoViewIfNeeded();
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await target.evaluate((element, { predicate, name }) => {
    const timing = window.qualityTiming;
    // Drain queued observer records before clearing buffers; no previous action survives.
    timing.eventObserver.takeRecords(); timing.taskObserver.takeRecords();
    timing.events.length = 0; timing.tasks.length = 0;
    const state = { name, armedAt: performance.now(), inputStart: null, clickAt: null, end: null, mutationObservedAt: null };
    window.qualityMeasurement = state;
    element.addEventListener('pointerdown', event => { state.inputStart = event.timeStamp; }, { once: true, capture: true });
    element.addEventListener('click', event => {
      state.clickAt = performance.now();
      state.clickEventStart = event.timeStamp;
      state.inputStart ??= event.timeStamp;
      const test = new Function(`return (${predicate})`);
      // Separate DOM-mutation observation from the rAF sampling delay. Neither is paint.
      const mutationObserver = new MutationObserver(() => {
        if (state.mutationObservedAt === null && test()) state.mutationObservedAt = performance.now();
      });
      mutationObserver.observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true });
      function poll() {
        if (test()) {
          state.end = performance.now();
          mutationObserver.disconnect();
          const image = document.querySelector('.case-modal__gallery-image');
          state.imageAtConfirmation = image ? { src: image.currentSrc || image.src,
            complete: image.complete, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight } : null;
          if (image) {
            state.photo = { decodeResolvedAt: null, error: null };
            image.decode().then(() => { state.photo.decodeResolvedAt = performance.now(); })
              .catch(error => { state.photo.error = error.message; });
          }
        } else requestAnimationFrame(poll);
      }
      requestAnimationFrame(poll);
    }, { once: true, capture: true });
  }, { predicate, name });
  await target.click();
  await page.waitForFunction(() => window.qualityMeasurement?.end !== null);
  // Allow observer delivery, but do not extend the measured window by this wait.
  await page.waitForTimeout(350);
  return page.evaluate(() => {
    const t = window.qualityTiming, m = window.qualityMeasurement;
    t.events.push(...t.eventObserver.takeRecords().map(t.serializeEvent));
    t.tasks.push(...t.taskObserver.takeRecords().map(t.serializeTask));
    const startsInWindow = e => e.startTime >= m.inputStart - 0.01 && e.startTime <= m.end;
    const actionEvents = t.events.filter(e => e.interactionId > 0 && startsInWindow(e));
    const ids = [...new Set(actionEvents.map(e => e.interactionId))];
    const eventEntries = t.events.filter(e => ids.includes(e.interactionId) && startsInWindow(e));
    const longTasks = t.tasks.filter(e => e.startTime < m.end && e.startTime + e.duration > m.inputStart)
      .map(e => ({ ...e, overlapMs: Math.min(m.end, e.startTime + e.duration) - Math.max(m.inputStart, e.startTime) }));
    return { name: m.name, window: { startTime: m.inputStart, clickCaptureTime: m.clickAt, endTime: m.end },
      domStateConfirmationMs: m.end - m.clickAt, inputToDomStateMs: m.end - m.inputStart,
      domMutationConfirmationMs: m.mutationObservedAt === null ? null : m.mutationObservedAt - m.clickAt,
      rafSamplingDelayMs: m.mutationObservedAt === null ? null : m.end - m.mutationObservedAt,
      interactionIds: ids, eventEntries, longTasks, imageAtConfirmation: m.imageAtConfirmation,
      excludedEventCount: t.events.length - eventEntries.length,
      excludedLongTaskCount: t.tasks.length - longTasks.length };
  });
}
