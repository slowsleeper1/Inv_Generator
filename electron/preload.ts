import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  guests: {
    create: (guest: any) => ipcRenderer.invoke('guests:create', guest),
    list: () => ipcRenderer.invoke('guests:list'),
    update: (id: number, guest: any) => ipcRenderer.invoke('guests:update', id, guest),
    delete: (id: number) => ipcRenderer.invoke('guests:delete', id),
  },
  reservations: {
    create: (res: any) => ipcRenderer.invoke('reservations:create', res),
    update: (id: number, res: any) => ipcRenderer.invoke('reservations:update', id, res),
    delete: (id: number) => ipcRenderer.invoke('reservations:delete', id),
    list: () => ipcRenderer.invoke('reservations:list'),
    updateStatus: (id: number, status: string) => ipcRenderer.invoke('reservations:updateStatus', id, status),
    updatePaymentStatus: (id: number, status: string) => ipcRenderer.invoke('reservations:updatePaymentStatus', id, status),
    getById: (id: number) => ipcRenderer.invoke('reservations:getById', id),
  },
  invoices: {
    create: (inv: any) => ipcRenderer.invoke('invoices:create', inv),
    update: (id: number, inv: any) => ipcRenderer.invoke('invoices:update', id, inv),
    updateStatus: (id: number, status: string) => ipcRenderer.invoke('invoices:updateStatus', id, status),
    list: () => ipcRenderer.invoke('invoices:list'),
    getNextNumber: () => ipcRenderer.invoke('invoices:getNextNumber'),
    getById: (id: number) => ipcRenderer.invoke('invoices:getById', id),
    getByReservationId: (id: number) => ipcRenderer.invoke('invoices:getByReservationId', id),
    delete: (id: number) => ipcRenderer.invoke('invoices:delete', id),
  },
  payments: {
    add: (pay: any) => ipcRenderer.invoke('payments:add', pay),
    getByInvoiceId: (id: number) => ipcRenderer.invoke('payments:getByInvoiceId', id),
  },
  stats: {
    getMonthlyRevenue: () => ipcRenderer.invoke('stats:getMonthlyRevenue'),
    getUnitRevenue: () => ipcRenderer.invoke('stats:getUnitRevenue'),
    getSummary: () => ipcRenderer.invoke('stats:getSummary'),
  }
});

// Also keep the existing 'electron' object if needed, but the user requested 'api' specifically
contextBridge.exposeInMainWorld('electron', {
// ... existing or just remove if not used elsewhere
});
