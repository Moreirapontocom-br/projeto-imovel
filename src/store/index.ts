import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AvailabilityBlock, CartItem, Client, Contract, ContractTemplate, DateRange, PaymentMethod,
  PaymentTerms, Property, Reservation, Role,
} from '@/types';
import { properties as seedProperties } from '@/data/properties';
import { seedBlocks, seedClients, seedContracts, seedReservations, seedTemplates, DEMO_CLIENT_ID } from '@/data/seed';
import { defaultPaymentTerms } from '@/config/payment';
import { findConflict } from '@/lib/availability';
import { buildInstallments, quote } from '@/lib/payment';
import { todayIso } from '@/lib/dates';

// Store único = "banco de dados" da demonstração. Todas as telas leem daqui (fonte única de verdade).

interface CheckoutInput {
  items: CartItem[];
  method: PaymentMethod;
  installments: number;
  client: Omit<Client, 'id' | 'createdAt' | 'document'> & { document: string };
}

export type CheckoutResult = { ok: true; reservations: Reservation[] } | { ok: false; error: string; itemId?: string };

interface State {
  role: Role;
  userId: string | null;
  properties: Property[];
  blocks: AvailabilityBlock[];
  reservations: Reservation[];
  clients: Client[];
  templates: ContractTemplate[];
  contracts: Contract[];
  terms: PaymentTerms;
  cart: CartItem[];
  favorites: string[];

  signIn(role: Role): void;
  signOut(): void;
  toggleFavorite(id: string): void;
  addToCart(propertyId: string, range: DateRange, guests: number): { ok: boolean; error?: string };
  removeFromCart(id: string): void;
  checkout(input: CheckoutInput): CheckoutResult;
  addBlock(propertyId: string, range: DateRange, note: string): { ok: boolean; error?: string };
  removeBlock(id: string): void;
  updateProperty(id: string, patch: Partial<Property>): void;
  setReservationStatus(id: string, status: Reservation['status']): void;
  payInstallment(reservationId: string, n: number): void;
  saveTemplate(t: ContractTemplate): void;
  deleteTemplate(id: string): void;
  setContractStatus(id: string, status: Contract['status']): void;
  setTerms(t: PaymentTerms): void;
  resetDemo(): void;
}

const seed = () => ({
  properties: seedProperties,
  blocks: seedBlocks,
  reservations: seedReservations,
  clients: seedClients,
  templates: seedTemplates,
  contracts: seedContracts,
  terms: defaultPaymentTerms,
  cart: [] as CartItem[],
  favorites: [] as string[],
});

const uid = (p: string) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      role: 'visitante',
      userId: null,
      ...seed(),

      signIn: (role) => set({ role, userId: role === 'cliente' ? DEMO_CLIENT_ID : role === 'admin' ? 'admin' : null }),
      signOut: () => set({ role: 'visitante', userId: null }),

      toggleFavorite: (id) =>
        set((s) => ({ favorites: s.favorites.includes(id) ? s.favorites.filter((f) => f !== id) : [...s.favorites, id] })),

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

      checkout: ({ items, method, installments, client }) => {
        const s = get();
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
          cart: s.cart.filter((c) => !items.some((it) => it.id === c.id)),
          role: s.role === 'admin' ? 'admin' : 'cliente',
          userId: s.role === 'admin' ? s.userId : clientId,
        });
        return { ok: true, reservations: created };
      },

      addBlock: (propertyId, range, note) => {
        const c = findConflict(propertyId, range, get().blocks);
        if (c) return { ok: false, error: c.reason };
        set((s) => ({ blocks: [...s.blocks, { id: uid('b'), propertyId, ...range, kind: 'bloqueio', note }] }));
        return { ok: true };
      },
      removeBlock: (id) => set((s) => ({ blocks: s.blocks.filter((b) => b.id !== id || b.kind !== 'bloqueio') })),

      updateProperty: (id, patch) => set((s) => ({ properties: s.properties.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),

      setReservationStatus: (id, status) =>
        set((s) => ({
          reservations: s.reservations.map((r) => (r.id === id ? { ...r, status } : r)),
          // reserva cancelada libera as datas
          blocks: status === 'cancelada' ? s.blocks.filter((b) => b.reservationId !== id) : s.blocks,
        })),

      payInstallment: (reservationId, n) =>
        set((s) => ({
          reservations: s.reservations.map((r) =>
            r.id !== reservationId ? r : { ...r, installments: r.installments.map((i) => (i.n === n ? { ...i, status: 'pago' } : i)) }),
        })),

      saveTemplate: (t) =>
        set((s) => ({
          templates: s.templates.some((x) => x.id === t.id)
            ? s.templates.map((x) => (x.id === t.id ? { ...t, updatedAt: todayIso() } : x))
            : [...s.templates, { ...t, updatedAt: todayIso() }],
        })),
      deleteTemplate: (id) => set((s) => ({ templates: s.templates.filter((t) => t.id !== id) })),
      setContractStatus: (id, status) => set((s) => ({ contracts: s.contracts.map((c) => (c.id === id ? { ...c, status } : c)) })),

      setTerms: (terms) => set({ terms }),
      resetDemo: () => set({ ...seed(), role: get().role, userId: get().userId }),
    }),
    { name: 'sua-marca-demo-v1' },
  ),
);

// Seletores utilitários
export const useProperty = (id?: string) => useStore((s) => s.properties.find((p) => p.id === id));
