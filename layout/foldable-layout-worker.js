if (typeof importScripts === "function") {
  importScripts(
    "https://cdn.jsdelivr.net/npm/@cantoo/pdf-lib@2.4.1/dist/pdf-lib.min.js"
  );

  const withDefault = (value, defaultValue) => {
    // Check for undefined, null, and empty string
    return value !== undefined && value !== null && value !== ""
      ? value
      : defaultValue;
  };

  const validated = (value, check, defaultValue) => {
    if (!check(value)) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new Error("Invalid value: " + value);
    }
    return value;
  };

  const toPdfColor = (color) => {
    if (typeof color === "string" && color.startsWith("#")) {
      const r = parseInt(color.substr(1, 2), 16) / 255;
      const g = parseInt(color.substr(3, 2), 16) / 255;
      const b = parseInt(color.substr(5, 2), 16) / 255;
      return PDFLib.rgb(r, g, b);
    }
    // Assuming if it's not a string, it might be an object with r,g,b properties (0-1 range)
    if (typeof color === "object" && color.r !== undefined) {
      return PDFLib.rgb(color.r, color.g, color.b);
    }
    return PDFLib.rgb(0, 0, 0);
  };

  const insertMark = (page, x, y, options) => {
    const lengthX = withDefault(options.lengthX, 2);
    const lengthY = withDefault(options.lengthY, 2);
    const margin = withDefault(options.margin, 1);
    const color = withDefault(options.color, PDFLib.grayscale(0));
    const background = withDefault(options.background, PDFLib.grayscale(1));
    const offset = withDefault(options.offset, PDFLib.grayscale(0.5));
    const thickness = withDefault(options.thickness, 0.4);
    const dashArray = withDefault(options.dashArray, null);
    const parts = withDefault(options.parts, "nesw");
    const cutterOffset = withDefault(options.cutterOffset, 0);
    const mmFactor = withDefault(options.mmFactor, 72 / 25.4);

    const offsetOptions = {
      color: offset,
      thickness: cutterOffset * 2,
    };

    const lineOptions = {
      color: color,
      thickness: thickness,
    };
    if (dashArray) {
      lineOptions.dashArray = dashArray;
    }

    const backgroundOptions = {
      color: background,
      thickness: cutterOffset ? (cutterOffset + thickness) * 2 : 3 * thickness,
    };

    for (const c of parts) {
      let start, end;
      switch (c) {
        case "n":
          start = { x: x, y: y + margin * mmFactor };
          end = { x: x, y: y + (margin + lengthY) * mmFactor };
          break;
        case "e":
          start = { x: x + margin * mmFactor, y: y };
          end = { x: x + (margin + lengthX) * mmFactor, y: y };
          break;
        case "s":
          start = { x: x, y: y - margin * mmFactor };
          end = { x: x, y: y - (margin + lengthY) * mmFactor };
          break;
        case "w":
          start = { x: x - margin * mmFactor, y: y };
          end = { x: x - (margin + lengthX) * mmFactor, y: y };
          break;
      }

      page.drawLine({ start, end, ...backgroundOptions });
      if (cutterOffset) {
        page.drawLine({ start, end, ...offsetOptions });
      }
      page.drawLine({ start, end, ...lineOptions });
    }
  };

  const drawMarkup = (
    page,
    orientation,
    rotate,
    pageWidth,
    pageHeight,
    cardWidth,
    cardHeight,
    totalWidth,
    totalHeight,
    cardMargin,
    foldingMargin,
    cutMargin,
    printerMargin,
    cutterOffset,
    cardColumnsPerPage,
    cardRowsPerPage
  ) => {
    if (!page) return;

    const mmFactor = 72 / 25.4;

    const cardWidthDoc = cardWidth * mmFactor;
    const cardHeightDoc = cardHeight * mmFactor;
    const cardMarginDoc = cardMargin * mmFactor;
    const foldingMarginDoc = foldingMargin * mmFactor;
    const cutMarginDoc = cutMargin * mmFactor;
    const printerMarginDoc = printerMargin * mmFactor;
    const cutterOffsetDoc = cutterOffset * mmFactor;

    const unitWidthDoc = rotate ? cardHeightDoc : cardWidthDoc;
    const unitHeightDoc = rotate ? cardWidthDoc : cardHeightDoc;

    const tickOptions = {
      lengthX: 2,
      lengthY: 2,
      margin: 1,
      cutterOffset: cutterOffsetDoc,
    };
    const minTickLength = Math.min(2, cardMargin + cutMargin - 1);

    if (orientation === "vertical") {
      // fold line
      page.drawLine({
        start: { x: pageWidth / 2, y: printerMarginDoc },
        end: { x: pageWidth / 2, y: pageHeight - printerMarginDoc },
        thickness: 0.4,
        color: PDFLib.grayscale(0.5),
        dashArray: [5, 5],
      });

      // cut ticks

      for (let x = 0; x < cardRowsPerPage; x++) {
        const markX1 =
          pageWidth / 2 -
          foldingMarginDoc -
          unitWidthDoc +
          cutMarginDoc -
          x * (unitWidthDoc + cardMarginDoc);
        const markX2 =
          pageWidth / 2 -
          foldingMarginDoc -
          cutMarginDoc -
          x * (unitWidthDoc + cardMarginDoc);
        const markX3 =
          pageWidth / 2 +
          foldingMarginDoc +
          cutMarginDoc +
          x * (unitWidthDoc + cardMarginDoc);
        const markX4 =
          pageWidth / 2 +
          foldingMarginDoc +
          unitWidthDoc -
          cutMarginDoc +
          x * (unitWidthDoc + cardMarginDoc);

        for (let y = 0; y < cardColumnsPerPage; y++) {
          const partsLeft = y === 0 || (cardMargin && cutMargin) ? "nw" : "w";
          const partsRight = y === 0 || (cardMargin && cutMargin) ? "ne" : "e";

          const tickLengthOptions1 = {
            lengthX: x === cardRowsPerPage - 1 ? 2 : minTickLength,
            lengthY: y === 0 ? 2 : minTickLength,
          };
          const tickLengthOptions2 = {
            lengthX: x === 0 ? 2 : minTickLength,
            lengthY: y === 0 ? 2 : minTickLength,
          };
          const tickLengthOptions3 = {
            lengthX: x === 0 ? 2 : minTickLength,
            lengthY: y === 0 ? 2 : minTickLength,
          };
          const tickLengthOptions4 = {
            lengthX: x === cardRowsPerPage - 1 ? 2 : minTickLength,
            lengthY: y === 0 ? 2 : minTickLength,
          };

          const markY =
            (pageHeight + totalHeight) / 2 -
            y * (unitHeightDoc + cardMarginDoc) -
            cutMarginDoc;

          insertMark(page, markX1, markY, {
            ...tickOptions,
            ...tickLengthOptions1,
            parts: partsLeft,
          });
          insertMark(page, markX2, markY, {
            ...tickOptions,
            ...tickLengthOptions2,
            parts: partsRight,
          });
          insertMark(page, markX3, markY, {
            ...tickOptions,
            ...tickLengthOptions3,
            parts: partsLeft,
          });
          insertMark(page, markX4, markY, {
            ...tickOptions,
            ...tickLengthOptions4,
            parts: partsRight,
          });
          if ((cardMargin > 0 || cutMargin > 0) && y < cardColumnsPerPage - 1) {
            const markY2 = markY - unitHeightDoc + 2 * cutMarginDoc;
            insertMark(page, markX1, markY2, {
              ...tickOptions,
              ...tickLengthOptions1,
              parts: cardMargin && cutMargin ? "sw" : "w",
              lengthY: y === cardColumnsPerPage - 1 ? 2 : minTickLength,
            });
            insertMark(page, markX2, markY2, {
              ...tickOptions,
              ...tickLengthOptions2,
              parts: cardMargin && cutMargin ? "se" : "e",
              lengthY: y === cardColumnsPerPage - 1 ? 2 : minTickLength,
            });
            insertMark(page, markX3, markY2, {
              ...tickOptions,
              ...tickLengthOptions3,
              parts: cardMargin && cutMargin ? "sw" : "w",
              lengthY: y === cardColumnsPerPage - 1 ? 2 : minTickLength,
            });
            insertMark(page, markX4, markY2, {
              ...tickOptions,
              ...tickLengthOptions4,
              parts: cardMargin && cutMargin ? "se" : "e",
              lengthY: y === cardColumnsPerPage - 1 ? 2 : minTickLength,
            });
          }
        }

        const finalMarkY =
          (pageHeight + totalHeight) / 2 -
          cardColumnsPerPage * (unitHeightDoc + cardMarginDoc) +
          cardMarginDoc +
          cutMarginDoc;
        insertMark(page, markX1, finalMarkY, {
          ...tickOptions,
          parts: "sw",
          lengthX: x === cardRowsPerPage - 1 ? 2 : minTickLength,
        });
        insertMark(page, markX2, finalMarkY, {
          ...tickOptions,
          parts: "se",
          lengthX: x === 0 ? 2 : minTickLength,
        });
        insertMark(page, markX3, finalMarkY, {
          ...tickOptions,
          parts: "sw",
          lengthX: x === 0 ? 2 : minTickLength,
        });
        insertMark(page, markX4, finalMarkY, {
          ...tickOptions,
          parts: "se",
          lengthX: x === cardRowsPerPage - 1 ? 2 : minTickLength,
        });
      }
    } else {
      // fold line
      page.drawLine({
        start: { x: printerMarginDoc, y: pageHeight / 2 },
        end: { x: pageWidth - printerMarginDoc, y: pageHeight / 2 },
        thickness: 0.4,
        color: PDFLib.grayscale(0.3),
        dashArray: [5, 5],
      });

      // cut ticks
      for (let y = 0; y < cardRowsPerPage; y++) {
        const markY1 =
          pageHeight / 2 +
          foldingMarginDoc +
          unitHeightDoc -
          cutMarginDoc +
          y * (unitHeightDoc + cardMarginDoc);
        const markY2 =
          pageHeight / 2 +
          foldingMarginDoc +
          cutMarginDoc +
          y * (unitHeightDoc + cardMarginDoc);
        const markY3 =
          pageHeight / 2 -
          foldingMarginDoc -
          cutMarginDoc -
          y * (unitHeightDoc + cardMarginDoc);
        const markY4 =
          pageHeight / 2 -
          foldingMarginDoc -
          unitHeightDoc +
          cutMarginDoc -
          y * (unitHeightDoc + cardMarginDoc);

        for (let x = 0; x < cardColumnsPerPage; x++) {
          const partsUp = x === 0 || (cardMargin && cutMargin) ? "nw" : "n";
          const partsDown = x === 0 || (cardMargin && cutMargin) ? "sw" : "s";

          const tickLengthOptions1 = {
            lengthX: x === 0 ? 2 : minTickLength,
            lengthY: y === cardRowsPerPage - 1 ? 2 : minTickLength,
          };
          const tickLengthOptions2 = {
            lengthX: x === 0 ? 2 : minTickLength,
            lengthY: y === 0 ? 2 : minTickLength,
          };
          const tickLengthOptions3 = {
            lengthX: x === 0 ? 2 : minTickLength,
            lengthY: y === 0 ? 2 : minTickLength,
          };
          const tickLengthOptions4 = {
            lengthX: x === 0 ? 2 : minTickLength,
            lengthY: y === cardRowsPerPage - 1 ? 2 : minTickLength,
          };

          const markX =
            (pageWidth - totalWidth) / 2 +
            x * (unitWidthDoc + cardMarginDoc) +
            cutMarginDoc;

          insertMark(page, markX, markY1, {
            ...tickOptions,
            ...tickLengthOptions1,
            parts: partsUp,
          });
          insertMark(page, markX, markY2, {
            ...tickOptions,
            ...tickLengthOptions2,
            parts: partsDown,
          });
          insertMark(page, markX, markY3, {
            ...tickOptions,
            ...tickLengthOptions3,
            parts: partsUp,
          });
          insertMark(page, markX, markY4, {
            ...tickOptions,
            ...tickLengthOptions4,
            parts: partsDown,
          });
          if ((cardMargin > 0 || cutMargin > 0) && x < cardColumnsPerPage - 1) {
            const markX2 = markX + unitWidthDoc - 2 * cutMarginDoc;
            insertMark(page, markX2, markY1, {
              ...tickOptions,
              ...tickLengthOptions1,
              parts: cardMargin && cutMargin ? "ne" : "n",
              lengthX: x === cardColumnsPerPage - 1 ? 2 : minTickLength,
            });
            insertMark(page, markX2, markY2, {
              ...tickOptions,
              ...tickLengthOptions2,
              parts: cardMargin && cutMargin ? "se" : "s",
              lengthX: x === cardColumnsPerPage - 1 ? 2 : minTickLength,
            });
            insertMark(page, markX2, markY3, {
              ...tickOptions,
              ...tickLengthOptions3,
              parts: cardMargin && cutMargin ? "ne" : "n",
              lengthX: x === cardColumnsPerPage - 1 ? 2 : minTickLength,
            });
            insertMark(page, markX2, markY4, {
              ...tickOptions,
              ...tickLengthOptions4,
              parts: cardMargin && cutMargin ? "se" : "s",
              lengthX: x === cardColumnsPerPage - 1 ? 2 : minTickLength,
            });
          }
        }

        const finalMarkX =
          (pageWidth - totalWidth) / 2 +
          cardColumnsPerPage * (unitWidthDoc + cardMarginDoc) -
          cardMarginDoc -
          cutMarginDoc;
        insertMark(page, finalMarkX, markY1, {
          ...tickOptions,
          parts: "ne",
          lengthY: y === cardRowsPerPage - 1 ? 2 : minTickLength,
        });
        insertMark(page, finalMarkX, markY2, {
          ...tickOptions,
          parts: "se",
          lengthY: y === 0 ? 2 : minTickLength,
        });
        insertMark(page, finalMarkX, markY3, {
          ...tickOptions,
          parts: "ne",
          lengthY: y === 0 ? 2 : minTickLength,
        });
        insertMark(page, finalMarkX, markY4, {
          ...tickOptions,
          parts: "se",
          lengthY: y === cardRowsPerPage - 1 ? 2 : minTickLength,
        });
      }
    }
  };

  const findOptimalLayout = (options) => {
    const cardWidth = options.cardWidth;
    const cardHeight = options.cardHeight;

    const cardMargin = withDefault(options.cardMargin, 2);
    const foldingMargin = withDefault(options.foldingMargin, 5);
    const printerMargin = withDefault(options.printerMargin, 5);
    const foldLinePreference = withDefault(options.foldLinePreference, "auto");
    const allowMultipleRows = withDefault(options.allowMultipleRows, true);

    const pageSize = validated(
      options.pageSize,
      (x) => PDFLib.PageSizes[x] !== undefined,
      "A4"
    );

    const pageFormat = PDFLib.PageSizes[pageSize];

    const mmFactor = 72 / 25.4;
    const printerMarginDoc = printerMargin * mmFactor;

    const [pageWidth, pageHeight] = pageFormat;
    const [usableWidth, usableHeight] = [
      pageWidth - 2 * printerMarginDoc,
      pageHeight - 2 * printerMarginDoc,
    ];
    const [cardWidthDoc, cardHeightDoc] = [
      cardWidth * mmFactor,
      cardHeight * mmFactor,
    ];
    const cardMarginDoc = cardMargin * mmFactor;
    const foldingMarginDoc = foldingMargin * mmFactor;

    const maxCoverage = (spaceX, spaceY, cardWidth, cardHeight, cardMargin) => {
      const cardsX = Math.floor(spaceX / (cardWidth + cardMargin));
      const cardsY = Math.floor(spaceY / (cardHeight + cardMargin));
      return [cardsX, cardsY];
    };

    const optimum = {};
    const foldlines =
      foldLinePreference == "vertical" || foldLinePreference === "horizontal"
        ? [foldLinePreference]
        : ["vertical", "horizontal"];
    for (const foldLine of foldlines) {
      const spaceX =
        foldLine === "horizontal"
          ? usableWidth
          : usableWidth / 2 - foldingMarginDoc;
      const spaceY =
        foldLine === "vertical"
          ? usableHeight
          : usableHeight / 2 - foldingMarginDoc;

      let cardColumnsPerPage, cardRowsPerPage, rotate, totalHeight, totalWidth;

      if (foldLine === "vertical") {
        if (cardWidthDoc < spaceX && cardHeightDoc < spaceX) {
          const [cardsXWidth, cardsYWidth] = maxCoverage(
            spaceX,
            spaceY,
            cardWidthDoc,
            cardHeightDoc,
            cardMarginDoc
          );
          const [cardsXHeight, cardsYHeight] = maxCoverage(
            spaceX,
            spaceY,
            cardHeightDoc,
            cardWidthDoc,
            cardMarginDoc
          );

          const cardsPerPageWidth =
            (allowMultipleRows ? cardsXWidth : 1) * cardsYWidth;
          const cardsPerPageHeight =
            (allowMultipleRows ? cardsXHeight : 1) * cardsYHeight;

          if (cardsPerPageWidth < cardsPerPageHeight) {
            cardColumnsPerPage = cardsYHeight;
            cardRowsPerPage = allowMultipleRows ? cardsXHeight : 1;
            rotate = true;
          } else {
            cardColumnsPerPage = cardsYWidth;
            cardRowsPerPage = allowMultipleRows ? cardsXWidth : 1;
            rotate = false;
          }
        } else if (cardWidthDoc < spaceX) {
          const [cardsX, cardsY] = maxCoverage(
            spaceX,
            spaceY,
            cardWidthDoc,
            cardHeightDoc,
            cardMarginDoc
          );
          cardColumnsPerPage = cardsY;
          cardRowsPerPage = allowMultipleRows ? cardsX : 1;
          rotate = false;
        } else if (cardHeightDoc < spaceX) {
          const [cardsX, cardsY] = maxCoverage(
            spaceX,
            spaceY,
            cardHeightDoc,
            cardWidthDoc,
            cardMarginDoc
          );
          cardColumnsPerPage = cardsY;
          cardRowsPerPage = allowMultipleRows ? cardsX : 1;
          rotate = true;
        } else {
          continue;
        }

        const unitWidth = rotate ? cardHeightDoc : cardWidthDoc;
        const unitHeight = rotate ? cardWidthDoc : cardHeightDoc;
        totalHeight =
          cardColumnsPerPage * unitHeight +
          (cardColumnsPerPage - 1) * cardMarginDoc;
        totalWidth =
          2 * cardRowsPerPage * unitWidth +
          (cardRowsPerPage - 1) * cardMarginDoc +
          2 * foldingMarginDoc;
      } else {
        if (cardWidthDoc < spaceY && cardHeightDoc < spaceY) {
          const [cardsXWidth, cardsYWidth] = maxCoverage(
            spaceX,
            spaceY,
            cardWidthDoc,
            cardHeightDoc,
            cardMarginDoc
          );
          const [cardsXHeight, cardsYHeight] = maxCoverage(
            spaceX,
            spaceY,
            cardHeightDoc,
            cardWidthDoc,
            cardMarginDoc
          );

          const cardsPerPageWidth =
            cardsXWidth * (allowMultipleRows ? cardsYWidth : 1);
          const cardsPerPageHeight =
            cardsXHeight * (allowMultipleRows ? cardsYHeight : 1);

          if (cardsPerPageWidth > cardsPerPageHeight) {
            cardColumnsPerPage = cardsXWidth;
            cardRowsPerPage = allowMultipleRows ? cardsYWidth : 1;
            rotate = false; // heads-up, inverted logic!
          } else {
            cardColumnsPerPage = cardsXHeight;
            cardRowsPerPage = allowMultipleRows ? cardsYHeight : 1;
            rotate = true; // heads-up, inverted logic!
          }
        } else if (cardWidthDoc < spaceY) {
          const [cardsX, cardsY] = maxCoverage(
            spaceX,
            spaceY,
            cardHeightDoc,
            cardWidthDoc,
            cardMarginDoc
          );
          cardColumnsPerPage = cardsX;
          cardRowsPerPage = allowMultipleRows ? cardsY : 1;
          rotate = true;
        } else if (cardHeightDoc < spaceY) {
          const [cardsX, cardsY] = maxCoverage(
            spaceX,
            spaceY,
            cardWidthDoc,
            cardHeightDoc,
            cardMarginDoc
          );
          cardColumnsPerPage = cardsX;
          cardRowsPerPage = allowMultipleRows ? cardsY : 1;
          rotate = false;
        } else {
          continue;
        }

        const unitWidth = rotate ? cardHeightDoc : cardWidthDoc;
        const unitHeight = rotate ? cardWidthDoc : cardHeightDoc;
        totalWidth =
          cardColumnsPerPage * unitWidth +
          (cardColumnsPerPage - 1) * cardMarginDoc;
        totalHeight =
          2 * cardRowsPerPage * unitHeight +
          (cardRowsPerPage - 1) * cardMarginDoc +
          2 * foldingMarginDoc;
      }

      if (cardColumnsPerPage * cardRowsPerPage > (optimum.cardsPerPage || 0)) {
        optimum.cardsPerPage = cardColumnsPerPage * cardRowsPerPage;
        optimum.cardColumnsPerPage = cardColumnsPerPage;
        optimum.cardRowsPerPage = cardRowsPerPage;
        optimum.rotate = rotate;
        optimum.totalHeight = totalHeight;
        optimum.totalWidth = totalWidth;
        optimum.orientation = foldLine;
      }
    }

    if (!optimum.cardsPerPage) {
      postMessage({
        error:
          "Cards are too large to fit on half of the page in either orientation",
      });
      return false;
    }

    return optimum;
  };

  const generatedPdf = async (cards, options) => {
    const cardWidth = options.cardWidth;
    const cardHeight = options.cardHeight;

    const cardMargin = withDefault(options.cardMargin, 0);
    const cutMargin = withDefault(options.cutMargin, 0);
    const foldingMargin = withDefault(options.foldingMargin, 5);
    const printerMargin = withDefault(options.printerMargin, 5);
    const cutterOffset = withDefault(options.cutterOffset, 0);

    const outerBorder = withDefault(options.outerBorder, 0);
    const innerBorderWidth = withDefault(
      options.innerBorder,
      withDefault(options.innerBorderWidth, 0)
    );
    const innerBorderHeight = withDefault(
      options.innerBorder,
      withDefault(options.innerBorderHeight, 0)
    );
    const cornerRadius = withDefault(parseFloat(options.cornerRadius), 0);
    const borderColorFront = toPdfColor(
      withDefault(options.borderColorFront, "#000000")
    );
    const borderColorBack = toPdfColor(
      withDefault(options.borderColorBack, "#000000")
    );

    const pageSize = validated(
      options.pageSize,
      (x) => PDFLib.PageSizes[x] !== undefined,
      "A4"
    );
    const title = withDefault(options.title, "Layout PDF");

    const pageFormat = PDFLib.PageSizes[pageSize];

    const mmFactor = 72 / 25.4;

    const outerBorderDoc = outerBorder * mmFactor;
    const innerBorderWidthDoc = innerBorderWidth * mmFactor;
    const innerBorderHeightDoc = innerBorderHeight * mmFactor;
    const cornerRadiusDoc = cornerRadius * mmFactor;

    const [pageWidth, pageHeight] = pageFormat;
    const [cardWidthDoc, cardHeightDoc] = [
      cardWidth * mmFactor,
      cardHeight * mmFactor,
    ];

    const cardMarginDoc = cardMargin * mmFactor;
    const effectiveCardMarginDoc = cardMarginDoc + 2 * outerBorderDoc;

    const foldingMarginDoc = foldingMargin * mmFactor;
    const effectiveFoldingMarginDoc = foldingMarginDoc + 2 * outerBorderDoc;

    const layoutSettings = findOptimalLayout({
      ...options,
      cardWidth: cardWidth + 2 * outerBorder,
      cardHeight: cardHeight + 2 * outerBorder,
    });
    if (!layoutSettings) {
      postMessage({ error: "Layout could not be determined." });
      return;
    }
    const {
      cardsPerPage,
      cardColumnsPerPage,
      cardRowsPerPage,
      rotate,
      totalWidth,
      totalHeight,
      orientation,
    } = layoutSettings;

    reportProgress(0, cards.length);

    const url = "https://pnpbuddy.com";
    const now = new Date();
    const pdfDoc = await PDFLib.PDFDocument.create();
    pdfDoc.setTitle(title);
    pdfDoc.setAuthor(url);
    pdfDoc.setProducer(url);
    pdfDoc.setCreator(`pnpbuddy.com (${url})`);
    pdfDoc.setCreationDate(now);
    pdfDoc.setModificationDate(now);

    const deduplicationLUT = {};
    const lookupCard = async (card) => {
      if (!deduplicationLUT[card]) {
        if (card.startsWith("data:image/png;base64,")) {
          deduplicationLUT[card] = await pdfDoc.embedPng(card);
        } else if (card.startsWith("data:image/jpeg;base64,")) {
          deduplicationLUT[card] = await pdfDoc.embedJpg(card);
        } else {
          // Handle raw buffer if needed, or throw error
        }
      }
      return deduplicationLUT[card];
    };

    let count = 0;
    let pages = 0;
    let page = null;

    for (const card of cards) {
      const frontImage = await lookupCard(card.front);
      const backImage = await lookupCard(card.back);

      if (page == null || count % cardsPerPage === 0) {
        if (page)
          drawMarkup(
            page,
            orientation,
            rotate,
            pageWidth,
            pageHeight,
            cardWidth,
            cardHeight,
            totalWidth,
            totalHeight,
            cardMargin + outerBorder * 2,
            foldingMargin + 2 * outerBorder,
            cutMargin,
            printerMargin,
            cutterOffset,
            cardColumnsPerPage,
            cardRowsPerPage
          );
        pages++;
        page = pdfDoc.addPage(pageFormat);
      }

      let xFront, yFront, xBack, yBack, angleFront, angleBack;
      let xOuterFront, yOuterFront, xOuterBack, yOuterBack;
      let xInnerFront, yInnerFront, xInnerBack, yInnerBack;
      const row = Math.floor((count % cardsPerPage) / cardColumnsPerPage);
      if (orientation === "vertical") {
        if (rotate) {
          angleFront = PDFLib.degrees(90);
          xFront =
            pageWidth / 2 -
            effectiveFoldingMarginDoc -
            row * (cardHeightDoc + effectiveCardMarginDoc);
          yFront =
            (pageHeight + totalHeight) / 2 -
            cardWidthDoc -
            (count % cardColumnsPerPage) *
              (cardWidthDoc + effectiveCardMarginDoc);

          angleBack = PDFLib.degrees(-90);
          xBack =
            pageWidth / 2 +
            effectiveFoldingMarginDoc +
            row * (cardHeightDoc + effectiveCardMarginDoc);
          yBack =
            (pageHeight + totalHeight) / 2 -
            (count % cardColumnsPerPage) *
              (cardWidthDoc + effectiveCardMarginDoc);

          xInnerFront = xFront - innerBorderHeightDoc;
          yInnerFront = yFront + innerBorderWidthDoc;
          xInnerBack = xBack + innerBorderHeightDoc;
          yInnerBack = yBack - innerBorderWidthDoc;

          xOuterFront = xFront + outerBorderDoc;
          yOuterFront = yFront - outerBorderDoc;
          xOuterBack = xBack - outerBorderDoc;
          yOuterBack = yBack + outerBorderDoc;
        } else {
          angleFront = PDFLib.degrees(0);
          xFront =
            pageWidth / 2 -
            effectiveFoldingMarginDoc -
            cardWidthDoc -
            row * (cardWidthDoc + effectiveCardMarginDoc);
          yFront =
            (pageHeight + totalHeight) / 2 -
            cardHeightDoc -
            (count % cardColumnsPerPage) *
              (cardHeightDoc + effectiveCardMarginDoc);

          angleBack = PDFLib.degrees(0);
          xBack =
            pageWidth / 2 +
            effectiveFoldingMarginDoc +
            row * (cardWidthDoc + effectiveCardMarginDoc);
          yBack = yFront;

          xInnerFront = xFront + innerBorderWidthDoc;
          yInnerFront = yFront + innerBorderHeightDoc;
          xInnerBack = xBack + innerBorderWidthDoc;
          yInnerBack = yInnerFront;

          xOuterFront = xFront - outerBorderDoc;
          yOuterFront = yFront - outerBorderDoc;
          xOuterBack = xBack - outerBorderDoc;
          yOuterBack = yOuterFront;
        }
      } else {
        if (!rotate) {
          // heads-up, inverted logic!
          angleFront = PDFLib.degrees(0);
          xFront =
            (pageWidth - totalWidth) / 2 +
            (count % cardColumnsPerPage) *
              (cardWidthDoc + effectiveCardMarginDoc);
          yFront =
            pageHeight / 2 +
            effectiveFoldingMarginDoc +
            row * (cardHeightDoc + effectiveCardMarginDoc);

          angleBack = PDFLib.degrees(180);
          xBack = xFront + cardWidthDoc;
          yBack =
            pageHeight / 2 -
            effectiveFoldingMarginDoc -
            row * (cardHeightDoc + effectiveCardMarginDoc);

          xInnerFront = xFront + innerBorderWidthDoc;
          yInnerFront = yFront + innerBorderHeightDoc;
          xInnerBack = xBack - innerBorderWidthDoc;
          yInnerBack = yBack - innerBorderHeightDoc;

          xOuterFront = xFront - outerBorderDoc;
          yOuterFront = yFront - outerBorderDoc;
          xOuterBack = xBack + outerBorderDoc;
          yOuterBack = yBack + outerBorderDoc;
        } else {
          angleFront = PDFLib.degrees(90);
          xFront =
            (pageWidth - totalWidth) / 2 +
            cardHeightDoc +
            (count % cardColumnsPerPage) *
              (cardHeightDoc + effectiveCardMarginDoc);
          yFront =
            pageHeight / 2 +
            effectiveFoldingMarginDoc +
            row * (cardWidthDoc + effectiveCardMarginDoc);

          angleBack = PDFLib.degrees(90);
          xBack = xFront;
          yBack =
            pageHeight / 2 -
            effectiveFoldingMarginDoc -
            cardWidthDoc -
            row * (cardWidthDoc + effectiveCardMarginDoc);

          xInnerFront = xFront - innerBorderHeightDoc;
          yInnerFront = yFront + innerBorderWidthDoc;
          xInnerBack = xInnerFront;
          yInnerBack = yBack + innerBorderWidthDoc;

          xOuterFront = xFront + outerBorderDoc;
          yOuterFront = yFront - outerBorderDoc;
          xOuterBack = xOuterFront;
          yOuterBack = yBack - outerBorderDoc;
        }
      }

      page.drawImage(frontImage, {
        x: xInnerFront,
        y: yInnerFront,
        width: cardWidthDoc - 2 * innerBorderWidthDoc,
        height: cardHeightDoc - 2 * innerBorderHeightDoc,
        rotate: angleFront,
      });

      page.drawImage(backImage, {
        x: xInnerBack,
        y: yInnerBack,
        width: cardWidthDoc - 2 * innerBorderWidthDoc,
        height: cardHeightDoc - 2 * innerBorderHeightDoc,
        rotate: angleBack,
      });

      if (outerBorder > 0 || innerBorderWidth > 0 || innerBorderHeight > 0) {
        page.drawRectangle({
          x: xOuterFront,
          y: yOuterFront,
          width: cardWidthDoc + 2 * outerBorderDoc,
          height: cardHeightDoc + 2 * outerBorderDoc,
          borderColor: borderColorFront,
          borderWidth: 2 * innerBorderWidthDoc,
          rx: 0,
          ry: 0,
          rotate: angleFront,
        });

        page.drawRectangle({
          x: xOuterBack,
          y: yOuterBack,
          width: cardWidthDoc + 2 * outerBorderDoc,
          height: cardHeightDoc + 2 * outerBorderDoc,
          borderColor: borderColorBack,
          borderWidth: 2 * innerBorderWidthDoc,
          rx: 0,
          ry: 0,
          rotate: angleBack,
        });

        page.drawRectangle({
          x: xOuterFront,
          y: yOuterFront,
          width: cardWidthDoc + 2 * outerBorderDoc,
          height: cardHeightDoc + 2 * outerBorderDoc,
          borderColor: borderColorFront,
          borderWidth: 2 * innerBorderWidthDoc,
          rx: cornerRadiusDoc,
          ry: cornerRadiusDoc,
          rotate: angleFront,
        });

        page.drawRectangle({
          x: xOuterBack,
          y: yOuterBack,
          width: cardWidthDoc + 2 * outerBorderDoc,
          height: cardHeightDoc + 2 * outerBorderDoc,
          borderColor: borderColorBack,
          borderWidth: 2 * innerBorderWidthDoc,
          rx: cornerRadiusDoc,
          ry: cornerRadiusDoc,
          rotate: angleBack,
        });
      }

      count++;

      reportProgress(count, cards.length);
    }
    drawMarkup(
      page,
      orientation,
      rotate,
      pageWidth,
      pageHeight,
      cardWidth,
      cardHeight,
      totalWidth,
      totalHeight,
      cardMargin + 2 * outerBorder,
      foldingMargin + 2 * outerBorder,
      cutMargin,
      printerMargin,
      cutterOffset,
      cardColumnsPerPage,
      cardRowsPerPage
    );

    reportSaving();
    const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
    reportDone(cards.length, pages, pdfBytes.byteLength);

    postMessage(
      {
        pdf: {
          pdfBytes: pdfBytes,
          aspectRatio: pageWidth / pageHeight,
        },
      },
      [pdfBytes.buffer]
    );
  };

  const reportProgress = (done, all) => {
    postMessage({
      state: "progress",
      data: { done, all, progress: Math.round((done * 100) / all) },
    });
  };

  const reportSaving = () => {
    postMessage({ state: "saving" });
  };

  const reportDone = (cards, pages, bytes) => {
    postMessage({ state: "done", data: { cards, pages, bytes } });
  };

  const onmessage = async (e) => {
    if (e.data.generatePdf) {
      const { cards, options } = e.data.generatePdf;
      try {
        await generatedPdf(cards, options);
      } catch (err) {
        postMessage({ error: err.message });
      }
    }
  };

  addEventListener("message", onmessage);
} else {
  // not in a worker
}
