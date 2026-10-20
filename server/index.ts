import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import type { AvailabilityBlock, Client, Contract, ContractTemplate, DateRange, PaymentMethod, PaymentTerms, Property, Reservation, Role } from '@/types';
import { findConflict } from '@/lib/availability';
import { buildInstallments, maxInstallmentsFor, quote } from '@/lib/payment';
import { nightsBetween, todayIso } from '@/lib/dates';
import * as q from './db';

// API REST da plataforma. Todas as regras que mexem em dinheiro ou disponibilidade rodam aqui:
// o total e as parcelas são recalculados no servidor, e o front-end só envia a intenção.

const PORT = Number(process.env.PORT ?? 8787);
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? '';
const ALLOW_RESET = process.env.ALLOW_RESET !== '0';

const db = q.openDb();

class HttpError extends Error {
  constructor(public status: number, message: string, public extra: Record<string, unknown> = {}) { super(message); }
}

// ---------- identidade ----------
// PROVISÓRIO: o perfil vem dos cabeçalhos X-Demo-Role / X-Demo-User, sem senha.
// As permissões já são checadas aqui no servidor; o item 3 (autenticação real) só precisa
// trocar esta função por validação de sessão/token.
interface Session { role: Role; userId: string | null }

function session(req: IncomingMessage): Session {
  const role = String(req.headers['x-demo-role'] ?? 'visitante') as Role;
  const user = req.headers['x-demo-user'] ? String(req.headers['x-demo-user']) : null;
  if (role === 'admin') return { role, userId: 'admin' };
  if (role === 'cliente' && user && q.getClients(db).some((c) => c.id === user)) return { role, userId: user };
  return { role: 'visitante', userId: null };
}

const requireAdmin = (s: Session) => { if (s.role !== 'admin') throw new HttpError(403, 'Acesso restrito ao administrador.'); };

// ---------- visão por perfil ----------

function snapshot(s: Session) {
  const reservations = s.role === 'admin' ? q.getReservations(db) : s.userId ? q.getReservations(db, s.userId) : [];
  const own = new Set(reservations.map((r) => r.id));
  const blocks = q.getBlocks(db).map((b): AvailabilityBlock =>
    s.role === 'admin' || (b.reservationId && own.has(b.reservationId))
      ? b
      // para o público, só o período ocupado: sem vínculo com reserva de outra pessoa nem motivo do bloqueio
      : { id: b.id, propertyId: b.propertyId, start: b.start, end: b.end, kind: b.kind });
  return {
    properties: q.getProperties(db),
    blocks,
    reservations,
    clients: s.role === 'admin' ? q.getClients(db) : q.getClients(db).filter((c) => c.id === s.userId),
    templates: s.role === 'visitante' ? [] : q.getTemplates(db),
    contracts: q.getContracts(db).filter((c) => s.role === 'admin' || own.has(c.reservationId)),
    terms: q.getTerms(db),
  };
}

// ---------- validação ----------

const isIso = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
const str = (v: unknown, field: string, max = 200) => {
  if (typeof v !== 'string' || !v.trim()) throw new HttpError(400, `Campo obrigatório: ${field}.`);
  return v.trim().slice(0, max);
};
function range(v: unknown): DateRange {
  const r = v as DateRange | undefined;
  if (!r || !isIso(r.start) || !isIso(r.end) || r.end <= r.start) throw new HttpError(400, 'Período inválido.');
  return { start: r.start, end: r.end };
}
const property = (id: unknown) => {
  const p = typeof id === 'string' ? q.getProperty(db, id) : undefined;
  if (!p) throw new HttpError(404, 'Imóvel não encontrado.');
  return p;
};

const uid = (p: string) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

// ---------- casos de uso ----------

interface CheckoutBody {
  items: { id: string; propertyId: string; range: DateRange; guests: number }[];
  method: PaymentMethod;
  installments: number;
  client: Omit<Client, 'id' | 'createdAt'>;
}

