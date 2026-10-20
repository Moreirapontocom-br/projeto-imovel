import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SearchBar } from '@/components/SearchBar';
import { PropertyCard } from '@/components/PropertyCard';
import { PropertyMap } from '@/components/PropertyMap';
import { neighborhoods } from '@/data/geo';
import { useCatalog } from '@/hooks/useCatalog';
import { useStore } from '@/store';
import { brand } from '@/config/brand';
import { fmtRange } from '@/lib/dates';

const ROWS: { title: string; bairros: string[] }[] = [
  { title: 'Na Barra', bairros: ['Barra'] },
  { title: 'Ondina e Rio Vermelho', bairros: ['Ondina', 'Rio Vermelho'] },
  { title: 'Graça, Vitória e Campo Grande', bairros: ['Graça', 'Vitória', 'Campo Grande'] },
  { title: 'Pituba e Centro Histórico', bairros: ['Pituba', 'Pelourinho'] },
];

export default function Home() {
  const range = brand.defaultRange;
  const items = useCatalog(range);
  const terms = useStore((s) => s.terms);
  const count = (b: string) => items.filter((i) => i.property.neighborhood === b).length;

  return (
    <>
      <Header below={<div className="home-search"><SearchBar size="lg" /></div>} />

      <nav className="nb-tabs" aria-label="Bairros">
        {neighborhoods.map((n) => (
          <Link key={n.name} to={`/buscar?bairro=${encodeURIComponent(n.name)}`} className="nb-tab">
            <strong>{n.name}</strong>
            <small>{count(n.name)} {count(n.name) === 1 ? 'imóvel' : 'imóveis'}</small>
          </Link>
        ))}
      </nav>

      <main className="home">
        <section className="home-intro">
          <h1>Seu apartamento para o Carnaval de Salvador</h1>
          <p>{fmtRange(range)} de 2027 · {items.length} imóveis em {neighborhoods.length} bairros · <Link to="/buscar">ver tudo no mapa</Link></p>
        </section>

        {ROWS.map((row) => (
          <Rail key={row.title} title={row.title} href={`/buscar?bairro=${encodeURIComponent(row.bairros.join(','))}`}>
            {items.filter((i) => row.bairros.includes(i.property.neighborhood)).map((i) => (
              <PropertyCard key={i.property.id} property={i.property} total={i.total} status={i.status} range={range} compact />
            ))}
          </Rail>
        ))}

        <section className="home-map">
          <div className="home-map-copy">
            <h2>Escolha pelo mapa</h2>
            <p>Veja onde fica cada imóvel e o que existe por perto. Os circuitos Dodô, Osmar e Batatinha aparecem como referência.</p>
            <Link to="/buscar" className="btn btn-primary btn-md">Abrir busca com mapa <ArrowRight size={16} /></Link>
          </div>
          <PropertyMap items={items} className="home-map-canvas" />
        </section>

        <section className="home-pay">
          <div>
            <h2>Reserve com entrada e parcele o saldo</h2>
            <p>Entrada de {terms.downPaymentPercent}% e saldo em até {terms.maxInstallments}x no cartão ou {terms.pixMaxInstallments}x no Pix. Contrato gerado automaticamente a partir da sua reserva.</p>
          </div>
          <dl className="home-pay-facts">
            <div><dt>Entrada</dt><dd>{terms.downPaymentPercent}%</dd></div>
            <div><dt>Cartão</dt><dd>até {terms.maxInstallments}x</dd></div>
            <div><dt>Pix</dt><dd>até {terms.pixMaxInstallments}x</dd></div>
          </dl>
          <p className="home-pay-note">Condições demonstrativas, configuráveis no painel administrativo. Nenhuma cobrança é processada.</p>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Rail({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (d: 1 | -1) => ref.current?.scrollBy({ left: d * ref.current.clientWidth * 0.8, behavior: 'smooth' });
  return (
    <section className="rail">
      <div className="rail-head">
        <h2><Link to={href}>{title} <ChevronRight size={20} strokeWidth={2.4} aria-hidden /></Link></h2>
        <div className="rail-ctrl">
          <button className="icon-btn icon-btn-outline icon-btn-sm" aria-label={`Rolar ${title} para a esquerda`} onClick={() => scroll(-1)}><ChevronLeft size={16} /></button>
          <button className="icon-btn icon-btn-outline icon-btn-sm" aria-label={`Rolar ${title} para a direita`} onClick={() => scroll(1)}><ChevronRight size={16} /></button>
        </div>
      </div>
      <div className="rail-track" ref={ref}>{children}</div>
    </section>
  );
}
