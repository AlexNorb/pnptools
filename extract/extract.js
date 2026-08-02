function initApp() {
  // --- PDF.js Worker Setup for Main Thread Preview ---
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
  const clearPdfBtn = document.getElementById("clearPdfBtn");
  const extractBtn = document.getElementById("extractBtn");
  const allPagesToggle = document.getElementById("allPagesToggle");
  const selectionPagesToggle = document.getElementById("selectionPagesToggle");
  const pageRangeInput = document.getElementById("pageRangeInput");
  const status = document.getElementById("status");
  const imagesWrap = document.getElementById("images");
  const resultsBar = document.getElementById("resultsBar");
  const downloadZipBtn = document.getElementById("downloadZip");
  const resultsSummaryText = document.getElementById("resultsSummaryText");
  const previewSummaryText = document.getElementById("previewSummaryText");

  const pageProgressBar = document.getElementById("pageProgressBar");
  const progressBarFill = document.getElementById("progressBarFill");

  // DOM Elements for Options & Preview
  const toggleThumbsBtn = document.getElementById("toggleThumbsBtn");
  const formatOriginal = document.getElementById("formatOriginal");
  const formatJpeg = document.getElementById("formatJpeg");
  const jpegQualityWrapper = document.getElementById("jpegQualityWrapper");
  const jpegQualitySelect = document.getElementById("jpegQualitySelect");
  const addUsageSuffix = document.getElementById("addUsageSuffix");

  // Loaded PDFs state: Array<{ name: string, safeName: string, arrayBuffer: ArrayBuffer, pdfDocument: object, maxPages: number }>
  let loadedPdfs = [];
  let totalMaxPages = 0;
  let currentDocName = "";
  let isLoading = false;
  let inProgress = false;
  let areThumbsVisible = false;
  let areThumbsRendered = false;

  // imageStore structure: Map<hash, { name: string, blob: Blob, tempUrl: string, width: number, height: number, referenceCount: number, pages: number[] }>
  let imageStore = new Map();

  // --- Format and Logging Helper Functions ---

  function formatSize(bytes) {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = 1;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  }

  function formatSizeToMB(bytes) {
    if (!bytes || bytes === 0) return "0.0";
    const mb = bytes / (1024 * 1024);
    return mb.toFixed(mb < 1 ? 2 : 1);
  }

  function getMimeTypeFromExt(ext) {
    const cleanExt = (ext || "").toLowerCase();
    if (cleanExt === "jpg" || cleanExt === "jpeg") return "image/jpeg";
    if (cleanExt === "png") return "image/png";
    if (cleanExt === "jp2" || cleanExt === "jpx") return "image/jp2";
    if (cleanExt === "webp") return "image/webp";
    if (cleanExt === "bmp") return "image/bmp";
    if (cleanExt === "tif" || cleanExt === "tiff") return "image/tiff";
    return "application/octet-stream";
  }

  function log(message, type = "info") {
    const prefix = "[Extract]";
    if (type === "error") {
      console.error(prefix, message);
    } else if (type === "warn") {
      console.warn(prefix, message);
    } else {
      console.log(prefix, message);
    }
  }

  function updateProgressBar(percentage) {
    const clamped = Math.min(100, Math.max(0, percentage));
    progressBarFill.style.width = `${clamped}%`;
  }

  // --- CORE LOGIC: Page Range Parsing ---

  function parsePageRange(rangeString, max) {
    const pages = new Set();
    const parts = rangeString.split(",");

    for (const part of parts) {
      const trimmedPart = part.trim();
      if (!trimmedPart) continue;

      if (trimmedPart.includes("-")) {
        const [startStr, endStr] = trimmedPart.split("-").map((s) => s.trim());
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
    if (loadedPdfs.length === 0 || max <= 0) return [];

    if (allPagesToggle.checked) {
      return Array.from({ length: max }, (_, i) => i + 1);
    } else {
      return parsePageRange(pageRangeInput.value, max);
    }
  }

  // --- UI Event Listeners ---

  // Format Selection Toggle
  const handleFormatChange = () => {
    if (formatJpeg && formatJpeg.checked) {
      jpegQualityWrapper?.classList.remove("hidden");
    } else {
      jpegQualityWrapper?.classList.add("hidden");
    }
  };

  if (formatOriginal) formatOriginal.addEventListener("change", handleFormatChange);
  if (formatJpeg) formatJpeg.addEventListener("change", handleFormatChange);

  // 1. PDF File Selection (Supports multiple PDFs)
  fileInput.addEventListener("change", async (ev) => {
    const files = ev.target.files;
    if (!files || files.length === 0 || isLoading) return;

    clearAll(true);
    extractBtn.disabled = true;
    if (clearPdfBtn) clearPdfBtn.disabled = true;

    await loadPdfs(Array.from(files));
    fileInput.value = null;
  });

  // Clear / Reset PDFs Button
  if (clearPdfBtn) {
    clearPdfBtn.addEventListener("click", () => {
      clearAll(true);
    });
  }

  // 2. Page Range Toggle Control
  const handlePageModeChange = () => {
    const isAll = allPagesToggle.checked;
    pageRangeInput.disabled = isAll;
    extractBtn.disabled = loadedPdfs.length === 0 || inProgress;

    if (isAll && totalMaxPages > 0) {
      pageRangeInput.value = `1-${totalMaxPages}`;
    } else if (!isAll) {
      pageRangeInput.focus();
    }
  };

  allPagesToggle.addEventListener("change", handlePageModeChange);
  selectionPagesToggle.addEventListener("change", handlePageModeChange);

  // 3. Extraction Trigger
  extractBtn.addEventListener("click", async () => {
    if (inProgress || loadedPdfs.length === 0) return;

    const pagesToProcess = getPagesToProcess(totalMaxPages);

    if (pagesToProcess.length === 0) {
      log("[ERROR] Invalid or empty page range specified.", "error");
      status.textContent = "Extraction failed: Invalid page range.";
      extractBtn.disabled = loadedPdfs.length === 0;
      return;
    }

    await startWasmExtraction(pagesToProcess);
  });

  // Thumbnail/Preview Toggle Accordion
  const imagesContentWrapper = document.getElementById("imagesContentWrapper");
  const previewCollapseText = document.getElementById("previewCollapseText");
  const previewCollapseIcon = document.getElementById("previewCollapseIcon");

  toggleThumbsBtn.addEventListener("click", () => {
    if (toggleThumbsBtn.disabled) return;

    areThumbsVisible = !areThumbsVisible;

    if (areThumbsVisible) {
      if (!areThumbsRendered) {
        renderThumbnails();
        areThumbsRendered = true;
      }
      imagesContentWrapper.classList.remove("collapsed");
      if (previewCollapseText) previewCollapseText.textContent = "Hide";
      if (previewCollapseIcon) previewCollapseIcon.style.transform = "rotate(0deg)";
    } else {
      imagesContentWrapper.classList.add("collapsed");
      if (previewCollapseText) previewCollapseText.textContent = "Show";
      if (previewCollapseIcon) previewCollapseIcon.style.transform = "rotate(180deg)";
    }
  });

  // Save ZIP Button Handler
  downloadZipBtn.addEventListener("click", async () => {
    if (imageStore.size === 0) return;
    downloadZipBtn.disabled = true;

    const includedImages = [];
    let totalIncludedBytes = 0;

    for (const [hash, rec] of imageStore.entries()) {
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
    updateProgressBar(100);

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
      const doneMsg = `[INFO] ZIP ready. ${count} selected image(s) saved. (Final size: ${formatSize(zipBlob.size)})`;
      status.textContent = doneMsg;
      log(doneMsg);

      downloadZipBtn.innerHTML = `<i class="fa-solid fa-file-zipper"></i> Save ZIP`;
      if (resultsSummaryText) {
        resultsSummaryText.textContent = `${count} images (~${actualZipSizeMB} MB)`;
      }
    } catch (err) {
      const errorMsg = "[ERROR] Error creating ZIP: " + ((err && err.message) || err);
      status.textContent = errorMsg;
      log(errorMsg, "error");
    } finally {
      const finalCount = Array.from(imageStore.entries()).filter(([hash]) => {
        const checkbox = document.getElementById(`include-${hash}`);
        return !checkbox || checkbox.checked;
      }).length;

      downloadZipBtn.disabled = !(finalCount > 0);
      pageProgressBar.classList.add("hidden");
    }
  });

  /**
   * Resets all stored data and UI state.
   */
  function clearAll(fullReset = false) {
    log(`[INFO] Clearing ${fullReset ? "all app state" : "previous results"}...`);

    imageStore.forEach((rec) => {
      if (rec.tempUrl) URL.revokeObjectURL(rec.tempUrl);
    });
    imageStore.clear();

    imagesWrap.innerHTML = "";
    if (imagesContentWrapper) {
      imagesContentWrapper.classList.add("collapsed");
    }
    pageProgressBar.classList.add("hidden");

    areThumbsVisible = false;
    areThumbsRendered = false;

    if (previewCollapseText) previewCollapseText.textContent = "Show";
    if (previewCollapseIcon) previewCollapseIcon.style.transform = "rotate(180deg)";
    toggleThumbsBtn.disabled = true;

    downloadZipBtn.disabled = true;
    downloadZipBtn.innerHTML = `<i class="fa-solid fa-file-zipper"></i> Save ZIP`;
    if (resultsSummaryText) {
      resultsSummaryText.textContent = `0 images found`;
    }
    if (previewSummaryText) {
      previewSummaryText.textContent = "";
    }

    if (fullReset) {
      loadedPdfs = [];
      totalMaxPages = 0;
      currentDocName = "";

      status.textContent = "No PDF loaded.";

      if (clearPdfBtn) clearPdfBtn.disabled = true;
      extractBtn.disabled = true;
      pageRangeInput.value = "";
      pageRangeInput.disabled = true;
      allPagesToggle.checked = true;
    }
  }

  /**
   * Loads multiple PDF files.
   */
  async function loadPdfs(files) {
    if (isLoading) return;
    isLoading = true;

    try {
      loadedPdfs = [];
      totalMaxPages = 0;

      status.innerHTML = `<span class="spinner"></span>[PROGRESS] Reading ${files.length} PDF file(s)...`;
      log(`[INFO] Loading ${files.length} PDF file(s)...`);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const rawDocName = file.name.replace(/\.pdf$/i, "");
        const safeDocName = rawDocName.replace(/[^\w\d-_\.]/g, "_");

        const buffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: buffer.slice(0) });
        const doc = await loadingTask.promise;

        loadedPdfs.push({
          name: file.name,
          safeName: safeDocName,
          arrayBuffer: buffer,
          pdfDocument: doc,
          maxPages: doc.numPages
        });

        totalMaxPages += doc.numPages;
      }

      if (loadedPdfs.length === 1) {
        currentDocName = loadedPdfs[0].safeName;
      } else {
        currentDocName = "extracted_images";
      }

      pageRangeInput.value = `1-${totalMaxPages}`;
      pageRangeInput.disabled = allPagesToggle.checked;
      extractBtn.disabled = false;
      if (clearPdfBtn) clearPdfBtn.disabled = false;

      const fileNames = loadedPdfs.map(p => p.name).join(", ");
      const msg = loadedPdfs.length === 1
        ? `${loadedPdfs[0].name} (${loadedPdfs[0].maxPages} pages) ready.`
        : `${loadedPdfs.length} PDFs loaded (${totalMaxPages} total pages) ready.`;

      status.textContent = msg;
      status.title = fileNames;
      log(`[INFO] ${loadedPdfs.length} PDF(s) loaded (${totalMaxPages} pages). Ready for extraction.`);
    } catch (err) {
      const errorMsg = "[ERROR] Fatal error during PDF loading: " + ((err && err.message) || err);
      status.textContent = errorMsg;
      log(errorMsg, "error");
      loadedPdfs = [];
      totalMaxPages = 0;
      currentDocName = "";
      if (clearPdfBtn) clearPdfBtn.disabled = true;
    } finally {
      isLoading = false;
    }
  }

  let extractionWorker = null;

  function getWorker() {
    if (!extractionWorker) {
      extractionWorker = new Worker("./worker.js", { type: "module" });
    }
    return extractionWorker;
  }

  function runWorkerExtraction(pdfBuffer, pagesToProcess, options, onProgress) {
    return new Promise((resolve, reject) => {
      const worker = getWorker();

      worker.onmessage = async (e) => {
        const { type, text, current, total, images, error } = e.data;
        if (type === "progress") {
          if (onProgress) await onProgress(text, current, total);
        } else if (type === "complete") {
          resolve(images);
        } else if (type === "error") {
          if (extractionWorker) {
            extractionWorker.terminate();
            extractionWorker = null;
          }
          reject(new Error(error));
        }
      };

      worker.onerror = (err) => {
        if (extractionWorker) {
          extractionWorker.terminate();
          extractionWorker = null;
        }
        reject(new Error(err.message || "Web Worker error"));
      };

      const bufferCopy = pdfBuffer.slice(0);
      worker.postMessage(
        {
          pdfBuffer: bufferCopy,
          pagesToProcess: pagesToProcess,
          options: options
        },
        [bufferCopy]
      );
    });
  }

  /**
   * Step 2: Runs PyMuPDF WASM extraction across all loaded PDFs.
   */
  async function startWasmExtraction(pagesToProcess) {
    if (inProgress || loadedPdfs.length === 0) return;
    inProgress = true;
    extractBtn.disabled = true;
    if (clearPdfBtn) clearPdfBtn.disabled = true;

    clearAll(false);

    const formatMode = formatJpeg && formatJpeg.checked ? "jpeg" : "original";
    const jpegQuality = parseFloat(jpegQualitySelect ? jpegQualitySelect.value : "0.90") || 0.90;
    const shouldAddUsageSuffix = addUsageSuffix ? addUsageSuffix.checked : true;

    log(`[INFO] Starting WASM extraction across ${loadedPdfs.length} PDF(s).`);
    log(`[CONFIG] Mode: ${formatMode.toUpperCase()}` + (formatMode === "jpeg" ? ` (Quality: ${jpegQuality})` : ""), "config");

    pageProgressBar.classList.remove("hidden");
    updateProgressBar(5);
    status.innerHTML = `<span class="spinner"></span>Sharpening blade...`;

    const bladeStartTime = Date.now();
    const MAX_BLADE_TIME_MS = 600;
    let hasBladeDelayElapsed = false;

    try {
      const allExtractedImages = [];
      const totalPdfs = loadedPdfs.length;

      for (let pIdx = 0; pIdx < totalPdfs; pIdx++) {
        const pdfItem = loadedPdfs[pIdx];
        const pdfLabel = totalPdfs > 1 ? `[PDF ${pIdx + 1}/${totalPdfs}: ${pdfItem.name}] ` : "";

        const pdfImages = await runWorkerExtraction(
          pdfItem.arrayBuffer,
          pagesToProcess,
          { formatMode, jpegQuality },
          async (text, current, total) => {
            const cleanText = (text || "").replace(/^\[PROGRESS\]\s*/, "");

            if (!hasBladeDelayElapsed && cleanText !== "Sharpening blade...") {
              const elapsed = Date.now() - bladeStartTime;
              if (elapsed < MAX_BLADE_TIME_MS) {
                await new Promise((r) => setTimeout(r, MAX_BLADE_TIME_MS - elapsed));
              }
              hasBladeDelayElapsed = true;
            }

            status.innerHTML = `<span class="spinner"></span>${pdfLabel}${cleanText}`;
            const overallProgress = Math.floor(((pIdx + ((current || 0) / 100)) / totalPdfs) * 100);
            updateProgressBar(overallProgress);
          }
        );

        if (pdfImages && pdfImages.length > 0) {
          allExtractedImages.push(...pdfImages);
        }
      }

      handleExtractionComplete(allExtractedImages, shouldAddUsageSuffix);
    } catch (err) {
      handleExtractionError(err.message || String(err));
    } finally {
      if (clearPdfBtn) clearPdfBtn.disabled = false;
    }
  }

  /**
   * Handles successfully extracted image payloads from Web Worker.
   */
  function handleExtractionComplete(extractedImages, shouldAddUsageSuffix) {
    pageProgressBar.classList.add("hidden");
    inProgress = false;
    extractBtn.disabled = loadedPdfs.length === 0;

    if (!extractedImages || extractedImages.length === 0) {
      const msg = "[INFO] Extraction complete. No embedded images found in selected pages.";
      status.textContent = msg;
      log(msg);
      resultsBar.classList.remove("hidden");
      downloadZipBtn.disabled = true;
      return;
    }

    log(`[INFO] Processing ${extractedImages.length} extracted image object(s)...`);

    let totalBytes = 0;

    extractedImages.forEach((rec, index) => {
      const hashKey = rec.hash || `img_${index}`;

      if (imageStore.has(hashKey)) {
        // Multi-PDF deduplication: accumulate reference counts and pages
        const existing = imageStore.get(hashKey);
        existing.referenceCount += (rec.referenceCount || 1);
        if (rec.pages) {
          rec.pages.forEach(p => {
            if (!existing.pages.includes(p)) existing.pages.push(p);
          });
        }
      } else {
        const sequenceNum = String(imageStore.size + 1).padStart(3, "0");
        const refSuffix = shouldAddUsageSuffix ? `_x${rec.referenceCount || 1}` : "";
        const fileName = `img_${sequenceNum}${refSuffix}.${rec.extension}`;

        const mimeType = getMimeTypeFromExt(rec.extension);
        const blob = new Blob([rec.bytes], { type: mimeType });

        totalBytes += blob.size;

        imageStore.set(hashKey, {
          name: fileName,
          blob: blob,
          tempUrl: null,
          width: rec.width || 0,
          height: rec.height || 0,
          referenceCount: rec.referenceCount || 1,
          pages: rec.pages || []
        });
      }
    });

    const totalCount = imageStore.size;
    const totalSizeMB = formatSizeToMB(totalBytes);
    const totalSizeFormatted = formatSize(totalBytes);

    let totalCopies = 0;
    imageStore.forEach((rec) => {
      totalCopies += (rec.referenceCount || 1);
    });

    if (previewSummaryText) {
      previewSummaryText.textContent = `${totalCount} unique image${totalCount === 1 ? "" : "s"} used ${totalCopies} time${totalCopies === 1 ? "" : "s"} in total`;
    }

    const doneMsg = `[INFO] Extraction complete. ${totalCount} unique image(s) extracted (${totalSizeFormatted}).`;
    status.textContent = doneMsg;
    log(doneMsg);

    resultsBar.classList.remove("hidden");
    downloadZipBtn.disabled = totalCount === 0;
    if (resultsSummaryText) {
      resultsSummaryText.textContent = `${totalCount} images (~${totalSizeMB} MB)`;
    }

    if (totalCount > 0) {
      toggleThumbsBtn.disabled = false;
    }
  }

  /**
   * Handles errors from worker extraction.
   */
  function handleExtractionError(errorMsg) {
    pageProgressBar.classList.add("hidden");
    inProgress = false;
    extractBtn.disabled = loadedPdfs.length === 0;

    const formattedErr = `[ERROR] Image extraction failed: ${errorMsg}`;
    status.textContent = formattedErr;
    log(formattedErr, "error");
  }

  /**
   * Lazy-renders thumbnail previews when user expands Section 3 (Preview).
   */
  function renderThumbnails() {
    if (areThumbsRendered) return;

    imagesWrap.innerHTML = "";
    log(`[INFO] Generating ${imageStore.size} thumbnail previews...`);

    for (const [hash, rec] of imageStore) {
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

      // Row 1: Filename & Dimensions
      const row = document.createElement("div");
      row.className = "row flex justify-between items-start gap-2 w-full break-all";

      const nameEl = document.createElement("div");
      nameEl.className = "filename font-medium text-theme-dark flex-1 truncate";
      nameEl.id = `name-${hash}`;
      nameEl.textContent = rec.name;
      nameEl.title = rec.name;

      const resolutionEl = document.createElement("div");
      resolutionEl.className = "resolution font-bold text-theme-indigo whitespace-nowrap";
      resolutionEl.textContent = rec.width && rec.height ? `${rec.width}x${rec.height}px` : formatSize(rec.blob.size);

      row.appendChild(nameEl);
      row.appendChild(resolutionEl);

      // Row 2: Page usage & reference count badge
      const usageRow = document.createElement("div");
      usageRow.className = "flex justify-between items-center text-[11px] text-theme-muted";

      const usageBadge = document.createElement("span");
      usageBadge.className = "bg-theme-yellow/60 border border-theme-dark rounded px-1.5 py-0.5 font-bold text-theme-dark";
      usageBadge.textContent = `Used ${rec.referenceCount}x`;

      const pagesInfo = document.createElement("span");
      pagesInfo.className = "truncate ml-1 font-mono text-[10px]";
      pagesInfo.textContent = rec.pages && rec.pages.length > 0 ? `Pg ${rec.pages.join(",")}` : "";
      pagesInfo.title = rec.pages && rec.pages.length > 0 ? `Appears on page(s): ${rec.pages.join(", ")}` : "";

      usageRow.appendChild(usageBadge);
      usageRow.appendChild(pagesInfo);

      // Row 3: Controls (Include checkbox & Save button)
      const controls = document.createElement("div");
      controls.className = "controls flex items-center justify-between gap-2 mt-1";

      const checkboxId = `include-${hash}`;
      const includeLabel = document.createElement("label");
      includeLabel.className = "flex items-center gap-1.5 cursor-pointer text-theme-muted hover:text-theme-dark font-medium";

      const includeCheckbox = document.createElement("input");
      includeCheckbox.type = "checkbox";
      includeCheckbox.id = checkboxId;
      includeCheckbox.checked = true;
      includeCheckbox.className = "accent-theme-indigo cursor-pointer";

      includeCheckbox.addEventListener("change", () => {
        const totalBytes = Array.from(imageStore.entries())
          .filter(([h]) => {
            const cb = document.getElementById(`include-${h}`);
            return cb && cb.checked;
          })
          .reduce((sum, [, r]) => sum + r.blob.size, 0);

        const finalCount = Array.from(imageStore.entries()).filter(([h]) => {
          const cb = document.getElementById(`include-${h}`);
          return cb && cb.checked;
        }).length;

        const totalSizeMB = formatSizeToMB(totalBytes);
        downloadZipBtn.innerHTML = `<i class="fa-solid fa-file-zipper"></i> Save ZIP`;
        if (resultsSummaryText) {
          resultsSummaryText.textContent = `${finalCount} images (~${totalSizeMB} MB)`;
        }
        downloadZipBtn.disabled = finalCount === 0;
      });

      includeLabel.appendChild(includeCheckbox);
      includeLabel.appendChild(document.createTextNode("Include"));

      const dl = document.createElement("a");
      dl.href = rec.tempUrl;
      dl.className = "btn-pink text-[11px] px-2 h-6 min-h-0 py-0";
      dl.textContent = "Save";
      dl.download = rec.name;

      controls.appendChild(includeLabel);
      controls.appendChild(dl);

      meta.appendChild(row);
      meta.appendChild(usageRow);
      meta.appendChild(controls);

      div.appendChild(imgWrap);
      div.appendChild(meta);
      imagesWrap.appendChild(div);
    }

    areThumbsRendered = true;
    log(`[INFO] Thumbnail rendering complete.`);
  }
}

window.addEventListener("load", function () {
  setTimeout(initApp, 200);
});
