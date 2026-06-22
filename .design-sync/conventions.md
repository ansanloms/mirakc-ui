# mirakc-ui — design conventions

A Japanese-language web UI for [mirakc](https://github.com/mirakc/mirakc): an
electronic program guide, recording manager, live TV viewer, and live-comment
feed. Components are pure presentation — they take data through props and render
it; they never fetch. Compose them; pass real data in.

## Theming (light / dark)

There is one set of **semantic** color tokens; each resolves to the right value
for the active theme via CSS `light-dark()`. Theme is selected by setting CSS
`color-scheme: light` or `dark` on a container — never hard-code a hex or pick a
`--color-light-*` / `--color-dark-*` token directly. Use the unprefixed semantic
token and it follows the theme:

- Surfaces: `--color-bg`, `--color-surface`, `--color-surface-2`, `--color-card-bg`
  (+ `-glass` variants for translucent overlays).
- Text: `--color-text`, `--color-text-dim`, `--color-text-faint`.
- Lines/borders: `--color-border`, `--color-border-strong`, `--color-gridline`.
- Accent (primary action): `--color-accent`, `--color-accent-text`;
  buttons use `--color-button-bg` / `--color-button-bg-hover` / `--color-button-text`.
- State: `--color-now` (on-air / current), `--color-ok` (success/recording),
  `--color-warn` (error/failure), `--color-scrim` (modal backdrop),
  `--color-recording-border`.

### Genre colors

16 program genres each have a `fill` / `ink` / `strong` triad, e.g.
`--color-genre-drama-fill|ink|strong`. Genres: news, sports, wideshow, drama,
music, variety, movie, anime, documentary, performance, education, welfare,
other (+ the ARIB set). Render genres with `GenreTag` rather than re-deriving
colors.

## Sizing & spacing

- **`1rem` = `10px`** (the root sets `font-size: 62.5%`). So `1.6rem` = 16px.
- Spacing and dimensions snap to a **0.4rem grid** (0.4 / 0.8 / 1.2 / 1.6 / …).
  Borders/hairlines may stay at `1px`.
- Type scale tokens: `--font-size-xs|sm|md|lg|xl|2xl` and semantic
  `--font-size-body|header|title|caption|button` (don't invent ad-hoc sizes).

## Typography & icons

- Body/UI font: **IBM Plex Sans JP** (`--font-family-default`) — covers Japanese.
- Monospace (keys, codes): **IBM Plex Mono** (`--font-family-mono`); see `Kbd`.
- Icons: **Material Symbols Outlined**, via the `Icon` atom (pass the symbol
  name). `IconButton` wraps an icon as a button. Don't paste raw SVG or emoji for
  iconography.

## Responsive

Mobile vs PC is decided once at a **640px** breakpoint, exposed as the
`--is-mobile` / `--is-pc` custom-property flags; components branch with container
style queries (`@container style(--is-mobile: true)`). Build layouts to reflow at
that boundary rather than adding new breakpoints.

## Composition

- Components follow **Atomic Design**: atoms → molecules → organisms → templates.
  Prefer the highest-level component that fits (e.g. a settings page is a
  `templates/*`, a program card is `molecules/Program`).
- UI copy is **Japanese**. Match the existing tone (plain, concise).
- Date/time values are epoch milliseconds in, formatted with `Temporal` inside
  the components — pass timestamps, not pre-formatted strings.
- Overlays (`Modal`, `Toast`) render via fixed positioning / portals; place them
  at the top level of a screen, not nested inside scrolling content.
