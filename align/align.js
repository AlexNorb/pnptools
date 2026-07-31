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
 * Formats byte size into readable string.
 * @param {number} bytes 
 * @returns {string}
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Parses a page selection string (e.g. "1-3,5,8") into a Set of 1-indexed page numbers.
 * @param {string} rangeStr 
 * @param {number} totalPages 
 * @returns {Set<number>}
 */
function parsePageRange(rangeStr, totalPages) {
  const pagesSet = new Set();
  if (!rangeStr) return pagesSet;

  const parts = rangeStr.split(",");
  for (let part of parts) {
    part = part.trim();
    if (!part) continue;
    if (part.includes("-")) {
      const [startStr, endStr] = part.split("-");
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        const min = Math.min(start, end);
        const max = Math.max(start, end);
        for (let p = min; p <= max; p++) {
          if (p >= 1 && p <= totalPages) {
            pagesSet.add(p);
          }
        }
      }
    } else {
      const p = parseInt(part, 10);
      if (!isNaN(p) && p >= 1 && p <= totalPages) {
        pagesSet.add(p);
      }
    }
  }
  return pagesSet;
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

// Global active unit state ("mm" by default)
let currentUnit = "mm";

async function shiftPDFContent() {
  // Millimeters to PDF points conversion factor (72 points per inch / 25.4 mm per inch)
  const MM_TO_PT = 72 / 25.4;

  const inputFile = document.getElementById("pdfFile");
  const pdfFile = inputFile.files[0];

  if (!pdfFile) {
    Toast.show("Please choose a PDF file first.", "error");
    return;
  }

  const rawX = parseFloat(document.getElementById("shiftX").value.replace(",", ".")) || 0;
  const rawY = parseFloat(document.getElementById("shiftY").value.replace(",", ".")) || 0;

  // Always convert input values to mm for internal calculations
  const mmX = currentUnit === "in" ? rawX * 25.4 : rawX;
  const mmY = currentUnit === "in" ? rawY * 25.4 : rawY;

  const shiftXPt = mmX * MM_TO_PT;
  const shiftYPt = mmY * MM_TO_PT;

  const shiftPagesRadio = document.querySelector(
    'input[name="shiftPages"]:checked'
  );
  const shiftPages = shiftPagesRadio ? shiftPagesRadio.value : "odd";

  // Basic validation for shift values
  if (isNaN(shiftXPt) || isNaN(shiftYPt)) {
    Toast.show("Please enter valid numbers for the shift values.", "error");
    return;
  }

  const originalName = pdfFile.name.replace(/\.pdf$/i, "");
  let outputFileName = document.getElementById("outputFileName").value.trim();
  if (!outputFileName) {
    outputFileName = `${originalName}_shifted.pdf`;
  } else if (!/\.pdf$/i.test(outputFileName)) {
    outputFileName += ".pdf";
  }

  try {
    const pdfBytes = await readFileAsArrayBuffer(pdfFile);
    const data = new Uint8Array(pdfBytes);
    const pdfDoc = await PDFLib.PDFDocument.load(data);
    const pages = pdfDoc.getPages();

    let selectedPagesSet = null;
    if (shiftPages === "selection") {
      const selectionInput = document.getElementById("pageSelectionInput");
      const rangeStr = selectionInput ? selectionInput.value.trim() : "";
      if (!rangeStr) {
        Toast.show("Please enter page numbers for selection (e.g. 1-3,5,8).", "error");
        return;
      }
      selectedPagesSet = parsePageRange(rangeStr, pages.length);
      if (selectedPagesSet.size === 0) {
        Toast.show(`No valid pages selected for range (1-${pages.length}).`, "error");
        return;
      }
    }

    for (let i = 0; i < pages.length; i++) {
      const pageNum = i + 1;
      const isOddPage = pageNum % 2 !== 0;

      if (shiftPages === "odd" && !isOddPage) continue;
      if (shiftPages === "even" && isOddPage) continue;
      if (shiftPages === "selection" && !selectedPagesSet.has(pageNum)) continue;

      const page = pages[i];
      const rotation = page.getRotation().angle;
      const rotationRadians = rotation * (Math.PI / 180);

      // Adjust shift values based on rotation angle
      const adjustedShiftX =
        shiftXPt * Math.cos(rotationRadians) - shiftYPt * Math.sin(rotationRadians);
      const adjustedShiftY =
        shiftXPt * Math.sin(rotationRadians) + shiftYPt * Math.cos(rotationRadians);

      page.translateContent(adjustedShiftX, adjustedShiftY);
    }

    const modifiedPDFData = await pdfDoc.save();
    const blob = new Blob([modifiedPDFData], { type: "application/pdf" });
    triggerDownload(blob, outputFileName);
    Toast.show("PDF shifted successfully!", "success");
  } catch (error) {
    console.error("Failed to process PDF:", error);
    Toast.show("An error occurred while processing the PDF.", "error");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const shiftPdfBtn = document.getElementById("shiftPdfBtn");
  if (shiftPdfBtn) {
    shiftPdfBtn.addEventListener("click", shiftPDFContent);
  }

  const pdfFile = document.getElementById("pdfFile");
  const fileCount = document.getElementById("fileCount");
  const outputFileName = document.getElementById("outputFileName");
  const shiftXInput = document.getElementById("shiftX");
  const shiftYInput = document.getElementById("shiftY");
  const miniPreviewContent = document.getElementById("miniPreviewContent");
  const previewXText = document.getElementById("previewXText");
  const previewYText = document.getElementById("previewYText");
  const pageSelectionInput = document.getElementById("pageSelectionInput");

  // Updates the non-interactive mini shift visualizer & dynamic text labels
  function updateMiniPreview() {
    if (!miniPreviewContent) return;
    const xVal = parseFloat(shiftXInput?.value.replace(",", ".")) || 0;
    const yVal = parseFloat(shiftYInput?.value.replace(",", ".")) || 0;

    // Convert value to mm for preview box displacement
    const xMm = currentUnit === "in" ? xVal * 25.4 : xVal;
    const yMm = currentUnit === "in" ? yVal * 25.4 : yVal;

    // Convert mm to pixel displacement (1mm = 1.5px, max displacement 12px)
    const clampPx = (val) => Math.max(-12, Math.min(12, val * 1.5));
    const transX = clampPx(xMm);
    const transY = clampPx(-yMm); // Invert Y for screen coordinates

    miniPreviewContent.style.transform = `translate(${transX}px, ${transY}px)`;

    const unitLabel = currentUnit;

    // Update dynamic text for X-axis (Horizontal)
    if (previewXText) {
      if (xVal > 0) {
        previewXText.textContent = `${xVal}${unitLabel} right`;
        previewXText.className = "font-bold text-xs text-theme-indigo";
      } else if (xVal < 0) {
        previewXText.textContent = `${Math.abs(xVal)}${unitLabel} left`;
        previewXText.className = "font-bold text-xs text-theme-indigo";
      } else {
        previewXText.textContent = `0${unitLabel} right/left`;
        previewXText.className = "font-bold text-xs text-theme-muted";
      }
    }

    // Update dynamic text for Y-axis (Vertical)
    if (previewYText) {
      if (yVal > 0) {
        previewYText.textContent = `${yVal}${unitLabel} up`;
        previewYText.className = "font-bold text-xs text-theme-teal";
      } else if (yVal < 0) {
        previewYText.textContent = `${Math.abs(yVal)}${unitLabel} down`;
        previewYText.className = "font-bold text-xs text-theme-teal";
      } else {
        previewYText.textContent = `0${unitLabel} up/down`;
        previewYText.className = "font-bold text-xs text-theme-muted";
      }
    }
  }

  // Unit Toggle Event Listener
  const unitRadios = document.querySelectorAll('input[name="globalUnit"]');
  unitRadios.forEach((radio) => {
    radio.addEventListener("change", (e) => {
      const newUnit = e.target.value;
      if (newUnit === currentUnit) return;

      const xVal = parseFloat(shiftXInput?.value.replace(",", ".")) || 0;
      const yVal = parseFloat(shiftYInput?.value.replace(",", ".")) || 0;

      if (newUnit === "in") {
        // Convert mm -> inches (2 decimal places)
        const inX = Math.round((xVal / 25.4) * 100) / 100;
        const inY = Math.round((yVal / 25.4) * 100) / 100;
        if (shiftXInput) { shiftXInput.value = inX; shiftXInput.step = "0.02"; }
        if (shiftYInput) { shiftYInput.value = inY; shiftYInput.step = "0.02"; }
      } else {
        // Convert inches -> mm (1 decimal place)
        const mmX = Math.round(xVal * 25.4 * 10) / 10;
        const mmY = Math.round(yVal * 25.4 * 10) / 10;
        if (shiftXInput) { shiftXInput.value = mmX; shiftXInput.step = "0.5"; }
        if (shiftYInput) { shiftYInput.value = mmY; shiftYInput.step = "0.5"; }
      }

      currentUnit = newUnit;
      updateMiniPreview();
    });
  });

  // Handle Radio Selection Toggle Changes (Enable/Disable Selection Input)
  const shiftPagesRadios = document.querySelectorAll('input[name="shiftPages"]');
  shiftPagesRadios.forEach((radio) => {
    radio.addEventListener("change", (e) => {
      if (pageSelectionInput) {
        if (e.target.value === "selection") {
          pageSelectionInput.disabled = false;
          pageSelectionInput.focus();
        } else {
          pageSelectionInput.disabled = true;
        }
      }
    });
  });

  // File Upload Selection Handler
  if (pdfFile) {
    pdfFile.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        if (fileCount) {
          fileCount.textContent = `${file.name} (${formatBytes(file.size)})`;
          fileCount.classList.add("text-theme-dark", "font-bold");
          fileCount.classList.remove("text-theme-muted");
        }
        if (outputFileName) {
          const originalName = file.name.replace(/\.pdf$/i, "");
          outputFileName.value = `${originalName}_shifted.pdf`;
        }
      } else {
        if (fileCount) {
          fileCount.textContent = "No file selected";
          fileCount.classList.remove("text-theme-dark", "font-bold");
          fileCount.classList.add("text-theme-muted");
        }
      }
    });
  }

  // Stepper functions
  function adjustValue(inputElement, deltaSign) {
    if (!inputElement) return;
    let currentVal = parseFloat(inputElement.value.replace(",", ".")) || 0;
    let step = currentUnit === "in" ? 0.02 : 0.5;
    let delta = deltaSign * step;
    let newVal = currentUnit === "in"
      ? Math.round((currentVal + delta) * 100) / 100
      : Math.round((currentVal + delta) * 10) / 10;
    inputElement.value = newVal;
    updateMiniPreview();
  }

  // Stepper & Input Event Listeners
  const btnReset = document.getElementById("btnReset");
  const btnStepUp = document.getElementById("btnStepUp");
  const btnStepDown = document.getElementById("btnStepDown");
  const btnStepRight = document.getElementById("btnStepRight");
  const btnStepLeft = document.getElementById("btnStepLeft");

  if (btnStepUp) btnStepUp.addEventListener("click", () => adjustValue(shiftYInput, 1));
  if (btnStepDown) btnStepDown.addEventListener("click", () => adjustValue(shiftYInput, -1));

  if (btnStepRight) btnStepRight.addEventListener("click", () => adjustValue(shiftXInput, 1));
  if (btnStepLeft) btnStepLeft.addEventListener("click", () => adjustValue(shiftXInput, -1));

  if (shiftXInput) shiftXInput.addEventListener("input", updateMiniPreview);
  if (shiftYInput) shiftYInput.addEventListener("input", updateMiniPreview);

  if (btnReset) {
    btnReset.addEventListener("click", () => {
      if (shiftXInput) shiftXInput.value = 0;
      if (shiftYInput) shiftYInput.value = 0;
      updateMiniPreview();
    });
  }

  // Initial preview state update
  updateMiniPreview();
});
