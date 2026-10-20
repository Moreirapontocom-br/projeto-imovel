# Design System — Plataforma Imobiliária | Carnaval de Salvador

> **Referências:** layout de listagem e mapa inspirado na captura do Airbnb; identidade cromática inspirada no material promocional G3 / Adriano Campos. A estrutura visual é uma referência, não uma instrução para reproduzir marcas de terceiros. **Os valores HEX e dimensões são aproximações visuais**, não especificações oficiais. Estados, breakpoints e elementos não exibidos nas imagens são propostas de implementação.

## 1. Cores

### Paleta extraída da referência promocional

A nova identidade abandona o rosa da referência Airbnb e prioriza **azul-marinho profundo, dourado quente e branco**, como no anúncio de aluguel para o Carnaval de Salvador. O azul predomina nos fundos institucionais e em títulos; o dourado marca preços, ícones, seleções e pontos de destaque. O branco mantém a área de busca e listagem clara, arejada e comercial.

| Token | HEX aproximado | Origem visual / uso recomendado |
|---|---|---|
| `brand-navy` | `#061B37` | Azul-marinho escuro do rodapé e dos elementos institucionais; títulos, navegação, botões principais |
| `brand-navy-deep` | `#03142B` | Fundo mais profundo do anúncio; hover de botões azuis |
| `brand-gold` | `#BC8733` | Dourado predominante nos destaques e títulos do anúncio; CTA secundário, marcadores e preços destacados |
| `brand-gold-light` | `#DEAD5B` | Reflexos e ornamentos dourados; hover em ações douradas sobre fundo escuro |
| `brand-blue` | `#1767A1` | Azul do mar/céu na peça; detalhes cartográficos e links contextuais, com uso moderado |
| `surface` | `#FFFFFF` | Cartões, barra de busca, cabeçalho e listagem |
| `surface-soft` | `#F7F8FA` | Área de apoio, skeletons e hover suave |
| `surface-warm` | `#FBF8F1` | Destaque delicado de parcelas, seleções e condições comerciais |
| `text-primary` | `#061B37` | Texto principal no fundo claro |
| `text-secondary` | `#626A73` | Descrições, localização, metadados |
| `border` | `#DCE0E4` | Divisórias e contornos dos filtros |
| `success` | `#167347` | Mensagens confirmadas e disponibilidade — estado proposto |
| `error` | `#B42318` | Erros de preenchimento — estado proposto |
| `warning` | `#9B650B` | Pendências e aviso — estado proposto |

**Distribuição visual:** ~75–85% de superfícies brancas/neutras na busca de imóveis, azul-marinho em navegação e CTAs estruturais, dourado aplicado pontualmente para valor percebido. Evitar transformar cada card em um bloco azul ou dourado.

### Estados

| Estado | Regra |
|---|---|
| Padrão | Fundo branco, texto azul-marinho e borda cinza fina |
| Hover | Fundo `#F7F8FA` nos filtros; azul mais escuro em CTAs azuis |
| Selecionado | Borda azul-marinho, leve fundo `#FBF8F1` e, opcionalmente, pequeno detalhe dourado |
| Foco | Outline de 2px em azul-marinho, offset de 3px; alternativa clara para superfícies escuras |
| Desabilitado | Contraste preservado, cursor adequado, nunca comunicar estado só por opacidade |
| Sucesso | Verde apenas para mensagem de sucesso/confirmado, não para texto normal |
| Erro | Vermelho + texto e ícone explicativo |
| Indisponível | Cinza neutro + rótulo textual e ícone, não só cor |

**Mapa administrativo:** disponível = azul-marinho com indicador textual; reservado = dourado com indicador textual; indisponível = cinza-escuro com indicador textual. A legenda deve estar sempre visível. **Mapa do cliente:** não mostrar unidades indisponíveis como opções compráveis.

## 2. Tipografia

**Padrão observado na captura do Airbnb:** sans-serif contemporânea, arredondamento discreto, títulos de médio peso, descrições leves e números legíveis. A fonte específica não pode ser comprovada pela imagem. **Implementação:** `Inter`, com fallback `Arial, sans-serif`. Não copiar fonte proprietária sem licença.

