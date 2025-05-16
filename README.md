# cookiedoh

## Chrome Extension for Cookie Visualization

**cookiedoh** is a Chrome extension that visualizes cookie tracking across websites to improve user privacy awareness. It provides interactive graphs and detailed statistics about cookies set by the sites you visit—all processed locally for maximum privacy.

---

## Features
- **Visualize Cookies:** See a real-time, interactive graph of cookies grouped by domain and type (first-party, third-party, secure, etc.), implemented with vanilla JavaScript and CSS.
- **Detailed Stats:** Breakdown of cookie attributes (location tracking, session vs persistent, SameSite, etc.)
- **Search:** Instantly filter cookies by name
- **Privacy-First:** All data is processed and visualized locally. No information is sent externally.

---

## Usage
1. **Load the extension in Chrome:**
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select this project directory
2. **Open the extension popup** while browsing any site to see cookies visualized and analyzed in real time.

---

## Technologies Used
- **Chrome Extension API**
- **JavaScript**
- **Vanilla JavaScript & CSS** (for interactive graph visualization)
- **Bootstrap** (for UI styling)

---

## Privacy Statement
This extension does **not** transmit or share any browsing or cookie data. All analysis and visualization happens locally in your browser for maximum privacy.

---

## Developers
- Truman Thomas
- Bryce Richmond
- Josh Bishop

### Local Development
- All dependencies are managed via npm. Run `npm install` if you add new packages.
- Main files:
  - `popup.js`, `popup.html`: UI and visualization
  - `bubbles.js`, `bubbles.html`: Visualization components implemented with vanilla JavaScript and CSS
  - `descriptions.js`, `descriptions.html`: Explanations and help
  - `manifest.json`: Chrome extension manifest
  - `index.js`, `index.css`: (Optional) Shared logic and styles

---

## License
MIT License. See LICENSE file for details.