function checkout(s: Session, body: CheckoutBody) {
  if (!Array.isArray(body.items) || !body.items.length || body.items.length > 10) throw new HttpError(400, 'Carrinho vazio ou inválido.');
  if (body.method !== 'pix' && body.method !== 'cartao') throw new HttpError(400, 'Forma de pagamento inválida.');
  const items = body.items.map((it) => {
    const p = property(it.propertyId);
    const r = range(it.range);
    const guests = Math.floor(Number(it.guests));
    if (!(guests >= 1 && guests <= p.guests)) throw new HttpError(400, `${p.title} aceita até ${p.guests} hóspedes.`, { itemId: it.id });
    if (nightsBetween(r) < p.minNights) throw new HttpError(400, `${p.title} exige mínimo de ${p.minNights} noites.`, { itemId: it.id });
    return { id: String(it.id), p, range: r, guests };
  });
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (items[i].p.id === items[j].p.id && items[i].range.start < items[j].range.end && items[j].range.start < items[i].range.end) {
        throw new HttpError(409, 'O carrinho tem o mesmo imóvel em datas sobrepostas.', { itemId: items[j].id });
      }
    }
  }

  return q.tx(db, () => {
    // Revalida todos os itens dentro da transação de escrita exclusiva: nenhuma outra reserva entra no meio.
    for (const it of items) {
      const c = findConflict(it.p.id, it.range, q.getBlocks(db, it.p.id));
      if (c) throw new HttpError(409, `${c.reason}. Escolha outras datas.`, { itemId: it.id });
    }
    const terms = q.getTerms(db);
    const n = Math.max(1, Math.min(Math.floor(Number(body.installments)) || 1, maxInstallmentsFor(body.method, terms)));

    let clientId = s.role === 'cliente' ? s.userId : null;
    if (!clientId) {
      const email = str(body.client?.email, 'e-mail', 120);
      if (!/^\S+@\S+\.\S+$/.test(email)) throw new HttpError(400, 'E-mail inválido.');
      const existing = q.getClientByEmail(db, email);
      clientId = existing?.id ?? uid('c');
      if (!existing) {
        q.insertClient(db, {
          id: clientId, name: str(body.client.name, 'nome'), email, phone: str(body.client.phone, 'telefone', 40),
          city: str(body.client.city, 'cidade'), document: String(body.client.document ?? '').trim().slice(0, 40) || 'não informado',
          createdAt: todayIso(),
        });
      }
    }

    const { seq } = db.prepare('SELECT COUNT(*) + 500 AS seq FROM reservations').get() as { seq: number };
    const templateId = q.getTemplates(db)[0]?.id ?? '';
    return items.map((it, i): Reservation => {
      const id = uid('r');
      const total = quote(it.p, it.range, terms).total;
      const r: Reservation = {
        id, code: `CAR-27-${String(seq + i).padStart(4, '0')}`, propertyId: it.p.id, clientId: clientId!, range: it.range,
        guests: it.guests, total, method: body.method, installments: buildInstallments(total, body.method, terms, n, todayIso()),
        status: 'pendente', createdAt: todayIso(), contractId: `ct-${id}`,
      };
      q.insertReservation(db, r);
      q.insertBlock(db, { id: `b-${id}`, propertyId: r.propertyId, ...r.range, kind: 'reserva', reservationId: id });
      q.insertContract(db, { id: r.contractId!, reservationId: id, templateId, status: 'rascunho', createdAt: todayIso() });
      return r;
    });
  });
}

