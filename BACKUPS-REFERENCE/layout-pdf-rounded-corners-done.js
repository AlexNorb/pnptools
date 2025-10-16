const LayoutToolPDF = {
  utils: {
    getImageType(buffer) {
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
    },
    hexToRgb(hex) {
      // Default to black for invalid input, and remove the '#' prefix
      const hexString = (hex || "#000000").slice(1);
      const match = hexString.match(/[a-f\d]{2}/gi);

      // Return black if the hex code is not valid
      if (!match || match.length !== 3) {
        return [0, 0, 0];
      }

      // .map already returns the array we need
      return match.map((x) => parseInt(x, 16) / 255);
    },
    updateColor(input) {
      const { rgb } = PDFLib;
      const rgbValues = this.hexToRgb(input.value);
      // Use spread syntax for a cleaner call
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
            window.LayoutToolUI.ui.showLoader(false);
            alert(
              `Unsupported file type: ${file.name}. Please use JPEG or PNG files.`
            );
            reject(new Error(`Unsupported file type: ${file.name}`));
            return;
          }
          resolve({ buffer, type: realType, name: file.name });
        };
        reader.onerror = () => {
          window.LayoutToolUI.ui.showLoader(false);
          alert(`Failed to read file: ${file.name}.`);
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
      const frontImageBuffers = await this.readFiles(frontFiles);
      const backImageBuffers = await this.readFiles(backFiles);
      await this.createPDF(frontImageBuffers, backImageBuffers);
    } catch (error) {
      console.error("Error during PDF generation process:", error.message);
      alert("An unexpected error occurred during PDF generation.");
      window.LayoutToolUI.ui.showLoader(false);
    }
  },

  _drawImageBorder(page, x, y, settings) {
    page.drawRectangle({
      x: x,
      y: y - settings.imageHeight,
      width: settings.imageWidth,
      height: settings.imageHeight,
      borderColor: window.LayoutToolUI.config.borderColor,
      borderWidth: settings.borderWidth,
      rx: 0,
      ry: 0,
    });
    page.drawRectangle({
      x: x,
      y: y - settings.imageHeight,
      width: settings.imageWidth,
      height: settings.imageHeight,
      borderColor: window.LayoutToolUI.config.borderColor,
      borderWidth: settings.borderWidth,
      rx: settings.cornerRadius,
      ry: settings.cornerRadius,
    });
  },

  async createPDF(frontImages, backImages) {
    const { PDFDocument } = PDFLib;
    const settings = window.LayoutToolUI.getSettings();
    const pdfDoc = await PDFDocument.create();
    let page;

    const pageSizes = {
      A4: [595.28, 841.89],
      Letter: [612, 792],
      "A4 landscape": [841.89, 595.28],
      "Letter landscape": [792, 612],
    };
    const [pageWidth, pageHeight] = pageSizes[settings.pageSize];

    if (
      settings.columns * settings.imageWidth > pageWidth ||
      settings.rows * settings.imageHeight > pageHeight
    ) {
      alert("Error: The input grid size exceeds the page size.");
      window.LayoutToolUI.ui.showLoader(false);
      return;
    }

    const singleBack = backImages.length === 1;
    const noBack = backImages.length === 0;

    let currentImageIndex = 0;
    while (currentImageIndex < frontImages.length) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);

      let x = (pageWidth - settings.columns * settings.imageWidth) / 2;
      let y = (pageHeight + settings.rows * settings.imageHeight) / 2;

      const imagesOnThisPage = Math.min(
        frontImages.length - currentImageIndex,
        settings.rows * settings.columns
      );

      for (let i = 0; i < imagesOnThisPage; i++) {
        const image = frontImages[currentImageIndex + i];
        const embeddedImage =
          image.type === "image/png"
            ? await pdfDoc.embedPng(image.buffer)
            : await pdfDoc.embedJpg(image.buffer);

        if (settings.frontBorderCheckbox) {
          // Draw the shrunk image on bottom
          page.drawImage(embeddedImage, {
            x: x + settings.borderWidth / 2,
            y: y - settings.imageHeight + settings.borderWidth / 2,
            width: settings.imageWidth - settings.borderWidth,
            height: settings.imageHeight - settings.borderWidth,
          });
          // Draw the border as a non-filled rectangle
          this._drawImageBorder(page, x, y, settings);
        } else {
          // No border, just draw the image
          page.drawImage(embeddedImage, {
            x: x,
            y: y - settings.imageHeight,
            width: settings.imageWidth,
            height: settings.imageHeight,
          });
        }

        x += settings.imageWidth;
        if ((i + 1) % settings.columns === 0) {
          x = (pageWidth - settings.columns * settings.imageWidth) / 2;
          y -= settings.imageHeight;
        }
      }

      // Draw crosshairs for the entire front page at the very end
      if (settings.frontCheckbox) {
        let crosshairX =
          (pageWidth - settings.columns * settings.imageWidth) / 2;
        let crosshairY =
          (pageHeight + settings.rows * settings.imageHeight) / 2;
        for (let i = 0; i < imagesOnThisPage; i++) {
          this.drawCrosshairs(page, crosshairX, crosshairY, settings);
          crosshairX += settings.imageWidth;
          if ((i + 1) % settings.columns === 0) {
            crosshairX =
              (pageWidth - settings.columns * settings.imageWidth) / 2;
            crosshairY -= settings.imageHeight;
          }
        }
      }

      // Back page
      if (!noBack) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);

        x =
          (pageWidth + settings.columns * settings.imageWidth) / 2 -
          settings.imageWidth;
        y = (pageHeight + settings.rows * settings.imageHeight) / 2;

        let singleBackImage;
        if (singleBack) {
          const backImage = backImages[0];
          singleBackImage =
            backImage.type === "image/png"
              ? await pdfDoc.embedPng(backImage.buffer)
              : await pdfDoc.embedJpg(backImage.buffer);
        }

        for (let i = 0; i < imagesOnThisPage; i++) {
          let embeddedImage;
          if (singleBack) {
            embeddedImage = singleBackImage;
          } else {
            const image = backImages[currentImageIndex + i];
            embeddedImage =
              image.type === "image/png"
                ? await pdfDoc.embedPng(image.buffer)
                : await pdfDoc.embedJpg(image.buffer);
          }

          if (settings.backBorderCheckbox) {
            // Draw the shrunk image on bottom
            page.drawImage(embeddedImage, {
              x: x + settings.borderWidth / 2,
              y: y - settings.imageHeight + settings.borderWidth / 2,
              width: settings.imageWidth - settings.borderWidth,
              height: settings.imageHeight - settings.borderWidth,
            });
            // Draw the border as a non-filled rectangle
            this._drawImageBorder(page, x, y, settings);
          } else {
            // No border, just draw the image
            page.drawImage(embeddedImage, {
              x: x,
              y: y - settings.imageHeight,
              width: settings.imageWidth,
              height: settings.imageHeight,
            });
          }

          x -= settings.imageWidth;
          if ((i + 1) % settings.columns === 0) {
            x =
              (pageWidth + settings.columns * settings.imageWidth) / 2 -
              settings.imageWidth;
            y -= settings.imageHeight;
          }
        }

        // Draw crosshairs for the entire back page at the very end
        if (settings.backCheckbox) {
          let crosshairX =
            (pageWidth + settings.columns * settings.imageWidth) / 2 -
            settings.imageWidth;
          let crosshairY =
            (pageHeight + settings.rows * settings.imageHeight) / 2;
          for (let i = 0; i < imagesOnThisPage; i++) {
            this.drawCrosshairs(page, crosshairX, crosshairY, settings);
            crosshairX -= settings.imageWidth;
            if ((i + 1) % columns === 0) {
              crosshairX =
                (pageWidth + settings.columns * settings.imageWidth) / 2 -
                settings.imageWidth;
              crosshairY -= settings.imageHeight;
            }
          }
        }
      }
      currentImageIndex += imagesOnThisPage;
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const link = document.createElement("a");
    window.LayoutToolUI.ui.showLoader(false);
    link.href = URL.createObjectURL(blob);
    link.download = "output.pdf";
    link.click();
  },

  drawCrosshairs(page, x, y, settings) {
    const { imageWidth, imageHeight, bleed, crosssize, crosswidth } = settings;
    const crosshairColor = window.LayoutToolUI.config.crosshairColor;

    const coords = [
      {
        start: { x: x - crosssize + bleed, y: y - imageHeight + bleed },
        end: { x: x + crosssize + bleed, y: y - imageHeight + bleed },
      },
      {
        start: { x: x + bleed, y: y - imageHeight - crosssize + bleed },
        end: { x: x + bleed, y: y - imageHeight + crosssize + bleed },
      },
      {
        start: {
          x: x + imageWidth - crosssize - bleed,
          y: y - imageHeight + bleed,
        },
        end: {
          x: x + imageWidth + crosssize - bleed,
          y: y - imageHeight + bleed,
        },
      },
      {
        start: {
          x: x + imageWidth - bleed,
          y: y - imageHeight - crosssize + bleed,
        },
        end: {
          x: x + imageWidth - bleed,
          y: y - imageHeight + crosssize + bleed,
        },
      },
      {
        start: { x: x - crosssize + bleed, y: y - bleed },
        end: { x: x + crosssize + bleed, y: y - bleed },
      },
      {
        start: { x: x + bleed, y: y - crosssize - bleed },
        end: { x: x + bleed, y: y + crosssize - bleed },
      },
      {
        start: { x: x + imageWidth - crosssize - bleed, y: y - bleed },
        end: { x: x + imageWidth + crosssize - bleed, y: y - bleed },
      },
      {
        start: { x: x + imageWidth - bleed, y: y - crosssize - bleed },
        end: { x: x + imageWidth - bleed, y: y + crosssize - bleed },
      },
    ];

    coords.forEach((coord) => {
      page.drawLine({
        start: coord.start,
        end: coord.end,
        thickness: crosswidth,
        color: crosshairColor,
      });
    });
  },
};
window.LayoutToolPDF = LayoutToolPDF;
