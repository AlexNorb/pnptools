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
}

window.Toast = new NotificationSystem();
