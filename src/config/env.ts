// Alvo de build. `npm run build:artifact` gera a versão para páginas do Claude (claude.ai),
// que bloqueiam imagens externas, downloads diretos e diálogos do navegador.
export const isArtifact = import.meta.env.VITE_TARGET === 'artifact';

export const mapTiles = isArtifact
  ? {
      // blocos pré-baixados (scripts/fetch-tiles.mjs) publicados junto com a página
      url: 'tiles/{z}/{y}/{x}.jpg',
      minZoom: 12,
      maxZoom: 16,
      bounds: [[-12.955, -38.552], [-13.025, -38.445]] as [[number, number], [number, number]],
    }
  : {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      minZoom: 3,
      maxZoom: 19,
      bounds: undefined,
    };

// Com VITE_API_URL definido (ex.: "/api"), os dados vêm do servidor (server/) em vez do navegador.
// Sem ele, o site funciona sozinho em modo demonstração, como no GitHub Pages.
export const apiUrl = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
export const apiMode = Boolean(apiUrl) && !isArtifact;
