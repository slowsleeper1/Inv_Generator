import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

let db: Database.Database;

export function initDb() {
  const dbPath = path.join(app.getPath('userData'), 'luxebill.db');
  db = new Database(dbPath);
  db.pragma('foreign_keys = ON');

  // Schema creation
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

  // Migrations
  try {
    db.prepare("ALTER TABLE reservations ADD COLUMN unit_name TEXT").run();
  } catch (e) {
    // Column probably already exists or table doesn't exist
  }
}

// GUESTS API
export const guestsApi = {
  create: (guest: any) => {
    const stmt = db.prepare('INSERT INTO guests (name, email, phone, address) VALUES (?, ?, ?, ?)');
    const info = stmt.run(guest.name, guest.email, guest.phone, guest.address);
    return info.lastInsertRowid;
  },
  update: (id: number, guest: any) => {
    const stmt = db.prepare('UPDATE guests SET name = ?, email = ?, phone = ?, address = ? WHERE id = ?');
    stmt.run(guest.name, guest.email, guest.phone, guest.address, id);
  },
  delete: (id: number) => {
    db.prepare('DELETE FROM guests WHERE id = ?').run(id);
  },
  list: () => db.prepare('SELECT * FROM guests ORDER BY name ASC').all(),
  getById: (id: number) => db.prepare('SELECT * FROM guests WHERE id = ?').get(id)
};

