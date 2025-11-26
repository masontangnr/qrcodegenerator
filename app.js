/**
 * Advanced QR Code Generator Application
 * Features: Custom patterns, corner styles, logo support, and multiple export formats
 */

// Utility functions for contrast validation
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function getRelativeLuminance(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const rsRGB = rgb.r / 255;
  const gsRGB = rgb.g / 255;
  const bsRGB = rgb.b / 255;

  const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getContrastRatio(color1, color2) {
  const lum1 = getRelativeLuminance(color1);
  const lum2 = getRelativeLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

// CMYK color conversion functions
function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map(x => {
    const hex = Math.round(x).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }).join("");
}

function rgbToCmyk(r, g, b) {
  // Normalize RGB values to 0-1
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  // Calculate K (black)
  const k = 1 - Math.max(rNorm, gNorm, bNorm);

  // Handle pure black case
  if (k === 1) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }

  // Calculate CMY
  const c = ((1 - rNorm - k) / (1 - k)) * 100;
  const m = ((1 - gNorm - k) / (1 - k)) * 100;
  const y = ((1 - bNorm - k) / (1 - k)) * 100;

  return {
    c: Math.round(c),
    m: Math.round(m),
    y: Math.round(y),
    k: Math.round(k * 100)
  };
}

function cmykToRgb(c, m, y, k) {
  // Normalize CMYK values to 0-1
  const cNorm = c / 100;
  const mNorm = m / 100;
  const yNorm = y / 100;
  const kNorm = k / 100;

  // Calculate RGB
  const r = 255 * (1 - cNorm) * (1 - kNorm);
  const g = 255 * (1 - mNorm) * (1 - kNorm);
  const b = 255 * (1 - yNorm) * (1 - kNorm);

  return {
    r: Math.round(r),
    g: Math.round(g),
    b: Math.round(b)
  };
}

function hexToCmyk(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return { c: 0, m: 0, y: 0, k: 100 };
  return rgbToCmyk(rgb.r, rgb.g, rgb.b);
}

