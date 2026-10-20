# Projeto Imóvel · Documentação

Protótipo **demonstrativo** de uma plataforma de locação de apartamentos para o Carnaval de Salvador, feito para apresentação comercial.

- **Link para apresentar (página privada do Claude):** https://claude.ai/artifact/QLnmYYVxCJ3Vr9PUto56Yr
  Só você vê até compartilhar pelo menu *Compartilhar* da página.
- **Rodar no computador:** `npm install` e depois `npm run dev`, em http://localhost:5173
- **Repositório (privado):** https://github.com/Moreirapontocom-br/projeto-imovel

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
| Modelos de contrato editáveis + PDF | `/admin/contratos` | Pronto, PDF com marca d'água |
| Calendário por imóvel que impede conflitos | Página do imóvel + editor do admin | Pronto |

## 2. Roteiro de demonstração (5 minutos)

1. **Busca:** abra a página inicial. Passe o mouse nos cards e veja o pin destacar no mapa. Clique num pin para ver o card do imóvel.
2. **Filtros:** escolha "Barra", depois "Distância do circuito › Até 1 km". Ligue "Circuitos" no mapa.
3. **Imóvel:** abra um apartamento disponível. Mostre as fotos, as comodidades, o calendário (dias riscados = ocupados) e as distâncias até os circuitos.
4. **Reserva:** clique em **Reservar**, preencha os dados, escolha Pix ou cartão e "Entrada + 3x". Confirme a reserva simulada.
5. **Cliente:** a confirmação leva à área do cliente. Mostre a reserva *pendente*, o cronograma e o contrato preenchido automaticamente (Visualizar / PDF).
6. **Admin:** Menu › Entrar › **Administrador**. Na visão geral, o imóvel reservado aparece como *Pendente*. Em Reservas, clique em **Confirmar**. Mostre o editor de contratos e as condições de pagamento.
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
  services/index.ts      pontos de integração (pagamento, assinatura, autenticação)
  store/index.ts         "banco de dados" da demo (Zustand + localStorage)
  pages/                 telas públicas, cliente e admin
```

**Tecnologias:** React 18, Vite, TypeScript, React Router, Zustand, Leaflet, jsPDF, lucide-react.

**Comandos:**

| Comando | O que faz |
|---|---|
| `npm run dev` | ambiente local |
| `npm run build` | site estático em `dist/` (GitHub Pages, Vercel, Netlify) |
| `npm run build:artifact` | versão para página do Claude em `dist-artifact/` (HTML único + fotos + blocos do mapa) |

## 6. Regras de negócio da demo

- **Período padrão:** 4 a 10 de fevereiro de 2027. O calendário vai de 25/jan a 21/fev.
- **Total:** diárias × noites + taxa de limpeza (+ taxa de serviço, se configurada).
- **Pagamento:** entrada de 30%, saldo em até 6x no cartão ou 3x no Pix. Juros e desconto Pix em 0%, tudo configurável no admin.
- **Status do imóvel** no período do Carnaval: bloqueado > pendente > reservado > disponível.
- **Reserva nova:** entra como *pendente*. O admin confirma ou cancela, e cancelar libera as datas.
- **Conflito:** o carrinho e o checkout revalidam as datas antes de gravar.
- **Distâncias:** linha reta até o traçado ilustrativo mais próximo, sempre rotuladas como estimativa.

## 7. Antes de ir para produção

1. Trocar os traçados dos circuitos pela geometria oficial.
2. Contratar um provedor de mapas (Google Maps, Mapbox ou MapTiler).
3. Implementar autenticação real e validar permissões no servidor.
4. Trocar o store local por API + banco de dados, com verificação transacional de disponibilidade.
5. Integrar um provedor de pagamento (Pix/cartão) sem coletar cartão no front-end.
6. Integrar assinatura eletrônica e submeter os modelos de contrato a revisão jurídica.
7. Substituir fotos, imóveis e valores pelos reais.
8. Definir o nome e o logo definitivos em `src/config/brand.ts` e `src/components/Brand.tsx`.

## 8. Limitações conhecidas

- Os dados ficam no navegador de quem usa. Cada pessoa vê sua própria cópia da demo.
- Na página do Claude, o mapa só cobre a área da demo (zoom 12 a 16), e o PDF pede confirmação antes de baixar.

## 9. Histórico

| Data | Etapa |
|---|---|
| 19/10/2026 | Protótipo completo: catálogo, busca, mapa, checkout, cliente, admin, contratos |
| 20/10/2026 | Página inicial vira lista + mapa estilo Airbnb |
| 20/10/2026 | Passe de polish do impeccable sem mudar a estrutura |
| 20/10/2026 | Publicação como página privada do Claude e documentação |
| 20/10/2026 | Refresh visual "mais marca" sem mudar a estrutura |
| 20/10/2026 | Repositório privado criado no GitHub |
