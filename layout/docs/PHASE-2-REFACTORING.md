# Phase 2 — Code Refactoring

> **Status:** `NOT STARTED`
> **Prerequisite:** Phase 1 complete
> **Goal:** Eliminate code duplication, fix code smells, standardize patterns. No visible changes to the user.

## Context

After Phase 1, the codebase will have a clean preview system, but the underlying code still has significant technical debt:

- Two workers (`layout-generator-worker.js` and `foldable-layout-worker.js`) share ~40% duplicated code
- Unit conversion (mm → PDF points) happens in two places
- Non-standard HTML elements (`<p2>`)
- Overly complex functions (15-parameter `drawMarkup`)
- Inline styles that should be in CSS
- Minor bugs (typo in preset name)

**After this phase:** Clean, maintainable code ready for the UI overhaul in Phase 3.

## Tasks

### 2.1 — Extract shared worker utilities

**Create:** `shared-worker-utils.js`

Extract the following from both workers into a shared file:

| Function | Currently in | Description |
|----------|-------------|-------------|
| `getImageType(buffer)` | Both workers + layout-master.js | Detect PNG/JPEG from magic bytes |
| `getOrEmbedImage()` / `lookupCard()` | Both workers | Image deduplication + embedding |
| `reportProgress()` | Both workers | Send progress update to main thread |
| `reportSaving()` / `reportDone()` | Both workers | Send status messages |
| Clipping path logic | Both workers | Corner radius clipping with `moveTo`/`lineTo`/`quadraticCurveTo` |
| Border drawing | Both workers | Rectangle border with optional corner radius |
| `mmToPt` constant | Both workers + layout-ui.js | `2.83464567` |

Both workers should then use:
```javascript
importScripts('shared-worker-utils.js');
```

### 2.2 — Standardize unit conversion

**Decision to make:** All conversion should happen in ONE place. Recommended approach:

- **UI layer (`layout-ui.js`):** Gathers raw values in mm from form
- **Workers:** Receive values in mm and convert to pt internally
- This means `getGridSettings()` should NOT convert to pt — it should pass mm values
- Workers should handle all conversion using the shared `mmToPt` constant

This is a breaking internal change — update both workers to expect mm input.

**Alternative (less refactoring):** Keep conversion in UI layer but move ALL conversion there (currently `pageWidth`/`pageHeight` are left in mm while others are converted). Choose one approach consistently.

### 2.3 — Fix HTML issues

**File:** `index.html`

- Replace `<p2>` elements (lines 37, 51) with `<span class="file-count">`
- Move inline styles to CSS:
  - Line 62: `style="margin-left: 1rem"` on checkbox
  - Lines 70-77: iframe styles (if iframe still exists; should be gone after Phase 1)
  - Line 82: `style="justify-content: space-around"` on mode group
  - Lines 372-374: progress container inline styles
- Add `<meta name="viewport" content="width=device-width, initial-scale=1.0">`

**File:** `style.css`

- Update `p2` selector to `.file-count`
- Add the classes for moved inline styles

### 2.4 — Refactor foldable worker

**File:** `foldable-layout-worker.js`

1. **`drawMarkup` function:** Convert 15 positional parameters to a single options object:
   ```javascript
   // BEFORE (15 params!)
   drawMarkup(page, orientation, rotate, x, y, w, h, margin, ...)

   // AFTER
   drawMarkup(page, { orientation, rotate, x, y, width, height, margin, ... })
   ```

2. **Extract coordinate calculation helpers** from `generatedPdf()`:
   - The function has deeply nested orientation × rotation × front/back branches
   - Extract into `calculateCardPosition(orientation, rotate, isFront, ...)` helper

3. **Remove empty else block** (line ~1005-1007)

4. **Deduplicate `mmFactor` constant** — move to shared utils (task 2.1)

### 2.5 — Consolidate settings gathering

**File:** `layout-ui.js`

`getGridSettings()` (line 607) and `getFoldableSettings()` (line 658) share a pattern:
1. Define array of element IDs
2. Loop through, read values based on input type
3. Parse numbers

Extract a shared helper:
```javascript
_gatherFormValues(elementIds) {
  const settings = {};
  elementIds.forEach(id => {
    const element = this.elements[id] || document.getElementById(id);
    if (!element) return;
    if (element.type === 'checkbox') {
      settings[id] = element.checked;
    } else if (element.type === 'number' || element.tagName === 'SELECT') {
      settings[id] = parseFloat(element.value.replace(',', '.'));
    } else {
      settings[id] = element.value;
    }
  });
  return settings;
}
```

### 2.6 — Fix preset data

**File:** `presets.json`

1. Fix typo: `"Europan Standard"` → `"European Standard"` (preset4)
2. Consider hiding the `template` entry from the dropdown (add a `"hidden": true` flag and filter in `loadPresets()`)

### 2.7 — Scope global CSS

**File:** `style.css`

The following selectors are too broad:
- `button { ... }` → scope to `.container button` or add a `.btn` class
- `input[type="checkbox"] { transform: scale(2); }` → scope to `.settings input[type="checkbox"]`

## Verification

- All existing PDF generation flows produce identical output before and after refactoring
- No visual changes to the user interface
- Both layout modes work (grid + foldable)
- All three back modes work (no backs, same back, unique backs)
- Presets load and apply correctly
- User presets save/load/delete correctly
- Last-used settings restore correctly

## Files Changed Summary

| File | Action | Description |
|------|--------|-------------|
| `shared-worker-utils.js` | NEW | Shared utilities for both workers |
| `layout-generator-worker.js` | MODIFY | Import shared utils, remove duplicates |
| `foldable-layout-worker.js` | MODIFY | Import shared utils, refactor drawMarkup, remove duplicates |
| `layout-ui.js` | MODIFY | Consolidate settings gathering, standardize units |
| `index.html` | MODIFY | Fix `<p2>`, move inline styles, add viewport meta |
| `style.css` | MODIFY | Update selectors, add scoping, add moved inline styles |
| `presets.json` | MODIFY | Fix typo, optionally hide template |
