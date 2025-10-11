async function shiftPDFContent() {
  const shiftX =
    parseFloat(document.getElementById("shiftX").value.replace(",", ".")) *
    2.83464567;
  const shiftY =
    parseFloat(document.getElementById("shiftY").value.replace(",", ".")) *
    2.83464567;
  const shiftPages = document.querySelector(
    'input[name="shiftPages"]:checked'
  ).value;

  const inputFile = document.getElementById("pdfFile");
  const pdfFile = inputFile.files[0];
  const originalName = pdfFile.name.split(".pdf")[0];

  const reader = new FileReader();
  reader.onload = async function () {
    const data = new Uint8Array(this.result);
    const pdfDoc = await PDFLib.PDFDocument.load(data);
    const pages = pdfDoc.getPages();

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const rotation = page.getRotation().angle;

      console.log(i);

      // Convert degrees to radians
      const rotationRadians = rotation * (Math.PI / 180);

      // Adjust shift values based on rotation angle
      const adjustedShiftX =
        shiftX * Math.cos(rotationRadians) - shiftY * Math.sin(rotationRadians);
      const adjustedShiftY =
        shiftX * Math.sin(rotationRadians) + shiftY * Math.cos(rotationRadians);

      if (shiftPages === "odd" && (i + 1) % 2 === 1) {
        // Shift the content on odd pages
        page.translateContent(adjustedShiftX, adjustedShiftY);
      } else if (shiftPages === "even" && (i + 1) % 2 === 0) {
        // Shift the content on even pages
        page.translateContent(adjustedShiftX, adjustedShiftY);
      }
    }

    const modifiedPDFData = await pdfDoc.save();
    const blob = new Blob([modifiedPDFData], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = originalName + "_shifted.pdf";
    anchor.click();

    // Clean up the URL and remove the anchor element after a short delay
    setTimeout(() => {
      URL.revokeObjectURL(url);
      anchor.remove();
    }, 100);
  };
  reader.readAsArrayBuffer(pdfFile);
}
