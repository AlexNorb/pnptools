/**
 * PNP Buddy — Shared Dynamic Header Component
 * 
 * Usage: Add data-tool-title="Tool Name" to your <body> tag, 
 * then include this script. The header will be injected at the 
 * top of the page container automatically.
 * 
 * Expected DOM structure: 
 *   <body data-tool-title="My Tool">
 *     <div class="max-w-6xl mx-auto px-4 py-6" id="page-container">
 *       <!-- header will be injected here as first child -->
 *     </div>
 *   </body>
 */
(function () {
  'use strict';

  function injectHeader() {
    const title = document.body.getAttribute('data-tool-title') || document.title || 'PNP Tool';
    const container = document.getElementById('page-container');
    if (!container) return;

    // Don't inject if header already exists
    if (document.getElementById('pnp-header')) return;

    const header = document.createElement('div');
    header.id = 'pnp-header';
    header.className = 'flex items-center justify-between mb-6 relative';
    header.innerHTML = `
      <a href="../index.html" class="btn-secondary font-bold gap-1.5 text-xs sm:text-sm py-1 px-3 flex items-center shrink-0" title="Back to Landing Page">
        <i class="fa-solid fa-house"></i>
        <span class="hidden sm:inline">Home</span>
      </a>
      <h1 class="text-2xl sm:text-3xl md:text-4xl font-display text-theme-dark uppercase text-center flex-1 mx-2 sm:mx-4">${title}</h1>
      <div class="w-[38px] sm:w-[85px] shrink-0"></div>
    `;

    container.insertBefore(header, container.firstChild);
  }

  // Inject when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectHeader);
  } else {
    injectHeader();
  }
})();
