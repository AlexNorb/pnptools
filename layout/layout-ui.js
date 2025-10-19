document.addEventListener("DOMContentLoaded", () => {
  const LayoutToolUI = {
    elements: {
      // Common
      progressContainer: document.getElementById("progressContainer"),
      progressBar: document.getElementById("progressBar"),
      progressStatus: document.getElementById("progressStatus"),

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
      // Previewer
      usePreviewer: document.getElementById("usePreviewer"),
      previewerContainer: document.getElementById("previewerContainer"),
      // Grid Layout
      preset: document.getElementById("preset"),
      rows: document.getElementById("rows"),
      columns: document.getElementById("columns"),
      pageSize: document.getElementById("pageSize"),
      foldable_pageSize: document.getElementById("foldable_pageSize"),
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
      foldable_borderColorFront: document.getElementById(
        "foldable_borderColorFront"
      ),
      foldable_borderColorBack: document.getElementById(
        "foldable_borderColorBack"
      ),
      foldable_foldLinePreference: document.getElementById(
        "foldable_foldLinePreference"
      ),
      foldable_cornerRadius: document.getElementById("foldable_cornerRadius"),
    },

    config: {
      crosshairColor: null,
      borderColor: null,
      presets: {},
    },

    async init() {
      await this.ui.loadPresets.bind(this)();

      this.elements.generatePdfButton.addEventListener(
        "click",
        window.LayoutToolPDF.generatePDF.bind(window.LayoutToolPDF)
      );

      this.elements.frontImages.addEventListener("change", (event) => {
        this.ui.updateModeIndicator();
        this.ui.updateFileCount(
          this.elements.frontImages,
          this.elements.fileCount
        );
        // If previewer is active, append the new files
        if (this.elements.usePreviewer.checked) {
            window.LayoutToolPDF.appendDataToPreviewer(event.target.files, 'fronts');
        }
      });

      this.elements.backImages.addEventListener("change", (event) => {
        this.ui.updateModeIndicator();
        this.ui.updateFileCount(
          this.elements.backImages,
          this.elements.fileCountBack,
          true
        );
        // If previewer is active, append the new files
        if (this.elements.usePreviewer.checked) {
            window.LayoutToolPDF.appendDataToPreviewer(event.target.files, 'backs');
        }
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

      this.elements.doubleSidedRadio.addEventListener(
        "change",
        this.ui.toggleModeUI.bind(this)
      );
      this.elements.foldableRadio.addEventListener(
        "change",
        this.ui.toggleModeUI.bind(this)
      );

      this.elements.usePreviewer.addEventListener("change", this.ui.togglePreviewer.bind(this));
    },

    ui: {
      togglePreviewer() {
          const isChecked = LayoutToolUI.elements.usePreviewer.checked;
          LayoutToolUI.elements.previewerContainer.style.display = isChecked ? "block" : "none";

          if (isChecked) {
              // When showing the previewer for the first time, send all current files
              window.LayoutToolPDF.sendDataToPreviewer();
          }
      },
      toggleModeUI() {
        const isDoubleSided = LayoutToolUI.elements.doubleSidedRadio.checked;
        LayoutToolUI.elements.doubleSidedModeUI.style.display = isDoubleSided
          ? "block"
          : "none";
        LayoutToolUI.elements.foldableModeUI.style.display = isDoubleSided
          ? "none"
          : "block";
      },
      toggleProgressUI(show) {
        LayoutToolUI.elements.progressContainer.style.display = show
          ? "block"
          : "none";
        if (!show) {
          // Reset progress bar on hide
          LayoutToolUI.ui.updateProgress({ progress: 0, done: 0, all: 0 });
          LayoutToolUI.ui.updateStatus("");
        }
      },
      updateProgress(data) {
        const { progress, done, all } = data;
        if (all > 0) {
          LayoutToolUI.elements.progressBar.value = progress;
          LayoutToolUI.elements.progressStatus.textContent = `Processing ${done} / ${all}... (${progress}%)`;
        } else {
          LayoutToolUI.elements.progressBar.value = 0;
          LayoutToolUI.elements.progressStatus.textContent = "";
        }
      },
      updateStatus(statusText) {
        LayoutToolUI.elements.progressStatus.textContent = statusText;
      },
      applyPreset() {
        // First, re-enable all form elements to reset the UI state
        for (const key in LayoutToolUI.elements) {
          const element = LayoutToolUI.elements[key];
          element.disabled = false;
          if (element.tagName.toLowerCase() === 'select') {
            for (const option of element.options) {
              option.disabled = false;
            }
          }
        }

        const selectedPresetKey = LayoutToolUI.elements.preset.value;
        const presetData = LayoutToolUI.config.presets[selectedPresetKey];

        if (!presetData) return;

        const settings = presetData.settings;
        const disabled = presetData.disabled || {};

        for (const key in settings) {
          const element = LayoutToolUI.elements[key];
          const value = settings[key];

          if (element) {
            // Standard element handling
            if (element.type === "checkbox" || element.type === "radio") {
              element.checked = value;
            } else {
              element.value = value;
            }
          }
        }

        // Handle disabling elements
        for (const keyToDisable in disabled) {
          const value = disabled[keyToDisable];
          const elementToDisable = LayoutToolUI.elements[keyToDisable];

          if (elementToDisable) {
            if (value === true) {
              elementToDisable.disabled = true;
            } else if (Array.isArray(value)) {
              if (elementToDisable.tagName.toLowerCase() === 'select') {
                for (const option of elementToDisable.options) {
                  if (value.includes(option.value)) {
                    option.disabled = true;
                  }
                }
              }
            }
          }
        }
      },
      async loadPresets() {
        try {
          const response = await fetch("presets.json");
          const presets = await response.json();
          LayoutToolUI.config.presets = presets;

          const presetSelect = LayoutToolUI.elements.preset;
          presetSelect.innerHTML = ""; // Clear existing options

          // Add a default "Select a preset" option
          const defaultOption = new Option("Select a preset...", "");
          defaultOption.disabled = true;
          defaultOption.selected = true;
          presetSelect.add(defaultOption);

          for (const key in presets) {
            const option = new Option(presets[key].name, key);
            presetSelect.add(option);
          }
        } catch (error) {
          console.error("Failed to load or parse presets.json:", error);
        }
      },
      updateModeIndicator() {
        const { mode1, mode2, mode3, frontImages, backImages } =
          LayoutToolUI.elements;

        // Reset all to inactive
        mode1.classList.remove('active', 'error');
        mode2.classList.remove('active', 'error');
        mode3.classList.remove('active', 'error');
        mode1.classList.add('inactive');
        mode2.classList.add('inactive');
        mode3.classList.add('inactive');

        const fileCountBack = backImages.files.length;
        const fileCount = frontImages.files.length;

        if (fileCountBack === 0) {
          mode1.classList.remove('inactive');
          mode1.classList.add('active');
        } else if (fileCountBack === 1) {
          mode2.classList.remove('inactive');
          mode2.classList.add('active');
        } else if (fileCountBack === fileCount) {
          mode3.classList.remove('inactive');
          mode3.classList.add('active');
        } else {
          mode1.classList.remove('inactive');
          mode2.classList.remove('inactive');
          mode3.classList.remove('inactive');
          mode1.classList.add('error');
          mode2.classList.add('error');
          mode3.classList.add('error');
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
        "rows",
        "columns",
        "imageWidth",
        "imageHeight",
        "bleed",
        "borderWidth",
        "crosswidth",
        "crosssize",
        "cornerRadius",
        "frontCheckbox",
        "backCheckbox",
        "frontBorderCheckbox",
        "backBorderCheckbox",
      ];

      ids.forEach((id) => {
        const element = this.elements[id];
        if (element) {
          if (
            element.type === "number" ||
            element.tagName.toLowerCase() === "select"
          ) {
            settings[id] = parseFloat(element.value.replace(",", "."));
          } else if (element.type === "checkbox") {
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

      settings.pageSize = this.elements.pageSize.value;

      return settings;
    },

    getFoldableSettings() {
      const settings = {};
      const ids = [
        "foldable_cardWidth",
        "foldable_cardHeight",
        "foldable_printerMargin",
        "foldable_foldingMargin",
        "foldable_cardMargin",
        "foldable_cutMargin",
        "foldable_innerBorder",
        "foldable_borderColorFront",
        "foldable_borderColorBack",
        "foldable_foldLinePreference",
        "foldable_cornerRadius",
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
          if (
            element.type === "number" ||
            element.type === "color" ||
            element.tagName.toLowerCase() === "select"
          ) {
            settings[key] = element.value;
          } else if (element.type === "checkbox") {
            settings[key] = element.checked;
          }
        }
      });

      settings.pageSize = document.getElementById("foldable_pageSize").value;

      for (const key in settings) {
        if (
          !isNaN(settings[key]) &&
          typeof settings[key] === "string" &&
          settings[key].trim() !== ""
        ) {
          settings[key] = parseFloat(settings[key]);
        }
      }

      return settings;
    },

    getSettings() {
      const isDoubleSided = this.elements.doubleSidedRadio.checked;
      const settings = isDoubleSided
        ? this.getGridSettings()
        : this.getFoldableSettings();
      settings.layoutMode = isDoubleSided ? "doubleSided" : "foldable";
      return settings;
    },
  };
  window.LayoutToolUI = LayoutToolUI;
  LayoutToolUI.init();
});
