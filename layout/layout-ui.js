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
      // Grid Layout
      preset: document.getElementById("preset"),
      presetName: document.getElementById("presetName"),
      savePresetButton: document.getElementById("savePresetButton"),
      deletePresetButton: document.getElementById("deletePresetButton"),
      rows: document.getElementById("rows"),
      columns: document.getElementById("columns"),
      pageSize: document.getElementById("pageSize"),
      pageWidth: document.getElementById("pageWidth"),
      pageHeight: document.getElementById("pageHeight"),
      cardSize: document.getElementById("cardSize"),
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
      foldable_pageSize: document.getElementById("foldable_pageSize"),
      foldable_pageWidth: document.getElementById("foldable_pageWidth"),
      foldable_pageHeight: document.getElementById("foldable_pageHeight"),
      foldable_cardSize: document.getElementById("foldable_cardSize"),
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
      pageSizesInMM: {
        "A4 Portrait": { width: 210, height: 297 },
        "A4 Landscape": { width: 297, height: 210 },
        "Letter Portrait": { width: 215.9, height: 279.4 },
        "Letter Landscape": { width: 279.4, height: 215.9 },
      },
      cardSizesInMM: {
        Poker: { width: 63, height: 88 },
        Bridge: { width: 57, height: 88 },
        Tarot: { width: 70, height: 120 },
      },
    },

    async init() {
      await this.ui.loadPresets.bind(this)();

      const lastUsedSettings = this.storage.load("layoutTool.lastUsedSettings");
      if (lastUsedSettings) {
        if (lastUsedSettings.preset) {
          this.elements.preset.value = lastUsedSettings.preset;
          this.ui.applyPreset.call(this); // Apply the preset first
        }
        this.ui.applySettings.call(this, lastUsedSettings); // Then apply the user's modifications
        this.ui.toggleModeUI();
      }

      this.elements.generatePdfButton.addEventListener("click", () => {
        const settings = this.ui.getRawSettings.call(this);
        this.storage.save("layoutTool.lastUsedSettings", settings);
        window.LayoutToolPDF.generatePDF.bind(window.LayoutToolPDF)();
      });

      this.elements.savePresetButton.addEventListener("click", () => {
        const name = this.elements.presetName.value;
        if (!name) {
          alert("Please enter a name for the preset.");
          return;
        }
        const settings = this.ui.getRawGridSettings();
        this.storage.saveUserPreset(name, settings);
        this.ui.loadPresets(); // Reload presets to include the new one
        this.elements.presetName.value = "";
      });

      this.elements.deletePresetButton.addEventListener("click", () => {
        const presetKey = this.elements.preset.value;
        if (!presetKey.startsWith("user_")) {
          alert("You can only delete user-defined presets.");
          return;
        }
        this.storage.deleteUserPreset(presetKey);
        this.ui.loadPresets(); // Reload presets to remove the deleted one
      });

      this.elements.frontImages.addEventListener("change", async (event) => {
        if (event.target.files && event.target.files.length > 0) {
          await window.PreviewPanel.addFronts(event.target.files);
          window.PreviewPanel.ui.toggleAccordion(true);
        }
        this.ui.updateModeIndicator();
        this.ui.updateFileCount();
      });

      this.elements.backImages.addEventListener("change", async (event) => {
        if (event.target.files && event.target.files.length > 0) {
          await window.PreviewPanel.addBacks(event.target.files);
          window.PreviewPanel.ui.toggleAccordion(true);
        }
        this.ui.updateModeIndicator();
        this.ui.updateFileCount();
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

      this.elements.pageSize.addEventListener("change", () =>
        this.ui.updatePageSizeInputs(
          this.elements.pageSize,
          this.elements.pageWidth,
          this.elements.pageHeight
        )
      );

      this.elements.foldable_pageSize.addEventListener("change", () =>
        this.ui.updatePageSizeInputs(
          this.elements.foldable_pageSize,
          this.elements.foldable_pageWidth,
          this.elements.foldable_pageHeight
        )
      );

      this.elements.cardSize.addEventListener("change", () =>
        this.ui.updateCardSizeInputs(
          this.elements.cardSize,
          this.elements.imageWidth,
          this.elements.imageHeight
        )
      );

      this.elements.foldable_cardSize.addEventListener("change", () =>
        this.ui.updateCardSizeInputs(
          this.elements.foldable_cardSize,
          this.elements.foldable_cardWidth,
          this.elements.foldable_cardHeight
        )
      );
    },

    ui: {
      updatePageSizeInputs(dropdown, widthInput, heightInput) {
        const selectedSize = dropdown.value;
        const customSize = "Custom";

        if (selectedSize === customSize) {
          widthInput.disabled = false;
          heightInput.disabled = false;
        } else {
          const dimensions = LayoutToolUI.config.pageSizesInMM[selectedSize];
          if (dimensions) {
            widthInput.value = dimensions.width;
            heightInput.value = dimensions.height;
          }
          widthInput.disabled = true;
          heightInput.disabled = true;
        }
      },

      updateCardSizeInputs(dropdown, widthInput, heightInput) {
        const selectedSize = dropdown.value;
        const customSize = "Custom";

        if (selectedSize === customSize) {
          widthInput.disabled = false;
          heightInput.disabled = false;
        } else {
          const dimensions = LayoutToolUI.config.cardSizesInMM[selectedSize];
          if (dimensions) {
            widthInput.value = dimensions.width;
            heightInput.value = dimensions.height;
          }
          widthInput.disabled = true;
          heightInput.disabled = true;
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
          // setting to display bar as not full when reaching saving step
          // LayoutToolUI.elements.progressBar.max = 120;
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
          if (element.tagName.toLowerCase() === "select") {
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

        // Handle dropdowns first
        if (settings.pageSize) {
          this.elements.pageSize.value = settings.pageSize;
          this.ui.updatePageSizeInputs(
            this.elements.pageSize,
            this.elements.pageWidth,
            this.elements.pageHeight
          );
        }
        if (settings.cardSize) {
          this.elements.cardSize.value = settings.cardSize;
          this.ui.updateCardSizeInputs(
            this.elements.cardSize,
            this.elements.imageWidth,
            this.elements.imageHeight
          );
        }

        for (const key in settings) {
          const element = LayoutToolUI.elements[key];
          const value = settings[key];

          if (element && key !== "pageSize" && key !== "cardSize") {
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
              if (elementToDisable.tagName.toLowerCase() === "select") {
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

      _gatherFormValues(elementIds) {
        const settings = {};
        elementIds.forEach((id) => {
          const element = LayoutToolUI.elements[id] || document.getElementById(id);
          if (!element) return;
          if (element.type === "checkbox") {
            settings[id] = element.checked;
          } else if (
            element.type === "number" ||
            element.tagName.toLowerCase() === "select"
          ) {
            const val = element.value.replace(",", ".");
            settings[id] = isNaN(val) || val.trim() === "" ? val : parseFloat(val);
          } else {
            settings[id] = element.value;
          }
        });
        return settings;
      },

      getRawSettings() {
        const settings = {};
        settings.preset = this.elements.preset.value;
        for (const key in LayoutToolUI.elements) {
          const element = LayoutToolUI.elements[key];
          if (!element || element.type === "file") continue;
          if (element.type === "checkbox" || element.type === "radio") {
            settings[key] = element.checked;
          } else if (element.id) {
            settings[element.id] = element.value;
          }
        }
        return settings;
      },

      getRawGridSettings() {
        const gridElementIds = [
          "rows",
          "columns",
          "pageSize",
          "pageWidth",
          "pageHeight",
          "cardSize",
          "imageWidth",
          "imageHeight",
          "bleed",
          "borderWidth",
          "crosshaircolor",
          "borderColor",
          "frontCheckbox",
          "backCheckbox",
          "frontBorderCheckbox",
          "backBorderCheckbox",
          "crosswidth",
          "crosssize",
          "cornerRadius",
        ];
        return this._gatherFormValues(gridElementIds);
      },

      applySettings(settings) {
        for (const key in settings) {
          const element = LayoutToolUI.elements[key];
          const value = settings[key];

          if (element) {
            if (element.type === "file") continue;
            if (element.type === "checkbox" || element.type === "radio") {
              element.checked = value;
            } else {
              element.value = value;
            }

            // Special handling for elements that affect others
            if (key === "pageSize") {
              this.ui.updatePageSizeInputs(
                element,
                LayoutToolUI.elements.pageWidth,
                LayoutToolUI.elements.pageHeight
              );
            } else if (key === "foldable_pageSize") {
              this.ui.updatePageSizeInputs(
                element,
                LayoutToolUI.elements.foldable_pageWidth,
                LayoutToolUI.elements.foldable_pageHeight
              );
            }
            if (key === "cardSize") {
              this.ui.updateCardSizeInputs(
                element,
                LayoutToolUI.elements.imageWidth,
                LayoutToolUI.elements.imageHeight
              );
            } else if (key === "foldable_cardSize") {
              this.ui.updateCardSizeInputs(
                element,
                LayoutToolUI.elements.foldable_cardWidth,
                LayoutToolUI.elements.foldable_cardHeight
              );
            }

          }
        }
      },

      async loadPresets() {
        try {
          const response = await fetch("presets.json");
          const defaultPresets = await response.json();
          const userPresets = LayoutToolUI.storage.loadUserPresets() || {};

          const presetSelect = LayoutToolUI.elements.preset;
          presetSelect.innerHTML = ""; // Clear existing options

          // Add a default "Select a preset" option
          const defaultOption = new Option("Select a preset...", "");
          defaultOption.disabled = true;
          defaultOption.selected = true;
          presetSelect.add(defaultOption);

          for (const key in defaultPresets) {
            if (defaultPresets[key].hidden) continue;
            const option = new Option(defaultPresets[key].name, key);
            presetSelect.add(option);
          }

          if (Object.keys(userPresets).length > 0) {
            const divider = new Option("---- Custom Presets ----", "");
            divider.disabled = true;
            presetSelect.add(divider);
          }

          for (const key in userPresets) {
            const option = new Option(userPresets[key].name, key);
            presetSelect.add(option);
          }

          LayoutToolUI.config.presets = { ...defaultPresets, ...userPresets };
        } catch (error) {
          console.error("Failed to load or parse presets:", error);
        }
      },
      updateModeIndicator() {
        const { mode1, mode2, mode3 } = LayoutToolUI.elements;
        if (!mode1 || !mode2 || !mode3) return;

        // Reset all to inactive
        mode1.classList.remove("active", "error");
        mode2.classList.remove("active", "error");
        mode3.classList.remove("active", "error");
        mode1.classList.add("inactive");
        mode2.classList.add("inactive");
        mode3.classList.add("inactive");

        const mode = window.PreviewPanel ? window.PreviewPanel.getMode() : 'no_backs';

        if (mode === 'no_backs' || mode === 'empty') {
          mode1.classList.remove("inactive");
          mode1.classList.add("active");
        } else if (mode === 'same_back') {
          mode2.classList.remove("inactive");
          mode2.classList.add("active");
        } else if (mode === 'unique_backs') {
          mode3.classList.remove("inactive");
          mode3.classList.add("active");
        } else {
          mode1.classList.remove("inactive");
          mode2.classList.remove("inactive");
          mode3.classList.remove("inactive");
          mode1.classList.add("error");
          mode2.classList.add("error");
          mode3.classList.add("error");
        }
      },
      updateFileCount() {
        const frontsCount = window.PreviewPanel ? window.PreviewPanel.state.fronts.length : 0;
        const backsCount = window.PreviewPanel ? window.PreviewPanel.state.backs.length : 0;
        const { fileCount, fileCountBack } = LayoutToolUI.elements;

        if (fileCount) {
          fileCount.textContent = `${frontsCount} file${frontsCount !== 1 ? "s" : ""} selected`;
        }
        if (fileCountBack) {
          fileCountBack.textContent = `${backsCount} file${
            backsCount !== 1
              ? "s selected. Different backs mode."
              : " selected. Same backs mode."
          }`;
        }
      },
    },

    storage: {
      save(key, data) {
        try {
          localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
          console.error(`Error saving to localStorage: ${error}`);
        }
      },

      load(key) {
        try {
          const data = localStorage.getItem(key);
          return data ? JSON.parse(data) : null;
        } catch (error) {
          console.error(`Error loading from localStorage: ${error}`);
          return null;
        }
      },

      saveUserPreset(name, settings) {
        const userPresets = this.loadUserPresets() || {};
        const presetKey = `user_${Date.now()}`;
        userPresets[presetKey] = { name, settings };
        this.save("layoutTool.userPresets", userPresets);
      },

      loadUserPresets() {
        return this.load("layoutTool.userPresets");
      },

      deleteUserPreset(presetKey) {
        const userPresets = this.loadUserPresets() || {};
        delete userPresets[presetKey];
        this.save("layoutTool.userPresets", userPresets);
      },
    },

    getGridSettings() {
      const ids = [
        "rows",
        "columns",
        "pageSize",
        "pageWidth",
        "pageHeight",
        "cardSize",
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
      return this.ui._gatherFormValues(ids);
    },

    getFoldableSettings() {
      const ids = [
        "foldable_pageSize",
        "foldable_pageWidth",
        "foldable_pageHeight",
        "foldable_cardSize",
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

      const raw = this.ui._gatherFormValues(ids);
      const settings = {};

      for (const id in raw) {
        let key = id.replace("foldable_", "");
        if (key === "innerBorder") {
          settings["innerBorderWidth"] = raw[id];
          settings["innerBorderHeight"] = raw[id];
        } else {
          settings[key] = raw[id];
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
