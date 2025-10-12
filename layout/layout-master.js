
const LayoutToolPDF = {
  worker: null, // To hold the worker instance

  init() {
    // Initialize the worker and set up message handling
    this.worker = new Worker("layout-generator-worker.js");
    this.worker.onmessage = (event) => {
      const { status, pdfBytes, error } = event.data;

      if (status === 'done') {
        // PDF is ready, create download link
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "output.pdf";
        link.click();
        window.LayoutToolUI.ui.showLoader(false);
      } else if (status === 'error') {
        // Handle errors from the worker
        console.error("Error from PDF worker:", error);
        alert(`An error occurred during PDF generation: ${error}`);
        window.LayoutToolUI.ui.showLoader(false);
      }
    };
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
          const buffer = e.target.result;
          const realType = this.utils.getImageType(buffer);
          if (!realType) {
            alert(`Unsupported file type: ${file.name}. Please use JPEG or PNG files.`);
            reject(new Error(`Unsupported file type: ${file.name}`));
            return;
          }
          // Pass the buffer directly, the worker will handle embedding
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

  async generatePDF() {
    window.LayoutToolUI.ui.showLoader(true);

    const { frontImages, backImages } = window.LayoutToolUI.elements;
    const frontFiles = frontImages.files;
    const backFiles = backImages.files;

    const singleBack = backFiles.length === 1;
    const noBack = backFiles.length === 0;

    if (frontFiles.length < 1) {
      alert("Error: No front images selected.");
      window.LayoutToolUI.ui.showLoader(false);
      return;
    }
    if (frontFiles.length !== backFiles.length && !singleBack && !noBack) {
      alert("Error: Number of backs must be 0, 1, or the same as fronts.");
      window.LayoutToolUI.ui.showLoader(false);
      return;
    }

    try {
      // 1. Read files and get settings
      const frontImageBuffers = await this.readFiles(frontFiles);
      const backImageBuffers = await this.readFiles(backFiles);
      const settings = window.LayoutToolUI.getSettings();
      
      // Prepare a simplified config object for the worker
      const config = {
          borderColor: this.utils.hexToRgb(document.getElementById('borderColor').value),
          crosshairColor: this.utils.hexToRgb(document.getElementById('crosshaircolor').value)
      };

      // 2. Send data to the worker
      // The buffers are transferred, not copied, for performance.
      const buffers = [...frontImageBuffers.map(f => f.buffer), ...backImageBuffers.map(b => b.buffer)];
      this.worker.postMessage({ 
          frontImages: frontImageBuffers, 
          backImages: backImageBuffers, 
          settings,
          config
        }, buffers);

    } catch (error) {
      console.error("Error during PDF preparation:", error.message);
      alert(`An unexpected error occurred: ${error.message}`);
      window.LayoutToolUI.ui.showLoader(false);
    }
  },
};

// Initialize the object and the worker
LayoutToolPDF.init();
window.LayoutToolPDF = LayoutToolPDF;
