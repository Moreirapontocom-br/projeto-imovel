import { forwardRef, useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react';
import { CheckCircle2, Clock, Lock, Minus, Plus, X, CalendarCheck } from 'lucide-react';
import type { PropertyStatus } from '@/types';
import { statusInfo } from '@/lib/availability';

type Variant = 'primary' | 'secondary' | 'gold' | 'ghost' | 'danger';

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' | 'lg'; block?: boolean; loading?: boolean }>(
  function Button({ variant = 'primary', size = 'md', block, loading, className = '', children, disabled, ...rest }, ref) {
    return (
      <button ref={ref} className={`btn btn-${variant} btn-${size} ${block ? 'btn-block' : ''} ${className}`} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
        {loading && <span className="spinner" aria-hidden />}
        {children}
      </button>
    );
  },
);

export function IconButton({ label, children, className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button aria-label={label} title={label} className={`icon-btn ${className}`} {...rest}>
      {children}
    </button>
  );
}

const statusIcon = { disponivel: CheckCircle2, reservado: CalendarCheck, pendente: Clock, bloqueado: Lock };

export function StatusBadge({ status, size = 'md' }: { status: PropertyStatus; size?: 'sm' | 'md' }) {
  const s = statusInfo[status];
  const Icon = statusIcon[status];
  return (
    <span className={`status status-${size}`} style={{ color: s.color, background: s.soft }}>
      <Icon size={size === 'sm' ? 13 : 15} strokeWidth={2.2} aria-hidden />
      {s.label}
    </span>
  );
}

export const DemoTag = ({ children = 'Demonstração' }: { children?: ReactNode }) => <span className="demo-tag">{children}</span>;

export function Stepper({ value, min = 1, max = 16, onChange, label }: { value: number; min?: number; max?: number; onChange(v: number): void; label: string }) {
  return (
    <div className="stepper" role="group" aria-label={label}>
      <button type="button" aria-label={`Menos ${label.toLowerCase()}`} disabled={value <= min} onClick={() => onChange(value - 1)}><Minus size={16} /></button>
      <output aria-live="polite">{value}</output>
      <button type="button" aria-label={`Mais ${label.toLowerCase()}`} disabled={value >= max} onClick={() => onChange(value + 1)}><Plus size={16} /></button>
    </div>
  );
}

export const Field = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string }>(
  function Field({ label, error, hint, id, className = '', ...rest }, ref) {
    const auto = useId();
    const fid = id ?? auto;
    return (
      <div className={`field ${error ? 'has-error' : ''} ${className}`}>
        <label htmlFor={fid}>{label}</label>
        <input ref={ref} id={fid} aria-invalid={!!error || undefined} aria-describedby={error || hint ? `${fid}-msg` : undefined} {...rest} />
        {(error || hint) && <p id={`${fid}-msg`} className={error ? 'field-error' : 'field-hint'}>{error ?? hint}</p>}
      </div>
    );
  },
);

export function Modal({ open, onClose, title, children, footer, wide }: { open: boolean; onClose(): void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    // foca o primeiro campo; sem campos, foca o próprio diálogo (sem anel de foco em botão ao abrir)
    (ref.current?.querySelector<HTMLElement>('input,textarea,select') ?? ref.current)?.focus();
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; prev?.focus(); };
  }, [open]);
  if (!open) return null;
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} tabIndex={-1} className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal-head">
          <IconButton label="Fechar" className="modal-x" onClick={onClose}><X size={18} /></IconButton>
          <h2>{title}</h2>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-foot">{footer}</footer>}
      </div>
    </div>
  );
}

export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { value: NoInfer<T>; label: ReactNode }[]; onChange(v: T): void; label: string }) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}

/** Ação destrutiva com confirmação na própria tela (sem window.confirm, que alguns ambientes bloqueiam). */
export function ConfirmButton({ children, confirmLabel, onConfirm, variant = 'ghost', size = 'sm', className = '' }: { children: ReactNode; confirmLabel: string; onConfirm(): void; variant?: Variant; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const [asking, setAsking] = useState(false);
  if (!asking) return <Button variant={variant} size={size} className={className} onClick={() => setAsking(true)}>{children}</Button>;
  return (
    <span className="confirm-inline" role="group" aria-label={confirmLabel}>
      <span className="confirm-q">{confirmLabel}</span>
      <Button variant="danger" size="sm" onClick={() => { setAsking(false); onConfirm(); }} autoFocus>Sim</Button>
      <Button variant="ghost" size="sm" onClick={() => setAsking(false)}>Não</Button>
    </span>
  );
}

export function EmptyState({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      <p>{text}</p>
      {action}
    </div>
  );
}
