# Branding Guide — PNP Buddy

> Reference document for applying PNP Buddy branding to the Layout Tool (Phase 3).
> Source: Landing page at `/index.html` + `/style.css` + `/assets/color_palette.png`

## Color Palette

### Primary Tokens (from landing page CSS variables)

| Token | Hex | Usage | Preview |
|-------|-----|-------|---------|
| `--bg-color` | `#ECF0DD` | Page background | ![](https://via.placeholder.com/20/ECF0DD/ECF0DD) |
| `--text-dark` | `#1C111F` | Primary text, borders | ![](https://via.placeholder.com/20/1C111F/1C111F) |
| `--text-muted` | `#554b59` | Secondary text | ![](https://via.placeholder.com/20/554b59/554b59) |
| `--accent-pink` | `#DF2CD4` | Primary accent, errors | ![](https://via.placeholder.com/20/DF2CD4/DF2CD4) |
| `--accent-teal` | `#3DDDB2` | Secondary accent, success | ![](https://via.placeholder.com/20/3DDDB2/3DDDB2) |
| `--accent-yellow` | `#F7E517` | CTA buttons, warnings | ![](https://via.placeholder.com/20/F7E517/F7E517) |
| `--accent-indigo` | `#4E63C5` | Links, info states | ![](https://via.placeholder.com/20/4E63C5/4E63C5) |
| `--accent-green` | `#9EEA84` | Tags, badges, success | ![](https://via.placeholder.com/20/9EEA84/9EEA84) |
| `--card-bg` | `#FFFFFF` | Card/container backgrounds | ![](https://via.placeholder.com/20/FFFFFF/FFFFFF) |
| `--border-dark` | `#1C111F` | All borders | ![](https://via.placeholder.com/20/1C111F/1C111F) |

### Extended Palette (from color_palette.png)

| Token | Hex | Usage |
|-------|-----|-------|
| `--olive` | `#AEBA30` | Tertiary/alternative accent |
| `--deep-teal` | `#327570` | Dark teal variant |
| `--warm-brown` | `#805B50` | Warm neutral |

## Typography

| Role | Font Family | Weight | Usage |
|------|------------|--------|-------|
| Display | `'Bungee', cursive, sans-serif` | 400 | Headings, hero text, section titles |
| Body | `'Averia Serif Libre', serif` | 300, 400, 700 | Body text, descriptions |
| UI | `'Inter', system-ui, -apple-system, sans-serif` | 400, 500, 600, 700 | Form labels, buttons, inputs, tags |

### Font Loading
```css
@import url('https://fonts.googleapis.com/css2?family=Averia+Serif+Libre:ital,wght@0,300;0,400;0,700;1,400&family=Bungee&family=Inter:wght@400;500;600;700&display=swap');
```

## Design Patterns

### Containers / Cards
```css
.card {
  background: var(--card-bg);
  border: 3px solid var(--border-dark);
  border-radius: 14px;
  padding: 1.75rem;
  box-shadow: 5px 5px 0 var(--border-dark);
}
```

### CMYK Hover Effect (signature)
```css
.card:hover {
  transform: translate(-4px, -4px);
  box-shadow:
    8px 8px 0 var(--border-dark),
    12px 12px 0 var(--accent-pink),
    -4px -4px 0 var(--accent-teal);
}
```

### Primary Button (CTA)
```css
.btn-primary {
  font-family: var(--font-display);
  font-size: 1.1rem;
  padding: 0.9rem 1.8rem;
  background: var(--accent-yellow);
  color: var(--text-dark);
  border: 3px solid var(--border-dark);
  border-radius: 10px;
  cursor: pointer;
  box-shadow: 4px 4px 0 var(--border-dark);
  transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.btn-primary:hover {
  transform: translate(-3px, -3px);
  background: var(--accent-teal);
  box-shadow: 7px 7px 0 var(--border-dark), -3px -3px 0 var(--accent-pink);
}
```

### Form Inputs
```css
.input {
  font-family: var(--font-ui);
  font-size: 1rem;
  padding: 0.9rem 1.2rem;
  border: 3px solid var(--border-dark);
  border-radius: 10px;
  background: #FFF;
  color: var(--text-dark);
  box-shadow: 4px 4px 0 var(--border-dark);
  transition: all 0.2s ease;
}

.input:focus {
  border-color: var(--accent-pink);
  box-shadow: 4px 4px 0 var(--accent-pink);
  outline: none;
}
```

### Section Titles
```css
.section-title {
  font-family: var(--font-display);
  font-size: 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.section-title::after {
  content: '';
  flex: 1;
  height: 3px;
  background: var(--border-dark);
}
```

### Dashed Separators
```css
.separator {
  border-bottom: 3px dashed var(--border-dark);
}
```

### Tags / Badges
```css
.tag {
  font-family: var(--font-ui);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: 0.25rem 0.6rem;
  background: var(--accent-green);
  border: 2px solid var(--border-dark);
  border-radius: 4px;
}
```

### Background Pattern (dot grid)
```css
body::before {
  content: '';
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  background-image:
    radial-gradient(circle, rgba(28, 17, 31, 0.08) 1px, transparent 1px);
  background-size: 24px 24px;
  pointer-events: none;
  z-index: -1;
}
```

### Transition Timing
```css
/* Standard interactive elements */
transition: all 0.2s ease;

/* Bouncy buttons and cards */
transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);

/* Smooth content reveals */
transition: all 0.25s ease;
```

## Logo & Assets

| Asset | Path | Usage |
|-------|------|-------|
| SVG Favicon | `/assets/favicon.svg` | Browser tab icon (main site) |
| Layout Favicon | `/layout/assets/favicon.png` | Browser tab icon (layout tool) |
| Robot Mascot | `/assets/bg1.png` | Hero section, optional tool headers |
| Color Palette | `/assets/color_palette.png` | Reference image with brand colors |
| Layout Logo | `/layout/assets/logga.jpg` | Layout tool specific logo |

---

## Colors & UI in the Layout Tool

> How the PNP Buddy brand is applied in the Layout Tool using **Tailwind CSS v4** and custom component patterns.

### Tailwind v4 Theme Tokens

All colors and fonts are registered as Tailwind theme tokens inside a `<style type="text/tailwindcss">` block (no build step — Tailwind v4 CDN). This gives every token a matching utility class *and* a CSS custom property.

```css
@theme {
  /* Fonts */
  --font-display: "Bungee", cursive, sans-serif;
  --font-body:    "Averia Serif Libre", serif;
  --font-ui:      "Inter", system-ui, -apple-system, sans-serif;

  /* Colors */
  --color-theme-bg:     #ECF0DD;   /* page background       */
  --color-theme-dark:   #1C111F;   /* text, borders          */
  --color-theme-muted:  #554B59;   /* secondary text         */
  --color-theme-pink:   #DF2CD4;   /* accents, errors        */
  --color-theme-teal:   #3DDDB2;   /* success, back-cards    */
  --color-theme-yellow: #F7E517;   /* CTA, active controls   */
  --color-theme-indigo: #4E63C5;   /* links, info, fronts    */
  --color-theme-green:  #9EEA84;   /* tags, badges           */
}
```

| Tailwind Utility | CSS Variable | Role in the Layout Tool |
|---|---|---|
| `bg-theme-bg` | `--color-theme-bg` | Outer page background |
| `bg-white` | — | Card / bento-box surfaces |
| `text-theme-dark`, `border-theme-dark` | `--color-theme-dark` | All text, borders, and hard shadows |
| `text-theme-muted` | `--color-theme-muted` | Inactive segmented options, secondary labels |
| `bg-theme-yellow` | `--color-theme-yellow` | Active segmented option fill, default checked checkbox fill, primary buttons |
| `bg-theme-pink` | `--color-theme-pink` | Generate PDF button, crosshair/border section accents, error mode badge, focus rings |
| `bg-theme-teal` | `--color-theme-teal` | Active mode indicator, success toasts, back-dropzone hover |
| `bg-theme-indigo` | `--color-theme-indigo` | Front-dropzone hover, info toasts, filename preview text, prefix checkbox accent |
| `bg-theme-green` | `--color-theme-green` | Tags / badges (reserved) |

### Semantic Color Roles

Colors are **never arbitrary** — each has a fixed semantic role in the UI:

| Semantic Role | Token(s) | Where Used |
|---|---|---|
| **Primary Action** | `theme-yellow` | Generate button (secondary), active segmented options, primary buttons |
| **Destructive / Accent** | `theme-pink` | Generate PDF button (primary), error badges, crosshair/border checkboxes, delete buttons |
| **Success / Affirmative** | `theme-teal` | Active mode indicator, success toasts, back-dropzone hover accent |
| **Informational** | `theme-indigo` | Front-dropzone hover, info toasts, preset/paper icons, filename preview, prefix checkbox |
| **Disabled** | `#E2E8F0` bg, `opacity: 0.7` | Disabled inputs — grey background with `cursor: not-allowed` |
| **Focus** | `theme-pink` border + shadow | All inputs/selects/color pickers on `:focus` |

### Custom Component: Neo-Brutalist Checkbox

A fully custom checkbox that strips native appearance and provides branded visuals with hover/active micro-animations.

```css
/* Base — white box with hard shadow */
input[type="checkbox"]:not(.sr-only):not(.hidden) {
  appearance: none;
  width: 1.25rem;
  height: 1.25rem;
  border: 1.5px solid var(--color-theme-dark);
  border-radius: 0.375rem;
  background-color: #ffffff;
  box-shadow: 2px 2px 0 var(--color-theme-dark);
  cursor: pointer;
  display: inline-grid;
  place-content: center;
  transition: all 0.15s ease;
}

/* Hover — lifts 1px */
input[type="checkbox"]:not(.sr-only):not(.hidden):hover {
  transform: translate(-1px, -1px);
  box-shadow: 3px 3px 0 var(--color-theme-dark);
}

/* Active — presses down */
input[type="checkbox"]:not(.sr-only):not(.hidden):active {
  transform: translate(0px, 0px);
  box-shadow: 1px 1px 0 var(--color-theme-dark);
}

/* Checkmark (clip-path polygon) */
input[type="checkbox"]:not(.sr-only):not(.hidden)::before {
  content: "";
  width: 0.65rem;
  height: 0.65rem;
  transform: scale(0);
  transition: 120ms transform ease-in-out;
  background-color: #ffffff;
  clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
}

input[type="checkbox"]:not(.sr-only):not(.hidden):checked::before {
  transform: scale(1);
}
```

**Accent classes** control the checked fill color:

| Class | Checked Color | Used By |
|---|---|---|
| `.accent-theme-pink` | `var(--color-theme-pink)` | Crosshair & border checkboxes |
| `.accent-theme-indigo` | `var(--color-theme-indigo)` | Prefix page-size checkbox |
| *(none / default)* | `var(--color-theme-yellow)` | Fallback for any other checkbox |

**HTML usage:**
```html
<label class="flex items-center gap-2 cursor-pointer">
  <input type="checkbox" id="frontCheckbox" checked class="accent-theme-pink" /> Front
</label>
```

### Custom Component: Segmented Control

A pill-shaped toggle bar that replaces native `<select>` dropdowns and radio buttons with a tactile segmented control.

**Structure:** A row of `<button>` elements inside a styled container, backed by a hidden `<select>` or `<input type="radio">` for JS compatibility.

```css
/* Container */
.segmented-container {
  /* Tailwind: inline-flex p-0 bg-white border-2 border-theme-dark rounded-xl gap-1 h-[2rem] items-center */
  box-shadow: 2px 2px 0 var(--color-theme-dark);
}

/* Active option */
.segmented-option:has(input:checked) {          /* radio-based variant */
  background-color: var(--color-theme-yellow);
  color: var(--color-theme-dark);
  border: 1.5px solid var(--color-theme-dark);
}

/* Inactive option */
.segmented-option:not(:has(input:checked)) {
  color: var(--color-theme-muted);
  border: 2px solid transparent;
}

/* Inactive hover */
.segmented-option:hover:not(:has(input:checked)) {
  background-color: rgba(255, 255, 255, 0.6);
}
```

For button-based variants (page size, orientation, corner radius, fold preference), the active button receives:
- `bg-theme-yellow border-[1.5px] border-theme-dark`

Inactive buttons receive:
- `text-theme-muted hover:bg-black/5`

**Segmented controls in use:**

| ID | Options | Drives |
|---|---|---|
| `pageSizeSegmented` | A4 · Letter · ⚙ Custom | `#pageSize` hidden select |
| `pageOrientationSegmented` | Portrait · Landscape (icons) | `#pageOrientation` hidden select |
| `autoGridSegmented` | 🔓 Manual · 🔒 Auto | `#autoGrid` hidden checkbox |
| `cornerRadiusSegmented` | None · S · M · L · XL | `#cornerRadius` hidden select |
| Layout mode (radio) | Double-Sided (Grid) · One-Sided (Fold) | `doubleSided` / `foldable` radios |
| Unit toggle (radio) | mm · in | `globalUnit` radios |

**HTML example (button-based):**
```html
<div class="inline-flex p-0 bg-white border-2 border-theme-dark rounded-xl
            shadow-[2px_2px_0_var(--color-theme-dark)] gap-1 h-[2rem] items-center"
     id="pageSizeSegmented">
  <button type="button" data-val="A4"
    class="btn-page-size font-bold px-2.5 h-full rounded-[10px] text-sm transition-all
           bg-theme-yellow border-[1.5px] border-theme-dark flex items-center">
    A4
  </button>
  <button type="button" data-val="Letter"
    class="btn-page-size font-bold px-2.5 h-full rounded-[10px] text-sm transition-all
           text-theme-muted hover:bg-black/5 flex items-center">
    Letter
  </button>
</div>
```

### Custom Component: Mode Indicator Badges

State badges for the "Back Configuration" panel. Each badge transitions between three visual states.

```css
/* Inactive — neutral white */
.mode-indicator.inactive {
  background-color: #ffffff;
  border-color: #d1d5db;
  color: var(--color-theme-muted);
}

/* Active — teal fill with hard shadow */
.mode-indicator.active {
  background-color: var(--color-theme-teal);
  border-color: var(--color-theme-dark);
  color: var(--color-theme-dark);
  box-shadow: 2px 2px 0 var(--color-theme-dark);
}

/* Error — pink fill, white text */
.mode-indicator.error {
  background-color: var(--color-theme-pink);
  border-color: var(--color-theme-dark);
  color: white;
  box-shadow: 2px 2px 0 var(--color-theme-dark);
}
```

**HTML:**
```html
<div id="mode1" class="mode-indicator inactive px-3 py-1.5 border-2 rounded-lg
     flex items-center justify-between text-xs font-bold transition-all">
  <span>No backs</span>
  <i class="fa-solid fa-ban text-sm opacity-60"></i>
</div>
```

### Custom Component: Toast Notifications & Modals

All user feedback uses the `NotificationSystem` class (`notifications.js`). No native `alert()` / `confirm()` / `prompt()` calls.

**Toast types:**

| Type | Background | Text |
|---|---|---|
| `success` | `bg-theme-teal` | `text-theme-dark` |
| `error` | `bg-theme-pink` | `text-theme-dark` |
| `info` (default) | `bg-theme-indigo` | `text-white` |

All toasts share: `rounded-xl border-3 border-theme-dark shadow-[4px_4px_0_var(--color-theme-dark)]`, animated in with `translate-y` + `opacity` transitions.

**Confirm / Prompt modals** use the same card aesthetic:
- Overlay: `bg-black/40 backdrop-blur-sm`
- Dialog: `bg-white border-3 border-theme-dark rounded-2xl shadow-[6px_6px_0_var(--color-theme-dark)]`
- Title badge: `bg-theme-yellow border-2 border-theme-dark` with a Font Awesome icon
- Buttons: `btn-secondary` for cancel, `btn-primary` (pink variant) for confirm

**Usage:**
```js
// Toast
Toast.show('Settings saved!', 'success');
Toast.show('Invalid file count', 'error');

// Confirm dialog
Toast.confirm('Reset all settings?', () => { /* on confirm */ });

// Prompt dialog
Toast.prompt('Enter a name:', (value) => { /* on submit */ }, 'Save Preset');
```

### Custom Component: Collapsible Accordion

Used for the settings panel collapse/expand toggle (`#settingsContent`).

```css
/* Expanded (default) */
.collapsible-wrapper {
  display: grid;
  grid-template-rows: 1fr;
  transition: grid-template-rows 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              opacity 0.25s ease;
  opacity: 1;
}

/* Collapsed */
.collapsible-wrapper.collapsed {
  grid-template-rows: 0fr;
  opacity: 0;
  pointer-events: none;
}

.collapsible-inner {
  overflow: hidden;
}
```

The toggle button (`#toggleSettingsCollapse`) rotates its chevron icon and swaps the label between "Hide" / "Show".

### Custom Component: Dropzones

Neo-brutalist file upload areas with per-zone hover accents.

```css
.dropzone-neo {
  /* Tailwind: border-2 border-dashed border-theme-dark bg-white rounded-lg p-3
               text-center cursor-pointer transition-all min-h-[90px] */
  box-shadow: 3px 3px 0 var(--color-theme-dark);
  position: relative;  /* file input is absolutely positioned over it */
}

.dropzone-neo:hover {
  transform: translate(-0.5px, -0.5px);  /* subtle lift */
}

/* Front dropzone hover — indigo accent */
#frontDropzone:hover {
  border-color: var(--color-theme-indigo);
  box-shadow: 4px 4px 0 var(--color-theme-indigo);
}

/* Back dropzone hover — teal accent */
#backDropzone:hover {
  border-color: var(--color-theme-teal);
  box-shadow: 4px 4px 0 var(--color-theme-teal);
}
```

Each dropzone contains a Font Awesome icon colored to its accent (`text-theme-indigo` for fronts, `text-theme-teal` for backs).

### Bento Box Cards

The primary container pattern used throughout the layout tool.

```css
.bento-box {
  /* Tailwind: bg-white border-3 border-theme-dark rounded-xl p-4 md:p-5 mb-5 */
  box-shadow: 4px 4px 0 var(--color-theme-dark);
}
```

Inside each bento-box, related groups are organised in a responsive grid:
```css
.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.25rem;
}
```

Sub-sections within a grid cell use a lighter border against the page background:
```
border-3 border-theme-bg rounded-xl p-4
```

### Buttons

Two tiers, both with the tactile lift-on-hover pattern:

| Class | Background | Shadow | Hover Effect |
|---|---|---|---|
| `.btn-primary` | `bg-theme-yellow` | `4px 4px 0` dark | Lifts `−1px, −1px`, shadow grows to `6px` |
| `.btn-secondary` | `bg-white` | `2px 2px 0` dark | Lifts `−0.5px, −0.5px`, shadow grows to `3px` |

Special case: the **Generate PDF** button uses `bg-theme-pink text-white` with Display font.

### Form Inputs

All `input[type="number"]`, `input[type="text"]`, and `select` elements share:

```css
border: 1.5px solid var(--color-theme-dark);
border-radius: 0.375rem;
padding: 0 0.45rem;
height: 2rem;
font-size: 0.875rem;
font-family: var(--font-ui);
box-sizing: border-box;
```

**Focus state** (all form controls):
```css
outline: none;
border-color: var(--color-theme-pink);
box-shadow: 2px 2px 0 var(--color-theme-pink);
```

**Disabled state:**
```css
background-color: #E2E8F0;
color: var(--color-theme-muted);
border-color: rgba(28, 17, 31, 0.3);
opacity: 0.7;
cursor: not-allowed;
```

Number inputs additionally hide native spinners and center their text.

### Color Pickers

Styled to match the form input system:

```css
input[type="color"] {
  appearance: none;
  border: 1.5px solid var(--color-theme-dark);
  border-radius: 0.375rem;
  height: 2rem;
  width: 3rem;
  padding: 2px;
  box-shadow: 1px 1px 0 var(--color-theme-dark);
}
```

### Progress Bar

Used during PDF generation:

```html
<progress class="w-full h-4 rounded-full overflow-hidden border-2 border-theme-dark
  [&::-webkit-progress-bar]:bg-white
  [&::-webkit-progress-value]:bg-theme-teal">
</progress>
```

### Custom Scrollbar (Preview Panel)

```css
.preview-pairs-container::-webkit-scrollbar-track {
  background: var(--color-theme-bg);
  border: 1px solid var(--color-theme-dark);
}
.preview-pairs-container::-webkit-scrollbar-thumb {
  background: var(--color-theme-indigo);
  border-radius: 4px;
}
```
