import { Link } from 'react-router-dom';
import { brand } from '@/config/brand';

/** Espaço reservado para o logo definitivo — troque o SVG mantendo as dimensões. */
export function BrandMark({ to = '/', sub = brand.tagline, inverse }: { to?: string; sub?: string; inverse?: boolean }) {
  return (
    <Link to={to} className={`brandmark ${inverse ? 'is-inverse' : ''}`} aria-label={`${brand.name}, página inicial`}>
      <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden>
        <rect width="36" height="36" rx="10" fill={inverse ? '#FFFFFF' : '#061B37'} />
        <rect x="12.5" y="12.5" width="11" height="11" rx="2" transform="rotate(45 18 18)" fill={inverse ? '#BC8733' : '#DEAD5B'} />
      </svg>
      <span className="brandmark-text">
        <strong>{brand.name}</strong>
        <small>{sub}</small>
      </span>
    </Link>
  );
}
