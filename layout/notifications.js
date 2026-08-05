class NotificationSystem {
  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'toast-container';
    this.container.className = 'fixed bottom-4 right-4 z-50 flex flex-col gap-2';
    document.body.appendChild(this.container);
  }

  show(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    
    // Base styles
    toast.className = 'px-4 py-3 rounded-xl border-3 border-theme-dark shadow-[4px_4px_0_var(--color-theme-dark)] transition-all duration-300 transform translate-y-10 opacity-0 font-ui font-medium';
    
    // Type specific styles
    if (type === 'success') {
      toast.classList.add('bg-theme-teal', 'text-theme-dark');
    } else if (type === 'error') {
      toast.classList.add('bg-theme-pink', 'text-theme-dark');
    } else {
      toast.classList.add('bg-theme-indigo', 'text-white');
    }

    toast.textContent = message;
    
    this.container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-10', 'opacity-0');
      toast.classList.add('translate-y-0', 'opacity-100');
    });

    // Remove after duration
    setTimeout(() => {
      toast.classList.remove('translate-y-0', 'opacity-100');
      toast.classList.add('translate-y-10', 'opacity-0');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, duration);
  }

  confirm(message, onConfirm, title = "Confirm Reset") {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-opacity duration-200 opacity-0';
    
    const dialog = document.createElement('div');
    dialog.className = 'bg-white border-3 border-theme-dark rounded-2xl shadow-[6px_6px_0_var(--color-theme-dark)] p-5 max-w-sm w-full flex flex-col gap-4 transform scale-95 transition-transform duration-200';
    
    dialog.innerHTML = `
      <div class="flex items-center gap-3 border-b-2 border-theme-dark/10 pb-3">
        <div class="w-8 h-8 rounded-lg bg-theme-yellow border-2 border-theme-dark flex items-center justify-center text-theme-dark shrink-0">
          <i class="fa-solid fa-triangle-exclamation text-sm"></i>
        </div>
        <h3 class="font-display text-lg text-theme-dark leading-tight">${title}</h3>
      </div>
      <p class="text-sm font-medium text-theme-dark/80">${message}</p>
      <div class="flex gap-3 justify-end pt-2">
        <button type="button" id="confirm-cancel-btn" class="bg-white text-theme-dark border-2 border-theme-dark rounded-lg px-4 h-9 text-xs font-bold shadow-[2px_2px_0_var(--color-theme-dark)] transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_var(--color-theme-dark)] inline-flex items-center justify-center cursor-pointer">Cancel</button>
        <button type="button" id="confirm-ok-btn" class="bg-theme-pink text-white border-2 border-theme-dark rounded-lg px-4 h-9 text-xs font-bold shadow-[2px_2px_0_var(--color-theme-dark)] transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_var(--color-theme-dark)] inline-flex items-center justify-center cursor-pointer">Reset</button>
      </div>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      overlay.classList.remove('opacity-0');
      overlay.classList.add('opacity-100');
      dialog.classList.remove('scale-95');
      dialog.classList.add('scale-100');
    });

    const close = (confirmed) => {
      overlay.classList.remove('opacity-100');
      overlay.classList.add('opacity-0');
      dialog.classList.remove('scale-100');
      dialog.classList.add('scale-95');
      setTimeout(() => {
        overlay.remove();
        if (confirmed && typeof onConfirm === 'function') {
          onConfirm();
        }
      }, 200);
    };

    dialog.querySelector('#confirm-cancel-btn').addEventListener('click', () => close(false));
    dialog.querySelector('#confirm-ok-btn').addEventListener('click', () => close(true));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close(false);
    });
  }

  prompt(message, onSubmit, title = "Save Preset", defaultValue = "") {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-opacity duration-200 opacity-0';
    
    const dialog = document.createElement('div');
    dialog.className = 'bg-white border-3 border-theme-dark rounded-2xl shadow-[6px_6px_0_var(--color-theme-dark)] p-5 max-w-sm w-full flex flex-col gap-4 transform scale-95 transition-transform duration-200';
    
    dialog.innerHTML = `
      <div class="flex items-center gap-3 border-b-2 border-theme-dark/10 pb-3">
        <div class="w-8 h-8 rounded-lg bg-theme-yellow border-2 border-theme-dark flex items-center justify-center text-theme-dark shrink-0">
          <i class="fa-solid fa-floppy-disk text-sm"></i>
        </div>
        <h3 class="font-display text-lg text-theme-dark leading-tight">${title}</h3>
      </div>
      ${message ? `<p class="text-sm font-medium text-theme-dark/80">${message}</p>` : ''}
      <div class="flex flex-col gap-1">
        <input type="text" id="prompt-input" maxlength="25" value="${defaultValue}" placeholder="Enter name (max 25 chars)" class="w-full h-9 px-3 text-xs rounded-lg border-2 border-theme-dark font-ui" />
      </div>
      <div class="flex gap-3 justify-end pt-2">
        <button type="button" id="prompt-cancel-btn" class="bg-white text-theme-dark border-2 border-theme-dark rounded-lg px-4 h-9 text-xs font-bold shadow-[2px_2px_0_var(--color-theme-dark)] transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_var(--color-theme-dark)] inline-flex items-center justify-center cursor-pointer">Cancel</button>
        <button type="button" id="prompt-ok-btn" class="bg-theme-yellow text-theme-dark border-2 border-theme-dark rounded-lg px-4 h-9 text-xs font-bold shadow-[2px_2px_0_var(--color-theme-dark)] transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_var(--color-theme-dark)] inline-flex items-center justify-center cursor-pointer">Save</button>
      </div>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    const input = dialog.querySelector('#prompt-input');

    requestAnimationFrame(() => {
      overlay.classList.remove('opacity-0');
      overlay.classList.add('opacity-100');
      dialog.classList.remove('scale-95');
      dialog.classList.add('scale-100');
      if (input) {
        input.focus();
        input.select();
      }
    });

    const close = (submitted) => {
      const val = input ? input.value.trim().slice(0, 25) : '';
      overlay.classList.remove('opacity-100');
      overlay.classList.add('opacity-0');
      dialog.classList.remove('scale-100');
      dialog.classList.add('scale-95');
      setTimeout(() => {
        overlay.remove();
        if (submitted && val && typeof onSubmit === 'function') {
          onSubmit(val);
        }
      }, 200);
    };

    dialog.querySelector('#prompt-cancel-btn').addEventListener('click', () => close(false));
    dialog.querySelector('#prompt-ok-btn').addEventListener('click', () => close(true));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') close(true);
      if (e.key === 'Escape') close(false);
    });
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close(false);
    });
  }

  presetCustomModal(options = {}) {
    const { title = "Save Preset", defaultName = "", disabled = {}, onSubmit } = options;

    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-opacity duration-200 opacity-0';
    
    const dialog = document.createElement('div');
    dialog.className = 'bg-white border-3 border-theme-dark rounded-2xl shadow-[6px_6px_0_var(--color-theme-dark)] p-5 max-w-md w-full flex flex-col gap-4 transform scale-95 transition-transform duration-200';
    
    const categories = [
      { key: 'layoutMode', label: 'Layout mode' },
      { key: 'pageSize', label: 'Paper size' },
      { key: 'cardSize', label: 'Card size' },
      { key: 'gridSize', label: 'Grid size' },
      { key: 'crosshair', label: 'Crosshair' },
      { key: 'borders', label: 'Borders' },
      { key: 'foldPreference', label: 'Fold preference' }
    ];

    let categoryRowsHtml = categories.map(cat => {
      const isLocked = !!disabled[cat.key];
      return `
        <div class="flex items-center justify-between p-2 rounded-xl bg-theme-bg/30 border-1.5 border-theme-dark/10">
          <span class="text-xs font-bold text-theme-dark">${cat.label}</span>
          <div class="inline-flex p-0 bg-white border-2 border-theme-dark rounded-xl shadow-[2px_2px_0_var(--color-theme-dark)] gap-1 h-[1.85rem] items-center lock-segmented" data-key="${cat.key}">
            <button type="button" data-val="false" title="Unlocked (Editable)" aria-label="Unlocked"
              class="btn-lock-toggle px-2.5 h-full rounded-[8px] text-xs transition-all flex items-center justify-center ${!isLocked ? 'bg-theme-yellow border-[1.5px] border-theme-dark text-theme-dark' : 'text-theme-muted hover:bg-black/5'}">
              <i class="fa-solid fa-lock-open"></i>
            </button>
            <button type="button" data-val="true" title="Locked (Disabled)" aria-label="Locked"
              class="btn-lock-toggle px-2.5 h-full rounded-[8px] text-xs transition-all flex items-center justify-center ${isLocked ? 'bg-theme-yellow border-[1.5px] border-theme-dark text-theme-dark' : 'text-theme-muted hover:bg-black/5'}">
              <i class="fa-solid fa-lock"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    dialog.innerHTML = `
      <div class="flex items-center gap-3 border-b-2 border-theme-dark/10 pb-3">
        <div class="w-8 h-8 rounded-lg bg-theme-yellow border-2 border-theme-dark flex items-center justify-center text-theme-dark shrink-0">
          <i class="fa-solid fa-floppy-disk text-sm"></i>
        </div>
        <h3 class="font-display text-lg text-theme-dark leading-tight">${title}</h3>
      </div>
      
      <div class="flex flex-col gap-1">
        <label class="text-xs font-bold text-theme-muted">Preset Name</label>
        <input type="text" id="preset-name-input" maxlength="25" value="${defaultName}" placeholder="Enter preset name (max 25 chars)" class="w-full h-9 px-3 text-xs rounded-lg border-2 border-theme-dark font-ui" />
      </div>

      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-theme-muted">Setting Permissions</span>
          <span class="text-[10px] text-theme-muted font-medium">All values are saved</span>
        </div>
        <div class="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1">
          ${categoryRowsHtml}
        </div>
      </div>

      <div class="flex gap-3 justify-end pt-2 border-t-2 border-theme-dark/10">
        <button type="button" id="preset-cancel-btn" class="bg-white text-theme-dark border-2 border-theme-dark rounded-lg px-4 h-9 text-xs font-bold shadow-[2px_2px_0_var(--color-theme-dark)] transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_var(--color-theme-dark)] inline-flex items-center justify-center cursor-pointer">Cancel</button>
        <button type="button" id="preset-save-btn" class="bg-theme-yellow text-theme-dark border-2 border-theme-dark rounded-lg px-4 h-9 text-xs font-bold shadow-[2px_2px_0_var(--color-theme-dark)] transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_var(--color-theme-dark)] inline-flex items-center justify-center cursor-pointer">Save Preset</button>
      </div>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    const input = dialog.querySelector('#preset-name-input');
    const lockStates = { ...disabled };

    // Toggle click listeners
    dialog.querySelectorAll('.lock-segmented').forEach(segmented => {
      const key = segmented.getAttribute('data-key');
      const buttons = segmented.querySelectorAll('.btn-lock-toggle');

      buttons.forEach(btn => {
        btn.addEventListener('click', () => {
          const val = btn.getAttribute('data-val') === 'true';
          lockStates[key] = val;
          buttons.forEach(b => {
            const bVal = b.getAttribute('data-val') === 'true';
            if (bVal === val) {
              b.className = 'btn-lock-toggle px-2.5 h-full rounded-[8px] text-xs transition-all flex items-center justify-center bg-theme-yellow border-[1.5px] border-theme-dark text-theme-dark';
            } else {
              b.className = 'btn-lock-toggle px-2.5 h-full rounded-[8px] text-xs transition-all flex items-center justify-center text-theme-muted hover:bg-black/5';
            }
          });
        });
      });
    });

    requestAnimationFrame(() => {
      overlay.classList.remove('opacity-0');
      overlay.classList.add('opacity-100');
      dialog.classList.remove('scale-95');
      dialog.classList.add('scale-100');
      if (input) {
        input.focus();
        input.select();
      }
    });

    const close = (submitted) => {
      const nameVal = input ? input.value.trim().slice(0, 25) : '';
      overlay.classList.remove('opacity-100');
      overlay.classList.add('opacity-0');
      dialog.classList.remove('scale-100');
      dialog.classList.add('scale-95');
      setTimeout(() => {
        overlay.remove();
        if (submitted && nameVal && typeof onSubmit === 'function') {
          onSubmit(nameVal, lockStates);
        }
      }, 200);
    };

    dialog.querySelector('#preset-cancel-btn').addEventListener('click', () => close(false));
    dialog.querySelector('#preset-save-btn').addEventListener('click', () => close(true));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') close(true);
      if (e.key === 'Escape') close(false);
    });
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close(false);
    });
  }
}

window.Toast = new NotificationSystem();
