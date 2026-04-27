import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { initDb, guestsApi, reservationsApi, invoicesApi, paymentsApi, statsApi } from './db';

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 12, y: 12 },
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  const isDev = !app.isPackaged;

  if (isDev) {
    win.loadURL('http://localhost:3000');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  initDb();
  createWindow();

  // IPC Handlers
  ipcMain.handle('guests:create', (event, guest) => guestsApi.create(guest));
  ipcMain.handle('guests:list', () => guestsApi.list());
  ipcMain.handle('guests:update', (event, id, guest) => guestsApi.update(id, guest));
  ipcMain.handle('guests:delete', (event, id) => guestsApi.delete(id));
  
  ipcMain.handle('reservations:create', (event, res) => reservationsApi.create(res));
  ipcMain.handle('reservations:update', (event, id, res) => reservationsApi.update(id, res));
  ipcMain.handle('reservations:delete', (event, id) => reservationsApi.delete(id));
  ipcMain.handle('reservations:list', () => reservationsApi.list());
  ipcMain.handle('reservations:updateStatus', (event, id, status) => reservationsApi.updateStatus(id, status));
  ipcMain.handle('reservations:updatePaymentStatus', (event, id, status) => reservationsApi.updatePaymentStatus(id, status));
  ipcMain.handle('reservations:getById', (event, id) => reservationsApi.getById(id));
  
  ipcMain.handle('invoices:create', (event, inv) => invoicesApi.create(inv));
  ipcMain.handle('invoices:update', (event, id, inv) => invoicesApi.update(id, inv));
  ipcMain.handle('invoices:updateStatus', (event, id, status) => invoicesApi.updateStatus(id, status));
  ipcMain.handle('invoices:list', () => invoicesApi.list());
  ipcMain.handle('invoices:getById', (event, id) => invoicesApi.getById(id));
  ipcMain.handle('invoices:getNextNumber', () => invoicesApi.getNextNumber());
  ipcMain.handle('invoices:getByReservationId', (event, id) => invoicesApi.getByReservationId(id));
  ipcMain.handle('invoices:delete', (event, id) => invoicesApi.delete(id));
  
  ipcMain.handle('payments:add', (event, pay) => paymentsApi.add(pay));
  ipcMain.handle('payments:getByInvoiceId', (event, id) => paymentsApi.getByInvoiceId(id));

  ipcMain.handle('stats:getMonthlyRevenue', () => statsApi.getMonthlyRevenue());
  ipcMain.handle('stats:getUnitRevenue', () => statsApi.getUnitRevenue());
  ipcMain.handle('stats:getSummary', () => statsApi.getStatsSummary());

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
