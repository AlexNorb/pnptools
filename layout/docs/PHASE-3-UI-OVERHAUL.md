# Phase 3 — UI/UX Overhaul

> **Status:** `NOT STARTED`
> **Prerequisite:** Phase 2 complete
> **Goal:** Total visual redesign to match PNP Buddy branding. Replace `alert()` with toast notifications. Make responsive and accessible.

## Context

After Phase 1 (functionality) and Phase 2 (code quality), the tool will be functionally complete and well-structured. Phase 3 gives it the visual treatment it deserves — matching the landing page design language.

**After this phase:** A polished, branded, responsive tool that looks and feels professional.

## Branding Reference

Source: Landing page at `/index.html` + `/style.css` + `/assets/color_palette.png`

### Color Tokens

```css
:root {
  --bg-color: #ECF0DD;        /* Warm off-white/sage background */
  --text-dark: #1C111F;        /* Near-black text */
  --text-muted: #554b59;       /* Muted text */
  --accent-pink: #DF2CD4;      /* Primary accent — magenta/pink */
  --accent-teal: #3DDDB2;      /* Secondary accent — teal */
  --accent-yellow: #F7E517;    /* CTA / buttons — bright yellow */
  --accent-indigo: #4E63C5;    /* Links / info — indigo */
  --accent-green: #9EEA84;     /* Tags / success — light green */
  --card-bg: #FFFFFF;          /* Card backgrounds */
  --border-dark: #1C111F;      /* Borders — same as text */

  /* Extended palette from color_palette.png */
  --olive: #AEBA30;
  --deep-teal: #327570;
  --warm-brown: #805B50;
}
```

### Typography

```css
:root {
  --font-display: 'Bungee', cursive, sans-serif;          /* Headings, brand text */
  --font-body: 'Averia Serif Libre', serif;                /* Body text */
  --font-ui: 'Inter', system-ui, -apple-system, sans-serif; /* UI controls, labels */
}
```

Google Fonts import:
```css
@import url('https://fonts.googleapis.com/css2?family=Averia+Serif+Libre:ital,wght@0,300;0,400;0,700;1,400&family=Bungee&family=Inter:wght@400;500;600;700&display=swap');
```

### Design Language

The PNP Buddy visual identity is **neobrutalist print-themed**:

1. **Thick borders:** `3px solid var(--border-dark)` on cards and containers
2. **Hard drop shadows:** `box-shadow: 5px 5px 0 var(--border-dark)` — no blur, solid offset
3. **CMYK hover effects:** Multi-layered shadows with pink + teal offsets
   ```css
   .element:hover {
     transform: translate(-4px, -4px);
     box-shadow:
       8px 8px 0 var(--border-dark),
       12px 12px 0 var(--accent-pink),
       -4px -4px 0 var(--accent-teal);
   }
   ```
4. **Dashed separators:** `border-bottom: 3px dashed var(--border-dark)` between sections
5. **Registration marks:** Crosshair marks in page corners (print theme reference)
6. **Dot grid background:** Subtle radial-gradient pattern on body
7. **Float animation:** Gentle bobbing on mascot/icons
   ```css
   @keyframes float {
     0%, 100% { transform: translateY(0px) rotate(0deg); }
     50% { transform: translateY(-8px) rotate(2deg); }
   }
   ```
8. **Rounded corners:** `border-radius: 14px` on cards, `10px` on inputs
9. **Bouncy transitions:** `cubic-bezier(0.175, 0.885, 0.32, 1.275)` for interactive elements
10. **Yellow CTAs:** Primary action buttons use `var(--accent-yellow)` background with dark text

### Logo

- SVG favicon at `/assets/favicon.svg`
- Robot mascot image at `/assets/bg1.png`
- Layout tool has its own favicon at `/layout/assets/favicon.png`

## Tasks

### 3.1 — Create notification system

**New file:** `notifications.js`

Replace ALL `alert()` calls with a non-blocking toast system:

```javascript
// API
Notify.error("No front images selected.");
Notify.warning("Number of backs must be 0, 1, or the same as fronts.");
Notify.success("PDF generated successfully!");
Notify.info("Processing images...");
```

Requirements:
- Toasts appear in top-right corner, stack vertically
- Auto-dismiss after 5s (errors: 8s)
- Manual dismiss via × button
- Color-coded by type (using brand colors):
  - Error: `--accent-pink` background
  - Warning: `--accent-yellow` background
  - Success: `--accent-green` background
  - Info: `--accent-indigo` background
- Slide-in animation

Files with `alert()` calls to replace:
- `layout-master.js` — worker errors, validation errors
- `layout-ui.js` — preset validation
- `preview-panel.js` (if any remain from Phase 1)

### 3.2 — Apply brand design system

**File:** `style.css` (complete rewrite)

1. Add CSS custom properties (all tokens from Branding section above)
2. Import Google Fonts
3. Apply brand typography to all elements
4. Restyle all containers with thick borders + hard shadows
5. Restyle dropzones to match landing page card style
6. Restyle buttons to match landing page CTA style
7. Restyle form inputs (number, select, color) with brand styling
8. Add dot grid background pattern
9. Add dashed section separators
10. Add bouncy transitions to interactive elements

### 3.3 — Add header with branding

**File:** `index.html`

Replace the current plain `<h1>Card layout tool v2.1</h1>` with a branded header:
- Logo badge (matching landing page style)
- Tool name in `--font-display`
- Optional: back-to-home link

### 3.4 — Make responsive

**File:** `style.css`

Add breakpoints:
```css
/* Mobile: 0-767px */
/* Tablet: 768-1023px */
/* Desktop: 1024px+ */
```

Key responsive changes:
- Form groups stack vertically on mobile
- Dropzones stack vertically on mobile
- Preview panel scrolls horizontally (already does)
- Settings boxes reorganize for narrow screens
- Mode indicators scale down

### 3.5 — Add accessibility

**Files:** `index.html`, `style.css`

- Add ARIA labels to all interactive elements
- Add `role` attributes where needed
- Ensure keyboard navigation works (tab order, enter to activate)
- Add focus-visible styles using brand colors
- Ensure color contrast meets WCAG AA for all text/background combinations
- Add `aria-live="polite"` to progress status

### 3.6 — Dark mode (bonus/optional)

If time allows, add a dark mode toggle:
```css
[data-theme="dark"] {
  --bg-color: #1C111F;
  --text-dark: #ECF0DD;
  --card-bg: #2a1f2e;
  /* ... remap all tokens */
}
```

## Verification

- Visual comparison with landing page — consistent brand feel
- All `alert()` calls replaced with toast notifications
- Responsive layout works on mobile (320px), tablet (768px), desktop (1024px+)
- All functionality still works (PDF generation, presets, preview panel)
- Keyboard navigation works for all controls
- No accessibility warnings in browser dev tools

## Files Changed Summary

| File | Action | Description |
|------|--------|-------------|
| `notifications.js` | NEW | Toast notification system |
| `style.css` | REWRITE | Complete redesign with brand tokens |
| `index.html` | MODIFY | Branded header, ARIA attributes, viewport meta |
| `layout-master.js` | MODIFY | Replace alert() with Notify API |
| `layout-ui.js` | MODIFY | Replace alert() with Notify API |
| `preview-panel.js` | MODIFY | Replace alert() with Notify API (if any) |