// RESERVATIONS API
export const reservationsApi = {
  create: (res: any) => {
    // Basic conflict detection (overlap check) - Scoped to the specific unit
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
      res.guest_id, res.unit_name, res.check_in, res.check_out, 
      res.nightly_rate, res.cleaning_fee, res.service_fee, 
      res.tax_rate, res.discount, res.notes, res.status || 'confirmed', res.payment_status || 'unpaid'
    );
    return info.lastInsertRowid;
  },
  update: (id: number, res: any) => {
    const stmt = db.prepare(`
      UPDATE reservations 
      SET guest_id = ?, unit_name = ?, check_in = ?, check_out = ?, 
          nightly_rate = ?, cleaning_fee = ?, service_fee = ?, 
          tax_rate = ?, discount = ?, notes = ?, status = ?, payment_status = ?
      WHERE id = ?
    `);
    stmt.run(
      res.guest_id, res.unit_name, res.check_in, res.check_out,
      res.nightly_rate, res.cleaning_fee, res.service_fee,
      res.tax_rate, res.discount, res.notes, res.status, res.payment_status, id
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
  updateStatus: (id: number, status: string) => {
    db.prepare('UPDATE reservations SET status = ? WHERE id = ?').run(status, id);
  },
  updatePaymentStatus: (id: number, status: string) => {
    db.prepare('UPDATE reservations SET payment_status = ? WHERE id = ?').run(status, id);
  },
  delete: db.transaction((id: number) => {
    const invoices: any = db.prepare('SELECT id FROM invoices WHERE reservation_id = ?').all(id);
    for (const inv of invoices) {
      db.prepare('DELETE FROM payments WHERE invoice_id = ?').run(inv.id);
      db.prepare('DELETE FROM invoices WHERE id = ?').run(inv.id);
    }
    db.prepare('DELETE FROM reservations WHERE id = ?').run(id);
  }),
  getById: (id: number) => {
    return db.prepare(`
      SELECT r.*, g.name as guest_name, g.email as guest_email, g.address as guest_address, g.phone as guest_phone
      FROM reservations r 
      JOIN guests g ON r.guest_id = g.id 
      WHERE r.id = ?
    `).get(id);
  }
};

// INVOICES API
export const invoicesApi = {
  create: (invoice: any) => {
    const stmt = db.prepare(`
      INSERT INTO invoices (reservation_id, invoice_number, issue_date, due_date, total_amount, snapshot_data, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      invoice.reservation_id, invoice.invoice_number, 
      invoice.issue_date, invoice.due_date, 
      invoice.total_amount, 
      typeof invoice.snapshot_data === 'string' ? invoice.snapshot_data : JSON.stringify(invoice.snapshot_data),
      invoice.status || 'draft'
    );
    return info.lastInsertRowid;
  },
  getNextNumber: () => {
    const result: any = db.prepare('SELECT invoice_number FROM invoices ORDER BY id DESC LIMIT 1').get();
    if (!result) return 'INV-1001';
    
    const lastNum = result.invoice_number;
    const match = lastNum.match(/\d+$/);
    if (match) {
      const nextNum = parseInt(match[0]) + 1;
      return lastNum.replace(/\d+$/, nextNum.toString());
    }
    return lastNum + '-1';
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
  getByReservationId: (resId: number) => {
    return db.prepare('SELECT * FROM invoices WHERE reservation_id = ?').get(resId);
  },
  getById: (id: number) => {
    const inv: any = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
    if (inv) inv.snapshot_data = JSON.parse(inv.snapshot_data);
    return inv;
  },
  update: (id: number, invoice: any) => {
    const stmt = db.prepare(`
      UPDATE invoices 
      SET reservation_id = ?, invoice_number = ?, issue_date = ?, due_date = ?, total_amount = ?, snapshot_data = ?, status = ?
      WHERE id = ?
    `);
    stmt.run(
      invoice.reservation_id, invoice.invoice_number,
      invoice.issue_date, invoice.due_date,
      invoice.total_amount, 
      typeof invoice.snapshot_data === 'string' ? invoice.snapshot_data : JSON.stringify(invoice.snapshot_data),
      invoice.status, id
    );
  },
  updateStatus: (id: number, status: string) => {
    db.prepare('UPDATE invoices SET status = ? WHERE id = ?').run(status, id);
  },
  delete: (id: number) => {
    // Delete payments first
    db.prepare('DELETE FROM payments WHERE invoice_id = ?').run(id);
    // Delete invoice
    db.prepare('DELETE FROM invoices WHERE id = ?').run(id);
  }
};

// PAYMENTS API
export const paymentsApi = {
  add: db.transaction((payment: any) => {
    // 1. Check invoice and reservation status
    const invoice: any = invoicesApi.getById(payment.invoice_id);
    if (!invoice) throw new Error('Invoice not found');

    const res = db.prepare('SELECT status FROM reservations WHERE id = ?').get(invoice.reservation_id) as any;
    if (invoice.status === 'cancelled' || (res && res.status === 'cancelled')) {
      throw new Error('Cannot add payment to a cancelled booking.');
    }

    const stmt = db.prepare('INSERT INTO payments (invoice_id, amount, payment_date, method, notes) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(payment.invoice_id, payment.amount, payment.payment_date, payment.method, payment.notes);
    
    // Auto-update invoice status
    const payments: any = db.prepare('SELECT SUM(amount) as total FROM payments WHERE invoice_id = ?').get(payment.invoice_id);
    const totalPaid = payments.total || 0;
    
    let newStatus = 'partially_paid';
    if (totalPaid >= invoice.total_amount) {
      newStatus = 'paid';
    } else if (totalPaid === 0) {
      newStatus = 'issued';
    }
    
    invoicesApi.updateStatus(payment.invoice_id, newStatus);
    
    return info.lastInsertRowid;
  }),
  getByInvoiceId: (invoiceId: number) => {
    return db.prepare('SELECT * FROM payments WHERE invoice_id = ? ORDER BY payment_date DESC').all(invoiceId);
  }
};

// STATS API
export const statsApi = {
  getMonthlyRevenue: () => {
    // Returns revenue grouped by month for the last 12 months
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
    `).get() as any;
    
    // Calculate total outstanding: Invoiced unpaid + Confirmed unpaid NOT invoiced
    // We only count invoices where the linked reservation is NOT cancelled
    const invoicedUnpaid = db.prepare(`
      SELECT SUM(i.total_amount) as total 
      FROM invoices i
      JOIN reservations r ON i.reservation_id = r.id
      WHERE LOWER(i.status) NOT IN ('paid', 'cancelled')
      AND LOWER(r.status) != 'cancelled'
    `).get() as any;
    
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
    `).get() as any;

    const guestCount = db.prepare('SELECT COUNT(*) as count FROM guests').get() as any;
    const activeReservations = db.prepare("SELECT COUNT(*) as count FROM reservations WHERE LOWER(status) = 'confirmed'").get() as any;
    
    const cancelledStats = db.prepare(`
      SELECT 
        COUNT(r.id) as count,
        SUM(COALESCE(i.total_amount, 
          (MAX(0, (r.nightly_rate * MAX(1, CAST(julianday(r.check_out) - julianday(r.check_in) AS INTEGER)) + r.cleaning_fee + r.service_fee) - r.discount)) * (1 + r.tax_rate / 100)
        )) as amount
      FROM reservations r
      LEFT JOIN invoices i ON i.reservation_id = r.id
      WHERE LOWER(r.status) = 'cancelled'
    `).get() as any;
    
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
