const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Example: You can add methods here to communicate with the main process
  // getVersion: () => ipcRenderer.invoke('get-version'),
  // openExternal: (url) => ipcRenderer.invoke('open-external', url)
});

// Security: Remove node integration and prevent access to Node.js APIs
window.addEventListener('DOMContentLoaded', () => {
  // You can add any initialization code here that should run
  // when the DOM is ready in the renderer process
  console.log('Wiki AI Desktop App loaded');
});
