import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { CalendarCheck, Wallet, FileText, MapPinned } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useStore } from '@/store';

const TABS: { to: string; label: string; short?: string; icon: typeof Wallet; end?: boolean }[] = [
  { to: '/cliente', label: 'Reservas', icon: CalendarCheck, end: true },
  { to: '/cliente/pagamentos', label: 'Pagamentos', icon: Wallet },
  { to: '/cliente/contratos', label: 'Contratos', icon: FileText },
  { to: '/cliente/mapa', label: 'Mapa e arredores', short: 'Mapa', icon: MapPinned },
];

/** Área exclusiva do cliente. Na produção, o backend deve validar a sessão e filtrar os dados pelo cliente. */
export default function ClientLayout() {
  const role = useStore((s) => s.role);
  const userId = useStore((s) => s.userId);
  const clients = useStore((s) => s.clients);
  const loc = useLocation();
  if (role !== 'cliente') return <Navigate to={`/entrar?next=${encodeURIComponent(loc.pathname)}`} replace />;
  const me = clients.find((c) => c.id === userId);

  return (
    <>
      <Header />
      <main className="page area">
        <div className="area-head">
          <h1>Olá, {me?.name.split(' ')[0]}</h1>
          <span className="demo-tag">Cliente fictício</span>
        </div>
        {/* no celular vira barra fixa embaixo, como num aplicativo */}
        <nav className="tabs area-tabs" aria-label="Área do cliente">
          {TABS.map(({ to, label, short, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="tab" aria-label={label}>
              <Icon size={17} /><span className="tab-long">{label}</span><span className="tab-short" aria-hidden>{short ?? label}</span>
            </NavLink>
          ))}
        </nav>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

export function useMyReservations() {
  const userId = useStore((s) => s.userId);
  const reservations = useStore((s) => s.reservations);
  return reservations.filter((r) => r.clientId === userId && r.status !== 'cancelada');
}
