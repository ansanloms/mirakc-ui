import * as React from 'react';
import * as S from "@ds-stories/client/components/organisms/Watch/Player.stories";
import * as S2 from "@ds-stories/client/components/templates/Watch.stories";

// The Player loads mpegts.js lazily through an injected `loadMpegts` loader.
// The real storybook reference ships the real mpegts.js: isSupported() is true,
// it tries the dummy `example.invalid` stream, the network load fails, the
// player fires its ERROR event, and the component renders the "受信エラーが
// 発生しました" overlay (code: NetworkError / Exception, with a 再試行 button).
// The design bundle resolves mpegts.js to a build-time stub whose isSupported()
// returns false, which would instead render the "MSE not supported" message —
// a state the storybook reference never shows. To match the reference, inject
// loaders that reproduce the reference's end-state: isSupported() → true and an
// ERROR event fired synchronously with the same detail strings. aribb24 is
// stubbed just enough for the player's init path to run without throwing.
function loadMpegts(): any {
  const handlers: Record<string, (...a: any[]) => void> = {};
  const player = {
    on(event: string, handler: (...a: any[]) => void) {
      handlers[event] = handler;
      // Fire the receive error immediately so the overlay paints, matching the
      // storybook reference where the dummy stream fails to load.
      if (event === "ERROR") handler("NetworkError", "Exception");
    },
    off() {},
    load() {},
    play() {},
    pause() {},
    unload() {},
    attachMediaElement() {},
    detachMediaElement() {},
    destroy() {},
  };
  const mpegts = {
    isSupported: () => true,
    createPlayer: () => player,
    Events: {
      ERROR: "ERROR",
      PES_PRIVATE_DATA_ARRIVED: "PES_PRIVATE_DATA_ARRIVED",
      TIMED_ID3_METADATA_ARRIVED: "TIMED_ID3_METADATA_ARRIVED",
    } as Record<string, string>,
  };
  return Promise.resolve({ default: mpegts });
}

function loadAribb24(): any {
  class Controller {
    attachMedia() {}
    detachMedia() {}
    attachFeeder() {}
    detachFeeder() {}
    attachRenderer() {}
    detachRenderer() {}
    show() {}
    hide() {}
  }
  class MPEGTSFeeder {
    feedB24() {}
    feedID3() {}
  }
  class CanvasMainThreadRenderer {
    destroy() {}
  }
  return Promise.resolve({ Controller, MPEGTSFeeder, CanvasMainThreadRenderer });
}

function compose(S: any, key: string, extraArgs?: any) {
  const meta: any = S.default ?? {};
  const st: any = S[key];
  const args: any = { ...(meta.args ?? {}), ...(st && st.args ? st.args : {}), ...(extraArgs ?? {}) };
  const at: any = { ...(meta.argTypes ?? {}), ...(st && st.argTypes ? st.argTypes : {}) };
  for (const k of Object.keys(args)) {
    const m = at[k] && at[k].mapping;
    if (m && typeof m === 'object' && args[k] in m) args[k] = m[args[k]];
  }
  const title: string = typeof meta.title === 'string' ? meta.title : '';
  const ctx: any = {
    args, name: key, title, kind: title, id: '', componentId: '',
    globals: {}, viewMode: 'story',
    parameters: (st && st.parameters) ?? meta.parameters ?? {},
  };
  let render: (() => any) | null = null;
  if (st && typeof st.render === 'function') render = () => st.render(args, ctx);
  else if (typeof st === 'function') render = () => st(args, ctx);
  else if (typeof meta.render === 'function') render = () => meta.render(args, ctx);
  else {
    const C = (st && st.component) || meta.component;
    if (C) render = () => React.createElement(C, args);
  }
  if (!render) return () => null;
  const decorators: any[] = ([] as any[]).concat((st && st.decorators) ?? []).concat(meta.decorators ?? []);
  return decorators.reduce((inner: any, dec: any) => () => {
    const out = dec(inner, ctx);
    return out === undefined ? inner() : out;
  }, render);
}

const playerLoaders = { loadMpegts, loadAribb24 };

export const Placeholder = /* Placeholder */ compose(S, "Placeholder");
export const Live = /* Live */ compose(S, "Live", playerLoaders);
export const WithComments = /* With Comments */ compose(S, "WithComments", playerLoaders);
export const Default = /* Default */ compose(S2, "Default");
export const Info = /* Info */ compose(S2, "Info");
export const Live2 = /* Live */ compose(S2, "Live");
export const Demo = /* Demo */ compose(S2, "Demo");
export const DemoInfo = /* Demo Info */ compose(S2, "DemoInfo");
