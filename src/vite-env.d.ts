/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "artifact" gera a versão para páginas do Claude (mapa offline, MemoryRouter, downloads via capability). */
  readonly VITE_TARGET?: string;
  /** Endereço da API (ex.: "/api"). Vazio = modo demonstração com dados no navegador. */
  readonly VITE_API_URL?: string;
}
