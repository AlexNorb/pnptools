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

## Phase 3 — UI/UX Overhaul `COMPLETED`

> Spec: [`docs/PHASE-3-UI-OVERHAUL.md`](docs/PHASE-3-UI-OVERHAUL.md)
> Branding: [`docs/BRANDING.md`](docs/BRANDING.md)

- [x] 3.1 Create toast notification system (replace all `alert()`)
- [x] 3.2 Apply brand design system (CSS custom properties, typography, colors)
- [x] 3.3 Add branded header with logo
- [x] 3.4 Make responsive (mobile, tablet, desktop breakpoints)
- [x] 3.5 Add accessibility (ARIA labels, keyboard nav, focus styles)
- [x] 3.6 Dark mode (bonus/optional)

## Phase 4 — User Feedback & Functional Polish `COMPLETED`

- [x] 4.1 Update default crosshairs (Size: 3mm, Line width: 0.1mm)
- [x] 4.2 Custom export filename input & page size prefix checkbox
- [x] 4.3 Persist shared settings (Page size, Card size, Dimensions) between Grid and Foldable modes
- [x] 4.4 Separate Page Size (A4/Letter/Custom) and Orientation toggle (Portrait/Landscape), updating presets.json and isolating foldable mode
- [x] 4.5 Auto-calculate Grid layout capacity (rows & cols) with manual override toggle
- [x] 4.6 Keyboard accessibility in image preview panel (`Tab` navigation between copies inputs)

## Phase 5 — UI Layout & Compactness Refactor `COMPLETED`

- [x] 5.1 Refactor Layout Mode section into compact horizontal informational badges
- [x] 5.2 Replace radio buttons with a modern segmented control toggle for Grid vs Foldable
- [x] 5.3 Re-architect layout structure for optimal space utilization (combining/reducing height of upload section & settings)

## Phase 6 — Dynamic Unit Switcher `IN PROGRESS`

- [ ] 6.1 Add global unit toggle `[ mm | in ]` next to Settings title
- [ ] 6.2 Implement state management for currentUnit (mm default) in layout-ui.js
- [ ] 6.3 Add conversion logic for input fields on toggle switch (mm ↔ in) and step updates
- [ ] 6.4 Intercept `_gatherFormValues` to ensure workers only ever receive values in `mm`
- [ ] 6.5 Update preset population to handle active unit conversion

## Ideas & Future Requests

- Add more presets for specific print services (manual — owner adds via presets.json)
- Export/import user presets as JSON file
- Future Evaluation: Consider incorporating conceptual features from Martin's Formatter (saved for reference in [`docs/reference/martins-formatter/`](docs/reference/martins-formatter/)):
  - **Back Nudge (Printer Drift Compensation)**: $\pm X / \pm Y$ back page offset calibration for consumer duplex printers.
  - **Live Sheet Preview Strategy**: Evaluate a 1–2 page PDF preview (rendered via PDF.js from Web Worker output capped at Page 1-2) to reuse 100% of existing PDF drawing logic efficiently without CPU bloat, alongside our thumbnail reordering panel.
