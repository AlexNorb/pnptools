function initApp() {
  // --- PDF.js Worker Setup ---
  if (typeof pdfjsLib === "undefined" || !pdfjsLib.GlobalWorkerOptions) {
    const msg = "Error: Failed to load PDF library. Please refresh the page.";
    document.getElementById("status").textContent = msg;
    document.getElementById("status").style.color = "red";
    return;
  }

  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

  // --- Global Application State & DOM References ---
  const fileInput = document.getElementById("fileInput");
  const extractBtn = document.getElementById("extractBtn");
  const allPagesToggle = document.getElementById("allPagesToggle");
  const pageRangeInput = document.getElementById("pageRangeInput");
  const status = document.getElementById("status");
  const imagesWrap = document.getElementById("images");
  const resultsBar = document.getElementById("resultsBar");
  const downloadZipBtn = document.getElementById("downloadZip");
  const resultsSummaryText = document.getElementById("resultsSummaryText");
  const clearBtn = document.getElementById("clearBtn");
  const qualityRange = document.getElementById("quality");
  const qualityVal = document.getElementById("qualityVal");
  const safeModeToggle = document.getElementById("safeModeToggle");
  const logOutput = document.getElementById("logOutput");
  const clearLogBtn = document.getElementById("clearLogBtn");
  const pageProgressBar = document.getElementById("pageProgressBar");
  const progressBarFill = document.getElementById("progressBarFill");

  // DOM Elements for Summary/Collapse/Debug/Config
  const toggleThumbsBtn = document.getElementById("toggleThumbsBtn");
  const debugModeToggle = document.getElementById("debugModeToggle");
  const logContainer = document.getElementById("logContainer");
  const toggleConfigBtn = document.getElementById("toggleConfigBtn");
  const configContainer = document.getElementById("configContainer");

  const formatJpeg = document.getElementById("formatJpeg");
  const formatPng = document.getElementById("formatPng");
  const ignoreSmallFiles = document.getElementById("ignoreSmallFiles");

  const SAFE_TIMEOUT = 1500; // Used for actual delay
  const FAST_TIMEOUT = 200; // Used for actual delay
  const MIN_FILE_SIZE_BYTES = 5 * 1024; // 5 KB

  let pdfDocument = null;
  let maxPages = 0;
  let currentDocName = "";
  let isLoading = false;
  let inProgress = false;
  let areThumbsVisible = false;
  let areThumbsRendered = false;

  // imageStore structure: Map<CONTENT_HASH, { baseName: string, blob: Blob, name: string, tempUrl: string, width: number, height: number }>
  let imageStore = new Map();
  let reuseCanvas = document.createElement("canvas");
  let reuseCtx = reuseCanvas.getContext("2d");

  let processedObjIds = new Set();
  let failedObjIds = new Set();
  let processedContentHashes = new Set();

  let aCounter = 0;
  let bCounter = 0;

  // --- Helper Functions: Format and Log ---

  function formatSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = 1;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
    );
  }

  /**
   * Converts raw bytes to a formatted string in MB (e.g., 5.4).
   */
  function formatSizeToMB(bytes) {
    if (bytes === 0) return "0.0";
    // Use 1 decimal point for MB unless the value is tiny
    const mb = bytes / (1024 * 1024);
    return mb.toFixed(mb < 1 ? 2 : 1);
  }

  function getSelectedFormat() {
    if (formatPng.checked) return { mime: "image/png", ext: ".png" };
    return { mime: "image/jpeg", ext: ".jpg" };
  }

  function log(message, type = "info") {
    if (
      !debugModeToggle.checked &&
      type !== "error" &&
      type !== "warn" &&
      type !== "config" &&
      type !== "dedupe" &&
      type !== "filter"
    ) {
      return;
    }
    const entry = document.createElement("div");
    entry.textContent = message;
    if (type === "warn") {
      entry.className = "log-warn";
    } else if (type === "error") {
      entry.className = "log-error";
    } else if (type === "filter") {
      entry.className = "log-filter";
    }
    logOutput.prepend(entry);
    logOutput.scrollTop = 0;
  }

  /**
   * Updates the progress bar width based on current vs total operations.
   */
  function updatePageProgressBar(currentOps, totalOps) {
    if (totalOps > 0) {
      const percentage = Math.min(100, (currentOps / totalOps) * 100);
      progressBarFill.style.width = `${percentage}%`;
    } else {
      progressBarFill.style.width = "100%"; // Assume quick processing if zero ops
    }
  }

  // --- CORE LOGIC: Page Range Parsing ---

  function parsePageRange(rangeString, max) {
    const pages = new Set();
    const parts = rangeString.split(",");

    for (const part of parts) {
      const trimmedPart = part.trim();
      if (!trimmedPart) continue;

      if (trimmedPart.includes("-")) {
        const [startStr, endStr] = trimmedPart
          .split("-")
          .map((s) => s.trim());
        const start = parseInt(startStr);
        let end = parseInt(endStr);

        if (!isNaN(start) && !isNaN(end) && start <= end) {
          end = Math.min(end, max);
          for (let i = start; i <= end; i++) {
            if (i >= 1 && i <= max) {
              pages.add(i);
            }
          }
        }
      } else {
        const page = parseInt(trimmedPart);
        if (!isNaN(page) && page >= 1 && page <= max) {
          pages.add(page);
        }
      }
    }
    return Array.from(pages).sort((a, b) => a - b);
  }

  function getPagesToProcess(max) {
    if (!pdfDocument || max <= 0) return [];

    if (allPagesToggle.checked) {
      return Array.from({ length: max }, (_, i) => i + 1);
    } else {
      return parsePageRange(pageRangeInput.value, max);
    }
  }

  // --- Event Listeners ---

  qualityRange.addEventListener("input", () => {
    qualityVal.textContent = Number(qualityRange.value).toFixed(2);
  });

  // Toggle quality slider enablement based on format
  const updateQualitySlider = () => {
    const isJpeg = formatJpeg.checked;
    qualityRange.disabled = !isJpeg;
    qualityVal.style.opacity = isJpeg ? "1" : "0.5";
  };
  formatJpeg.addEventListener("change", updateQualitySlider);
  formatPng.addEventListener("change", updateQualitySlider);

  // Toggle Debug Log Visibility
  debugModeToggle.addEventListener("change", () => {
    const isDebug = debugModeToggle.checked;
    logContainer.classList.toggle("hidden", !isDebug);
    log(
      `[CONFIG] Debug mode is now ${isDebug ? "ON" : "OFF"}.`,
      "config"
    );
  });

  // Toggle Advanced Configuration Visibility
  toggleConfigBtn.addEventListener("click", () => {
    const isHidden = configContainer.classList.contains("hidden");
    if (isHidden) {
      configContainer.classList.remove("hidden");
    } else {
      configContainer.classList.add("hidden");
    }
    toggleConfigBtn.textContent = isHidden
      ? "Hide Advanced Configuration"
      : "Show Advanced Configuration";
  });

  // Initial log based on default mode
  if (!safeModeToggle.checked) {
    log(`[CONFIG] Fast Mode active.`, "config");
  }

  // 1. PDF File Selection
  fileInput.addEventListener("change", async (ev) => {
    const file = ev.target.files && ev.target.files[0];
    if (!file || isLoading) {
      return;
    }

    // Perform a full reset before loading a new PDF
    clearAll(true);

    extractBtn.disabled = true;

    await loadPdf(file);
    fileInput.value = null;
  });

  // 2. Page Range Toggle Control
  allPagesToggle.addEventListener("change", () => {
    const isChecked = allPagesToggle.checked;
    pageRangeInput.disabled = isChecked;
    extractBtn.disabled = !pdfDocument || inProgress;

    if (isChecked && maxPages > 0) {
      pageRangeInput.value = `1-${maxPages}`;
    }
  });

  // 3. Extraction Trigger
  extractBtn.addEventListener("click", async () => {
    if (inProgress || !pdfDocument) return;

    extractBtn.disabled = true;

    const pagesToProcess = getPagesToProcess(maxPages);

    if (pagesToProcess.length === 0) {
      log(
        "[ERROR] Invalid or empty page range specified. Please check input.",
        "error"
      );
      status.textContent = "Extraction failed: Invalid page range.";
      extractBtn.disabled = !pdfDocument;
      return;
    }

    await startExtraction(pdfDocument, pagesToProcess);
  });

  // --- Utility Event Listeners ---
  clearBtn.addEventListener("click", () => {
    clearAll(true);
  });

  clearLogBtn.addEventListener("click", () => {
    logOutput.innerHTML = "";
    log("[INFO] Log cleared.", "config");
    if (!safeModeToggle.checked) {
      log(`[CONFIG] Fast Mode active.`, "config");
    } else {
      log(`[CONFIG] Slow Mode active.`, "config");
    }
  });

  // Mode Toggle Logic
  safeModeToggle.addEventListener("change", () => {
    if (safeModeToggle.checked) {
      log(`[CONFIG] Slow Mode activated.`, "config");
    } else {
      log(`[CONFIG] Fast Mode activated.`, "config");
    }
  });

  // Thumbnail Toggle: Lazy rendering is implemented here
  toggleThumbsBtn.addEventListener("click", () => {
    if (toggleThumbsBtn.disabled) return;

    areThumbsVisible = !areThumbsVisible;
    const currentCount = imageStore.size;

    if (areThumbsVisible) {
      // ONLY render if they haven't been rendered yet
      if (!areThumbsRendered) {
        renderThumbnails();
        areThumbsRendered = true;
      }
      imagesWrap.classList.remove("hidden");
      toggleThumbsBtn.textContent = "Hide images";
    } else {
      imagesWrap.classList.add("hidden");
      toggleThumbsBtn.textContent = `Preview ${currentCount} images`;
    }

    // Ensure styling is 'button' (blue) when enabled
    if (currentCount > 0) {
      toggleThumbsBtn.className = "btn-secondary w-full"; // Will be updated to match our CSS
    } else {
      toggleThumbsBtn.className = "btn-secondary w-full";
    }
  });

  downloadZipBtn.addEventListener("click", async () => {
    if (imageStore.size === 0) return;
    downloadZipBtn.disabled = true;

    // 1. Determine which images are included based on checkbox state
    const includedImages = [];
    let totalIncludedBytes = 0;

    for (const [hash, rec] of imageStore.entries()) {
      // If thumbnails were rendered, check the checkbox state.
      // If thumbnails were NOT rendered, we assume all are included by default.
      let isIncluded = true;
      const checkbox = document.getElementById(`include-${hash}`);

      if (checkbox) {
        isIncluded = checkbox.checked;
      }

      if (isIncluded) {
        includedImages.push(rec);
        totalIncludedBytes += rec.blob.size;
      }
    }

    const count = includedImages.length;
    const estimatedSizeMB = formatSizeToMB(totalIncludedBytes);

    if (count === 0) {
      status.textContent = "[INFO] No images selected for download.";
      log("[INFO] ZIP creation skipped: No images selected.", "warn");
      downloadZipBtn.disabled = false;
      return;
    }

    const msg = `[PROGRESS] Preparing ZIP with ${count} selected image(s) (~${estimatedSizeMB} MB)...`;
    status.innerHTML = `<span class="spinner"></span>${msg}`;
    log(msg);
    pageProgressBar.classList.remove("hidden");
    progressBarFill.style.width = "100%"; // Indeterminate progress for ZIP creation

    try {
      const zip = new JSZip();
      const folderName = currentDocName || "extracted_images";
      const folder = zip.folder(folderName) || zip;

      for (const rec of includedImages) {
        folder.file(rec.name, rec.blob);
      }

      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        streamFiles: true,
      });

      saveAs(zipBlob, `${currentDocName}.zip`);

      const actualZipSizeMB = formatSizeToMB(zipBlob.size);

      const doneMsg = `[INFO] ZIP ready. ${count} selected image(s) saved. (Final size: ${formatSize(
        zipBlob.size
      )})`;
      status.textContent = doneMsg;
      log(doneMsg);

      // Update button & summary text
      downloadZipBtn.innerHTML = `<i class="fa-solid fa-file-zipper"></i> Save ZIP`;
      if (resultsSummaryText) {
        resultsSummaryText.textContent = `${count} images (~${actualZipSizeMB} MB)`;
      }
    } catch (err) {
      const errorMsg =
        "[ERROR] Error creating ZIP: " + ((err && err.message) || err);
      status.textContent = errorMsg;
      log(errorMsg, "error");
    } finally {
      // Recalculate size/count of currently CHECKED items to re-enable button accurately
      const finalCount = Array.from(imageStore.entries()).filter(
        ([hash]) => {
          const checkbox = document.getElementById(`include-${hash}`);
          return !checkbox || checkbox.checked; // If no checkbox (not rendered), include it
        }
      ).length;

      downloadZipBtn.disabled = !(finalCount > 0);
      pageProgressBar.classList.add("hidden");
    }
  });

  /**
   * Clears all stored data and resets the UI state.
   * @param {boolean} fullReset If true, wipes document state (pdf, currentDocName). If false, only wipes results (images, counters).
   */
  function clearAll(fullReset = false) {
    log(
      `[INFO] Clearing ${
        fullReset ? "all app state" : "previous results"
      }...`
    );

    // Revoke all temporary URLs if they were created
    imageStore.forEach((rec) => {
      if (rec.tempUrl) URL.revokeObjectURL(rec.tempUrl);
    });
    imageStore.clear();

    processedObjIds.clear();
    failedObjIds.clear();
    processedContentHashes.clear();

    aCounter = 0;
    bCounter = 0;

    // Reset UI elements
    imagesWrap.innerHTML = "";
    imagesWrap.classList.add("hidden");
    resultsBar.classList.add("hidden");
    pageProgressBar.classList.add("hidden");

    areThumbsVisible = false;
    areThumbsRendered = false; // Reset render state

    // Reset text and class for thumbnail button
    toggleThumbsBtn.textContent = "Preview 0 images";
    toggleThumbsBtn.className = "btn-secondary w-full";
    toggleThumbsBtn.disabled = true;

    downloadZipBtn.disabled = true;
    downloadZipBtn.innerHTML = `<i class="fa-solid fa-file-zipper"></i> Save ZIP`;
    if (resultsSummaryText) {
      resultsSummaryText.textContent = `0 images found`;
    }

    // --- Document State Clear (Only if fullReset is true) ---
    if (fullReset) {
      pdfDocument = null;
      maxPages = 0;
      currentDocName = "";

      status.textContent = "Cleared. Select a PDF to begin.";
      clearBtn.disabled = true;
      extractBtn.disabled = true;
      pageRangeInput.value = "";
      pageRangeInput.disabled = true;
      allPagesToggle.checked = true;
    }

    if (fullReset) {
      logOutput.innerHTML = "";
      log("[INFO] Log cleared.", "config");
    }
  }

  /**
   * Step 1: Loads the PDF.
   */
  async function loadPdf(file) {
    if (isLoading) return;
    isLoading = true;

    const rawDocName = file.name.replace(/\.pdf$/i, "");
    // Ensure currentDocName is URL-safe and used consistently as the prefix.
    const safeDocName = rawDocName.replace(/[^\w\d-_\.]/g, "_");

    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });

      status.innerHTML = `<span class="spinner"></span>[PROGRESS] Loading ${file.name}...`;
      log(`[INFO] Starting load for ${file.name}...`);

      pdfDocument = await loadingTask.promise;
      maxPages = pdfDocument.numPages;
      currentDocName = safeDocName; // Store the cleaned name globally

      pageRangeInput.value = `1-${maxPages}`;
      pageRangeInput.disabled = allPagesToggle.checked;
      extractBtn.disabled = false;
      clearBtn.disabled = false;

      const msg = `[INFO] ${file.name} loaded (${maxPages} pages). Ready for extraction.`;
      status.textContent = msg;
      log(msg);
    } catch (err) {
      const errorMsg =
        "[ERROR] Fatal error during PDF loading: " +
        ((err && err.message) || err);
      status.textContent = errorMsg;
      log(errorMsg, "error");
      pdfDocument = null;
      currentDocName = "";
      clearBtn.disabled = false;
    } finally {
      isLoading = false;
    }
  }

  /**
   * Step 2: Starts the extraction loop.
   */
  async function startExtraction(pdf, pagesToProcess) {
    if (inProgress) return;
    inProgress = true;

    // --- FIX: Only reset RESULTS, keep document state (currentDocName) intact ---
    clearAll(false);

    const safeDocName = currentDocName;
    const totalPages = pagesToProcess.length;

    log(
      `[INFO] Starting image extraction across ${totalPages} selected page(s).`
    );
    log(
      `[CONFIG] Output format set to: ${getSelectedFormat()
        .ext.toUpperCase()
        .substring(1)}`,
      "config"
    );

    try {
      for (let i = 0; i < totalPages; i++) {
        const p = pagesToProcess[i];
        try {
          const pageMsg = `[PROGRESS] Scanning page ${
            i + 1
          }/${totalPages} (Page ${p} of PDF)...`;
          status.innerHTML = `<span class="spinner"></span>${pageMsg}`;
          pageProgressBar.classList.remove("hidden");

          const page = await pdf.getPage(p);
          await processPageImages(page, safeDocName, p);
        } catch (pageErr) {
          log(
            `[ERROR] Failed to process PDF page ${p}: ${pageErr.message}. Continuing...`,
            "error"
          );
        }
      }

      // 2. Hide Progress Bar
      pageProgressBar.classList.add("hidden");

      // --- FINALIZATION STEP ---
      finalizeNamingAndUI();

      const finalCount = imageStore.size;

      // Recalculate the count based on the initial default state (all included) for the final message
      const initialIncludedCount = finalCount;
      let doneMsg =
        initialIncludedCount > 0
          ? `[INFO] Extraction complete. ${initialIncludedCount} unique image(s) ready for download.`
          : `[INFO] Extraction complete. No unique images found in the selected range or after filtering.`;
      status.textContent = doneMsg;
      log(doneMsg);

      resultsBar.classList.remove("hidden");
      downloadZipBtn.disabled = initialIncludedCount === 0;
    } catch (err) {
      log(`[ERROR] Extraction process failed: ${err.message}`, "error");
      pageProgressBar.classList.add("hidden");
    } finally {
      inProgress = false;
      extractBtn.disabled = !pdfDocument;
      clearBtn.disabled = false;
    }
  }

  /**
   * Finalizes the naming of all images, calculates size, and updates the UI.
   */
  function finalizeNamingAndUI() {
    const { ext } = getSelectedFormat();
    const finalCount = imageStore.size;
    let totalBytes = 0;

    imageStore.forEach((rec, hash) => {
      rec.name = `${rec.baseName}${ext}`;
      totalBytes += rec.blob.size;
    });

    const totalSizeFormatted = formatSize(totalBytes);
    const totalSizeMB = formatSizeToMB(totalBytes);
    log(
      `[INFO] Finished naming ${finalCount} unique images with ${ext} extension. Estimated total size: ${totalSizeFormatted}`
    );

    // Update the Results Bar Button with estimated size (since all are checked by default)
    downloadZipBtn.innerHTML = `<i class="fa-solid fa-file-zipper"></i> Save ZIP`;
    if (resultsSummaryText) {
      resultsSummaryText.textContent = `${finalCount} images (~${totalSizeMB} MB)`;
    }

    // Update the Thumbnail Toggle button
    if (finalCount > 0) {
      if (areThumbsVisible) {
        toggleThumbsBtn.textContent = "Hide images";
      } else {
        toggleThumbsBtn.textContent = `Preview ${finalCount} images`;
      }
      toggleThumbsBtn.disabled = false;
      // Set to blue color
      toggleThumbsBtn.className = "btn-secondary w-full";
    } else {
      toggleThumbsBtn.textContent = "Preview 0 images";
      toggleThumbsBtn.disabled = true;
      // Set back to small/grey color
      toggleThumbsBtn.className = "btn-secondary w-full";
    }
  }

  /**
   * Wraps the callback-based page.objs.get in a Promise.
   */
  function objGetPromise(page, objId) {
    return new Promise((resolve, reject) => {
      const timeoutDuration = safeModeToggle.checked
        ? SAFE_TIMEOUT
        : FAST_TIMEOUT;

      try {
        const timeout = setTimeout(() => {
          // Updated log message to remove time details
          log(
            `[WARN] Timeout getting object "${objId}". Skipping reference.`,
            "warn"
          );
          resolve(null);
        }, timeoutDuration);

        page.objs.get(objId, (obj) => {
          clearTimeout(timeout);
          resolve(obj);
        });
      } catch (e) {
        log(
          `[WARN] Failed to retrieve object ${objId}: ${e.message}`,
          "warn"
        );
        resolve(null);
      }
    });
  }

  /**
   * Processes a single page to find and handle image objects.
   */
  async function processPageImages(page, docName, pageNumber) {
    try {
      const ops = await page.getOperatorList();
      const fns = ops.fnArray;
      const args = ops.argsArray;
      const OPS = pdfjsLib.OPS || {};
      const interesting = new Set(
        Object.keys({
          [OPS.paintJpegXObject]: 1,
          [OPS.paintImageXObject]: 1,
          [OPS.paintInlineImageXObject]: 1,
          [OPS.paintImageXObjectRepeat]: 1,
          [OPS.paintInlineImageXObjectGroup]: 1,
        }).map(Number)
      );

      // 1. Calculate Total Image Operations for this page
      let totalImageOps = fns.filter((fn) => interesting.has(fn)).length;
      let processedImageOps = 0;
      updatePageProgressBar(0, totalImageOps); // Initialize bar

      for (let i = 0; i < fns.length; i++) {
        if (!interesting.has(fns[i])) continue;

        const arg = args[i];
        let imgObj = null;
        let currentObjId = null;

        try {
          if (
            Array.isArray(arg) &&
            arg.length > 0 &&
            typeof arg[0] === "string"
          ) {
            currentObjId = arg[0];

            if (
              processedObjIds.has(currentObjId) ||
              failedObjIds.has(currentObjId)
            ) {
              // Image already processed/failed, update progress but skip processing
            } else {
              imgObj = await objGetPromise(page, currentObjId);

              if (!imgObj) {
                failedObjIds.add(currentObjId);
              } else {
                processedObjIds.add(currentObjId);
                await handleImageObject(
                  imgObj,
                  docName,
                  pageNumber,
                  currentObjId
                );
              }
            }
          } else if (arg && typeof arg === "object" && arg.data) {
            imgObj = arg;
            await handleImageObject(imgObj, docName, pageNumber, null);
          }

          // 2. Update Progress Bar after image operation
          processedImageOps++;
          updatePageProgressBar(processedImageOps, totalImageOps);
          // Yield control slightly to ensure UI update
          await new Promise((resolve) => setTimeout(resolve, 1));
        } catch (err) {
          log(
            `[ERROR] Image process error (Page ${pageNumber}, ID: ${
              currentObjId || "inline"
            }): ${err.message}. Continuing...`,
            "error"
          );
          if (currentObjId) {
            failedObjIds.add(currentObjId);
          }

          // Still increment the counter if an error occurs mid-processing to show progress
          processedImageOps++;
          updatePageProgressBar(processedImageOps, totalImageOps);
          await new Promise((resolve) => setTimeout(resolve, 1));
        }
      }

      await page.cleanup();
      updatePageProgressBar(totalImageOps, totalImageOps); // Ensure 100% on exit
    } catch (err) {
      log(
        `[ERROR] Cleanup error on page ${pageNumber}: ${err.message}`,
        "error"
      );
      throw err;
    }
  }

  /**
   * Converts image object, checks uniqueness, filters by size, and stores.
   * Returns true if stored, false if filtered/skipped.
   */
  async function handleImageObject(imgObj, docName, pageNumber, objId) {
    try {
      let blob = null;
      let ab = null;
      let width = 0; // Added for resolution
      let height = 0; // Added for resolution

      const resetCanvas = (w, h) => {
        reuseCanvas.width = w;
        reuseCanvas.height = h;
        reuseCtx.setTransform(1, 0, 0, 1, 0, 0);
        reuseCtx.clearRect(0, 0, w, h);
      };

      let abRaw = null;
      let hashRaw = null;

      // --- TIER 1 DEDUPLICATION: Hashing RAW Pixel Data ---
      if (
        (imgObj.data && (imgObj.width || imgObj.height)) ||
        imgObj instanceof ImageData
      ) {
        const dataView =
          imgObj.data instanceof Uint8ClampedArray
            ? imgObj.data
            : imgObj.data instanceof Uint8Array
            ? imgObj.data
            : new Uint8Array(imgObj.data.buffer || imgObj.data);

        if (dataView.buffer) {
          abRaw = dataView.buffer.slice(
            dataView.byteOffset,
            dataView.byteOffset + dataView.byteLength
          );
          hashRaw = await hashArrayBuffer(abRaw);

          if (processedContentHashes.has(hashRaw)) {
            log(
              `[DEDUPE] Raw content hash matched. Skipping image on page ${pageNumber}.`,
              "dedupe"
            );
            return false;
          }
        }
      }
      // --- END TIER 1 DEDUPLICATION ---

      // --- CONVERSION TO OUTPUT BLOB & SIZE CHECK ---
      const quality = Number(qualityRange.value);

      if (imgObj.src && typeof imgObj.src === "string") {
        const imgEl =
          imgObj instanceof HTMLImageElement
            ? imgObj
            : await createImageFromBlob(
                await (await fetch(imgObj.src)).blob()
              );
        width = imgEl.naturalWidth || imgEl.width;
        height = imgEl.naturalHeight || imgEl.height;
        resetCanvas(width, height);
        blob = await canvasToOutputBlob(reuseCanvas, quality);
        ab = await blob.arrayBuffer();
      } else if (imgObj instanceof HTMLCanvasElement) {
        width = imgObj.width;
        height = imgObj.height;
        blob = await canvasToOutputBlob(imgObj, quality);
        ab = await blob.arrayBuffer();
      } else if (
        (imgObj.data && (imgObj.width || imgObj.height)) ||
        imgObj instanceof ImageData
      ) {
        width = imgObj.width || imgObj.data.width || 1;
        height = imgObj.height || imgObj.data.height || 1;
        if (width <= 1 || height <= 1) {
          return false;
        }

        resetCanvas(width, height);

        try {
          const imageData =
            imgObj instanceof ImageData
              ? imgObj
              : new ImageData(
                  new Uint8ClampedArray(
                    imgObj.data.buffer || imgObj.data
                  ),
                  width,
                  height
                );
          reuseCtx.putImageData(imageData, 0, 0);
        } catch (e) {
          return false;
        }

        blob = await canvasToOutputBlob(reuseCanvas, quality);
        ab = await blob.arrayBuffer();
      } else if (
        imgObj.bitmap &&
        imgObj.bitmap.width &&
        imgObj.bitmap.height
      ) {
        const bmp = imgObj.bitmap;
        width = bmp.width;
        height = bmp.height;
        resetCanvas(width, height);
        reuseCtx.drawImage(bmp, 0, 0);
        blob = await canvasToOutputBlob(reuseCanvas, quality);
        ab = await blob.arrayBuffer();
      } else {
        return false;
      }

      if (!ab || !blob) {
        return false;
      }

      // --- FILE SIZE FILTER CHECK ---
      if (ignoreSmallFiles.checked && blob.size < MIN_FILE_SIZE_BYTES) {
        log(
          `[FILTER] Skipped image (size: ${(blob.size / 1024).toFixed(
            1
          )} KB, Dim: ${width}x${height}px) on page ${pageNumber}.`,
          "filter"
        );
        return false;
      }

      const hashContent = await hashArrayBuffer(ab);

      // --- FINAL DUPLICATION CHECK (Content Hash) ---
      if (imageStore.has(hashContent)) {
        log(
          `[DEDUPE] Processed content hash matched. Skipping image on page ${pageNumber}.`,
          "dedupe"
        );
        return false;
      }

      // --- NEW UNIQUE IMAGE FOUND ---

      let prefix;
      let counter;

      if (pageNumber % 2 !== 0) {
        aCounter++;
        prefix = "A";
        counter = aCounter;
      } else {
        bCounter++;
        prefix = "B";
        counter = bCounter;
      }

      const baseName = `${docName}-${prefix}${counter}`;

      // Store Hashes
      if (hashRaw) {
        processedContentHashes.add(hashRaw);
      }
      processedContentHashes.add(hashContent);

      // Store with dimensions
      imageStore.set(hashContent, {
        baseName: baseName,
        blob: blob,
        name: "",
        tempUrl: null,
        width: width, // Storing width
        height: height, // Storing height
      });

      log(
        `[NEW] Found image ${baseName} (${(blob.size / 1024).toFixed(
          1
        )} KB, Dim: ${width}x${height}px).`
      );

      return true;
    } catch (err) {
      log(`[ERROR] Image storage failure: ${err.message}`, "error");
      return false;
    }
  }

  // --- Generic Canvas to Blob Conversion (supports JPG and PNG) ---
  function canvasToOutputBlob(canvas, quality) {
    const format = getSelectedFormat();
    return new Promise((resolve, reject) => {
      try {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error("canvas.toBlob returned null"));
          },
          format.mime,
          format.mime === "image/jpeg" ? quality : undefined
        );
      } catch (e) {
        reject(e);
      }
    });
  }

  // --- Thumbnail Rendering Logic (Moved out of extraction loop) ---

  function renderThumbnails() {
    if (areThumbsRendered) return;

    imagesWrap.innerHTML = ""; // Clear in case of previous failed render

    log(`[INFO] Generating ${imageStore.size} thumbnail previews...`);

    // Iterate over the stored images and create DOM elements
    for (const [hash, rec] of imageStore) {
      // Create temporary URL and store it (This is the slow/expensive part we defer)
      rec.tempUrl = URL.createObjectURL(rec.blob);

      const div = document.createElement("div");
      div.className = "thumb bg-white border-3 border-theme-dark rounded-xl shadow-[2px_2px_0_var(--color-theme-dark)] p-2 flex flex-col gap-2";

      const imgWrap = document.createElement("div");
      imgWrap.className = "w-full h-32 bg-gray-100 rounded border border-gray-200 overflow-hidden flex items-center justify-center";
      
      const img = document.createElement("img");
      img.src = rec.tempUrl;
      img.alt = rec.name;
      img.className = "max-w-full max-h-full object-contain";
      
      imgWrap.appendChild(img);

      const meta = document.createElement("div");
      meta.className = "meta text-xs flex flex-col gap-1.5";

      // Filename and Resolution Row
      const row = document.createElement("div");
      row.className = "row flex justify-between items-start gap-2 w-full break-all";

      const nameEl = document.createElement("div");
      nameEl.className = "filename font-medium text-theme-dark flex-1";
      nameEl.id = `name-${hash}`;
      nameEl.textContent = rec.name;
      nameEl.title = rec.name;

      const resolutionEl = document.createElement("div");
      resolutionEl.className = "resolution font-bold text-theme-indigo whitespace-nowrap";
      resolutionEl.textContent = `${rec.width}x${rec.height}px`;

      row.appendChild(nameEl);
      row.appendChild(resolutionEl);

      // Inclusion Control and Save Button Row
      const controls = document.createElement("div");
      controls.className = "controls flex items-center justify-between gap-2 mt-1";

      // Inclusion Checkbox (NEW)
      const checkboxId = `include-${hash}`;
      const includeLabel = document.createElement("label");
      includeLabel.className = "flex items-center gap-1.5 cursor-pointer text-theme-muted hover:text-theme-dark font-medium";

      const includeCheckboxWrap = document.createElement("div");
      includeCheckboxWrap.className = "relative flex items-center justify-center w-4 h-4 border-2 border-theme-dark rounded-sm bg-white has-[:checked]:bg-theme-yellow overflow-hidden transition-colors";
      
      const includeCheckbox = document.createElement("input");
      includeCheckbox.type = "checkbox";
      includeCheckbox.id = checkboxId;
      includeCheckbox.checked = true; // Default checked
      includeCheckbox.className = "absolute opacity-0 w-full h-full cursor-pointer m-0 z-10 peer";

      const checkIcon = document.createElement("div");
      checkIcon.className = "w-2.5 h-2.5 bg-theme-dark opacity-0 peer-checked:opacity-100 transition-opacity";
      checkIcon.style.clipPath = "polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%)";

      // Add listener to update total size/count when a box is unchecked
      includeCheckbox.addEventListener("change", () => {
        const totalBytes = Array.from(imageStore.entries())
          .filter(([hash]) => {
            const cb = document.getElementById(`include-${hash}`);
            return cb && cb.checked;
          })
          .reduce((sum, [, rec]) => sum + rec.blob.size, 0);

        const finalCount = Array.from(imageStore.entries()).filter(
          ([hash]) => {
            const cb = document.getElementById(`include-${hash}`);
            return cb && cb.checked;
          }
        ).length;

        const totalSizeMB = formatSizeToMB(totalBytes);
        downloadZipBtn.innerHTML = `<i class="fa-solid fa-file-zipper"></i> Save ZIP`;
        if (resultsSummaryText) {
          resultsSummaryText.textContent = `${finalCount} images (~${totalSizeMB} MB)`;
        }
        downloadZipBtn.disabled = finalCount === 0;
      });

      includeCheckboxWrap.appendChild(includeCheckbox);
      includeCheckboxWrap.appendChild(checkIcon);

      includeLabel.appendChild(includeCheckboxWrap);
      includeLabel.appendChild(document.createTextNode("Include"));

      const dl = document.createElement("a");
      dl.href = rec.tempUrl;
      dl.className = "btn-secondary text-[11px] px-2 h-6 min-h-0 py-0";
      dl.textContent = "Save";
      dl.download = rec.name;

      controls.appendChild(includeLabel);
      controls.appendChild(dl);

      meta.appendChild(row);
      meta.appendChild(controls);

      div.appendChild(imgWrap);
      div.appendChild(meta);
      imagesWrap.prepend(div);
    }

    areThumbsRendered = true;
    log(
      `[INFO] Thumbnail rendering complete. Individual inclusion controls enabled.`
    );
  }

  // --- Helper Functions ---

  function createImageFromBlob(blob) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = (err) => {
        URL.revokeObjectURL(url);
        reject(err);
      };
      img.src = url;
    });
  }

  async function hashArrayBuffer(arrayBuffer) {
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  clearBtn.disabled = true;
  updateQualitySlider(); // Initial state for quality slider
}

window.addEventListener("load", function () {
  setTimeout(initApp, 200);
});
