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
