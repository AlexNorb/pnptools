/**
 * PreviewPanel Data Model
 * Single source of truth for image state, copy counts, mode detection, and data compilation.
 */
(function (global) {
  'use strict';

  const PreviewPanel = {
    state: {
      fronts: [], // Array of { dataUrl: string, name: string }
      backs: [],  // Array of { dataUrl: string, name: string }
      copies: []  // Array of numbers (one per front, defaults to 1)
    },

    _listeners: [],

    /**
     * Subscribe to state changes
     * @param {Function} callback 
     * @returns {Function} Unsubscribe function
     */
    onChange(callback) {
      if (typeof callback === 'function') {
        this._listeners.push(callback);
      }
      return () => {
        this._listeners = this._listeners.filter((cb) => cb !== callback);
      };
    },

    /**
     * Internal method to notify all registered listeners
     */
    _notify() {
      for (const callback of this._listeners) {
        try {
          callback(this.state);
        } catch (err) {
          console.error('Error in PreviewPanel onChange listener:', err);
        }
      }
    },

    /**
     * Read a single file/item into a normalized object { dataUrl, name }
     */
    _readSingleItem(item) {
      return new Promise((resolve, reject) => {
        if (!item) {
          return resolve(null);
        }

        // Pre-read object with dataUrl
        if (typeof item === 'object' && item !== null && 'dataUrl' in item) {
          return resolve({
            dataUrl: String(item.dataUrl),
            name: item.name || 'unnamed'
          });
        }

        // Browser File or Blob instance
        if (typeof File !== 'undefined' && (item instanceof File || item instanceof Blob)) {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve({
              dataUrl: e.target.result,
              name: item.name || 'unnamed'
            });
          };
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(item);
          return;
        }

        // String URL or dataUrl
        if (typeof item === 'string') {
          return resolve({
            dataUrl: item,
            name: 'unnamed'
          });
        }

        // Fallback for custom object representation
        resolve({
          dataUrl: String(item),
          name: item.name || 'unnamed'
        });
      });
    },

    /**
     * Normalize FileList / Array of File/Objects / single File input
     */
    async _normalizeFilesInput(files) {
      if (!files) return [];
      let fileList = [];
      if (
        typeof files.length === 'number' &&
        typeof files !== 'string' &&
        !(typeof File !== 'undefined' && files instanceof File)
      ) {
        fileList = Array.from(files);
      } else {
        fileList = [files];
      }
      const results = await Promise.all(fileList.map((item) => this._readSingleItem(item)));
      return results.filter(Boolean);
    },

    /**
     * Add front images (accepts FileList, Array of Files/Objects, single File/Object)
     * @param {*} files 
     * @returns {Promise<Array>} Added items
     */
    async addFronts(files) {
      const items = await this._normalizeFilesInput(files);
      for (const item of items) {
        this.state.fronts.push(item);
        this.state.copies.push(1);
      }
      this._notify();
      return items;
    },

    /**
     * Add back images (accepts FileList, Array of Files/Objects, single File/Object)
     * @param {*} files 
     * @returns {Promise<Array>} Added items
     */
    async addBacks(files) {
      const items = await this._normalizeFilesInput(files);
      for (const item of items) {
        this.state.backs.push(item);
      }
      this._notify();
      return items;
    },

    /**
     * Remove a pair at the given index
     * @param {number} index 
     */
    removePair(index) {
      if (index < 0 || index >= this.state.fronts.length) {
        return;
      }
      this.state.fronts.splice(index, 1);
      this.state.copies.splice(index, 1);

      if (this.state.backs.length > 1) {
        if (index < this.state.backs.length) {
          this.state.backs.splice(index, 1);
        }
      } else if (this.state.backs.length === 1) {
        if (this.state.fronts.length === 0) {
          this.state.backs.splice(0, 1);
        }
      }

      this._notify();
    },

    /**
     * Set copy count for a pair at index. Clamps count to min 1.
     * @param {number} index 
     * @param {number} count 
     */
    setCopies(index, count) {
      let num = parseInt(count, 10);
      if (isNaN(num) || num < 1) {
        num = 1;
      }
      if (index >= 0 && index < this.state.copies.length) {
        this.state.copies[index] = num;
        const el = document.getElementById(`pair-copy-${index}`);
        if (el && parseInt(el.value, 10) !== num) {
          el.value = num;
        }
        this._notify();
      }
    },

    /**
     * Reorder pair from oldIndex to newIndex
     * @param {number} oldIndex 
     * @param {number} newIndex 
     */
    reorder(oldIndex, newIndex) {
      const len = this.state.fronts.length;
      if (
        oldIndex < 0 ||
        oldIndex >= len ||
        newIndex < 0 ||
        newIndex >= len ||
        oldIndex === newIndex
      ) {
        return;
      }

      const [front] = this.state.fronts.splice(oldIndex, 1);
      this.state.fronts.splice(newIndex, 0, front);

      const [copy] = this.state.copies.splice(oldIndex, 1);
      this.state.copies.splice(newIndex, 0, copy);

      if (this.state.backs.length === len && len > 1) {
        const [back] = this.state.backs.splice(oldIndex, 1);
        this.state.backs.splice(newIndex, 0, back);
      } else if (
        this.state.backs.length > 1 &&
        oldIndex < this.state.backs.length &&
        newIndex < this.state.backs.length
      ) {
        const [back] = this.state.backs.splice(oldIndex, 1);
        this.state.backs.splice(newIndex, 0, back);
      }

      this._notify();
    },

    /**
     * Clear all front images and copy counts
     */
    clearFronts() {
      this.state.fronts = [];
      this.state.copies = [];
      this._notify();
    },

    /**
     * Clear all back images
     */
    clearBacks() {
      this.state.backs = [];
      this._notify();
    },

    /**
     * Clear all fronts, backs, and copy counts
     */
    clearAll() {
      this.state.fronts = [];
      this.state.backs = [];
      this.state.copies = [];
      this._notify();
    },

    /**
     * Returns current operational mode: "empty", "no_backs", "same_back", "unique_backs", or "error"
     * @returns {string}
     */
    getMode() {
      const f = this.state.fronts.length;
      const b = this.state.backs.length;

      if (f === 0 && b === 0) return 'empty';
      if (f > 0 && b === 0) return 'no_backs';
      if (f > 0 && b === 1) return 'same_back';
      if (f > 0 && b === f) return 'unique_backs';
      return 'error';
    },

    /**
     * Returns compiled { frontImages: [], backImages: [] } with copies expanded according to mode
     * @returns {{ frontImages: string[], backImages: string[] }}
     */
    getImageData() {
      const mode = this.getMode();
      const frontImages = [];
      const backImages = [];

      if (mode === 'empty') {
        return { frontImages: [], backImages: [] };
      }

      if (mode === 'no_backs') {
        for (let i = 0; i < this.state.fronts.length; i++) {
          const count = this.state.copies[i] || 1;
          const url = this.state.fronts[i].dataUrl;
          for (let c = 0; c < count; c++) {
            frontImages.push(url);
          }
        }
        return { frontImages, backImages: [] };
      }

      if (mode === 'same_back') {
        for (let i = 0; i < this.state.fronts.length; i++) {
          const count = this.state.copies[i] || 1;
          const url = this.state.fronts[i].dataUrl;
          for (let c = 0; c < count; c++) {
            frontImages.push(url);
          }
        }
        if (this.state.backs.length > 0) {
          backImages.push(this.state.backs[0].dataUrl);
        }
        return { frontImages, backImages };
      }

      if (mode === 'unique_backs') {
        for (let i = 0; i < this.state.fronts.length; i++) {
          const count = this.state.copies[i] || 1;
          const frontUrl = this.state.fronts[i].dataUrl;
          const backUrl = this.state.backs[i] ? this.state.backs[i].dataUrl : '';
          for (let c = 0; c < count; c++) {
            frontImages.push(frontUrl);
            backImages.push(backUrl);
          }
        }
        return { frontImages, backImages };
      }

      // mode === 'error' fallback
      for (let i = 0; i < this.state.fronts.length; i++) {
        const count = this.state.copies[i] || 1;
        const frontUrl = this.state.fronts[i].dataUrl;
        const backUrl = this.state.backs[i]
          ? this.state.backs[i].dataUrl
          : (this.state.backs[0] ? this.state.backs[0].dataUrl : '');
        for (let c = 0; c < count; c++) {
          frontImages.push(frontUrl);
          if (backUrl) backImages.push(backUrl);
        }
      }
      return { frontImages, backImages };
    },

    /**
     * UI rendering and interaction methods
     */
    ui: {
      initialized: false,
      sortableInstance: null,

      init() {
        if (this.initialized) return;
        this.initialized = true;

        const toggleBtn = document.getElementById('previewToggle');
        if (toggleBtn) {
          toggleBtn.addEventListener('click', () => this.toggleAccordion());
        }

        const btnClearFronts = document.getElementById('clearFronts');
        if (btnClearFronts) {
          btnClearFronts.addEventListener('click', () => PreviewPanel.clearFronts());
        }

        const btnClearBacks = document.getElementById('clearBacks');
        if (btnClearBacks) {
          btnClearBacks.addEventListener('click', () => PreviewPanel.clearBacks());
        }

        const btnClearAll = document.getElementById('clearAll');
        if (btnClearAll) {
          btnClearAll.addEventListener('click', () => PreviewPanel.clearAll());
        }

        const previewPairs = document.getElementById('previewPairs');
        if (previewPairs) {
          previewPairs.addEventListener('wheel', (e) => {
            if (e.deltaY !== 0) {
              e.preventDefault();
              previewPairs.scrollLeft += e.deltaY;
            }
          }, { passive: false });
        }

        PreviewPanel.onChange(() => this.render());
      },

      toggleAccordion(expand) {
        const panel = document.getElementById('previewPanel');
        const content = document.getElementById('previewContent');
        const icon = document.getElementById('previewToggleIcon');
        if (!panel || !content) return;

        const isCurrentlyCollapsed = panel.classList.contains('collapsed');
        const shouldExpand = typeof expand === 'boolean' ? expand : isCurrentlyCollapsed;

        if (shouldExpand) {
          panel.classList.remove('collapsed');
          content.style.display = 'block';
          if (icon) icon.textContent = '▲';
        } else {
          panel.classList.add('collapsed');
          content.style.display = 'none';
          if (icon) icon.textContent = '▼';
        }
      },

      render() {
        if (window.LayoutToolUI && window.LayoutToolUI.ui) {
          if (typeof window.LayoutToolUI.ui.updateModeIndicators === 'function') {
            window.LayoutToolUI.ui.updateModeIndicators();
          }
          if (typeof window.LayoutToolUI.ui.updateFileCount === 'function') {
            window.LayoutToolUI.ui.updateFileCount();
          }
        }

        const container = document.getElementById('previewPairs');
        if (!container) return;

        const fronts = PreviewPanel.state.fronts;
        const backs = PreviewPanel.state.backs;
        const copies = PreviewPanel.state.copies;
        const mode = PreviewPanel.getMode();

        if (fronts.length === 0 && backs.length === 0) {
          container.innerHTML = '<div class="text-theme-muted italic p-4 font-medium text-sm text-center">No images loaded yet. Upload fronts or backs above to preview.</div>';
          return;
        }

        let html = '';
        const maxLen = Math.max(fronts.length, backs.length);

        for (let i = 0; i < maxLen; i++) {
          const frontObj = fronts[i];
          let backObj = null;

          if (mode === 'same_back') {
            backObj = backs[0];
          } else if (mode === 'unique_backs') {
            backObj = backs[i];
          } else if (mode === 'error') {
            backObj = backs[i] || backs[0] || null;
          }

          const frontSrc = frontObj ? frontObj.dataUrl : '';
          const backSrc = backObj ? backObj.dataUrl : '';
          const copyCount = copies[i] !== undefined ? copies[i] : 1;

          html += `
            <div class="preview-pair border-2 border-theme-dark rounded-xl bg-white w-[145px] shrink-0 flex flex-col gap-2 p-2 relative shadow-[2px_2px_0_var(--color-theme-dark)] transition-transform has-[.pair-handle:hover]:-translate-y-1" data-index="${i}">
              <div class="flex justify-between items-center">
                <span class="pair-handle cursor-grab font-bold bg-theme-yellow border border-theme-dark text-theme-dark px-2 py-0.5 rounded-md text-xs shadow-[1px_1px_0_var(--color-theme-dark)] transition-transform hover:shadow-[2px_2px_0_var(--color-theme-dark)] select-none" tabindex="-1" title="Drag to reorder">
                  <i class="fa-solid fa-grip-vertical text-[10px] mr-1 opacity-70"></i>#${i + 1}
                </span>
                <button type="button" tabindex="-1" onclick="PreviewPanel.removePair(${i})" class="w-6 h-6 rounded-md flex items-center justify-center text-theme-pink hover:bg-theme-pink/15 transition-colors text-xs" title="Delete pair">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </div>
              
              <div class="pair-images flex gap-1 h-[95px] justify-center items-center bg-theme-bg/60 border border-theme-dark/15 rounded-lg p-1 overflow-hidden">
                ${frontSrc ? `<img src="${frontSrc}" class="max-h-full max-w-[48%] object-contain border border-theme-dark rounded shadow-sm bg-white" title="Front" />` : `<div class="w-[48%] h-full flex flex-col items-center justify-center bg-black/5 rounded text-[10px] font-bold text-theme-muted"><i class="fa-regular fa-image text-sm mb-0.5 opacity-40"></i>Front</div>`}
                ${backSrc ? `<img src="${backSrc}" class="max-h-full max-w-[48%] object-contain border border-theme-dark rounded shadow-sm bg-white" title="Back" />` : `<div class="w-[48%] h-full flex flex-col items-center justify-center bg-black/5 rounded text-[10px] font-bold text-theme-muted"><i class="fa-regular fa-image text-sm mb-0.5 opacity-40"></i>Back</div>`}
              </div>

              ${frontObj ? `
                <div class="flex items-center justify-between text-xs pt-0.5">
                  <label for="pair-copy-${i}" class="font-bold text-theme-dark">Copies:</label>
                  <input id="pair-copy-${i}" type="number" value="${copyCount}" min="1" max="99" oninput="PreviewPanel.setCopies(${i}, this.value)" onchange="PreviewPanel.setCopies(${i}, this.value)" class="w-12 text-center py-0.5 px-1 font-bold border-[1.5px] border-theme-dark rounded-md text-xs focus:outline-none" />
                </div>
              ` : ''}
            </div>
          `;
        }

        container.innerHTML = html;
        this.initSortable(container);
      },

      initSortable(container) {
        if (typeof Sortable === 'undefined') return;
        if (this.sortableInstance) {
          this.sortableInstance.destroy();
        }
        this.sortableInstance = new Sortable(container, {
          handle: '.pair-handle',
          animation: 150,
          onEnd: (evt) => {
            if (evt.oldIndex !== undefined && evt.newIndex !== undefined && evt.oldIndex !== evt.newIndex) {
              PreviewPanel.reorder(evt.oldIndex, evt.newIndex);
            }
          }
        });
      }
    }
  };

  // Initialize UI listener on DOMContentLoaded
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
      PreviewPanel.ui.init();
    });
  }

  // Export to global scope
  if (typeof window !== 'undefined') {
    window.PreviewPanel = PreviewPanel;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = PreviewPanel;
  }
})(typeof window !== 'undefined' ? window : this);