function cmykToHex(c, m, y, k) {
  const rgb = cmykToRgb(c, m, y, k);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

class QRCodeGenerator {
  constructor() {
    this.canvas = document.getElementById("qr-canvas");
    this.ctx = this.canvas.getContext("2d");
    this.qrData = null;
    this.logoImage = null;

    // Default Settings
    this.config = {
      url: "https://example.com",
      patternStyle: "dots",
      patternColor: "#000000",
      backgroundColor: "#ffffff",
      cornerSquareStyle: "extra-rounded",
      cornerSquareColor: "#000000",
      cornerDotStyle: "square",
      cornerDotColor: "#000000",
      logoSize: 20,
      logoBackgroundColor: "#ffffff",
      canvasSize: 300,
      margin: 0,
      exportDPI: 300,
      exportSize: 3, // in inches
    };

    this.initializeEventListeners();
    this.initializeCmykValues();
    this.validateContrast();
    this.generateQRCode();

    // Initialize preview background
    this.changePreviewBackground("light");
  }

  initializeEventListeners() {
    // URL input
    const urlInput = document.getElementById("url-input");
    urlInput.addEventListener("input", (e) => {
      this.config.url = e.target.value || "https://example.com";
      this.generateQRCode();
    });

    // Pattern style selection
    document.querySelectorAll(".pattern-option").forEach((option) => {
      option.addEventListener("click", (e) => {
        document
          .querySelectorAll(".pattern-option")
          .forEach((o) => o.classList.remove("active"));
        option.classList.add("active");
        this.config.patternStyle = option.dataset.pattern;
        this.generateQRCode();
      });
    });

    // Corner square style selection
    document.querySelectorAll(".corner-option").forEach((option) => {
      option.addEventListener("click", (e) => {
        document
          .querySelectorAll(".corner-option")
          .forEach((o) => o.classList.remove("active"));
        option.classList.add("active");
        this.config.cornerSquareStyle = option.dataset.corner;
        this.generateQRCode();
      });
    });

    // Corner dot style selection
    document.querySelectorAll(".corner-dot-option").forEach((option) => {
      option.addEventListener("click", (e) => {
        document
          .querySelectorAll(".corner-dot-option")
          .forEach((o) => o.classList.remove("active"));
        option.classList.add("active");
        this.config.cornerDotStyle = option.dataset.dot;
        this.generateQRCode();
      });
    });

    // Color pickers
    document.getElementById("pattern-color").addEventListener("input", (e) => {
      this.config.patternColor = e.target.value;
      this.updateCmykFromHex("pattern", e.target.value);
      this.validateContrast();
      this.generateQRCode();
    });

    document.getElementById("bg-color").addEventListener("input", (e) => {
      this.config.backgroundColor = e.target.value;
      this.updateCmykFromHex("bg", e.target.value);
      this.validateContrast();
      this.generateQRCode();
    });

    document
      .getElementById("corner-square-color")
      .addEventListener("input", (e) => {
        this.config.cornerSquareColor = e.target.value;
        this.updateCmykFromHex("corner-square", e.target.value);
        this.validateContrast();
        this.generateQRCode();
      });

    document
      .getElementById("corner-dot-color")
      .addEventListener("input", (e) => {
        this.config.cornerDotColor = e.target.value;
        this.updateCmykFromHex("corner-dot", e.target.value);
        this.validateContrast();
        this.generateQRCode();
      });

    document
      .getElementById("logo-bg-color")
      .addEventListener("input", (e) => {
        this.config.logoBackgroundColor = e.target.value;
        this.updateCmykFromHex("logo-bg", e.target.value);
        this.generateQRCode();
      });

    // Show/hide CMYK containers on color picker focus
    this.setupCmykToggle("pattern-color");
    this.setupCmykToggle("bg-color");
    this.setupCmykToggle("corner-square-color");
    this.setupCmykToggle("corner-dot-color");
    this.setupCmykToggle("logo-bg-color");

    // CMYK slider event listeners
    this.setupCmykSliders("pattern", "patternColor");
    this.setupCmykSliders("bg", "backgroundColor");
    this.setupCmykSliders("corner-square", "cornerSquareColor");
    this.setupCmykSliders("corner-dot", "cornerDotColor");
    this.setupCmykSliders("logo-bg", "logoBackgroundColor");

    // Logo upload
    document.getElementById("logo-upload").addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            this.logoImage = img;
            document.getElementById("remove-logo").style.display =
              "inline-block";
            this.generateQRCode();
          };
          img.src = event.target.result;
        };
        reader.readAsDataURL(file);
      }
    });

    // Remove logo
    document.getElementById("remove-logo").addEventListener("click", () => {
      this.logoImage = null;
      document.getElementById("logo-upload").value = "";
      document.getElementById("remove-logo").style.display = "none";
      this.generateQRCode();
    });

    // Logo size slider
    document.getElementById("logo-size").addEventListener("input", (e) => {
      this.config.logoSize = parseInt(e.target.value);
      document.getElementById("logo-size-value").textContent =
        e.target.value + "%";
      this.generateQRCode();
    });

    // Export buttons
    document
      .getElementById("export-png")
      .addEventListener("click", () => this.exportAs("png"));
    document
      .getElementById("export-jpg")
      .addEventListener("click", () => this.exportAs("jpg"));
    document
      .getElementById("export-svg")
      .addEventListener("click", () => this.exportAs("svg"));
    document
      .getElementById("export-pdf")
      .addEventListener("click", () => this.exportAs("pdf"));

    // Preview background selector
    document.getElementById("preview-bg").addEventListener("change", (e) => {
      this.changePreviewBackground(e.target.value);
    });

    // Export settings
    document.getElementById("export-dpi").addEventListener("change", (e) => {
      this.config.exportDPI = parseInt(e.target.value);
      this.updateExportDimensions();
    });

    document.getElementById("export-size").addEventListener("change", (e) => {
      this.config.exportSize = parseFloat(e.target.value);
      this.updateExportDimensions();
    });

    // Initialize export dimensions display
    this.updateExportDimensions();
  }

  validateContrast() {
    const MIN_RATIO = 3.0;
    const RECOMMENDED_RATIO = 4.5;

    const validations = {
      pattern: {
        ratio: getContrastRatio(this.config.patternColor, this.config.backgroundColor),
        label: 'Pattern Color',
        elementId: 'pattern-color-warning'
      },
      cornerSquare: {
        ratio: getContrastRatio(this.config.cornerSquareColor, this.config.backgroundColor),
        label: 'Corner Square Color',
        elementId: 'corner-square-color-warning'
      },
      cornerDot: {
        ratio: getContrastRatio(this.config.cornerDotColor, this.config.backgroundColor),
        label: 'Corner Dot Color',
        elementId: 'corner-dot-color-warning'
      }
    };

    let hasWarnings = false;

    for (const validation of Object.values(validations)) {
      const warningElement = document.getElementById(validation.elementId);

      if (!warningElement) continue; // Skip if element doesn't exist yet

      if (validation.ratio < MIN_RATIO) {
        // Critical warning
        warningElement.innerHTML = `
          <span class="warning-icon">⚠️</span>
          <strong>Low Contrast!</strong> Current ratio: ${validation.ratio.toFixed(2)}:1
          (minimum: ${MIN_RATIO}:1). QR code may be difficult to scan.
        `;
        warningElement.className = 'contrast-warning critical';
        warningElement.style.display = 'block';
        hasWarnings = true;
      } else if (validation.ratio < RECOMMENDED_RATIO) {
        // Informational warning
        warningElement.innerHTML = `
          <span class="info-icon">ℹ️</span>
          Contrast: ${validation.ratio.toFixed(2)}:1.
          Consider ${RECOMMENDED_RATIO}:1+ for optimal scanning.
        `;
        warningElement.className = 'contrast-warning info';
        warningElement.style.display = 'block';
      } else {
        // Good contrast
        warningElement.innerHTML = `
          <span class="success-icon">✓</span>
          Good contrast: ${validation.ratio.toFixed(2)}:1
        `;
        warningElement.className = 'contrast-warning success';
        warningElement.style.display = 'block';
      }
    }

    return !hasWarnings;
  }

  changePreviewBackground(bgType) {
    const qrContainer = document.querySelector(".qr-container");

    // Remove existing background classes
    qrContainer.classList.remove("bg-light", "bg-white", "bg-black");

    // Add new background class
    if (bgType === "white") {
      qrContainer.classList.add("bg-white");
    } else if (bgType === "black") {
      qrContainer.classList.add("bg-black");
    } else {
      // Default to light gray
      qrContainer.classList.add("bg-light");
    }
  }

  updateExportDimensions() {
    const pixels = Math.round(this.config.exportSize * this.config.exportDPI);
    const dimensionsText = document.getElementById("export-dimensions");
    if (dimensionsText) {
      dimensionsText.textContent = `Export size: ${pixels} × ${pixels} pixels`;
    }
  }

  // CMYK helper methods
  setupCmykToggle(colorPickerId) {
    const colorPicker = document.getElementById(colorPickerId);
    const cmykContainer = document.getElementById(`${colorPickerId}-cmyk`);

    // Show CMYK container on click
    colorPicker.addEventListener("click", () => {
      if (cmykContainer.style.display === "none") {
        cmykContainer.style.display = "block";
      } else {
        cmykContainer.style.display = "none";
      }
    });
  }

  setupCmykSliders(prefix, configKey) {
    const sliders = ['c', 'm', 'y', 'k'];

    sliders.forEach(slider => {
      const sliderId = `${prefix}-${slider}`;
      const sliderElement = document.getElementById(sliderId);
      const valueElement = document.getElementById(`${sliderId}-value`);

      if (sliderElement && valueElement) {
        sliderElement.addEventListener("input", (e) => {
          const value = parseInt(e.target.value);
          valueElement.textContent = value;

          // Get all CMYK values
          const c = parseInt(document.getElementById(`${prefix}-c`).value);
          const m = parseInt(document.getElementById(`${prefix}-m`).value);
          const y = parseInt(document.getElementById(`${prefix}-y`).value);
          const k = parseInt(document.getElementById(`${prefix}-k`).value);

          // Convert CMYK to hex
          const hexColor = cmykToHex(c, m, y, k);

          // Update config and color picker
          this.config[configKey] = hexColor;
          document.getElementById(`${prefix}-color`).value = hexColor;

          // Validate contrast if applicable
          if (configKey === "patternColor" || configKey === "cornerSquareColor" || configKey === "cornerDotColor") {
            this.validateContrast();
          }

          // Regenerate QR code
          this.generateQRCode();
        });
      }
    });
  }

  updateCmykFromHex(prefix, hexColor) {
    const cmyk = hexToCmyk(hexColor);

    // Update CMYK sliders and values
    const sliders = {
      'c': cmyk.c,
      'm': cmyk.m,
      'y': cmyk.y,
      'k': cmyk.k
    };

    Object.keys(sliders).forEach(key => {
      const sliderId = `${prefix}-${key}`;
      const slider = document.getElementById(sliderId);
      const valueSpan = document.getElementById(`${sliderId}-value`);

      if (slider && valueSpan) {
        slider.value = sliders[key];
        valueSpan.textContent = sliders[key];
      }
    });
  }

  initializeCmykValues() {
    // Initialize CMYK values for all color pickers based on their default hex colors
    this.updateCmykFromHex("pattern", this.config.patternColor);
    this.updateCmykFromHex("bg", this.config.backgroundColor);
    this.updateCmykFromHex("corner-square", this.config.cornerSquareColor);
    this.updateCmykFromHex("corner-dot", this.config.cornerDotColor);
    this.updateCmykFromHex("logo-bg", this.config.logoBackgroundColor);
  }

  generateQRCode() {
    try {
      // Create QR code data
      const qr = new QRCode(10, ErrorCorrectionLevel.H);
      qr.addData(this.config.url);
      qr.make();

      this.qrData = qr;
      this.drawQRCode();
    } catch (error) {
      console.error("Error generating QR code:", error);
    }
  }

  // Reusable method to render QR code to any canvas at any size
  renderQRToCanvas(canvas, ctx, size, margin = 0) {
    const moduleCount = this.qrData.getModuleCount();
    const cellSize = (size - 2 * margin) / moduleCount;

    // Set canvas size
    canvas.width = size;
    canvas.height = size;

    // Clear canvas
    ctx.fillStyle = this.config.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw QR code modules
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (this.qrData.isDark(row, col)) {
          const x = col * cellSize + margin;
          const y = row * cellSize + margin;

          // Check if this is a corner position element
          const isCornerSquare = this.isCornerSquarePosition(
            row,
            col,
            moduleCount
          );
          const isCornerDot = this.isCornerDotPosition(row, col, moduleCount);

          if (isCornerSquare) {
            ctx.fillStyle = this.config.cornerSquareColor;
            this.drawCornerSquareToContext(ctx, x, y, cellSize, row, col, moduleCount);
          } else if (isCornerDot) {
            ctx.fillStyle = this.config.cornerDotColor;
            this.drawCornerDotToContext(ctx, x, y, cellSize, row, col, moduleCount);
          } else {
            ctx.fillStyle = this.config.patternColor;
            this.drawModuleToContext(ctx, x, y, cellSize, row, col);
          }
        }
      }
    }

    // Draw logo if present
    if (this.logoImage) {
      this.drawLogoToContext(ctx, size);
    }
  }

  drawQRCode() {
    this.renderQRToCanvas(
      this.canvas,
      this.ctx,
      this.config.canvasSize,
      this.config.margin
    );
  }

  isCornerSquarePosition(row, col, moduleCount) {
    // Top-left corner (excluding center dot)
    if (row >= 0 && row <= 6 && col >= 0 && col <= 6) {
      if (row >= 2 && row <= 4 && col >= 2 && col <= 4) {
        return false; // This is the center dot
      }
      return true;
    }
    // Top-right corner (excluding center dot)
    if (
      row >= 0 &&
      row <= 6 &&
      col >= moduleCount - 7 &&
      col <= moduleCount - 1
    ) {
      if (
        row >= 2 &&
        row <= 4 &&
        col >= moduleCount - 5 &&
        col <= moduleCount - 3
      ) {
        return false; // This is the center dot
      }
      return true;
    }
    // Bottom-left corner (excluding center dot)
    if (
      row >= moduleCount - 7 &&
      row <= moduleCount - 1 &&
      col >= 0 &&
      col <= 6
    ) {
      if (
        row >= moduleCount - 5 &&
        row <= moduleCount - 3 &&
        col >= 2 &&
        col <= 4
      ) {
        return false; // This is the center dot
      }
      return true;
    }
    return false;
  }

  isCornerDotPosition(row, col, moduleCount) {
    // Top-left corner dot
    if (row >= 2 && row <= 4 && col >= 2 && col <= 4) {
      return true;
    }
    // Top-right corner dot
    if (
      row >= 2 &&
      row <= 4 &&
      col >= moduleCount - 5 &&
      col <= moduleCount - 3
    ) {
      return true;
    }
    // Bottom-left corner dot
    if (
      row >= moduleCount - 5 &&
      row <= moduleCount - 3 &&
      col >= 2 &&
      col <= 4
    ) {
      return true;
    }
    return false;
  }

  drawModule(x, y, size, row, col) {
    this.ctx.save();

    switch (this.config.patternStyle) {
      case "square":
        this.ctx.fillRect(x, y, size, size);
        break;

      case "rounded":
        this.drawRoundedRect(x, y, size, size, size * 0.25);
        break;

      case "dots":
        this.ctx.beginPath();
        this.ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
        this.ctx.fill();
        break;

      case "extra-rounded":
        this.drawRoundedRect(x, y, size, size, size * 0.4);
        break;

      case "classy":
        // Octagonal shape
        this.drawOctagon(x, y, size);
        break;

      case "classy-rounded":
        // Rounded rectangle with more rounding
        this.drawRoundedRect(x, y, size, size, size * 0.35);
        break;

      case "diamond":
        // Draw diamond (rotated square) with spacing
        const diamondSize = size * 0.55;
        this.ctx.save();
        this.ctx.translate(x + size / 2, y + size / 2);
        this.ctx.rotate(Math.PI / 4);
        this.ctx.fillRect(
          -diamondSize / 2,
          -diamondSize / 2,
          diamondSize,
          diamondSize
        );
        this.ctx.restore();
        break;

      default:
        this.ctx.fillRect(x, y, size, size);
    }

    this.ctx.restore();
  }

  drawCornerSquare(x, y, size, row, col, moduleCount) {
    // Determine which corner and position within corner
    let cornerX, cornerY, cornerRow, cornerCol;

    if (row <= 6 && col <= 6) {
      // Top-left
      cornerX = this.config.margin;
      cornerY = this.config.margin;
      cornerRow = row;
      cornerCol = col;
    } else if (row <= 6 && col >= moduleCount - 7) {
      // Top-right
      cornerX = (moduleCount - 7) * size + this.config.margin;
      cornerY = this.config.margin;
      cornerRow = row;
      cornerCol = col - (moduleCount - 7);
    } else {
      // Bottom-left
      cornerX = this.config.margin;
      cornerY = (moduleCount - 7) * size + this.config.margin;
      cornerRow = row - (moduleCount - 7);
      cornerCol = col;
    }

    this.ctx.save();

    const cellSize =
      (this.config.canvasSize - 2 * this.config.margin) / moduleCount;

    switch (this.config.cornerSquareStyle) {
      case "square":
        // Draw single solid frame for entire corner square
        // Only draw once at the top-left position of each corner
        const isTopLeftOfCorner =
          (row === 0 && col === 0) ||
          (row === 0 && col === moduleCount - 7) ||
          (row === moduleCount - 7 && col === 0);

        if (isTopLeftOfCorner) {
          const frameSize = cellSize * 7;

          // Determine the starting position for this corner's frame
          let frameX, frameY;
          if (row === 0 && col === 0) {
            // Top-left corner
            frameX = this.config.margin;
            frameY = this.config.margin;
          } else if (row === 0 && col === moduleCount - 7) {
            // Top-right corner
            frameX = col * cellSize + this.config.margin;
            frameY = this.config.margin;
          } else {
            // Bottom-left corner
            frameX = this.config.margin;
            frameY = row * cellSize + this.config.margin;
          }

          // Draw continuous frame outline
          this.ctx.strokeStyle = this.config.cornerSquareColor;
          this.ctx.lineWidth = cellSize;
          this.ctx.strokeRect(
            frameX + cellSize / 2,
            frameY + cellSize / 2,
            frameSize - cellSize,
            frameSize - cellSize
          );
        }
        // Skip drawing for all other positions in the corner square
        break;

      case "rounded":
        // Draw single solid frame for entire corner square
        // Only draw once at the top-left position of each corner
        const isTopLeftOfCornerRounded =
          (row === 0 && col === 0) ||
          (row === 0 && col === moduleCount - 7) ||
          (row === moduleCount - 7 && col === 0);

        if (isTopLeftOfCornerRounded) {
          const frameSize = cellSize * 7;

          // Determine the starting position for this corner's frame
          let frameX, frameY;
          if (row === 0 && col === 0) {
            // Top-left corner
            frameX = this.config.margin;
            frameY = this.config.margin;
          } else if (row === 0 && col === moduleCount - 7) {
            // Top-right corner
            frameX = col * cellSize + this.config.margin;
            frameY = this.config.margin;
          } else {
            // Bottom-left corner
            frameX = this.config.margin;
            frameY = row * cellSize + this.config.margin;
          }

          // Draw continuous rounded frame outline
          const radius = cellSize * 0.4;
          this.ctx.strokeStyle = this.config.cornerSquareColor;
          this.ctx.lineWidth = cellSize;
          this.ctx.beginPath();
          this.ctx.roundRect(
            frameX + cellSize / 2,
            frameY + cellSize / 2,
            frameSize - cellSize,
            frameSize - cellSize,
            radius
          );
          this.ctx.stroke();
        }
        // Skip drawing for all other positions in the corner square
        break;

      case "extra-rounded":
        // Draw single solid frame for entire corner square
        // Only draw once at the top-left position of each corner
        const isTopLeftOfCornerExtraRounded =
          (row === 0 && col === 0) ||
          (row === 0 && col === moduleCount - 7) ||
          (row === moduleCount - 7 && col === 0);

        if (isTopLeftOfCornerExtraRounded) {
          const frameSize = cellSize * 7;

          // Determine the starting position for this corner's frame
          let frameX, frameY;
          if (row === 0 && col === 0) {
            // Top-left corner
            frameX = this.config.margin;
            frameY = this.config.margin;
          } else if (row === 0 && col === moduleCount - 7) {
            // Top-right corner
            frameX = col * cellSize + this.config.margin;
            frameY = this.config.margin;
          } else {
            // Bottom-left corner
            frameX = this.config.margin;
            frameY = row * cellSize + this.config.margin;
          }

          // Draw continuous extra-rounded frame outline with larger radius
          const radius = cellSize * 1.5;
          this.ctx.strokeStyle = this.config.cornerSquareColor;
          this.ctx.lineWidth = cellSize;
          this.ctx.beginPath();
          this.ctx.roundRect(
            frameX + cellSize / 2,
            frameY + cellSize / 2,
            frameSize - cellSize,
            frameSize - cellSize,
            radius
          );
          this.ctx.stroke();
        }
        // Skip drawing for all other positions in the corner square
        break;

      case "dot":
        // Draw single solid circular frame for entire corner square
        // Only draw once at the top-left position of each corner
        const isTopLeftOfCornerDot =
          (row === 0 && col === 0) ||
          (row === 0 && col === moduleCount - 7) ||
          (row === moduleCount - 7 && col === 0);

        if (isTopLeftOfCornerDot) {
          const frameSize = cellSize * 7;

          // Determine the starting position for this corner's frame
          let frameX, frameY;
          if (row === 0 && col === 0) {
            // Top-left corner
            frameX = this.config.margin;
            frameY = this.config.margin;
          } else if (row === 0 && col === moduleCount - 7) {
            // Top-right corner
            frameX = col * cellSize + this.config.margin;
            frameY = this.config.margin;
          } else {
            // Bottom-left corner
            frameX = this.config.margin;
            frameY = row * cellSize + this.config.margin;
          }

          // Draw continuous circular frame outline
          const centerX = frameX + frameSize / 2;
          const centerY = frameY + frameSize / 2;
          const radius = (frameSize - cellSize) / 2;
          this.ctx.strokeStyle = this.config.cornerSquareColor;
          this.ctx.lineWidth = cellSize;
          this.ctx.beginPath();
          this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          this.ctx.stroke();
        }
        // Skip drawing for all other positions in the corner square
        break;

      case "classy":
        // Draw single solid octagonal frame for entire corner square
        // Only draw once at the top-left position of each corner
        const isTopLeftOfCornerClassy =
          (row === 0 && col === 0) ||
          (row === 0 && col === moduleCount - 7) ||
          (row === moduleCount - 7 && col === 0);

        if (isTopLeftOfCornerClassy) {
          const frameSize = cellSize * 7;

          // Determine the starting position for this corner's frame
          let frameX, frameY;
          if (row === 0 && col === 0) {
            // Top-left corner
            frameX = this.config.margin;
            frameY = this.config.margin;
          } else if (row === 0 && col === moduleCount - 7) {
            // Top-right corner
            frameX = col * cellSize + this.config.margin;
            frameY = this.config.margin;
          } else {
            // Bottom-left corner
            frameX = this.config.margin;
            frameY = row * cellSize + this.config.margin;
          }

          // Draw continuous octagonal frame outline
          const rectX = frameX + cellSize / 2;
          const rectY = frameY + cellSize / 2;
          const rectSize = frameSize - cellSize;
          const inset = rectSize * 0.3;

          this.ctx.strokeStyle = this.config.cornerSquareColor;
          this.ctx.lineWidth = cellSize;
          this.ctx.beginPath();
          this.ctx.moveTo(rectX + inset, rectY);
          this.ctx.lineTo(rectX + rectSize - inset, rectY);
          this.ctx.lineTo(rectX + rectSize, rectY + inset);
          this.ctx.lineTo(rectX + rectSize, rectY + rectSize - inset);
          this.ctx.lineTo(rectX + rectSize - inset, rectY + rectSize);
          this.ctx.lineTo(rectX + inset, rectY + rectSize);
          this.ctx.lineTo(rectX, rectY + rectSize - inset);
          this.ctx.lineTo(rectX, rectY + inset);
          this.ctx.closePath();
          this.ctx.stroke();
        }
        // Skip drawing for all other positions in the corner square
        break;

      default:
        this.ctx.fillRect(x, y, cellSize, cellSize);
    }

    this.ctx.restore();
  }

  drawCornerDot(x, y, size, row, col, moduleCount) {
    this.ctx.save();

    switch (this.config.cornerDotStyle) {
      case "square":
        // Draw single solid square for entire 3x3 corner dot area
        // Only draw once at the top-left position of the corner dot
        const isTopLeftCornerDotSquare = row === 2 && col === 2;
        const isTopRightCornerDotSquare = row === 2 && col === moduleCount - 5;
        const isBottomLeftCornerDotSquare = row === moduleCount - 5 && col === 2;

        if (
          isTopLeftCornerDotSquare ||
          isTopRightCornerDotSquare ||
          isBottomLeftCornerDotSquare
        ) {
          // Draw solid 3x3 square
          const fullAreaSize = size * 3;
          this.ctx.fillRect(x, y, fullAreaSize, fullAreaSize);
        }
        // Skip drawing for other positions in the 3x3 area
        break;

      case "dot":
        // Draw single solid circle for entire 3x3 corner dot area
        // Only draw once at the top-left position of the corner dot
        const isTopLeftCornerDotCircle = row === 2 && col === 2;
        const isTopRightCornerDotCircle = row === 2 && col === moduleCount - 5;
        const isBottomLeftCornerDotCircle = row === moduleCount - 5 && col === 2;

        if (
          isTopLeftCornerDotCircle ||
          isTopRightCornerDotCircle ||
          isBottomLeftCornerDotCircle
        ) {
          // Draw large circle covering 3x3 area
          const fullAreaSize = size * 3;
          const radius = fullAreaSize / 2;
          this.ctx.beginPath();
          this.ctx.arc(
            x + fullAreaSize / 2,
            y + fullAreaSize / 2,
            radius,
            0,
            Math.PI * 2
          );
          this.ctx.fill();
        }
        // Skip drawing for other positions in the 3x3 area
        break;

      case "diamond":
        // Draw single large diamond for entire 3x3 corner dot area
        // Only draw once when at the top-left position of the corner dot
        const isTopLeftCornerDot = row === 2 && col === 2;
        const isTopRightCornerDot = row === 2 && col === moduleCount - 5;
        const isBottomLeftCornerDot = row === moduleCount - 5 && col === 2;

        if (
          isTopLeftCornerDot ||
          isTopRightCornerDot ||
          isBottomLeftCornerDot
        ) {
          // Draw large diamond with spacing in 3x3 area
          const fullAreaSize = size * 3;
          const largeSize = size * 2.2;
          this.ctx.save();
          this.ctx.translate(x + fullAreaSize / 2, y + fullAreaSize / 2);
          this.ctx.rotate(Math.PI / 4);
          this.ctx.fillRect(
            -largeSize / 2,
            -largeSize / 2,
            largeSize,
            largeSize
          );
          this.ctx.restore();
        }
        // For other positions in the 3x3 area, don't draw anything (return early handled by if block)
        break;

      case "rounded":
        // Draw single solid rounded rectangle for entire 3x3 corner dot area
        // Only draw once at the top-left position of the corner dot
        const isTopLeftCornerDotRounded = row === 2 && col === 2;
        const isTopRightCornerDotRounded = row === 2 && col === moduleCount - 5;
        const isBottomLeftCornerDotRounded = row === moduleCount - 5 && col === 2;

        if (
          isTopLeftCornerDotRounded ||
          isTopRightCornerDotRounded ||
          isBottomLeftCornerDotRounded
        ) {
          // Draw solid 3x3 rounded rectangle
          const fullAreaSize = size * 3;
          this.drawRoundedRect(
            x,
            y,
            fullAreaSize,
            fullAreaSize,
            size * 0.25
          );
        }
        // Skip drawing for other positions in the 3x3 area
        break;

      case "extra-rounded":
        // Draw single solid extra-rounded rectangle for entire 3x3 corner dot area
        // Only draw once at the top-left position of the corner dot
        const isTopLeftCornerDotExtraRounded = row === 2 && col === 2;
        const isTopRightCornerDotExtraRounded = row === 2 && col === moduleCount - 5;
        const isBottomLeftCornerDotExtraRounded = row === moduleCount - 5 && col === 2;

        if (
          isTopLeftCornerDotExtraRounded ||
          isTopRightCornerDotExtraRounded ||
          isBottomLeftCornerDotExtraRounded
        ) {
          // Draw solid 3x3 extra-rounded rectangle
          const fullAreaSize = size * 3;
          this.drawRoundedRect(
            x,
            y,
            fullAreaSize,
            fullAreaSize,
            size * 0.4
          );
        }
        // Skip drawing for other positions in the 3x3 area
        break;

      case "classy":
        // Draw single solid octagon for entire 3x3 corner dot area
        // Only draw once at the top-left position of the corner dot
        const isTopLeftCornerDotClassy = row === 2 && col === 2;
        const isTopRightCornerDotClassy = row === 2 && col === moduleCount - 5;
        const isBottomLeftCornerDotClassy = row === moduleCount - 5 && col === 2;

        if (
          isTopLeftCornerDotClassy ||
          isTopRightCornerDotClassy ||
          isBottomLeftCornerDotClassy
        ) {
          // Draw solid 3x3 octagon
          const fullAreaSize = size * 3;
          this.drawOctagon(x, y, fullAreaSize);
        }
        // Skip drawing for other positions in the 3x3 area
        break;

      default:
        this.ctx.fillRect(x, y, size, size);
    }

    this.ctx.restore();
  }

  drawRoundedRect(x, y, width, height, radius) {
    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(
      x + width,
      y + height,
      x + width - radius,
      y + height
    );
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
    this.ctx.fill();
  }

  drawOctagon(x, y, size) {
    const inset = size * 0.3;
    this.ctx.beginPath();
    this.ctx.moveTo(x + inset, y);
    this.ctx.lineTo(x + size - inset, y);
    this.ctx.lineTo(x + size, y + inset);
    this.ctx.lineTo(x + size, y + size - inset);
    this.ctx.lineTo(x + size - inset, y + size);
    this.ctx.lineTo(x + inset, y + size);
    this.ctx.lineTo(x, y + size - inset);
    this.ctx.lineTo(x, y + inset);
    this.ctx.closePath();
    this.ctx.fill();
  }

  drawLogo() {
    const logoSizePercent = this.config.logoSize / 100;
    const logoSize = this.config.canvasSize * logoSizePercent;
    const logoX = (this.config.canvasSize - logoSize) / 2;
    const logoY = (this.config.canvasSize - logoSize) / 2;

    // Draw background for logo using independent color
    this.ctx.fillStyle = this.config.logoBackgroundColor;
    this.ctx.fillRect(logoX - 10, logoY - 10, logoSize + 20, logoSize + 20);

    // Draw logo
    this.ctx.drawImage(this.logoImage, logoX, logoY, logoSize, logoSize);
  }

  // Context-aware wrapper methods for high-res rendering
  drawModuleToContext(ctx, x, y, size, row, col) {
    const originalCtx = this.ctx;
    this.ctx = ctx;
    this.drawModule(x, y, size, row, col);
    this.ctx = originalCtx;
  }

  drawCornerSquareToContext(ctx, x, y, size, row, col, moduleCount) {
    const originalCtx = this.ctx;
    const originalCanvasSize = this.config.canvasSize;
    this.ctx = ctx;
    this.config.canvasSize = ctx.canvas.width;
    this.drawCornerSquare(x, y, size, row, col, moduleCount);
    this.config.canvasSize = originalCanvasSize;
    this.ctx = originalCtx;
  }

  drawCornerDotToContext(ctx, x, y, size, row, col, moduleCount) {
    const originalCtx = this.ctx;
    const originalCanvasSize = this.config.canvasSize;
    this.ctx = ctx;
    this.config.canvasSize = ctx.canvas.width;
    this.drawCornerDot(x, y, size, row, col, moduleCount);
    this.config.canvasSize = originalCanvasSize;
    this.ctx = originalCtx;
  }

  drawLogoToContext(ctx, canvasSize) {
    const originalCtx = this.ctx;
    const originalCanvasSize = this.config.canvasSize;
    this.ctx = ctx;
    this.config.canvasSize = canvasSize;
    this.drawLogo();
    this.config.canvasSize = originalCanvasSize;
    this.ctx = originalCtx;
  }

  exportAs(format) {
    switch (format) {
      case "png":
        this.exportPNG();
        break;
      case "jpg":
        this.exportJPG();
        break;
      case "svg":
        this.exportSVG();
        break;
      case "pdf":
        this.exportPDF();
        break;
    }
  }

  exportPNG() {
    // Calculate high-resolution export size
    const exportSize = Math.round(this.config.exportSize * this.config.exportDPI);

    // Create temporary canvas for high-res rendering
    const exportCanvas = document.createElement("canvas");
    const exportCtx = exportCanvas.getContext("2d");

    // Render QR code at high resolution
    this.renderQRToCanvas(exportCanvas, exportCtx, exportSize, 0);

    // Export high-res canvas
    const link = document.createElement("a");
    link.download = "qrcode.png";
    link.href = exportCanvas.toDataURL("image/png");
    link.click();
  }

  exportJPG() {
    // Calculate high-resolution export size
    const exportSize = Math.round(this.config.exportSize * this.config.exportDPI);

    // Create temporary canvas for high-res rendering
    const exportCanvas = document.createElement("canvas");
    const exportCtx = exportCanvas.getContext("2d");

    // Render QR code at high resolution
    this.renderQRToCanvas(exportCanvas, exportCtx, exportSize, 0);

    // Export high-res canvas
    const link = document.createElement("a");
    link.download = "qrcode.jpg";
    link.href = exportCanvas.toDataURL("image/jpeg", 0.95);
    link.click();
  }

  exportSVG() {
    const moduleCount = this.qrData.getModuleCount();
    const cellSize =
      (this.config.canvasSize - 2 * this.config.margin) / moduleCount;

    let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${this.config.canvasSize}" height="${this.config.canvasSize}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${this.config.canvasSize}" height="${this.config.canvasSize}" fill="${this.config.backgroundColor}"/>
    <g>`;

    // Draw QR modules as SVG
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (this.qrData.isDark(row, col)) {
          const x = col * cellSize + this.config.margin;
          const y = row * cellSize + this.config.margin;

          const isCornerSquare = this.isCornerSquarePosition(
            row,
            col,
            moduleCount
          );
          const isCornerDot = this.isCornerDotPosition(row, col, moduleCount);

          let color = this.config.patternColor;
          if (isCornerSquare) {
            color = this.config.cornerSquareColor;
          } else if (isCornerDot) {
            color = this.config.cornerDotColor;
          }

          // Simple square for SVG export
          if (
            this.config.patternStyle === "dots" ||
            (isCornerDot && this.config.cornerDotStyle === "dot") ||
            (isCornerSquare && this.config.cornerSquareStyle === "dot")
          ) {
            svg += `\n        <circle cx="${x + cellSize / 2}" cy="${
              y + cellSize / 2
            }" r="${cellSize / 2}" fill="${color}"/>`;
          } else {
            const radius = cellSize * 0.2;
            svg += `\n        <rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="${radius}" fill="${color}"/>`;
          }
        }
      }
    }

    // Add logo if present
    if (this.logoImage) {
      const logoSizePercent = this.config.logoSize / 100;
      const logoSize = this.config.canvasSize * logoSizePercent;
      const logoX = (this.config.canvasSize - logoSize) / 2;
      const logoY = (this.config.canvasSize - logoSize) / 2;

      // Background for logo using independent color
      svg += `\n        <rect x="${logoX - 10}" y="${logoY - 10}" width="${
        logoSize + 20
      }" height="${logoSize + 20}" fill="${this.config.logoBackgroundColor}"/>`;
    }

    svg += "\n    </g>\n</svg>";

    // Download SVG
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = "qrcode.svg";
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }

  exportPDF() {
    // Check if jsPDF is available
    if (typeof window.jspdf === "undefined") {
      alert("PDF library not loaded. Please refresh the page and try again.");
      return;
    }

    // Calculate high-resolution export size
    const exportSize = Math.round(this.config.exportSize * this.config.exportDPI);

    // Create temporary canvas for high-res rendering
    const exportCanvas = document.createElement("canvas");
    const exportCtx = exportCanvas.getContext("2d");

    // Render QR code at high resolution
    this.renderQRToCanvas(exportCanvas, exportCtx, exportSize, 0);

    // Convert canvas to image data
    const imgData = exportCanvas.toDataURL("image/png");

    // Create PDF with proper dimensions
    // jsPDF dimensions are in mm by default
    const { jsPDF } = window.jspdf;
    const sizeInMM = this.config.exportSize * 25.4; // Convert inches to mm

    // Create square PDF with exact dimensions
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [sizeInMM, sizeInMM]
    });

    // Add image to PDF at full size (0,0 position, full width and height)
    pdf.addImage(imgData, "PNG", 0, 0, sizeInMM, sizeInMM);

    // Save the PDF
    pdf.save("qrcode.pdf");
  }
}

// Initialize the QR Code Generator when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new QRCodeGenerator();
});
