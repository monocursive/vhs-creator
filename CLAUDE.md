# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Astro dev server at `localhost:4321`.
- `npm run build` — production build to `./dist/`.
- `npm run preview` — serve the production build locally.
- `npm run deploy` — `astro build` + `wrangler pages deploy ./dist --project-name=vhs-studio --branch=main` (Cloudflare Pages).
- `npx astro check` — TypeScript / Astro type check (uses `@astrojs/check`).
- `npx @biomejs/biome check --write .` — lint + format. `biome.json` excludes `design-prototype/`. Indent is tabs; JS/TS strings are double-quoted.

Node `>=22.12.0` is required. There is no test runner configured.

## Architecture

VHS Studio is a single-page Astro 6 app: a French-language print-jaquette editor for VHS covers. There is no SSR data layer — the entire editor is a client-side TypeScript class rendered to a `<canvas>`.

**Entry point.** `src/pages/index.astro` composes four UI shell components (`Topbar`, `ToolsRail`, `Stage`, `InspectorRail`, `TourOverlay`), then a `<script>` block instantiates `new Editor().init()`. All interactivity lives in that one Editor instance.

**Editor module (`src/lib/editor/`).** Deliberately split into a small set of files around a monolithic `Editor.ts` (~2000 lines) that owns project state, history, rendering, pointer/keyboard handling, and DOM wiring:
- `Editor.ts` — single class. State: `project: ProjectState`, `activeTheme/Layout/Zone`, `selectedId`, `historyPast/Future`, `dragState`. Methods are grouped by phase: factories (`rect`, `text`, `image`, `buildInitialProject`), history (`pushHistory`, `undo/redoProject`), selection/inspector, layer ops, layout regeneration (`rebuildFront` — recreates "generated" front-zone layers), pointer/keyboard handlers, render scheduling (`scheduleRender` → `requestAnimationFrame`), tour, file I/O (`saveProjectFile`, `loadProjectFile`), and DOM wiring (`wireAssets`, `wireEvents`, `wireTooltips`, `wireMobileChrome`).
- `constants.ts` — cover geometry in millimetres (`COVER` 258×194, `ZONES` for back/spine/front, `A4` 297×210), `PRINT_SCALE = 300/25.4` (300 dpi), `EXPORT_W/H`, asset list (paths in `/public/...`), four `THEMES` (neon/rental/scifi/horror), French help strings (`HELP_TEXT`, `THEME_HELP`, `LAYOUT_HELP`, `ZONE_HELP`), and `GENERATED_FRONT_LAYER_NAMES` — the set of layer names `rebuildFront` is allowed to delete and recreate.
- `dom.ts` — `collectRefs()` returns a strongly-typed bag of every required DOM element and throws if any are missing. The component templates' `id`s are the contract; renaming an `id` requires updating both.
- `geometry.ts` — pure math: `clamp`, deg/rad, `localToWorld`/`worldToLocal`, rotation, handle layout for resize/rotate.
- `image-cache.ts` — small `HTMLImageElement` cache with in-flight de-dup; calls back into the Editor to schedule a re-render on load.
- `render.ts` — pure canvas drawing (`drawBackdrop`, `drawObject`, `renderToCanvas`, `drawPdfTrimMarks`); takes `ProjectState` + `ImageCache` and writes pixels. No DOM, no state.
- `sanitize.ts` — `normalizeProjectObjects` validates and clamps loaded JSON before it enters state. All values from disk pass through this — keep new fields in sync with `cleanString/Number/Color/Stroke/ImageSource`.
- `types.ts` — `ProjectObject = RectObject | TextObject | ImageObject` (discriminated union on `type`). `Snapshot` is `ProjectState` + active theme/layout/guides for history. Three zones (`front`/`back`/`spine`), four themes, four layouts.

**Coordinate system.** Everything in `ProjectObject` is millimetres in the cover's coordinate space (0..COVER.w, 0..COVER.h). The canvas is rendered at `currentScale` px/mm; PDF/PNG export uses `PRINT_SCALE` for 300 dpi output. The three zones are sub-rectangles of that same space (back: 0–114, spine: 114–144, front: 144–258).

**Rendering loop.** State mutation calls `scheduleRender()` (rAF-coalesced) → `render()` → `renderToCanvas` from `render.ts`. `pushHistory()` snapshots state before mutating, capped at `HISTORY_LIMIT` (50). PNG export uses an offscreen canvas at print scale; PDF export uses jsPDF + `drawPdfTrimMarks`.

**Layout regeneration.** Switching a layout (`classic/bigtype/poster/split`) only replaces front-zone objects whose `name` is in `GENERATED_FRONT_LAYER_NAMES` (or have `layoutGenerated: true`). User-added front objects are preserved. When adding a new generated layer kind, add its name to that set so layout switches clean it up.

**Components (`src/components/*.astro`).** Pure markup — no logic. They define the DOM ids that `dom.ts` looks up. Styles live entirely in `src/styles/editor.css` (~2800 lines, imported once from `index.astro`).

**Excluded from build/lint.** `design-prototype/` is a standalone JSX prototype kept for reference; it is excluded from `tsconfig.json`, `biome.json`, and is not part of the build. `dist/` and `.astro/` are gitignored.

## UI language

The user-facing UI is French. Strings in `constants.ts` (`HELP_TEXT`, `THEME_HELP`, `LAYOUT_HELP`, `ZONE_HELP`, tour steps in `Editor.ts`), component templates, and inspector labels are all French. Match the existing tone when adding strings.
