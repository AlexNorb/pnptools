const LayoutToolPDF = {
  workers: {},
  pdfResponsePromise: null, // To hold the promise for PDF data

  init() {
    this.workers.doubleSided = new Worker("layout-generator-worker.js");
    this.workers.foldable = new Worker("foldable-layout-worker.js");

    const onWorkerMessage = (event) => {
      const { state, status, pdfBytes, error, pdf, data } = event.data;

      if (error) {
        console.error("Error from PDF worker:", error);
        alert(`An error occurred during PDF generation: ${error}`);
        window.LayoutToolUI.ui.toggleProgressUI(false);
        return;
      }

      if (state === "progress") {
        window.LayoutToolUI.ui.updateProgress(data);
        return;
      }

      if (state === "saving") {
        window.LayoutToolUI.ui.updateStatus("Saving PDF...");
        return;
      }

      let finalPdfBytes = null;
      if ((state === "done" || status === "done") && pdfBytes) {
        finalPdfBytes = pdfBytes;
      } else if (pdf && pdf.pdfBytes) {
        finalPdfBytes = pdf.pdfBytes;
      }

      if (finalPdfBytes) {
        const blob = new Blob([finalPdfBytes], { type: "application/pdf" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "output.pdf";
        link.click();
        window.LayoutToolUI.ui.toggleProgressUI(false);
      }
    };

    this.workers.doubleSided.onmessage = onWorkerMessage;
    this.workers.foldable.onmessage = onWorkerMessage;

    // Listener for data coming back from the previewer iframe
    window.addEventListener('message', (event) => {
        if (event.data.type === 'preview-data-response' && this.pdfResponsePromise) {
            this.pdfResponsePromise.resolve(event.data.data);
            this.pdfResponsePromise = null; // Reset promise
        }
    });
  },

  utils: {
    // ... (keep existing utils)
    getImageType(buffer) {
      const uint8 = new Uint8Array(buffer);
      if (uint8[0] === 0xff && uint8[1] === 0xd8) return "image/jpeg";
      if (uint8[0] === 0x89 && uint8[1] === 0x50 && uint8[2] === 0x4e && uint8[3] === 0x47) return "image/png";
      return null;
    },
    hexToRgb(hex) {
      const hexString = (hex || "#000000").slice(1);
      const match = hexString.match(/[a-f\d]{2}/gi);
      if (!match || match.length !== 3) return [0, 0, 0];
      return match.map((x) => parseInt(x, 16) / 255);
    },
    updateColor(input) {
      const { rgb } = PDFLib;
      const rgbValues = this.hexToRgb(input.value);
      return rgb(...rgbValues);
    },
  },

  async readFiles(files) {
    const filePromises = Array.from(files).map((file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
        reader.readAsDataURL(file);
      });
    });
    return Promise.all(filePromises);
  },

  async sendDataToPreviewer() {
      const { frontImages, backImages } = window.LayoutToolUI.elements;
      const frontFiles = frontImages.files;
      const backFiles = backImages.files;

      if (frontFiles.length === 0) {
          // You can optionally alert the user or just send empty data
          console.log("No front images selected to preview.");
      }

      try {
          const frontImageUrls = await this.readFiles(frontFiles);
          const backImageUrls = await this.readFiles(backFiles);

          const previewerFrame = document.getElementById('previewerFrame');
          if (previewerFrame && previewerFrame.contentWindow) {
              previewerFrame.contentWindow.postMessage({
                  type: 'init-preview',
                  data: {
                      fronts: frontImageUrls,
                      backs: backImageUrls
                  }
              }, '*');
          }
      } catch (error) {
          console.error("Error reading files for previewer:", error);
          alert("Could not read files for the previewer. Please check the console.");
      }
  },

  getPreviewData() {
      return new Promise((resolve, reject) => {
          this.pdfResponsePromise = { resolve, reject };
          const previewerFrame = document.getElementById('previewerFrame');
          
          if (previewerFrame && previewerFrame.contentWindow) {
              previewerFrame.contentWindow.postMessage({ type: 'get-preview-data' }, '*');
          } else {
              reject(new Error("Previewer frame not found."));
          }

          // Timeout to prevent waiting forever
          setTimeout(() => {
              if (this.pdfResponsePromise) {
                  this.pdfResponsePromise.reject(new Error('Timeout waiting for preview data.'));
                  this.pdfResponsePromise = null;
              }
          }, 5000);
      });
  },

  async generatePDF() {
    window.LayoutToolUI.ui.toggleProgressUI(true);

    const settings = window.LayoutToolUI.getSettings();
    const layoutMode = settings.layoutMode;
    const usePreviewer = window.LayoutToolUI.elements.usePreviewer.checked;

    try {
        let frontImageUrls = [];
        let backImageUrls = [];

        if (usePreviewer) {
            // New flow: Get data from the iframe
            const previewData = await this.getPreviewData();
            frontImageUrls = previewData.frontImages;
            backImageUrls = previewData.backImages;

            if (frontImageUrls.length === 0) {
                alert("Error: No valid image pairs were finalized in the previewer.");
                window.LayoutToolUI.ui.toggleProgressUI(false);
                return;
            }

        } else {
            // Original flow: Read from file inputs
            const { frontImages, backImages } = window.LayoutToolUI.elements;
            const frontFiles = frontImages.files;
            const backFiles = backImages.files;

            if (frontFiles.length < 1) {
                alert("Error: No front images selected.");
                window.LayoutToolUI.ui.toggleProgressUI(false);
                return;
            }

            const singleBack = backFiles.length === 1;
            const noBack = backFiles.length === 0;
            if (frontFiles.length !== backFiles.length && !singleBack && !noBack) {
                alert("Error: Number of backs must be 0, 1, or the same as fronts.");
                window.LayoutToolUI.ui.toggleProgressUI(false);
                return;
            }

            frontImageUrls = await this.readFiles(frontFiles);
            backImageUrls = await this.readFiles(backFiles);
        }

        // --- Common logic for sending to worker ---
        if (layoutMode === "doubleSided") {
            const config = {
                borderColor: this.utils.hexToRgb(document.getElementById("borderColor").value),
                crosshairColor: this.utils.hexToRgb(document.getElementById("crosshaircolor").value),
            };
            this.workers.doubleSided.postMessage({
                frontImages: frontImageUrls,
                backImages: backImageUrls,
                settings,
                config,
            });
        } else if (layoutMode === "foldable") {
            let cards = [];
            for (let i = 0; i < frontImageUrls.length; i++) {
                const front = frontImageUrls[i];
                // In foldable mode, the number of backs must match fronts (or be 1 or 0)
                // The previewer already handles this logic for us.
                const back = backImageUrls[i] || (backImageUrls.length === 1 ? backImageUrls[0] : front);
                cards.push({ front, back });
            }
            this.workers.foldable.postMessage({
                generatePdf: {
                    cards: cards,
                    options: settings,
                },
            });
        }

    } catch (error) {
      console.error("Error during PDF preparation:", error.message);
      alert(`An unexpected error occurred: ${error.message}`);
      window.LayoutToolUI.ui.toggleProgressUI(false);
    }
  },
};

// Initialize the object and the worker
LayoutToolPDF.init();
window.LayoutToolPDF = LayoutToolPDF;
