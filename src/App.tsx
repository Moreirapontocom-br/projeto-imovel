import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import { HashRouter, MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AlertCircle, X } from 'lucide-react';
import { isArtifact } from '@/config/env';
import { useStore } from '@/store';
import { Button, EmptyState } from '@/components/ui';
import Search from '@/pages/Search';

const PropertyPage = lazy(() => import('@/pages/PropertyPage'));
const Cart = lazy(() => import('@/pages/Cart'));
const Checkout = lazy(() => import('@/pages/Checkout'));
const Confirmation = lazy(() => import('@/pages/Confirmation'));
const Login = lazy(() => import('@/pages/Login'));
const ClientLayout = lazy(() => import('@/pages/client/ClientLayout'));
const ClientReservations = lazy(() => import('@/pages/client/ClientPages').then((m) => ({ default: m.ClientReservations })));
const ClientPayments = lazy(() => import('@/pages/client/ClientPages').then((m) => ({ default: m.ClientPayments })));
const ClientContracts = lazy(() => import('@/pages/client/ClientPages').then((m) => ({ default: m.ClientContracts })));
const ClientMap = lazy(() => import('@/pages/client/ClientPages').then((m) => ({ default: m.ClientMap })));
const AdminLayout = lazy(() => import('@/pages/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const AdminProperties = lazy(() => import('@/pages/admin/AdminProperties'));
const AdminReservations = lazy(() => import('@/pages/admin/AdminReservations'));
const AdminClients = lazy(() => import('@/pages/admin/AdminClients'));
const AdminContracts = lazy(() => import('@/pages/admin/AdminContracts'));
const AdminSettings = lazy(() => import('@/pages/admin/AdminSettings'));

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

/** No modo API, espera a primeira carga do servidor e mostra falhas de gravação. */
function DataGate({ children }: { children: ReactNode }) {
  const ready = useStore((s) => s.ready);
  const loadError = useStore((s) => s.loadError);
  const syncError = useStore((s) => s.syncError);
  const hydrate = useStore((s) => s.hydrate);
  const clearSyncError = useStore((s) => s.clearSyncError);
  useEffect(() => { void hydrate(); }, [hydrate]);
  if (!ready) {
    return loadError
      ? <main className="page"><EmptyState title="Não foi possível carregar os imóveis" text={loadError} action={<Button onClick={() => void hydrate()}>Tentar de novo</Button>} /></main>
      : <div className="page-loading" aria-busy="true" />;
  }
  return (
    <>
      {children}
      {syncError && (
        <div className="sync-error form-error" role="alert">
          <AlertCircle size={16} />
          <span>{syncError}</span>
          <button className="link-btn" onClick={clearSyncError} aria-label="Fechar aviso"><X size={16} /></button>
        </div>
      )}
    </>
  );
}

// HashRouter: funciona em hospedagem estática (GitHub Pages) sem configuração de servidor.
// MemoryRouter na versão para páginas do Claude, que não repassam rotas no hash da URL.
const Router = isArtifact ? MemoryRouter : HashRouter;

export default function App() {
  return (
    <Router>
      <ScrollTop />
      <Suspense fallback={<div className="page-loading" aria-busy="true" />}>
        <DataGate>
          <Routes>
            {/* A página inicial é a própria busca: lista de imóveis + mapa, como nas plataformas de hospedagem */}
            <Route path="/" element={<Search />} />
            <Route path="/buscar" element={<Search />} />
            <Route path="/imovel/:id" element={<PropertyPage />} />
            <Route path="/carrinho" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/confirmacao" element={<Confirmation />} />
            <Route path="/entrar" element={<Login />} />
            <Route path="/cliente" element={<ClientLayout />}>
              <Route index element={<ClientReservations />} />
              <Route path="pagamentos" element={<ClientPayments />} />
              <Route path="contratos" element={<ClientContracts />} />
              <Route path="mapa" element={<ClientMap />} />
            </Route>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="imoveis" element={<AdminProperties />} />
              <Route path="reservas" element={<AdminReservations />} />
              <Route path="clientes" element={<AdminClients />} />
              <Route path="contratos" element={<AdminContracts />} />
              <Route path="configuracoes" element={<AdminSettings />} />
            </Route>
            <Route path="*" element={<Search />} />
          </Routes>
        </DataGate>
      </Suspense>
    </Router>
  );
}
