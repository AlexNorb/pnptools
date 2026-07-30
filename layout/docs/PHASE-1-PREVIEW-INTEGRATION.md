# Phase 1 — Preview Integration

> **Status:** `NOT STARTED`
> **Prerequisite:** None
> **Goal:** Remove the iframe-based preview system and integrate all image management directly into the main UI.

## Context

Currently, the image preview/reordering functionality lives inside an iframe (`preview.html` + `preview.js` + `preview.css`). It's hidden behind a checkbox labeled "Use Advanced Image Preview". This creates several problems:

1. Most users never discover the feature
2. Communication between parent and iframe uses `postMessage` — fragile and complex
3. The iframe stores state in the DOM — unreliable
4. Two separate codebases (parent + iframe) handle image state

**After this phase:** Preview is a standard part of the UI. No iframe. Clean data model. Show/hide toggle (accordion-style) since the panel takes space.

## Design Decisions (confirmed by project owner)

- ✅ **No thumbnails in dropzone** — users upload hundreds of images, dropzone stays clean
- ✅ **Preview is standard** — not "advanced", always available
- ✅ **Show/hide toggle** — accordion-style expandable section, hidden by default
- ✅ **Clear buttons only visible when panel is open**
- ✅ **Data model in JS** — not DOM-based state

## Requirements

### Preview Panel

1. **Location:** Below the dropzone area, above the mode indicators
2. **Toggle:** Accordion-style expandable section. Collapsed by default. Shows after first file upload.
3. **Layout:** Horizontal scrollable row of card pairs (front + back side by side)
4. **Each card pair shows:**
   - Pair number (drag handle)
   - Front thumbnail image
   - Back thumbnail image (or placeholder if none)
   - Copy count input (number, default 1)
   - Delete button (×)
5. **Controls (visible only when panel is open):**
   - Clear Fronts button
   - Clear Backs button
   - Clear All button
6. **Drag-and-drop:** Reorder card pairs by dragging the pair number handle (use Sortable.js)
7. **Auto-expand:** Panel expands automatically when files are first uploaded

### Data Model

Create a JavaScript data model that is the single source of truth for image state:

```javascript
// Conceptual model — implement as you see fit
PreviewPanel = {
  state: {
    fronts: [],      // Array of { dataUrl: string, name: string }
    backs: [],       // Array of { dataUrl: string, name: string }
    copies: [],      // Array of numbers (one per front)
  },

  // Public API
  addFronts(files)           // Add front images
  addBacks(files)            // Add back images
  removePair(index)          // Remove a front/back pair
  setCopies(index, count)    // Set copy count for a pair
  reorder(oldIndex, newIndex)// Move a pair
  clearFronts()              // Clear all fronts
  clearBacks()               // Clear all backs
  clearAll()                 // Clear everything
  getImageData()             // Returns compiled { frontImages: [], backImages: [] }
                             // with copies expanded
  getMode()                  // Returns "no_backs" | "same_back" | "unique_backs" | "error"
}
```

### Integration Points

1. **Dropzone `onchange`:**
   - Call `PreviewPanel.addFronts(files)` or `PreviewPanel.addBacks(files)`
   - Update file count display
   - Auto-expand panel if collapsed

2. **Mode indicator:**
   - Read mode from `PreviewPanel.getMode()` instead of directly from file input counts
   - Must still work: no backs (green mode1), same back (green mode2), unique backs (green mode3), mismatch (red all)

3. **PDF generation (`layout-master.js`):**
   - Always read from `PreviewPanel.getImageData()` — no more dual path (previewer vs direct file read)
   - Remove all `postMessage`-based iframe communication
   - Remove `sendDataToPreviewer()`, `appendDataToPreviewer()`, `getPreviewData()`

4. **Settings save/restore:**
   - Image data is NOT saved to localStorage (too large)
   - Only settings are saved (existing behavior is fine)

## Implementation Steps

### Step 1.1 — Create data model
**File:** `preview-panel.js` (NEW)

Create the state management object with the API described above. No DOM interaction in this step — pure data logic. Include:
- State management (add, remove, reorder, clear)
- Copy expansion logic (getImageData)
- Mode detection (getMode)
- Event system (onChange callback) so UI can re-render when state changes

### Step 1.2 — Build HTML/CSS for preview section
**Files:** `index.html`, `style.css`

