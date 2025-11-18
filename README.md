# Advanced QR Code Generator

A feature-rich web-based QR code generator with extensive customization options.

## Features

### QR Code Customization

#### 6 Pattern Styles
- **Square**: Classic square patterns
- **Rounded**: Slightly rounded corners
- **Dots**: Circular dot patterns
- **Extra Rounded**: More pronounced rounded corners
- **Classy**: Octagonal patterns
- **Classy Rounded**: Rounded rectangles with extra rounding

#### 5 Corner Square Styles
- **Square**: Traditional square corners
- **Extra Rounded**: Highly rounded corner squares
- **Rounded**: Moderately rounded corners
- **Dot**: Circular corner squares
- **Classy**: Octagonal corner squares

#### 6 Corner Dot Styles
- **Square**: Square center dots
- **Dot**: Circular center dots
- **Diamond**: Diamond-shaped (rotated square) center dots
- **Rounded**: Rounded square center dots
- **Extra Rounded**: Highly rounded center dots
- **Classy**: Octagonal center dots

### Color Customization
- Pattern color picker
- Background color picker
- Corner square color picker
- Corner dot color picker

### Logo Support
- Upload custom logo images
- Adjustable logo size (10% - 40%)
- Centered logo placement with white background
- Easy logo removal

### Export Options
- **PNG**: High-quality PNG export
- **JPG**: JPEG export with 95% quality
- **SVG**: Vector format for scalability
- **PDF**: PDF export (currently uses PNG fallback)

### URL Encoding
- Input any website URL
- Real-time QR code generation
- Default URL: https://example.com

## Usage

### Getting Started

1. Open `index.html` in a modern web browser
2. Enter your desired URL in the "Website URL" field
3. Customize the QR code appearance using the various style options
4. Optionally upload a logo
5. Export the QR code in your preferred format

### Customizing Your QR Code

#### Pattern Style
Click on any of the 6 pattern styles to change how the QR code modules appear.

#### Colors
Use the color pickers to customize:
- Pattern color (the main QR code color)
- Background color
- Corner square color (the outer corner squares)
- Corner dot color (the center dots in corners)

#### Logo
1. Click "Choose File" under "Upload Logo"
2. Select an image file (PNG, JPG, etc.)
3. Adjust the logo size with the slider
4. Click "Remove Logo" to remove it

#### Exporting
Click any of the export buttons to download your QR code:
- **PNG**: Best for web use and general purposes
- **JPG**: Smaller file size, good for photos
- **SVG**: Perfect for print and scaling
- **PDF**: For document integration

## Technical Details

### Files
- `index.html`: Main HTML structure
- `style.css`: Complete styling and responsive design
- `qrcode.min.js`: QR code generation library
- `app.js`: Application logic and rendering
- `README.md`: This documentation

### Browser Compatibility
- Chrome (recommended)
- Firefox
- Safari
- Edge
- Any modern browser with HTML5 Canvas support

### Dependencies
- No external CDN dependencies
- All libraries included locally
- Pure JavaScript implementation

## Advanced Features

### Custom Rendering Engine
The QR code generator uses a custom rendering engine that:
- Detects corner positions automatically
- Applies different styles to different QR code regions
- Supports logo placement with automatic background
- Renders QR codes on HTML5 Canvas for high quality

### Error Correction
Uses High (H) error correction level, allowing up to 30% of the QR code to be damaged or obscured while still being readable.

## Future Enhancements

Potential additions:
- Gradient color support
- Animation effects
- Batch QR code generation
- More export formats
- QR code analytics
- Custom frames and borders

## License

Open source - feel free to use and modify.

## Support

For issues or questions, please create an issue in the repository.