| Papel | Mobile | Desktop | Peso | Line-height | Letter-spacing |
|---|---:|---:|---:|---:|---:|
| Título principal / H1 | 28px | 36px | 700 | 1.2 | -0.03em |
| Título de seção / H2 | 22px | 24px | 700 | 1.3 | -0.02em |
| Título de card / H3 | 16px | 16px | 600 | 1.4 | -0.01em |
| Preço principal | 18px | 18px | 700 | 1.3 | -0.01em |
| Corpo | 15px | 16px | 400 | 1.5 | 0 |
| Descrição / metadado | 14px | 15px | 400 | 1.45 | 0 |
| Filtro / botão | 14px | 14px | 500–600 | 1.2 | 0 |
| Badge | 12px | 13px | 600 | 1.25 | 0 |
| Legenda | 12px | 12px | 400 | 1.4 | 0 |

Evitar textos inteiros em caixa alta. Usar caixa alta só em pequenas chamadas promocionais. Preço e valor da parcela devem ficar destacados, mas nunca substituir o preço total.

## 3. Tokens CSS

```css
:root {
  /* Marca — aproximações da peça enviada */
  --color-brand-navy: #061B37;
  --color-brand-navy-deep: #03142B;
  --color-brand-gold: #BC8733;
  --color-brand-gold-light: #DEAD5B;
  --color-brand-blue: #1767A1;

  /* Texto, superfícies, bordas */
  --color-text-primary: #061B37;
  --color-text-secondary: #626A73;
  --color-text-inverse: #FFFFFF;
  --color-surface: #FFFFFF;
  --color-surface-soft: #F7F8FA;
  --color-surface-warm: #FBF8F1;
  --color-border: #DCE0E4;

  /* Estados */
  --color-success: #167347;
  --color-error: #B42318;
  --color-warning: #9B650B;
  --color-available: #061B37;
  --color-reserved: #BC8733;
  --color-unavailable: #68717C;

  /* Tipografia */
  --font-sans: "Inter", Arial, sans-serif;
  --font-size-xs: 12px;
  --font-size-sm: 14px;
  --font-size-base: 16px;
  --font-size-lg: 18px;
  --font-size-xl: 24px;
  --font-size-2xl: 36px;
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  /* Espaçamentos: múltiplos de 4px */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-14: 56px;

  /* Raios */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-card: 20px;
  --radius-pill: 999px;

  /* Sombras suaves, como na busca e nas etiquetas do mapa */
  --shadow-search: 0 2px 10px rgb(3 20 43 / 12%);
  --shadow-map-pin: 0 2px 6px rgb(3 20 43 / 20%);
  --shadow-modal: 0 18px 48px rgb(3 20 43 / 20%);

  /* Estrutura — valores desktop aproximados */
  --header-height: 88px;
  --filters-height: 70px;
  --page-gutter: 54px;
  --cards-gap: 26px;
  --focus-ring: 2px solid #061B37;
  --motion-fast: 150ms ease;
  --motion-base: 200ms ease;
}

@media (max-width: 1023px) {
  :root { --page-gutter: 24px; --cards-gap: 16px; }
}
@media (max-width: 767px) {
  :root { --page-gutter: 16px; --header-height: 64px; }
}

:focus-visible {
  outline: var(--focus-ring);
  outline-offset: 3px;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
```

## 4. Layout

### Estrutura principal observada

1. **Header horizontal branco:** marca à esquerda, busca em cápsula central, acesso a conta/menu à direita.
2. **Linha de filtros em chips:** controles arredondados com borda fina, distribuídos horizontalmente e com rolagem quando necessário.
3. **Conteúdo em duas áreas:** grade de imóveis à esquerda (duas colunas na referência) e mapa geográfico amplo à direita.
4. **Mapa:** bordas arredondadas, etiquetas de preço flutuantes, zoom e opção de ampliar.
5. **Cards:** fotografia domina visualmente, sem borda de contorno, seguida de blocos de informação compactos.

| Propriedade | Referência desktop | Regra de implementação |
|---|---|---|
| Margens laterais | ~54px | `--page-gutter` |
| Header | ~88px | Altura adaptável conforme a navegação |
| Faixa de filtros | ~70px | Linha única com scroll horizontal |
| Grid | 2 colunas de cards + mapa | CSS Grid; evitar larguras fixas em pixels |
| Proporção lista/mapa | Aproximadamente metade/metade | `grid-template-columns: minmax(0, 1fr) minmax(0, 1fr)` |
| Espaço entre cards | ~26px | `--cards-gap` |
| Imagens dos cards | Aproximadamente 1.3:1 | `aspect-ratio: 4 / 3` como padronização |
| Cantos de imagem e mapa | ~20px | `--radius-card` |

### Exemplo de grid

