class SheetPreview {
  constructor() {
    this.section = document.getElementById("sheetPreviewSection");
    this.contentWrapper = document.getElementById("sheetPreviewContentWrapper");
    this.toggleBtn = document.getElementById("togglePreviewCollapse");
    this.toggleText = document.getElementById("previewCollapseText");
    this.toggleIcon = document.getElementById("previewCollapseIcon");

    this.zoomBtn = document.getElementById("togglePreviewZoom");
    this.zoomText = document.getElementById("previewZoomText");
    this.zoomIcon = document.getElementById("previewZoomIcon");

    this.canvasContainer = document.getElementById("previewCanvasContainer");
    this.canvasWrapper = document.getElementById("previewCanvasWrapper");
    this.canvasP1 = document.getElementById("previewCanvasP1");
    this.canvasP2 = document.getElementById("previewCanvasP2");
    this.emptyState = document.getElementById("previewEmptyState");
    this.loadingState = document.getElementById("previewLoadingState");
    this.statusEl = document.getElementById("previewStatus");

    this.pdfDoc = null;
    this.totalPages = 0;
    this._debounceTimer = null;
    this._renderInFlight = false;
    this.isCollapsed = true;
    this.isZoomed = false;

    this.init();
  }

  init() {
    // Show/Hide collapse handler — matches 3. Settings pattern exactly
    if (this.toggleBtn && this.contentWrapper) {
      this.toggleBtn.addEventListener("click", () => {
        this.isCollapsed = !this.isCollapsed;
        this.contentWrapper.classList.toggle("collapsed", this.isCollapsed);

        if (this.toggleIcon) {
          this.toggleIcon.style.transform = this.isCollapsed ? "rotate(180deg)" : "rotate(0deg)";
        }
        if (this.toggleText) {
          this.toggleText.textContent = this.isCollapsed ? "Show" : "Hide";
        }
        if (!this.isCollapsed) {
          if (this.statusEl) this.statusEl.textContent = "";
          this.requestUpdate();
        } else {
          if (this.statusEl) this.statusEl.textContent = "";
        }
      });
    }

    // Zoom handler
    if (this.zoomBtn) {
      this.zoomBtn.addEventListener("click", () => {
        this.isZoomed = !this.isZoomed;
        this._updateZoomStyle();
      });
    }

    // Pointer Grab-to-Pan handler
    if (this.canvasContainer) {
      let isDown = false;
      let startX, startY, scrollLeft, scrollTop;

      this.canvasContainer.addEventListener("pointerdown", (e) => {
        if (e.button !== 0 && e.pointerType === "mouse") return;
        isDown = true;
        this.canvasContainer.style.cursor = "grabbing";
        this.canvasContainer.style.userSelect = "none";
        startX = e.pageX - this.canvasContainer.offsetLeft;
        startY = e.pageY - this.canvasContainer.offsetTop;
        scrollLeft = this.canvasContainer.scrollLeft;
        scrollTop = this.canvasContainer.scrollTop;
      });

      const stopDrag = () => {
        if (!isDown) return;
        isDown = false;
        this.canvasContainer.style.cursor = this.isZoomed ? "grab" : "";
        this.canvasContainer.style.userSelect = "";
      };

      this.canvasContainer.addEventListener("pointerleave", stopDrag);
      this.canvasContainer.addEventListener("pointerup", stopDrag);
      this.canvasContainer.addEventListener("pointercancel", stopDrag);

      this.canvasContainer.addEventListener("pointermove", (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - this.canvasContainer.offsetLeft;
        const y = e.pageY - this.canvasContainer.offsetTop;
        const walkX = x - startX;
        const walkY = y - startY;
        this.canvasContainer.scrollLeft = scrollLeft - walkX;
        this.canvasContainer.scrollTop = scrollTop - walkY;
      });
    }

    // Subscribe to image data updates from PreviewPanel
    if (window.PreviewPanel && typeof window.PreviewPanel.onChange === "function") {
      window.PreviewPanel.onChange(() => {
        const mode = window.PreviewPanel.getMode();
        if (mode === "empty") {
          this.pdfDoc = null;
          this.totalPages = 0;
          this._showState("empty");
        } else {
          this.requestUpdate();
        }
      });
    }
  }

