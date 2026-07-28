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
        <button type="button" id="confirm-cancel-btn" class="btn-secondary px-4 py-1.5 text-xs font-bold">Cancel</button>
        <button type="button" id="confirm-ok-btn" class="btn-primary px-4 py-1.5 text-xs font-bold bg-theme-pink">Reset</button>
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

  prompt(message, onSubmit, title = "Save Card Size", defaultValue = "") {
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
        <input type="text" id="prompt-input" maxlength="25" value="${defaultValue}" placeholder="Enter name (max 25 chars)" class="w-full" />
      </div>
      <div class="flex gap-3 justify-end pt-2">
        <button type="button" id="prompt-cancel-btn" class="btn-secondary px-4 py-1.5 text-xs font-bold">Cancel</button>
        <button type="button" id="prompt-ok-btn" class="btn-primary px-4 py-1.5 text-xs font-bold">Save</button>
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
}

window.Toast = new NotificationSystem();
