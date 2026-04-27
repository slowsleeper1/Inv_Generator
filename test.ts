import Database from 'better-sqlite3';
const db = new Database('./luxebill.db');
const invoices = db.prepare('SELECT id, status, reservation_id FROM invoices').all();
const reservations = db.prepare('SELECT id, status FROM reservations').all();
console.log('Invoices:', invoices);
console.log('Reservations:', reservations);
