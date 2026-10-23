# Projeto Imóvel · Documentação

Protótipo **demonstrativo** de uma plataforma de locação de apartamentos para o Carnaval de Salvador, feito para apresentação comercial.

- **Link público para o cliente:** https://moreirapontocom-br.github.io/projeto-imovel/
  Publicado no GitHub Pages; atualiza sozinho a cada envio para a branch `main`.
- **Página privada do Claude (alternativa):** https://claude.ai/artifact/QLnmYYVxCJ3Vr9PUto56Yr
- **Rodar no computador:** `npm install` e depois `npm run dev`, em http://localhost:5173
- **Repositório (público):** https://github.com/Moreirapontocom-br/projeto-imovel

> Tudo é fictício: imóveis, fotos (geradas por IA), valores, pessoas, reservas e contratos. Não há cobrança real, e os contratos não têm validade jurídica.

---

## 1. O que foi entregue

| Requisito | Onde está | Situação |
|---|---|---|
| Página inicial com busca, destaques e mapa | `/` (lista + mapa lado a lado, estilo Airbnb) | Pronto |
| Catálogo com 12 apartamentos em bairros de Salvador | `src/data/properties.ts` | Pronto |
| Mapa com circuitos Dodô, Osmar e Batatinha | Botão "Circuitos" no mapa | Pronto (traçado ilustrativo) |
| Filtros por bairro, preço, hóspedes e distância do circuito | Faixa de filtros + modal "Filtros" | Pronto |
| Painel admin com status por cor | `/admin` | Pronto |
| Gestão de imóveis, reservas, clientes e contratos | `/admin/imoveis`, `/reservas`, `/clientes`, `/contratos` | Pronto |
| Área do cliente (reservas, pagamentos, contratos, mapa) | `/cliente` | Pronto |
| Carrinho e checkout simulado | `/carrinho`, `/checkout` | Pronto |
| Pagamentos: total, entrada, parcelas, Pix e cartão | Checkout + `/admin/configuracoes` | Pronto, condições configuráveis |
| Pix por parcela com comprovante e aprovação | Confirmação, `/cliente/pagamentos`, `/admin/pagamentos` | Pronto (Pix fictício) |
| Modelos de contrato editáveis + PDF | `/admin/contratos` | Pronto, PDF com marca d'água |
| Calendário por imóvel que impede conflitos | Página do imóvel + editor do admin | Pronto |

## 2. Roteiro de demonstração (5 minutos)

1. **Busca:** abra a página inicial. Passe o mouse nos cards e veja o pin destacar no mapa. Clique num pin para ver o card do imóvel (na faixa de mapa do computador ele abre compacto, na horizontal).
2. **Filtros:** escolha "Barra", depois "Distância do circuito › Até 1 km". Ligue "Circuitos" no mapa.
3. **Imóvel:** abra um apartamento disponível. Mostre as fotos, as comodidades, o calendário (dias riscados = ocupados) e as distâncias até os circuitos.
4. **Reserva:** clique em **Reservar**, preencha os dados, escolha **Pix** e "Entrada + 3x". Confirme a reserva simulada.
5. **Pix:** a confirmação mostra o QR Code e o copia e cola da entrada. Anexe qualquer foto ou PDF como comprovante: a entrada fica *em análise*. Em Minha área › Pagamentos, cada parcela tem seu próprio QR Code, inclusive nas reservas feitas no cartão. Mostre também o contrato preenchido automaticamente (Visualizar / PDF).
6. **Admin:** Menu › Entrar › **Administrador**. Em **Pagamentos**, abra o comprovante e clique em **Aprovar** (ou **Recusar**, informando o motivo que o cliente vai ver). Na visão geral, o imóvel reservado aparece como *Pendente*. Em Reservas, clique em **Confirmar**. Mostre o editor de contratos e as condições de pagamento.
7. **Conflito:** volte ao mesmo imóvel e tente as mesmas datas. O calendário bloqueia o período.

Para recomeçar do zero: rodapé › **Restaurar dados de demonstração**.

## 3. Perfis de acesso

