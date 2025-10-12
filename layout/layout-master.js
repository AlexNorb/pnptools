const LayoutToolPDF = {
  workers: {},

  init() {
    this.workers.doubleSided = new Worker("layout-generator-worker.js");
    this.workers.foldable = new Worker("foldable-layout-worker.js");

    const onWorkerMessage = (event) => {
      const { status, pdfBytes, error, pdf } = event.data;

      if (error) {
        console.error("Error from PDF worker:", error);
        alert(`An error occurred during PDF generation: ${error}`);
        window.LayoutToolUI.ui.showLoader(false);
        return;
      }

      if (pdf) { // Message from foldable worker
        const blob = new Blob([pdf.pdfBytes], { type: "application/pdf" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "output.pdf";
        link.click();
        window.LayoutToolUI.ui.showLoader(false);
      } else if (status === 'done') { // Message from double-sided worker
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "output.pdf";
        link.click();
        window.LayoutToolUI.ui.showLoader(false);
      }
    };

    this.workers.doubleSided.onmessage = onWorkerMessage;
    this.workers.foldable.onmessage = onWorkerMessage;
  },

  utils: {
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
        reader.onload = (e) => {
          const dataUrl = e.target.result;
          const realType = this.utils.getImageType(dataUrl);
          if (!realType) {
            alert(`Unsupported file type: ${file.name}. Please use JPEG or PNG files.`);
            reject(new Error(`Unsupported file type: ${file.name}`));
            return;
          }
          resolve(dataUrl);
        };
        reader.onerror = () => {
          reject(new Error(`Failed to read file: ${file.name}`));
        };
        reader.readAsDataURL(file);
      });
    });
    return Promise.all(filePromises);
  },

  async generatePDF() {
    window.LayoutToolUI.ui.showLoader(true);

    const layoutMode = document.querySelector('input[name="layoutMode"]:checked').value;

    const { frontImages, backImages } = window.LayoutToolUI.elements;
    const frontFiles = frontImages.files;
    const backFiles = backImages.files;

    if (frontFiles.length < 1) {
      alert("Error: No front images selected.");
      window.LayoutToolUI.ui.showLoader(false);
      return;
    }

    try {
        if (layoutMode === 'doubleSided') {
            const singleBack = backFiles.length === 1;
            const noBack = backFiles.length === 0;
            if (frontFiles.length !== backFiles.length && !singleBack && !noBack) {
                alert("Error: Number of backs must be 0, 1, or the same as fronts.");
                window.LayoutToolUI.ui.showLoader(false);
                return;
            }

            const frontImageBuffers = await this.readFilesAsArrayBuffer(frontFiles);
            const backImageBuffers = await this.readFilesAsArrayBuffer(backFiles);
            const settings = window.LayoutToolUI.getSettings();
            const config = {
                borderColor: this.utils.hexToRgb(document.getElementById('borderColor').value),
                crosshairColor: this.utils.hexToRgb(document.getElementById('crosshaircolor').value)
            };

            const buffers = [...frontImageBuffers.map(f => f.buffer), ...backImageBuffers.map(b => b.buffer)];
            this.workers.doubleSided.postMessage({ 
                frontImages: frontImageBuffers, 
                backImages: backImageBuffers, 
                settings,
                config
            }, buffers);

        } else if (layoutMode === 'foldable') {
            const frontImageUrls = await this.readFiles(frontFiles);
            const backImageUrls = await this.readFiles(backFiles);

            let cards = [];
            for(let i = 0; i < frontImageUrls.length; i++) {
                const front = frontImageUrls[i];
                const back = backImageUrls.length === 1 ? backImageUrls[0] : backImageUrls[i] || frontImageUrls[i];
                cards.push({ front, back });
            }

            const options = window.FoldableLayoutUI.getSettings();

            this.workers.foldable.postMessage({ 
                generatePdf: {
                    cards: cards,
                    options: options
                }
            });
        }
    } catch (error) {
      console.error("Error during PDF preparation:", error.message);
      alert(`An unexpected error occurred: ${error.message}`);
      window.LayoutToolUI.ui.showLoader(false);
    }
  },

  async readFilesAsArrayBuffer(files) {
    const filePromises = Array.from(files).map((file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const buffer = e.target.result;
          const realType = this.utils.getImageType(new Uint8Array(buffer));
          if (!realType) {
            alert(`Unsupported file type: ${file.name}. Please use JPEG or PNG files.`);
            reject(new Error(`Unsupported file type: ${file.name}`));
            return;
          }
          resolve({ buffer, type: realType, name: file.name });
        };
        reader.onerror = () => {
          reject(new Error(`Failed to read file: ${file.name}`));
        };
        reader.readAsArrayBuffer(file);
      });
    });
    return Promise.all(filePromises);
  },
};

// Initialize the object and the worker
LayoutToolPDF.init();
window.LayoutToolPDF = LayoutToolPDF;
