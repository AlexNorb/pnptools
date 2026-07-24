# Layout Tool — Roadmap

> Master plan for the Layout Tool rewrite. Read this first before working on any phase.
> Last updated: 2026-07-24

## Overview

The Layout Tool (Card Layout Tool v2.1) is a web-based Print-and-Play tool that generates printable PDFs from card images. It lives at `/layout` within the PNP Buddy project.

This roadmap describes three sequential phases of work. **Each phase must be completed and verified before moving to the next.**

## Phases

```
Phase 1: Preview Integration (FUNCTIONAL)
   ↓
Phase 2: Code Refactoring (QUALITY)
   ↓
Phase 3: UI/UX Overhaul (VISUAL)
```

| Phase | Doc | Goal | Status |
|-------|-----|------|--------|
| 1 | [PHASE-1-PREVIEW-INTEGRATION.md](PHASE-1-PREVIEW-INTEGRATION.md) | Integrate preview into main UI, remove iframe | `COMPLETED` |
| 2 | [PHASE-2-REFACTORING.md](PHASE-2-REFACTORING.md) | Eliminate code duplication, fix code smells | `COMPLETED` |
| 3 | [PHASE-3-UI-OVERHAUL.md](PHASE-3-UI-OVERHAUL.md) | Total visual redesign with PNP Buddy branding | `NOT STARTED` |

## Key Principles

1. **Don't break existing functionality.** The tool is in active use. All changes must preserve existing PDF generation behavior.
2. **Functionality first, then cleanup, then visuals.** This order was explicitly chosen by the project owner.
3. **No thumbnails in dropzone.** Users upload hundreds of images — thumbnails in the dropzone area would be overwhelming. The preview panel is a separate section.
4. **Preview is always available.** The preview panel is a standard feature (not "advanced"), but users can show/hide it since it takes up space.
5. **Presets via JSON.** The preset system should remain simple — a JSON file that the owner can edit manually to add new presets.

## Reference Documents

- [ARCHITECTURE.md](ARCHITECTURE.md) — Current codebase architecture and file responsibilities
- [BRANDING.md](BRANDING.md) — Brand colors, fonts, and design language (for Phase 3)
- [../TODO.md](../TODO.md) — Living TODO list (update as work progresses)
- [../UI_documentation.md](../UI_documentation.md) — Existing UI documentation

## How to Work on This Project

1. **Read this ROADMAP.md first** to understand the overall plan.
2. **Read ARCHITECTURE.md** to understand the current codebase.
3. **Read the specific phase document** for the phase you're working on.
4. **Update TODO.md** as you complete tasks.
5. **Update phase status** in this file when a phase is complete.
6. **Test all three back-modes** after any change: no backs, same back, unique backs.
7. **Test both layout modes** after any change: double-sided grid and foldable.
