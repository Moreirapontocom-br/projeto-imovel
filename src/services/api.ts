import type { AvailabilityBlock, Client, Contract, ContractTemplate, PaymentTerms, Property, Reservation, Role } from '@/types';
import { apiUrl } from '@/config/env';

// Cliente HTTP da API (server/). Usado pelo store quando VITE_API_URL está definido.

export interface Snapshot {
  properties: Property[];
  blocks: AvailabilityBlock[];
  reservations: Reservation[];
  clients: Client[];
  templates: ContractTemplate[];
  contracts: Contract[];
  terms: PaymentTerms;
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public itemId?: string) { super(message); }
}

export async function api<T = Snapshot>(
  session: { role: Role; userId: string | null },
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${apiUrl}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        // PROVISÓRIO até a autenticação real (ver server/index.ts › session)
        'X-Demo-Role': session.role,
        ...(session.userId ? { 'X-Demo-User': session.userId } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Sem conexão com o servidor. Verifique a internet e tente novamente.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error ?? 'Erro no servidor. Tente novamente.', data.itemId);
  return data as T;
}
