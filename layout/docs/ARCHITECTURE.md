# Layout Tool — Architecture

> Current architecture as of v2.1. Update this document when making structural changes.

## System Diagram

```
┌─────────────────────────────────────────────────────────┐
│  index.html (main page)                                 │
│  ├── layout-ui.js      (UI logic, settings, presets)    │
│  ├── layout-master.js  (orchestration, file reading)    │
│  └── style.css         (main styles)                    │
│                                                         │
│  ┌───────────────────┐   ┌────────────────────────────┐ │
│  │ Dropzone (fronts) │   │ Dropzone (backs)           │ │
│  └───────────────────┘   └────────────────────────────┘ │
│                                                         │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Preview iframe (preview.html + preview.js/css)     │  │
│  │ Communication: postMessage API                     │  │
│  └────────────────────────────────────────────────────┘  │
│                                                         │
│  PDF Generation (Web Workers):                          │
│  ├── layout-generator-worker.js  (grid/double-sided)    │
│  └── foldable-layout-worker.js   (foldable layout)      │
│                                                         │
│  Data:                                                  │
│  ├── presets.json     (default presets)                  │
│  └── localStorage     (user presets + last settings)    │
└─────────────────────────────────────────────────────────┘
```

## File-by-File Reference

### index.html (397 lines, 14.5 KB)
**Role:** Main HTML structure with all form elements.

Key sections:
- **Lines 30-58:** File dropzones (front + back) with `<input type="file">` elements
- **Lines 62-79:** Advanced Preview toggle (checkbox + iframe container)
- **Lines 82-115:** Mode indicators (No backs / Same backs / Unique backs) + layout mode radio (Double-Sided / Foldable)
- **Lines 118-265:** Double-sided mode settings (page size, presets, grid, measurements, crosshairs, borders)
- **Lines 267-367:** Foldable mode settings (page size, margins, card dimensions, spacing, borders, fold line)
- **Lines 369-392:** Generate PDF button, progress bar, Buy Me a Coffee link

Known issues:
- Uses non-standard `<p2>` element (lines 37, 51) — should be `<span>`
- Several inline styles that should be in CSS
- No `<meta name="viewport">` tag

### layout-ui.js (727 lines, 25.7 KB)
**Role:** All UI logic, event handling, presets, settings gathering, localStorage.

**Global object:** `window.LayoutToolUI`

Key structure:
```
LayoutToolUI {
  elements: { ... }     // DOM element references (lines 3-71)
  config: { ... }       // Runtime config: colors, presets, page/card size maps (lines 73-88)
  init()                // Event listener setup, loads presets + last settings (lines 90-231)
  ui: {
    updatePageSizeInputs()   // Sync page size dropdown → width/height inputs
    updateCardSizeInputs()   // Sync card size dropdown → width/height inputs
    togglePreviewer()        // Show/hide iframe preview
    toggleModeUI()           // Show/hide double-sided vs foldable sections
    toggleProgressUI()       // Show/hide progress bar
    updateProgress()         // Update progress bar values
    updateStatus()           // Update status text
    applyPreset()            // Apply selected preset to form
    getRawSettings()         // Read ALL form values as-is (for localStorage save)
    getRawGridSettings()     // Read grid-specific form values (for user preset save)
    applySettings()          // Write settings back to form (for localStorage restore)
    loadPresets()            // Fetch presets.json + merge with user presets from localStorage
    updateModeIndicator()    // Update mode indicator visual state
    updateFileCount()        // Update "X files selected" text
  }
  storage: {
    save(key, data)          // localStorage wrapper
    load(key)                // localStorage wrapper
    saveUserPreset(name, settings)
    loadUserPresets()
    deleteUserPreset(presetKey)
  }
  getGridSettings()         // Read grid settings + convert mm→pt (lines 607-656)
  getFoldableSettings()     // Read foldable settings (lines 658-713)
  getSettings()             // Dispatcher: returns grid or foldable settings + layoutMode
}
```

**Unit conversion note:** `getGridSettings()` converts most values from mm to PDF points (`mmToPt = 2.83464567`), but `pageWidth`/`pageHeight` are left in mm. The workers also have their own mm→pt constant. This dual conversion is a source of confusion.

### layout-master.js (251 lines, 9.3 KB)
**Role:** Orchestration layer — reads files, manages workers, handles iframe communication.

**Global object:** `window.LayoutToolPDF`

Key structure:
```
LayoutToolPDF {
  workers: { doubleSided, foldable }   // Web Worker instances
  pdfResponsePromise: null             // Promise for iframe data response

  init()                    // Create workers, set up message handlers
  utils: {
    getImageType(buffer)    // Detect PNG/JPEG from magic bytes
    hexToRgb(hex)           // "#ff0000" → [1, 0, 0]
    updateColor(input)      // Read color input → PDFLib.rgb()
  }
  readFiles(files)          // FileList → Promise<dataURL[]>
  sendDataToPreviewer()     // Send all current files to iframe
  appendDataToPreviewer()   // Append new files to iframe
  getPreviewData()          // Request data from iframe (returns Promise)
  generatePDF()             // Main entry: gather data → send to worker
}
```

