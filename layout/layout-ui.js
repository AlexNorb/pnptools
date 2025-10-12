document.addEventListener("DOMContentLoaded", () => {
  const LayoutToolUI = {
    elements: {
      loader: document.getElementById("loader"),
      frontImages: document.getElementById("frontImages"),
      backImages: document.getElementById("backImages"),
      fileCount: document.getElementById("fileCount"),
      fileCountBack: document.getElementById("fileCountBack"),
      mode1: document.getElementById("mode1"),
      mode2: document.getElementById("mode2"),
      mode3: document.getElementById("mode3"),
      preset: document.getElementById("preset"),
      rows: document.getElementById("rows"),
      columns: document.getElementById("columns"),
      imageWidth: document.getElementById("imageWidth"),
      imageHeight: document.getElementById("imageHeight"),
      bleed: document.getElementById("bleed"),
      borderWidth: document.getElementById("borderWidth"),
      crosshaircolor: document.getElementById("crosshaircolor"),
      borderColor: document.getElementById("borderColor"),
      frontCheckbox: document.getElementById("frontCheckbox"),
      backCheckbox: document.getElementById("backCheckbox"),
      frontBorderCheckbox: document.getElementById("frontBorderCheckbox"),
      backBorderCheckbox: document.getElementById("backBorderCheckbox"),
      crosswidth: document.getElementById("crosswidth"),
      crosssize: document.getElementById("crosssize"),
      generatePdfButton: document.getElementById("generatePdfButton"),
      cornerRadius: document.getElementById("cornerRadius"),
    },

    config: {
      crosshairColor: null,
      borderColor: null,
      presets: {
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
        preset4: {
          rows: 2,
          columns: 4,
          imageWidth: 59,
          imageHeight: 91,
          bleed: 0,
          frontBorderCheckbox: false,
          backBorderCheckbox: false,
          borderWidth: 0,
        },
      },
    },

    init() {
      this.elements.generatePdfButton.addEventListener(
        "click",
        window.LayoutToolPDF.generatePDF.bind(window.LayoutToolPDF)
      );
      this.elements.frontImages.addEventListener("change", () => {
        this.ui.updateModeIndicator();
        this.ui.updateFileCount(
          this.elements.frontImages,
          this.elements.fileCount
        );
      });
      this.elements.backImages.addEventListener("change", () => {
        this.ui.updateModeIndicator();
        this.ui.updateFileCount(
          this.elements.backImages,
          this.elements.fileCountBack,
          true
        );
      });
      this.elements.preset.addEventListener(
        "change",
        this.ui.applyPreset.bind(this)
      );
      [this.elements.crosshaircolor, this.elements.borderColor].forEach(
        (input) => {
          input.addEventListener("input", () => {
            this.config.crosshairColor = window.LayoutToolPDF.utils.updateColor(
              this.elements.crosshaircolor
            );
            this.config.borderColor = window.LayoutToolPDF.utils.updateColor(
              this.elements.borderColor
            );
          });
        }
      );
      this.config.crosshairColor = window.LayoutToolPDF.utils.updateColor(
        this.elements.crosshaircolor
      );
      this.config.borderColor = window.LayoutToolPDF.utils.updateColor(
        this.elements.borderColor
      );
    },

    ui: {
      showLoader(show) {
        LayoutToolUI.elements.loader.style.display = show ? "block" : "none";
      },
      applyPreset() {
        const selectedPreset = LayoutToolUI.elements.preset.value;
        if (selectedPreset) {
          const presetValues = LayoutToolUI.config.presets[selectedPreset];
          LayoutToolUI.elements.rows.value = presetValues.rows;
          LayoutToolUI.elements.columns.value = presetValues.columns;
          LayoutToolUI.elements.imageWidth.value = presetValues.imageWidth;
          LayoutToolUI.elements.imageHeight.value = presetValues.imageHeight;
          LayoutToolUI.elements.bleed.value = presetValues.bleed;
          LayoutToolUI.elements.frontBorderCheckbox.checked =
            presetValues.frontBorderCheckbox;
          LayoutToolUI.elements.backBorderCheckbox.checked =
            presetValues.backBorderCheckbox;
          LayoutToolUI.elements.borderWidth.value = presetValues.borderWidth;
        }
      },
      updateModeIndicator() {
        const { mode1, mode2, mode3, frontImages, backImages } =
          LayoutToolUI.elements;
        mode1.src = "mode1.jpg";
        mode2.src = "mode2.jpg";
        mode3.src = "mode3.jpg";
        const fileCountBack = backImages.files.length;
        const fileCount = frontImages.files.length;
        if (fileCountBack === 0) {
          mode1.src = "mode1on.jpg";
        } else if (fileCountBack === 1) {
          mode2.src = "mode2on.jpg";
        } else if (fileCountBack === fileCount) {
          mode3.src = "mode3on.jpg";
        } else {
          mode1.src = "mode1error.jpg";
          mode2.src = "mode2error.jpg";
          mode3.src = "mode3error.jpg";
        }
      },
      updateFileCount(fileInput, countElement, isBack = false) {
        const fileCount = fileInput.files.length;
        if (isBack) {
          countElement.textContent = `${fileCount} file${
            fileCount !== 1
              ? "s selected. Different backs mode."
              : " selected. Same backs mode."
          }`;
        } else {
          countElement.textContent = `${fileCount} file${
            fileCount !== 1 ? "s" : ""
          } selected`;
        }
      },
    },

    getSettings() {
      const {
        rows,
        columns,
        imageWidth,
        imageHeight,
        bleed,
        borderWidth,
        crosswidth,
        crosssize,
        frontCheckbox,
        backCheckbox,
        frontBorderCheckbox,
        backBorderCheckbox,
        cornerRadius,
      } = this.elements;

      const settings = {
        rows: parseInt(rows.value),
        columns: parseInt(columns.value),
        imageWidth: parseFloat(imageWidth.value.replace(",", ".")) * 2.83464567,
        imageHeight:
          parseFloat(imageHeight.value.replace(",", ".")) * 2.83464567,
        bleed: parseFloat(bleed.value.replace(",", ".")) * 2.83464567,
        borderWidth:
          parseFloat(borderWidth.value.replace(",", ".")) * 2.83464567 * 2,
        crosswidth: parseFloat(crosswidth.value.replace(",", ".")) * 2.83464567,
        crosssize:
          (parseFloat(crosssize.value.replace(",", ".")) * 2.83464567) / 2,
        frontCheckbox: frontCheckbox.checked,
        backCheckbox: backCheckbox.checked,
        frontBorderCheckbox: frontBorderCheckbox.checked,
        backBorderCheckbox: backBorderCheckbox.checked,
        cornerRadius:
          parseFloat(cornerRadius.value.replace(",", ".")) * 2.83464567,
        pageSize: document.querySelector('input[name="pageSize"]:checked')
          .value,
      };

      settings.imageWidth += settings.bleed * 2;
      settings.imageHeight += settings.bleed * 2;
      return settings;
    },
  };
  window.LayoutToolUI = LayoutToolUI;
  LayoutToolUI.init();
});
