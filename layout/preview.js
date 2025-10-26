// --- CONSTANTS AND STATE MANAGEMENT ---

// Constants used internally to identify missing image slots
const PLACEHOLDER_FRONT = "MISSING_FRONT_PLACEHOLDER";
const PLACEHOLDER_BACK = "MISSING_BACK_PLACEHOLDER";

// Core application state
const state = {
  fronts: [], // Array of Base64 strings for all loaded front images
  backs: [], // Array of Base64 strings for all loaded back images
  copies: [], // Array of integers defining the copy count for each front image (index matches state.fronts)
};

let sortableInstance = null; // Reference to the Sortable.js instance

// --- MESSAGE HANDLING (COMMUNICATION WITH PARENT) ---

window.addEventListener("message", (event) => {
  const { type, data } = event.data;

  if (type === "init-preview") {
    // Initialize state with data from parent
    state.fronts = data.fronts || [];
    state.backs = data.backs || [];
    state.copies = state.fronts.map(() => 1); // Reset copies on new data
    updateUI();
  } else if (type === "append-images") {
    // Append new images to the existing state
    if (data.imageType === "fronts" && data.images) {
      state.fronts.push(...data.images);
      // Add copy counts for the new images
      state.copies.push(...data.images.map(() => 1));
    } else if (data.imageType === "backs" && data.images) {
      state.backs.push(...data.images);
    }
    updateUI();
  } else if (type === "get-preview-data") {
    // Parent is requesting the final data. Compile and send it back.
    const finalData = compileFinalData();
    window.parent.postMessage(
      { type: "preview-data-response", data: finalData },
      "*"
    );
  }
});

// --- DATA COMPILATION ---
function compileFinalData() {
  const mode = getCurrentMode();
  const frontImageUrls = [];
  const backImageUrls = [];

  // Return empty arrays if the mode is invalid for generation
  const validModes = ["NO_BACKS", "SAME_BACK", "UNIQUE_BACKS"];
  if (!validModes.includes(mode) && state.fronts.length > 0) {
    return { frontImages: [], backImages: [] };
  }

  const isSameBack = mode === "SAME_BACK";
  const hasNoBacks = mode === "NO_BACKS" || state.backs.length === 0;
  const backImageForSameMode = isSameBack ? state.backs[0] : null;

  state.fronts.forEach((frontImage, i) => {
    const copies = state.copies[i] || 1;
    let backImage;

    if (isSameBack) {
      backImage = backImageForSameMode;
    } else if (hasNoBacks) {
      backImage = null; // No back for this front
    } else {
      // UNIQUE_BACKS mode
      backImage = state.backs[i] || null; // Use null if a back is missing
    }

    for (let c = 0; c < copies; c++) {
      frontImageUrls.push(frontImage);
      // Add the corresponding back image for each copy of the front
      backImageUrls.push(backImage);
    }
  });

  return { frontImages: frontImageUrls, backImages: backImageUrls };
}

// --- CLEAR FUNCTIONS (State Reset) ---

function clearFronts() {
  if (state.fronts.length === 0) return;
  state.fronts = [];
  state.copies = [];
  updateUI();
}

function clearBacks() {
  if (state.backs.length === 0) return;
  state.backs = [];
  updateUI();
}

function clearAll() {
  if (state.fronts.length === 0 && state.backs.length === 0) return;
  state.fronts = [];
  state.backs = [];
  state.copies = [];
  updateUI();
}

// --- CORE LOGIC: MODE DETERMINATION ---

/**
 * Determines the current configuration mode based on the counts of fronts and backs.
 */
function getCurrentMode() {
  const frontLength = state.fronts.length;
  const backLength = state.backs.length;

  if (frontLength === 0 && backLength === 0) return "EMPTY";
  if (frontLength > 0 && backLength === 0) return "NO_BACKS";
  if (frontLength > 0 && backLength === 1) return "SAME_BACK";
  if (frontLength > 0 && frontLength === backLength) return "UNIQUE_BACKS";
  return "INVALID";
}

