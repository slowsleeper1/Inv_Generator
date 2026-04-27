// electron/preload.ts
var import_electron = require("electron");
import_electron.contextBridge.exposeInMainWorld("api", {
  guests: {
    create: (guest) => import_electron.ipcRenderer.invoke("guests:create", guest),
    list: () => import_electron.ipcRenderer.invoke("guests:list"),
    update: (id, guest) => import_electron.ipcRenderer.invoke("guests:update", id, guest),
    delete: (id) => import_electron.ipcRenderer.invoke("guests:delete", id)
  },
  reservations: {
    create: (res) => import_electron.ipcRenderer.invoke("reservations:create", res),
    update: (id, res) => import_electron.ipcRenderer.invoke("reservations:update", id, res),
    delete: (id) => import_electron.ipcRenderer.invoke("reservations:delete", id),
    list: () => import_electron.ipcRenderer.invoke("reservations:list"),
    updateStatus: (id, status) => import_electron.ipcRenderer.invoke("reservations:updateStatus", id, status),
    updatePaymentStatus: (id, status) => import_electron.ipcRenderer.invoke("reservations:updatePaymentStatus", id, status),
    getById: (id) => import_electron.ipcRenderer.invoke("reservations:getById", id)
  },
  invoices: {
    create: (inv) => import_electron.ipcRenderer.invoke("invoices:create", inv),
    update: (id, inv) => import_electron.ipcRenderer.invoke("invoices:update", id, inv),
    updateStatus: (id, status) => import_electron.ipcRenderer.invoke("invoices:updateStatus", id, status),
    list: () => import_electron.ipcRenderer.invoke("invoices:list"),
    getNextNumber: () => import_electron.ipcRenderer.invoke("invoices:getNextNumber"),
    getById: (id) => import_electron.ipcRenderer.invoke("invoices:getById", id),
    getByReservationId: (id) => import_electron.ipcRenderer.invoke("invoices:getByReservationId", id),
    delete: (id) => import_electron.ipcRenderer.invoke("invoices:delete", id)
  },
  payments: {
    add: (pay) => import_electron.ipcRenderer.invoke("payments:add", pay),
    getByInvoiceId: (id) => import_electron.ipcRenderer.invoke("payments:getByInvoiceId", id)
  },
  stats: {
    getMonthlyRevenue: () => import_electron.ipcRenderer.invoke("stats:getMonthlyRevenue"),
    getUnitRevenue: () => import_electron.ipcRenderer.invoke("stats:getUnitRevenue"),
    getSummary: () => import_electron.ipcRenderer.invoke("stats:getSummary")
  }
});
import_electron.contextBridge.exposeInMainWorld("electron", {
  // ... existing or just remove if not used elsewhere
});
