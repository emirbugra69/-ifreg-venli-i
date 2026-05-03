const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    backgroundColor: '#1e1e1e',
    title: "Security Lab: Advanced Analyzer",
    webPreferences: {
      nodeIntegration: false,      // FIX: Güvenlik için false
      contextIsolation: true,      // FIX: Güvenlik için true
      sandbox: true,               // FIX: Güvenlik için true
      preload: path.join(__dirname, 'preload.js')  // FIX: Preload eklendi
    }
  });

  win.loadFile('index.html');
  // win.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
