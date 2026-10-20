import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  CartItem, Client, Contract, ContractTemplate, DateRange, PaymentMethod,
  PaymentTerms, Property, Reservation, Role,
} from '@/types';
import { properties as seedProperties } from '@/data/properties';
import { seedBlocks, seedClients, seedContracts, seedReservations, seedTemplates, DEMO_CLIENT_ID } from '@/data/seed';
import { defaultPaymentTerms } from '@/config/payment';
import { apiMode } from '@/config/env';
import { api, ApiError, type Snapshot } from '@/services/api';
import { findConflict } from '@/lib/availability';
import { buildInstallments, quote } from '@/lib/payment';
import { todayIso } from '@/lib/dates';

// Store único = fonte de verdade de todas as telas. Dois modos:
// - demonstração (padrão): o próprio store é o "banco de dados", persistido no localStorage;
// - API (VITE_API_URL definido): o servidor é a fonte; o store guarda a última visão recebida
//   e só mantém no navegador o perfil, o carrinho e os favoritos.

interface CheckoutInput {
  items: CartItem[];
  method: PaymentMethod;
  installments: number;
  client: Omit<Client, 'id' | 'createdAt' | 'document'> & { document: string };
}

export type Result = { ok: true } | { ok: false; error: string };
export type CheckoutResult = { ok: true; reservations: Reservation[] } | { ok: false; error: string; itemId?: string };

interface State extends Snapshot {
  role: Role;
  userId: string | null;
  cart: CartItem[];
  favorites: string[];
  /** false até a primeira carga da API; no modo demonstração já começa pronto */
  ready: boolean;
  loadError: string | null;
  /** erro da última gravação na API, exibido como aviso */
  syncError: string | null;

  hydrate(): Promise<void>;
  clearSyncError(): void;
  signIn(role: Role): void;
  signOut(): void;
  toggleFavorite(id: string): void;
  addToCart(propertyId: string, range: DateRange, guests: number): { ok: boolean; error?: string };
  removeFromCart(id: string): void;
  checkout(input: CheckoutInput): Promise<CheckoutResult>;
  addBlock(propertyId: string, range: DateRange, note: string): Promise<Result>;
  removeBlock(id: string): Promise<Result>;
  updateProperty(id: string, patch: Partial<Property>): Promise<Result>;
  setReservationStatus(id: string, status: Reservation['status']): Promise<Result>;
  payInstallment(reservationId: string, n: number): Promise<Result>;
  saveTemplate(t: ContractTemplate): Promise<Result>;
  deleteTemplate(id: string): Promise<Result>;
  setContractStatus(id: string, status: Contract['status']): Promise<Result>;
  setTerms(t: PaymentTerms): Promise<Result>;
  resetDemo(): Promise<Result>;
}

const seed = (): Snapshot => ({
  properties: seedProperties,
  blocks: seedBlocks,
  reservations: seedReservations,
  clients: seedClients,
  templates: seedTemplates,
  contracts: seedContracts,
  terms: defaultPaymentTerms,
});

const empty = (): Snapshot => ({ properties: [], blocks: [], reservations: [], clients: [], templates: [], contracts: [], terms: defaultPaymentTerms });

const uid = (p: string) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
const OK: Result = { ok: true };
const message = (e: unknown) => (e instanceof Error ? e.message : 'Erro inesperado. Tente novamente.');

