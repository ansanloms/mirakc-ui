# design-sync NOTES (mirakc-ui)

Repo-specific learnings for syncing this design system to claude.ai/design.
mirakc-ui is a Deno + Vite + React SPA (NOT a published component library), so
the converter runs off a synthesized barrel and a few targeted escape hatches.

## Build setup (how the converter is wired here)

- **Barrel entry**: `.design-sync/entry.tsx` re-exports every storied component by
  its default-export function name. `.design-sync/package.json` (`types`/`module`
  → `./entry.tsx`) lets ts-morph extract props straight from the `.tsx` sources —
  this repo ships no `.d.ts`, and that's fine.
- **Reference storybook** is prebuilt to `.design-sync/sb-reference/` (gitignored)
  with `deno run -A npm:storybook build -c .storybook -o <abs>/.design-sync/sb-reference`.
  `cfg.storybookStatic` points the converter at it so it never rebuilds storybook.

## [GENERAL] esbuild can't resolve Deno/Vite-only imports → cfg.tsconfig shims

The converter bundles with esbuild, which lacks this repo's Vite plugins (deno
resolver, svgr, esm.sh). Two imports don't resolve and are redirected via
`cfg.tsconfig` (`.design-sync/tsconfig.json`) `compilerOptions.paths`:
- `mpegts.js` (esm.sh, absent from node_modules; Player loads it lazily at play
  time) → `.design-sync/shims/mpegts.ts` stub.
- `../../assets/images/dish.svg?react` (vite-plugin-svgr; DishIcon only) →
  `.design-sync/shims/dish-svg.tsx`, a React component reproducing the real SVG.
`@/` alias is unused in components, so no alias mapping is needed.

## [GENERAL] Token vars + resets must ship via cfg.cssEntry

Component CSS modules reference `--color-*` / `--font-size-*` etc. defined in the
global `client/assets/styles/{palette,general,layout}.css`, which the component
entry never imports → `[TOKENS_MISSING]` and broken colors/sizing. Fix:
`.design-sync/ds-global.css` concatenates those three files (regenerate from
source if they change) and `cfg.cssEntry` appends it into `_ds_bundle.css` (in
the styles.css closure). NOTE: `general.css`'s `html { font: 62.5% }` sets the
rem base to 10px — every component sizes against that, so this reset is required,
not optional. The two Google-Fonts `@import url(...)` lines are stripped from
ds-global.css (an appended @import is position-invalid) and handled below.

## [GENERAL] Webfonts (Material Symbols + IBM Plex) via remote @import

Without the icon font, `Icon`/`IconButton` render Material Symbols ligature TEXT
("find_tv") instead of glyphs. The fonts load from Google Fonts. The converter
only surfaces remote stylesheets it scrapes as `<link>` from
`sb-reference/iframe.html`, so `.storybook/preview-head.html` (committed) declares
both font `<link>`s — every storybook build then carries them and
`scrapeRemoteImports` hoists them to the top of the synced `styles.css`. (For an
already-built reference, the same two `<link>`s are injected into its iframe.html
to avoid a slow storybook rebuild.) Trade-off: the design app fetches fonts from
the Google CDN at render time (egress confirmed working); this matches how the
real app loads them. If a future render env blocks CDN egress, self-host instead.

## Card presentation overrides (cfg.overrides)

Fixed/portal or too-wide stories overflow the product grid card (validate
`[GRID_OVERFLOW]`). Presentation-only, grades carry:
- `cardMode: "single"` (+ primaryStory) — Modal, Toast, RuleFormModal,
  MappingFormModal, Program (these have fixed/portal stories).
- `cardMode: "column"` — Icon, RuleCard, PageHeader, Watch, ChannelTypeTabList,
  KeywordRules, ChannelRow, LiveCommentTab, TabPanel (stories wider than a cell).

## Grading caveat

- Grade small-content components (badges, marks, icons) from the full-res `raw/`
  PNGs, not the shrunk contact sheet — the thumbnail blurs small glyphs/digits
  (e.g. ChannelBadge's `5` read as `3` on the sheet but was correct in raw).

## Open items

- `[RENDER_THIN] Loading` — RESOLVED at grading: the storybook reference shows the
  same single spinner, so it's a genuine match (low visual variety, not a defect).
  No owned preview needed.
- entry.tsx exports 48 symbols but storybook covers 39 → only 39 are carded.
  The 9 storyless exports ship in the bundle but get no preview (expected).

## Re-sync risks (what the next sync must watch)

- **Owned `.design-sync/previews/Watch.tsx`** is the only owned preview. It exists
  because the real Player default-imports mpegts.js (here the build-time stub whose
  `isSupported()` → false) while the storybook reference runs genuine mpegts, which
  tries the story's dummy `example.invalid` stream, fails, and shows the
  "受信エラーが発生しました" (NetworkError) overlay. The owned preview injects
  `loadMpegts`/`loadAribb24` into the Player Live/WithComments story args to
  reproduce that ERROR end-state. If the Player's stub contract, the story's stream
  URL, or the error-overlay copy changes upstream, this preview can drift — re-grade
  Watch and update the owned preview if so. Watch's template stories
  (Default/Info/Live) and Placeholder pass no streamUrl, never touch mpegts.
- Watch's compare prints `[ASSETS_BLOCKED] example.invalid` — this is STRUCTURAL,
  not a sandbox egress failure. `example.invalid` is a reserved non-resolvable host
  the story uses deliberately to force a stream failure; both panels fail it
  identically, so it does not falsify the grade. Do not chase it.
- **CDN-fetched fonts**: Material Symbols + IBM Plex load from Google Fonts at
  render time (remote @import in styles.css via `.storybook/preview-head.html`).
  Verified with egress available. If a future render env blocks the Google CDN,
  icons/fonts degrade to system fallback — self-host via cfg.extraFonts then.
- **ds-global.css is a snapshot** of `client/assets/styles/{palette,general,layout}.css`.
  If those source files change (new tokens, changed rem base), regenerate
  `.design-sync/ds-global.css` or tokens go missing again.
- **Story caps**: RecordingStatusBadge has a 7th story beyond the default 6-story
  capture cap (verified-by-upload, not individually graded). Raise `--max-stories`
  if that tail story needs explicit verification.
