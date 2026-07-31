# PnPTools — Tool UI Style Guide

> **Purpose**: This document captures the exact layout patterns, responsive behaviors, and design decisions that make the `/align` and `/layout` tools feel visually consistent despite using different components. An agent building a new tool page should follow these rules to get it right on the first try.

---

## 1. Page Shell

Every tool page follows this skeleton:

```html
<body class="bg-theme-bg font-ui text-theme-dark antialiased"
      data-tool-title="Tool Name">
  <div class="max-w-6xl mx-auto px-4 py-6" id="page-container">
    <!-- Bento boxes go here -->
  </div>

  <!-- Scripts at bottom of body -->
  <script src="../shared/notifications.js"></script>
  <script src="../shared/header.js"></script>
  <script src="tool.js"></script>
</body>
```

- `data-tool-title` is read by `header.js` to render the shared site header.
- Page container is always `max-w-6xl mx-auto px-4 py-6`.

---

## 2. Bento Box (the primary container)

```css
.bento-box {
  @apply bg-white border-3 border-theme-dark rounded-xl p-4 md:p-5 mb-5;
  box-shadow: 4px 4px 0 var(--color-theme-dark);
}
```

All major page sections live inside a `.bento-box`. Padding bumps from `p-4` to `p-5` at `md:` (768 px).

---

## 3. Multi-Column Workspace Layout

### Pattern: Fluid 50/50 Flex-Wrap (no fixed breakpoints)

The main workspace should use **flex-wrap with min-width thresholds** instead of media-query grid breakpoints. This lets the layout break *only when it truly needs to*, based on content width rather than an arbitrary pixel cutoff.

```html
<div class="bento-box">
  <div class="flex flex-wrap items-stretch gap-6">
    <div class="flex-1 min-w-[280px] flex flex-col">
      <!-- Column 1 content -->
    </div>
    <div class="flex-1 min-w-[400px] flex flex-col justify-between">
      <!-- Column 2 content -->
    </div>
  </div>
</div>
```

#### Key rules:

| Rule | Why |
|------|-----|
| Use `flex flex-wrap items-stretch gap-6` on the container | Columns share space equally and wrap when their `min-w` can't be satisfied |
| Both columns get `flex-1` | They split available space 50/50 when side by side |
| Set `min-w-[Npx]` on each column based on its content | The column with more complex content gets a larger min-width (e.g. 400 px for a settings panel vs 280 px for a dropzone) |
| **No `lg:` or `md:` grid breakpoints** on the workspace | The wrap point is driven by content, not viewport |
| **No divider lines** between columns | Bento box border is enough visual separation. Remove `border-l`, `border-t` dividers between columns |
| Use `pt-4 sm:pt-0 sm:pl-2` on column 2 | Slight left padding when side-by-side, top padding when stacked; keeps spacing tight without a heavy border |

### When elements inside a column must never wrap apart

Use `flex-nowrap overflow-hidden` on the inner row. This is critical when two components are semantically linked (e.g. number steppers + their preview visualization):

```html
<div class="flex flex-nowrap items-stretch gap-3 sm:gap-4 mb-4 overflow-hidden">
  <!-- Steppers (shrink-0) -->
  <!-- Preview box (shrink-0) -->
</div>
```

All children should be `shrink-0` so they hold their size. The `min-w` on the parent column guarantees enough space before the *column itself* wraps to a new row.

### Dynamic text that might clip

Add `whitespace-nowrap` to short label text that must stay on one line. The parent column's `min-w` threshold should be wide enough to contain it. If the column wraps before the text clips, you've set the threshold correctly.

---

## 4. Section Headings with Inline Toggles

Place unit toggles (`mm`/`in`) or mode toggles directly after the section heading on the same line:

```html
<div class="flex items-center gap-3 mb-4">
  <h2 class="text-xl font-display text-theme-dark">2. Settings</h2>
  <!-- Segmented toggle -->
  <div class="inline-flex p-0 bg-white border-2 border-theme-dark rounded-xl
              shadow-[2px_2px_0_var(--color-theme-dark)] gap-1 h-8 items-center">
    <label class="segmented-option cursor-pointer font-bold h-full rounded-[10px]
                  text-xs transition-all flex items-center justify-center px-2.5">
      <input type="radio" name="globalUnit" value="mm" checked class="hidden" />
      <span>mm</span>
    </label>
    <!-- ... -->
  </div>
</div>
```

This pattern is identical in both `/layout` and `/align`.

---

## 5. Disabled Input Styling

Define globally so every disabled input looks the same:

```css
input:disabled,
select:disabled {
  background-color: #E2E8F0;
  color: var(--color-theme-muted);
  border-color: rgba(28, 17, 31, 0.3);
  opacity: 0.7;
  cursor: not-allowed;
  box-shadow: none !important;
}
```

