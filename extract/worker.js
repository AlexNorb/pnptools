import { PyMuPDF } from "https://cdn.jsdelivr.net/npm/@bentopdf/pymupdf-wasm@0.11.16/dist/index.js";

let pymupdfInstance = null;

async function getEngine() {
  if (!pymupdfInstance) {
    self.postMessage({
      type: "progress",
      current: 0,
      total: 100,
      text: "[PROGRESS] Initializing PyMuPDF WASM engine..."
    });
    
    pymupdfInstance = new PyMuPDF({
      assetPath: "https://cdn.jsdelivr.net/npm/@bentopdf/pymupdf-wasm@0.11.16/assets/"
    });
    await pymupdfInstance.load();
  }
  return pymupdfInstance;
}

async function computeSha256(uint8Array) {
  const hashBuffer = await crypto.subtle.digest("SHA-256", uint8Array);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

async function convertToJpeg(imageBytes, ext, quality = 0.90) {
  try {
    let mime = "image/png";
    if (ext === "jp2" || ext === "jpeg2000") mime = "image/jp2";
    else if (ext === "bmp") mime = "image/bmp";
    else if (ext === "webp") mime = "image/webp";

    const blob = new Blob([imageBytes], { type: mime });
    const imageBitmap = await createImageBitmap(blob);
    const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
    const ctx = canvas.getContext("2d");
    
    // Fill white background to handle transparency safely when exporting to JPEG
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, imageBitmap.width, imageBitmap.height);
    ctx.drawImage(imageBitmap, 0, 0);
    imageBitmap.close();

    const convertedBlob = await canvas.convertToBlob({ type: "image/jpeg", quality: quality });
    const arrayBuffer = await convertedBlob.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } catch (err) {
    console.warn("[Worker] Conversion to JPEG failed, using raw bytes:", err);
    return imageBytes;
  }
}

self.onmessage = async (e) => {
  const { pdfBuffer, pagesToProcess, options } = e.data;
  const { formatMode = "original", jpegQuality = 0.90 } = options || {};

  try {
    const engine = await getEngine();
    
    self.postMessage({
      type: "progress",
      current: 5,
      total: 100,
      text: "[PROGRESS] Opening PDF document in WASM..."
    });

    const doc = await engine.open(new Blob([pdfBuffer]));
    const totalDocPages = doc.pageCount;
    
    const pages = (Array.isArray(pagesToProcess) && pagesToProcess.length > 0)
      ? pagesToProcess
      : Array.from({ length: totalDocPages }, (_, i) => i + 1);

    self.postMessage({
      type: "progress",
      current: 10,
      total: 100,
      text: `[PROGRESS] Discovering image objects across ${pages.length} page(s)...`
    });

    // --- STEP 2: DISCOVER IMAGES & PRIMARY XREF DEDUPLICATION ---
    // Map<xref, { xref: number, pages: Set<number>, info: object }>
    const xrefMap = new Map();

    for (let i = 0; i < pages.length; i++) {
      const pageNum = pages[i];
      const pageIndex = pageNum - 1;
      
      if (pageIndex >= 0 && pageIndex < totalDocPages) {
        try {
          const page = doc.getPage(pageIndex);
          const images = page.getImages();

          for (const img of images) {
            if (!img.xref || img.xref <= 0) continue;

            if (!xrefMap.has(img.xref)) {
              xrefMap.set(img.xref, {
                xref: img.xref,
                referenceCount: 1,
                pages: new Set([pageNum]),
                info: img,
                pageObj: page
              });
            } else {
              const entry = xrefMap.get(img.xref);
              entry.referenceCount += 1;
              entry.pages.add(pageNum);
            }
          }
        } catch (pageErr) {
          console.warn(`[Worker] Error getting images on page ${pageNum}:`, pageErr);
        }
      }

      const progressPct = 10 + Math.floor((i / pages.length) * 30);
      self.postMessage({
        type: "progress",
        current: progressPct,
        total: 100,
        text: `[PROGRESS] Scanned page ${i + 1}/${pages.length}...`
      });
    }

    const uniqueXrefs = Array.from(xrefMap.values());
    const totalXrefs = uniqueXrefs.length;

    self.postMessage({
      type: "progress",
      current: 40,
      total: 100,
      text: `[PROGRESS] Found ${totalXrefs} unique xref object(s). Extracting byte streams...`
    });

    // --- STEP 3 & 4: EXTRACTION & SECONDARY HASH DEDUPLICATION ---
    // Map<hash, ExtractedImageRecord>
    const extractedHashMap = new Map();
    const transferables = [];

    for (let i = 0; i < totalXrefs; i++) {
      const { xref, referenceCount, pages: pageSet, info, pageObj } = uniqueXrefs[i];

      try {
        let rawExtracted = null;
        if (typeof doc.extractImage === "function") {
          rawExtracted = doc.extractImage(xref);
        } else if (pageObj && typeof pageObj.extractImage === "function") {
          rawExtracted = pageObj.extractImage(xref);
        }

        if (rawExtracted && rawExtracted.data && rawExtracted.data.length > 0) {
          let imageBytes = rawExtracted.data;
          let ext = (rawExtracted.ext || "png").toLowerCase();
          if (ext === "jpeg") ext = "jpg";

          // Calculate SHA-256 byte hash
          const hash = await computeSha256(imageBytes);

          if (extractedHashMap.has(hash)) {
            // Secondary deduplication: merge pages and add reference count
            const existing = extractedHashMap.get(hash);
            pageSet.forEach((p) => existing.pages.add(p));
            existing.referenceCount += referenceCount;
          } else {
            // Optional JPEG Conversion
            if (formatMode === "jpeg" && ext !== "jpg") {
              imageBytes = await convertToJpeg(imageBytes, ext, jpegQuality);
              ext = "jpg";
            }

            const record = {
              xref: xref,
              extension: ext,
              bytes: imageBytes,
              width: rawExtracted.width || info.width || 0,
              height: rawExtracted.height || info.height || 0,
              referenceCount: referenceCount,
              pages: Array.from(pageSet).sort((a, b) => a - b),
              hash: hash
            };

            extractedHashMap.set(hash, record);
            transferables.push(imageBytes.buffer);
          }
        }
      } catch (extractErr) {
        console.warn(`[Worker] Error extracting xref ${xref}:`, extractErr);
      }

      const progressPct = 40 + Math.floor((i / totalXrefs) * 55);
      self.postMessage({
        type: "progress",
        current: progressPct,
        total: 100,
        text: `[PROGRESS] Extracted image ${i + 1}/${totalXrefs}...`
      });
    }

    // --- MEMORY CLEANUP ---
    try {
      if (typeof doc.close === "function") {
        doc.close();
      }
    } catch (cleanErr) {
      console.warn("[Worker] Document cleanup notice:", cleanErr);
    }

    const finalResults = Array.from(extractedHashMap.values()).map(rec => ({
      ...rec,
      pages: Array.from(rec.pages)
    }));

    self.postMessage({
      type: "complete",
      images: finalResults
    }, transferables);

  } catch (err) {
    self.postMessage({
      type: "error",
      error: err.message || String(err)
    });
  }
};
