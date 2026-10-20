import { NavLink, Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { LayoutGrid, Building2, CalendarRange, Users, FileText, Settings, ExternalLink, Receipt } from 'lucide-react';
import { useStore } from '@/store';
import { BrandMark } from '@/components/Brand';
import { brand } from '@/config/brand';
import { fmtRange } from '@/lib/dates';

const NAV = [
  { to: '/admin', label: 'Visão geral', icon: LayoutGrid, end: true },
  { to: '/admin/imoveis', label: 'Imóveis', icon: Building2 },
  { to: '/admin/reservas', label: 'Reservas', icon: CalendarRange },
  { to: '/admin/pagamentos', label: 'Pagamentos', icon: Receipt },
  { to: '/admin/clientes', label: 'Clientes', icon: Users },
  { to: '/admin/contratos', label: 'Contratos', icon: FileText },
  { to: '/admin/configuracoes', label: 'Condições', icon: Settings },
];

/** Painel administrativo. Em produção, cada rota deve ser protegida também no backend. */
export default function AdminLayout() {
  const role = useStore((s) => s.role);
  const pending = useStore((s) => s.reservations.filter((r) => r.status === 'pendente').length);
  const toReview = useStore((s) => s.reservations.reduce((n, r) => n + r.installments.filter((i) => i.status === 'em-analise').length, 0));
  const loc = useLocation();
  if (role !== 'admin') return <Navigate to={`/entrar?next=${encodeURIComponent(loc.pathname)}`} replace />;

  return (
    <div className="admin">
      <aside className="admin-side">
        <BrandMark to="/admin" sub="Painel administrativo" inverse />
        <nav aria-label="Administração">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="admin-link">
              <Icon size={18} strokeWidth={1.9} />{label}
              {to === '/admin/reservas' && pending > 0 && <span className="admin-count" aria-label={`${pending} pendentes`}>{pending}</span>}
              {to === '/admin/pagamentos' && toReview > 0 && <span className="admin-count" aria-label={`${toReview} comprovantes para aprovar`}>{toReview}</span>}
            </NavLink>
          ))}
        </nav>
        <Link to="/" className="admin-link admin-out"><ExternalLink size={16} />Ver site público</Link>
      </aside>
      <div className="admin-main">
        <div className="admin-top">
          <span className="admin-period">Período de referência: <b>{brand.event} · {fmtRange(brand.defaultRange)}</b></span>
          <span className="demo-tag">Dados fictícios</span>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