In `/layout` this is in the `<style>` block. In `/align` it's applied via Tailwind utilities on the element (`disabled:bg-[#E2E8F0] disabled:text-theme-muted disabled:border-theme-dark/30 disabled:opacity-70 disabled:cursor-not-allowed`). Either approach is fine as long as the visual result matches:

- Background: `#E2E8F0` (light slate gray)
- Text: `--color-theme-muted` (`#554B59`)
- Border: `theme-dark` at 30% opacity
- Opacity: 0.7
- No box shadow

---

## 6. CTA / Action Bar (Bottom Bento Box)

This is the most fiddly responsive section. The pattern that works:

```html
<div class="bento-box grid grid-cols-1 md:grid-cols-[auto_1fr_170px] gap-4
            items-stretch bg-theme-bg border-theme-dark mt-8">
  <!-- Col 1: Action Button -->
  <button class="... w-full ... h-[52px] md:h-full min-h-[52px] shrink-0">
    Action Label
  </button>

  <!-- Col 2: Filename Card (gets ALL priority space) -->
  <div class="w-full justify-self-stretch flex items-stretch justify-center
              h-full min-w-0">
    <div class="bg-white border-3 ... flex items-center gap-3 ... w-full
                h-full min-h-[52px]">
      <span class="... shrink-0">Filename:</span>
      <input type="text" class="... flex-1 min-w-0 w-full" />
    </div>
  </div>

  <!-- Col 3: Buy Me a Dice (capped width) -->
  <a class="... w-full md:w-[170px] ... h-[52px] md:h-full min-h-[52px]
            shrink-0">
    <img ... />
  </a>
</div>
```

### Critical lessons learned:

| Mistake we made | Fix |
|-----------------|-----|
| Using `lg:` (1024 px) breakpoint — breaks to 1 column too early | Use `md:` (768 px) for the 3→1 column transition |
| Using `auto` for Buy Me a Dice column — it grows too large and steals space from filename | **Cap it**: `md:grid-cols-[auto_1fr_170px]` gives it exactly 170 px |
| Setting `min-w-[200px]` on the filename text input — forces overflow in tight 3-column layout | Use `min-w-0 w-full flex-1` on the input — it fills whatever space the `1fr` column provides, shrinking gracefully |
| Using `max-w-sm` on button/buymeadice in 1-column mode — looks small | Use `w-full` (no max-width cap) in 1-column mode so all items stretch to full container width |
| Wrapping Filename Card content in a separate `<div>` with fixed min-width | Keep it flat: icon + label + input as direct children of the card, with `flex items-center gap-3` |

### The filename input `min-w-0` trick

This is the single most important detail. In a CSS Grid `1fr` column, a flex child with `min-w-0` will shrink to fit the available grid track width. Without it, the input's intrinsic min-width overflows the grid.

```html
<!-- ✅ Correct -->
<input class="flex-1 min-w-0 w-full" />

<!-- ❌ Wrong — causes overflow -->
<input class="flex-1 min-w-[200px] w-full" />
```

---

## 7. Preview Visualizations with Fixed Aspect Ratio

When showing a page preview (e.g. A4 paper), enforce the aspect ratio with CSS:

```html
<!-- Outer frame -->
<div class="relative h-full min-h-[114px] aspect-[210/297] bg-white border-2
            border-theme-dark rounded-lg shadow-[2px_2px_0_var(--color-theme-dark)]
            overflow-hidden flex items-center justify-center shrink-0">
  <!-- Inner content indicator -->
  <div class="w-[62%] aspect-[210/297] bg-theme-indigo/20 border
              border-theme-indigo rounded ...">
  </div>
</div>
```

- `aspect-[210/297]` = standard ISO A4 ratio
- Both outer frame and inner indicator share the same aspect ratio
- `min-h-[114px]` prevents the preview from collapsing when the parent is very short
- The preview box is always `shrink-0` so it never gets compressed

---

## 8. Segmented Controls (Toggle Bars)

Consistent pattern across all tools:

```html
<div class="flex p-0 bg-white border-2 border-theme-dark rounded-xl
            shadow-[2px_2px_0_var(--color-theme-dark)] gap-1 h-[2.5rem]
            items-center w-full max-w-xs">
  <label class="segmented-option cursor-pointer font-bold flex-1 h-full
                rounded-[10px] text-xs sm:text-sm transition-all flex
                items-center justify-center px-3">
    <input type="radio" name="groupName" value="val" class="hidden" checked />
    <span>Label</span>
  </label>
  <!-- more options ... -->
</div>
```