  _updateZoomStyle() {
    if (this.zoomIcon) {
      this.zoomIcon.className = this.isZoomed
        ? "fa-solid fa-magnifying-glass-minus text-xs"
        : "fa-solid fa-magnifying-glass-plus text-xs";
    }
    if (this.zoomText) {
      this.zoomText.textContent = this.isZoomed ? "Fit" : "Zoom";
    }

    if (this.canvasContainer) {
      if (this.isZoomed) {
        this.canvasContainer.className = "flex justify-start items-start bg-theme-bg/60 rounded-xl border-2 border-dashed border-theme-dark/30 p-4 transition-all overflow-x-auto custom-scrollbar";
        this.canvasContainer.style.cursor = "grab";
        this.canvasContainer.scrollLeft = 0;
      } else {
        this.canvasContainer.className = "flex justify-center items-center bg-theme-bg/60 rounded-xl border-2 border-dashed border-theme-dark/30 p-4 transition-all overflow-x-auto custom-scrollbar";
        this.canvasContainer.style.cursor = "";
      }
    }

    if (this.canvasWrapper) {
      if (this.isZoomed) {
        this.canvasWrapper.className = "flex flex-row gap-6 justify-start items-start w-max max-w-none p-2";
      } else {
        this.canvasWrapper.className = "flex flex-wrap md:flex-nowrap gap-4 justify-center items-center max-w-full";
      }
    }

    const canvasClass = this.isZoomed
      ? "shadow-md max-w-none w-auto h-auto flex-none"
      : "shadow-sm max-w-full h-auto bg-white flex-1 min-w-0";

    if (this.canvasP1) this.canvasP1.className = canvasClass;
    if (this.canvasP2) this.canvasP2.className = canvasClass;
  }

  show() {
    // Section is always visible now
  }

  hide() {
    // Section is always visible now, we just reset state
    this.pdfDoc = null;
    this.totalPages = 0;
    this._showState("empty");
  }

  // Request debounced preview update
  requestUpdate() {
    // If section is collapsed or hidden, do not waste CPU computations
    if (this.isCollapsed || !this.section || this.section.style.display === "none") {
      return;
    }

    clearTimeout(this._debounceTimer);
    this._debounceTimer = setTimeout(() => {
      this._triggerPreviewGeneration();
    }, 500);
  }

  _triggerPreviewGeneration() {
    if (this.isCollapsed) return;

    const mode = window.PreviewPanel ? window.PreviewPanel.getMode() : "empty";
    if (mode === "empty" || mode === "error") {
      this._showState("empty");
      return;
    }

    this._showState("loading");
    if (this.statusEl) this.statusEl.textContent = "Rendering...";

    if (window.LayoutToolPDF && typeof window.LayoutToolPDF.generatePreview === "function") {
      window.LayoutToolPDF.generatePreview();
    }
  }

  // Callback when worker returns preview PDF bytes
  async onPdfReady(pdfBytes) {
    if (this.isCollapsed || !pdfBytes || !window.pdfjsLib) return;

    try {
      // PDF.js parse
      const loadingTask = window.pdfjsLib.getDocument({ data: pdfBytes });
      this.pdfDoc = await loadingTask.promise;
      this.totalPages = this.pdfDoc.numPages;

      // Render Page 1
      if (this.totalPages >= 1) {
        await this._renderPageToCanvas(1, this.canvasP1);
      }

      // Render Page 2 if present (for 2-page side-by-side spread)
      if (this.totalPages >= 2) {
        await this._renderPageToCanvas(2, this.canvasP2);
        if (this.canvasP2) this.canvasP2.style.display = "";
      } else {
        if (this.canvasP2) this.canvasP2.style.display = "none";
      }

      this._updateZoomStyle();
      this._showState("canvas");
      if (this.statusEl) this.statusEl.textContent = "";
    } catch (err) {
      console.error("Preview render failed:", err);
      if (this.statusEl) this.statusEl.textContent = "Preview Error";
      this._showState("empty");
    }
  }

  async _renderPageToCanvas(pageNum, canvasEl) {
    if (!this.pdfDoc || !canvasEl) return;

    try {
      const page = await this.pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 }); // 1.5x resolution for crisp text/borders

      canvasEl.width = viewport.width;
      canvasEl.height = viewport.height;

      const ctx = canvasEl.getContext("2d");
      await page.render({ canvasContext: ctx, viewport }).promise;
    } catch (err) {
      console.error(`Error rendering page ${pageNum}:`, err);
    }
  }

  _showState(state) {
    if (this.emptyState) this.emptyState.style.display = state === "empty" ? "" : "none";
    if (this.loadingState) this.loadingState.style.display = state === "loading" ? "" : "none";
    if (this.canvasWrapper) this.canvasWrapper.style.display = state === "canvas" ? "" : "none";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.SheetPreview = new SheetPreview();
});
