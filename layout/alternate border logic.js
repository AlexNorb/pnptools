const loader = document.getElementById("loader");

// Get the value of the color input field
const crosshaircolorinput = document.getElementById("crosshaircolor");
const bordercolorinput = document.getElementById("borderColor");

//Crosshair settings

let hexcrosshair = crosshaircolorinput.value;
let crosshairColor = updateCrosshairColor();

crosshaircolorinput.addEventListener("input", function () {
  hexcrosshair = crosshaircolorinput.value;
  crosshairColor = updateCrosshairColor();
});

function updateCrosshairColor() {
  // Convert the hexadecimal RGB value to an RGB array
  const rgbcrosshair = hexToRgb(hexcrosshair);
  return PDFLib.rgb(...rgbcrosshair);
}

//Border
let hexborder = bordercolorinput.value;
let bordercolor = updatebordercolor();

bordercolorinput.addEventListener("input", function () {
  hexborder = bordercolorinput.value;
  bordercolor = updatebordercolor();
});

function updatebordercolor() {
  // Convert the hexadecimal RGB value to an RGB array
  const rgbborder = hexToRgb(hexborder);
  return PDFLib.rgb(...rgbborder);
}

// Function to convert a hexadecimal color string to an RGB array
function hexToRgb(hex) {
  const r = parseInt(hex.substring(1, 3), 16) / 255;
  const g = parseInt(hex.substring(3, 5), 16) / 255;
  const b = parseInt(hex.substring(5, 7), 16) / 255;
  return [r, g, b];
}

function generatePDF() {
  loader.style.display = "block";
  const frontImagesInput = document.getElementById("frontImages");
  const backImagesInput = document.getElementById("backImages");
  const frontFiles = frontImagesInput.files;
  const backFiles = backImagesInput.files;
  const frontImages = [];
  const backImages = [];

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

  for (let i = 0; i < frontFiles.length; i++) {
    const file = frontFiles[i];
    const reader = new FileReader();

    reader.onload = function (e) {
      const imageBuffer = e.target.result;
      frontImages.push(imageBuffer);

      if (
        frontImages.length === frontFiles.length &&
        backImages.length === backFiles.length
      ) {
        createPDF(frontImages, backImages, frontFiles, backFiles);
      }
    };

    reader.readAsArrayBuffer(file);
  }

  for (let i = 0; i < backFiles.length; i++) {
    const file = backFiles[i];
    const reader = new FileReader();

    reader.onload = function (e) {
      const imageBuffer = e.target.result;
      backImages.push(imageBuffer);

      if (
        frontImages.length === frontFiles.length &&
        backImages.length === backFiles.length
      ) {
        createPDF(frontImages, backImages, frontFiles, backFiles);
      }
    };

    reader.readAsArrayBuffer(file);
  }
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

  // Draw outer border for page 1
  if (frontBorderCheckbox && borderWidth === 0) {
    page.drawRectangle({
      x: x - 5,
      y: y - 5 - rows * imageHeight,
      width: 10 + imageWidth * columns,
      height: 10 + imageHeight * rows,
      borderWidth: 10,
      borderColor: bordercolor,
    });
  }

  // // Draw outer border for new odd page
  // if (frontBorderCheckbox && borderWidth === 0) {
  //   page.drawRectangle({
  //     x: x - 5 - columns * imageWidth + imageWidth,
  //     y: y - 5 - rows * imageHeight,
  //     width: 10 + imageWidth * columns,
  //     height: 10 + imageHeight * rows,
  //     borderWidth: 10,
  //     borderColor: bordercolor,
  //     color: bordercolor,
  //   });
  // }

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

      // Draw outer border for new odd page
      if (frontBorderCheckbox && borderWidth === 0) {
        page.drawRectangle({
          x: x - 5 - columns * imageWidth + imageWidth,
          y: y - 5 - rows * imageHeight,
          width: 10 + imageWidth * columns,
          height: 10 + imageHeight * rows,
          borderWidth: 10,
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

    console.log("front", frontFiles[i].type);

    let imageBuffer = frontImages[i];
    let image;
    if (frontFiles[i].type === "image/png") {
      image = await pdfDoc.embedPng(imageBuffer);
    } else if (frontFiles[i].type === "image/jpeg") {
      image = await pdfDoc.embedJpg(imageBuffer);
    }

    // Draw border for odd page cards
    if (frontBorderCheckbox) {
      page.drawRectangle({
        x: frontXWithBorder,
        y: frontYWithBorder - frontImageHeightWithBorder,
        width: frontImageWidthWithBorder,
        height: frontImageHeightWithBorder,
        borderWidth: borderWidth * 1.99,
        borderColor: bordercolor,
        color: bordercolor,
      });
    }

    page.drawImage(image, {
      x: frontXWithBorder,
      y: frontYWithBorder - frontImageHeightWithBorder,
      width: frontImageWidthWithBorder,
      height: frontImageHeightWithBorder,
    });

    const crosshaircoordinates = [
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

    // Add crosshair overlay to front images if the front checkbox is checked
    if (frontCheckbox) {
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

      // Draw outer border for even page
      if (backBorderCheckbox && borderWidth === 0) {
        page.drawRectangle({
          x: x - 5 - columns * imageWidth + imageWidth,
          y: y - 5 - rows * imageHeight,
          width: 10 + imageWidth * columns,
          height: 10 + imageHeight * rows,
          borderWidth: 10,
          borderColor: bordercolor,
        });
      }

      let j = i - (i % (rows * columns));
      let maxJ = Math.min(j + rows * columns, frontImages.length);

      //single back stuff
      let singleBackImage;
      let firstItteration = true;

      for (; j < maxJ; j++) {
        let backXWithBorder = x;
        let backYWithBorder = y;

        if (backBorderCheckbox) {
          backXWithBorder += borderWidth / 2;
          backYWithBorder -= borderWidth / 2;
        }

        //Make sure single back is only embedded once
        if (firstItteration) {
          if (backFiles[0].type === "image/png") {
            singleBackImage = await pdfDoc.embedPng(backImages[0]);
          } else if (backFiles[0].type === "image/jpeg") {
            singleBackImage = await pdfDoc.embedJpg(backImages[0]);
          }
          firstItteration = false;
        }

        let imageBuffer = backImages[j];

        // Draw border for even page cards
        if (backBorderCheckbox) {
          page.drawRectangle({
            x: backXWithBorder,
            y: backYWithBorder - backImageHeightWithBorder,
            width: backImageWidthWithBorder,
            height: backImageHeightWithBorder,
            borderWidth: borderWidth * 1.99,
            borderColor: bordercolor,
            color: bordercolor,
          });
        }

        let image;
        if (singleBack) {
          image = singleBackImage;
        } else if (backFiles[j].type === "image/png") {
          image = await pdfDoc.embedPng(imageBuffer);
        } else if (backFiles[j].type === "image/jpeg") {
          image = await pdfDoc.embedJpg(imageBuffer);
        }

        page.drawImage(image, {
          x: backXWithBorder,
          y: backYWithBorder - backImageHeightWithBorder,
          width: backImageWidthWithBorder,
          height: backImageHeightWithBorder,
        });

        const crosshaircoordinates = [
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
