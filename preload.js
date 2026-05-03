const { contextBridge, ipcRenderer } = require('electron');

// Renderer'a güvenli API'ları expose et
contextBridge.exposeInMainWorld('securityAPI', {
  // HIBP kontrolü için fetch kullan (renderer'dan doğrudan fetch yapabilir)
  // Ancak CORS yok, HIBP API'si CORS'a izin veriyor, direkt fetch çalışır.
  // Sadece eksposure gerekli değil aslında, fetch zaten var.
  // Bu dosya boş olabilir ama preload gerektiği için var.
  
  // İleride ek özellikler için yer tutucu
  platform: process.platform
});
