
// Imports the pdf-lib library into the worker's scope.
importScripts("https://cdn.jsdelivr.net/npm/@cantoo/pdf-lib@2.4.1/dist/pdf-lib.min.js");

// Listens for messages from the main thread.
onmessage = async (event) => {
  const { frontImages, backImages, settings, config } = event.data;
  try {
    const pdfBytes = await createPDF(frontImages, backImages, settings, config);
    // Sends the generated PDF bytes back to the main thread.
    // The second argument [pdfBytes.buffer] is a "transferable object",
    // which transfers ownership of the data to the main thread for better performance.
    postMessage({ status: 'done', pdfBytes: pdfBytes }, [pdfBytes.buffer]);
  } catch (error) {
    // Sends an error message back to the main thread if something goes wrong.
    postMessage({ status: 'error', error: error.message });
  }
};

function _drawImageBorder(page, x, y, settings, config) {
    const borderColor = PDFLib.rgb(...config.borderColor);
    page.drawRectangle({
        x: x,
        y: y - settings.imageHeight,
        width: settings.imageWidth,
        height: settings.imageHeight,
        borderColor: borderColor,
        borderWidth: settings.borderWidth,
        rx: 0,
        ry: 0,
    });
    page.drawRectangle({
        x: x,
        y: y - settings.imageHeight,
        width: settings.imageWidth,
        height: settings.imageHeight,
        borderColor: borderColor,
        borderWidth: settings.borderWidth,
        rx: settings.cornerRadius,
        ry: settings.cornerRadius,
    });
}

