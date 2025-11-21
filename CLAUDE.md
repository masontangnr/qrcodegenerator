# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a client-side web application that generates highly customizable QR codes with advanced styling options. The application is built with vanilla JavaScript and uses the HTML5 Canvas API for rendering. It's a static web application with no build process or backend dependencies.

## Architecture

### Core Components

**QRCodeGenerator Class** (`app.js`): The main application controller that manages:
- QR code generation and rendering
- User interface event handling
- Canvas-based custom rendering engine
- Export functionality for multiple formats

**Custom Rendering Engine**: The application implements a sophisticated rendering system that:
- Uses the `qrcode.min.js` library to generate QR code data matrices
- Manually renders each module on HTML5 Canvas with custom styling
- Detects and applies different styles to three QR code regions:
  - **Corner Squares**: The outer 7x7 positioning patterns (excluding center dots)
  - **Corner Dots**: The 3x3 center dots within positioning patterns
  - **Data Modules**: All other QR code modules
- Functions `isCornerSquarePosition()` and `isCornerDotPosition()` in `app.js` handle region detection

### Rendering Pipeline

1. User input triggers `generateQRCode()` which creates QR data using the external library
2. `drawQRCode()` iterates through the QR code matrix
3. For each dark module, the renderer determines its region type and applies the appropriate style
4. Logo overlay (if present) is drawn last with a white background padding

### Styling System

The application supports extensive style combinations:
- 7 pattern styles for data modules (square, rounded, dots, extra-rounded, classy, classy-rounded, diamond)
- 5 corner square styles (square, rounded, extra-rounded, dot, classy)
- 6 corner dot styles (square, dot, diamond, rounded, extra-rounded, classy)
- Individual color control for each region type

Style rendering is handled by dedicated methods:
- `drawModule()`: Renders data modules with pattern styles (includes diamond pattern support)
- `drawCornerSquare()`: Renders outer corner positioning patterns as solid frames (draws once at corner origin)
- `drawCornerDot()`: Renders inner corner dots as solid frames (draws once at center dot origin)
- Helper methods: `drawRoundedRect()`, `drawOctagon()`

**Important rendering optimization**: Corner squares and corner dots are now rendered as complete 7x7 and 3x3 solid frames respectively, drawn only once at the origin position of each corner region, rather than individual modules. This provides cleaner, more consistent styling.

## Development

### Running the Application

Simply open `index.html` in a web browser. No build process, server, or dependencies installation required.

For local development with live reload:
```bash
# Use any static file server, for example:
python -m http.server 8000
# or
npx serve
```

### File Structure

- `index.html`: HTML structure with controls panel and canvas preview
- `style.css`: All styling including responsive design
- `app.js`: Complete application logic (~805 lines)
- `qrcode.min.js`: Third-party QR code data generation library
- `README.md`: User-facing documentation

### Configuration Object

The `config` object in the `QRCodeGenerator` class stores all current settings:
```javascript
{
    url: string,                    // URL to encode
    patternStyle: string,           // Main pattern style
    patternColor: string,           // Hex color
    backgroundColor: string,        // Hex color
    cornerSquareStyle: string,      // Corner square style
    cornerSquareColor: string,      // Hex color
    cornerDotStyle: string,         // Corner dot style
    cornerDotColor: string,         // Hex color
    logoSize: number,               // Percentage (10-40)
    canvasSize: number,             // Fixed at 300px
    margin: number                  // Fixed at 0
}
```

## Export Formats

- **PNG/JPG**: Uses Canvas `toDataURL()` API
- **SVG**: Manually constructs SVG XML with simplified shapes (circles and rounded rects)
- **PDF**: Currently shows alert and falls back to PNG export (placeholder for jsPDF integration)

Note: SVG export simplifies some shapes - dots render as circles, other styles as rounded rectangles.

## Important Implementation Details

### QR Code Error Correction

The application uses High (H) level error correction (`ErrorCorrectionLevel.H`), allowing up to 30% damage/occlusion. This is critical for logo placement functionality.

### Logo Rendering

Logos are rendered with:
- White background padding (10px on all sides)
- Centered placement
- Size range: 10-40% of total canvas size
- Background uses the same color as QR code background for consistency

### Corner Detection Algorithm

The positioning patterns occupy:
- Top-left: rows 0-6, cols 0-6
- Top-right: rows 0-6, cols (moduleCount-7) to (moduleCount-1)
- Bottom-left: rows (moduleCount-7) to (moduleCount-1), cols 0-6

Within each 7x7 pattern, the center 3x3 (rows/cols 2-4 relative to corner start) is treated as the corner dot.

## Testing

No automated tests exist. Manual testing workflow:
1. Open `index.html` in browser
2. Test each pattern style combination
3. Test color pickers
4. Test logo upload and size adjustment
5. Test all export formats
6. Verify QR codes scan correctly with a QR scanner app

## Potential Enhancements

When extending the application, consider:
- The rendering engine is tightly coupled to Canvas API - SVG export has simplified rendering
- Adding new pattern styles requires implementing draw logic in `drawModule()`, `drawCornerSquare()`, or `drawCornerDot()`
- Export formats that need proper PDF support should integrate the jsPDF library
- Logo embedding reduces QR code redundancy - test with actual scanners when changing error correction levels
