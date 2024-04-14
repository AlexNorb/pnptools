// preset settings
const presets = {
  preset1: {
    rows: 3,
    columns: 3,
    imageWidth: 63,
    imageHeight: 88,
    bleed: 0,
    frontBorderCheckbox: false,
    backBorderCheckbox: false,
    borderWidth: 3,
  },
  preset2: {
    rows: 4,
    columns: 4,
    imageWidth: 44,
    imageHeight: 68,
    bleed: 0,
    frontBorderCheckbox: false,
    backBorderCheckbox: false,
    borderWidth: 0,
  },
  preset3: {
    rows: 2,
    columns: 3,
    imageWidth: 63,
    imageHeight: 88,
    bleed: 3,
    frontBorderCheckbox: false,
    backBorderCheckbox: false,
    borderWidth: 0,
  },
};

document.getElementById("preset").addEventListener("change", function () {
  const selectedPreset = this.value;
  if (selectedPreset) {
    const presetValues = presets[selectedPreset];

    document.getElementById("rows").value = presetValues.rows;

    document.getElementById("columns").value = presetValues.columns;

    document.getElementById("imageWidth").value = presetValues.imageWidth;

    document.getElementById("imageHeight").value = presetValues.imageHeight;

    document.getElementById("bleed").value = presetValues.bleed;

    document.getElementById("frontBorderCheckbox").checked =
      presetValues.frontBorderCheckbox;

    document.getElementById("backBorderCheckbox").checked =
      presetValues.backBorderCheckbox;

    document.getElementById("borderWidth").value = presetValues.borderWidth;
  }
});

//mode selector
function modeIndicator() {
  let mode1 = document.getElementById("mode1");
  let mode2 = document.getElementById("mode2");
  let mode3 = document.getElementById("mode3");

  mode1.src = "mode1.jpg";
  mode2.src = "mode2.jpg";
  mode3.src = "mode3.jpg";

  const fileCountBack = fileInputBack.files.length;
  const fileCount = fileInput.files.length;

  if (fileCountBack === 0) {
    mode1.src = "mode1on.jpg";
  } else if (fileCountBack === 1) {
    mode2.src = "mode2on.jpg";
  } else if (fileCountBack === fileCount) {
    mode3.src = "mode3on.jpg";
  } else if (fileCountBack !== fileCount) {
    mode1.src = "mode1error.jpg";
    mode2.src = "mode2error.jpg";
    mode3.src = "mode3error.jpg";
  }
}

//Dropzone front
const fileInput = document.getElementById("frontImages");
const fileCountElement = document.getElementById("fileCount");

fileInput.addEventListener("change", () => {
  modeIndicator();

  const fileCount = fileInput.files.length;
  fileCountElement.textContent = `${fileCount} file${
    fileCount !== 1 ? "s" : ""
  } selected`;
});

//Dropzone back
const fileInputBack = document.getElementById("backImages");
const fileCountBackElement = document.getElementById("fileCountBack");

fileInputBack.addEventListener("change", () => {
  modeIndicator();

  const fileCountBack = fileInputBack.files.length;
  fileCountBackElement.textContent = `${fileCountBack} file${
    fileCountBack !== 1
      ? "s selected. Different backs mode."
      : " selected. Same backs mode."
  }`;
});
