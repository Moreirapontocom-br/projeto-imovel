---
version: 1
slug: "src-pages-search-tsx"
primary_target: "src/pages/Search.tsx"
related_targets: ["src/components/PropertyCard.tsx"]
---

Escopo: página inicial / busca (`/` e `/buscar`). Modo: Operate (visitante encontra e compara imóveis para o período do Carnaval).
Manter: busca no topo, filtros rápidos por bairro, mapa visível junto da lista. Continuar simples.

## Direction contract

THESIS: A busca é uma vitrine de imobiliária com a planta da cidade em cima: o mapa abre a página em faixa larga e os imóveis vêm abaixo em fichas largas, uma por linha. Recusa a grade de cards fotográficos 2 colunas com mapa lateral (padrão Airbnb).

OWN-WORLD: Mundo atual sem mudança: marinho #061B37, dourado #BC8733/#DEAD5B, fundo areia #F4EEE3, cartões brancos com borda #E4DCCB, raios 3–8px, Newsreader em títulos e preços, Inter no texto, rótulos dourados em caixa alta, pins marinho em etiqueta.

STORY: O visitante vê de cara onde ficam os imóveis em Salvador, rola as fichas comparando total, distância do circuito e capacidade, ordena pelo que importa e abre o imóvel.

FIRST VIEWPORT: Cabeçalho marinho com busca e abas de filtro; faixa de mapa fixa (sticky) na largura toda, ~30vh, com controles; abaixo, título serifado + ordenação (perto do circuito / menor total / mais hóspedes) e fichas: foto 4:3 à esquerda, descrição no meio, coluna de preço com parcela e botão "Ver imóvel" à direita.

FORM: Faixa de mapa no topo + lista abaixo, posição 3 da lista ordenada. seed:6e7f9009e27acbf8

SIGNATURE: passar o mouse numa ficha acende o pin na faixa; clicar num pin rola até a ficha. Movimento único: a ficha ativa ganha contorno marinho.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