| Perfil | Como entrar | Vê |
|---|---|---|
| Visitante | padrão | busca, mapa, imóvel, carrinho, checkout |
| Cliente | Menu › Entrar › Cliente (Mariana Costa, fictícia) | reservas, pagamentos, contratos, mapa do entorno |
| Administrador | Menu › Entrar › Administrador | tudo, inclusive gestão e condições |

Hoje a separação é feita no navegador. Em produção, as permissões precisam ser validadas no servidor.

## 4. Design

- **Base:** design system em `Real estate design system/` (azul-marinho `#061B37`, dourado `#BC8733`, branco; fonte Inter).
- **Estrutura:** padrão Airbnb a pedido do cliente: busca em cápsula, filtros em chips, cards fotográficos à esquerda e mapa fixo à direita, pins de preço que viram ovais quando se sobrepõem, botão de ampliar e zoom.
- **Polish (impeccable):** contorno do card ativo, calendário abrindo no mês do Carnaval no celular, barra fixa de reserva no celular, busca compacta no celular, esmaecimento na faixa de filtros, foco dos modais, arredondamento exato das parcelas e confirmações na própria tela.
- **Refresh "mais marca" (impeccable):** cabeçalho azul-marinho com a busca branca em destaque e o botão de busca dourado, chips de filtro sobre o marinho (o selecionado fica dourado), títulos e preços em Bricolage Grotesque (texto continua em Inter), losango do logo nos selos dos cards, preço com sublinhado dourado, pin ativo com contorno dourado e botão **Reservar** dourado.
- **Fotos:** 36 imagens geradas no Higgsfield (modelo Z Image), todas marcadas como "Imagem ilustrativa". Os prompts estão em `scripts/gen-images.mjs`.

## 5. Arquitetura

```
src/
  config/brand.ts        nome da marca, período do Carnaval, avisos
  config/payment.ts      condições de pagamento padrão
  config/env.ts          versão normal x versão para página do Claude
  data/properties.ts     catálogo (troque pelos imóveis reais)
  data/geo.ts            bairros, circuitos (ilustrativos), pontos de interesse
  data/seed.ts           clientes, reservas, bloqueios e modelos de contrato fictícios
  lib/availability.ts    conflitos de datas e status (fonte única)
  lib/payment.ts         orçamento, entrada e parcelas
  lib/geo.ts             distâncias em linha reta
  lib/contract.ts        preenchimento dos modelos
  lib/pdf.ts             PDF demonstrativo
  lib/pix.ts             código Pix copia e cola (BR Code)
  lib/receipt.ts         validação e redução dos comprovantes
  components/PixPayment  QR Code, copia e cola e envio do comprovante
  services/index.ts      pontos de integração (pagamento, assinatura, autenticação)
  services/api.ts        cliente HTTP da API
  store/index.ts         estado das telas: demo (localStorage) ou cópia do servidor (modo API)
  pages/                 telas públicas, cliente e admin
server/
  db.ts                  esquema SQLite, dados iniciais, leitura e gravação
  index.ts               API REST: regras, permissões por perfil, checkout transacional
```

**Dois modos de dados:**

| Modo | Como ativar | Onde ficam os dados |
|---|---|---|
| Demonstração | padrão (GitHub Pages, página do Claude) | no navegador de cada pessoa |
| API | `VITE_API_URL` definido (`npm run dev:api` usa `/api`) | no banco do servidor, compartilhado por todos |

**Disponibilidade sem reserva dupla:** o checkout revalida todos os itens dentro de uma transação `BEGIN IMMEDIATE`, e o banco tem um trigger (`blocks_no_overlap`) que recusa qualquer período sobreposto. Em teste com 6 reservas simultâneas para o mesmo imóvel e datas, só 1 foi aceita. As outras receberam o erro 409 e o calendário foi atualizado.

**Comprovantes no servidor:** ficam no banco (tabela `receipts`). O servidor confere o tipo pelo conteúdo do arquivo, não só pela extensão, e só o dono da reserva e o administrador conseguem abrir. Uma parcela Pix nunca vira *paga* sem passar pela aprovação do administrador. Bancos criados antes desta versão são atualizados sozinhos ao iniciar o servidor.

**O servidor não confia no navegador:** total e parcelas são recalculados a partir do imóvel e das condições salvas. Hóspedes e mínimo de noites são validados. Visitantes não veem reservas, clientes nem motivos de bloqueio. Clientes só veem e pagam as próprias reservas.

