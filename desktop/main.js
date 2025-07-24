const http = require('http');
const path = require('path');
const { app, BrowserWindow, Menu, shell } = require('electron');
const express = require('express');

const isDev = process.env.ELECTRON_IS_DEV === 'true';

// Keep a global reference of the window object
let mainWindow;
let localServer;

function createLocalServer() {
  return new Promise((resolve, reject) => {
    const expressApp = express();
    const buildPath = path.join(__dirname, 'build');

    // Serve static files from build directory
    expressApp.use(express.static(buildPath));

    // Handle all routes by serving index.html (for SPA routing)
    expressApp.get('*', (req, res) => {
      res.sendFile(path.join(buildPath, 'index.html'));
    });

    // Start server on available port
    localServer = http.createServer(expressApp);
    localServer.listen(0, 'localhost', (err) => {
      if (err) {
        reject(err);
      } else {
        const port = localServer.address().port;
        console.log(`Local server running on http://localhost:${port}`);
        resolve(`http://localhost:${port}`);
      }
    });
  });
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    titleBarStyle: 'default',
    show: false
  });

  // Load the app
  if (isDev) {
    // Development mode - connect to development server
    console.log('Loading in development mode from http://localhost:3000');
    mainWindow.loadURL('http://localhost:3000');
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    // Production mode - start local server and load from there
    createLocalServer()
      .then((serverUrl) => {
        console.log('Loading in production mode from:', serverUrl);
        mainWindow.loadURL(serverUrl);
        // Open DevTools to debug
        mainWindow.webContents.openDevTools();
      })
      .catch((err) => {
        console.error('Failed to start local server:', err);
        // Fallback to file loading if server fails
        const indexPath = path.join(__dirname, 'build', 'index.html');
        mainWindow.loadFile(indexPath);
      });
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links and popups
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    const parsedUrl = new URL(url);

    // Allow Firebase Auth popups
    if (parsedUrl.hostname === 'accounts.google.com' ||
      parsedUrl.hostname === 'wiki-ai-production.firebaseapp.com' ||
      parsedUrl.hostname.includes('firebaseapp.com')) {
      console.log('Allowing Firebase Auth popup:', url);
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 500,
          height: 600,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: true
          }
        }
      };
    }

    // Open other external links in system browser
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Prevent navigation to external websites (except Firebase Auth)
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);

    // Allow localhost (dev server, local production server) and file:// (fallback)
    if (parsedUrl.origin === 'http://localhost:3000' ||
      parsedUrl.hostname === 'localhost' ||
      parsedUrl.origin === 'file://') {
      return; // Allow navigation
    }

    // Allow Firebase Auth domains
    if (parsedUrl.hostname === 'accounts.google.com' ||
      parsedUrl.hostname.includes('firebaseapp.com') ||
      parsedUrl.hostname.includes('googleapis.com')) {
      return; // Allow navigation
    }

    // Block all other external navigation
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
}

// Create application menu
function createMenu() {
  const template = [
    {
      label: 'Wiki AI',
      submenu: [
        {
          label: 'About Wiki AI',
          role: 'about'
        },
        {
          type: 'separator'
        },
        {
          label: 'Services',
          role: 'services',
          submenu: []
        },
        {
          type: 'separator'
        },
        {
          label: 'Hide Wiki AI',
          accelerator: 'Command+H',
          role: 'hide'
        },
        {
          label: 'Hide Others',
          accelerator: 'Command+Alt+H',
          role: 'hideothers'
        },
        {
          label: 'Show All',
          role: 'unhide'
        },
        {
          type: 'separator'
        },
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'CmdOrCtrl+Z',
          role: 'undo'
        },
        {
          label: 'Redo',
          accelerator: 'Shift+CmdOrCtrl+Z',
          role: 'redo'
        },
        {
          type: 'separator'
        },
        {
          label: 'Cut',
          accelerator: 'CmdOrCtrl+X',
          role: 'cut'
        },
        {
          label: 'Copy',
          accelerator: 'CmdOrCtrl+C',
          role: 'copy'
        },
        {
          label: 'Paste',
          accelerator: 'CmdOrCtrl+V',
          role: 'paste'
        },
        {
          label: 'Select All',
          accelerator: 'CmdOrCtrl+A',
          role: 'selectall'
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: (item, focusedWindow) => {
            if (focusedWindow) {
              focusedWindow.reload();
            }
          }
        },
        {
          label: 'Force Reload',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: (item, focusedWindow) => {
            if (focusedWindow) {
              focusedWindow.webContents.reloadIgnoringCache();
            }
          }
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
          click: (item, focusedWindow) => {
            if (focusedWindow) {
              focusedWindow.webContents.toggleDevTools();
            }
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'Actual Size',
          accelerator: 'CmdOrCtrl+0',
          click: (item, focusedWindow) => {
            if (focusedWindow) {
              focusedWindow.webContents.zoomLevel = 0;
            }
          }
        },
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+Plus',
          click: (item, focusedWindow) => {
            if (focusedWindow) {
              const currentZoom = focusedWindow.webContents.zoomLevel;
              focusedWindow.webContents.zoomLevel = currentZoom + 1;
            }
          }
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: (item, focusedWindow) => {
            if (focusedWindow) {
              const currentZoom = focusedWindow.webContents.zoomLevel;
              focusedWindow.webContents.zoomLevel = currentZoom - 1;
            }
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'Toggle Fullscreen',
          accelerator: process.platform === 'darwin' ? 'Ctrl+Command+F' : 'F11',
          click: (item, focusedWindow) => {
            if (focusedWindow) {
              focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
            }
          }
        }
      ]
    },
    {
      label: 'Window',
      submenu: [
        {
          label: 'Minimize',
          accelerator: 'CmdOrCtrl+M',
          role: 'minimize'
        },
        {
          label: 'Close',
          accelerator: 'CmdOrCtrl+W',
          role: 'close'
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            shell.openExternal('https://github.com/pacificnm/wiki-ai');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// App event handlers
app.whenReady().then(() => {
  createWindow();
  createMenu();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Close local server if running
  if (localServer) {
    localServer.close();
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});
