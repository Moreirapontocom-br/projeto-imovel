/**
 * No celular as tabelas viram fichas empilhadas (CSS em base.css). Cada célula precisa do nome
 * da coluna para mostrar como rótulo; aqui ele é copiado do cabeçalho para `data-label`,
 * inclusive em linhas que o React cria depois.
 */
export function labelTableCells(root: HTMLElement = document.body) {
  const apply = () => {
    root.querySelectorAll<HTMLTableElement>('table.table:not(.table-plain)').forEach((table) => {
      const heads = [...table.querySelectorAll('thead th')].map((th) => th.textContent?.trim() ?? '');
      table.querySelectorAll('tbody tr').forEach((tr) => {
        [...tr.children].forEach((td, i) => {
          if (heads[i] && td.getAttribute('data-label') !== heads[i]) td.setAttribute('data-label', heads[i]);
        });
      });
    });
  };
  let queued = false;
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; apply(); });
  }).observe(root, { childList: true, subtree: true });
  apply();
}
