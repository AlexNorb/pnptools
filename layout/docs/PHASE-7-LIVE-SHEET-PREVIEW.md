# Phase 7 — Live Sheet Preview (PDF.js)

> **Status:** `NOT STARTED`
> **Prerequisite:** Phases 1–6 `COMPLETED`, Next Session tasks recommended but not required
> **Goal:** Add a live, debounced preview of the generated sheet layout using PDF.js. As users adjust settings, a throttled preview of the first 1–2 pages renders in-place, giving immediate visual feedback without needing to generate and download the full PDF.

## Context & Objectives

Currently, users must click **Generate PDF** and download the entire file to see how their cards will be laid out on paper. This makes the settings-tweaking workflow slow and frustrating — especially for first-time users figuring out page size, grid capacity, or bleed settings.

This phase adds an always-visible (when images are loaded) live preview canvas that renders the first 1–2 pages of the PDF output using **PDF.js** to parse and display the output of the existing jsPDF/pdf-lib workers.

**After this phase:**
- A live preview panel shows a rendered view of page 1 (and optionally page 2) of the layout
- Preview updates automatically when settings or images change, with debouncing for performance
- Preview generation happens in the background with minimal CPU impact
- Users see their actual layout before committing to a full PDF export

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Main Thread (UI)                            │
│                                                                 │
│  Settings change / Image change                                 │
│         │                                                       │
│         ▼                                                       │
│  [Debounce 500ms] ──► Gather settings + first N image pairs     │
│         │                                                       │
│         ▼                                                       │
│  Post message to existing worker                                │
│  (layout-generator-worker or foldable-layout-worker)            │
│  with { preview: true, maxPages: 2 }                            │
│         │                                                       │
│         ▼                                                       │
│  Worker generates PDF (capped at 2 pages)                       │
│  Returns Uint8Array                                             │
│         │                                                       │
│         ▼                                                       │
│  PDF.js renders Uint8Array → Canvas(es) in preview panel        │
│  pdfjsLib.getDocument(pdfBytes) → page.render(canvasContext)    │
└─────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **Reuse existing workers**: Don't create a separate preview-only PDF generator. Instead, add a `preview` flag to the existing worker message format. When `preview: true`, the worker caps output at `maxPages` pages and skips the `"saving"` state.

2. **PDF.js for rendering**: Use PDF.js to render the worker's PDF output to canvas. This ensures pixel-perfect WYSIWYG — the preview shows exactly what the exported PDF will look like.

3. **Debounce, don't throttle**: Use a 500ms debounce on settings/image changes. If a new change arrives while a preview generation is in-flight, cancel the in-flight request and queue a new one after the debounce window.

4. **Placement**: The preview panel goes in a **new Bento box** between the Settings section and the Generate PDF section. Full-width, with the canvas centered and scaled to fit.

---

## Tasks

### 7.1 — Integrate PDF.js Library

**Files:** `index.html`

**What:**
- Add PDF.js as an external dependency via CDN (matching the pattern of other CDN libraries like Sortable.js and pdf-lib)
- Only the **viewer** component is needed — not the full PDF.js viewer application

**How:**

