const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    backgroundColor: '#1e1e1e',
    title: "Security Lab: Advanced Analyzer",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      sandbox: false
    }
  });

  win.loadFile('index.html');
  // win.webContents.openDevTools(); // Hata ayıklamak istersen burayı açabilirsin
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});