**PDF generation flow:**
1. `generatePDF()` is called when user clicks "Generate PDF"
2. If previewer is active: requests data from iframe via `postMessage`
3. If previewer is not active: reads files directly from `<input>` elements via `readFiles()`
4. Sends image data URLs + settings to the appropriate worker
5. Worker processes images and returns PDF bytes
6. Creates a Blob download link

### layout-generator-worker.js (285 lines, 9.3 KB)
**Role:** Web Worker for double-sided grid PDF generation.

Uses: `@cantoo/pdf-lib` (loaded via CDN `importScripts`)

Key logic:
- Receives `frontImages`, `backImages`, `settings`, `config` via `postMessage`
- Calculates grid centering on page
- Places images in rows × columns grid
- For back pages: mirrors column order (right-to-left) for duplex printing
- Supports crosshairs (cut guides) and borders with corner radius
- Image deduplication via data URL lookup table
- Reports progress back to main thread

### foldable-layout-worker.js (1007 lines, 33.6 KB)
**Role:** Web Worker for foldable layout PDF generation. Significantly more complex than grid worker.

Uses: `@cantoo/pdf-lib` (loaded via CDN `importScripts`)

Key logic:
- `findOptimalLayout()` — Tests vertical/horizontal fold orientations, with/without rotation, picks best fit
- Places front+back images as mirrored pairs along a fold line
- Supports dashed fold lines and cut tick marks
- Independent front/back border colors
- Auto/vertical/horizontal fold line preference

Known issues:
- `drawMarkup()` has 15 positional parameters (should use options object)
- Major code duplication with grid worker (image processing, clipping, borders)
- Very large file — candidate for splitting

### preview.js (358 lines, 11.8 KB)
**Role:** Image previewer logic inside iframe.

**State:** `{ fronts: [], backs: [], copies: [] }` — parallel arrays

Key functions:
- Receives images via `postMessage` from parent
- `renderPairs()` — Generates drag-and-drop card pair grid (HTML via innerHTML)
- `compileFinalData()` — Expands copies into final front/back arrays
- Uses Sortable.js for drag-and-drop reordering
- Sends compiled data back to parent via `postMessage` when PDF is generated

Known issues:
- DOM is source of truth (fragile)
- innerHTML rebuilds entire DOM on each state change
- Inline onclick handlers in generated HTML
- `postMessage` uses wildcard origin

### presets.json (108 lines, 2.6 KB)
**Role:** Default preset configurations.

Current presets: Standard card 63×88mm, Mini European 44×68mm, Buttonshy 63×88mm, European Standard 59×91mm, TEMPLATE (developer reference)

Structure per preset:
```json
{
  "preset_key": {
    "name": "Display Name",
    "settings": { /* maps to element IDs */ },
    "disabled": { /* element IDs → true or array of option values to disable */ }
  }
}
```

### preview.html / preview.css
**Role:** HTML shell and styles for the preview iframe. Minimal — most content is dynamically generated by preview.js.

### style.css (309 lines, 5.3 KB)
**Role:** Main application styles.

Known issues:
- No CSS custom properties — all colors hardcoded
- Styles non-standard `p2` element
- Global `button` and `checkbox` styles (too broad)
- No responsive breakpoints
- No dark mode

## External Dependencies

| Library | Version | Loaded via | Used in |
|---------|---------|-----------|---------|
| @cantoo/pdf-lib | 2.4.1 | CDN (jsdelivr) | index.html, workers |
| Font Awesome | 6.4.0 | CDN (cdnjs) | index.html |
| Sortable.js | 1.15.0 | CDN (cdnjs) | preview.html |

## Data Flow

### Settings flow
```
User interacts with form
  → layout-ui.js reads form values
  → getGridSettings() or getFoldableSettings() converts mm→pt
  → settings object passed to layout-master.js
  → layout-master.js sends to worker via postMessage
```

### Image flow (without previewer)
```
User selects files in dropzone
  → layout-master.js reads files as data URLs via FileReader
  → data URLs sent to worker via postMessage
  → worker fetches data URLs, embeds in PDF
```

### Image flow (with previewer)
```
User selects files in dropzone
  → layout-master.js sends data URLs to iframe via postMessage
  → iframe renders preview, user reorders/adjusts copies
  → On generate: parent requests data from iframe via postMessage
  → iframe compiles final arrays (expanding copies) and sends back
  → parent sends to worker
```

## localStorage Keys

| Key | Contents |
|-----|----------|
| `layoutTool.lastUsedSettings` | Last used form values (auto-restored on load) |
| `layoutTool.userPresets` | User-saved presets (object keyed by `user_{timestamp}`) |