1. Add PDF.js CDN script to [`index.html`](file:///c:/GIT/pnptools/layout/index.html), alongside the existing library script tags:
   ```html
   <!-- PDF.js for live sheet preview -->
   <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.9.155/pdf.min.mjs" type="module"></script>
   ```
   
   **OR** for non-module compatibility (recommended since the current codebase doesn't use ES modules):
   ```html
   <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.9.155/pdf.min.js"></script>
   ```

2. Configure PDF.js worker path (must be set before any PDF.js calls):
   ```javascript
   // In a <script> tag after PDF.js loads, or at the top of a new preview module
   pdfjsLib.GlobalWorkerOptions.workerSrc = 
     'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.9.155/pdf.worker.min.js';
   ```

3. **Version note**: Pin to a specific version. As of writing, v4.x is current. Check the [PDF.js releases](https://github.com/nicolo-ribaudo/pdfjs-dist) for the latest stable version before implementing.

**Acceptance Criteria:**
- [ ] PDF.js loads without errors in the browser console
- [ ] `pdfjsLib` is available globally
- [ ] Worker source is configured correctly
- [ ] No conflicts with existing libraries (pdf-lib, Sortable.js, Tailwind)
- [ ] PDF.js loads its own web worker successfully (check Network tab)

---

### 7.2 — Background Worker Preview Generation (Capped at Page 1–2)

**Files:** `layout-generator-worker.js`, `foldable-layout-worker.js`, `layout-master.js`

**What:**
- Modify both PDF workers to accept a `preview` flag in the message payload
- When `preview: true`, cap PDF generation at `maxPages` (default 2) pages
- Return the PDF bytes via a distinct `"preview_done"` message state to avoid conflicting with full generation
- Add preview orchestration to `layout-master.js`

**How:**

#### Worker Modifications

1. In both [`layout-generator-worker.js`](file:///c:/GIT/pnptools/layout/layout-generator-worker.js) and [`foldable-layout-worker.js`](file:///c:/GIT/pnptools/layout/foldable-layout-worker.js), detect the preview flag in the incoming message:

   **Grid worker** — modify the message handler:
   ```javascript
   self.onmessage = async function(e) {
     const { preview, maxPages, ...data } = e.data;
     
     // ... existing setup code ...
     
     // In the page loop, add an early exit:
     for (let pageNum = 0; pageNum < totalPages; pageNum++) {
       if (preview && pageNum >= (maxPages || 2)) break;
       // ... existing page rendering ...
     }
     
     // Use distinct state for preview completion:
     const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
     if (preview) {
       postMessage({ state: "preview_done", pdfBytes }, [pdfBytes.buffer]);
     } else {
       // ... existing "done" message ...
     }
   };
   ```

   **Foldable worker** — similar modification in the `generatePdf` message handler:
   ```javascript
   if (e.data.generatePdf) {
     const { preview, maxPages } = e.data.generatePdf;
     // ... existing setup ...
     
     // Cap pages in the layout loop
     // ... 
     
     if (preview) {
       postMessage({ state: "preview_done", pdf: { pdfBytes, aspectRatio } }, [pdfBytes.buffer]);
     }
   }
   ```

2. **Skip progress messages** in preview mode to reduce message overhead:
   ```javascript
   if (!preview) {
     reportProgress(done, total, percent);
   }
   ```

#### Layout Master Modifications

3. In [`layout-master.js`](file:///c:/GIT/pnptools/layout/layout-master.js), add a preview generation method:
   ```javascript
   // New property to track preview state
   this._previewInFlight = false;
   this._previewRequestId = 0;

   generatePreview(settings, imageData) {
     const requestId = ++this._previewRequestId;
     this._previewInFlight = true;
     
     const isDoubleSided = settings.layoutMode === "doubleSided";
     const worker = isDoubleSided ? this.workers.doubleSided : this.workers.foldable;
     
     // Build the same message payload as generatePDF, but add preview flags
     const message = this._buildWorkerMessage(settings, imageData);
     
     if (isDoubleSided) {
       message.preview = true;
       message.maxPages = 2;
     } else {
       message.generatePdf.preview = true;
       message.generatePdf.maxPages = 2;
     }
     
     worker.postMessage(message);
     // The onmessage handler routes "preview_done" to the preview panel
   }
   ```

4. **Update the worker `onmessage` handler** in `layout-master.js` to handle `"preview_done"`:
   ```javascript
   worker.onmessage = (e) => {
     if (e.data.state === "preview_done") {
       this._previewInFlight = false;
       // Dispatch event or call callback for preview panel
       if (this.onPreviewReady) {
         this.onPreviewReady(e.data.pdfBytes || e.data.pdf?.pdfBytes);
       }
       return;
     }
     // ... existing progress/done/error handling ...
   };
   ```

5. **Extract `_buildWorkerMessage()`** helper from the existing `generatePDF()` method to avoid code duplication between full generation and preview generation.

**Acceptance Criteria:**
- [ ] Workers accept `{ preview: true, maxPages: 2 }` in messages
- [ ] Preview-mode generation produces at most 2 pages of PDF
- [ ] Preview-mode returns via `"preview_done"` state, not `"done"`
- [ ] Full PDF generation still works exactly as before (no regression)
- [ ] Preview generation does not emit progress messages
- [ ] `layout-master.js` can trigger preview generation separately from full generation
- [ ] In-flight preview tracking prevents concurrent preview generations

---

### 7.3 — Build Live Preview Panel UI

**Files:** `index.html`, `layout-ui.js` (or new file `sheet-preview.js`)

**What:**
- Add a new Bento box section between "3. Settings" and the Generate PDF button area
- Contains a responsive canvas container that displays the rendered PDF pages
- Includes page navigation (Page 1 / Page 2) if multiple preview pages exist
- Shows appropriate empty/loading/error states

**How:**

#### HTML Structure

1. In [`index.html`](file:///c:/GIT/pnptools/layout/index.html), add a new Bento box section. Insert it **after** the Settings bento box closing `</div>` and **before** the Generate PDF bento box. The approximate insertion point is after line 672 (end of `#foldableModeUI`'s parent bento):

   ```html
   <!-- ===== 4. Live Sheet Preview ===== -->
   <div class="bento-box" id="sheetPreviewSection" style="display: none;">
     <div class="flex items-center justify-between mb-4">
       <div class="flex items-center gap-3">
         <h2 class="text-2xl font-display text-theme-dark">4. Sheet Preview</h2>
         <span id="previewStatus" class="text-xs font-bold text-theme-muted"></span>
       </div>
       <div class="flex items-center gap-2" id="previewPageNav" style="display: none;">
         <button type="button" id="previewPrevPage" class="btn-secondary py-1 px-2 text-xs" disabled>
           <i class="fa-solid fa-chevron-left"></i>
         </button>
         <span id="previewPageInfo" class="text-xs font-bold text-theme-dark">Page 1 / 1</span>
         <button type="button" id="previewNextPage" class="btn-secondary py-1 px-2 text-xs" disabled>
           <i class="fa-solid fa-chevron-right"></i>
         </button>
       </div>
     </div>
     
     <!-- Canvas container — responsive, centered -->
     <div id="previewCanvasContainer" class="flex justify-center items-center min-h-[200px] bg-theme-bg/50 rounded-xl border-2 border-dashed border-theme-dark/20 p-4 transition-all">
       <!-- Empty state -->
       <div id="previewEmptyState" class="text-center text-theme-muted">
         <i class="fa-solid fa-eye text-3xl mb-2 opacity-40"></i>
         <p class="text-sm font-medium">Upload images and adjust settings to see a live preview</p>
       </div>
       <!-- Loading state (hidden by default) -->
       <div id="previewLoadingState" class="text-center text-theme-muted" style="display: none;">
         <i class="fa-solid fa-spinner fa-spin text-2xl text-theme-indigo mb-2"></i>
         <p class="text-sm font-medium">Generating preview...</p>
       </div>
       <!-- Canvas (hidden by default) -->
       <canvas id="previewCanvas" style="display: none; max-width: 100%; height: auto;"></canvas>
     </div>
   </div>
   ```

2. **Renumber the Generate PDF section** from "4" to "5" (if it has a visible section number).

#### JavaScript Module

3. Create a new file [`sheet-preview.js`](file:///c:/GIT/pnptools/layout/sheet-preview.js) to encapsulate preview logic:

   ```javascript
   class SheetPreview {
     constructor() {
       this.section = document.getElementById('sheetPreviewSection');
       this.canvas = document.getElementById('previewCanvas');
       this.emptyState = document.getElementById('previewEmptyState');
       this.loadingState = document.getElementById('previewLoadingState');
       this.statusEl = document.getElementById('previewStatus');
       this.pageNavEl = document.getElementById('previewPageNav');
       this.pageInfoEl = document.getElementById('previewPageInfo');
       
       this.pdfDoc = null;       // Current PDF.js document
       this.currentPage = 1;     // Current page being displayed
       this.totalPages = 0;
       this._debounceTimer = null;
       this._renderInFlight = false;
       
       this._initPageNav();
     }
     
     // Show the preview section (call when images are loaded)
     show() {
       this.section.style.display = '';
     }
     
     // Hide the preview section (call when all images are cleared)
     hide() {
       this.section.style.display = 'none';
       this.pdfDoc = null;
     }
     
     // Called when settings or images change — debounces then triggers generation
     requestUpdate() {
       clearTimeout(this._debounceTimer);
       this._debounceTimer = setTimeout(() => {
         this._triggerPreviewGeneration();
       }, 500);
     }
     
     // Called by layout-master when preview PDF bytes arrive
     async onPdfReady(pdfBytes) {
       try {
         this.pdfDoc = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
         this.totalPages = this.pdfDoc.numPages;
         this.currentPage = 1;
         this._updatePageNav();
         await this._renderPage(this.currentPage);
         this._showState('canvas');
         this.statusEl.textContent = '';
       } catch (err) {
         console.error('Preview render failed:', err);
         this.statusEl.textContent = 'Preview failed';
         this._showState('empty');
       }
     }
     
     async _renderPage(pageNum) {
       if (!this.pdfDoc || this._renderInFlight) return;
       this._renderInFlight = true;
       
       const page = await this.pdfDoc.getPage(pageNum);
       const viewport = page.getViewport({ scale: 1.5 }); // 1.5x for crisp rendering
       
       this.canvas.width = viewport.width;
       this.canvas.height = viewport.height;
       
       const ctx = this.canvas.getContext('2d');
       await page.render({ canvasContext: ctx, viewport }).promise;
       
       this._renderInFlight = false;
     }
     
     _triggerPreviewGeneration() {
       // Gather current settings and image data, call layout-master
       this._showState('loading');
       this.statusEl.textContent = 'Generating...';
       
       const settings = window.LayoutToolUI.getSettings();
       window.LayoutToolPDF.generatePreview(settings);
     }
     
     _showState(state) {
       this.emptyState.style.display = state === 'empty' ? '' : 'none';
       this.loadingState.style.display = state === 'loading' ? '' : 'none';
       this.canvas.style.display = state === 'canvas' ? '' : 'none';
     }
     
     _initPageNav() {
       document.getElementById('previewPrevPage')?.addEventListener('click', () => {
         if (this.currentPage > 1) {
           this.currentPage--;
           this._renderPage(this.currentPage);
           this._updatePageNav();
         }
       });
       document.getElementById('previewNextPage')?.addEventListener('click', () => {
         if (this.currentPage < this.totalPages) {
           this.currentPage++;
           this._renderPage(this.currentPage);
           this._updatePageNav();
         }
       });
     }
     
     _updatePageNav() {
       const show = this.totalPages > 1;
       this.pageNavEl.style.display = show ? '' : 'none';
       this.pageInfoEl.textContent = `Page ${this.currentPage} / ${this.totalPages}`;
       document.getElementById('previewPrevPage').disabled = this.currentPage <= 1;
       document.getElementById('previewNextPage').disabled = this.currentPage >= this.totalPages;
     }
   }
   
   window.SheetPreview = new SheetPreview();
   ```

4. Add `<script src="sheet-preview.js"></script>` to `index.html` after the PDF.js script and after `layout-master.js`.

**Acceptance Criteria:**
- [ ] Preview section is hidden by default, shown when images are uploaded
- [ ] Empty state displays helpful message when no preview is available
- [ ] Loading state shows spinner during generation
- [ ] Canvas displays rendered PDF page with correct aspect ratio
- [ ] Canvas scales responsively (never overflows the container)
- [ ] Page 1/2 navigation works when preview has multiple pages
- [ ] Section follows the bento-box neo-brutalist design system
- [ ] Preview section hides when all images are cleared

---

### 7.4 — Debounce Settings Changes to Update Preview Live

**Files:** `layout-ui.js`, `sheet-preview.js`, `preview-panel.js`

**What:**
- Hook into all settings change events and image data changes to trigger preview updates
- Use the debounce mechanism built into `SheetPreview.requestUpdate()` (from 7.3)
- Ensure the preview only attempts to generate when there are actual images loaded

**How:**

1. **Hook settings changes** in [`layout-ui.js`](file:///c:/GIT/pnptools/layout/layout-ui.js). Find the existing `fnSync` function that's attached to all inputs (the function attached via `input.addEventListener("input", fnSync)` and `input.addEventListener("change", fnSync)`). At the end of `fnSync`, add:
   ```javascript
   // At the end of fnSync():
   if (window.SheetPreview && window.PreviewPanel && window.PreviewPanel.getMode() !== 'empty') {
     window.SheetPreview.requestUpdate();
   }
   ```

2. **Hook image data changes** in [`preview-panel.js`](file:///c:/GIT/pnptools/layout/preview-panel.js). The PreviewPanel already has a pub-sub system via `onChange()`. Subscribe to it:
   ```javascript
   // In sheet-preview.js constructor or init:
   if (window.PreviewPanel) {
     window.PreviewPanel.onChange((state) => {
       const mode = window.PreviewPanel.getMode();
       if (mode === 'empty') {
         this.hide();
       } else {
         this.show();
         this.requestUpdate();
       }
     });
   }
   ```

3. **Handle layout mode switches** (Grid ↔ Foldable). When the user switches layout mode, it should also trigger a preview update. This is likely already covered by the `fnSync` on the radio buttons, but verify and add explicitly if needed:
   ```javascript
   // In the layout mode toggle handler in layout-ui.js:
   if (window.SheetPreview) {
     window.SheetPreview.requestUpdate();
   }
   ```

4. **Cancel in-flight previews** when starting a new one. In `layout-master.js`, if a preview generation is already running when a new request comes in, the new request should be queued after the current one completes, or the debounce in `SheetPreview` handles this naturally by waiting 500ms after the last change.

5. **Gate preview generation**: Only trigger if `PreviewPanel.getMode() !== 'empty'` (images must be loaded). This prevents wasted CPU generating an empty PDF.

**Acceptance Criteria:**
- [ ] Changing any setting (page size, card size, rows, columns, bleed, etc.) triggers a debounced preview update
- [ ] Adding, removing, or reordering images triggers a preview update
- [ ] Changing copy counts triggers a preview update
- [ ] Switching between Grid and Foldable mode triggers a preview update
- [ ] Rapid successive changes only trigger one preview generation (debounce works)
- [ ] Preview does not attempt to generate when no images are loaded
- [ ] Preview generation does not interfere with full PDF generation
- [ ] Unit switching (mm/in) does not cause unnecessary double-updates

---

## Technical Reference

### Current Libraries & Load Pattern

| Library | Source | How Loaded |
|---------|--------|------------|
| `@cantoo/pdf-lib` v2.4.1 | CDN | `<script>` in `index.html` + `importScripts()` in workers |
| SortableJS 1.15.0 | CDN | `<script>` in `index.html` |
| Tailwind CSS v4 | CDN | `<script>` with inline `@theme` block |
| Font Awesome 6.4.0 | CDN | `<link>` stylesheet |
| Google Fonts | CDN | `<link>` stylesheet |
| **PDF.js** (NEW) | CDN | `<script>` in `index.html` |

### Worker Message Format Extensions

#### Grid Worker — Preview Request
```javascript
{
  frontImages: [...],
  backImages: [...],
  settings: { ... },
  config: { ... },
  preview: true,     // NEW
  maxPages: 2        // NEW
}
```

#### Grid Worker — Preview Response
```javascript
{
  state: "preview_done",  // NEW (distinct from "done")
  pdfBytes: Uint8Array
}
```

#### Foldable Worker — Preview Request
```javascript
{
  generatePdf: {
    cards: [...],
    options: { ... },
    preview: true,    // NEW
    maxPages: 2       // NEW
  }
}
```

#### Foldable Worker — Preview Response
```javascript
{
  state: "preview_done",   // NEW
  pdf: { pdfBytes: Uint8Array, aspectRatio: Number }
}
```

### Debounce Timing

- **Settings input**: 500ms after last keystroke/change
- **Image upload**: 500ms after last image processed
- **Mode switch**: 500ms after toggle
- **Preview render scale**: 1.5x (good quality without being too large for canvas)

---

## Task Dependency Order

```
7.1 (PDF.js integration) — Must be first, all others depend on it
7.2 (Worker preview mode) — Depends on 7.1 (needs PDF.js to verify output)
7.3 (Preview panel UI) — Depends on 7.1, can parallel with 7.2
7.4 (Debounce hookup) — Depends on 7.2 and 7.3

Recommended order: 7.1 → 7.2 + 7.3 (parallel) → 7.4
```

---

## Verification

### Manual Testing Checklist
- [ ] Upload images → preview section appears, shows page 1 of layout
- [ ] Change page size (A4 → Letter) → preview updates after ~500ms
- [ ] Change card size → preview updates
- [ ] Change rows/columns → preview updates  
- [ ] Toggle orientation → preview updates
- [ ] Add/remove images → preview updates
- [ ] Change copy counts → preview updates
- [ ] Switch Grid ↔ Foldable → preview updates with correct layout
- [ ] Rapidly change multiple settings → only one preview generation (debounce)
- [ ] Clear all images → preview section hides
- [ ] Full PDF generation → still works, produces correct complete PDF
- [ ] Preview with bleed, crosshairs, borders → all rendered correctly
- [ ] Mobile/tablet → preview canvas scales responsively
- [ ] Page 2 navigation → shows second page when layout spans multiple pages

### Performance Targets
- [ ] Preview generation completes in < 2 seconds for typical use (9 cards, grid layout)
- [ ] No visible UI lag during settings changes
- [ ] Memory: PDF.js document is released when new preview generates

### Files Changed Summary

| File | Action | Description |
|------|--------|-------------|
| `index.html` | MODIFY | Add PDF.js CDN script, add Sheet Preview bento box HTML |
| `sheet-preview.js` | NEW | Preview panel logic, debounce, PDF.js rendering, page navigation |
| `layout-master.js` | MODIFY | Add `generatePreview()`, handle `"preview_done"`, extract `_buildWorkerMessage()` |
| `layout-generator-worker.js` | MODIFY | Add `preview`/`maxPages` support, `"preview_done"` response |
| `foldable-layout-worker.js` | MODIFY | Add `preview`/`maxPages` support, `"preview_done"` response |
| `layout-ui.js` | MODIFY | Hook `fnSync` to trigger preview updates |
| `preview-panel.js` | NO CHANGE | Subscribe to existing `onChange()` from sheet-preview.js |
