/**
 * Reads a file and returns its content as an ArrayBuffer.
 * @param {File} file The file to read.
 * @returns {Promise<ArrayBuffer>} A promise that resolves with the file's ArrayBuffer.
 */
function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Creates a download link for a blob and triggers the download.
 * @param {Blob} blob The blob to download.
 * @param {string} fileName The name for the downloaded file.
 */
function triggerDownload(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;

  document.body.appendChild(anchor); // Required for Firefox
  anchor.click();

  // Clean up the URL and remove the anchor element after a short delay
  setTimeout(() => {
    URL.revokeObjectURL(url);
    anchor.remove();
  }, 100);
}

async function shiftPDFContent() {
  // Millimeters to PDF points conversion factor (72 points per inch / 25.4 mm per inch)
  const MM_TO_PT = 72 / 25.4;

  const inputFile = document.getElementById("pdfFile");
  const pdfFile = inputFile.files[0];

  if (!pdfFile) {
    Toast.show("Please choose a PDF file first.", "error");
    return;
  }

  const shiftX =
    parseFloat(document.getElementById("shiftX").value.replace(",", ".")) *
    MM_TO_PT;
  const shiftY =
    parseFloat(document.getElementById("shiftY").value.replace(",", ".")) *
    MM_TO_PT;
  const shiftPages = document.querySelector(
    'input[name="shiftPages"]:checked'
  ).value;

  // Basic validation for shift values
  if (isNaN(shiftX) || isNaN(shiftY)) {
    Toast.show("Please enter valid numbers for the shift values.", "error");
    return;
  }

  const originalName = pdfFile.name.replace(/\.pdf$/i, "");

  try {
    const pdfBytes = await readFileAsArrayBuffer(pdfFile);
    const data = new Uint8Array(pdfBytes);
    const pdfDoc = await PDFLib.PDFDocument.load(data);
    const pages = pdfDoc.getPages();

    for (let i = 0; i < pages.length; i++) {
      const isOddPage = (i + 1) % 2 !== 0;
      if (
        (shiftPages === "odd" && !isOddPage) ||
        (shiftPages === "even" && isOddPage)
      ) {
        continue; // Skip pages that don't match the selection
      }

      const page = pages[i];
      const rotation = page.getRotation().angle;
      const rotationRadians = rotation * (Math.PI / 180);

      // Adjust shift values based on rotation angle
      const adjustedShiftX =
        shiftX * Math.cos(rotationRadians) - shiftY * Math.sin(rotationRadians);
      const adjustedShiftY =
        shiftX * Math.sin(rotationRadians) + shiftY * Math.cos(rotationRadians);

      page.translateContent(adjustedShiftX, adjustedShiftY);
    }

    const modifiedPDFData = await pdfDoc.save();
    const blob = new Blob([modifiedPDFData], { type: "application/pdf" });
    triggerDownload(blob, `${originalName}_shifted.pdf`);
    Toast.show("PDF shifted successfully!", "success");
  } catch (error) {
    console.error("Failed to process PDF:", error);
    Toast.show("An error occurred while processing the PDF.", "error");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById('shiftPdfBtn').addEventListener('click', shiftPDFContent);
  const sliderPad = document.getElementById("sliderPad");
  const sliderHandle = document.getElementById("sliderHandle");
  const shiftXInput = document.getElementById("shiftX");
  const shiftYInput = document.getElementById("shiftY");

  // Configuration for the slider range in millimeters
  const SLIDER_RANGE_MM = 10; // e.g., from -20mm to +20mm

  let isDragging = false;

  function updateHandlePosition() {
    const xVal = parseFloat(shiftXInput.value) || 0;
    const yVal = parseFloat(shiftYInput.value) || 0;

    // Convert mm value to a percentage of the pad's width/height
    // The range is from -SLIDER_RANGE_MM to +SLIDER_RANGE_MM, so total range is 2 * SLIDER_RANGE_MM
    const xPercent = ((xVal + SLIDER_RANGE_MM) / (2 * SLIDER_RANGE_MM)) * 100;
    const yPercent = ((-yVal + SLIDER_RANGE_MM) / (2 * SLIDER_RANGE_MM)) * 100; // Y is inverted

    // Clamp values between 0 and 100
    const clampedX = Math.max(0, Math.min(100, xPercent));
    const clampedY = Math.max(0, Math.min(100, yPercent));

    sliderHandle.style.left = `${clampedX}%`;
    sliderHandle.style.top = `${clampedY}%`;
  }

  function updateInputValues(event) {
    const rect = sliderPad.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Clamp position to be within the pad
    const clampedX = Math.max(0, Math.min(rect.width, x));
    const clampedY = Math.max(0, Math.min(rect.height, y));

    // Convert pixel position to a percentage
    const xPercent = (clampedX / rect.width) * 100;
    const yPercent = (clampedY / rect.height) * 100;

    // Convert percentage to mm value
    let xVal = (xPercent / 100) * (2 * SLIDER_RANGE_MM) - SLIDER_RANGE_MM;
    let yVal = -((yPercent / 100) * (2 * SLIDER_RANGE_MM) - SLIDER_RANGE_MM); // Y is inverted

    // Snap to the nearest whole millimeter during drag
    xVal = Math.round(xVal);
    yVal = Math.round(yVal);

    // Update inputs. Use .toFixed(0) to show whole numbers from snapping.
    shiftXInput.value = xVal.toFixed(0);
    shiftYInput.value = yVal.toFixed(0);

    // Visually update the handle
    sliderHandle.style.left = `${xPercent}%`;
    sliderHandle.style.top = `${yPercent}%`;
  }

  // Event Listeners for the slider
  sliderPad.addEventListener("mousedown", (e) => {
    isDragging = true;
    sliderHandle.style.cursor = "grabbing";
    updateInputValues(e);
  });

  document.addEventListener("mousemove", (e) => {
    if (isDragging) {
      updateInputValues(e);
    }
  });

  document.addEventListener("mouseup", () => {
    if (isDragging) {
      isDragging = false;
      sliderHandle.style.cursor = "grab";
    }
  });

  // Event Listeners for the number inputs
  shiftXInput.addEventListener("input", updateHandlePosition);
  shiftYInput.addEventListener("input", updateHandlePosition);

  // Prevent text selection while dragging
  document.addEventListener("selectstart", (e) => {
    if (isDragging) {
      e.preventDefault();
    }
  });
});
