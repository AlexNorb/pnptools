# PNP Buddy Tools

This repository hosts a collection of web-based tools designed to help users with tasks related to Print and Play (PNP) game creation. These tools aim to simplify common preparation steps for game components.

## Tools

### PDF Alignment Tool

This tool allows you to shift the content of pages within a PDF document. This is particularly useful for correcting alignment issues before printing.

**Key Features:**

- Upload a PDF file.
- Specify horizontal (X-axis) and vertical (Y-axis) shift amounts in millimeters.
- Choose to apply the shift to only odd pages or only even pages.
- Download the modified PDF with the content shifted.

**Access the tool:** [PDF Alignment Tool](./align%201.1%20wip/index.html)

### Card Layout Tool

This tool helps you arrange images into a grid layout on standard page sizes (A4, Letter) for printing game cards. It supports duplex printing by allowing separate image sets for fronts and backs.

**Key Features:**

- Upload front images and (optionally) back images (supports PNG and JPG).
- Handles three modes for back images: no backs, a single repeating back, or unique backs for each front.
- Select page size (A4, Letter, and landscape versions).
- Define a grid layout (rows and columns).
- Set card dimensions (width and height in mm) and bleed area.
- Optionally add crosshairs for cutting guides (customizable size, width, and color).
- Optionally add borders around cards (customizable width and color).
- Includes presets for common card sizes (e.g., Standard card 63x88mm).
- Download the layout as a PDF file.

**Access the tool:** [Card Layout Tool](./layout%20-%20prettier%20-%201.71%20wip/index.html)

## To Do / Improvement Suggestions

This is a list of potential improvements and tasks to enhance the tools in this repository:

### General

- **Shared JavaScript Library:** Consolidate common JavaScript functions (e.g., file handling, PDF library interactions if applicable across tools) into a shared library to reduce code duplication and improve maintainability.
- **Code Quality:**
  - Implement linting (e.g., ESLint) to enforce consistent code style.
  - Ensure consistent code formatting (e.g., Prettier) across all JavaScript files.
- **Error Handling:** Review and improve error handling in JavaScript. Provide more specific and user-friendly error messages and feedback mechanisms within the UI.

### PDF Alignment Tool (`align 1.1 wip`)

### Card Layout Tool (`layout - prettier - 1.71 wip`)

- **JavaScript Versioning:** The main tool uses `layout_1.72.js`, while the `instructions/index.html` page links to `layout_1.71.js`. Verify if the instructions are up-to-date or if `layout_1.71.js` is an older, possibly unused file. Ensure consistency and remove any obsolete files.
- **Preset Functionality:** The `preset.js` file is loaded in `index.html`. Thoroughly review its functionality and ensure it's working as intended and is well-integrated with the layout tool's options.
- **Notifications:** Replace native browser `alert()` calls with more user-friendly notifications integrated into the UI. This will provide a less disruptive user experience.
- **Debugging Logs:** Remove or conditionally disable `console.log` statements for production versions of the tool to avoid cluttering the browser console for end-users.
