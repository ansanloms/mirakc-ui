import { useEffect, useRef } from "react";

/**
 * キーボードショートカット（hotkey）を 1 個登録するフック。
 *
 * `binding` は `"+"` 区切りの文字列で、最後のトークンがキー、残りが修飾子。
 * 修飾子は `mod` / `ctrl`(`control`) / `meta`(`cmd`/`command`/`win`) / `shift` /
 * `alt`(`option`) を解釈する。`mod` は **Mac では ⌘ / それ以外では Ctrl** に解決する
 * ため、プラットフォーム差を吸収したいショートカットは `"mod+k"` のように書く。
 *
 * マッチは修飾子の **厳密一致**（`ctrl+k` は `ctrl+shift+k` で発火しない）。キーは
 * `KeyboardEvent.key` を小文字化して比較する（英字は OK。`shift+/` のような「Shift で
 * 別記号になる」組み合わせは `key` がその記号になるため未対応 — 必要になったら拡張する）。
 *
 * 既定で `preventDefault()` する。これがブラウザ既定（Chrome の Ctrl+K = アドレスバー
 * 検索など）を奪い返す肝。`handler` は最新参照で保持するので、毎 render で新しい関数を
 * 渡してもリスナを張り直さない（`use-now` と同型）。
 */
export type HotkeyOptions = {
  /** 無効化する。既定 true。 */
  enabled?: boolean;
  /** マッチ時に `preventDefault()` するか。既定 true。 */
  preventDefault?: boolean;
  /** input / textarea / select / contenteditable にフォーカス中も発火させるか。既定 true。 */
  allowInInput?: boolean;
  /** Mac 判定（`mod` の解決に使う）。既定は navigator から判定。テストで固定するため注入可能。 */
  isMac?: boolean;
};

type Parsed = {
  /** 小文字化した主キー。 */
  key: string;
  ctrl: boolean;
  meta: boolean;
  shift: boolean;
  alt: boolean;
};

/** `navigator` からプラットフォームが Mac 系かを判定する（取得不能なら false）。 */
function detectMac(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }
  // navigator.platform は非推奨だが現行ブラウザで利用可能。isMac は注入できるため
  // 判定ロジックは最小限に留める。
  return /mac|iphone|ipad|ipod/i.test(navigator.platform);
}

/** binding 文字列を修飾子フラグ + キーへ分解する。 */
function parseHotkey(binding: string, isMac: boolean): Parsed {
  const parsed: Parsed = {
    key: "",
    ctrl: false,
    meta: false,
    shift: false,
    alt: false,
  };
  const tokens = binding.toLowerCase().split("+").map((token) => token.trim())
    .filter(Boolean);
  for (const token of tokens) {
    switch (token) {
      case "mod":
        if (isMac) {
          parsed.meta = true;
        } else {
          parsed.ctrl = true;
        }
        break;
      case "ctrl":
      case "control":
        parsed.ctrl = true;
        break;
      case "meta":
      case "cmd":
      case "command":
      case "win":
        parsed.meta = true;
        break;
      case "shift":
        parsed.shift = true;
        break;
      case "alt":
      case "option":
        parsed.alt = true;
        break;
      default:
        parsed.key = token;
    }
  }
  return parsed;
}

/** KeyboardEvent が parsed の組み合わせと厳密一致するか。 */
function matches(event: KeyboardEvent, parsed: Parsed): boolean {
  return event.ctrlKey === parsed.ctrl &&
    event.metaKey === parsed.meta &&
    event.shiftKey === parsed.shift &&
    event.altKey === parsed.alt &&
    event.key.toLowerCase() === parsed.key;
}

/** イベント発生元が入力系要素（テキスト入力中とみなす）か。 */
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
    return true;
  }
  return target.isContentEditable;
}

export function useHotkey(
  binding: string,
  handler: (event: KeyboardEvent) => void,
  options: HotkeyOptions = {},
): void {
  const {
    enabled = true,
    preventDefault = true,
    allowInInput = true,
    isMac = detectMac(),
  } = options;

  // handler を最新参照で保持し、呼び出し側が毎 render で関数を作り直しても
  // リスナを張り直さないようにする。
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const parsed = parseHotkey(binding, isMac);
    if (!parsed.key) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (!allowInInput && isEditableTarget(event.target)) {
        return;
      }
      if (!matches(event, parsed)) {
        return;
      }
      if (preventDefault) {
        event.preventDefault();
      }
      handlerRef.current(event);
    };
    globalThis.addEventListener("keydown", onKeyDown);
    return () => globalThis.removeEventListener("keydown", onKeyDown);
  }, [binding, enabled, preventDefault, allowInInput, isMac]);
}

/** 単一キーを表示用に整形する（英字は大文字化、名前付きキーは短縮表記）。 */
function displayKey(key: string): string {
  const named: Record<string, string> = {
    escape: "Esc",
    enter: "Enter",
    " ": "Space",
    space: "Space",
    tab: "Tab",
    backspace: "⌫",
    delete: "Del",
    arrowup: "↑",
    arrowdown: "↓",
    arrowleft: "←",
    arrowright: "→",
  };
  if (named[key]) {
    return named[key];
  }
  if (key.length === 1) {
    return key.toUpperCase();
  }
  return key.charAt(0).toUpperCase() + key.slice(1);
}

/**
 * binding をプラットフォームに応じた表示文字列へ整形する。
 *
 * Mac は記号を区切りなしで連結（例: `⌘K` / `⌃⇧K`）、それ以外は単語を `+` で連結
 * （例: `Ctrl+K` / `Ctrl+Shift+K`）。`useHotkey` と同じ binding を渡せば、リスナと
 * 画面表示（`<kbd>`）が単一ソースから導出され表記がずれない。
 */
export function formatHotkey(
  binding: string,
  isMac: boolean = detectMac(),
): string {
  const parsed = parseHotkey(binding, isMac);
  const parts: string[] = [];
  if (isMac) {
    if (parsed.ctrl) {
      parts.push("⌃");
    }
    if (parsed.alt) {
      parts.push("⌥");
    }
    if (parsed.shift) {
      parts.push("⇧");
    }
    if (parsed.meta) {
      parts.push("⌘");
    }
    parts.push(displayKey(parsed.key));
    return parts.join("");
  }
  if (parsed.ctrl) {
    parts.push("Ctrl");
  }
  if (parsed.alt) {
    parts.push("Alt");
  }
  if (parsed.shift) {
    parts.push("Shift");
  }
  if (parsed.meta) {
    parts.push("Win");
  }
  parts.push(displayKey(parsed.key));
  return parts.join("+");
}