Add the preview section HTML:
- Accordion container with toggle button
- Scrollable row container for card pairs
- Control buttons (Clear Fronts / Clear Backs / Clear All)

Style it to match the current visual design (will be overhauled in Phase 3).

Replace the iframe container and `usePreviewer` checkbox:
```html
<!-- REMOVE these -->
<input type="checkbox" id="usePreviewer" />
<div id="previewerContainer">
  <iframe id="previewerFrame" src="preview.html" ...></iframe>
</div>

<!-- ADD this instead -->
<div id="previewPanel" class="preview-panel collapsed">
  <button id="previewToggle" class="preview-toggle">
    Image Preview & Ordering ▼
  </button>
  <div class="preview-content">
    <div class="preview-controls">
      <button id="clearFronts">Clear Fronts</button>
      <button id="clearBacks">Clear Backs</button>
      <button id="clearAll">Clear All</button>
    </div>
    <div id="previewPairs" class="preview-pairs-container">
      <!-- Dynamically rendered card pairs -->
    </div>
  </div>
</div>
```

### Step 1.3 — Implement rendering
**File:** `preview-panel.js`

Add DOM rendering that listens to state changes and updates the preview pairs container. Each pair should render:
```html
<div class="preview-pair" data-index="0">
  <span class="pair-handle">1</span>
  <div class="pair-images">
    <img class="pair-front" src="data:..." alt="Front 1" />
    <img class="pair-back" src="data:..." alt="Back 1" />
  </div>
  <input type="number" class="pair-copies" value="1" min="1" max="99" />
  <button class="pair-delete">×</button>
</div>
```

### Step 1.4 — Connect dropzone to data model
**File:** `layout-ui.js`

Update the `frontImages.change` and `backImages.change` event handlers:
- Call `PreviewPanel.addFronts(event.target.files)` / `addBacks()`
- Update file count display
- Auto-expand preview panel
- Update mode indicator from `PreviewPanel.getMode()`

### Step 1.5 — Implement drag-and-drop
**File:** `preview-panel.js`

Initialize Sortable.js on the pairs container:
- Handle: `.pair-handle`
- On sort end: call `PreviewPanel.reorder(oldIndex, newIndex)`
- Move Sortable.js `<script>` tag from `preview.html` to `index.html`

### Step 1.6 — Implement copies and delete
**File:** `preview-panel.js`

Wire up event listeners:
- Copy count `onchange` → `PreviewPanel.setCopies(index, value)`
- Delete button `onclick` → `PreviewPanel.removePair(index)`
- Clear buttons → `PreviewPanel.clearFronts()` / `clearBacks()` / `clearAll()`

### Step 1.7 — Connect PDF generation
**File:** `layout-master.js`

Rewrite `generatePDF()`:
- Remove the `usePreviewer` branch — always use `PreviewPanel.getImageData()`
- Remove `sendDataToPreviewer()`, `appendDataToPreviewer()`, `getPreviewData()`
- Remove `pdfResponsePromise` and the `postMessage` listener for `preview-data-response`
- Remove `readFiles()` (no longer needed — preview panel handles file reading)

### Step 1.8 — Remove iframe system
**Files to delete:** `preview.html`, `preview.css`, `preview.js`

Only do this AFTER step 1.9 confirms all automated tests pass and manual verification is done.

### Step 1.9 — Run all tests

Run both automated and manual tests (see Testing Strategy below). All automated tests must pass. Manual checklist should be verified for at least the critical flows.

---

## Testing Strategy

Testing is split into two layers: **automated tests** for pure logic (fast, run after every change) and a **manual checklist** for full browser flows (run at milestones).

### Automated Tests — `tests/test.html`

**Created during:** Step 1.1 (built alongside the data model)

A standalone HTML file that imports `preview-panel.js` and runs assertions directly in the browser. No npm, no dependencies — just open the file. Results are shown as green (pass) / red (fail) on the page.

**How to run:** Open `layout/tests/test.html` in any browser. All tests should show green.

**What is tested:**

