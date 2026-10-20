import { useRef, useState } from 'react';
import { Plus, Copy, Trash2, Download, Eye } from 'lucide-react';
import { Button, ConfirmButton, Segmented } from '@/components/ui';
import { useStore } from '@/store';
import { contractContext, fillTemplate, placeholders } from '@/lib/contract';
import { downloadContractPdf } from '@/lib/pdf';
import { ContractPreview } from '../client/ClientPages';
import type { ContractTemplate, Reservation } from '@/types';

const ctStatus = { rascunho: 'Rascunho', enviado: 'Aguardando assinatura', 'assinado-demo': 'Assinado (simulação)' };

export default function AdminContracts() {
  const [tab, setTab] = useState<'modelos' | 'gerados'>('modelos');
  return (
    <div className="admin-page">
      <header className="admin-head row">
        <div><h1>Contratos</h1><p className="muted">Modelos editáveis, preenchidos automaticamente com os dados da reserva.</p></div>
        <Segmented<'modelos' | 'gerados'> label="Seção" value={tab} onChange={setTab} options={[{ value: 'modelos', label: 'Modelos' }, { value: 'gerados', label: 'Contratos gerados' }]} />
      </header>
      {tab === 'modelos' ? <Templates /> : <Generated />}
      <p className="fineprint">Os modelos são demonstrativos e não substituem revisão jurídica. Os PDFs saem com marca d'água “sem validade jurídica”.</p>
    </div>
  );
}

function Templates() {
  const templates = useStore((s) => s.templates);
  const save = useStore((s) => s.saveTemplate);
  const del = useStore((s) => s.deleteTemplate);
  const reservations = useStore((s) => s.reservations);
  const clients = useStore((s) => s.clients);
  const properties = useStore((s) => s.properties);
  const [currentId, setCurrentId] = useState(templates[0]?.id);
  const current = templates.find((t) => t.id === currentId) ?? templates[0];
  const [draft, setDraft] = useState<ContractTemplate | null>(current ?? null);
  const [resId, setResId] = useState(reservations[0]?.id);
  const area = useRef<HTMLTextAreaElement>(null);
  const dirty = draft && current && (draft.body !== current.body || draft.name !== current.name);

  const pick = (t: ContractTemplate) => { setCurrentId(t.id); setDraft(t); };
  const r = reservations.find((x) => x.id === resId) as Reservation | undefined;
  const c = clients.find((x) => x.id === r?.clientId);
  const p = properties.find((x) => x.id === r?.propertyId);
  const preview = draft && r && c && p ? fillTemplate(draft.body, contractContext(r, c, p)) : '';

  function insert(key: string) {
    if (!draft || !area.current) return;
    const el = area.current;
    const token = `{{${key}}}`;
    const body = draft.body.slice(0, el.selectionStart) + token + draft.body.slice(el.selectionEnd);
    const pos = el.selectionStart + token.length;
    setDraft({ ...draft, body });
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(pos, pos); });
  }

  return (
    <div className="tpl">
      <aside className="tpl-list">
        {templates.map((t) => (
          <button key={t.id} className={`tpl-item ${t.id === current?.id ? 'is-on' : ''}`} onClick={() => pick(t)}>
            <strong>{t.name}</strong><small>Atualizado em {t.updatedAt.split('-').reverse().join('/')}</small>
          </button>
        ))}
        <Button variant="secondary" size="sm" onClick={() => {
          const t = { id: `tpl-${Date.now().toString(36)}`, name: 'Novo modelo', body: 'Título do contrato\n\nLocatário: {{cliente.nome}}\nImóvel: {{imovel.titulo}}\n', updatedAt: '' };
          save(t); pick(t);
        }}><Plus size={15} />Novo modelo</Button>
      </aside>

      {draft && (
        <section className="tpl-editor">
          <div className="tpl-toolbar">
            <input className="tpl-name" value={draft.name} aria-label="Nome do modelo" onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            <div className="res-actions">
              <Button size="sm" variant="ghost" onClick={() => { const t = { ...draft, id: `tpl-${Date.now().toString(36)}`, name: `${draft.name} (cópia)` }; save(t); pick(t); }}><Copy size={14} />Duplicar</Button>
              {templates.length > 1 && <ConfirmButton className="danger" confirmLabel="Excluir modelo?" onConfirm={() => { del(draft.id); const n = templates.find((t) => t.id !== draft.id); if (n) pick(n); }}><Trash2 size={14} />Excluir</ConfirmButton>}
              <Button size="sm" disabled={!dirty} onClick={() => save(draft)}>{dirty ? 'Salvar modelo' : 'Salvo'}</Button>
            </div>
          </div>
          <div className="tpl-fields">
            <span className="muted small">Inserir campo:</span>
            {placeholders.map((ph) => <button key={ph.key} className="token" onClick={() => insert(ph.key)} title={`{{${ph.key}}}`}>{ph.label}</button>)}
          </div>
          <div className="tpl-panes">
            <label className="tpl-pane">
              <span className="pane-label">Modelo</span>
              <textarea ref={area} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} spellCheck={false} />
            </label>
            <div className="tpl-pane">
              <div className="pane-label row">
                <span>Pré-visualização com</span>
                <select value={resId} onChange={(e) => setResId(e.target.value)} aria-label="Reserva para pré-visualização">
                  {reservations.map((x) => <option key={x.id} value={x.id}>{x.code} · {clients.find((k) => k.id === x.clientId)?.name}</option>)}
                </select>
              </div>
              <pre className="doc doc-sm">{preview}</pre>
              <Button size="sm" variant="secondary" disabled={!preview} onClick={() => downloadContractPdf(draft.name, preview, `contrato-${r?.code}-DEMO.pdf`)}><Download size={14} />Gerar PDF demonstrativo</Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function Generated() {
  const contracts = useStore((s) => s.contracts);
  const reservations = useStore((s) => s.reservations);
  const clients = useStore((s) => s.clients);
  const properties = useStore((s) => s.properties);
  const templates = useStore((s) => s.templates);
  const [open, setOpen] = useState<Reservation | null>(null);
  return (
    <div className="table-wrap">
      <table className="table table-rows">
        <thead><tr><th>Reserva</th><th>Cliente</th><th>Imóvel</th><th>Modelo</th><th>Situação</th><th /></tr></thead>
        <tbody>
          {contracts.map((ct) => {
            const r = reservations.find((x) => x.id === ct.reservationId);
            if (!r) return null;
            return (
              <tr key={ct.id}>
                <td className="mono">{r.code}</td>
                <td>{clients.find((c) => c.id === r.clientId)?.name}</td>
                <td>{properties.find((p) => p.id === r.propertyId)?.title}</td>
                <td>{templates.find((t) => t.id === ct.templateId)?.name ?? '—'}</td>
                <td><span className={`pill ${ct.status === 'assinado-demo' ? 'is-ok' : 'is-pending'}`}>{ctStatus[ct.status]}</span></td>
                <td className="right"><Button size="sm" variant="secondary" onClick={() => setOpen(r)}><Eye size={14} />Abrir</Button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <ContractPreview r={open} onClose={() => setOpen(null)} />
    </div>
  );
}
