document.addEventListener("DOMContentLoaded", () => {
  const LayoutToolUI = {
    elements: {
      // Common
      progressContainer: document.getElementById("progressContainer"),
      fileNameCard: document.getElementById("fileNameCard"),
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
      globalUnitRadios: document.querySelectorAll('input[name="globalUnit"]'),
      resetSettingsButton: document.getElementById("resetSettings"),
      // Grid Layout
      preset: document.getElementById("preset"),
      savePresetButton: document.getElementById("savePresetButton"),
      editPresetButton: document.getElementById("editPresetButton"),
      deletePresetButton: document.getElementById("deletePresetButton"),
      rows: document.getElementById("rows"),
      columns: document.getElementById("columns"),
      pageSize: document.getElementById("pageSize"),
      pageOrientation: document.getElementById("pageOrientation"),
      pageWidth: document.getElementById("pageWidth"),
      pageHeight: document.getElementById("pageHeight"),
      autoGrid: document.getElementById("autoGrid"),
      customFileName: document.getElementById("customFileName"),
      prefixPageSize: document.getElementById("prefixPageSize"),
      fileNamePreview: document.getElementById("fileNamePreview"),
      cardSize: document.getElementById("cardSize"),
      saveCardSizeButton: document.getElementById("saveCardSizeButton"),
      deleteCardSizeButton: document.getElementById("deleteCardSizeButton"),
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
      foldable_saveCardSizeButton: document.getElementById("foldable_saveCardSizeButton"),
      foldable_deleteCardSizeButton: document.getElementById("foldable_deleteCardSizeButton"),
      foldable_cardWidth: document.getElementById("foldable_cardWidth"),
      foldable_cardHeight: document.getElementById("foldable_cardHeight"),
      foldable_printerMargin: document.getElementById("foldable_printerMargin"),
      foldable_foldingMargin: document.getElementById("foldable_foldingMargin"),
      foldable_cardMargin: document.getElementById("foldable_cardMargin"),
      foldable_cutMargin: document.getElementById("foldable_cutMargin"),
      foldable_innerBorder: document.getElementById("foldable_innerBorder"),
      foldable_frontBorderCheckbox: document.getElementById("foldable_frontBorderCheckbox"),
      foldable_backBorderCheckbox: document.getElementById("foldable_backBorderCheckbox"),
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

    state: {
      rawValuesInMM: {}
    },

    config: {
      currentUnit: "mm",
      crosshairColor: null,
      borderColor: null,
      presets: {},
      pageSizesInMM: {
        A4: { width: 210, height: 297 },
        Letter: { width: 215.9, height: 279.4 },
        "A4 Portrait": { width: 210, height: 297 },
        "A4 Landscape": { width: 297, height: 210 },
        "Letter Portrait": { width: 215.9, height: 279.4 },
        "Letter Landscape": { width: 279.4, height: 215.9 },
      },
      cardSizesInMM: {
        "Poker Standard (MTG)": { width: 63, height: 88 },
        "American Standard (Bridge)": { width: 56, height: 87 },
        "European Standard": { width: 59, height: 92 },
        "Tarot Size": { width: 70, height: 120 },
        "Mini European": { width: 44, height: 68 },
        "Mini American": { width: 41, height: 63 },
        "Square": { width: 60, height: 60 },
      },
    },

    dimensionInputIds: [
      "pageWidth", "pageHeight", "imageWidth", "imageHeight", "bleed", "borderWidth", "crosswidth", "crosssize", "cornerRadius",
      "foldable_pageWidth", "foldable_pageHeight", "foldable_cardWidth", "foldable_cardHeight", 
      "foldable_printerMargin", "foldable_foldingMargin", "foldable_cardMargin", "foldable_cutMargin", 
      "foldable_innerBorder", "foldable_cornerRadius"
    ],

    async init() {
      this.ui.populateCardSizes.bind(this)();
      await this.ui.loadPresets.bind(this)();

      // Track manual user edits in rawValuesInMM
      this.dimensionInputIds.forEach(id => {
        const el = this.elements[id];
        if (el) {
          const handler = (e) => {
            if (!e || !e.isTrusted) return; // Only sync when modified by user input, not programmatically
            const val = parseFloat(el.value.replace(",", "."));
            if (!isNaN(val)) {
              if (this.config.currentUnit === 'in') {
                this.state.rawValuesInMM[id] = val * 25.4;
              } else {
                this.state.rawValuesInMM[id] = val;
              }
            } else {
              delete this.state.rawValuesInMM[id];
            }
          };
          el.addEventListener("input", handler);
          el.addEventListener("change", handler);
        }
      });

      const lastUsedSettings = this.storage.load("layoutTool.lastUsedSettings");
      if (lastUsedSettings) {
        if (lastUsedSettings.currentUnit && lastUsedSettings.currentUnit === 'in') {
          this.config.currentUnit = 'in';
          const radioIn = Array.from(this.elements.globalUnitRadios).find(r => r.value === 'in');
          if (radioIn) radioIn.checked = true;
        }
        
        if (lastUsedSettings.preset) {
          this.elements.preset.value = lastUsedSettings.preset;
          this.ui.applyPreset.call(this); // Apply the preset first
        } else {
          this.elements.preset.value = "";
        }
        this.ui.applySettings.call(this, lastUsedSettings); // Then apply the user's modifications
        this.ui.updateCardSizeInputs(this.elements.cardSize, this.elements.imageWidth, this.elements.imageHeight);
        this.ui.updateCardSizeInputs(this.elements.foldable_cardSize, this.elements.foldable_cardWidth, this.elements.foldable_cardHeight);
        this.ui.applyUnitConversion();
        this.ui.toggleModeUI();
      } else {
        this.elements.preset.value = "";
        this.ui.updateCardSizeInputs(this.elements.cardSize, this.elements.imageWidth, this.elements.imageHeight);
        this.ui.updateCardSizeInputs(this.elements.foldable_cardSize, this.elements.foldable_cardWidth, this.elements.foldable_cardHeight);
      }

      this.elements.globalUnitRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
          if (e.target.checked && this.config.currentUnit !== e.target.value) {
            this.config.currentUnit = e.target.value;
            this.ui.applyUnitConversion();
            this.ui.updateSettingsSummary();
          }
        });
      });

      if (this.elements.resetSettingsButton) {
        this.elements.resetSettingsButton.addEventListener("click", () => {
          this.ui.resetAllSettings.call(this);
        });
      }

      this.elements.generatePdfButton.addEventListener("click", () => {
        const settings = this.ui.getRawSettings.call(this);
        this.storage.save("layoutTool.lastUsedSettings", settings);
        window.LayoutToolPDF.generatePDF.bind(window.LayoutToolPDF)();
      });

      const updatePresetButtonsVisibility = () => {
        const presetKey = this.elements.preset.value;
        const isUserPreset = presetKey.startsWith("user_");
        if (this.elements.editPresetButton) {
          this.elements.editPresetButton.style.display = isUserPreset ? "inline-flex" : "none";
        }
      };

      this.elements.preset.addEventListener("change", () => {
        updatePresetButtonsVisibility();
      });

      this.elements.savePresetButton.addEventListener("click", () => {
        const onSave = (name, disabledLocks) => {
          const cleanName = (name || "").trim().slice(0, 25);
          if (!cleanName) return;

          const settings = this.ui.getRawAllSettings();
          settings.disabled = disabledLocks || {};

          console.log("=== PRESET JSON EXPORT ===");
          console.log(JSON.stringify({
            name: cleanName,
            settings: settings
          }, null, 2));

          const newKey = this.storage.saveUserPreset(cleanName, settings);
          this.ui.loadPresets();
          if (newKey) {
            this.elements.preset.value = newKey;
            this.ui.applyPreset();
            updatePresetButtonsVisibility();
          }
        };

        if (window.Toast && typeof window.Toast.presetCustomModal === "function") {
          window.Toast.presetCustomModal({ title: "Save Custom Preset", onSubmit: onSave });
        } else if (window.Toast && typeof window.Toast.prompt === "function") {
          window.Toast.prompt("Enter a name for this preset:", (name) => onSave(name, {}), "Save Preset");
        } else {
          const name = prompt("Enter a name for this preset:");
          onSave(name, {});
        }
      });

      if (this.elements.editPresetButton) {
        this.elements.editPresetButton.addEventListener("click", () => {
          const presetKey = this.elements.preset.value;
          if (!presetKey.startsWith("user_")) return;

          const userPresets = this.storage.loadUserPresets() || {};
          const currentPreset = userPresets[presetKey];
          if (!currentPreset) return;

          const onEditSave = (name, disabledLocks) => {
            const cleanName = (name || "").trim().slice(0, 25);
            if (!cleanName) return;

            const settings = this.ui.getRawAllSettings();
            settings.disabled = disabledLocks || {};
            currentPreset.name = cleanName;
            currentPreset.settings = settings;

            userPresets[presetKey] = currentPreset;
            this.storage.save("layoutTool.userPresets", userPresets);
            this.config.presets[presetKey] = currentPreset;

            this.ui.loadPresets();
            this.elements.preset.value = presetKey;
            this.ui.applyPreset();
            updatePresetButtonsVisibility();
            Toast.show("Preset updated successfully.", "success");
          };

          if (window.Toast && typeof window.Toast.presetCustomModal === "function") {
            window.Toast.presetCustomModal({
              title: "Edit Custom Preset",
              defaultName: currentPreset.name,
              disabled: currentPreset.settings.disabled || {},
              onSubmit: onEditSave
            });
          }
        });
      }

      this.elements.deletePresetButton.addEventListener("click", () => {
        const presetKey = this.elements.preset.value;
        if (!presetKey.startsWith("user_")) {
          Toast.show("You can only delete user-defined presets.", "error");
          return;
        }
        this.storage.deleteUserPreset(presetKey);
        this.ui.loadPresets(); // Reload presets to remove the deleted one
        updatePresetButtonsVisibility();
      });

      const handleSaveCardSize = (isFoldable) => {
        const widthEl = isFoldable ? this.elements.foldable_cardWidth : this.elements.imageWidth;
        const heightEl = isFoldable ? this.elements.foldable_cardHeight : this.elements.imageHeight;
        
        const wVal = parseFloat(widthEl.value);
        const hVal = parseFloat(heightEl.value);
        const isInch = LayoutToolUI.config.currentUnit === "in";
        
        const w_mm = isInch ? wVal * 25.4 : wVal;
        const h_mm = isInch ? hVal * 25.4 : hVal;

        const onSave = (name) => {
          const cleanName = (name || "").trim().slice(0, 25);
          if (!cleanName) return;

          const key = this.storage.saveUserCardSize(cleanName, w_mm, h_mm);
          this.ui.populateCardSizes();
          
          // Select the newly created size
          if (isFoldable) {
            this.elements.foldable_cardSize.value = key;
            this.elements.foldable_cardSize.dispatchEvent(new Event("change"));
          } else {
            this.elements.cardSize.value = key;
            this.elements.cardSize.dispatchEvent(new Event("change"));
          }
        };

        if (window.Toast && typeof window.Toast.prompt === 'function') {
          window.Toast.prompt("Enter a name for this custom card size:", onSave, "Save Card Size");
        } else {
          const name = prompt("Enter a name for the custom card size:");
          onSave(name);
        }
      };

      const handleDeleteCardSize = (isFoldable) => {
        const selectEl = isFoldable ? this.elements.foldable_cardSize : this.elements.cardSize;
        const key = selectEl.value;
        if (!key.startsWith("userSize_")) {
          Toast.show("You can only delete user-defined card sizes.", "error");
          return;
        }
        this.storage.deleteUserCardSize(key);
        this.ui.populateCardSizes();
      };

      if (this.elements.saveCardSizeButton) {
        this.elements.saveCardSizeButton.addEventListener("click", () => handleSaveCardSize(false));
      }
      if (this.elements.deleteCardSizeButton) {
        this.elements.deleteCardSizeButton.addEventListener("click", () => handleDeleteCardSize(false));
      }
      if (this.elements.foldable_saveCardSizeButton) {
        this.elements.foldable_saveCardSizeButton.addEventListener("click", () => handleSaveCardSize(true));
      }
      if (this.elements.foldable_deleteCardSizeButton) {
        this.elements.foldable_deleteCardSizeButton.addEventListener("click", () => handleDeleteCardSize(true));
      }

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
      if (this.elements.customFileName) {
        this.elements.customFileName.addEventListener("input", (e) => {
          if (e.target.value.trim()) {
            e.target.dataset.userCustomized = "true";
          } else {
            delete e.target.dataset.userCustomized;
            this.ui.updateFileNamePreview();
          }
        });
      }

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

      this.elements.pageSize.addEventListener("change", () => {
        this.ui.updatePageSizeInputs(
          this.elements.pageSize,
          this.elements.pageWidth,
          this.elements.pageHeight,
          this.elements.pageOrientation
        );
        this.ui.syncSharedSettings("pageSize");
      });

      if (this.elements.pageOrientation) {
        this.elements.pageOrientation.addEventListener("change", () => {
          this.ui.updatePageSizeInputs(
            this.elements.pageSize,
            this.elements.pageWidth,
            this.elements.pageHeight,
            this.elements.pageOrientation
          );
        });
      }

      if (this.elements.autoGrid) {
        this.elements.autoGrid.addEventListener("change", () => {
          this.ui.updateGridAutoCalc();
        });
      }

      if (this.elements.foldable_pageSize) {
        this.elements.foldable_pageSize.addEventListener("change", () => {
          this.ui.updatePageSizeInputs(
            this.elements.foldable_pageSize,
            this.elements.foldable_pageWidth,
            this.elements.foldable_pageHeight,
            null
          );
          this.ui.syncSharedSettings("foldable_pageSize");
        });
      }

      this.elements.cardSize.addEventListener("change", () => {
        this.ui.updateCardSizeInputs(
          this.elements.cardSize,
          this.elements.imageWidth,
          this.elements.imageHeight
        );
        this.ui.syncSharedSettings("cardSize");
        this.ui.updateGridAutoCalc();
      });

      this.elements.foldable_cardSize.addEventListener("change", () => {
        this.ui.updateCardSizeInputs(
          this.elements.foldable_cardSize,
          this.elements.foldable_cardWidth,
          this.elements.foldable_cardHeight
        );
        this.ui.syncSharedSettings("foldable_cardSize");
      });

      // Listen to number input changes for custom page sizes, card sizes, and bleed
      const addSyncListener = (sourceId, targetId, isAutoCalc = false) => {
        const src = this.elements[sourceId];
        const tgt = this.elements[targetId];
        if (src) {
          src.addEventListener("input", () => {
            if (tgt) {
              tgt.value = src.value;
              if (this.state.rawValuesInMM[sourceId] !== undefined) {
                this.state.rawValuesInMM[targetId] = this.state.rawValuesInMM[sourceId];
              } else {
                delete this.state.rawValuesInMM[targetId];
              }
            }
            if (isAutoCalc) this.ui.updateGridAutoCalc();
          });
        }
      };

      addSyncListener("pageWidth", "foldable_pageWidth", true);
      addSyncListener("pageHeight", "foldable_pageHeight", true);
      addSyncListener("foldable_pageWidth", "pageWidth", true);
      addSyncListener("foldable_pageHeight", "pageHeight", true);

      addSyncListener("imageWidth", "foldable_cardWidth", true);
      addSyncListener("imageHeight", "foldable_cardHeight", true);
      addSyncListener("foldable_cardWidth", "imageWidth", true);
      addSyncListener("foldable_cardHeight", "imageHeight", true);

      addSyncListener("bleed", "foldable_cutMargin", true);
      addSyncListener("foldable_cutMargin", "bleed", true);

      addSyncListener("borderWidth", "foldable_innerBorder");
      addSyncListener("foldable_innerBorder", "borderWidth");

      if (this.elements.frontBorderCheckbox && this.elements.foldable_frontBorderCheckbox) {
        this.elements.frontBorderCheckbox.addEventListener("change", () => {
          this.elements.foldable_frontBorderCheckbox.checked = this.elements.frontBorderCheckbox.checked;
        });
        this.elements.foldable_frontBorderCheckbox.addEventListener("change", () => {
          this.elements.frontBorderCheckbox.checked = this.elements.foldable_frontBorderCheckbox.checked;
        });
      }

      if (this.elements.backBorderCheckbox && this.elements.foldable_backBorderCheckbox) {
        this.elements.backBorderCheckbox.addEventListener("change", () => {
          this.elements.foldable_backBorderCheckbox.checked = this.elements.backBorderCheckbox.checked;
        });
        this.elements.foldable_backBorderCheckbox.addEventListener("change", () => {
          this.elements.backBorderCheckbox.checked = this.elements.backBorderCheckbox.checked;
        });
      }

      if (this.elements.cornerRadius && this.elements.foldable_cornerRadius) {
        this.elements.cornerRadius.addEventListener("change", () => {
          if (this.elements.foldable_cornerRadius.value !== this.elements.cornerRadius.value) {
            this.elements.foldable_cornerRadius.value = this.elements.cornerRadius.value;
            this.elements.foldable_cornerRadius.dispatchEvent(new Event("change"));
          }
        });
        this.elements.foldable_cornerRadius.addEventListener("change", () => {
          if (this.elements.cornerRadius.value !== this.elements.foldable_cornerRadius.value) {
            this.elements.cornerRadius.value = this.elements.foldable_cornerRadius.value;
            this.elements.cornerRadius.dispatchEvent(new Event("change"));
          }
        });
      }

      if (this.elements.borderColor && this.elements.foldable_borderColorFront && this.elements.foldable_borderColorBack) {
        this.elements.borderColor.addEventListener("input", () => {
          this.elements.foldable_borderColorFront.value = this.elements.borderColor.value;
          this.elements.foldable_borderColorBack.value = this.elements.borderColor.value;
        });
        this.elements.foldable_borderColorFront.addEventListener("input", () => {
          this.elements.borderColor.value = this.elements.foldable_borderColorFront.value;
        });
      }

      // Page Size & Orientation segmented button sync
      const bindPageSegmented = (btnClass, elementId, isOrient = false) => {
        const el = document.getElementById(elementId);
        if (!el) return;
        const sync = () => {
          const val = String(el.value || (isOrient ? "portrait" : "A4"));
          document.querySelectorAll("." + btnClass).forEach((btn) => {
            const isMatch = String(btn.dataset.val) === val;
            let activeCls = "font-bold px-2.5 h-full rounded-[10px] text-sm transition-all bg-theme-yellow border-[1.5px] border-theme-dark flex items-center justify-center";
            let inactiveCls = "font-bold px-2.5 h-full rounded-[10px] text-sm transition-all text-theme-muted hover:bg-black/5 flex items-center justify-center border-[1.5px] border-transparent";
            btn.className = btnClass + " " + (isMatch ? activeCls : inactiveCls);
          });
        };

        document.querySelectorAll("." + btnClass).forEach((btn) => {
          btn.addEventListener("click", () => {
            el.value = btn.dataset.val;
            el.dispatchEvent(new Event("change"));
          });
        });

        el.addEventListener("change", sync);
        sync();
      };

      bindPageSegmented("btn-page-size", "pageSize", false);
      bindPageSegmented("btn-fold-page-size", "foldable_pageSize", false);
      bindPageSegmented("btn-page-orient", "pageOrientation", true);
      bindPageSegmented("btn-fold-pref", "foldable_foldLinePreference", false);

      const bindCheckboxSegmented = (btnClass, checkboxId) => {
        const el = document.getElementById(checkboxId);
        if (!el) return;
        const sync = () => {
          const isChecked = !!el.checked;
          document.querySelectorAll("." + btnClass).forEach((btn) => {
            const isMatch = (btn.dataset.val === "true") === isChecked;
            let activeCls = "font-bold px-2.5 h-full rounded-[10px] text-sm transition-all bg-theme-yellow border-[1.5px] border-theme-dark flex items-center justify-center";
            let inactiveCls = "font-bold px-2.5 h-full rounded-[10px] text-sm transition-all text-theme-muted hover:bg-black/5 flex items-center justify-center border-[1.5px] border-transparent";
            btn.className = btnClass + " " + (isMatch ? activeCls : inactiveCls);
          });
        };

        document.querySelectorAll("." + btnClass).forEach((btn) => {
          btn.addEventListener("click", () => {
            const val = btn.dataset.val === "true";
            if (el.checked !== val) {
              el.checked = val;
              el.dispatchEvent(new Event("change"));
            }
          });
        });

        el.addEventListener("change", sync);
        sync();
      };

      bindCheckboxSegmented("btn-auto-grid", "autoGrid");

      // Corner radius segmented button sync & dynamic label readout
      const bindRadiusSegmented = (btnClass, elementId, valSpanId) => {
        const el = document.getElementById(elementId);
        const valSpan = document.getElementById(valSpanId);
        if (!el) return;
        const sync = () => {
          const val = String(el.value || "0");
          if (valSpan) {
            valSpan.textContent = `(${val}mm)`;
          }
          document.querySelectorAll("." + btnClass).forEach((btn) => {
            if (String(btn.dataset.val) === val) {
              btn.className = btnClass + " font-bold px-2 h-full rounded-[10px] text-sm transition-all bg-theme-yellow border-[1.5px] border-theme-dark flex items-center";
            } else {
              btn.className = btnClass + " font-bold px-2 h-full rounded-[10px] text-sm transition-all text-theme-muted hover:bg-black/5 flex items-center border-[1.5px] border-transparent";
            }
          });
        };
        document.querySelectorAll("." + btnClass).forEach((btn) => {
          btn.addEventListener("click", () => {
            el.value = btn.dataset.val;
            el.dispatchEvent(new Event("change"));
          });
        });
        el.addEventListener("change", sync);
        sync();
      };

      bindRadiusSegmented("btn-radius", "cornerRadius", "cornerRadiusVal");
      bindRadiusSegmented("btn-fold-radius", "foldable_cornerRadius", "foldable_cornerRadiusVal");

      // Collapsible Settings section handler
      const toggleSettingsBtn = document.getElementById("toggleSettingsCollapse");
      const settingsContent = document.getElementById("settingsContent");
      const settingsCollapseIcon = document.getElementById("settingsCollapseIcon");
      const settingsCollapseText = document.getElementById("settingsCollapseText");

      if (toggleSettingsBtn && settingsContent) {
        toggleSettingsBtn.addEventListener("click", () => {
          const isCollapsed = settingsContent.classList.toggle("collapsed");
          if (settingsCollapseIcon) {
            settingsCollapseIcon.style.transform = isCollapsed ? "rotate(180deg)" : "rotate(0deg)";
          }
          if (settingsCollapseText) {
            settingsCollapseText.textContent = isCollapsed ? "Show" : "Hide";
          }
        });
      }

      // Dynamic Filename, Settings Summary & Live Sheet Preview Listeners
      const fnSync = () => {
        this.ui.updateFileNamePreview();
        this.ui.updateSettingsSummary();
        if (window.SheetPreview) {
          window.SheetPreview.requestUpdate();
        }
      };

      document.querySelectorAll("input, select").forEach((input) => {
        input.addEventListener("input", fnSync);
        input.addEventListener("change", fnSync);
      });

      this.ui.updateFileNamePreview();
      this.ui.updateGridAutoCalc();
      this.ui.updateSettingsSummary();
    },

    ui: {
      resetAllSettings() {
        const doReset = () => {
          // Clear stored settings & raw state
          LayoutToolUI.state.rawValuesInMM = {};
          try {
            localStorage.removeItem("layoutTool.lastUsedSettings");
          } catch (e) {}

          // Reset inputs & rawValuesInMM to clean defaults (all in mm)
          const setDimension = (id, valMM) => {
            LayoutToolUI.state.rawValuesInMM[id] = valMM;
            const el = LayoutToolUI.elements[id];
            if (el) el.value = LayoutToolUI.ui.convertValueToDisplay(valMM);
          };

          setDimension("pageWidth", 210);
          setDimension("pageHeight", 297);
          setDimension("foldable_pageWidth", 210);
          setDimension("foldable_pageHeight", 297);

          setDimension("imageWidth", 63);
          setDimension("imageHeight", 88);
          setDimension("foldable_cardWidth", 63);
          setDimension("foldable_cardHeight", 88);

          setDimension("bleed", 0);
          setDimension("foldable_cutMargin", 0);

          setDimension("borderWidth", 0);
          setDimension("foldable_innerBorder", 0);

          setDimension("crosswidth", 0.1);
          setDimension("crosssize", 3);

          setDimension("cornerRadius", 0);
          setDimension("foldable_cornerRadius", 0);

          setDimension("foldable_printerMargin", 5);
          setDimension("foldable_foldingMargin", 0);
          setDimension("foldable_cardMargin", 0);

          if (LayoutToolUI.elements.frontCheckbox) LayoutToolUI.elements.frontCheckbox.checked = true;
          if (LayoutToolUI.elements.backCheckbox) LayoutToolUI.elements.backCheckbox.checked = false;
          if (LayoutToolUI.elements.frontBorderCheckbox) LayoutToolUI.elements.frontBorderCheckbox.checked = false;
          if (LayoutToolUI.elements.backBorderCheckbox) LayoutToolUI.elements.backBorderCheckbox.checked = false;
          if (LayoutToolUI.elements.borderColor) LayoutToolUI.elements.borderColor.value = "#000000";

          // Disable custom width/height inputs when size preset is applied or re-enable if Custom
          if (LayoutToolUI.elements.imageWidth) LayoutToolUI.elements.imageWidth.disabled = false;
          if (LayoutToolUI.elements.imageHeight) LayoutToolUI.elements.imageHeight.disabled = false;
          if (LayoutToolUI.elements.foldable_cardWidth) LayoutToolUI.elements.foldable_cardWidth.disabled = false;
          if (LayoutToolUI.elements.foldable_cardHeight) LayoutToolUI.elements.foldable_cardHeight.disabled = false;

          // Re-apply active unit step formatting
          LayoutToolUI.ui.applyUnitConversion();

          // Dispatch change events across all setting elements to force segmented buttons & toggles to re-sync
          document.querySelectorAll("input, select").forEach(input => {
            input.dispatchEvent(new Event("change"));
          });

          LayoutToolUI.ui.updateGridAutoCalc();
          LayoutToolUI.ui.updateSettingsSummary();
          if (window.Toast) {
            Toast.show("Settings reset to default.", "info");
          }
        };

        if (window.Toast && typeof window.Toast.confirm === 'function') {
          window.Toast.confirm("Are you sure you want to reset all settings to their default values?", doReset, "Reset Settings");
        } else if (confirm("Are you sure you want to reset all settings to their default values?")) {
          doReset();
        }
      },

      applyUnitConversion() {
        const isInch = LayoutToolUI.config.currentUnit === 'in';
        const newStep = isInch ? "0.05" : "1";
        
        LayoutToolUI.dimensionInputIds.forEach(id => {
          const el = LayoutToolUI.elements[id];
          if (el) {
            // First initialize rawValuesInMM if not present
            if (LayoutToolUI.state.rawValuesInMM[id] === undefined && el.value !== "") {
              const currentVal = parseFloat(el.value.replace(",", "."));
              if (!isNaN(currentVal)) {
                // When applyUnitConversion runs, currentUnit has JUST been flipped to the new unit.
                // So if isInch is now true, the previous unit was mm (el.value is in mm).
                // If isInch is now false, the previous unit was inches (el.value is in inches, multiply by 25.4).
                LayoutToolUI.state.rawValuesInMM[id] = isInch ? currentVal : (currentVal * 25.4);
              }
            }

            const rawMM = LayoutToolUI.state.rawValuesInMM[id];
            if (rawMM !== undefined && !isNaN(rawMM)) {
              el.value = this.convertValueToDisplay(rawMM);
            }
            if (el.hasAttribute("step") || el.type === "number") {
              el.setAttribute("step", newStep);
            }
          }
        });
        
        if (this.populateCardSizes) this.populateCardSizes();
      },

      convertValueToDisplay(valMM) {
        if (typeof valMM !== 'number' && isNaN(parseFloat(valMM))) return valMM;
        const num = parseFloat(valMM);
        if (num === 0) return 0;
        if (LayoutToolUI.config.currentUnit === 'in') {
          const roundedIn = Math.round((num / 25.4) * 20) / 20;
          // Prevent non-zero positive values (like 0.1mm = 0.0039in) from rounding down to 0
          if (roundedIn === 0 && num > 0) {
            return 0.01;
          }
          return parseFloat(roundedIn.toFixed(2));
        }
        return parseFloat(num.toFixed(1));
      },

      updatePageSizeInputs(dropdown, widthInput, heightInput, orientationSelect) {
        const selectedSize = dropdown.value;
        const customSize = "Custom";
        const isLandscape = orientationSelect && orientationSelect.value === "landscape";

        if (selectedSize === customSize) {
          widthInput.disabled = false;
          heightInput.disabled = false;
        } else {
          const dimensions = LayoutToolUI.config.pageSizesInMM[selectedSize];
          if (dimensions) {
            let w = dimensions.width;
            let h = dimensions.height;
            if (isLandscape && !selectedSize.includes("Landscape") && !selectedSize.includes("Portrait")) {
              const temp = w;
              w = h;
              h = temp;
            }
            if (widthInput.id) LayoutToolUI.state.rawValuesInMM[widthInput.id] = w;
            if (heightInput.id) LayoutToolUI.state.rawValuesInMM[heightInput.id] = h;
            widthInput.value = this.convertValueToDisplay(w);
            heightInput.value = this.convertValueToDisplay(h);
          }
          widthInput.disabled = true;
          heightInput.disabled = true;
        }
        if (dropdown.id === "pageSize") {
          this.updateGridAutoCalc();
        }
        this.updateFileNamePreview();
      },

      updateFileNamePreview() {
        const customInput = LayoutToolUI.elements.customFileName || document.getElementById("customFileName");
        if (!customInput) return;

        const isFoldable = LayoutToolUI.elements.foldableRadio?.checked;
        const pSize = isFoldable
          ? LayoutToolUI.elements.foldable_pageSize?.value
          : LayoutToolUI.elements.pageSize?.value;

        let prefix = "";
        if (pSize === "Custom") {
          const widthVal = isFoldable
            ? LayoutToolUI.elements.foldable_pageWidth?.value
            : LayoutToolUI.elements.pageWidth?.value;
          const heightVal = isFoldable
            ? LayoutToolUI.elements.foldable_pageHeight?.value
            : LayoutToolUI.elements.pageHeight?.value;
          const w = Math.round(parseFloat(widthVal) || 0);
          const h = Math.round(parseFloat(heightVal) || 0);
          prefix = `${w}x${h}_`;
        } else {
          prefix = `${pSize || "A4"}_`;
        }

        const fallbackName = isFoldable ? "fold" : "grid";

        if (!customInput.dataset.userCustomized || !customInput.value.trim()) {
          customInput.value = `${prefix}${fallbackName}.pdf`;
        }
      },

      updateSettingsSummary() {
        const summaryEl = document.getElementById("settingsSummary");
        if (!summaryEl) return;

        const isDoubleSided = LayoutToolUI.elements.doubleSidedRadio && LayoutToolUI.elements.doubleSidedRadio.checked;
        let parts = [];

        const addPart = (iconClass, iconStyle, text) => {
          let styleAttr = iconStyle ? `style="${iconStyle}"` : "";
          parts.push(`<span class="inline-flex items-center gap-1.5 mr-3.5 whitespace-nowrap"><i class="${iconClass} text-theme-indigo text-[12px]" ${styleAttr}></i> <span class="tracking-tight">${text}</span></span>`);
        };

        if (isDoubleSided) {
          // 1. Page Size & Orientation
          const pageSize = LayoutToolUI.elements.pageSize ? LayoutToolUI.elements.pageSize.value : "A4";
          const orient = LayoutToolUI.elements.pageOrientation && LayoutToolUI.elements.pageOrientation.value === "landscape" ? "landscape" : "portrait";
          const orientIcon = orient === "landscape" ? "fa-solid fa-file fa-rotate-90" : "fa-solid fa-file";
          const displaySize = pageSize === "Custom" ? `${LayoutToolUI.elements.pageWidth?.value || 0}x${LayoutToolUI.elements.pageHeight?.value || 0}` : pageSize;
          addPart(orientIcon, null, displaySize);

          // 2. Card Size icon: NxN (+N)
          const cardSize = LayoutToolUI.elements.cardSize ? LayoutToolUI.elements.cardSize.value : "Custom";
          const dims = this.getCardSizeDimensions(cardSize);
          const w = cardSize === "Custom" ? (LayoutToolUI.elements.imageWidth?.value || 63) : (dims?.width || 63);
          const h = cardSize === "Custom" ? (LayoutToolUI.elements.imageHeight?.value || 88) : (dims?.height || 88);
          const bleed = LayoutToolUI.elements.bleed ? parseFloat(LayoutToolUI.elements.bleed.value || "0") : 0;
          const bleedText = bleed > 0 ? ` (+${bleed})` : "";
          addPart("fa-solid fa-ruler-combined", null, `${w}x${h}${bleedText}`);

          // 3. Grid Icon: NxN (shows calculated result even if Auto)
          const autoGrid = LayoutToolUI.elements.autoGrid ? LayoutToolUI.elements.autoGrid.checked : true;
          const cols = LayoutToolUI.elements.columns ? LayoutToolUI.elements.columns.value : 3;
          const rows = LayoutToolUI.elements.rows ? LayoutToolUI.elements.rows.value : 3;
          if (autoGrid) {
            addPart("fa-solid fa-table-cells", null, `Auto (${cols}x${rows})`);
          } else {
            addPart("fa-solid fa-table-cells", null, `${cols}x${rows}`);
          }

          // 4. Crosshair icon: F/B, width, size
          const crossFront = LayoutToolUI.elements.frontCheckbox?.checked;
          const crossBack = LayoutToolUI.elements.backCheckbox?.checked;
          if (crossFront || crossBack) {
            const fb = (crossFront && crossBack) ? "F/B" : (crossFront ? "F" : "B");
            const cw = LayoutToolUI.elements.crosswidth?.value || 0.1;
            const cs = LayoutToolUI.elements.crosssize?.value || 3;
            const color = LayoutToolUI.elements.crosshaircolor?.value || "#000000";
            addPart("fa-solid fa-crosshairs", `color: ${color} !important; -webkit-text-stroke: 0.5px var(--color-theme-dark);`, `${fb}, ${cw}w, ${cs}s`);
          }

          // 5. Borders icon: F/B, width, radius
          const borderFront = LayoutToolUI.elements.frontBorderCheckbox?.checked;
          const borderBack = LayoutToolUI.elements.backBorderCheckbox?.checked;
          const radius = LayoutToolUI.elements.cornerRadius ? parseFloat(LayoutToolUI.elements.cornerRadius.value || "0") : 0;
          const innerW = LayoutToolUI.elements.borderWidth ? parseFloat(LayoutToolUI.elements.borderWidth.value || "0") : 0;
          if (borderFront || borderBack || innerW > 0 || radius > 0) {
            const fb = (borderFront && borderBack) ? "F/B" : (borderFront ? "F" : (borderBack ? "B" : "Off"));
            const color = LayoutToolUI.elements.borderColor?.value || "#ffffff";
            addPart("fa-solid fa-border-all", `color: ${color} !important; -webkit-text-stroke: 0.5px var(--color-theme-dark);`, `${fb}, ${innerW}w, ${radius}r`);
          }

        } else {
          // One Sided (Foldable)
          // 1. Page Size
          const pageSize = LayoutToolUI.elements.foldable_pageSize ? LayoutToolUI.elements.foldable_pageSize.value : "A4";
          const displaySize = pageSize === "Custom" ? `${LayoutToolUI.elements.foldable_pageWidth?.value || 0}x${LayoutToolUI.elements.foldable_pageHeight?.value || 0}` : pageSize;
          addPart("fa-solid fa-file", null, displaySize);

          // 2. Card Size icon: NxN (+N)
          const cardSize = LayoutToolUI.elements.foldable_cardSize ? LayoutToolUI.elements.foldable_cardSize.value : "Custom";
          const dims = this.getCardSizeDimensions(cardSize);
          const w = cardSize === "Custom" ? (LayoutToolUI.elements.foldable_cardWidth?.value || 63.5) : (dims?.width || 63.5);
          const h = cardSize === "Custom" ? (LayoutToolUI.elements.foldable_cardHeight?.value || 88.9) : (dims?.height || 88.9);
          const bleed = LayoutToolUI.elements.foldable_cutMargin ? parseFloat(LayoutToolUI.elements.foldable_cutMargin.value || "0") : 0;
          const bleedText = bleed > 0 ? ` (+${bleed})` : "";
          addPart("fa-solid fa-ruler-combined", null, `${w}x${h}${bleedText}`);

          // 3. Fold Line Pref
          const foldPref = LayoutToolUI.elements.foldable_foldLinePreference ? LayoutToolUI.elements.foldable_foldLinePreference.value : "auto";
          addPart("fa-solid fa-map", null, foldPref.charAt(0).toUpperCase() + foldPref.slice(1));

          // 4. Fold marks
          const foldLine = LayoutToolUI.elements.foldable_foldLine?.checked;
          const cutLine = LayoutToolUI.elements.foldable_cutLine?.checked;
          if (foldLine || cutLine) {
            let lines = [];
            if(foldLine) lines.push("Fold");
            if(cutLine) lines.push("Cut");
            addPart("fa-solid fa-crosshairs", null, lines.join(","));
          }

          // 5. Borders icon: F/B, width, radius
          const radius = LayoutToolUI.elements.foldable_cornerRadius ? parseFloat(LayoutToolUI.elements.foldable_cornerRadius.value || "0") : 0;
          const innerW = LayoutToolUI.elements.foldable_innerBorder ? parseFloat(LayoutToolUI.elements.foldable_innerBorder.value || "0") : 0;
          if (innerW > 0 || radius > 0) {
            const fColor = LayoutToolUI.elements.foldable_borderColorFront?.value || "#000000";
            const bColor = LayoutToolUI.elements.foldable_borderColorBack?.value || "#000000";
            addPart("fa-solid fa-border-all", `background: linear-gradient(90deg, ${fColor} 50%, ${bColor} 50%); -webkit-background-clip: text; color: transparent; -webkit-text-stroke: 0.5px var(--color-theme-dark);`, `${innerW}w, ${radius}r`);
          }
        }

        summaryEl.innerHTML = parts.join('');
      },

      updateGridAutoCalc() {
        const { autoGrid, rows, columns, pageWidth, pageHeight, imageWidth, imageHeight, bleed } = LayoutToolUI.elements;
        if (!autoGrid || !rows || !columns) return;

        if (autoGrid.checked) {
          rows.disabled = true;
          columns.disabled = true;

          const pW = parseFloat(pageWidth.value) || 210;
          const pH = parseFloat(pageHeight.value) || 297;
          const cW = parseFloat(imageWidth.value) || 63;
          const cH = parseFloat(imageHeight.value) || 88;
          const b = parseFloat(bleed.value) || 0;

          const totalCardW = cW + b * 2;
          const totalCardH = cH + b * 2;

          if (totalCardW > 0 && totalCardH > 0) {
            columns.value = Math.max(1, Math.floor(pW / totalCardW));
            rows.value = Math.max(1, Math.floor(pH / totalCardH));
          }
        } else {
          rows.disabled = false;
          columns.disabled = false;
        }
      },

      syncSharedSettings(changedSource) {
        const el = LayoutToolUI.elements;
        if (changedSource === "pageSize") {
          let baseSize = el.pageSize.value;
          if (["A4", "Letter", "Custom"].includes(baseSize)) {
            let sizeChanged = el.foldable_pageSize.value !== baseSize;
            if (sizeChanged) {
              el.foldable_pageSize.value = baseSize;
            }
            this.updatePageSizeInputs(el.foldable_pageSize, el.foldable_pageWidth, el.foldable_pageHeight, null);
            el.foldable_pageWidth.value = el.pageWidth.value;
            el.foldable_pageHeight.value = el.pageHeight.value;
            if (sizeChanged) {
              el.foldable_pageSize.dispatchEvent(new Event("change"));
            }
          }
        } else if (changedSource === "foldable_pageSize") {
          let baseSize = el.foldable_pageSize.value.split(" ")[0]; // "A4"
          if (["A4", "Letter", "Custom"].includes(baseSize)) {
            let sizeChanged = el.pageSize.value !== baseSize;
            if (sizeChanged) {
              el.pageSize.value = baseSize;
            }
            this.updatePageSizeInputs(el.pageSize, el.pageWidth, el.pageHeight, el.pageOrientation);
            el.pageWidth.value = el.foldable_pageWidth.value;
            el.pageHeight.value = el.foldable_pageHeight.value;
            if (sizeChanged) {
              el.pageSize.dispatchEvent(new Event("change"));
            }
          }
        } else if (changedSource === "cardSize") {
          el.foldable_cardSize.value = el.cardSize.value;
          this.updateCardSizeInputs(el.foldable_cardSize, el.foldable_cardWidth, el.foldable_cardHeight);
          if (LayoutToolUI.state.rawValuesInMM.imageWidth !== undefined) {
            LayoutToolUI.state.rawValuesInMM.foldable_cardWidth = LayoutToolUI.state.rawValuesInMM.imageWidth;
          }
          if (LayoutToolUI.state.rawValuesInMM.imageHeight !== undefined) {
            LayoutToolUI.state.rawValuesInMM.foldable_cardHeight = LayoutToolUI.state.rawValuesInMM.imageHeight;
          }
          el.foldable_cardWidth.value = el.imageWidth.value;
          el.foldable_cardHeight.value = el.imageHeight.value;
        } else if (changedSource === "foldable_cardSize") {
          el.cardSize.value = el.foldable_cardSize.value;
          this.updateCardSizeInputs(el.cardSize, el.imageWidth, el.imageHeight);
          if (LayoutToolUI.state.rawValuesInMM.foldable_cardWidth !== undefined) {
            LayoutToolUI.state.rawValuesInMM.imageWidth = LayoutToolUI.state.rawValuesInMM.foldable_cardWidth;
          }
          if (LayoutToolUI.state.rawValuesInMM.foldable_cardHeight !== undefined) {
            LayoutToolUI.state.rawValuesInMM.imageHeight = LayoutToolUI.state.rawValuesInMM.foldable_cardHeight;
          }
          el.imageWidth.value = el.foldable_cardWidth.value;
          el.imageHeight.value = el.foldable_cardHeight.value;
          this.updateGridAutoCalc();
        } else if (changedSource === "borders") {
          if (el.borderWidth && el.foldable_innerBorder) {
            el.foldable_innerBorder.value = el.borderWidth.value;
          }
          if (el.cornerRadius && el.foldable_cornerRadius) {
            if (el.foldable_cornerRadius.value !== el.cornerRadius.value) {
              el.foldable_cornerRadius.value = el.cornerRadius.value;
              el.foldable_cornerRadius.dispatchEvent(new Event("change"));
            }
          }
          if (el.borderColor && el.foldable_borderColorFront && el.foldable_borderColorBack) {
            el.foldable_borderColorFront.value = el.borderColor.value;
            el.foldable_borderColorBack.value = el.borderColor.value;
          }
        } else if (changedSource === "foldable_borders") {
          if (el.borderWidth && el.foldable_innerBorder) {
            el.borderWidth.value = el.foldable_innerBorder.value;
          }
          if (el.cornerRadius && el.foldable_cornerRadius) {
            if (el.cornerRadius.value !== el.foldable_cornerRadius.value) {
              el.cornerRadius.value = el.foldable_cornerRadius.value;
              el.cornerRadius.dispatchEvent(new Event("change"));
            }
          }
          if (el.borderColor && el.foldable_borderColorFront) {
            el.borderColor.value = el.foldable_borderColorFront.value;
          }
        }
      },

      getCardSizeDimensions(sizeKey) {
        if (sizeKey === "Custom") return null;
        const defaults = LayoutToolUI.config.cardSizesInMM;
        if (defaults[sizeKey]) return defaults[sizeKey];
        const userSizes = LayoutToolUI.storage.loadUserCardSizes() || {};
        return userSizes[sizeKey] || null;
      },

      updateCardSizeInputs(dropdown, widthInput, heightInput) {
        const selectedSize = dropdown.value;
        const customSize = "Custom";
        const isFoldable = dropdown.id === "foldable_cardSize";

        const saveBtn = isFoldable ? LayoutToolUI.elements.foldable_saveCardSizeButton : LayoutToolUI.elements.saveCardSizeButton;
        const deleteBtn = isFoldable ? LayoutToolUI.elements.foldable_deleteCardSizeButton : LayoutToolUI.elements.deleteCardSizeButton;

        const isUserSize = selectedSize.startsWith("userSize_");
        const isDropdownDisabled = !!dropdown.disabled;

        if (selectedSize === customSize) {
          widthInput.disabled = isDropdownDisabled;
          heightInput.disabled = isDropdownDisabled;
        } else {
          const dimensions = this.getCardSizeDimensions(selectedSize);
          if (dimensions) {
            if (widthInput.id) LayoutToolUI.state.rawValuesInMM[widthInput.id] = dimensions.width;
            if (heightInput.id) LayoutToolUI.state.rawValuesInMM[heightInput.id] = dimensions.height;
            widthInput.value = this.convertValueToDisplay(dimensions.width);
            heightInput.value = this.convertValueToDisplay(dimensions.height);
          }
          widthInput.disabled = true;
          heightInput.disabled = true;
        }

        if (saveBtn) {
          saveBtn.disabled = isDropdownDisabled || selectedSize !== customSize;
        }
        if (deleteBtn) {
          deleteBtn.disabled = isDropdownDisabled || !isUserSize;
        }
      },

      toggleModeUI() {
        const uiObj = this.ui || this;
        const isDoubleSided = LayoutToolUI.elements.doubleSidedRadio.checked;
        LayoutToolUI.elements.doubleSidedModeUI.style.display = isDoubleSided
          ? "block"
          : "none";
        LayoutToolUI.elements.foldableModeUI.style.display = isDoubleSided
          ? "none"
          : "block";

        const el = LayoutToolUI.elements;
        if (el.customFileName) {
          el.customFileName.placeholder = isDoubleSided ? "grid" : "fold";
        }

        if (isDoubleSided) {
          if (uiObj.syncSharedSettings) uiObj.syncSharedSettings("foldable_pageSize");
          if (uiObj.syncSharedSettings) uiObj.syncSharedSettings("foldable_cardSize");
          if (uiObj.syncSharedSettings) uiObj.syncSharedSettings("foldable_borders");
          if (el.foldable_cutMargin && el.bleed) {
            el.bleed.value = el.foldable_cutMargin.value;
          }
          if (uiObj.updateGridAutoCalc) uiObj.updateGridAutoCalc();
        } else {
          if (uiObj.syncSharedSettings) uiObj.syncSharedSettings("pageSize");
          if (uiObj.syncSharedSettings) uiObj.syncSharedSettings("cardSize");
          if (uiObj.syncSharedSettings) uiObj.syncSharedSettings("borders");
          if (el.bleed && el.foldable_cutMargin) {
            el.foldable_cutMargin.value = el.bleed.value;
          }
        }
        if (uiObj.updateFileNamePreview) uiObj.updateFileNamePreview();
        if (uiObj.updateSettingsSummary) uiObj.updateSettingsSummary();
      },
      toggleProgressUI(show) {
        if (LayoutToolUI.elements.progressContainer) {
          LayoutToolUI.elements.progressContainer.style.display = show
            ? "flex"
            : "none";
        }
        if (LayoutToolUI.elements.fileNameCard) {
          LayoutToolUI.elements.fileNameCard.style.display = show
            ? "none"
            : "flex";
        }
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
        // First, re-enable all form elements & segmented buttons to reset the UI state
        for (const key in LayoutToolUI.elements) {
          const element = LayoutToolUI.elements[key];
          if (!element || element instanceof NodeList || !element.tagName) continue;
          element.disabled = false;
          if (element.tagName.toLowerCase() === "select") {
            for (const option of element.options) {
              option.disabled = false;
            }
          }
        }
        document.querySelectorAll(".btn-mode-toggle, .btn-page-size, .btn-fold-page-size, .btn-page-orient, .btn-auto-grid, .btn-radius, .btn-fold-radius, .btn-fold-pref").forEach(btn => {
          btn.disabled = false;
          btn.classList.remove("opacity-50", "pointer-events-none");
        });

        const selectedPresetKey = LayoutToolUI.elements.preset.value;
        const presetData = LayoutToolUI.config.presets[selectedPresetKey];

        if (!presetData) return;

        const settings = presetData.settings;
        const disabled = presetData.disabled || settings.disabled || {};

        if (settings._version === 2) {
          // --- V2 preset: full cross-mode ---
          if (settings.layoutMode === "foldable") {
            if (LayoutToolUI.elements.foldableRadio) LayoutToolUI.elements.foldableRadio.checked = true;
          } else {
            if (LayoutToolUI.elements.doubleSidedRadio) LayoutToolUI.elements.doubleSidedRadio.checked = true;
          }
          if (LayoutToolUI.elements.doubleSidedRadio) {
            LayoutToolUI.elements.doubleSidedRadio.dispatchEvent(new Event("change"));
          }

          const uiHelper = (this.ui || LayoutToolUI.ui);
          if (settings.grid) {
            uiHelper.applySettings.call(LayoutToolUI, settings.grid);
          }
          if (settings.foldable) {
            uiHelper.applySettings.call(LayoutToolUI, settings.foldable);
          }
          const pageOrientEl = this.elements ? this.elements.pageOrientation : LayoutToolUI.elements.pageOrientation;
          const pageSizeEl = this.elements ? this.elements.pageSize : LayoutToolUI.elements.pageSize;
          if (settings.pageOrientation && pageOrientEl) {
            pageOrientEl.value = settings.pageOrientation;
            if (pageSizeEl) {
              uiHelper.updatePageSizeInputs(
                pageSizeEl,
                LayoutToolUI.elements.pageWidth,
                LayoutToolUI.elements.pageHeight,
                pageOrientEl
              );
            }
          }
        } else {
          // --- V1 preset: legacy grid-only ---
          const els = this.elements || LayoutToolUI.elements;
          const uiHelper = (this.ui || LayoutToolUI.ui || this);
          if (settings.pageOrientation && els.pageOrientation) {
            els.pageOrientation.value = settings.pageOrientation;
          }
          if (settings.pageSize) {
            let pSize = settings.pageSize;
            if (pSize.includes("Landscape")) {
              if (els.pageOrientation) els.pageOrientation.value = "landscape";
              pSize = pSize.replace(" Landscape", "");
            } else if (pSize.includes("Portrait")) {
              if (els.pageOrientation) els.pageOrientation.value = "portrait";
              pSize = pSize.replace(" Portrait", "");
            }
            els.pageSize.value = pSize;
            uiHelper.updatePageSizeInputs(
              els.pageSize,
              els.pageWidth,
              els.pageHeight,
              els.pageOrientation
            );
          }
          if (settings.cardSize) {
            els.cardSize.value = settings.cardSize;
            uiHelper.updateCardSizeInputs(
              els.cardSize,
              els.imageWidth,
              els.imageHeight
            );
            if (settings.cardSize !== "Custom") {
              const dims = uiHelper.getCardSizeDimensions(settings.cardSize);
              if (dims) {
                LayoutToolUI.state.rawValuesInMM.imageWidth = dims.width;
                LayoutToolUI.state.rawValuesInMM.imageHeight = dims.height;
                LayoutToolUI.state.rawValuesInMM.foldable_cardWidth = dims.width;
                LayoutToolUI.state.rawValuesInMM.foldable_cardHeight = dims.height;
              }
            }
          }

          for (const key in settings) {
            const element = LayoutToolUI.elements[key];
            let value = settings[key];

            if (element && key !== "pageSize" && key !== "cardSize") {
              const dimensionIds = new Set(LayoutToolUI.dimensionInputIds);
              
              if (dimensionIds.has(key) && typeof value === 'number') {
                // Preset values are in mm
                LayoutToolUI.state.rawValuesInMM[key] = value;
                value = LayoutToolUI.ui.convertValueToDisplay(value);
              }

              // Standard element handling
              if (element.type === "checkbox" || element.type === "radio") {
                element.checked = value;
              } else {
                element.value = value;
              }
            }
          }
        }

        // Handle disabling elements based on individual keys or category locks
        const categoryMap = {
          layoutMode: ["doubleSided", "foldable"],
          pageSize: ["pageSize", "foldable_pageSize", "pageOrientation", "pageWidth", "pageHeight", "foldable_pageWidth", "foldable_pageHeight"],
          cardSize: ["cardSize", "foldable_cardSize", "imageWidth", "imageHeight", "foldable_cardWidth", "foldable_cardHeight"],
          gridSize: ["rows", "columns", "autoGrid"],
          crosshair: ["crosswidth", "crosssize", "crosshaircolor", "frontCheckbox", "backCheckbox"],
          borders: ["borderWidth", "borderColor", "frontBorderCheckbox", "backBorderCheckbox", "cornerRadius", "bleed", "foldable_innerBorder", "foldable_borderColorFront", "foldable_borderColorBack", "foldable_frontBorderCheckbox", "foldable_backBorderCheckbox", "foldable_cornerRadius", "foldable_cutMargin"],
          foldPreference: ["foldable_printerMargin", "foldable_foldingMargin", "foldable_cardMargin", "foldable_foldLinePreference"]
        };

        const keysToDisable = new Set();

        for (const keyToDisable in disabled) {
          const value = disabled[keyToDisable];
          if (value === true) {
            if (categoryMap[keyToDisable]) {
              categoryMap[keyToDisable].forEach(k => keysToDisable.add(k));
            } else {
              keysToDisable.add(keyToDisable);
            }
          }
        }

        // Map elements to their segmented control button classes for visual disabling
        const buttonClassMap = {
          doubleSided: "btn-mode-toggle",
          foldable: "btn-mode-toggle",
          pageSize: "btn-page-size",
          foldable_pageSize: "btn-fold-page-size",
          pageOrientation: "btn-page-orient",
          autoGrid: "btn-auto-grid",
          cornerRadius: "btn-radius",
          foldable_cornerRadius: "btn-fold-radius",
          foldable_foldLinePreference: "btn-fold-pref"
        };

        keysToDisable.forEach(key => {
          const el = LayoutToolUI.elements[key];
          if (el) {
            el.disabled = true;
          }
          if (key === "doubleSided" || key === "foldable" || key === "layoutMode") {
            if (LayoutToolUI.elements.doubleSidedRadio) LayoutToolUI.elements.doubleSidedRadio.disabled = true;
            if (LayoutToolUI.elements.foldableRadio) LayoutToolUI.elements.foldableRadio.disabled = true;
          }
          const btnClass = buttonClassMap[key];
          if (btnClass) {
            document.querySelectorAll("." + btnClass).forEach(btn => {
              btn.disabled = true;
              btn.classList.add("opacity-50", "pointer-events-none");
            });
          }
        });

        // Re-sync card size save/delete button disabling states
        const uiObj = this.ui || this;
        uiObj.updateCardSizeInputs(LayoutToolUI.elements.cardSize, LayoutToolUI.elements.imageWidth, LayoutToolUI.elements.imageHeight);
        uiObj.updateCardSizeInputs(LayoutToolUI.elements.foldable_cardSize, LayoutToolUI.elements.foldable_cardWidth, LayoutToolUI.elements.foldable_cardHeight);

        if (uiObj.updateFileNamePreview) uiObj.updateFileNamePreview();
        if (uiObj.updateSettingsSummary) uiObj.updateSettingsSummary();
      },

      _gatherFormValues(elementIds) {
        const settings = {};
        const isInch = LayoutToolUI.config.currentUnit === 'in';
        const dimensionIds = new Set(LayoutToolUI.dimensionInputIds);

        elementIds.forEach((id) => {
          const element = LayoutToolUI.elements[id] || document.getElementById(id);
          if (!element) return;
          if (element.type === "checkbox") {
            settings[id] = element.checked;
          } else if (
            element.type === "number" ||
            element.tagName.toLowerCase() === "select" ||
            dimensionIds.has(id)
          ) {
            if (dimensionIds.has(id)) {
              if (LayoutToolUI.state.rawValuesInMM[id] !== undefined) {
                settings[id] = parseFloat(LayoutToolUI.state.rawValuesInMM[id].toFixed(2));
                return;
              }
            }
            const val = element.value.replace(",", ".");
            let parsed = isNaN(val) || val.trim() === "" ? val : parseFloat(val);
            if (isInch && dimensionIds.has(id) && typeof parsed === 'number') {
               parsed = parseFloat((parsed * 25.4).toFixed(2));
            }
            settings[id] = parsed;
          } else {
            settings[id] = element.value;
          }
        });
        return settings;
      },

      getRawSettings() {
        const isInch = LayoutToolUI.config.currentUnit === 'in';
        const dimensionIds = new Set(LayoutToolUI.dimensionInputIds);
        const settings = {};
        settings.preset = this.elements.preset.value;
        settings.currentUnit = LayoutToolUI.config.currentUnit;

        for (const key in LayoutToolUI.elements) {
          if (key === "customFileName" || key === "globalUnitRadios") continue;
          const element = LayoutToolUI.elements[key];
          if (!element || element.type === "file" || element instanceof NodeList) continue;
          
          if (element.type === "checkbox" || element.type === "radio") {
            settings[key] = element.checked;
          } else if (element.id) {
            if (dimensionIds.has(element.id) && LayoutToolUI.state.rawValuesInMM[element.id] !== undefined) {
              settings[element.id] = parseFloat(LayoutToolUI.state.rawValuesInMM[element.id].toFixed(2));
              continue;
            }
            let val = element.value;
            if (element.type === "number" || dimensionIds.has(element.id)) {
                val = val.replace(",", ".");
                let parsed = isNaN(val) || val.trim() === "" ? val : parseFloat(val);
                if (isInch && dimensionIds.has(key) && typeof parsed === 'number') {
                    parsed = parseFloat((parsed * 25.4).toFixed(2));
                }
                settings[element.id] = parsed;
            } else {
                settings[element.id] = val;
            }
          }
        }
        return settings;
      },

      getRawGridSettings() {
        const gridElementIds = [
          "autoGrid",
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

      getRawAllSettings() {
        const gridSettings = this.getRawGridSettings();
        const foldableElementIds = [
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
          "foldable_frontBorderCheckbox",
          "foldable_backBorderCheckbox",
          "foldable_borderColorFront",
          "foldable_borderColorBack",
          "foldable_foldLinePreference",
          "foldable_cornerRadius",
        ];
        const foldableSettings = this._gatherFormValues(foldableElementIds);

        return {
          _version: 2,
          layoutMode: LayoutToolUI.elements.doubleSidedRadio.checked ? "doubleSided" : "foldable",
          pageOrientation: LayoutToolUI.elements.pageOrientation ? LayoutToolUI.elements.pageOrientation.value : "portrait",
          grid: gridSettings,
          foldable: foldableSettings,
        };
      },

      applySettings(settings) {
        if (!settings) return;
        const dimensionIds = new Set([
          "pageWidth", "pageHeight", "imageWidth", "imageHeight", "bleed", "borderWidth", "crosswidth", "crosssize", "cornerRadius",
          "foldable_pageWidth", "foldable_pageHeight", "foldable_cardWidth", "foldable_cardHeight", 
          "foldable_printerMargin", "foldable_foldingMargin", "foldable_cardMargin", "foldable_cutMargin", 
          "foldable_innerBorder", "foldable_cornerRadius"
        ]);

        for (const key in settings) {
          if (key === "customFileName" || key === "_version" || key === "layoutMode" || key === "pageOrientation") continue;
          const element = LayoutToolUI.elements[key];
          let value = settings[key];

          if (element) {
            if (element.type === "file") continue;

            if (dimensionIds.has(key) && typeof value === 'number') {
              LayoutToolUI.state.rawValuesInMM[key] = value;
              if (LayoutToolUI.config.currentUnit === 'in') {
                value = parseFloat((value / 25.4).toFixed(2));
              } else {
                value = parseFloat(value.toFixed(1));
              }
            }

            if (element.type === "checkbox" || element.type === "radio") {
              if (element.checked !== value) {
                element.checked = value;
                element.dispatchEvent(new Event("change"));
              }
            } else {
              element.value = value;
            }

            // Special handling for elements that affect others
            const uiHelper = (this.ui || LayoutToolUI.ui);
            if (key === "pageSize") {
              uiHelper.updatePageSizeInputs(
                element,
                LayoutToolUI.elements.pageWidth,
                LayoutToolUI.elements.pageHeight
              );
            } else if (key === "foldable_pageSize") {
              uiHelper.updatePageSizeInputs(
                element,
                LayoutToolUI.elements.foldable_pageWidth,
                LayoutToolUI.elements.foldable_pageHeight
              );
            }
            if (key === "cardSize") {
              const uiHelper = (this.ui || LayoutToolUI.ui);
              uiHelper.updateCardSizeInputs(
                element,
                LayoutToolUI.elements.imageWidth,
                LayoutToolUI.elements.imageHeight
              );
            } else if (key === "foldable_cardSize") {
              const uiHelper = (this.ui || LayoutToolUI.ui);
              uiHelper.updateCardSizeInputs(
                element,
                LayoutToolUI.elements.foldable_cardWidth,
                LayoutToolUI.elements.foldable_cardHeight
              );
            }

          }
        }
        const uiObj = this.ui || this;
        if (uiObj.updateFileNamePreview) uiObj.updateFileNamePreview();
        if (uiObj.updateSettingsSummary) uiObj.updateSettingsSummary();
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
          defaultOption.selected = true;
          presetSelect.add(defaultOption);

          for (const key in defaultPresets) {
            if (defaultPresets[key].hidden) continue;
            const option = new Option(defaultPresets[key].name, key);
            presetSelect.add(option);
          }

          if (Object.keys(userPresets).length > 0) {
            const divider = new Option("---- User Presets ----", "");
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

      populateCardSizes() {
        const defaultSizes = LayoutToolUI.config.cardSizesInMM;
        const userSizes = LayoutToolUI.storage.loadUserCardSizes() || {};
        const unit = LayoutToolUI.config.currentUnit || "mm";

        const buildOptions = () => {
          const options = [];
          
          const custom = new Option("Custom", "Custom");
          custom.style.fontWeight = "bold";
          options.push(custom);

          for (const key in defaultSizes) {
            const size = defaultSizes[key];
            const wDisplay = LayoutToolUI.ui.convertValueToDisplay(size.width);
            const hDisplay = LayoutToolUI.ui.convertValueToDisplay(size.height);
            const option = new Option(`${key} (${wDisplay}x${hDisplay}${unit})`, key);
            options.push(option);
          }
          
          if (Object.keys(userSizes).length > 0) {
            const divider = new Option("--- User Sizes ---", "");
            divider.disabled = true;
            options.push(divider);
            
            for (const key in userSizes) {
              const size = userSizes[key];
              const wDisplay = LayoutToolUI.ui.convertValueToDisplay(size.width);
              const hDisplay = LayoutToolUI.ui.convertValueToDisplay(size.height);
              let cleanName = size.name.replace(/\s*\([\d.]+x[\d.]+(mm|in)\)$/, '');
              const option = new Option(`${cleanName} (${wDisplay}x${hDisplay}${unit})`, key);
              options.push(option);
            }
          }
          
          return options;
        };

        const cardSizeSelect = LayoutToolUI.elements.cardSize;
        const foldableCardSizeSelect = LayoutToolUI.elements.foldable_cardSize;

        const currentVal = cardSizeSelect.value;
        const currentFoldVal = foldableCardSizeSelect.value;

        cardSizeSelect.innerHTML = "";
        foldableCardSizeSelect.innerHTML = "";

        const opts1 = buildOptions();
        opts1.forEach(opt => cardSizeSelect.add(opt));
        
        const opts2 = buildOptions();
        opts2.forEach(opt => foldableCardSizeSelect.add(opt));

        // Restore values if possible
        if (Array.from(cardSizeSelect.options).some(o => o.value === currentVal)) {
          cardSizeSelect.value = currentVal;
        } else {
          cardSizeSelect.value = "Custom";
        }

        if (Array.from(foldableCardSizeSelect.options).some(o => o.value === currentFoldVal)) {
          foldableCardSizeSelect.value = currentFoldVal;
        } else {
          foldableCardSizeSelect.value = "Custom";
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
          fileCountBack.textContent = `${backsCount} file${backsCount !== 1 ? "s" : ""} selected`;
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
        return presetKey;
      },

      loadUserPresets() {
        return this.load("layoutTool.userPresets");
      },

      deleteUserPreset(presetKey) {
        const userPresets = this.loadUserPresets() || {};
        delete userPresets[presetKey];
        this.save("layoutTool.userPresets", userPresets);
      },

      loadUserCardSizes() {
        return this.load("layoutTool.userCardSizes");
      },

      saveUserCardSize(name, width, height) {
        const userSizes = this.loadUserCardSizes() || {};
        const key = `userSize_${Date.now()}`;
        userSizes[key] = {
          name: name,
          width: parseFloat(width),
          height: parseFloat(height)
        };
        this.save("layoutTool.userCardSizes", userSizes);
        return key;
      },

      deleteUserCardSize(key) {
        const userSizes = this.loadUserCardSizes() || {};
        delete userSizes[key];
        this.save("layoutTool.userCardSizes", userSizes);
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
        "foldable_frontBorderCheckbox",
        "foldable_backBorderCheckbox",
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
