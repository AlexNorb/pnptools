document.addEventListener("DOMContentLoaded", () => {
  const LayoutToolUI = {
    elements: {
      // Common
      loader: document.getElementById("loader"),
      frontImages: document.getElementById("frontImages"),
      backImages: document.getElementById("backImages"),
      fileCount: document.getElementById("fileCount"),
      fileCountBack: document.getElementById("fileCountBack"),
      generatePdfButton: document.getElementById("generatePdfButton"),
      doubleSidedRadio: document.getElementById("doubleSided"),
      foldableRadio: document.getElementById("foldable"),
      doubleSidedModeUI: document.getElementById("doubleSidedModeUI"),
      foldableModeUI: document.getElementById("foldableModeUI"),
      // Mode indicators
      mode1: document.getElementById("mode1"),
      mode2: document.getElementById("mode2"),
      mode3: document.getElementById("mode3"),
      // Grid Layout
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
      cornerRadius: document.getElementById("cornerRadius"),
      // Foldable Layout
      foldable_cardWidth: document.getElementById("foldable_cardWidth"),
      foldable_cardHeight: document.getElementById("foldable_cardHeight"),
      foldable_printerMargin: document.getElementById("foldable_printerMargin"),
      foldable_foldingMargin: document.getElementById("foldable_foldingMargin"),
      foldable_cardMargin: document.getElementById("foldable_cardMargin"),
      foldable_cutMargin: document.getElementById("foldable_cutMargin"),
      foldable_innerBorder: document.getElementById("foldable_innerBorder"),
      foldable_borderColorFront: document.getElementById("foldable_borderColorFront"),
      foldable_borderColorBack: document.getElementById("foldable_borderColorBack"),
      foldable_foldLinePreference: document.getElementById("foldable_foldLinePreference"),
      foldable_cornerRadius: document.getElementById("foldable_cornerRadius"),
    },

    config: {
      crosshairColor: null,
      borderColor: null,
      presets: {
        preset1: { rows: 3, columns: 3, imageWidth: 63, imageHeight: 88, bleed: 0, frontBorderCheckbox: false, backBorderCheckbox: false, borderWidth: 3 },
        preset2: { rows: 4, columns: 4, imageWidth: 44, imageHeight: 68, bleed: 0, frontBorderCheckbox: false, backBorderCheckbox: false, borderWidth: 0 },
        preset3: { rows: 2, columns: 3, imageWidth: 63, imageHeight: 88, bleed: 3, frontBorderCheckbox: false, backBorderCheckbox: false, borderWidth: 0 },
        preset4: { rows: 2, columns: 4, imageWidth: 59, imageHeight: 91, bleed: 0, frontBorderCheckbox: false, backBorderCheckbox: false, borderWidth: 0 },
      },
    },

    init() {
      this.elements.generatePdfButton.addEventListener("click", window.LayoutToolPDF.generatePDF.bind(window.LayoutToolPDF));
      this.elements.frontImages.addEventListener("change", () => {
        this.ui.updateModeIndicator();
        this.ui.updateFileCount(this.elements.frontImages, this.elements.fileCount);
      });
      this.elements.backImages.addEventListener("change", () => {
        this.ui.updateModeIndicator();
        this.ui.updateFileCount(this.elements.backImages, this.elements.fileCountBack, true);
      });
      this.elements.preset.addEventListener("change", this.ui.applyPreset.bind(this));
      [this.elements.crosshaircolor, this.elements.borderColor].forEach(input => {
        input.addEventListener("input", () => {
          this.config.crosshairColor = window.LayoutToolPDF.utils.updateColor(this.elements.crosshaircolor);
          this.config.borderColor = window.LayoutToolPDF.utils.updateColor(this.elements.borderColor);
        });
      });
      this.config.crosshairColor = window.LayoutToolPDF.utils.updateColor(this.elements.crosshaircolor);
      this.config.borderColor = window.LayoutToolPDF.utils.updateColor(this.elements.borderColor);

      this.elements.doubleSidedRadio.addEventListener("change", this.ui.toggleModeUI.bind(this));
      this.elements.foldableRadio.addEventListener("change", this.ui.toggleModeUI.bind(this));
    },

    ui: {
      toggleModeUI() {
        const isDoubleSided = LayoutToolUI.elements.doubleSidedRadio.checked;
        LayoutToolUI.elements.doubleSidedModeUI.style.display = isDoubleSided ? "block" : "none";
        LayoutToolUI.elements.foldableModeUI.style.display = isDoubleSided ? "none" : "block";
      },
      showLoader(show) { LayoutToolUI.elements.loader.style.display = show ? "block" : "none"; },
      applyPreset() {
        const selectedPreset = LayoutToolUI.elements.preset.value;
        if (selectedPreset) {
          const presetValues = LayoutToolUI.config.presets[selectedPreset];
          LayoutToolUI.elements.rows.value = presetValues.rows;
          LayoutToolUI.elements.columns.value = presetValues.columns;
          LayoutToolUI.elements.imageWidth.value = presetValues.imageWidth;
          LayoutToolUI.elements.imageHeight.value = presetValues.imageHeight;
          LayoutToolUI.elements.bleed.value = presetValues.bleed;
          LayoutToolUI.elements.frontBorderCheckbox.checked = presetValues.frontBorderCheckbox;
          LayoutToolUI.elements.backBorderCheckbox.checked = presetValues.backBorderCheckbox;
          LayoutToolUI.elements.borderWidth.value = presetValues.borderWidth;
        }
      },
      updateModeIndicator() {
        const { mode1, mode2, mode3, frontImages, backImages } = LayoutToolUI.elements;
        mode1.src = "assets/mode1.jpg";
        mode2.src = "assets/mode2.jpg";
        mode3.src = "assets/mode3.jpg";
        const fileCountBack = backImages.files.length;
        const fileCount = frontImages.files.length;
        if (fileCountBack === 0) {
          mode1.src = "assets/mode1on.jpg";
        } else if (fileCountBack === 1) {
          mode2.src = "assets/mode2on.jpg";
        } else if (fileCountBack === fileCount) {
          mode3.src = "assets/mode3on.jpg";
        } else {
          mode1.src = "assets/mode1error.jpg";
          mode2.src = "assets/mode2error.jpg";
          mode3.src = "assets/mode3error.jpg";
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

    getGridSettings() {
      const settings = {};
      const mmToPt = 2.83464567;

      const ids = [
        'rows', 'columns', 'imageWidth', 'imageHeight', 'bleed',
        'borderWidth', 'crosswidth', 'crosssize', 'cornerRadius',
        'frontCheckbox', 'backCheckbox', 'frontBorderCheckbox', 'backBorderCheckbox'
      ];

      ids.forEach(id => {
        const element = this.elements[id];
        if (element) {
          if (element.type === 'number' || element.tagName.toLowerCase() === 'select') {
            settings[id] = parseFloat(element.value.replace(",", "."));
          } else if (element.type === 'checkbox') {
            settings[id] = element.checked;
          }
        }
      });

      settings.imageWidth *= mmToPt;
      settings.imageHeight *= mmToPt;
      settings.bleed *= mmToPt;
      settings.borderWidth *= mmToPt * 2;
      settings.crosswidth *= mmToPt;
      settings.crosssize = (settings.crosssize * mmToPt) / 2;
      settings.cornerRadius *= mmToPt;

      settings.imageWidth += settings.bleed * 2;
      settings.imageHeight += settings.bleed * 2;

      settings.pageSize = document.querySelector('input[name="pageSize"]:checked').value;

      return settings;
    },

    getFoldableSettings() {
        const settings = {};
        const ids = [
          "foldable_cardWidth", "foldable_cardHeight", "foldable_printerMargin",
          "foldable_foldingMargin", "foldable_cardMargin", "foldable_cutMargin",
          "foldable_innerBorder", "foldable_borderColorFront", "foldable_borderColorBack",
          "foldable_foldLinePreference", "foldable_cornerRadius",
        ];

        ids.forEach((id) => {
          const element = document.getElementById(id);
          if (element) {
            let key = id.replace("foldable_", "");
            if (key === "innerBorder") {
              settings["innerBorderWidth"] = element.value;
              settings["innerBorderHeight"] = element.value;
              return;
            }
            if (element.type === "number" || element.type === "color" || element.tagName.toLowerCase() === "select") {
              settings[key] = element.value;
            } else if (element.type === "checkbox") {
              settings[key] = element.checked;
            }
          }
        });

        settings.pageSize = document.querySelector('input[name="foldable_pageSize"]:checked').value;

        for (const key in settings) {
          if (!isNaN(settings[key]) && typeof settings[key] === "string" && settings[key].trim() !== "") {
            settings[key] = parseFloat(settings[key]);
          }
        }

        return settings;
    },

    getSettings() {
      const isDoubleSided = this.elements.doubleSidedRadio.checked;
      const settings = isDoubleSided ? this.getGridSettings() : this.getFoldableSettings();
      settings.layoutMode = isDoubleSided ? 'doubleSided' : 'foldable';
      return settings;
    },
  };
  window.LayoutToolUI = LayoutToolUI;
  LayoutToolUI.init();
});