function drawCrosshairs(page, x, y, settings, config) {
    const { imageWidth, imageHeight, bleed, crosssize, crosswidth } = settings;
    const crosshairColor = PDFLib.rgb(...config.crosshairColor);

    const coords = [
      { start: { x: x - crosssize + bleed, y: y - imageHeight + bleed }, end: { x: x + crosssize + bleed, y: y - imageHeight + bleed } },
      { start: { x: x + bleed, y: y - imageHeight - crosssize + bleed }, end: { x: x + bleed, y: y - imageHeight + crosssize + bleed } },
      { start: { x: x + imageWidth - crosssize - bleed, y: y - imageHeight + bleed }, end: { x: x + imageWidth + crosssize - bleed, y: y - imageHeight + bleed } },
      { start: { x: x + imageWidth - bleed, y: y - imageHeight - crosssize + bleed }, end: { x: x + imageWidth - bleed, y: y - imageHeight + crosssize + bleed } },
      { start: { x: x - crosssize + bleed, y: y - bleed }, end: { x: x + crosssize + bleed, y: y - bleed } },
      { start: { x: x + bleed, y: y - crosssize - bleed }, end: { x: x + bleed, y: y + crosssize - bleed } },
      { start: { x: x + imageWidth - crosssize - bleed, y: y - bleed }, end: { x: x + imageWidth + crosssize - bleed, y: y - bleed } },
      { start: { x: x + imageWidth - bleed, y: y - crosssize - bleed }, end: { x: x + imageWidth - bleed, y: y + crosssize - bleed } },
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

async function createPDF(frontImages, backImages, settings, config) {
    const { PDFDocument } = PDFLib;
    const pdfDoc = await PDFDocument.create();
    let page;

    const pageSizes = {
        A4: [595.28, 841.89],
        Letter: [612, 792],
        "A4 landscape": [841.89, 595.28],
        "Letter landscape": [792, 612],
    };
    const [pageWidth, pageHeight] = pageSizes[settings.pageSize];

    if (settings.columns * settings.imageWidth > pageWidth || settings.rows * settings.imageHeight > pageHeight) {
        throw new Error("The input grid size exceeds the page size.");
    }

    const singleBack = backImages.length === 1;
    const noBack = backImages.length === 0;

    let currentImageIndex = 0;
    while (currentImageIndex < frontImages.length) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);

        let x = (pageWidth - settings.columns * settings.imageWidth) / 2;
        let y = (pageHeight + settings.rows * settings.imageHeight) / 2;

        const imagesOnThisPage = Math.min(frontImages.length - currentImageIndex, settings.rows * settings.columns);

        for (let i = 0; i < imagesOnThisPage; i++) {
            const image = frontImages[currentImageIndex + i];
            const embeddedImage = image.type === "image/png" ? await pdfDoc.embedPng(image.buffer) : await pdfDoc.embedJpg(image.buffer);

            if (settings.frontBorderCheckbox) {
                page.drawImage(embeddedImage, {
                    x: x + settings.borderWidth / 2,
                    y: y - settings.imageHeight + settings.borderWidth / 2,
                    width: settings.imageWidth - settings.borderWidth,
                    height: settings.imageHeight - settings.borderWidth,
                });
                _drawImageBorder(page, x, y, settings, config);
            } else {
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

        if (settings.frontCheckbox) {
            let crosshairX = (pageWidth - settings.columns * settings.imageWidth) / 2;
            let crosshairY = (pageHeight + settings.rows * settings.imageHeight) / 2;
            for (let i = 0; i < imagesOnThisPage; i++) {
                drawCrosshairs(page, crosshairX, crosshairY, settings, config);
                crosshairX += settings.imageWidth;
                if ((i + 1) % settings.columns === 0) {
                    crosshairX = (pageWidth - settings.columns * settings.imageWidth) / 2;
                    crosshairY -= settings.imageHeight;
                }
            }
        }

        if (!noBack) {
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            x = (pageWidth + settings.columns * settings.imageWidth) / 2 - settings.imageWidth;
            y = (pageHeight + settings.rows * settings.imageHeight) / 2;

            let singleBackImage;
            if (singleBack) {
                const backImage = backImages[0];
                singleBackImage = backImage.type === "image/png" ? await pdfDoc.embedPng(backImage.buffer) : await pdfDoc.embedJpg(backImage.buffer);
            }

            for (let i = 0; i < imagesOnThisPage; i++) {
                let embeddedImage;
                if (singleBack) {
                    embeddedImage = singleBackImage;
                } else {
                    const image = backImages[currentImageIndex + i];
                    embeddedImage = image.type === "image/png" ? await pdfDoc.embedPng(image.buffer) : await pdfDoc.embedJpg(image.buffer);
                }

                if (settings.backBorderCheckbox) {
                    page.drawImage(embeddedImage, {
                        x: x + settings.borderWidth / 2,
                        y: y - settings.imageHeight + settings.borderWidth / 2,
                        width: settings.imageWidth - settings.borderWidth,
                        height: settings.imageHeight - settings.borderWidth,
                    });
                    _drawImageBorder(page, x, y, settings, config);
                } else {
                    page.drawImage(embeddedImage, {
                        x: x,
                        y: y - settings.imageHeight,
                        width: settings.imageWidth,
                        height: settings.imageHeight,
                    });
                }

                x -= settings.imageWidth;
                if ((i + 1) % settings.columns === 0) {
                    x = (pageWidth + settings.columns * settings.imageWidth) / 2 - settings.imageWidth;
                    y -= settings.imageHeight;
                }
            }

            if (settings.backCheckbox) {
                let crosshairX = (pageWidth + settings.columns * settings.imageWidth) / 2 - settings.imageWidth;
                let crosshairY = (pageHeight + settings.rows * settings.imageHeight) / 2;
                for (let i = 0; i < imagesOnThisPage; i++) {
                    drawCrosshairs(page, crosshairX, crosshairY, settings, config);
                    crosshairX -= settings.imageWidth;
                    if ((i + 1) % settings.columns === 0) {
                        crosshairX = (pageWidth + settings.columns * settings.imageWidth) / 2 - settings.imageWidth;
                        crosshairY -= settings.imageHeight;
                    }
                }
            }
        }
        currentImageIndex += imagesOnThisPage;
    }

    return await pdfDoc.save();
}
