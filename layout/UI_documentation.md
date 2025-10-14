# UI Documentation for the "Layout" Tool

This document provides a detailed breakdown of the user interface for the "Layout" tool. It is intended to assist a UI developer in reconstructing the interface based on the existing HTML structure, JavaScript behavior, and CSS styling.

As I do not have access to the commit history, I am unable to provide a changelog.

## Overall Structure

The UI is built on a single HTML page (`index.html`) and is organized into the following main sections:

1.  **Header:** Contains the application title and navigation links.
2.  **File Dropzones:** Two distinct areas for uploading front and back card images.
3.  **Mode Indicator:** Visual cues that show the current card back mode (no backs, same back, unique backs).
4.  **Layout Mode Toggle:** Radio buttons to switch between "Double-Sided (Grid)" and "Single-Page (Foldable)" layouts.
5.  **"Double-Sided (Grid)" UI:** A collection of settings specific to the grid-based layout. This is the default view.
6.  **"Single-Page (Foldable)" UI:** A collection of settings for the foldable layout. This view is hidden by default.
7.  **Footer:** Contains the "Generate PDF" button, a loader animation, and links for feedback and support.

The layout is responsive and uses a container-based design to group related elements.

## 1. Header

- **HTML:** A `div` with the class `header`.
- **Content:**
  - A link to the homepage with a "house" icon from Font Awesome.
  - An `h1` element for the title: "Card layout tool v2.0".
  - A link to an instructions page with a "question circle" icon from Font Awesome.
- **Styling:**
  - Uses Flexbox to space out the elements.
  - The title is centered.

## 2. File Dropzones

- **HTML:** Two `div` elements with the class `dropzone`, contained within a `div` with the class `form-group`.
- **Content:**
  - Labels: "Fronts" and "Backs".
  - A file input element (`<input type="file">`) for each dropzone, accepting `.png`, `.jpg`, and `.jpeg` files.
  - A paragraph element to display the number of selected files (`fileCount` and `fileCountBack`).
- **Behavior (`layout-ui.js`):**
  - The `updateFileCount` function updates the text to show how many files are selected.
  - The `updateModeIndicator` function is called when files are selected to change the mode images.
- **Styling:**
  - A dashed border that changes color on hover.
  - The file input is transparent, making the entire dropzone clickable.

## 3. Mode Indicator

- **HTML:** A `div` with the classes `form-group` and `mode`.
- **Content:**
  - Three images (`mode1.jpg`, `mode2.jpg`, `mode3.jpg`) representing the different card back modes:
    1.  **No backs:** No back images are provided.
    2.  **Same backs:** One back image is provided for all fronts.
    3.  **Unique backs:** One back image is provided for each front image.
- **Behavior (`layout-ui.js`):**
  - The `updateModeIndicator` function changes the `src` of the images to `mode1on.jpg`, `mode2on.jpg`, or `mode3on.jpg` to indicate the active mode based on the number of front and back files selected. Error images (`mode1error.jpg`, etc.) are shown if the number of back files is incorrect.

## 4. Layout Mode Toggle

- **HTML:** A `div` with the class `box settings`.
- **Content:**
  - Two radio buttons (`doubleSided` and `foldable`) with corresponding labels.
- **Behavior (`layout-ui.js`):**
  - The `toggleModeUI` function shows or hides the `doubleSidedModeUI` and `foldableModeUI` divs based on which radio button is selected.

## 5. Footer

- **HTML:** A `div` with the class `foot`.
- **Content:**
  - A "Generate PDF" button.
  - A "Leave feedback" button.
  - A "Buy me a coffee" link with an image.
  - A loader animation (a `div` with the class `sk-circle`), which is hidden by default.
- **Behavior:**
  - The "Generate PDF" button triggers the `generatePDF` function in `layout-pdf.js`.
  - The loader is shown when the PDF generation process starts.

## 6. "Double-Sided (Grid)" UI (`doubleSidedModeUI`)

This is the main interface for the grid-based layout and is visible by default.

### 6.1. Page Size

- **HTML:** A `div` with the class `box`.
- **Content:**
  - Radio buttons for page size selection: "A4", "A4 Landscape", "Letter", and "Letter Landscape".
  - Each radio button is associated with an image that acts as its label.
- **Styling:**
  - The radio buttons themselves are hidden. The images are styled to indicate the selected option with a border.

### 6.2. Presets

