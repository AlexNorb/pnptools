/**
 * shared-worker-utils.js
 * Shared utility functions and constants for PDF layout workers.
 */

const mmToPt = 2.83464567;
const mmFactor = mmToPt;

/**
 * Detect image type (PNG/JPEG) from ArrayBuffer magic bytes.
 * @param {ArrayBuffer} buffer
 * @returns {string|null} "image/png", "image/jpeg", or null
 */
function getImageType(buffer) {
  const uint8 = new Uint8Array(buffer);
  if (uint8[0] === 0xff && uint8[1] === 0xd8) return "image/jpeg";
  if (
    uint8[0] === 0x89 &&
    uint8[1] === 0x50 &&
    uint8[2] === 0x4e &&
    uint8[3] === 0x47
  )
    return "image/png";
  return null;
}

/**
 * Image embedder helper class for deduplicating images in a PDFDocument.
 */
class ImageEmbedder {
  constructor(pdfDoc) {
    this.pdfDoc = pdfDoc;
    this.lut = {};
  }

  async getOrEmbedImage(imageData) {
    if (!imageData) return null;
    if (!this.lut[imageData]) {
      let embeddedImage = null;
      if (imageData.startsWith("data:image/png;base64,")) {
        embeddedImage = await this.pdfDoc.embedPng(imageData);
      } else if (imageData.startsWith("data:image/jpeg;base64,")) {
        embeddedImage = await this.pdfDoc.embedJpg(imageData);
      }
      if (embeddedImage) {
        this.lut[imageData] = embeddedImage;
      }
    }
    return this.lut[imageData];
  }

  async lookupCard(imageData) {
    return this.getOrEmbedImage(imageData);
  }
}

/**
 * Standalone helper for image lookup/embedding using an external cache object.
 * @param {PDFDocument} pdfDoc
 * @param {Object} lut
 * @param {string} imageData
 */
async function getOrEmbedImage(pdfDoc, lut, imageData) {
  if (!imageData) return null;
  if (!lut[imageData]) {
    let embeddedImage = null;
    if (imageData.startsWith("data:image/png;base64,")) {
      embeddedImage = await pdfDoc.embedPng(imageData);
    } else if (imageData.startsWith("data:image/jpeg;base64,")) {
      embeddedImage = await pdfDoc.embedJpg(imageData);
    }
    if (embeddedImage) {
      lut[imageData] = embeddedImage;
    }
  }
  return lut[imageData];
}

const lookupCard = getOrEmbedImage;

/**
 * Report progress to the main thread.
 * @param {number} done
 * @param {number} all
 */
function reportProgress(done, all) {
  postMessage({
    state: "progress",
    data: { done, all, progress: all > 0 ? Math.round((done * 100) / all) : 0 },
  });
}

/**
 * Report saving status to the main thread.
 */
function reportSaving() {
  postMessage({ state: "saving" });
}

/**
 * Report completion status to the main thread.
 * @param {number} cards
 * @param {number} pages
 * @param {number} bytes
 */
function reportDone(cards, pages, bytes) {
  postMessage({ state: "done", data: { cards, pages, bytes } });
}

/**
 * Draws a rectangle border with optional corner radius on a pdf-lib page.
 * @param {PDFPage} page
 * @param {Object} options
 */
function drawCardBorder(page, options) {
  const {
    x,
    y,
    width,
    height,
    borderColor,
    borderWidth,
    cornerRadius = 0,
    rotate,
  } = options;

  const rectOptions = {
    x,
    y,
    width,
    height,
    borderColor,
    borderWidth,
    rx: 0,
    ry: 0,
  };
  if (rotate !== undefined) {
    rectOptions.rotate = rotate;
  }

  page.drawRectangle(rectOptions);

  if (cornerRadius > 0) {
    page.drawRectangle({
      ...rectOptions,
      rx: cornerRadius,
      ry: cornerRadius,
    });
  }
}

const drawRoundedRect = drawCardBorder;
