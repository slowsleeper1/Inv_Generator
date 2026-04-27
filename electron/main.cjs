var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// electron/main.ts
var import_electron2 = require("electron");
var import_path2 = __toESM(require("path"), 1);

// electron/db.ts
var import_better_sqlite3 = __toESM(require("better-sqlite3"), 1);
var import_path = __toESM(require("path"), 1);
var import_electron = require("electron");
var db;
function initDb() {
  const dbPath = import_path.default.join(import_electron.app.getPath("userData"), "luxebill.db");
  db = new import_better_sqlite3.default(dbPath);
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS guests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guest_id INTEGER NOT NULL,
      unit_name TEXT,
      check_in TEXT NOT NULL,
      check_out TEXT NOT NULL,
      nightly_rate REAL DEFAULT 0,
      cleaning_fee REAL DEFAULT 0,
      service_fee REAL DEFAULT 0,
      tax_rate REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      notes TEXT,
      status TEXT DEFAULT 'confirmed', -- confirmed, cancelled, completed
      payment_status TEXT DEFAULT 'unpaid', -- unpaid, paid
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reservation_id INTEGER NOT NULL,
      invoice_number TEXT UNIQUE NOT NULL,
      issue_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      total_amount REAL NOT NULL,
      snapshot_data TEXT NOT NULL, -- Full JSON snapshot for integrity
      status TEXT DEFAULT 'draft', -- draft, issued, partially_paid, paid
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      payment_date TEXT NOT NULL,
      method TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    );
  `);
  console.log(`Database initialized at ${dbPath}`);
  try {
    db.prepare("ALTER TABLE reservations ADD COLUMN unit_name TEXT").run();
  } catch (e) {
  }
}
var guestsApi = {
  create: (guest) => {
    const stmt = db.prepare("INSERT INTO guests (name, email, phone, address) VALUES (?, ?, ?, ?)");
    const info = stmt.run(guest.name, guest.email, guest.phone, guest.address);
    return info.lastInsertRowid;
  },
  update: (id, guest) => {
    const stmt = db.prepare("UPDATE guests SET name = ?, email = ?, phone = ?, address = ? WHERE id = ?");
    stmt.run(guest.name, guest.email, guest.phone, guest.address, id);
  },
  delete: (id) => {
    db.prepare("DELETE FROM guests WHERE id = ?").run(id);
  },
  list: () => db.prepare("SELECT * FROM guests ORDER BY name ASC").all(),
  getById: (id) => db.prepare("SELECT * FROM guests WHERE id = ?").get(id)
};
var reservationsApi = {
  create: (res) => {
    const conflict = db.prepare(`
      SELECT id FROM reservations 
      WHERE unit_name = ? 
      AND check_in < ? AND check_out > ? 
      AND status != 'cancelled'
    `).get(res.unit_name, res.check_out, res.check_in);
    if (conflict) {
      throw new Error(`Unit ${res.unit_name} is already booked for these dates.`);
    }
    const stmt = db.prepare(`
      INSERT INTO reservations (guest_id, unit_name, check_in, check_out, nightly_rate, cleaning_fee, service_fee, tax_rate, discount, notes, status, payment_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      res.guest_id,
      res.unit_name,
      res.check_in,
      res.check_out,
      res.nightly_rate,
      res.cleaning_fee,
      res.service_fee,
      res.tax_rate,
      res.discount,
      res.notes,
      res.status || "confirmed",
      res.payment_status || "unpaid"
    );
    return info.lastInsertRowid;
  },
  update: (id, res) => {
    const stmt = db.prepare(`
      UPDATE reservations 
      SET guest_id = ?, unit_name = ?, check_in = ?, check_out = ?, 
          nightly_rate = ?, cleaning_fee = ?, service_fee = ?, 
          tax_rate = ?, discount = ?, notes = ?, status = ?, payment_status = ?
      WHERE id = ?
    `);
    stmt.run(
      res.guest_id,
      res.unit_name,
      res.check_in,
      res.check_out,
      res.nightly_rate,
      res.cleaning_fee,
      res.service_fee,
      res.tax_rate,
      res.discount,
      res.notes,
      res.status,
      res.payment_status,
      id
    );
  },
  list: () => {
    return db.prepare(`
      SELECT 
        r.*, 
        g.name as guest_name, 
        g.email as guest_email,
        i.invoice_number,
        i.status as invoice_status,
        i.id as invoice_id
      FROM reservations r 
      JOIN guests g ON r.guest_id = g.id 
      LEFT JOIN invoices i ON i.reservation_id = r.id
      ORDER BY r.check_in DESC
    `).all();
  },
  updateStatus: (id, status) => {
    db.prepare("UPDATE reservations SET status = ? WHERE id = ?").run(status, id);
  },
  updatePaymentStatus: (id, status) => {
    db.prepare("UPDATE reservations SET payment_status = ? WHERE id = ?").run(status, id);
  },
  delete: (id) => {
    const tx = db.transaction((resId) => {
      const invoices = db.prepare("SELECT id FROM invoices WHERE reservation_id = ?").all(resId);
      for (const inv of invoices) {
        db.prepare("DELETE FROM payments WHERE invoice_id = ?").run(inv.id);
        db.prepare("DELETE FROM invoices WHERE id = ?").run(inv.id);
      }
      db.prepare("DELETE FROM reservations WHERE id = ?").run(resId);
    });
    tx(id);
  },
  getById: (id) => {
    return db.prepare(`
      SELECT r.*, g.name as guest_name, g.email as guest_email, g.address as guest_address, g.phone as guest_phone
      FROM reservations r 
      JOIN guests g ON r.guest_id = g.id 
      WHERE r.id = ?
    `).get(id);
  }
};
var invoicesApi = {
  create: (invoice) => {
    const stmt = db.prepare(`
      INSERT INTO invoices (reservation_id, invoice_number, issue_date, due_date, total_amount, snapshot_data, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      invoice.reservation_id,
      invoice.invoice_number,
      invoice.issue_date,
      invoice.due_date,
      invoice.total_amount,
      typeof invoice.snapshot_data === "string" ? invoice.snapshot_data : JSON.stringify(invoice.snapshot_data),
      invoice.status || "draft"
    );
    return info.lastInsertRowid;
  },
  getNextNumber: () => {
    const result = db.prepare("SELECT invoice_number FROM invoices ORDER BY id DESC LIMIT 1").get();
    if (!result) return "INV-1001";
    const lastNum = result.invoice_number;
    const match = lastNum.match(/\d+$/);
    if (match) {
      const nextNum = parseInt(match[0]) + 1;
      return lastNum.replace(/\d+$/, nextNum.toString());
    }
    return lastNum + "-1";
  },
  list: () => {
    return db.prepare(`
      SELECT i.*, r.check_in, r.check_out, r.status as res_status, g.name as guest_name 
      FROM invoices i 
      JOIN reservations r ON i.reservation_id = r.id 
      JOIN guests g ON r.guest_id = g.id 
      ORDER BY i.created_at DESC
    `).all();
  },
  getByReservationId: (resId) => {
    return db.prepare("SELECT * FROM invoices WHERE reservation_id = ?").get(resId);
  },
  getById: (id) => {
    const inv = db.prepare("SELECT * FROM invoices WHERE id = ?").get(id);
    if (inv) inv.snapshot_data = JSON.parse(inv.snapshot_data);
    return inv;
  },
  update: (id, invoice) => {
    const stmt = db.prepare(`
      UPDATE invoices 
      SET reservation_id = ?, invoice_number = ?, issue_date = ?, due_date = ?, total_amount = ?, snapshot_data = ?, status = ?
      WHERE id = ?
    `);
    stmt.run(
      invoice.reservation_id,
      invoice.invoice_number,
      invoice.issue_date,
      invoice.due_date,
      invoice.total_amount,
      typeof invoice.snapshot_data === "string" ? invoice.snapshot_data : JSON.stringify(invoice.snapshot_data),
      invoice.status,
      id
    );
  },
  updateStatus: (id, status) => {
    db.prepare("UPDATE invoices SET status = ? WHERE id = ?").run(status, id);
  },
  delete: (id) => {
    db.prepare("DELETE FROM payments WHERE invoice_id = ?").run(id);
    db.prepare("DELETE FROM invoices WHERE id = ?").run(id);
  }
};
var paymentsApi = {
  add: (payment) => {
    const tx = db.transaction((p) => {
      const invoice = invoicesApi.getById(p.invoice_id);
      if (!invoice) throw new Error("Invoice not found");
      const res = db.prepare("SELECT status FROM reservations WHERE id = ?").get(invoice.reservation_id);
      if (invoice.status === "cancelled" || res && res.status === "cancelled") {
        throw new Error("Cannot add payment to a cancelled booking.");
      }
      const stmt = db.prepare("INSERT INTO payments (invoice_id, amount, payment_date, method, notes) VALUES (?, ?, ?, ?, ?)");
      const info = stmt.run(p.invoice_id, p.amount, p.payment_date, p.method, p.notes);
      const payments = db.prepare("SELECT SUM(amount) as total FROM payments WHERE invoice_id = ?").get(p.invoice_id);
      const totalPaid = payments.total || 0;
      let newStatus = "partially_paid";
      if (totalPaid >= invoice.total_amount) {
        newStatus = "paid";
      } else if (totalPaid === 0) {
        newStatus = "issued";
      }
      invoicesApi.updateStatus(p.invoice_id, newStatus);
      return info.lastInsertRowid;
    });
    return tx(payment);
  },
  getByInvoiceId: (invoiceId) => {
    return db.prepare("SELECT * FROM payments WHERE invoice_id = ? ORDER BY payment_date DESC").all(invoiceId);
  }
};
var statsApi = {
  getMonthlyRevenue: () => {
    return db.prepare(`
      SELECT 
        strftime('%Y-%m', p.payment_date) as month,
        SUM(p.amount) as revenue,
        COUNT(DISTINCT p.invoice_id) as invoice_count
      FROM payments p
      JOIN invoices i ON p.invoice_id = i.id
      JOIN reservations r ON i.reservation_id = r.id
      WHERE LOWER(r.status) != 'cancelled'
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `).all();
  },
  getUnitRevenue: () => {
    return db.prepare(`
      SELECT 
        r.unit_name,
        SUM(p.amount) as revenue,
        SUM(
          (MAX(0, (r.nightly_rate * MAX(1, CAST(julianday(r.check_out) - julianday(r.check_in) AS INTEGER)) + r.cleaning_fee + r.service_fee) - r.discount)) * (1 + r.tax_rate / 100)
        ) as potential_revenue,
        COUNT(r.id) as booking_count
      FROM reservations r
      LEFT JOIN invoices i ON i.reservation_id = r.id
      LEFT JOIN payments p ON p.invoice_id = i.id
      WHERE LOWER(r.status) != 'cancelled'
      GROUP BY r.unit_name
      ORDER BY revenue DESC
    `).all();
  },
  getStatsSummary: () => {
    const totalRevenue = db.prepare(`
      SELECT SUM(p.amount) as total 
      FROM payments p
      JOIN invoices i ON p.invoice_id = i.id
      JOIN reservations r ON i.reservation_id = r.id
      WHERE LOWER(r.status) != 'cancelled'
    `).get();
    const invoicedUnpaid = db.prepare(`
      SELECT SUM(i.total_amount) as total 
      FROM invoices i
      JOIN reservations r ON i.reservation_id = r.id
      WHERE LOWER(i.status) NOT IN ('paid', 'cancelled')
      AND LOWER(r.status) != 'cancelled'
    `).get();
    const uninvoicedConfirmedUnpaid = db.prepare(`
      SELECT SUM(
        (
          MAX(0, (nightly_rate * MAX(1, CAST(julianday(check_out) - julianday(check_in) AS INTEGER)) + cleaning_fee + service_fee) - discount)
        ) * (1 + tax_rate / 100)
      ) as total
      FROM reservations 
      WHERE LOWER(status) = 'confirmed' 
        AND LOWER(payment_status) = 'unpaid' 
        AND id NOT IN (SELECT reservation_id FROM invoices WHERE reservation_id IS NOT NULL)
    `).get();
    const guestCount = db.prepare("SELECT COUNT(*) as count FROM guests").get();
    const activeReservations = db.prepare("SELECT COUNT(*) as count FROM reservations WHERE LOWER(status) = 'confirmed'").get();
    const cancelledStats = db.prepare(`
      SELECT 
        COUNT(r.id) as count,
        SUM(COALESCE(i.total_amount, 
          (MAX(0, (r.nightly_rate * MAX(1, CAST(julianday(r.check_out) - julianday(r.check_in) AS INTEGER)) + r.cleaning_fee + r.service_fee) - r.discount)) * (1 + r.tax_rate / 100)
        )) as amount
      FROM reservations r
      LEFT JOIN invoices i ON i.reservation_id = r.id
      WHERE LOWER(r.status) = 'cancelled'
    `).get();
    const totalOutstanding = (invoicedUnpaid?.total || 0) + (uninvoicedConfirmedUnpaid?.total || 0);
    return {
      totalRevenue: totalRevenue?.total || 0,
      unpaidInvoices: totalOutstanding,
      guestCount: guestCount?.count || 0,
      activeReservations: activeReservations?.count || 0,
      cancelledCount: cancelledStats?.count || 0,
      cancelledAmount: cancelledStats?.amount || 0
    };
  }
};

// electron/main.ts
function createWindow() {
  const win = new import_electron2.BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 12, y: 12 },
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: import_path2.default.join(__dirname, "preload.cjs")
    }
  });
  const isDev = !import_electron2.app.isPackaged;
  if (isDev) {
    win.loadURL("http://localhost:3000");
    win.webContents.openDevTools();
  } else {
    win.loadFile(import_path2.default.join(__dirname, "../dist/index.html"));
  }
}
import_electron2.app.whenReady().then(() => {
  initDb();
  createWindow();
  import_electron2.ipcMain.handle("guests:create", (event, guest) => guestsApi.create(guest));
  import_electron2.ipcMain.handle("guests:list", () => guestsApi.list());
  import_electron2.ipcMain.handle("guests:update", (event, id, guest) => guestsApi.update(id, guest));
  import_electron2.ipcMain.handle("guests:delete", (event, id) => guestsApi.delete(id));
  import_electron2.ipcMain.handle("reservations:create", (event, res) => reservationsApi.create(res));
  import_electron2.ipcMain.handle("reservations:update", (event, id, res) => reservationsApi.update(id, res));
  import_electron2.ipcMain.handle("reservations:delete", (event, id) => reservationsApi.delete(id));
  import_electron2.ipcMain.handle("reservations:list", () => reservationsApi.list());
  import_electron2.ipcMain.handle("reservations:updateStatus", (event, id, status) => reservationsApi.updateStatus(id, status));
  import_electron2.ipcMain.handle("reservations:updatePaymentStatus", (event, id, status) => reservationsApi.updatePaymentStatus(id, status));
  import_electron2.ipcMain.handle("reservations:getById", (event, id) => reservationsApi.getById(id));
  import_electron2.ipcMain.handle("invoices:create", (event, inv) => invoicesApi.create(inv));
  import_electron2.ipcMain.handle("invoices:update", (event, id, inv) => invoicesApi.update(id, inv));
  import_electron2.ipcMain.handle("invoices:updateStatus", (event, id, status) => invoicesApi.updateStatus(id, status));
  import_electron2.ipcMain.handle("invoices:list", () => invoicesApi.list());
  import_electron2.ipcMain.handle("invoices:getById", (event, id) => invoicesApi.getById(id));
  import_electron2.ipcMain.handle("invoices:getNextNumber", () => invoicesApi.getNextNumber());
  import_electron2.ipcMain.handle("invoices:getByReservationId", (event, id) => invoicesApi.getByReservationId(id));
  import_electron2.ipcMain.handle("invoices:delete", (event, id) => invoicesApi.delete(id));
  import_electron2.ipcMain.handle("payments:add", (event, pay) => paymentsApi.add(pay));
  import_electron2.ipcMain.handle("payments:getByInvoiceId", (event, id) => paymentsApi.getByInvoiceId(id));
  import_electron2.ipcMain.handle("stats:getMonthlyRevenue", () => statsApi.getMonthlyRevenue());
  import_electron2.ipcMain.handle("stats:getUnitRevenue", () => statsApi.getUnitRevenue());
  import_electron2.ipcMain.handle("stats:getSummary", () => statsApi.getStatsSummary());
  import_electron2.app.on("activate", () => {
    if (import_electron2.BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
import_electron2.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    import_electron2.app.quit();
  }
});
