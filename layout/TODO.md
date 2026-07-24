# Layout Tool — TODO

> For detailed specs, see [`docs/ROADMAP.md`](docs/ROADMAP.md)

## Phase 1 — Preview Integration `COMPLETED`

> Spec: [`docs/PHASE-1-PREVIEW-INTEGRATION.md`](docs/PHASE-1-PREVIEW-INTEGRATION.md)

- [x] 1.1 Create data model (`preview-panel.js`) with state management
- [x] 1.1b Create automated tests (`tests/test.html`) for the data model
- [x] 1.2 Build HTML/CSS for preview section with accordion show/hide
- [x] 1.3 Implement rendering of image pairs from data model
- [x] 1.4 Connect dropzone events → data model → rendering
- [x] 1.5 Implement drag-and-drop reordering (Sortable.js)
- [x] 1.6 Implement copy counter and delete per pair
- [x] 1.7 Connect PDF generation to new data model (remove dual path)
- [x] 1.8 Remove iframe system (preview.html/css/js)
- [x] 1.9 Test all flows (no backs, same back, unique backs × grid + foldable)

## Phase 2 — Code Refactoring `COMPLETED`

> Spec: [`docs/PHASE-2-REFACTORING.md`](docs/PHASE-2-REFACTORING.md)

- [x] 2.1 Extract shared worker utilities to `shared-worker-utils.js`
- [x] 2.2 Standardize unit conversion (mm→pt in one place only)
- [x] 2.3 Fix HTML issues (`<p2>` → `<span>`, inline styles → CSS, viewport meta)
- [x] 2.4 Refactor foldable worker (`drawMarkup` params → options object)
- [x] 2.5 Consolidate settings gathering (shared helper for getGridSettings/getFoldableSettings)
- [x] 2.6 Fix preset data (typo, hide template entry)
- [x] 2.7 Scope global CSS selectors (button, checkbox)

## Phase 3 — UI/UX Overhaul `NOT STARTED`

> Spec: [`docs/PHASE-3-UI-OVERHAUL.md`](docs/PHASE-3-UI-OVERHAUL.md)
> Branding: [`docs/BRANDING.md`](docs/BRANDING.md)

- [ ] 3.1 Create toast notification system (replace all `alert()`)
- [ ] 3.2 Apply brand design system (CSS custom properties, typography, colors)
- [ ] 3.3 Add branded header with logo
- [ ] 3.4 Make responsive (mobile, tablet, desktop breakpoints)
- [ ] 3.5 Add accessibility (ARIA labels, keyboard nav, focus styles)
- [ ] 3.6 Dark mode (bonus/optional)

## Completed

- [x] Add a visual progress bar during PDF generation

## Ideas & Future Requests

- Add more presets for specific print services (manual — owner adds via presets.json)
- Export/import user presets as JSON file
