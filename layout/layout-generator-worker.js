// Imports the pdf-lib library and shared utilities into the worker's scope.
importScripts(
  "https://cdn.jsdelivr.net/npm/@cantoo/pdf-lib@2.4.1/dist/pdf-lib.min.js",
  "shared-worker-utils.js"
);

// Listens for messages from the main thread.
onmessage = async (event) => {
  const { frontImages, backImages, settings, config, preview, maxPages } = event.data;
  try {
    await createPDF(frontImages, backImages, settings, config, { preview, maxPages });
  } catch (error) {
    postMessage({ state: "error", error: error.message });
  }
};

function drawCrosshairs(page, x, y, settings, config) {
  const { imageWidth, imageHeight, bleed, crosssize, crosswidth } = settings;
  const crosshairColor = PDFLib.rgb(...config.crosshairColor);

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
}

async function createPDF(frontImages, backImages, settings, config, previewOptions = {}) {
  const totalImages = frontImages.length;
  if (!previewOptions.preview) {
    reportProgress(0, totalImages);
  }

  const { PDFDocument } = PDFLib;
  const pdfDoc = await PDFDocument.create();
  let page;

  const embedder = new ImageEmbedder(pdfDoc);

  const pageWidth = settings.pageWidth * mmToPt;
  const pageHeight = settings.pageHeight * mmToPt;
  const bleed = (settings.bleed || 0) * mmToPt;
  const imageWidth = (settings.imageWidth || 0) * mmToPt + bleed * 2;
  const imageHeight = (settings.imageHeight || 0) * mmToPt + bleed * 2;
  const borderWidth = (settings.borderWidth || 0) * mmToPt * 2;
  const crosswidth = (settings.crosswidth || 0) * mmToPt;
  const crosssize = ((settings.crosssize || 0) * mmToPt) / 2;
  const cornerRadius = (settings.cornerRadius || 0) * mmToPt;

  const ptSettings = {
    ...settings,
    pageWidth,
    pageHeight,
    imageWidth,
    imageHeight,
    bleed,
    borderWidth,
    crosswidth,
    crosssize,
    cornerRadius,
  };

  if (
    ptSettings.columns * ptSettings.imageWidth > pageWidth ||
    ptSettings.rows * ptSettings.imageHeight > pageHeight
  ) {
    throw new Error("The input grid size exceeds the page size.");
  }

  const singleBack = backImages.length === 1;
  const noBack = backImages.length === 0;

  const borderColor = PDFLib.rgb(...config.borderColor);

  let currentImageIndex = 0;
  while (currentImageIndex < totalImages) {
    if (previewOptions.preview && pdfDoc.getPageCount() >= (previewOptions.maxPages || 2)) {
      break;
    }
    page = pdfDoc.addPage([pageWidth, pageHeight]);

    let x = (pageWidth - ptSettings.columns * ptSettings.imageWidth) / 2;
    let y = (pageHeight + ptSettings.rows * ptSettings.imageHeight) / 2;

    const imagesOnThisPage = Math.min(
      totalImages - currentImageIndex,
      ptSettings.rows * ptSettings.columns
    );

    for (let i = 0; i < imagesOnThisPage; i++) {
      const imageUrl = frontImages[currentImageIndex + i];
      const embeddedImage = await embedder.getOrEmbedImage(imageUrl);
      if (!embeddedImage) continue;

      if (ptSettings.frontBorderCheckbox) {
        page.drawImage(embeddedImage, {
          x: x + ptSettings.borderWidth / 2,
          y: y - ptSettings.imageHeight + ptSettings.borderWidth / 2,
          width: ptSettings.imageWidth - ptSettings.borderWidth,
          height: ptSettings.imageHeight - ptSettings.borderWidth,
        });
        drawCardBorder(page, {
          x: x,
          y: y - ptSettings.imageHeight,
          width: ptSettings.imageWidth,
          height: ptSettings.imageHeight,
          borderColor: borderColor,
          borderWidth: ptSettings.borderWidth,
          cornerRadius: ptSettings.cornerRadius,
        });
      } else {
        page.drawImage(embeddedImage, {
          x: x,
          y: y - ptSettings.imageHeight,
          width: ptSettings.imageWidth,
          height: ptSettings.imageHeight,
        });
      }

      x += ptSettings.imageWidth;
      if ((i + 1) % ptSettings.columns === 0) {
        x = (pageWidth - ptSettings.columns * ptSettings.imageWidth) / 2;
        y -= ptSettings.imageHeight;
      }
    }

    if (ptSettings.frontCheckbox) {
      let crosshairX = (pageWidth - ptSettings.columns * ptSettings.imageWidth) / 2;
      let crosshairY = (pageHeight + ptSettings.rows * ptSettings.imageHeight) / 2;
      for (let i = 0; i < imagesOnThisPage; i++) {
        drawCrosshairs(page, crosshairX, crosshairY, ptSettings, config);
        crosshairX += ptSettings.imageWidth;
        if ((i + 1) % ptSettings.columns === 0) {
          crosshairX = (pageWidth - ptSettings.columns * ptSettings.imageWidth) / 2;
          crosshairY -= ptSettings.imageHeight;
        }
      }
    }

    if (!noBack) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      x = (pageWidth + ptSettings.columns * ptSettings.imageWidth) / 2 - ptSettings.imageWidth;
      y = (pageHeight + ptSettings.rows * ptSettings.imageHeight) / 2;

      let singleBackImage;
      if (singleBack) {
        const backImageUrl = backImages[0];
        singleBackImage = await embedder.getOrEmbedImage(backImageUrl);
      }

      for (let i = 0; i < imagesOnThisPage; i++) {
        let embeddedImage;
        if (singleBack) {
          embeddedImage = singleBackImage;
        } else {
          const imageUrl = backImages[currentImageIndex + i];
          embeddedImage = await embedder.getOrEmbedImage(imageUrl);
        }
        
        if (!embeddedImage) continue;

        if (ptSettings.backBorderCheckbox) {
          page.drawImage(embeddedImage, {
            x: x + ptSettings.borderWidth / 2,
            y: y - ptSettings.imageHeight + ptSettings.borderWidth / 2,
            width: ptSettings.imageWidth - ptSettings.borderWidth,
            height: ptSettings.imageHeight - ptSettings.borderWidth,
          });
          drawCardBorder(page, {
            x: x,
            y: y - ptSettings.imageHeight,
            width: ptSettings.imageWidth,
            height: ptSettings.imageHeight,
            borderColor: borderColor,
            borderWidth: ptSettings.borderWidth,
            cornerRadius: ptSettings.cornerRadius,
          });
        } else {
          page.drawImage(embeddedImage, {
            x: x,
            y: y - ptSettings.imageHeight,
            width: ptSettings.imageWidth,
            height: ptSettings.imageHeight,
          });
        }

        x -= ptSettings.imageWidth;
        if ((i + 1) % ptSettings.columns === 0) {
          x = (pageWidth + ptSettings.columns * ptSettings.imageWidth) / 2 - ptSettings.imageWidth;
          y -= ptSettings.imageHeight;
        }
      }

      if (ptSettings.backCheckbox) {
        let crosshairX = (pageWidth + ptSettings.columns * ptSettings.imageWidth) / 2 - ptSettings.imageWidth;
        let crosshairY = (pageHeight + ptSettings.rows * ptSettings.imageHeight) / 2;
        for (let i = 0; i < imagesOnThisPage; i++) {
          drawCrosshairs(page, crosshairX, crosshairY, ptSettings, config);
          crosshairX -= ptSettings.imageWidth;
          if ((i + 1) % ptSettings.columns === 0) {
            crosshairX = (pageWidth + ptSettings.columns * ptSettings.imageWidth) / 2 - ptSettings.imageWidth;
            crosshairY -= ptSettings.imageHeight;
          }
        }
      }
    }
    currentImageIndex += imagesOnThisPage;
    if (!previewOptions.preview) {
      reportProgress(currentImageIndex, totalImages);
    }
  }

  if (previewOptions.preview) {
    const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
    postMessage({ state: "preview_done", pdfBytes: pdfBytes }, [pdfBytes.buffer]);
    return;
  }

  reportSaving();
  const pdfBytes = await pdfDoc.save({ useObjectStreams: true });

  postMessage(
    {
      state: "done",
      pdfBytes: pdfBytes,
      data: {
        images: totalImages,
        pages: pdfDoc.getPageCount(),
        bytes: pdfBytes.byteLength,
      },
    },
    [pdfBytes.buffer]
  );
}