function setReservationStatus(id: string, status: unknown) {
  if (status !== 'confirmada' && status !== 'cancelada') throw new HttpError(400, 'Status inválido.');
  q.tx(db, () => {
    const r = q.getReservation(db, id);
    if (!r) throw new HttpError(404, 'Reserva não encontrada.');
    if (r.status === 'cancelada') throw new HttpError(409, 'Reserva cancelada não pode ser alterada.');
    db.prepare('UPDATE reservations SET status = ? WHERE id = ?').run(status, id);
    // reserva cancelada libera as datas
    if (status === 'cancelada') db.prepare('DELETE FROM blocks WHERE reservation_id = ?').run(id);
  });
}

function canTouchReservation(s: Session, reservationId: string) {
  const r = q.getReservation(db, reservationId);
  if (!r) throw new HttpError(404, 'Reserva não encontrada.');
  if (s.role !== 'admin' && r.clientId !== s.userId) throw new HttpError(403, 'Esta reserva não é sua.');
  return r;
}

const EDITABLE: (keyof Property)[] = ['title', 'summary', 'description', 'nightly', 'cleaningFee', 'minNights', 'guests', 'highlight'];

// ---------- roteamento ----------

type Handler = (ctx: { s: Session; body: any; params: string[] }) => unknown;
const routes: [string, RegExp, Handler][] = [
  ['GET', /^\/api\/health$/, () => ({ ok: true })],
  ['GET', /^\/api\/snapshot$/, ({ s }) => snapshot(s)],

  ['POST', /^\/api\/checkout$/, ({ s, body }) => {
    const reservations = checkout(s, body);
    const clientId = reservations[0].clientId;
    // quem reserva sem login passa a ver a área do cliente com a reserva recém-criada
    const next: Session = s.role === 'admin' ? s : { role: 'cliente', userId: clientId };
    return { reservations, clientId, snapshot: snapshot(next) };
  }],

  ['POST', /^\/api\/blocks$/, ({ s, body }) => {
    requireAdmin(s);
    const p = property(body.propertyId);
    const r = range(body.range);
    q.tx(db, () => {
      const c = findConflict(p.id, r, q.getBlocks(db, p.id));
      if (c) throw new HttpError(409, c.reason);
      q.insertBlock(db, { id: uid('b'), propertyId: p.id, ...r, kind: 'bloqueio', note: String(body.note ?? '').slice(0, 200) });
    });
    return snapshot(s);
  }],
  ['DELETE', /^\/api\/blocks\/([\w-]+)$/, ({ s, params: [id] }) => {
    requireAdmin(s);
    db.prepare(`DELETE FROM blocks WHERE id = ? AND kind = 'bloqueio'`).run(id);
    return snapshot(s);
  }],

  ['PATCH', /^\/api\/properties\/([\w-]+)$/, ({ s, body, params: [id] }) => {
    requireAdmin(s);
    const p = property(id);
    const patch: Partial<Property> = {};
    for (const k of EDITABLE) if (k in body) (patch as any)[k] = body[k];
    for (const k of ['nightly', 'cleaningFee', 'minNights', 'guests'] as const) {
      if (k in patch && !(Number(patch[k]) >= 0)) throw new HttpError(400, `Valor inválido: ${k}.`);
    }
    q.updateProperty(db, { ...p, ...patch });
    return snapshot(s);
  }],

  ['PATCH', /^\/api\/reservations\/([\w-]+)$/, ({ s, body, params: [id] }) => {
    requireAdmin(s);
    setReservationStatus(id, body.status);
    return snapshot(s);
  }],
  ['POST', /^\/api\/reservations\/([\w-]+)\/installments\/(\d+)\/pay$/, ({ s, params: [id, n] }) => {
    canTouchReservation(s, id);
    // pagamento SIMULADO; com PSP real, a baixa viria do webhook do provedor, não do navegador
    db.prepare(`UPDATE installments SET status = 'pago' WHERE reservation_id = ? AND n = ?`).run(id, Number(n));
    return snapshot(s);
  }],

  ['PUT', /^\/api\/templates\/([\w-]+)$/, ({ s, body, params: [id] }) => {
    requireAdmin(s);
    const t: ContractTemplate = { id, name: str(body.name, 'nome'), body: str(body.body, 'texto', 50_000), updatedAt: todayIso() };
    q.saveTemplate(db, t);
    return snapshot(s);
  }],
  ['DELETE', /^\/api\/templates\/([\w-]+)$/, ({ s, params: [id] }) => {
    requireAdmin(s);
    const { n } = db.prepare('SELECT COUNT(*) AS n FROM templates').get() as { n: number };
    if (n <= 1) throw new HttpError(409, 'Mantenha pelo menos um modelo de contrato.');
    db.prepare('DELETE FROM templates WHERE id = ?').run(id);
    return snapshot(s);
  }],

  ['PATCH', /^\/api\/contracts\/([\w-]+)$/, ({ s, body, params: [id] }) => {
    const c = q.getContracts(db).find((x) => x.id === id);
    if (!c) throw new HttpError(404, 'Contrato não encontrado.');
    canTouchReservation(s, c.reservationId);
    const allowed: Contract['status'][] = s.role === 'admin' ? ['rascunho', 'enviado', 'assinado-demo'] : ['assinado-demo'];
    if (!allowed.includes(body.status)) throw new HttpError(400, 'Status inválido.');
    db.prepare('UPDATE contracts SET status = ? WHERE id = ?').run(body.status, id);
    return snapshot(s);
  }],

  ['PUT', /^\/api\/terms$/, ({ s, body }) => {
    requireAdmin(s);
    const t = body as PaymentTerms;
    const keys: (keyof PaymentTerms)[] = ['downPaymentPercent', 'maxInstallments', 'cardInterestPercentMonth', 'pixDiscountPercent', 'pixMaxInstallments', 'serviceFeePercent'];
    if (keys.some((k) => !(Number(t[k]) >= 0 && Number(t[k]) <= 100))) throw new HttpError(400, 'Condições inválidas.');
    q.setTerms(db, Object.fromEntries(keys.map((k) => [k, Number(t[k])])) as unknown as PaymentTerms);
    return snapshot(s);
  }],

  ['POST', /^\/api\/reset$/, ({ s }) => {
    requireAdmin(s);
    if (!ALLOW_RESET) throw new HttpError(403, 'Restauração desativada neste ambiente.');
    q.seed(db);
    return snapshot(s);
  }],
];

