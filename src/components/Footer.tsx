import { Link } from 'react-router-dom';
import { Info } from 'lucide-react';
import { brand } from '@/config/brand';
import { useStore } from '@/store';
import { BrandMark } from './Brand';

export function Footer() {
  const resetDemo = useStore((s) => s.resetDemo);
  return (
    <footer className="site-footer">
      <div className="sf-notice">
        <Info size={16} aria-hidden />
        <p>{brand.demoNotice} Distâncias até os circuitos são estimativas em linha reta a partir de coordenadas ilustrativas.</p>
      </div>
      <div className="sf-grid">
        <div>
          <BrandMark inverse />
        </div>
        <nav aria-label="Rodapé">
          <h4>Explorar</h4>
          <Link to="/buscar">Todos os imóveis</Link>
          <Link to="/buscar?bairro=Barra">Imóveis na Barra</Link>
          <Link to="/buscar?circuito=1">Perto dos circuitos</Link>
        </nav>
        <nav aria-label="Acesso">
          <h4>Acesso</h4>
          <Link to="/entrar">Entrar (demonstração)</Link>
          <Link to="/cliente">Área do cliente</Link>
          <Link to="/admin">Painel administrativo</Link>
        </nav>
        <div>
          <h4>Protótipo</h4>
          <button className="link-btn link-btn-inverse" onClick={() => { resetDemo(); location.reload(); }}>Restaurar dados de demonstração</button>
        </div>
      </div>
      <p className="sf-legal">© 2026 {brand.name} · Ambiente demonstrativo, sem transações reais.</p>
    </footer>
  );
}
