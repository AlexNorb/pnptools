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
      pageOrientation: document.getElementById("pageOrientation"),
      pageWidth: document.getElementById("pageWidth"),
      pageHeight: document.getElementById("pageHeight"),
      autoGrid: document.getElementById("autoGrid"),
      customFileName: document.getElementById("customFileName"),
      prefixPageSize: document.getElementById("prefixPageSize"),
      fileNamePreview: document.getElementById("fileNamePreview"),
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
        A4: { width: 210, height: 297 },
        Letter: { width: 215.9, height: 279.4 },
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
          Toast.show("Please enter a name for the preset.", "error");
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
          Toast.show("You can only delete user-defined presets.", "error");
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
            if (tgt) tgt.value = src.value;
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

      // Dynamic Filename & Settings Summary Listeners
      const fnSync = () => {
        this.ui.updateFileNamePreview();
        this.ui.updateSettingsSummary();
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
            widthInput.value = w;
            heightInput.value = h;
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
        const previewEl = LayoutToolUI.elements.fileNamePreview || document.getElementById("fileNamePreview");
        if (!previewEl) return;

        const isFoldable = LayoutToolUI.elements.foldableRadio?.checked;
        const fallbackName = isFoldable ? "fold" : "grid";

        let baseName = (LayoutToolUI.elements.customFileName?.value || "").trim();
        if (baseName.endsWith(".pdf")) baseName = baseName.slice(0, -4);
        if (!baseName) baseName = fallbackName;

        let prefix = "";
        if (LayoutToolUI.elements.prefixPageSize?.checked) {
          const isFoldable = LayoutToolUI.elements.foldableRadio?.checked;
          const pSize = isFoldable
            ? LayoutToolUI.elements.foldable_pageSize?.value
            : LayoutToolUI.elements.pageSize?.value;

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
            prefix = `${pSize}_`;
          }
        }

        previewEl.textContent = `${prefix}${baseName}.pdf`;
      },

      updateSettingsSummary() {
        const summaryEl = document.getElementById("settingsSummary");
        if (!summaryEl) return;

        const isDoubleSided = LayoutToolUI.elements.doubleSidedRadio && LayoutToolUI.elements.doubleSidedRadio.checked;
        let parts = [];

        const addPart = (iconClass, iconStyle, text) => {
          let styleAttr = iconStyle ? `style="${iconStyle}"` : "";
          parts.push(`<span class="inline-flex items-center gap-1.5 whitespace-nowrap"><i class="${iconClass} text-theme-indigo text-[12px]" ${styleAttr}></i> <span class="tracking-tight">${text}</span></span>`);
        };

        if (isDoubleSided) {
          // 1. Page Size & Orientation
          const pageSize = LayoutToolUI.elements.pageSize ? LayoutToolUI.elements.pageSize.value : "A4";
          const orient = LayoutToolUI.elements.pageOrientation && LayoutToolUI.elements.pageOrientation.value === "landscape" ? "landscape" : "portrait";
          const orientIcon = orient === "landscape" ? "fa-solid fa-file fa-rotate-90" : "fa-solid fa-file";
          const displaySize = pageSize === "Custom" ? `${LayoutToolUI.elements.pageWidth?.value || 0}x${LayoutToolUI.elements.pageHeight?.value || 0}` : pageSize;
          addPart(orientIcon, null, displaySize);

          // 2. Grid Icon: NxN (shows calculated result even if Auto)
          const autoGrid = LayoutToolUI.elements.autoGrid ? LayoutToolUI.elements.autoGrid.checked : true;
          const cols = LayoutToolUI.elements.columns ? LayoutToolUI.elements.columns.value : 3;
          const rows = LayoutToolUI.elements.rows ? LayoutToolUI.elements.rows.value : 3;
          if (autoGrid) {
            addPart("fa-solid fa-table-cells", null, `Auto (${cols}x${rows})`);
          } else {
            addPart("fa-solid fa-table-cells", null, `${cols}x${rows}`);
          }

          // 3. Card Size icon: NxN (+N)
          const cardSize = LayoutToolUI.elements.cardSize ? LayoutToolUI.elements.cardSize.value : "Poker";
          const w = cardSize === "Custom" ? (LayoutToolUI.elements.imageWidth?.value || 63) : (LayoutToolUI.config.cardSizesInMM[cardSize]?.width || 63);
          const h = cardSize === "Custom" ? (LayoutToolUI.elements.imageHeight?.value || 88) : (LayoutToolUI.config.cardSizesInMM[cardSize]?.height || 88);
          const bleed = LayoutToolUI.elements.bleed ? parseFloat(LayoutToolUI.elements.bleed.value || "0") : 0;
          const bleedText = bleed > 0 ? ` (+${bleed})` : "";
          addPart("fa-solid fa-ruler-combined", null, `${w}x${h}${bleedText}`);

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

          // 2. Fold Line Pref
          const foldPref = LayoutToolUI.elements.foldable_foldLinePreference ? LayoutToolUI.elements.foldable_foldLinePreference.value : "auto";
          addPart("fa-solid fa-map", null, foldPref.charAt(0).toUpperCase() + foldPref.slice(1));

          // 3. Card Size icon: NxN (+N)
          const cardSize = LayoutToolUI.elements.foldable_cardSize ? LayoutToolUI.elements.foldable_cardSize.value : "poker";
          const w = cardSize === "Custom" ? (LayoutToolUI.elements.foldable_cardWidth?.value || 63.5) : (LayoutToolUI.config.cardSizesInMM[cardSize]?.width || 63.5);
          const h = cardSize === "Custom" ? (LayoutToolUI.elements.foldable_cardHeight?.value || 88.9) : (LayoutToolUI.config.cardSizesInMM[cardSize]?.height || 88.9);
          const bleed = LayoutToolUI.elements.foldable_cutMargin ? parseFloat(LayoutToolUI.elements.foldable_cutMargin.value || "0") : 0;
          const bleedText = bleed > 0 ? ` (+${bleed})` : "";
          addPart("fa-solid fa-ruler-combined", null, `${w}x${h}${bleedText}`);

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

        summaryEl.innerHTML = parts.join('<span class="mx-2 opacity-30 select-none">|</span>');
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
          el.foldable_cardWidth.value = el.imageWidth.value;
          el.foldable_cardHeight.value = el.imageHeight.value;
        } else if (changedSource === "foldable_cardSize") {
          el.cardSize.value = el.foldable_cardSize.value;
          this.updateCardSizeInputs(el.cardSize, el.imageWidth, el.imageHeight);
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
        if (settings.pageOrientation && this.elements.pageOrientation) {
          this.elements.pageOrientation.value = settings.pageOrientation;
        }
        if (settings.pageSize) {
          let pSize = settings.pageSize;
          if (pSize.includes("Landscape")) {
            if (this.elements.pageOrientation) this.elements.pageOrientation.value = "landscape";
            pSize = pSize.replace(" Landscape", "");
          } else if (pSize.includes("Portrait")) {
            if (this.elements.pageOrientation) this.elements.pageOrientation.value = "portrait";
            pSize = pSize.replace(" Portrait", "");
          }
          this.elements.pageSize.value = pSize;
          this.ui.updatePageSizeInputs(
            this.elements.pageSize,
            this.elements.pageWidth,
            this.elements.pageHeight,
            this.elements.pageOrientation
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
          if (key === "customFileName") continue;
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
          if (key === "customFileName") continue;
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
