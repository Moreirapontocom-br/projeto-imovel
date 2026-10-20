import { useNavigate, useSearchParams } from 'react-router-dom';
import { Compass, UserRound, LayoutDashboard, ArrowRight } from 'lucide-react';
import { useStore } from '@/store';
import { BrandMark } from '@/components/Brand';
import type { Role } from '@/types';

const PROFILES: { role: Role; title: string; text: string; to: string; icon: typeof Compass }[] = [
  { role: 'visitante', title: 'Visitante', text: 'Busca, mapa, detalhes do imóvel, carrinho e checkout simulado.', to: '/', icon: Compass },
  { role: 'cliente', title: 'Cliente', text: 'Mariana Costa (fictícia): reservas, pagamentos, contratos e mapa do entorno.', to: '/cliente', icon: UserRound },
  { role: 'admin', title: 'Administrador', text: 'Status de todos os imóveis, reservas, clientes, contratos e condições.', to: '/admin', icon: LayoutDashboard },
];

export default function Login() {
  const signIn = useStore((s) => s.signIn);
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const next = sp.get('next');

  return (
    <main className="login">
      <div className="login-card">
        <BrandMark />
        <h1>Entrar na demonstração</h1>
        <p className="muted">Escolha um perfil. Na versão final, cada perfil terá login próprio e permissões validadas no servidor.</p>
        <ul className="login-list">
          {PROFILES.map(({ role, title, text, to, icon: Icon }) => (
            <li key={role}>
              <button onClick={() => { signIn(role); nav(next && role !== 'visitante' && next.startsWith(role === 'admin' ? '/admin' : '/cliente') ? next : to); }}>
                <span className="login-ico"><Icon size={22} /></span>
                <span className="login-txt"><strong>{title}</strong><small>{text}</small></span>
                <ArrowRight size={18} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
