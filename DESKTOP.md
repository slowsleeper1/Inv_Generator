# LuxeBill Desktop Build Instructions

LuxeBill is architected to run both in the browser and as a native desktop application for macOS and Windows.

## 1. Local Development
To run LuxeBill locally in your development environment:

```bash
# Install dependencies
npm install

# Run the web version
npm run dev

# Run the Electron desktop version (requires Node.js)
npm run electron:dev
```

## 2. Packaging for Desktop
To generate the production-ready installers (.dmg for Mac, .exe for Windows):

```bash
# Build the React app and package into Electron
npm run electron:build
```

The output will be found in the `dist_electron` directory (or as defined by `electron-builder`).

## 3. High-Fidelity Icons
The application includes a professional SVG icon at `/public/icon.svg`. For production packaging, you may want to convert this to specific platform formats:

- **macOS:** Convert to `.icns`
- **Windows:** Convert to `.ico`

You can use online tools like [CloudConvert](https://cloudconvert.com/svg-to-ico) or command-line utilities like `iconutil`.

## 4. Key Features
- **Persistence:** All business and invoice data is saved locally using `localStorage`.
- **Exporting:** High-resolution exports using `html2canvas` for PNGs and `jsPDF` for print-ready documents.
- **Theming:** Full support for Dark/Light mode, with automatic system detection.

## 5. Security Note
This application uses a secure Electron Preload script to isolate the renderer process from Node.js APIs, following desktop development best-practices.
