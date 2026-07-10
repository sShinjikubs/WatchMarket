import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'payments.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('[DB] Failed to open SQLite:', err);
  } else {
    console.log(`[DB] SQLite opened: ${dbPath}`);
  }
});

// Promise wrapper for db.run
function run(sql: string, params: unknown[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve();
    });
  });
}

// Promise wrapper for db.get
function get<T>(sql: string, params: unknown[] = []): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row as T | undefined);
    });
  });
}

// Initialize schema
export async function initDb(): Promise<void> {
  await run(`
    CREATE TABLE IF NOT EXISTS payments (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      ref        TEXT    NOT NULL UNIQUE,
      amount     REAL    NOT NULL,
      status     TEXT    NOT NULL DEFAULT 'pending',
      qr_base64  TEXT,
      created_at TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    )
  `);
  console.log('[DB] payments table ready');
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Payment {
  id: number;
  ref: string;
  amount: number;
  status: 'pending' | 'paid';
  qr_base64: string | null;
  created_at: string;
}

// ─── CRUD ────────────────────────────────────────────────────────────────────

export async function createPayment(
  ref: string,
  amount: number,
  qr_base64: string
): Promise<Payment> {
  await run(
    'INSERT INTO payments (ref, amount, qr_base64) VALUES (?, ?, ?)',
    [ref, amount, qr_base64]
  );
  return (await getPaymentByRef(ref)) as Payment;
}

export async function getPaymentByRef(ref: string): Promise<Payment | undefined> {
  return get<Payment>('SELECT * FROM payments WHERE ref = ?', [ref]);
}

export async function updatePaymentStatus(
  ref: string,
  status: 'pending' | 'paid'
): Promise<void> {
  await run('UPDATE payments SET status = ? WHERE ref = ?', [status, ref]);
}
