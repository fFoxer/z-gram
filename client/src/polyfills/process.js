// Minimal browser-side polyfill for `process` used by some libraries.
// This file is imported before the app code to satisfy ESLint `import/first`.
if (typeof window !== 'undefined' && typeof window.process === 'undefined') {
  // Provide minimal `process` with `env` and `nextTick` to satisfy libs
  window.process = {
    env: {},
    nextTick: (fn, ...args) => {
      if (typeof queueMicrotask === 'function') {
        queueMicrotask(() => fn(...args));
      } else {
        setTimeout(() => fn(...args), 0);
      }
    }
  };
}

export default null;