The `.segmented-option` styles use `:has(input:checked)` to highlight the active option with `bg-theme-yellow` and a `1.5px` border. Inactive options get `border: 2px solid transparent` and `color: theme-muted`.

For small toggles (like `mm`/`in`), use `h-8` and `px-2.5` with `text-xs` (no `sm:text-sm` bump).

---

## 9. Number Input Steppers with Icon Buttons

For axis-specific shift controls, use color-coded button pairs:

```html
<!-- Horizontal axis = Indigo -->
<div class="flex items-center gap-1.5 shrink-0">
  <button class="btn-indigo shrink-0"><i class="fa-solid fa-arrow-left text-sm"></i></button>
  <input type="number" class="w-14 px-1 text-center font-bold text-sm shrink-0" />
  <button class="btn-indigo shrink-0"><i class="fa-solid fa-arrow-right text-sm"></i></button>
</div>

<!-- Vertical axis = Teal -->
<div class="flex items-center gap-1.5 shrink-0">
  <button class="btn-teal shrink-0"><i class="fa-solid fa-arrow-down text-sm"></i></button>
  <input type="number" class="w-14 px-1 text-center font-bold text-sm shrink-0" />
  <button class="btn-teal shrink-0"><i class="fa-solid fa-arrow-up text-sm"></i></button>
</div>
```

- Number inputs: `w-14` (56 px) — compact, no excess whitespace
- All elements `shrink-0` so nothing compresses
- Icon buttons: `2.25rem` square (`h-9 w-9`), `border-radius: 0.5rem`, `1.5px` border, `2px 2px 0` shadow

---

## 10. Dropzone

```html
<div class="dropzone-neo relative flex-1 flex flex-col items-center
            justify-center p-4 min-h-[140px]" id="pdfDropzone">
  <i class="fa-solid fa-file-pdf text-4xl text-theme-pink mb-2"></i>
  <label for="pdfFile" class="text-base font-bold cursor-pointer block
                               text-theme-dark">
    Drop PDF here or browse
  </label>
  <span class="text-xs text-theme-muted mt-1 font-medium" id="fileCount">
    No file selected
  </span>
  <input type="file" class="absolute inset-0 opacity-0 cursor-pointer
                             w-full h-full" />
</div>
```

- Use `flex-1` so it stretches to fill the column height
- `min-h-[140px]` prevents collapse
- The native file input is overlaid as an invisible full-size click target
- Hover: border turns pink, shadow shifts to pink

---

## 11. Info/Description Text

Brief tool descriptions go as plain text above the dropzone. No borders, no card — just text:

```html
<p class="text-xs text-theme-muted font-body mb-3 leading-relaxed">
  This tool will move all content on chosen pages to adjust for your
  printer's mis-alignment.
</p>
```

- Font: `font-body` (Averia Serif Libre) for warmth
- Size: `text-xs`
- Color: `text-theme-muted`
- Spacing: `mb-3 leading-relaxed`

---

## 12. Responsive Philosophy Summary

1. **Workspace sections**: Use `flex flex-wrap` with `min-w` thresholds. No media-query breakpoints. Columns wrap when content can't fit.
2. **CTA Action Bar**: Use `grid` with `md:` (768 px) breakpoint. Cap fixed-width columns (like Buy Me a Dice) with explicit pixel values in the grid template. Give the filename card `1fr`.
3. **Internally linked elements** (steppers + preview): Use `flex-nowrap overflow-hidden` with all children `shrink-0`.
4. **Inputs in grid columns**: Always use `min-w-0` on flex children inside grid tracks to prevent overflow. Never set a hard `min-w-[Npx]` on a text input inside a grid `1fr` column.
5. **1-column stacking**: All elements should expand to `w-full` in the stacked mobile layout. No `max-w-sm` caps in 1-column mode.

---

## 13. Common Pitfalls Checklist

Before shipping a new tool page, verify:

- [ ] **No divider lines** between workspace columns (no `border-l`, `border-t` between flex children)
- [ ] **Filename input uses `min-w-0`**, not a fixed min-width
- [ ] **Buy Me a Dice column is capped** (e.g. `170px`) in the grid template, not `auto`
- [ ] **Action bar breakpoint is `md:` (768 px)**, not `lg:` (1024 px)
- [ ] **All items stretch to `w-full`** in 1-column mobile layout
- [ ] **Preview text uses `whitespace-nowrap`** to prevent awkward line breaks
- [ ] **Linked element groups use `flex-nowrap`** so they never break apart
- [ ] **Column min-widths account for all content** — measure the widest state (e.g. when dynamic text shows `"12.5mm right"`) and set `min-w` accordingly
- [ ] **Disabled inputs match the standard** — `#E2E8F0` background, `0.7` opacity, muted text, `30%` border