**Variáveis do servidor:** `PORT` (8787), `DB_PATH` (`server/data/app.db`), `CORS_ORIGIN` (quando o site está em outro domínio), `ALLOW_RESET=0` (desliga "Restaurar dados" em produção).

**Tecnologias:** React 18, Vite, TypeScript, React Router, Zustand, Leaflet, jsPDF, lucide-react. Servidor: Node 22.5+ (`node:http` e `node:sqlite`), executado com `tsx`.

**Comandos:**

| Comando | O que faz |
|---|---|
| `npm run dev` | ambiente local, modo demonstração |
| `npm run server` | API + banco SQLite em http://localhost:8787 |
| `npm run dev:api` | ambiente local usando a API (rode `npm run server` junto) |
| `npm run build:api` | site estático que usa a API (`VITE_API_URL` em `.env.api`) |
| `npm run typecheck` | checa os tipos do site e do servidor |
| `npm run build` | site estático em `dist/` (GitHub Pages, Vercel, Netlify) |
| `npm run build:artifact` | versão para página do Claude em `dist-artifact/` (HTML único + fotos + blocos do mapa) |

## 6. Regras de negócio da demo

- **Período padrão:** 4 a 10 de fevereiro de 2027. O calendário vai de 25/jan a 21/fev.
- **Total:** diárias × noites + taxa de limpeza (+ taxa de serviço, se configurada).
- **Pagamento:** entrada de 30%, saldo em até 6x no cartão ou 3x no Pix. Juros e desconto Pix em 0%, tudo configurável no admin.
- **Pix:** cada parcela (inclusive a entrada) tem seu QR Code e copia e cola, no padrão do Banco Central (BR Code, com CRC), com o código da reserva e o número da parcela no identificador. O recebedor é **fictício** (`pix@sua-marca.invalid`, domínio que não existe), então nenhum banco aceita o pagamento. Os dados ficam em `src/config/payment.ts` (`pixReceiver`).
- **Comprovante:** foto (JPG, PNG, WebP) ou PDF de até 3 MB; fotos são reduzidas para no máximo 1600 px antes do envio. A parcela fica *em análise*. O admin aprova (vira *paga*) ou recusa com motivo (volta a *em aberto* e o cliente vê o motivo e pode reenviar). Reenviar substitui o arquivo anterior.
- **Pix em qualquer pagamento:** toda parcela em aberto pode ser paga com Pix, mesmo em reservas feitas no cartão (inclusive as antigas). Na confirmação de uma reserva no cartão, o Pix da entrada aparece como alternativa. O admin vê essas parcelas como "Pix" quando há comprovante.
- **Cartão:** continua com pagamento simulado (aprovação imediata), sem comprovante.
- **Status do imóvel** no período do Carnaval: bloqueado > pendente > reservado > disponível.
- **Reserva nova:** entra como *pendente*. O admin confirma ou cancela, e cancelar libera as datas.
- **Conflito:** o carrinho e o checkout revalidam as datas antes de gravar.
- **Distâncias:** linha reta até o traçado ilustrativo mais próximo, sempre rotuladas como estimativa.

## 7. O que falta (antes de ir para produção)

Atualizado em 21/10/2026, na ordem recomendada.

**Para funcionar de verdade com clientes**

1. **Login real.** Hoje qualquer pessoa entra como admin escolhendo o perfil, sem senha. Falta login (e-mail e senha ou código por e-mail) validado no servidor. As permissões já são checadas no servidor; basta trocar `session()` em `server/index.ts`. Precisa vir antes de publicar o servidor.
2. **Hospedar o servidor.** O servidor e o banco (`server/`) estão prontos; falta colocá-los na internet (Render, Railway ou Fly.io com disco persistente, cerca de US$ 5 a 7/mês) e publicar o site com `VITE_API_URL` apontando para ele. Sem isso, cada pessoa vê só os dados do próprio navegador. Para mais de uma instância, trocar o SQLite por Postgres com restrição de exclusão (`EXCLUDE USING gist`) nos períodos.
3. **Pix real.** Trocar a chave fictícia (`pixReceiver` em `src/config/payment.ts`) pela chave real ou, melhor, usar o Pix dinâmico de um provedor (Mercado Pago, Asaas, Efí etc.), que confirma o pagamento sozinho (webhook) e dispensa o comprovante manual.
4. **Cartão real.** Hoje o cartão é simulado. Integrar o provedor de pagamento, com os dados do cartão digitados no ambiente do provedor, nunca no site.