// --- DISPLAY LOGIC: PAIR GENERATION ---

/**
 * Generates a temporary list of pairs for rendering the UI rows.
 */
function getDisplayPairs() {
  const frontLength = state.fronts.length;
  const backLength = state.backs.length;
  const maxLength = Math.max(frontLength, backLength);
  const isSameBackMode = getCurrentMode() === "SAME_BACK";
  const displayPairs = [];

  if (maxLength === 0) return [];

  for (let i = 0; i < maxLength; i++) {
    const frontImage = state.fronts[i] || PLACEHOLDER_FRONT;
    let backImage;

    if (isSameBackMode) {
      backImage = state.backs[0];
    } else {
      backImage = state.backs[i] || PLACEHOLDER_BACK;
    }

    displayPairs.push({
      front: frontImage,
      back: backImage,
      copies: state.copies[i] || 1,
      index: i,
      isFrontPlaceholder: frontImage === PLACEHOLDER_FRONT,
      isBackPlaceholder: backImage === PLACEHOLDER_BACK,
    });
  }
  return displayPairs;
}

// --- INTERACTION LOGIC ---

function deletePair(index) {
  const initialMode = getCurrentMode();
  state.fronts.splice(index, 1);
  state.copies.splice(index, 1);

  if (initialMode === "UNIQUE_BACKS") {
    state.backs.splice(index, 1);
  }

  if (state.fronts.length === 0 && state.backs.length > 0) {
    state.backs = [];
  }
  updateUI();
}

function updateCopies(index, value) {
  state.copies[index] = parseInt(value) || 1;
  updateUI();
}

// --- RENDERING & SYNCHRONIZATION ---

function initializeSortable() {
  if (sortableInstance) {
    sortableInstance.destroy();
  }

  const draggableRow = document.getElementById("draggableRow");
  if (!draggableRow || state.fronts.length === 0) return;

  sortableInstance = Sortable.create(draggableRow, {
    animation: 150,
    handle: ".pair-number",
    ghostClass: "sortable-ghost",
    scroll: true,
    scrollSpeed: 15, // Increased for faster scrolling
    scrollSensitivity: 200, // Decreased for earlier scroll trigger
    forceAutoScrollFallback: true,
    onEnd: function (evt) {
      const movedFront = state.fronts.splice(evt.oldIndex, 1)[0];
      const movedCopies = state.copies.splice(evt.oldIndex, 1)[0];
      state.fronts.splice(evt.newIndex, 0, movedFront);
      state.copies.splice(evt.newIndex, 0, movedCopies);
      updateUI();
    },
  });
}

function setupScrollSync() {
  const draggableRow = document.getElementById("draggableRow");
  const fixedRow = document.getElementById("fixedRow");
  if (!draggableRow || !fixedRow) return;

  draggableRow.onscroll = () => {
    fixedRow.scrollLeft = draggableRow.scrollLeft;
  };
  fixedRow.onscroll = () => {
    draggableRow.scrollLeft = fixedRow.scrollLeft;
  };
}

