'use strict';
/* Database: SQLite (node:sqlite). Faili: DATA_DIR/ngt.db */
const { DatabaseSync } = require('node:sqlite');
const fs = require('fs'), path = require('path'), crypto = require('crypto');

const DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
fs.mkdirSync(DIR, { recursive: true });
const db = new DatabaseSync(path.join(DIR, 'ngt.db'));
db.exec(`
PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
CREATE TABLE IF NOT EXISTS users(
  id TEXT PRIMARY KEY, name TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN('admin','staff','client')),
  pin_key TEXT UNIQUE NOT NULL, active INTEGER NOT NULL DEFAULT 1, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS events(
  id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT, date TEXT, time TEXT, venue TEXT, pkg TEXT, card TEXT,
  order_id TEXT, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS user_events(
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE, PRIMARY KEY(user_id,event_id));
CREATE TABLE IF NOT EXISTS guests(
  id TEXT PRIMARY KEY, event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL, phone TEXT DEFAULT '', tbl TEXT DEFAULT '', gate TEXT DEFAULT '',
  code TEXT UNIQUE NOT NULL, short TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending',
  at INTEGER, by TEXT, sent INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL, UNIQUE(event_id,short));
CREATE INDEX IF NOT EXISTS ix_guests_event ON guests(event_id);
CREATE TABLE IF NOT EXISTS outbox(
  id INTEGER PRIMARY KEY AUTOINCREMENT, guest_id TEXT NOT NULL, event_id TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'queued',
  attempts INTEGER NOT NULL DEFAULT 0, next_at INTEGER NOT NULL, error TEXT DEFAULT '', created_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS ix_outbox_status ON outbox(status,next_at);
CREATE TABLE IF NOT EXISTS scans(
  id TEXT PRIMARY KEY, event_id TEXT, guest_id TEXT, code TEXT, res TEXT NOT NULL, at INTEGER NOT NULL, by TEXT, device TEXT);
CREATE INDEX IF NOT EXISTS ix_scans_event ON scans(event_id);
CREATE TABLE IF NOT EXISTS orders(
  id TEXT PRIMARY KEY, ref TEXT UNIQUE NOT NULL, name TEXT, phone TEXT, type TEXT, event_name TEXT, date TEXT, time TEXT,
  venue TEXT, pkg TEXT, card TEXT, card_img TEXT, extras TEXT, pay TEXT, lang TEXT, notes TEXT, guests TEXT,
  amount INTEGER DEFAULT 0, payment_note TEXT DEFAULT '', status TEXT NOT NULL DEFAULT 'new',
  event_id TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY AUTOINCREMENT, at INTEGER, user_id TEXT, action TEXT, detail TEXT);
`);

for (const c of ["msg_status TEXT DEFAULT ''", "msg_channel TEXT DEFAULT ''", "msg_error TEXT DEFAULT ''", 'msg_at INTEGER', "wa_id TEXT DEFAULT ''"]) { try { db.exec('ALTER TABLE guests ADD COLUMN ' + c); } catch (e) {} } // migration ya DB za zamani
const cache = new Map();
const st = sql => { let s = cache.get(sql); if (!s) { s = db.prepare(sql); cache.set(sql, s); } return s; };
const all = (sql, ...p) => st(sql).all(...p).map(r => ({ ...r }));
const one = (sql, ...p) => { const r = st(sql).get(...p); return r ? { ...r } : null; };
const run = (sql, ...p) => st(sql).run(...p);
const tx = fn => { db.exec('BEGIN IMMEDIATE'); try { const r = fn(); db.exec('COMMIT'); return r; } catch (e) { db.exec('ROLLBACK'); throw e; } };

const ALPH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // bila I,O,0,1
const rtext = n => [...crypto.randomBytes(n)].map(x => ALPH[x % 32]).join('');
const rid = p => p + crypto.randomBytes(5).toString('hex').toUpperCase();
const setting = (k, d = '') => (one('SELECT value FROM settings WHERE key=?', k) || { value: d }).value;
const setSetting = (k, v) => run('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', k, String(v));
const audit = (uid, action, detail = '') => run('INSERT INTO audit(at,user_id,action,detail) VALUES(?,?,?,?)', Date.now(), uid || null, action, String(detail).slice(0, 300));

module.exports = { db, DIR, all, one, run, tx, rtext, rid, setting, setSetting, audit };