**Conteúdo e marca**

5. **Nome e logo definitivos** em `src/config/brand.ts` e `src/components/Brand.tsx` (hoje "Sua Marca").
6. **Imóveis, fotos e valores reais** em `src/data/properties.ts` e `public/images/properties` (hoje 12 imóveis fictícios com fotos geradas por IA).
7. **Contratos:** revisão jurídica dos modelos e assinatura eletrônica com um provedor homologado (hoje é simulada).

**Mapa**

8. **Circuitos oficiais:** trocar os traçados ilustrativos do Dodô, Osmar e Batatinha pela geometria oficial (`src/data/geo.ts`).
9. **Provedor de mapas:** o mapa usa os blocos públicos do ArcGIS (World Street Map), que exigem licença para uso em produção. Contratar Google Maps, Mapbox ou MapTiler (`src/config/env.ts`).

**Manutenção**

10. **Atualizar pacotes com alertas de segurança** do `npm audit`: `jspdf` (crítico), `vite`, `vite-plugin-singlefile`, `react-router-dom` e `tsx`.

**Já feito**

- [x] API + banco de dados com reservas transacionais, sem reserva dupla (`server/`)
- [x] Pix por parcela com QR Code e copia e cola (fictícios), comprovante e aprovação pelo administrador
- [x] Cabeçalho: Entrar, carrinho e conta distintos dos chips de filtro
- [x] Repositório público no GitHub e site no GitHub Pages com deploy automático
- [x] Mapa: card do imóvel cabe na faixa de mapa ao clicar num pin
- [x] Pix (fictício) em qualquer parcela em aberto, inclusive de reservas no cartão
- [x] Novo visual (cantos retos, serifa Newsreader, fundo areia) e busca reestruturada: faixa de mapa fixa no topo, fichas largas e ordenação

## 8. Limitações conhecidas

- No modo demonstração, os dados ficam no navegador de quem usa e cada pessoa vê sua própria cópia. Os comprovantes também ficam no navegador, que tem espaço limitado (cerca de 5 MB): para muitos envios, use o modo API. No modo API, todos compartilham o mesmo banco.
- No modo API, o perfil ainda é escolhido sem senha (cabeçalhos `X-Demo-Role`/`X-Demo-User`). As permissões já são checadas no servidor, e o item 1 só troca a forma de identificar o usuário (`session()` em `server/index.ts`).
- Na página do Claude, o mapa só cobre a área da demo (zoom 12 a 16), e o PDF pede confirmação antes de baixar.

## 9. Histórico

| Data | Etapa |
|---|---|
| 19/10/2026 | Protótipo completo: catálogo, busca, mapa, checkout, cliente, admin, contratos |
| 20/10/2026 | Página inicial vira lista + mapa estilo Airbnb |
| 20/10/2026 | Passe de polish do impeccable sem mudar a estrutura |
| 20/10/2026 | Publicação como página privada do Claude e documentação |
| 20/10/2026 | Refresh visual "mais marca" sem mudar a estrutura |
| 20/10/2026 | Repositório criado no GitHub |
| 20/10/2026 | Repositório público + site no GitHub Pages com deploy automático |
| 20/10/2026 | API + banco SQLite com reservas transacionais (modo API opcional) |
| 20/10/2026 | Cabeçalho: Entrar, carrinho e conta distintos dos filtros |
| 20/10/2026 | Pix por parcela (QR Code e copia e cola fictícios), comprovante e aprovação pelo admin |
| 23/10/2026 | Mapa: card do pin compacto na faixa de mapa (não abre mais cortado) |
| 23/10/2026 | Pix em qualquer parcela em aberto, inclusive de reservas feitas no cartão |
| 23/10/2026 | Celular: cabeçalho solto, abas do cliente em barra inferior, tabelas viram fichas, filtros numa linha |
