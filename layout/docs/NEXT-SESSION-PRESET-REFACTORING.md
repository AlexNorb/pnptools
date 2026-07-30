# Next Session — Layout & Preset Refactoring

> **Status:** `NOT STARTED`
> **Prerequisite:** Phases 1–6 `COMPLETED`
> **Goal:** Polish the preset system to work across both layout modes, improve the settings UI layout, and replace the inline preset name input with the existing modal prompt pattern.

## Context & Objectives

The preset system currently only exists inside the **Grid (Double-Sided)** view. Presets only save a subset of Grid settings (page size, card size, rows, columns, bleed, borders). This phase promotes presets to a **global concept** shared across both Grid and Foldable views, relocates the preset UI to a shared position, and merges the Paper Size + Grid Layout cards into one unified card.

**After this phase:**
- Preset saving uses the neo-brutalist `Toast.prompt()` modal (no visible text input in the settings panel)
- The Preset section sits at the top of settings, shared between both layout mode views
- Presets capture and restore **all** settings for both Grid and Foldable modes
- Paper Size and Grid Layout are merged into a single card, reducing visual clutter

---

## Tasks

### NS.1 — Replace Preset Name Input with `Toast.prompt()` Modal

**Files:** `index.html`, `layout-ui.js`

**What:**
- Remove the visible `<input type="text" id="presetName">` text field from the Presets card
- Change the Save Preset button click handler to open a `Toast.prompt()` modal (same pattern already used by Card Size saving at [layout-ui.js L194](file:///c:/GIT/pnptools/layout/layout-ui.js#L194))
- The modal should use title `"Save Preset"`, message `"Enter a name for this preset:"`, and enforce the 25-character `maxlength` (already built into `Toast.prompt()`)

**How:**

1. In [`index.html`](file:///c:/GIT/pnptools/layout/index.html) **lines 474–475**, remove the `<input id="presetName">` element and its wrapping `<div class="flex gap-2 items-center">`. Restructure so the Save and Delete buttons sit directly under the `<select>` dropdown. Suggested layout:
   ```html
   <select id="preset" class="w-full"></select>
   <div class="flex gap-2">
     <button id="savePresetButton" ...>💾</button>
     <button id="deletePresetButton" ...>🗑️</button>
   </div>
   ```

2. In [`layout-ui.js`](file:///c:/GIT/pnptools/layout/layout-ui.js) **lines 144–154**, replace the Save Preset click handler:
   ```javascript
   // BEFORE (lines 144-154):
   this.elements.savePresetButton.addEventListener("click", () => {
     const name = (this.elements.presetName.value || "").trim().slice(0, 25);
     if (!name) {
       Toast.show("Please enter a name for the preset.", "error");
       return;
     }
     const settings = this.ui.getRawGridSettings();
     this.storage.saveUserPreset(name, settings);
     this.ui.loadPresets();
     this.elements.presetName.value = "";
   });

   // AFTER:
   this.elements.savePresetButton.addEventListener("click", () => {
     const onSave = (name) => {
       const settings = this.ui.getRawAllSettings(); // See NS.3
       this.storage.saveUserPreset(name, settings);
       this.ui.loadPresets();
     };
     if (window.Toast && typeof window.Toast.prompt === 'function') {
       window.Toast.prompt("Enter a name for this preset:", onSave, "Save Preset");
     } else {
       const name = prompt("Enter a name for this preset:");
       onSave(name);
     }
   });
   ```

3. Remove the `presetName` entry from `LayoutToolUI.elements` (search for where elements are cached, likely in the `init()` or element-gathering section).

**Acceptance Criteria:**
- [ ] No visible text input for preset name in the settings panel
- [ ] Clicking Save Preset opens the `Toast.prompt()` modal with "Save Preset" title
- [ ] Modal enforces 25-character limit and supports Enter/Escape keyboard shortcuts
- [ ] Successful save reloads the preset dropdown and shows the new preset
- [ ] Fallback to native `prompt()` if `Toast` is unavailable

---

### NS.2 — Move Preset Section to Shared Top Position

**Files:** `index.html`, `layout-ui.js`

**What:**
- Extract the Preset card out of `#doubleSidedModeUI` and place it **above both mode containers** but **below the settings header divider line** (line 462 in `index.html`)
- This makes presets visible and functional in **both** Grid and Foldable views
- The preset card should no longer be inside a `settings-grid` — it stands alone as a full-width element

**How:**

1. **Cut** the entire Preset card (currently [`index.html` lines 468–483](file:///c:/GIT/pnptools/layout/index.html#L468-L483)) from inside `#doubleSidedModeUI`.

2. **Paste** it inside `#settingsContent > .collapsible-inner` (line 465), **before** `#doubleSidedModeUI` (line 466). It should sit between the collapsible-inner opening and both mode containers.

3. Change the preset card styling from a grid item to a **compact horizontal layout**:
   ```html
   <!-- Preset section — shared across both layout modes -->
   <div class="flex flex-wrap items-center gap-3 p-3 mb-5 border-3 border-theme-bg rounded-xl">
     <div class="flex items-center gap-2 shrink-0">
       <i class="fa-solid fa-bookmark text-xl text-theme-indigo"></i>
       <h3 class="font-display text-base text-theme-dark">Presets</h3>
     </div>
     <select id="preset" class="flex-1 min-w-[180px]"></select>
     <div class="flex gap-2 shrink-0">
       <button id="savePresetButton" title="Save Preset" aria-label="Save Preset"
               class="btn-secondary w-[2rem] p-0 text-sm">
         <i class="fa-solid fa-floppy-disk text-theme-indigo"></i>
       </button>
       <button id="deletePresetButton" title="Delete Preset" aria-label="Delete Preset"
               class="btn-secondary w-[2rem] p-0 text-sm text-theme-pink border-theme-pink">
         <i class="fa-solid fa-trash-can"></i>
       </button>
     </div>
   </div>
   ```

4. After moving, the first `settings-grid` inside `#doubleSidedModeUI` (which currently has 2 items: Presets + Paper Size) will only have **Paper Size**. This will be addressed in NS.4 when Paper Size and Grid Layout are combined.

5. **No JS changes needed** for this task alone — the element IDs (`preset`, `savePresetButton`, `deletePresetButton`) remain the same, so all existing event listeners continue to work via `document.getElementById`.

**Acceptance Criteria:**
- [ ] Preset strip is visible in both Grid and Foldable views
- [ ] Preset strip sits below the "3. Settings" header/divider and above the mode-specific cards
- [ ] Horizontal layout does not take up excessive vertical space
- [ ] Collapsing settings (Hide button) also hides the preset strip
- [ ] Responsive: wraps gracefully on mobile

---

### NS.3 — Presets Save & Apply All Settings Across Both Modes

**Files:** `layout-ui.js`, `presets.json`

**What:**
- Expand the preset data structure to store **all** settings from **both** Grid and Foldable modes
- When saving a preset, capture settings from both `#doubleSidedModeUI` and `#foldableModeUI` forms, plus the currently active layout mode
- When applying a preset, restore all settings and switch to the saved layout mode

**How:**

1. **New method `getRawAllSettings()`** in the `ui` object (near [`layout-ui.js` line 1149](file:///c:/GIT/pnptools/layout/layout-ui.js#L1149)):
   ```javascript
   getRawAllSettings() {
     const gridSettings = this.getRawGridSettings();
     const foldableElementIds = [
       "foldable_pageSize", "foldable_pageWidth", "foldable_pageHeight",
       "foldable_cardSize", "foldable_cardWidth", "foldable_cardHeight",
       "foldable_printerMargin", "foldable_foldingMargin", "foldable_cardMargin",
       "foldable_cutMargin", "foldable_innerBorder", "foldable_borderColorFront",
       "foldable_borderColorBack", "foldable_foldLinePreference", "foldable_cornerRadius"
     ];
     const foldableSettings = this._gatherFormValues(foldableElementIds);
     
     return {
       _version: 2,  // Distinguish from v1 presets that only had grid settings
       layoutMode: LayoutToolUI.elements.doubleSidedRadio.checked ? "doubleSided" : "foldable",
       pageOrientation: LayoutToolUI.elements.pageOrientation?.value || "portrait",
       grid: gridSettings,
       foldable: foldableSettings
     };
   },
   ```

2. **Update `applyPreset()`** ([`layout-ui.js` lines 957–1056](file:///c:/GIT/pnptools/layout/layout-ui.js#L957-L1056)) to handle both v1 and v2 presets:
   ```javascript
   applyPreset() {
     // ... existing re-enable logic (lines 958-968) stays ...
     
     const selectedPresetKey = LayoutToolUI.elements.preset.value;
     const presetData = LayoutToolUI.config.presets[selectedPresetKey];
     if (!presetData) return;

     if (presetData.settings._version === 2) {
       // --- V2 preset: full cross-mode ---
       // 1. Switch layout mode
       if (presetData.settings.layoutMode === "foldable") {
         LayoutToolUI.elements.foldableRadio.checked = true;
       } else {
         LayoutToolUI.elements.doubleSidedRadio.checked = true;
       }
       // Trigger the mode switch UI update
       LayoutToolUI.elements.doubleSidedRadio.dispatchEvent(new Event("change"));

       // 2. Apply grid settings
       this.applySettings(presetData.settings.grid);
       
       // 3. Apply foldable settings
       this.applySettings(presetData.settings.foldable);
       
       // 4. Apply orientation
       if (presetData.settings.pageOrientation) {
         this.elements.pageOrientation.value = presetData.settings.pageOrientation;
       }
     } else {
       // --- V1 preset: legacy grid-only (built-in presets from presets.json) ---
       // ... existing v1 apply logic stays unchanged ...
     }
     
     // Handle disabled fields (existing logic stays)
     // Update summaries
   }
   ```

3. **`presets.json` built-in presets**: No changes needed — they continue to work as v1 presets. The `_version` field is only added to user-saved presets.

4. **`storage.saveUserPreset()`** ([`layout-ui.js` line 1368](file:///c:/GIT/pnptools/layout/layout-ui.js#L1368)) — no structural change needed, it already saves `{ name, settings }` where `settings` is whatever is passed in.

**Acceptance Criteria:**
- [ ] Saving a preset in Grid mode also captures all Foldable settings
- [ ] Saving a preset in Foldable mode also captures all Grid settings
- [ ] Applying a v2 preset switches to the correct layout mode
- [ ] Applying a v2 preset restores all Grid AND Foldable settings
- [ ] Built-in v1 presets (from `presets.json`) continue to work unchanged
- [ ] Legacy user presets (v1, from localStorage) continue to work
- [ ] Settings summary updates correctly after preset application

---

### NS.4 — Combine Paper Size + Grid Layout into Single Unified Card

**Files:** `index.html`

**What:**
- Merge the Paper Size card ([`index.html` lines 485–529](file:///c:/GIT/pnptools/layout/index.html#L485-L529)) and Grid Layout card ([`index.html` lines 532–561](file:///c:/GIT/pnptools/layout/index.html#L532-L561)) into a single settings card within `#doubleSidedModeUI`
- These are logically related: paper size determines available grid capacity, and they share the same "how many cards fit on a page" concern

**How:**

1. **Replace the two separate cards** with a single card. The first `settings-grid` in `#doubleSidedModeUI` will now be: **Paper Size & Grid Layout** (combined) + **Card Size** (unchanged).

2. Suggested merged card HTML structure:
   ```html
   <div class="flex flex-col gap-4 p-4 border-3 border-theme-bg rounded-xl">
     <!-- Header -->
     <div class="flex items-center gap-2">
       <i class="fa-solid fa-file text-2xl text-theme-indigo"></i>
       <h3 class="font-display text-lg text-theme-dark">Paper Size & Grid</h3>
     </div>
     
     <!-- Paper Size controls (page size segmented, orientation segmented) -->
     <div class="flex flex-wrap gap-2 items-center">
       <!-- ... existing hidden selects + segmented controls (unchanged) ... -->
     </div>
     
     <!-- Paper dimensions + Grid rows/cols in one row -->
     <div class="flex flex-wrap gap-4 items-end">
       <div class="flex flex-col">
         <label for="pageWidth" class="text-sm">Width</label>
         <input type="number" id="pageWidth" value="210" step="0.1" disabled class="w-16" />
       </div>
       <div class="flex flex-col">
         <label for="pageHeight" class="text-sm">Height</label>
         <input type="number" id="pageHeight" value="297" step="0.1" disabled class="w-16" />
       </div>
       
       <!-- Visual separator -->
       <div class="w-px h-8 bg-theme-dark/15 hidden sm:block"></div>
       
       <!-- Grid controls -->
       <div class="flex items-center gap-2">
         <input type="checkbox" id="autoGrid" checked class="hidden" />
         <div class="inline-flex ..." id="autoGridSegmented">
           <!-- ... existing auto-grid buttons (unchanged) ... -->
         </div>
       </div>
       <div class="flex flex-col">
         <label for="rows" class="text-sm">Rows</label>
         <input type="number" id="rows" value="3" class="w-12" />
       </div>
       <div class="flex flex-col">
         <label for="columns" class="text-sm">Cols</label>
         <input type="number" id="columns" value="3" class="w-12" />
       </div>
     </div>
   </div>
   ```

3. After merging, the first `settings-grid mb-6` will contain **two** cards: the merged Paper+Grid card and the existing Card Size card. The second `settings-grid mb-6` (Crosshairs + Borders) remains unchanged.

4. **No JS changes needed** — all element IDs remain unchanged, so all existing logic continues to work.

**Acceptance Criteria:**
- [ ] Paper Size and Grid Layout appear as a single card with title "Paper Size & Grid"
- [ ] All existing controls are present and functional (page size, orientation, custom dims, auto-grid, rows, cols)
- [ ] The visual separator between paper dims and grid controls provides clear grouping
- [ ] Responsive: all controls wrap properly on narrow screens
- [ ] Auto-grid toggle still correctly enables/disables rows and columns inputs
- [ ] Custom page size still shows/hides width/height inputs correctly
- [ ] Settings summary still updates correctly

---

## Task Dependency Order

```
NS.1 (Modal preset save) — Independent, can start immediately
NS.2 (Move preset section) — Independent, can start immediately
NS.3 (Cross-mode presets) — Depends on NS.1 (needs the onSave callback pattern)
NS.4 (Merge cards) — Independent, can start immediately

Recommended order: NS.1 → NS.2 → NS.4 → NS.3
(NS.4 is pure HTML, quick win; NS.3 is the most complex)
```

---

## Verification

### Manual Testing Checklist
- [ ] Switch between Grid and Foldable mode → preset strip stays visible
- [ ] Save a preset in Grid mode → modal appears, name saved, dropdown updates
- [ ] Save a preset in Foldable mode → same behavior
- [ ] Apply a v2 preset → layout mode switches, all settings restored
- [ ] Apply a v1 built-in preset → still works as before (Grid settings only)
- [ ] Delete a user preset → removed from dropdown
- [ ] Reset settings → all values return to defaults
- [ ] Collapse/expand settings → preset section collapses too
- [ ] Merged Paper+Grid card → all controls functional, responsive layout
- [ ] Unit switcher (mm/in) → works correctly with merged card and cross-mode presets

### Files Changed Summary

| File | Action | Description |
|------|--------|-------------|
| `index.html` | MODIFY | Remove preset name input, restructure preset card to shared position, merge Paper Size + Grid Layout cards |
| `layout-ui.js` | MODIFY | Replace save handler with `Toast.prompt()`, add `getRawAllSettings()`, update `applyPreset()` for v2 presets, remove `presetName` element reference |
| `presets.json` | NO CHANGE | Built-in presets remain v1 format |
| `notifications.js` | NO CHANGE | Existing `Toast.prompt()` already supports this use case |