```css
.results-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 48px;
  padding-inline: var(--page-gutter);
}

.properties-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 36px var(--cards-gap);
}

.map-panel {
  position: sticky;
  top: calc(var(--header-height) + var(--filters-height) + 16px);
  height: calc(100dvh - var(--header-height) - var(--filters-height) - 32px);
  min-height: 420px;
  border-radius: var(--radius-card);
  overflow: hidden;
}
```

## 5. Componentes

### 5.1 Header e navegação

- Logo/marca imobiliária à esquerda; **não usar logo do Airbnb**.
- Barra de pesquisa central com campos separados por divisórias verticais: bairro/localização, período e hóspedes.
- Botão de busca circular azul-marinho com ícone branco; aplicar dourado apenas como acento.
- Acesso à conta, favoritos/carrinho e menu com ícones simples.
- Navegação administrativa separada da navegação de clientes.

### 5.2 Busca e filtros

- Chips arredondados (`border-radius: 999px`), fundo branco, borda `#DCE0E4`, texto azul-marinho.
- Opções fundamentais para o Carnaval: **bairro**, **faixa de preço**, **datas**, **capacidade de hóspedes**, **distância do circuito** e **disponibilidade**.
- Complementares: ar-condicionado, Wi-Fi, estacionamento, número de quartos, cozinha e comodidades.
- Seleção múltipla quando fizer sentido; botão **Limpar filtros**; filtros sempre sincronizados com os marcadores do mapa.
- Mostrar quantidade de imóveis encontrados e estado de lista vazia.

```css
.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 8px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: var(--color-surface);
  color: var(--color-text-primary);
  font: 500 14px/1.2 var(--font-sans);
  cursor: pointer;
  transition: background var(--motion-fast), border-color var(--motion-fast);
}
.filter-chip:hover { background: var(--color-surface-soft); }
.filter-chip[aria-pressed="true"] {
  border-color: var(--color-brand-navy);
  background: var(--color-surface-warm);
}
```

### 5.3 Cards de apartamentos

**Estrutura:** fotografia ilustrativa → badge contextual e favorito sobrepostos → bairro e avaliação → pequena descrição → capacidade/quartos → período → **preço total** → **parcelas disponíveis**.

- Imagem em destaque e cantos de 20px; carrossel com pequenos indicadores.
- Badge branco com texto azul-marinho: por exemplo, “Perto do circuito”.
- Dourado para um destaque comercial específico (ex.: “Pagamento facilitado”), sem usar em todos os textos.
- Descrições curtas, no máximo 2 linhas na listagem; dados completos na página de detalhes.
- Usar fotos **identificadas como ilustrativas**, pois ainda não há acervo oficial.
- Não criar notas, avaliações de hóspedes, descontos ou condições contratuais fictícias como se fossem reais.

### 5.4 Botões

| Variante | Aparência | Aplicação |
|---|---|---|
| Primário | Azul-marinho sólido, texto branco, pill | Buscar, consultar disponibilidade, avançar |
| Secundário | Branco, borda azul-marinho, texto azul-marinho | Ver detalhes, voltar |
| Destaque | Dourado sobre azul-marinho, com contraste validado | Chamada comercial pontual |
| Ícone | Botão circular transparente ou branco | Favoritar, mapa, menu, carrinho |
| Destrutivo | Vermelho com rótulo explícito | Excluir cadastro no painel administrativo |
| Desabilitado | Estilo neutro e atributo `disabled` real | Ações indisponíveis |

### 5.5 Inputs, selects, date picker e formulários

- Borda cinza de 1px, fundo branco, raio de 12px, rótulo externo sempre visível.
- Espaçamento interno 12–16px e alvos de interação de no mínimo 44×44px.
- Campos de reserva: datas, pessoas, nome, contato, dados exigidos pelo processo comercial.
- Exibir exemplos nos placeholders, mas **não usar placeholder como único rótulo**.
- Erros específicos abaixo do campo, com `aria-describedby`.
- Nunca coletar documentos ou meios de pagamento além do necessário; proteger acesso e dados.

### 5.6 Mapa e marcadores

- Mapa real com localização dos imóveis; etiqueta flutuante branca com preço em azul-marinho e sombra discreta.
- Marcador selecionado: azul-marinho com texto branco; seleção sincronizada ao card correspondente.
- Mostrar áreas/circuitos do Carnaval **apenas quando existir geometria e fonte confiáveis**; nunca inventar ruas ou trajetos.
- Ao selecionar imóvel: centralizar o mapa, destacar o card e oferecer “Ver detalhes”.
- Painel admin: todas as unidades e legenda permanente (disponível, reservada, indisponível).
- Cliente com compra/reserva: mostrar apenas sua unidade em visão personalizada, mais pontos de interesse autorizados no entorno; outros imóveis privados não devem ser expostos.
- Ter listagem em texto como alternativa acessível ao mapa.