- **HTML:** A `div` with the classes `box` and `preset`.
- **Content:**
  - A dropdown menu (`<select id="preset">`) with predefined settings for different card and layout sizes.
- **Behavior (`layout-ui.js`):**
  - The `applyPreset` function is triggered on change. It populates the "Basic settings" fields with the values from the selected preset.

### 6.3. Basic Settings

- **Grid Layout:**
  - **HTML:** A `div` with the classes `form-group` and `basic`.
  - **Content:** Number inputs for "Rows" and "Columns".
- **Measurements:**
  - **HTML:** A `div` with the classes `form-group` and `basic`.
  - **Content:** Number inputs for "Card width", "Card height", and "Bleed" (all in mm).

### 6.4. Advanced Settings

- **Crosshair Settings:**
  - **HTML:** A `div` with the classes `form-group` and `advanced`.
  - **Content:**
    - Checkboxes to enable crosshairs on the "Front" and "Back".
    - Number inputs for "Line width" and "Size".
    - A color picker for the "Color".
- **Border Settings:**
  - **HTML:** A `div` with the classes `form-group` and `advanced`.
  - **Content:**
    - Checkboxes to enable borders on the "Front" and "Back".
    - Number inputs for "Border width".
    - A color picker for the "Color".
    - A dropdown for "Corner Radius".

## 7. "Single-Page (Foldable)" UI (`foldableModeUI`)

This interface is for the foldable layout and is hidden by default. It becomes visible when the "Single-Page (Foldable)" radio button is selected. All element IDs in this section are prefixed with `foldable_`.

### 7.1. Page Size

- **HTML:** A `div` with the class `box`.
- **Content:**
  - Radio buttons for "A4" and "Letter" page sizes.
- **Styling:**
  - Similar to the double-sided UI, the radio buttons are hidden, and images are used as labels.

### 7.2. Card & Margin Settings

- **Card Dimensions:**
  - **HTML:** A `div` with the classes `form-group` and `basic`.
  - **Content:** Number inputs for "Width" and "Height".
- **Page Margins:**
  - **HTML:** A `div` with the classes `form-group` and `basic`.
  - **Content:** Number inputs for "Printer" and "Folding" margins.
- **Card Spacing:**
  - **HTML:** A `div` with the classes `form-group` and `basic`.
  - **Content:** Number inputs for "Card" and "Cut" margins.

### 7.3. Advanced Foldable Settings

- **Border:**
  - **HTML:** A `div` with the classes `form-group` and `advanced`.
  - **Content:**
    - Number inputs for "Outer" and "Inner" border widths.
    - Color pickers for "Front Color" and "Back Color".
- **Layout:**
  - **HTML:** A `div` with the classes `form-group` and `advanced`.
  - **Content:**
    - A dropdown to select the "Fold" line preference ("Auto", "Vertical", "Horizontal").
    - A dropdown for "Corner Radius".

## 8. UI Behavior (`layout-ui.js` and `foldable-layout-ui.js`)

The UI's interactivity is primarily handled by two JavaScript files:

- **`layout-ui.js`:** Manages the main UI, including the double-sided mode.
  - **`init()`:** Sets up all the event listeners.
  - **`toggleModeUI()`:** Switches between the double-sided and foldable UI sections.
  - **`applyPreset()`:** Populates settings from the selected preset.
  - **`updateModeIndicator()`:** Changes the mode images based on file selection.
  - **`updateFileCount()`:** Updates the file count text.
  - **`getSettings()`:** Collects all the settings from the double-sided UI to be used for PDF generation.
- **`foldable-layout-ui.js`:** Manages the foldable mode UI.
  - **`getSettings()`:** Collects all the settings from the foldable UI.

## 9. Styling (`style.css`)

The look and feel of the application are defined in `style.css`.

- **Layout:**
  - A `container` class is used for the main content blocks, providing a consistent width, padding, and a subtle shadow.
  - Flexbox is used extensively for alignment and spacing within the `header`, `form-group`, and `foot` elements.
- **Controls:**
  - Buttons, inputs, and dropdowns have a consistent style with rounded corners and hover effects.
  - Radio buttons for page size are hidden, and their corresponding `label` (containing an `img`) is styled to show the selection.
- **Dropzones:**
  - Have a dashed border that changes color on hover to indicate they are interactive.
- **Icons:**
  - Font Awesome is used for icons, providing a clean and modern look.
