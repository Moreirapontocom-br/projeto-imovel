import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type {
  AvailabilityBlock, Client, Contract, ContractTemplate, Installment, PaymentTerms, Property, Reservation,
} from '@/types';
import { properties as seedProperties } from '@/data/properties';
import { seedBlocks, seedClients, seedContracts, seedReservations, seedTemplates } from '@/data/seed';
import { defaultPaymentTerms } from '@/config/payment';

// Banco SQLite (node:sqlite). Disponibilidade é garantida em duas camadas:
// 1) a API revalida conflitos dentro de uma transação BEGIN IMMEDIATE (escrita exclusiva);
// 2) o trigger `blocks_no_overlap` recusa qualquer período sobreposto, mesmo vindo de outro processo.

export const DB_PATH = process.env.DB_PATH ?? 'server/data/app.db';

const SCHEMA = `
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA busy_timeout = 5000;

CREATE TABLE IF NOT EXISTS properties (
  id   TEXT PRIMARY KEY,
  data TEXT NOT NULL -- JSON do Property (fotos, comodidades e localização são aninhados)
);

CREATE TABLE IF NOT EXISTS clients (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL UNIQUE COLLATE NOCASE,
  phone      TEXT NOT NULL,
  city       TEXT NOT NULL,
  document   TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reservations (
  id          TEXT PRIMARY KEY,
  code        TEXT NOT NULL UNIQUE,
  property_id TEXT NOT NULL REFERENCES properties(id),
  client_id   TEXT NOT NULL REFERENCES clients(id),
  start       TEXT NOT NULL,
  end         TEXT NOT NULL CHECK (end > start),
  guests      INTEGER NOT NULL,
  total       REAL NOT NULL,
  method      TEXT NOT NULL CHECK (method IN ('pix', 'cartao')),
  status      TEXT NOT NULL CHECK (status IN ('pendente', 'confirmada', 'cancelada')),
  created_at  TEXT NOT NULL,
  contract_id TEXT
);

CREATE TABLE IF NOT EXISTS receipts (
  id             TEXT PRIMARY KEY,
  reservation_id TEXT NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  n              INTEGER NOT NULL,
  name           TEXT NOT NULL,
  type           TEXT NOT NULL,
  size           INTEGER NOT NULL,
  data           BLOB NOT NULL,
  uploaded_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS blocks (
  id             TEXT PRIMARY KEY,
  property_id    TEXT NOT NULL REFERENCES properties(id),
  start          TEXT NOT NULL,
  end            TEXT NOT NULL CHECK (end > start),
  kind           TEXT NOT NULL CHECK (kind IN ('reserva', 'bloqueio')),
  reservation_id TEXT REFERENCES reservations(id) ON DELETE CASCADE,
  note           TEXT
);
CREATE INDEX IF NOT EXISTS blocks_property ON blocks(property_id, start);

CREATE TRIGGER IF NOT EXISTS blocks_no_overlap BEFORE INSERT ON blocks
WHEN EXISTS (SELECT 1 FROM blocks WHERE property_id = NEW.property_id AND start < NEW.end AND NEW.start < end)
BEGIN
  SELECT RAISE(ABORT, 'conflito de datas');
END;

CREATE TABLE IF NOT EXISTS templates (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  body       TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS contracts (
  id             TEXT PRIMARY KEY,
  reservation_id TEXT NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  template_id    TEXT NOT NULL,
  status         TEXT NOT NULL CHECK (status IN ('rascunho', 'enviado', 'assinado-demo')),
  created_at     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

const INSTALLMENTS = `
CREATE TABLE IF NOT EXISTS installments (
  reservation_id TEXT NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  n              INTEGER NOT NULL,
  label          TEXT NOT NULL,
  due_date       TEXT NOT NULL,
  amount         REAL NOT NULL,
  status         TEXT NOT NULL CHECK (status IN ('pago', 'aberto', 'atrasado', 'em-analise')),
  receipt_id     TEXT REFERENCES receipts(id) ON DELETE SET NULL,
  review_note    TEXT,
  paid_at        TEXT,
  PRIMARY KEY (reservation_id, n)
);`;

export function openDb(path = DB_PATH) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(SCHEMA);
  migrateInstallments(db);
  db.exec(INSTALLMENTS);
  const { n } = db.prepare('SELECT COUNT(*) AS n FROM properties').get() as { n: number };
  if (!n) seed(db);
  return db;
}

export type Db = DatabaseSync;

/** Bancos criados antes dos comprovantes: recria `installments` com as colunas novas, preservando os dados. */
function migrateInstallments(db: Db) {
  const cols = db.prepare('PRAGMA table_info(installments)').all() as { name: string }[];
  if (!cols.length || cols.some((c) => c.name === 'receipt_id')) return;
  tx(db, () => {
    db.exec('ALTER TABLE installments RENAME TO installments_old');
    db.exec(INSTALLMENTS);
    db.exec(`INSERT INTO installments (reservation_id, n, label, due_date, amount, status)
             SELECT reservation_id, n, label, due_date, amount, status FROM installments_old`);
    db.exec('DROP TABLE installments_old');
  });
}

/** Executa `fn` numa transação de escrita exclusiva; desfaz tudo se algo falhar. */
export function tx<T>(db: Db, fn: () => T): T {
  db.exec('BEGIN IMMEDIATE');
  try {
    const out = fn();
    db.exec('COMMIT');
    return out;
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

/** Apaga tudo e recarrega os dados fictícios de demonstração. */
export function seed(db: Db) {
  tx(db, () => {
    for (const t of ['contracts', 'blocks', 'installments', 'receipts', 'reservations', 'clients', 'templates', 'properties', 'settings']) {
      db.exec(`DELETE FROM ${t}`);
    }
    for (const p of seedProperties) insertProperty(db, p);
    for (const c of seedClients) insertClient(db, c);
    for (const r of seedReservations) insertReservation(db, r);
    for (const b of seedBlocks) insertBlock(db, b);
    for (const t of seedTemplates) saveTemplate(db, t);
    for (const c of seedContracts) insertContract(db, c);
    setTerms(db, defaultPaymentTerms);
  });
}

// ---------- escrita ----------

export const insertProperty = (db: Db, p: Property) =>
  db.prepare('INSERT INTO properties (id, data) VALUES (?, ?)').run(p.id, JSON.stringify(p));

export const updateProperty = (db: Db, p: Property) =>
  db.prepare('UPDATE properties SET data = ? WHERE id = ?').run(JSON.stringify(p), p.id);

export const insertClient = (db: Db, c: Client) =>
  db.prepare('INSERT INTO clients (id, name, email, phone, city, document, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(c.id, c.name, c.email, c.phone, c.city, c.document, c.createdAt);

export function insertReservation(db: Db, r: Reservation) {
  db.prepare(`INSERT INTO reservations (id, code, property_id, client_id, start, end, guests, total, method, status, created_at, contract_id)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(r.id, r.code, r.propertyId, r.clientId, r.range.start, r.range.end, r.guests, r.total, r.method, r.status, r.createdAt, r.contractId ?? null);
  const ins = db.prepare('INSERT INTO installments (reservation_id, n, label, due_date, amount, status, paid_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
  for (const i of r.installments) ins.run(r.id, i.n, i.label, i.dueDate, i.amount, i.status, i.paidAt ?? null);
}

