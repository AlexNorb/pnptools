class SheetPreview {
  constructor() {
    this.section = document.getElementById("sheetPreviewSection");
    this.contentWrapper = document.getElementById("previewContent");
    this.toggleBtn = document.getElementById("togglePreviewCollapse");
    this.toggleText = document.getElementById("previewCollapseText");
    this.toggleIcon = document.getElementById("previewCollapseIcon");

    this.canvas = document.getElementById("previewCanvas");
    this.emptyState = document.getElementById("previewEmptyState");
    this.loadingState = document.getElementById("previewLoadingState");
    this.statusEl = document.getElementById("previewStatus");
    this.pageNavEl = document.getElementById("previewPageNav");
    this.pageInfoEl = document.getElementById("previewPageInfo");
    this.prevPageBtn = document.getElementById("previewPrevPage");
    this.nextPageBtn = document.getElementById("previewNextPage");

    this.pdfDoc = null;
    this.currentPage = 1;
    this.totalPages = 0;
    this._debounceTimer = null;
    this._renderInFlight = false;
    this.isCollapsed = false;

    this.init();
  }

  init() {
    // Show/Hide collapse handler
    if (this.toggleBtn && this.contentWrapper) {
      this.toggleBtn.addEventListener("click", () => {
        this.isCollapsed = this.contentWrapper.classList.toggle("collapsed");
        if (this.toggleIcon) {
          this.toggleIcon.style.transform = this.isCollapsed ? "rotate(180deg)" : "rotate(0deg)";
        }
        if (this.toggleText) {
          this.toggleText.textContent = this.isCollapsed ? "Show" : "Hide";
        }
        if (!this.isCollapsed) {
          // If expanded, update preview immediately
          this.requestUpdate();
        } else {
          // If collapsed, clear status text
          if (this.statusEl) this.statusEl.textContent = "(Paused)";
        }
      });
    }

    // Page Navigation
    if (this.prevPageBtn) {
      this.prevPageBtn.addEventListener("click", () => {
        if (this.currentPage > 1) {
          this.currentPage--;
          this._renderPage(this.currentPage);
          this._updatePageNav();
        }
      });
    }
    if (this.nextPageBtn) {
      this.nextPageBtn.addEventListener("click", () => {
        if (this.currentPage < this.totalPages) {
          this.currentPage++;
          this._renderPage(this.currentPage);
          this._updatePageNav();
        }
      });
    }

    // Subscribe to image data updates from PreviewPanel
    if (window.PreviewPanel && typeof window.PreviewPanel.onChange === "function") {
      window.PreviewPanel.onChange(() => {
        const mode = window.PreviewPanel.getMode();
        if (mode === "empty") {
          this.hide();
        } else {
          this.show();
          this.requestUpdate();
        }
      });
    }
  }

  show() {
    if (this.section) {
      this.section.style.display = "";
    }
  }

  hide() {
    if (this.section) {
      this.section.style.display = "none";
    }
    this.pdfDoc = null;
    this.totalPages = 0;
    this.currentPage = 1;
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
      this.currentPage = 1;
      this._updatePageNav();

      await this._renderPage(this.currentPage);
      this._showState("canvas");
      if (this.statusEl) this.statusEl.textContent = "";
    } catch (err) {
      console.error("Preview render failed:", err);
      if (this.statusEl) this.statusEl.textContent = "Preview Error";
      this._showState("empty");
    }
  }

  async _renderPage(pageNum) {
    if (!this.pdfDoc || !this.canvas || this._renderInFlight) return;
    this._renderInFlight = true;

    try {
      const page = await this.pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 }); // 1.5x resolution for crisp text/borders

      this.canvas.width = viewport.width;
      this.canvas.height = viewport.height;

      const ctx = this.canvas.getContext("2d");
      await page.render({ canvasContext: ctx, viewport }).promise;
    } catch (err) {
      console.error("Error rendering page:", err);
    } finally {
      this._renderInFlight = false;
    }
  }

  _showState(state) {
    if (this.emptyState) this.emptyState.style.display = state === "empty" ? "" : "none";
    if (this.loadingState) this.loadingState.style.display = state === "loading" ? "" : "none";
    if (this.canvas) this.canvas.style.display = state === "canvas" ? "" : "none";
  }

  _updatePageNav() {
    const show = this.totalPages > 1;
    if (this.pageNavEl) this.pageNavEl.style.display = show ? "" : "none";
    if (this.pageInfoEl) this.pageInfoEl.textContent = `Page ${this.currentPage} / ${this.totalPages}`;
    if (this.prevPageBtn) this.prevPageBtn.disabled = this.currentPage <= 1;
    if (this.nextPageBtn) this.nextPageBtn.disabled = this.currentPage >= this.totalPages;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.SheetPreview = new SheetPreview();
});
