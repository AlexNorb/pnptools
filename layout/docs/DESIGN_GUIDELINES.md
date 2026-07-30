# PNP Tools Design Guidelines (Bento-Neobrutalism)

> This document serves as the single source of truth for the aesthetic direction of all PNP tools. It combines the fun, high-contrast branding of PNP Buddy with a modern, functional Bento-box UI. Future AI agents must follow these guidelines when creating or modifying tools.

## 1. Core Aesthetic: "Modern Neobrutalism"
The design should feel tactile, fun, and highly functional. We use thick borders, hard shadows, and high-contrast colors, but we organize the information cleanly in a "Bento-box" grid layout so it doesn't feel overwhelming.

- **Thick Borders**: Standardize on 2px or 3px solid dark borders.
- **Hard Shadows**: Instead of soft blurs, use hard offset shadows (e.g., `4px 4px 0 #1C111F`).
- **Tactile Hover States**: Elements should physically move (translate) when hovered or clicked, simulating physical buttons.

## 2. Color Palette (Tailwind v4 Theme)

The colors are mapped to semantic roles. Do not use random colors; stick to this palette.

| Role | Color | Hex | Tailwind Utility |
|------|-------|-----|------------------|
| **Background** | Light Cream/Olive | `#ECF0DD` | `bg-theme-bg` |
| **Surface/Cards** | Pure White | `#FFFFFF` | `bg-white` |
| **Text & Borders**| Ink Black | `#1C111F` | `text-theme-dark`, `border-theme-dark` |
| **Text Muted** | Dark Muted Purple | `#554B59` | `text-theme-muted` |
| **Primary Action**| Vibrant Yellow | `#F7E517` | `bg-theme-yellow` |
| **Success/Teal** | Mint Teal | `#3DDDB2` | `bg-theme-teal` |
| **Error/Pink** | Hot Pink | `#DF2CD4` | `bg-theme-pink` |
| **Info/Indigo** | Bright Indigo | `#4E63C5` | `bg-theme-indigo` |

## 3. Typography
- **Display**: `'Bungee', cursive`
  - Use for: App Titles, Tool Headers. (Use sparingly).
- **UI/Body**: `'Inter', system-ui, sans-serif`
  - Use for: Everything else (Labels, Inputs, Buttons, Descriptions, Values).
  - Weights: Regular (400) for body, Medium (500) for labels, Bold (700) for emphasis.

## 4. UI Patterns & Components

### Layout (Bento Grid)
- Group related settings into visually distinct cards (Bento boxes).
- Cards should have `bg-white`, `border-3`, `border-theme-dark`, `rounded-xl`, and a hard shadow `shadow-[4px_4px_0_var(--color-theme-dark)]`.

### Buttons
- **Primary**: Yellow background. On hover, translate up and left (`-translate-x-1 -translate-y-1`) and increase the shadow offset to create a 3D pop effect.
- **Secondary**: White background, same hover effect.

### Inputs & Forms
- Inputs should have thick dark borders and rounded corners.
- On focus, the border should NOT become a generic blue outline. Instead, use an accent color (e.g., Pink or Indigo) and change the shadow to match.

### Modals & Toasts
- No `alert()`. Use custom Toast notifications positioned at the bottom right.
- Toasts should use the same card styling (thick border, hard shadow) and be color-coded (Teal for success, Pink for error).

## 5. Technical Implementation (Tailwind v4)
When building UIs, define the theme in CSS using Tailwind v4 `@theme`:

```css
@import "tailwindcss";

@theme {
  --font-display: "Bungee", cursive;
  --font-ui: "Inter", sans-serif;

  --color-theme-bg: #ECF0DD;
  --color-theme-dark: #1C111F;
  --color-theme-muted: #554B59;
  --color-theme-pink: #DF2CD4;
  --color-theme-teal: #3DDDB2;
  --color-theme-yellow: #F7E517;
  --color-theme-indigo: #4E63C5;
  --color-theme-green: #9EEA84;
}
```

By adhering to this guide, all PNP tools will maintain a consistent, recognizable, and user-friendly interface.