#### State Management
| Test | Description |
|------|-------------|
| `addFronts` adds images to state | Add 3 fronts → `state.fronts.length === 3` |
| `addBacks` adds images to state | Add 2 backs → `state.backs.length === 2` |
| `removePair` removes correct pair | Remove index 1 of 3 → correct items remain |
| `clearFronts` only clears fronts | Clear fronts → fronts empty, backs untouched |
| `clearBacks` only clears backs | Clear backs → backs empty, fronts untouched |
| `clearAll` clears everything | Clear all → all arrays empty |
| `setCopies` updates copy count | Set index 0 to 5 → `state.copies[0] === 5` |
| `reorder` moves pair correctly | Reorder [A,B,C] move 0→2 → [B,C,A] |
| `reorder` moves copies with fronts | Copies array stays in sync with fronts |

#### Mode Detection (`getMode`)
| Test | Input | Expected |
|------|-------|----------|
| No images | 0 fronts, 0 backs | `"empty"` |
| No backs | 3 fronts, 0 backs | `"no_backs"` |
| Same back | 3 fronts, 1 back | `"same_back"` |
| Unique backs | 3 fronts, 3 backs | `"unique_backs"` |
| Mismatch | 3 fronts, 2 backs | `"error"` |

#### Data Compilation (`getImageData`)
| Test | Description |
|------|-------------|
| Basic output | 2 fronts, 2 backs, copies [1,1] → 2 front URLs, 2 back URLs |
| Copy expansion | 2 fronts, 2 backs, copies [3,1] → 4 front URLs, 4 back URLs |
| Same back expansion | 3 fronts, 1 back, copies [1,1,1] → 3 fronts, 1 back (unchanged) |
| No backs output | 3 fronts, 0 backs, copies [1,1,1] → 3 fronts, 0 backs |
| Order preserved | Reorder then getImageData → output reflects new order |

#### Edge Cases
| Test | Description |
|------|-------------|
| Empty state | `getImageData()` on fresh state → empty arrays |
| Delete last pair | Delete only pair → state is empty, mode is "empty" |
| Copies min value | `setCopies(0, 0)` → clamps to 1 |
| Large copy count | `setCopies(0, 99)` → works correctly |

### Manual Verification Checklist

**When to run:** After completing step 1.7 (PDF generation connected) and again after step 1.8 (iframe removed).

Use any test images (PNG or JPEG). Minimum 3 front images and 3 back images.

#### Critical Flows (must all pass)

- [ ] **Upload fronts only** → mode indicator shows "No backs" (green) → Generate PDF → PDF downloads with fronts in grid
- [ ] **Upload fronts + 1 back** → mode indicator shows "Same backs" (green) → Generate PDF → PDF has same back on all back pages
- [ ] **Upload 3 fronts + 3 backs** → mode indicator shows "Unique backs" (green) → Generate PDF → Each card has correct back
- [ ] **Upload mismatched counts** (e.g. 3 fronts + 2 backs) → mode indicator shows error (red on all)
- [ ] **Reorder pairs → Generate PDF** → PDF reflects new order (not original upload order)
- [ ] **Set copies to 3 on one card → Generate PDF** → That card appears 3 times in PDF
- [ ] **Delete a pair → Generate PDF** → Deleted card is not in PDF
- [ ] **Switch to Foldable mode → Generate PDF** → Foldable layout works with preview panel data

#### UI Interactions

- [ ] **Preview panel toggle** → accordion opens/closes smoothly
- [ ] **Auto-expand** → panel expands when first files are uploaded
- [ ] **Clear buttons** → only visible when panel is open
- [ ] **Drag-and-drop** → pairs reorder visually and in data model
- [ ] **File count text** → updates correctly after upload/delete/clear
- [ ] **Presets** → still load and apply correctly
- [ ] **Last-used settings** → still saved/restored from localStorage

## Files Changed Summary

| File | Action | Description |
|------|--------|-------------|
| `preview-panel.js` | NEW | Data model + rendering + drag-and-drop |
| `tests/test.html` | NEW | Automated unit tests for preview panel logic |
| `index.html` | MODIFY | Remove iframe, add preview section, add Sortable.js script |
| `style.css` | MODIFY | Add preview panel styles |
| `layout-master.js` | MODIFY | Simplify to always use PreviewPanel API |
| `layout-ui.js` | MODIFY | Connect dropzone events to PreviewPanel |
| `preview.html` | DELETE | Replaced by integrated panel |
| `preview.css` | DELETE | Styles moved to style.css |
| `preview.js` | DELETE | Logic moved to preview-panel.js |
