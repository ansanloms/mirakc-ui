// Build-time stub for mpegts.js (served from esm.sh in the real app, absent
// from node_modules). Player loads it lazily at play time through an injected
// loader, so static previews never invoke any of this — the stub only needs
// to resolve and expose the shape Player destructures (`default`, `Events`).
const stub = {
  isSupported: () => false,
  createPlayer: () => ({
    on() {},
    off() {},
    load() {},
    play() {},
    pause() {},
    unload() {},
    attachMediaElement() {},
    detachMediaElement() {},
    destroy() {},
  }),
  Events: {} as Record<string, string>,
};

export default stub;
