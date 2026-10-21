import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, ShoppingBag, UserRound, LayoutDashboard, LogOut, LogIn, Search, KeyRound } from 'lucide-react';
import { useStore } from '@/store';
import { BrandMark } from './Brand';

export function Header({ children, below, wide }: { children?: ReactNode; below?: ReactNode; wide?: boolean }) {
  const cartCount = useStore((s) => s.cart.length);
  const role = useStore((s) => s.role);
  const clients = useStore((s) => s.clients);
  const userId = useStore((s) => s.userId);
  const signOut = useStore((s) => s.signOut);
  const nav = useNavigate();
  const [menu, setMenu] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const me = clients.find((c) => c.id === userId);
  const initial = role === 'admin' ? 'A' : me?.name[0] ?? '';

  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setMenu(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menu]);

  return (
    <header className={`site-header ${wide ? 'is-wide' : ''}`}>
      <div className="sh-top">
        <BrandMark inverse />
        <div className="sh-center">{children}</div>
        {/* escurece filtros e página enquanto o menu da conta está aberto, para o menu não parecer parte das abas */}
        {menu && <div className="menu-scrim" aria-hidden />}
        <nav className="sh-right" aria-label="Conta">
          {role === 'cliente' && <NavLink to="/cliente" className="sh-link">Minhas reservas</NavLink>}
          {role === 'admin' && <NavLink to="/admin" className="sh-link">Painel admin</NavLink>}
          {role === 'visitante' && <NavLink to="/entrar" className="sh-link sh-login">Entrar</NavLink>}
          <Link to="/carrinho" className="icon-btn icon-btn-outline sh-cart" aria-label={`Carrinho, ${cartCount} ${cartCount === 1 ? 'item' : 'itens'}`}>
            <ShoppingBag size={19} strokeWidth={1.9} />
            {cartCount > 0 && <span className="count">{cartCount}</span>}
          </Link>
          <div className="sh-menu" ref={ref}>
            <button className="account-btn" aria-haspopup="menu" aria-expanded={menu} aria-label="Menu da conta" onClick={() => setMenu(!menu)}>
              <Menu size={18} strokeWidth={2} />
              <span className={`avatar ${role === 'visitante' ? 'is-guest' : ''}`}>{role === 'visitante' ? <UserRound size={18} /> : initial}</span>
            </button>
            {menu && (
              <div className="menu" role="menu" onClick={() => setMenu(false)}>
                {role === 'visitante' ? (
                  <>
                    <Link role="menuitem" to="/entrar"><LogIn size={17} />Entrar</Link>
                    <Link role="menuitem" to="/buscar"><Search size={17} />Explorar imóveis</Link>
                  </>
                ) : (
                  <>
                    <p className="menu-who">{role === 'admin' ? 'Administrador (demo)' : me?.name}</p>
                    {role === 'cliente' && <Link role="menuitem" to="/cliente"><UserRound size={17} />Área do cliente</Link>}
                    {role === 'admin' && <Link role="menuitem" to="/admin"><LayoutDashboard size={17} />Painel administrativo</Link>}
                    <Link role="menuitem" to="/entrar"><KeyRound size={17} />Trocar perfil de demonstração</Link>
                    <button role="menuitem" onClick={() => { signOut(); nav('/'); }}><LogOut size={17} />Sair</button>
                  </>
                )}
              </div>
            )}
          </div>
        </nav>
      </div>
      {below}
    </header>
  );
}
