const FoldableLayoutUI = {
  getSettings() {
    const settings = {};
    const ids = [
      "foldable_cardWidth",
      "foldable_cardHeight",
      "foldable_printerMargin",
      "foldable_foldingMargin",
      "foldable_cardMargin",
      "foldable_cutMargin",
      "foldable_outerBorder",
      "foldable_innerBorder",
      "foldable_borderColorFront",
      "foldable_borderColorBack",
      "foldable_foldLinePreference",
      "foldable_cornerRadius",
      "foldable_cutterOffset",
    ];

    ids.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        // Remove 'foldable_' prefix for the key
        let key = id.replace("foldable_", "");
        if (key === "innerBorder") {
          settings["innerBorderWidth"] = element.value;
          settings["innerBorderHeight"] = element.value;
          return; // continue to next id
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

    // Handle radio buttons for pageSize separately
    const pageSizeA4 = document.getElementById("foldable_A4");
    if (pageSizeA4 && pageSizeA4.checked) {
      settings.pageSize = "A4";
    } else {
      settings.pageSize = "Letter";
    }

    // Convert numeric values from strings to numbers
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

  init() {
    // Future use for presets or other dynamic UI interactions for the foldable mode
    console.log("FoldableLayoutUI initialized.");
  },
};

document.addEventListener("DOMContentLoaded", () => {
  FoldableLayoutUI.init();
  window.FoldableLayoutUI = FoldableLayoutUI;
});