// ---------- HTTP ----------

async function readJson(req: IncomingMessage) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 1_000_000) throw new HttpError(413, 'Requisição grande demais.');
  }
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { throw new HttpError(400, 'JSON inválido.'); }
}

function send(res: ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

const server = createServer(async (req, res) => {
  if (CORS_ORIGIN) {
    res.setHeader('Access-Control-Allow-Origin', CORS_ORIGIN);
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Demo-Role, X-Demo-User');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Vary', 'Origin');
  }
  if (req.method === 'OPTIONS') return void res.writeHead(204).end();

  const path = new URL(req.url ?? '/', 'http://x').pathname;
  try {
    for (const [method, re, handler] of routes) {
      const m = re.exec(path);
      if (!m || method !== req.method) continue;
      const body = method === 'GET' || method === 'DELETE' ? {} : await readJson(req);
      return send(res, 200, await handler({ s: session(req), body, params: m.slice(1) }));
    }
    send(res, 404, { error: 'Rota não encontrada.' });
  } catch (e) {
    if (e instanceof HttpError) return send(res, e.status, { error: e.message, ...e.extra });
    // o trigger do banco é a última barreira contra reservas sobrepostas
    if (e instanceof Error && e.message.includes('conflito de datas')) return send(res, 409, { error: 'Datas já reservadas. Escolha outras datas.' });
    console.error(e);
    send(res, 500, { error: 'Erro interno. Tente novamente.' });
  }
});

server.listen(PORT, () => console.log(`API em http://localhost:${PORT}/api (banco: ${q.DB_PATH})`));
