# Project To-Dos & Features

## High Priority

- File settings:
  - Thumbnail preview for uploaded images
  - Ability to reorder images
  - Specify number of copies for each image
- File load onchange:

  - Goal: Improve Responsiveness and Enable Image Previews
    The main objective is to change when we process the user's selected image files to make the application feel faster and to lay the groundwork for new features.

    Current Process:

    The user selects front and back images.
    The user clicks the "Generate PDF" button.
    Only then does the application start reading all the selected image files from the disk.
    Once the files are read, they are sent to be processed into a PDF.
    This process creates a noticeable delay after the user clicks the button, as they have to wait for all files to be read before the actual PDF creation begins.

    Proposed New Process:

    The user selects front and back images.
    Immediately upon selection, the application will read the files in the background and store the image data in memory.
    The user clicks the "Generate PDF" button.
    The application can instantly use the pre-loaded image data to start creating the PDF.
    Key Benefits of this Change:

    Improved Perceived Performance: The "Generate PDF" button will feel much more responsive because the time-consuming file-reading step has already been completed.
    Enables Thumbnail Previews: Because the image data is available right after selection, we can now easily display small preview thumbnails to the user, giving them immediate visual confirmation of their choices.
    Early Error Handling: We can check for invalid file types (e.g., a user selecting a text file instead of an image) right away and provide instant feedback, rather than waiting until the final generation step.
    In short, we want to shift the file-reading work from the "generate" step to the "selection" step. This decouples the two actions, leading to a significantly better and more interactive user experience.

## Medium Priority

- Presets:
  - Add more default presets for common paper/card sizes
  - Allow users to save their own personal presets
  - Automatically store and load the last used settings
- General UI/UX update

## Low Priority

-

## Completed

- Add a visual progress bar during PDF generation

## Ideas & Feature Requests

-
