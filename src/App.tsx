import { Component, lazy, Suspense, useEffect, type ComponentType, type ReactNode } from 'react';
import { HashRouter, MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AlertCircle, X } from 'lucide-react';
import { isArtifact } from '@/config/env';
import { useStore } from '@/store';
import { Button, EmptyState } from '@/components/ui';
import Search from '@/pages/Search';

// Cada publicação gera arquivos com nomes novos e apaga os antigos. Uma aba aberta antes da
// publicação pede um arquivo que não existe mais: recarrega uma vez para pegar a versão nova.
const RELOAD_KEY = 'sua-marca-chunk-reload';
const page = <T extends ComponentType<any>>(load: () => Promise<{ default: T }>) =>
  lazy(() => load().then(
    (m) => { sessionStorage.removeItem(RELOAD_KEY); return m; },
    (err) => {
      if (!sessionStorage.getItem(RELOAD_KEY)) {
        sessionStorage.setItem(RELOAD_KEY, '1');
        window.location.reload();
        return new Promise<never>(() => {});
      }
      throw err;
    },
  ));

const PropertyPage = page(() => import('@/pages/PropertyPage'));
const Cart = page(() => import('@/pages/Cart'));
const Checkout = page(() => import('@/pages/Checkout'));
const Confirmation = page(() => import('@/pages/Confirmation'));
const Login = page(() => import('@/pages/Login'));
const ClientLayout = page(() => import('@/pages/client/ClientLayout'));
const ClientReservations = page(() => import('@/pages/client/ClientPages').then((m) => ({ default: m.ClientReservations })));
const ClientPayments = page(() => import('@/pages/client/ClientPages').then((m) => ({ default: m.ClientPayments })));
const ClientContracts = page(() => import('@/pages/client/ClientPages').then((m) => ({ default: m.ClientContracts })));
const ClientMap = page(() => import('@/pages/client/ClientPages').then((m) => ({ default: m.ClientMap })));
const AdminLayout = page(() => import('@/pages/admin/AdminLayout'));
const AdminDashboard = page(() => import('@/pages/admin/AdminDashboard'));
const AdminProperties = page(() => import('@/pages/admin/AdminProperties'));
const AdminReservations = page(() => import('@/pages/admin/AdminReservations'));
const AdminPayments = page(() => import('@/pages/admin/AdminPayments'));
const AdminClients = page(() => import('@/pages/admin/AdminClients'));
const AdminContracts = page(() => import('@/pages/admin/AdminContracts'));
const AdminSettings = page(() => import('@/pages/admin/AdminSettings'));

/** Em vez de tela branca, mostra o erro com a opção de recarregar. */
class PageErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="page">
        <EmptyState
          title="Não foi possível abrir esta página"
          text="O site pode ter sido atualizado enquanto estava aberto. Recarregue para usar a versão mais recente."
          action={<Button onClick={() => { sessionStorage.removeItem(RELOAD_KEY); window.location.reload(); }}>Recarregar</Button>}
        />
      </main>
    );
  }
}

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
      <PageErrorBoundary>
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
              <Route path="pagamentos" element={<AdminPayments />} />
              <Route path="clientes" element={<AdminClients />} />
              <Route path="contratos" element={<AdminContracts />} />
              <Route path="configuracoes" element={<AdminSettings />} />
            </Route>
            <Route path="*" element={<Search />} />
          </Routes>
        </DataGate>
      </Suspense>
      </PageErrorBoundary>
    </Router>
  );
}
