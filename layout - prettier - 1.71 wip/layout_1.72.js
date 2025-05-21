/**
 * Detects the actual image type from buffer (ignores file extension).
 * Returns "image/jpeg", "image/png", or null if unsupported.
 */
function getImageType(buffer) {
  const uint8 = new Uint8Array(buffer);

  // JPEG: Starts with 0xFFD8
  if (uint8[0] === 0xff && uint8[1] === 0xd8) return "image/jpeg";

  // PNG: Starts with 0x89504E47
  if (
    uint8[0] === 0x89 &&
    uint8[1] === 0x50 &&
    uint8[2] === 0x4e &&
    uint8[3] === 0x47
  )
    return "image/png";

  return null; // Unsupported (WebP, GIF, etc.)
}

// Define crosshair functions
function getCrosshairCoordinates(
  x,
  y,
  imageWidth,
  imageHeight,
  bleed,
  crosssize
) {
  return [
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
}

//Spinkit loader
const loader = document.getElementById("loader");

// Get the value of the color input fields
const crosshaircolorinput = document.getElementById("crosshaircolor");
const bordercolorinput = document.getElementById("borderColor");

// Crosshair settings
let hexcrosshair = crosshaircolorinput.value;
let crosshairColor = updateColor(crosshaircolorinput);

// Border settings
let hexborder = bordercolorinput.value;
let bordercolor = updateColor(bordercolorinput);

// Add event listeners to both input elements
[crosshaircolorinput, bordercolorinput].forEach((input) => {
  input.addEventListener("input", function () {
    if (input === crosshaircolorinput) {
      crosshairColor = updateColor(input);
    } else {
      bordercolor = updateColor(input);
    }
  });
});

// Function to update a color variable based on an input element
function updateColor(input) {
  // Convert the hexadecimal RGB value to an RGB array
  const rgb = hexToRgb(input.value);
  return PDFLib.rgb(...rgb);
}

// Function to convert a hexadecimal color string to an RGB array
function hexToRgb(hex) {
  const [r, g, b] = hex.match(/[a-f\d]{2}/gi).map((x) => parseInt(x, 16) / 255);
  return [r, g, b];
}

async function readFiles(files) {
  const images = [];
  for (const file of files) {
    const reader = new FileReader();
    const promise = new Promise((resolve, reject) => {
      reader.onload = function (e) {
        const buffer = e.target.result;
        const realType = getImageType(buffer);

        if (!realType) {
          reject(new Error(`Unsupported file type: ${file.name}`));
          return;
        }

        resolve({
          buffer, // File data (ArrayBuffer)
          type: realType, // "image/jpeg" or "image/png"
          name: file.name, // Original filename (for debugging)
        });
      };
      reader.onerror = () =>
        reject(new Error(`Failed to read file: ${file.name}`));
    });
    reader.readAsArrayBuffer(file);
    images.push(await promise);
  }
  return images;
}

async function generatePDF() {
  loader.style.display = "block";
  const frontImagesInput = document.getElementById("frontImages");
  const backImagesInput = document.getElementById("backImages");
  const frontFiles = frontImagesInput.files;
  const backFiles = backImagesInput.files;

  // Get the state of the single back image checkbox
  const singleBack = backFiles.length === 1 ? true : false;
  const noBack = backFiles.length === 0 ? true : false;

  console.log(backFiles.length);

  console.log(frontFiles.length);

  if (frontFiles.length < 1) {
    alert("Error: No front images selected.");
    loader.style.display = "none";
    return;
  } else if (frontFiles.length !== backFiles.length && !singleBack && !noBack) {
    alert("Error: Number of backs must be 0,1 or same as fronts.");
    loader.style.display = "none";
    return;
  }

  const [frontImages, backImages] = await Promise.all([
    readFiles(frontFiles),
    readFiles(backFiles),
  ]);

  createPDF(frontImages, backImages, frontFiles, backFiles);
}

async function createPDF(frontImages, backImages, frontFiles, backFiles) {
  // Get state of mode
  const singleBack = backFiles.length === 1 ? true : false;
  const noBack = backFiles.length === 0 ? true : false;

  // Get the border width and color from the form fields

  const bleed =
    parseFloat(document.getElementById("bleed").value.replace(",", ".")) *
    2.83464567;
  const borderWidth =
    parseFloat(document.getElementById("borderWidth").value.replace(",", ".")) *
    2.83464567 *
    2;
  const imageWidth =
    parseFloat(document.getElementById("imageWidth").value.replace(",", ".")) *
      2.83464567 +
    bleed +
    bleed;
  const imageHeight =
    parseFloat(document.getElementById("imageHeight").value.replace(",", ".")) *
      2.83464567 +
    bleed +
    bleed;
  const crosswidth =
    parseFloat(document.getElementById("crosswidth").value.replace(",", ".")) *
    2.83464567;
  const crosssize =
    (parseFloat(document.getElementById("crosssize").value.replace(",", ".")) *
      2.83464567) /
    2;

  // Get the state of the front and back checkboxes
  const frontCheckbox = document.getElementById("frontCheckbox").checked;
  const backCheckbox = document.getElementById("backCheckbox").checked;

  // Get the state of the front and back border checkboxes
  const frontBorderCheckbox = document.getElementById(
    "frontBorderCheckbox"
  ).checked;
  const backBorderCheckbox =
    document.getElementById("backBorderCheckbox").checked;

  const pdfDoc = await PDFLib.PDFDocument.create();
  const rows = parseInt(document.getElementById("rows").value);
  const columns = parseInt(document.getElementById("columns").value);
  const pageSize = document.querySelector(
    'input[name="pageSize"]:checked'
  ).value;

  let pageWidth, pageHeight;
  if (pageSize === "A4") {
    pageWidth = 595.28; // A4 width in points
    pageHeight = 841.89; // A4 height in points
  } else if (pageSize === "Letter") {
    pageWidth = 612; // Letter width in points
    pageHeight = 792; // Letter height in points
  } else if (pageSize === "A4 landscape") {
    pageWidth = 841.89; // A4 landscape width in points
    pageHeight = 595.28; // A4 landscape height in points
  } else if (pageSize === "Letter landscape") {
    pageWidth = 792; // Letter landscape width in points
    pageHeight = 612; // Letter landscape height in points
  }

  let x = (pageWidth - columns * imageWidth) / 2;
  let y = (pageHeight + rows * imageHeight) / 2;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);

  // Draw border/background for page 1
  if (frontBorderCheckbox) {
    page.drawRectangle({
      x: x,
      y: y - rows * imageHeight,
      width: imageWidth * columns,
      height: imageHeight * rows,
      borderWidth: 20,
      borderColor: bordercolor,
      color: bordercolor,
    });
  }

  if (columns * imageWidth > pageWidth || rows * imageHeight > pageHeight) {
    alert("Error: The input grid size exceeds the page size.");
    loader.style.display = "none";
    return;
  }

  // Calculate the image dimensions for front images, taking into account the border width if the front border checkbox is checked
  let frontImageWidthWithBorder = imageWidth;
  let frontImageHeightWithBorder = imageHeight;

  if (frontBorderCheckbox) {
    frontImageWidthWithBorder -= borderWidth;
    frontImageHeightWithBorder -= borderWidth;
  }

  // Calculate the image dimensions and position for back images, taking into account the border width if the back border checkbox is checked
  let backImageWidthWithBorder = imageWidth;
  let backImageHeightWithBorder = imageHeight;

  if (backBorderCheckbox) {
    backImageWidthWithBorder -= borderWidth;
    backImageHeightWithBorder -= borderWidth;
  }

  for (let i = 0; i < frontImages.length; i++) {
    if (i > 0 && i % (rows * columns) === 0) {
      // Create a new page when the number of images exceeds the number of cells in the grid layout
      page = pdfDoc.addPage([pageWidth, pageHeight]);

      x = (pageWidth - columns * imageWidth) / 2;
      y = (pageHeight + rows * imageHeight) / 2;

      // Draw border/background for new odd page
      if (frontBorderCheckbox) {
        page.drawRectangle({
          x: x,
          y: y - rows * imageHeight,
          width: imageWidth * columns,
          height: imageHeight * rows,
          borderWidth: 20,
          borderColor: bordercolor,
          color: bordercolor,
        });
      }
    }

    //Border position adjustment
    let frontXWithBorder = x;
    let frontYWithBorder = y;

    if (frontBorderCheckbox) {
      frontXWithBorder += borderWidth / 2;
      frontYWithBorder -= borderWidth / 2;
    }

    let image;
    // NEW CODE (uses real file type):
    if (frontImages[i].type === "image/png") {
      image = await pdfDoc.embedPng(frontImages[i].buffer);
    } else if (frontImages[i].type === "image/jpeg") {
      image = await pdfDoc.embedJpg(frontImages[i].buffer);
    }

    page.drawImage(image, {
      x: frontXWithBorder,
      y: frontYWithBorder - frontImageHeightWithBorder,
      width: frontImageWidthWithBorder,
      height: frontImageHeightWithBorder,
    });

    const crosshaircoordinates = getCrosshairCoordinates(
      x,
      y,
      imageWidth,
      imageHeight,
      bleed,
      crosssize
    );

    // Add crosshair overlay to front images if the front checkbox is checked
    if (frontCheckbox) {
      for (const crosshaircoordinate of crosshaircoordinates) {
        const { start, end } = crosshaircoordinate;

        // Draw crosshair overlay
        page.drawLine({
          start: start,
          end: end,
          thickness: crosswidth,
          color: crosshairColor,
        });
      }
    }

    x += imageWidth;
    if ((i + 1) % columns === 0) {
      x = (pageWidth - columns * imageWidth) / 2;
      y -= imageHeight;
    }

    // Embed back images on even pages
    if (
      (!noBack && (i + 1) % (rows * columns) === 0) ||
      (!noBack && i === frontImages.length - 1)
    ) {
      x = (pageWidth + columns * imageWidth) / 2 - imageWidth;
      y = (pageHeight + rows * imageHeight) / 2;
      page = pdfDoc.addPage([pageWidth, pageHeight]);

      // Draw border/background for even page
      if (backBorderCheckbox) {
        page.drawRectangle({
          x: x - columns * imageWidth + imageWidth,
          y: y - rows * imageHeight,
          width: imageWidth * columns,
          height: imageHeight * rows,
          borderWidth: 20,
          borderColor: bordercolor,
          color: bordercolor,
        });
      }

      let j = i - (i % (rows * columns));
      let maxJ = Math.min(j + rows * columns, frontImages.length);

      //single back stuff
      let singleBackImage;
      let firstIteration = true;

      for (; j < maxJ; j++) {
        let backXWithBorder = x;
        let backYWithBorder = y;

        if (backBorderCheckbox) {
          backXWithBorder += borderWidth / 2;
          backYWithBorder -= borderWidth / 2;
        }

        // Make sure single back is only embedded once
        if (firstIteration) {
          if (backImages[0].type === "image/png") {
            singleBackImage = await pdfDoc.embedPng(backImages[0].buffer);
          } else if (backImages[0].type === "image/jpeg") {
            singleBackImage = await pdfDoc.embedJpg(backImages[0].buffer);
          }
          firstIteration = false;
        }

        let image;
        if (singleBack) {
          image = singleBackImage;
        } else if (backImages[j].type === "image/png") {
          image = await pdfDoc.embedPng(backImages[j].buffer);
        } else if (backImages[j].type === "image/jpeg") {
          image = await pdfDoc.embedJpg(backImages[j].buffer);
        }

        page.drawImage(image, {
          x: backXWithBorder,
          y: backYWithBorder - backImageHeightWithBorder,
          width: backImageWidthWithBorder,
          height: backImageHeightWithBorder,
        });

        const crosshaircoordinates = getCrosshairCoordinates(
          x,
          y,
          imageWidth,
          imageHeight,
          bleed,
          crosssize
        );

        // Add crosshair overlay to back images if the back checkbox is checked
        if (backCheckbox) {
          for (const crosshaircoordinate of crosshaircoordinates) {
            const { start, end } = crosshaircoordinate;

            // Your drawing function here (e.g., page.drawLine) using the start and end variables from the array
            page.drawLine({
              start: start,
              end: end,
              thickness: crosswidth,
              color: crosshairColor,
            });
          }
        }

        x -= imageWidth;
        if ((j + 1) % columns === 0) {
          x = (pageWidth + columns * imageWidth) / 2 - imageWidth;
          y -= imageHeight;
        }
      }
    }
  }

  const pdfBytes = await pdfDoc.save();

  const blob = new Blob([pdfBytes], { type: "application/pdf" });

  const link = document.createElement("a");
  loader.style.display = "none";
  link.href = URL.createObjectURL(blob);
  link.download = "output.pdf";
  link.click();
  await fetch("counter.php");
}