export const insertBlock = (db: Db, b: AvailabilityBlock) =>
  db.prepare('INSERT INTO blocks (id, property_id, start, end, kind, reservation_id, note) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(b.id, b.propertyId, b.start, b.end, b.kind, b.reservationId ?? null, b.note ?? null);

export const insertContract = (db: Db, c: Contract) =>
  db.prepare('INSERT INTO contracts (id, reservation_id, template_id, status, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(c.id, c.reservationId, c.templateId, c.status, c.createdAt);

export const saveTemplate = (db: Db, t: ContractTemplate) =>
  db.prepare(`INSERT INTO templates (id, name, body, updated_at) VALUES (?, ?, ?, ?)
              ON CONFLICT(id) DO UPDATE SET name = excluded.name, body = excluded.body, updated_at = excluded.updated_at`)
    .run(t.id, t.name, t.body, t.updatedAt);

export const setTerms = (db: Db, t: PaymentTerms) =>
  db.prepare(`INSERT INTO settings (key, value) VALUES ('terms', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`)
    .run(JSON.stringify(t));

// ---------- leitura ----------

type Row = Record<string, unknown>;

export const getProperties = (db: Db) =>
  (db.prepare('SELECT data FROM properties ORDER BY rowid').all() as Row[]).map((r) => JSON.parse(r.data as string) as Property);

export const getProperty = (db: Db, id: string) => {
  const r = db.prepare('SELECT data FROM properties WHERE id = ?').get(id) as Row | undefined;
  return r ? (JSON.parse(r.data as string) as Property) : undefined;
};

export const getTerms = (db: Db) => {
  const r = db.prepare(`SELECT value FROM settings WHERE key = 'terms'`).get() as Row | undefined;
  return r ? (JSON.parse(r.value as string) as PaymentTerms) : defaultPaymentTerms;
};

const toClient = (r: Row): Client => ({
  id: r.id as string, name: r.name as string, email: r.email as string, phone: r.phone as string,
  city: r.city as string, document: r.document as string, createdAt: r.created_at as string,
});

export const getClients = (db: Db) => (db.prepare('SELECT * FROM clients ORDER BY created_at, id').all() as Row[]).map(toClient);

export const getClientByEmail = (db: Db, email: string) => {
  const r = db.prepare('SELECT * FROM clients WHERE email = ?').get(email) as Row | undefined;
  return r ? toClient(r) : undefined;
};

export function getReservations(db: Db, clientId?: string) {
  const rows = (clientId
    ? db.prepare('SELECT * FROM reservations WHERE client_id = ? ORDER BY rowid').all(clientId)
    : db.prepare('SELECT * FROM reservations ORDER BY rowid').all()) as Row[];
  const inst = db.prepare(`SELECT i.*, r.name AS r_name, r.type AS r_type, r.size AS r_size, r.uploaded_at AS r_at
                           FROM installments i LEFT JOIN receipts r ON r.id = i.receipt_id
                           WHERE i.reservation_id = ? ORDER BY i.n`);
  return rows.map((r): Reservation => ({
    id: r.id as string, code: r.code as string, propertyId: r.property_id as string, clientId: r.client_id as string,
    range: { start: r.start as string, end: r.end as string }, guests: Number(r.guests), total: Number(r.total),
    method: r.method as Reservation['method'], status: r.status as Reservation['status'], createdAt: r.created_at as string,
    contractId: (r.contract_id as string | null) ?? undefined,
    installments: (inst.all(r.id as string) as Row[]).map((i): Installment => ({
      n: Number(i.n), label: i.label as string, dueDate: i.due_date as string, amount: Number(i.amount), status: i.status as Installment['status'],
      ...(i.receipt_id ? { receipt: { id: i.receipt_id as string, name: i.r_name as string, type: i.r_type as string, size: Number(i.r_size), uploadedAt: i.r_at as string } } : {}),
      ...(i.review_note ? { reviewNote: i.review_note as string } : {}),
      ...(i.paid_at ? { paidAt: i.paid_at as string } : {}),
    })),
  }));
}

export const getReservation = (db: Db, id: string) => getReservations(db).find((r) => r.id === id);

export const getBlocks = (db: Db, propertyId?: string) =>
  ((propertyId
    ? db.prepare('SELECT * FROM blocks WHERE property_id = ? ORDER BY start').all(propertyId)
    : db.prepare('SELECT * FROM blocks ORDER BY property_id, start').all()) as Row[]).map((b): AvailabilityBlock => ({
    id: b.id as string, propertyId: b.property_id as string, start: b.start as string, end: b.end as string,
    kind: b.kind as AvailabilityBlock['kind'],
    ...(b.reservation_id ? { reservationId: b.reservation_id as string } : {}),
    ...(b.note ? { note: b.note as string } : {}),
  }));

export const getTemplates = (db: Db) =>
  (db.prepare('SELECT * FROM templates ORDER BY rowid').all() as Row[]).map((t): ContractTemplate => ({
    id: t.id as string, name: t.name as string, body: t.body as string, updatedAt: t.updated_at as string,
  }));

export const getContracts = (db: Db) =>
  (db.prepare('SELECT * FROM contracts ORDER BY rowid').all() as Row[]).map((c): Contract => ({
    id: c.id as string, reservationId: c.reservation_id as string, templateId: c.template_id as string,
    status: c.status as Contract['status'], createdAt: c.created_at as string,
  }));