export const useStore = create<State>()(
  persist(
    (set, get) => {
      /** Modo API: chama o servidor, aplica a visão devolvida e converte erros em Result. */
      const remote = async (method: 'POST' | 'PUT' | 'PATCH' | 'DELETE', path: string, body?: unknown): Promise<Result> => {
        try {
          set({ ...(await api(get(), method, path, body)), syncError: null });
          return OK;
        } catch (e) {
          set({ syncError: message(e) });
          return { ok: false, error: message(e) };
        }
      };

      return {
        role: 'visitante',
        userId: null,
        ...(apiMode ? empty() : seed()),
        cart: [],
        favorites: [],
        ready: !apiMode,
        loadError: null,
        syncError: null,

        hydrate: async () => {
          if (!apiMode) return;
          try {
            set({ ...(await api(get(), 'GET', '/snapshot')), ready: true, loadError: null });
          } catch (e) {
            set({ loadError: message(e) });
          }
        },
        clearSyncError: () => set({ syncError: null }),

        signIn: (role) => {
          set({ role, userId: role === 'cliente' ? DEMO_CLIENT_ID : role === 'admin' ? 'admin' : null });
          void get().hydrate(); // a visão do servidor depende do perfil
        },
        signOut: () => {
          set({ role: 'visitante', userId: null });
          void get().hydrate();
        },

        toggleFavorite: (id) =>
          set((s) => ({ favorites: s.favorites.includes(id) ? s.favorites.filter((f) => f !== id) : [...s.favorites, id] })),

        // Checagem antecipada com os dados em tela; a decisão final é do checkout (e do servidor, no modo API).
        addToCart: (propertyId, range, guests) => {
          const s = get();
          const conflict = findConflict(propertyId, range, s.blocks);
          if (conflict) return { ok: false, error: conflict.reason };
          const clash = s.cart.find((c) => c.propertyId === propertyId);
          const item: CartItem = { id: clash?.id ?? uid('ci'), propertyId, range, guests };
          set({ cart: clash ? s.cart.map((c) => (c.id === clash.id ? item : c)) : [...s.cart, item] });
          return { ok: true };
        },
        removeFromCart: (id) => set((s) => ({ cart: s.cart.filter((c) => c.id !== id) })),

        checkout: async ({ items, method, installments, client }) => {
          const s = get();
          const afterCheckout = (clientId: string) => ({
            cart: get().cart.filter((c) => !items.some((it) => it.id === c.id)),
            role: s.role === 'admin' ? ('admin' as const) : ('cliente' as const),
            userId: s.role === 'admin' ? s.userId : clientId,
          });

          if (apiMode) {
            try {
              const r = await api<{ reservations: Reservation[]; clientId: string; snapshot: Snapshot }>(s, 'POST', '/checkout', { items, method, installments, client });
              set({ ...r.snapshot, ...afterCheckout(r.clientId) });
              return { ok: true, reservations: r.reservations };
            } catch (e) {
              if (e instanceof ApiError && e.status === 409) void get().hydrate(); // datas mudaram: atualiza o calendário
              return { ok: false, error: message(e), itemId: e instanceof ApiError ? e.itemId : undefined };
            }
          }

          // Verificação "transacional" da demo: revalida todos os itens antes de gravar qualquer um.
          for (const it of items) {
            const c = findConflict(it.propertyId, it.range, s.blocks);
            if (c) return { ok: false, error: `${c.reason}. Escolha outras datas.`, itemId: it.id };
          }
          let clients = s.clients;
          let clientId = s.role === 'cliente' && s.userId ? s.userId : null;
          if (!clientId) {
            const existing = clients.find((c) => c.email.toLowerCase() === client.email.toLowerCase());
            clientId = existing?.id ?? uid('c');
            if (!existing) clients = [...clients, { ...client, id: clientId, createdAt: todayIso() }];
          }
          const created: Reservation[] = items.map((it, i) => {
            const p = s.properties.find((x) => x.id === it.propertyId)!;
            const total = quote(p, it.range, s.terms).total;
            const id = uid('r');
            return {
              id, code: `CAR-27-${String(500 + s.reservations.length + i).padStart(4, '0')}`,
              propertyId: it.propertyId, clientId: clientId!, range: it.range, guests: it.guests, total, method,
              installments: buildInstallments(total, method, s.terms, installments, todayIso()),
              status: 'pendente', createdAt: todayIso(), contractId: `ct-${id}`,
            };
          });
          set({
            clients,
            reservations: [...s.reservations, ...created],
            blocks: [...s.blocks, ...created.map((r) => ({ id: `b-${r.id}`, propertyId: r.propertyId, start: r.range.start, end: r.range.end, kind: 'reserva' as const, reservationId: r.id }))],
            contracts: [...s.contracts, ...created.map((r) => ({ id: r.contractId!, reservationId: r.id, templateId: s.templates[0]?.id ?? '', status: 'rascunho' as const, createdAt: todayIso() }))],
            ...afterCheckout(clientId),
          });
          return { ok: true, reservations: created };
        },

        addBlock: async (propertyId, range, note) => {
          if (apiMode) return remote('POST', '/blocks', { propertyId, range, note });
          const c = findConflict(propertyId, range, get().blocks);
          if (c) return { ok: false, error: c.reason };
          set((s) => ({ blocks: [...s.blocks, { id: uid('b'), propertyId, ...range, kind: 'bloqueio', note }] }));
          return OK;
        },
        removeBlock: async (id) => {
          if (apiMode) return remote('DELETE', `/blocks/${id}`);
          set((s) => ({ blocks: s.blocks.filter((b) => b.id !== id || b.kind !== 'bloqueio') }));
          return OK;
        },

        updateProperty: async (id, patch) => {
          if (apiMode) return remote('PATCH', `/properties/${id}`, patch);
          set((s) => ({ properties: s.properties.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
          return OK;
        },

        setReservationStatus: async (id, status) => {
          if (apiMode) return remote('PATCH', `/reservations/${id}`, { status });
          set((s) => ({
            reservations: s.reservations.map((r) => (r.id === id ? { ...r, status } : r)),
            // reserva cancelada libera as datas
            blocks: status === 'cancelada' ? s.blocks.filter((b) => b.reservationId !== id) : s.blocks,
          }));
          return OK;
        },

        payInstallment: async (reservationId, n) => {
          if (apiMode) return remote('POST', `/reservations/${reservationId}/installments/${n}/pay`);
          set((s) => ({
            reservations: s.reservations.map((r) =>
              r.id !== reservationId ? r : { ...r, installments: r.installments.map((i) => (i.n === n ? { ...i, status: 'pago' } : i)) }),
          }));
          return OK;
        },

        saveTemplate: async (t) => {
          if (apiMode) return remote('PUT', `/templates/${t.id}`, t);
          set((s) => ({
            templates: s.templates.some((x) => x.id === t.id)
              ? s.templates.map((x) => (x.id === t.id ? { ...t, updatedAt: todayIso() } : x))
              : [...s.templates, { ...t, updatedAt: todayIso() }],
          }));
          return OK;
        },
        deleteTemplate: async (id) => {
          if (apiMode) return remote('DELETE', `/templates/${id}`);
          set((s) => ({ templates: s.templates.filter((t) => t.id !== id) }));
          return OK;
        },
        setContractStatus: async (id, status) => {
          if (apiMode) return remote('PATCH', `/contracts/${id}`, { status });
          set((s) => ({ contracts: s.contracts.map((c) => (c.id === id ? { ...c, status } : c)) }));
          return OK;
        },

        setTerms: async (terms) => {
          if (apiMode) return remote('PUT', '/terms', terms);
          set({ terms });
          return OK;
        },
        resetDemo: async () => {
          if (apiMode) {
            const r = await remote('POST', '/reset');
            if (r.ok) set({ cart: [], favorites: [] });
            return r;
          }
          set({ ...seed(), cart: [], favorites: [] });
          return OK;
        },
      };
    },
    apiMode
      ? { name: 'sua-marca-api-v1', partialize: (s) => ({ role: s.role, userId: s.userId, cart: s.cart, favorites: s.favorites }) }
      : { name: 'sua-marca-demo-v1', partialize: ({ ready: _r, loadError: _l, syncError: _s, ...rest }) => rest },
  ),
);

// Seletores utilitários
export const useProperty = (id?: string) => useStore((s) => s.properties.find((p) => p.id === id));