### 5.7 Badges e estados de disponibilidade

- Badges tipo pill: branco, texto azul-marinho, padding horizontal 12px, vertical 6px, fonte 12–13px semibold.
- Exemplos: “Próximo ao circuito”, “Vista para o mar”, “Famílias”, “Foto ilustrativa”.
- Disponibilidade sempre com texto visível: **Disponível**, **Reservado**, **Indisponível**.
- Dourado sinaliza atenção comercial, **não substitui** a cor específica de mensagens de erro ou sucesso.

### 5.8 Modal e drawer

Os modais não aparecem na referência; o padrão abaixo é **proposto para completar o sistema**.

- Desktop: modal central com largura máxima de 560px, superfície branca, raio 20px, sombra forte e backdrop escurecido.
- Mobile: drawer inferior ou tela cheia, conforme complexidade da tarefa.
- Usos: filtros avançados, escolha de pagamento, revisão de reserva e confirmação de dados.
- Título, fechar, conteúdo e ações fixas; foco inicial apropriado, `Escape` para sair e foco retornando ao gatilho.
- Contratos devem ser exibidos com dados reais e revisão antes de qualquer assinatura; demonstração deve ser explicitamente marcada.

### 5.9 Carrinho, parcelas e contratos

- Ícone de carrinho no header com quantidade de itens.
- Resumo claro de valores: datas, preço total, taxas informadas, entrada e parcelas **somente se as condições forem cadastradas e validadas**.
- Nunca inventar taxa de juros, calendário de pagamento, regras de cancelamento ou cláusulas contratuais.
- Fluxo sugerido: selecionar imóvel → conferir datas/pessoas → revisar valores → informar dados → confirmar solicitação → gerar documento conforme modelo aprovado.
- Status “Solicitação enviada” não equivale a pagamento confirmado nem a reserva garantida.

## 6. Responsividade — mobile first

| Faixa | Layout | Busca/filtros | Mapa |
|---|---|---|---|
| Até 767px | 1 card por linha | Busca condensada, chips com rolagem horizontal | Alternar “Lista / Mapa” por controle persistente |
| 768–1023px | 2 cards quando houver espaço | Busca adaptável; filtros com scroll | Mapa em modo alternável ou painel dedicado |
| 1024–1439px | 2 cards + mapa à direita | Barra de busca centralizada | Sticky no desktop |
| 1440px+ | 2 cards largos + mapa expansivo | Preservar margens generosas | Sticky com controles flutuantes |

```css
.results-layout { display: block; padding-inline: var(--page-gutter); }
.properties-grid { display: grid; grid-template-columns: 1fr; gap: 24px; }
.mobile-view-toggle { display: flex; }
.map-panel { display: none; }
.results-layout[data-view="map"] .map-panel { display: block; }
.results-layout[data-view="map"] .properties-grid { display: none; }

@media (min-width: 768px) {
  .properties-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (min-width: 1024px) {
  .results-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 48px;
  }
  .map-panel { display: block; }
  .mobile-view-toggle { display: none; }
}
```

**Observação:** o comportamento mobile não é observável na imagem; esta seção é uma solução de UX proposta, coerente com a referência.

## 7. Usabilidade e acessibilidade

- Contraste mínimo WCAG AA: **4,5:1 para texto comum** e **3:1 para texto grande e componentes gráficos**; verificar as combinações reais antes de publicar.
- Não aplicar texto branco pequeno sobre o dourado `#BC8733` sem validação de contraste; preferir azul-marinho sobre dourado ou dourado como borda/ícone.
- Áreas clicáveis de pelo menos 44×44px; separar botões próximos.
- Foco de teclado sempre perceptível e navegação por Tab na ordem visual.
- Cards acionáveis devem ter nomes acessíveis completos, como “Ver apartamento em Ondina, 4 hóspedes, preço total ...”.
- Ícones isolados com `aria-label`; imagens com `alt` descritivo e sem redundâncias.
- Mensagens de erro ligadas ao campo correspondente; nunca depender somente de cor.
- Carrossel navegável por teclado e toque, com controles anunciados ao leitor de tela.
- Filtros sincronizados com contagem de resultados; anunciar atualização por região `aria-live` sem excesso.
- Mapa não pode ser a única forma de acessar informação. Disponibilizar lista e detalhes equivalentes.
- Respeitar `prefers-reduced-motion`; evitar animações longas e automáticas.

## 8. Direção de imagens

