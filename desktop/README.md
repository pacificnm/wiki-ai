# Wiki AI Desktop App for macOS

A native macOS application wrapper for the Wiki AI web application using Electron.

## ✨ Features

- **Native macOS Integration**: Full native menu bar, keyboard shortcuts, and system integration
- **Secure**: Context isolation enabled, node integration disabled for security
- **Auto-updates**: Ready for automatic updates using electron-updater
- **Universal Binary**: Supports both Intel (x64) and Apple Silicon (arm64) Macs
- **Offline Capable**: Can work offline once the initial app is loaded

## 🚀 Quick Start

### Prerequisites
- Node.js 16 or later
- macOS 10.14 or later (for building)

### Development Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the React client:**
   ```bash
   ./build.sh
   ```

3. **Run in development mode** (on macOS):
   ```bash
   npm run electron-dev
   ```

### Building for Distribution

1. **Build the complete app:**
   ```bash
   npm run dist-mac
   ```

2. **Find your app:**
   The built application will be in the `dist` folder:
   - `Wiki AI-1.0.0.dmg` - Installer for distribution
   - `Wiki AI-1.0.0-mac.zip` - Compressed app for direct installation

## 📁 Project Structure

```
desktop/
├── main.js          # Main Electron process
├── preload.js       # Secure bridge between main and renderer
├── package.json     # App configuration and dependencies
├── build.sh         # Build script for convenience
├── assets/          # App icons and resources
├── build/           # Built React app (generated)
└── dist/            # Final packaged apps (generated)
```

## 🔧 Configuration

### App Icon
Place your app icon in `assets/icon.icns` (macOS) or `assets/icon.png` (fallback).

### App Settings
Modify `package.json` in the `build` section to customize:
- App ID and name
- Categories and descriptions
- Signing certificates (for distribution)
- Auto-update settings

## 🔐 Security Features

- **Context Isolation**: Renderer process is isolated from Node.js
- **No Node Integration**: Web content can't access Node.js APIs directly
- **External Link Handling**: Links open in system browser, not in app
- **Navigation Protection**: Prevents navigation to untrusted domains

## 📦 Distribution

The app is configured to build:
- **DMG Installer**: Professional installer with background image
- **ZIP Archive**: Direct app bundle for advanced users
- **Universal Binary**: Works on both Intel and Apple Silicon Macs

## 🛠 Development Tips

### Running with React Dev Server
The app automatically detects if you're in development mode and connects to `http://localhost:3000`.

### Debugging
- Development mode opens DevTools automatically
- Use `View > Toggle Developer Tools` in the app menu
- Console logs appear in the Electron terminal

### Building Issues
If the build fails:
1. Make sure the React client builds successfully first
2. Check that all dependencies are installed
3. Verify you're running on macOS for distribution builds

## 🚀 Deployment

For distribution outside the Mac App Store:
1. Get an Apple Developer ID certificate
2. Configure code signing in `package.json`
3. Run `npm run dist-mac`
4. Distribute the DMG file

For Mac App Store:
1. Get a Mac App Store certificate
2. Configure additional entitlements
3. Use `electron-builder` with MAS target

## 📋 TODO

- [ ] Add proper app icon (replace placeholder)
- [ ] Configure code signing for distribution
- [ ] Set up auto-updater server
- [ ] Add app-specific menu items
- [ ] Implement native notifications
- [ ] Add system tray integration (optional)

## 🐛 Troubleshooting

**App won't start:**
- Check if React dev server is running on port 3000
- Verify Node.js version compatibility
- Check console for error messages

**Build fails:**
- Ensure React client builds successfully first
- Check available disk space
- Verify all npm dependencies are installed

**Distribution issues:**
- Verify macOS version compatibility
- Check code signing configuration
- Ensure proper developer certificates