function renderPairs(mode, pairs) {
  const container = document.getElementById("pairsContainer");
  const isSameBack = mode === "SAME_BACK";

  const draggableRowContent = pairs
    .map((pair, index) => {
      const isFrontPlaceholder = pair.isFrontPlaceholder;
      const frontContent = isFrontPlaceholder
        ? `<div class="placeholder-text front-missing">MISSING FRONT</div>`
        : `<img src="${pair.front}" alt="Front ${
            index + 1
          }" class="image-preview">`;

      const dragHandle = isFrontPlaceholder
        ? `<div class="pair-number">${index + 1}</div>`
        : `<div class="pair-number" title="Drag to reorder">${index + 1}</div>`;

      return `
              <div class="pair-column ${
                isFrontPlaceholder ? "placeholder-front" : ""
              }">
                <div class="draggable-section">
                  <div class="controls">
                    <div class="drag-handle">${dragHandle}</div>
                    <div class="copies-control">
                      <input type="number" min="1" value="${pair.copies}" 
                             onchange="updateCopies(${index}, this.value)" 
                             title="Number of copies" ${
                               isFrontPlaceholder ? "disabled" : ""
                             }>
                    </div>
                    <button class="delete-btn" onclick="deletePair(${index})" title="Delete this pair" ${
        isFrontPlaceholder ? "disabled" : ""
      }>Delete</button>
                  </div>
                  ${frontContent}
                </div>
              </div>`;
    })
    .join("");

  let fixedRowContent = "";
  if (state.backs.length > 0) {
    fixedRowContent = pairs
      .map((pair, index) => {
        let backContent;
        if (pair.isBackPlaceholder) {
          backContent = `<div class="placeholder-text back-missing">MISSING BACK</div>`;
        } else if (isSameBack) {
          backContent = `
                  <div class="placeholder-text shared-back">(Shared Back)</div>
                  <img src="${pair.back}" alt="Shared Back" class="image-preview shared-back-image">`;
        } else {
          backContent = `<img src="${pair.back}" alt="Back ${
            index + 1
          }" class="image-preview">`;
        }
        return `<div class="pair-column"><div class="fixed-section">${backContent}</div></div>`;
      })
      .join("");
    fixedRowContent = `<div class="fixed-row" id="fixedRow">${fixedRowContent}</div>`;
  }

  container.innerHTML = `
          <div class="draggable-row" id="draggableRow">${draggableRowContent}</div>
          ${fixedRowContent}
        `;

  initializeSortable();
  setupScrollSync();
}

// --- MAIN UI RENDER LOOP ---

function updateUI() {
  const mode = getCurrentMode();
  const pairs = getDisplayPairs();

  const draggableRow = document.getElementById("draggableRow");
  const scrollLeft = draggableRow ? draggableRow.scrollLeft : 0;

  const hasContent = state.fronts.length > 0 || state.backs.length > 0;
  const previewSection = document.getElementById("previewSection");
  const emptyState = document.getElementById("emptyState");

  if (hasContent) {
    previewSection.style.display = "block";
    emptyState.style.display = "none";
  } else {
    previewSection.style.display = "none";
    emptyState.style.display = "block";
  }

  const modeInfo = document.getElementById("modeInfo");
  const validModes = ["NO_BACKS", "SAME_BACK", "UNIQUE_BACKS"];
  const isFinalizable = validModes.includes(mode) && state.fronts.length > 0;

  modeInfo.classList.remove("invalid");
  let modeDescription = "";

  if (mode === "EMPTY") {
    modeDescription = "Waiting for images from the main application...";
  } else if (mode === "NO_BACKS") {
    modeDescription = `<strong>VALID MODE:</strong> "No backs." ${state.fronts.length} front images loaded.`;
  } else if (mode === "SAME_BACK") {
    modeDescription = `<strong>VALID MODE:</strong> "Same back." The single back image will be paired with all ${state.fronts.length} front images.`;
  } else if (mode === "UNIQUE_BACKS") {
    modeDescription = `<strong>VALID MODE:</strong> "Unique backs." ${state.fronts.length} 1:1 pairs created.`;
  } else if (mode === "INVALID") {
    modeInfo.classList.add("invalid");
    modeDescription = `<strong>INVALID CONFIGURATION:</strong> Please adjust images to match a valid mode.`;
  }

  modeInfo.innerHTML = modeDescription;

  if (hasContent) {
    renderPairs(mode, pairs);
    const newDraggableRow = document.getElementById("draggableRow");
    if (newDraggableRow) {
      newDraggableRow.scrollLeft = scrollLeft;
    }
  }
}

// --- INITIALIZATION ---
// Initial UI render on load
updateUI();