**Padrão extraído da listagem:** fotografia imobiliária nítida, realista, iluminação natural ou aconchegante, ambientes com boa profundidade e composição horizontal. Os cards usam imagens grandes, sem moldura pesada; o conteúdo textual aparece logo abaixo.

**Adaptação para a marca do Carnaval:**

- Priorizar apartamentos, sala, quarto, varanda, vista, fachada e localização ilustrativa de Salvador.
- Proporção padrão de catálogo **4:3**; hero de campanha em **16:9**; galeria completa com miniaturas.
- Cores fotográficas naturais, sem filtros azulados ou dourados excessivos; a identidade fica principalmente nos controles e na tipografia.
- Pessoas em banners devem ser usadas com parcimônia: a busca de imóveis deve apresentar primeiro o imóvel e a localização.
- Não reutilizar logotipos, fotografias ou retratos da peça promocional sem autorização para uso no site.
- Exibir selo discreto **“Imagem ilustrativa”** em todos os imóveis demonstrativos.
- Prever fallback neutro com ícone de imagem para fotos ausentes; evitar imagem quebrada.
- Otimizar em WebP/AVIF, usar `srcset`, lazy loading abaixo da dobra e dimensões para evitar layout shift.

**Ícones:** traço fino, geometria simples e uniforme; Lucide ou conjunto equivalente. Padrão 18–20px; navegação principal 22–24px. Ícones dourados em superfícies azul-marinho ou azul-marinho em fundos claros.

## 9. Regras de implementação

### Nomenclatura e arquitetura

- Componentes React em PascalCase (`PropertyCard`, `PropertyMap`, `FilterChip`, `PaymentSummary`).
- Tokens CSS e classes em kebab-case; arquivos de componente com nomenclatura consistente.
- Dados de imóveis separados da interface (`properties`, `availability`, `paymentTerms`, `carnivalCircuits`).
- Componentes reutilizáveis para chips, badges, botões, cards e marcadores.
- Estados de disponibilidade centralizados; mapa, catálogo, painel administrativo e checkout consultam a mesma fonte de verdade.
- Usar IDs estáveis em cada imóvel; não identificar unidades pela posição no array.
- Separar permissões de cliente e administração **no backend**, não só ocultando botões no frontend.

### Boas práticas

1. Construir primeiro uma experiência de busca convincente, limpa e comercialmente clara.
2. Usar imóveis e fotos de demonstração apenas como **exemplos explicitamente identificados**.
3. Manter contraste e semântica adequados mesmo quando o visual usar azul-marinho e dourado.
4. Sincronizar resultados da lista e marcadores do mapa a cada filtro.
5. Tratar carregamento, lista vazia, erro, ausência de imagem e conexão lenta.
6. Garantir que o carrinho não bloqueie datas nem confirme uma compra sem verificação transacional de disponibilidade.
7. Usar modelos contratuais aprovados pelo responsável antes de gerar contratos válidos.
8. Usar mapas/circuitos a partir de fontes verificadas; informar quando distâncias forem estimativas.
9. Reservar espaço para logo e identidade final da empresa sem reescrever componentes.
10. Validar responsividade, teclado, leitores de tela e desempenho em dispositivos reais.

### Evitar

- **Não** reutilizar o rosa do Airbnb no novo projeto.
- **Não** copiar a marca, os textos ou as fotografias do Airbnb.
- **Não** transformar o dourado em cor de todo botão e todo preço; preservar hierarquia.
- **Não** poluir cards com grandes blocos de informações contratuais.
- **Não** apresentar imóvel ilustrativo como oferta disponível e verificável.
- **Não** misturar preço total, parcela e taxas de maneira ambígua.
- **Não** depender exclusivamente de marcadores coloridos para transmitir disponibilidade.
- **Não** criar avaliações, descontos, nomes de clientes ou regras de pagamento não fornecidos.

### Orientação final para Claude Code

> Manter a arquitetura visual de busca imobiliária apresentada na referência do Airbnb — header minimalista, filtros em chips, cards fotográficos à esquerda e mapa à direita —, mas usar exclusivamente a identidade de **azul-marinho, dourado e branco** inspirada na peça G3 / Adriano Campos. Desenvolver uma interface original, responsiva, acessível e comercial, voltada ao aluguel de apartamentos para o Carnaval de Salvador. Todos os imóveis, fotografias, preços e condições não confirmados devem ser sinalizados como demonstração. Priorizar integração lista-mapa, filtros por bairro/preço/proximidade do circuito, experiência de carrinho, informações de parcelamento e separação entre visão do cliente e painel do administrador.
