import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { Button, ConfirmButton, Segmented } from '@/components/ui';
import { useStore } from '@/store';
import { brl } from '@/lib/format';
import { fmtRange } from '@/lib/dates';
import type { ReservationStatus } from '@/types';

const label = { pendente: 'Pendente', confirmada: 'Confirmada', cancelada: 'Cancelada' };
const cls = { pendente: 'is-pending', confirmada: 'is-ok', cancelada: 'is-off' };

export default function AdminReservations() {
  const reservations = useStore((s) => s.reservations);
  const clients = useStore((s) => s.clients);
  const properties = useStore((s) => s.properties);
  const setStatus = useStore((s) => s.setReservationStatus);
  const [f, setF] = useState<'todas' | ReservationStatus>('todas');
  const list = reservations.filter((r) => f === 'todas' || r.status === f).sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.code.localeCompare(a.code));

  return (
    <div className="admin-page">
      <header className="admin-head row">
        <div><h1>Reservas</h1><p className="muted">Confirme ou cancele solicitações. Cancelar libera as datas no calendário.</p></div>
        <Segmented<'todas' | ReservationStatus> label="Filtrar reservas" value={f} onChange={setF} options={[
          { value: 'todas', label: 'Todas' }, { value: 'pendente', label: 'Pendentes' }, { value: 'confirmada', label: 'Confirmadas' }, { value: 'cancelada', label: 'Canceladas' },
        ]} />
      </header>
      <div className="table-wrap">
        <table className="table table-rows">
          <thead><tr><th>Código</th><th>Cliente</th><th>Imóvel</th><th>Período</th><th className="num">Total</th><th className="num">Pago</th><th>Situação</th><th /></tr></thead>
          <tbody>
            {list.map((r) => {
              const paid = r.installments.filter((i) => i.status === 'pago').reduce((s, i) => s + i.amount, 0);
              return (
                <tr key={r.id}>
                  <td className="mono">{r.code}</td>
                  <td>{clients.find((c) => c.id === r.clientId)?.name}</td>
                  <td>{properties.find((p) => p.id === r.propertyId)?.title}</td>
                  <td>{fmtRange(r.range)}</td>
                  <td className="num">{brl(r.total)}</td>
                  <td className="num">{brl(paid)}</td>
                  <td><span className={`pill ${cls[r.status]}`}>{label[r.status]}</span></td>
                  <td className="right nowrap">
                    {r.status === 'pendente' && <Button size="sm" onClick={() => setStatus(r.id, 'confirmada')}><Check size={14} />Confirmar</Button>}
                    {r.status !== 'cancelada' && <ConfirmButton confirmLabel="Cancelar e liberar datas?" onConfirm={() => setStatus(r.id, 'cancelada')}><X size={14} />Cancelar</ConfirmButton>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {list.length === 0 && <p className="muted pad">Nenhuma reserva neste filtro.</p>}
      </div>
    </div>
  );
}
