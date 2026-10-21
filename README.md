# Projeto Imóvel: Carnaval de Salvador

Protótipo **demonstrativo** de uma plataforma de locação de apartamentos para o Carnaval de Salvador, feito para apresentação comercial.

> Todos os imóveis, fotos, valores, pessoas, reservas e contratos são **fictícios**. Não há cobranças reais, e os contratos gerados **não têm validade jurídica**.

- **Demonstração online:** https://moreirapontocom-br.github.io/projeto-imovel/
- **Documentação completa:** [DOCUMENTACAO.md](DOCUMENTACAO.md)

## Rodar localmente

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera /dist (site estático, funciona em GitHub Pages)
```

### Com servidor e banco de dados

```bash
npm run server   # API + SQLite em http://localhost:8787/api (cria server/data/app.db com os dados fictícios)
npm run dev:api  # site usando a API (em outro terminal)
```

Sem `VITE_API_URL`, o site continua no modo demonstração, com os dados no navegador (é assim no GitHub Pages).

## Jornadas

| Perfil | Onde | O que faz |
|---|---|---|
| Visitante | `/`, `/buscar`, `/imovel/:id` | Home por bairros, busca com lista + mapa, filtros (bairro, preço, hóspedes, distância dos circuitos, comodidades), detalhe com calendário |
| Visitante | `/carrinho`, `/checkout` | Carrinho com vários imóveis, Pix ou cartão, entrada + parcelas. No Pix: QR Code e copia e cola (fictícios) e envio do comprovante |
| Cliente | `/cliente` | Reservas, pagamentos (Pix com comprovante por parcela; cartão simulado), contratos (ver, PDF, assinatura simulada), mapa com circuitos e pontos de interesse |
| Admin | `/admin` | Mapa e lista com status (disponível, reservado, pendente, bloqueado), imóveis (editar, bloquear datas), reservas (confirmar/cancelar), pagamentos (ver comprovante, aprovar ou recusar cada parcela), clientes, modelos de contrato editáveis, condições de pagamento |

Para trocar de perfil, use **Menu › Entrar** (`/entrar`). O rodapé tem **Restaurar dados de demonstração**.

## Onde ficam os dados (para trocar pelos reais)

```
src/config/brand.ts      nome da marca, período do Carnaval, avisos
src/config/payment.ts    condições de pagamento padrão (entrada, parcelas, juros, Pix)
src/data/properties.ts   catálogo de imóveis
src/data/geo.ts          bairros, traçados ILUSTRATIVOS dos circuitos, pontos de interesse
src/data/seed.ts         clientes, reservas, bloqueios e modelos de contrato fictícios
public/images/properties fotos (geradas por IA, marcadas como ilustrativas)
```

## Arquitetura

- **React 18 + Vite + TypeScript**, React Router (HashRouter, para hospedagem estática)
- **Zustand** (`src/store`) é a fonte única de verdade das telas. No modo demonstração, guarda os dados no `localStorage`. No modo API, guarda a última visão recebida do servidor.
- **Servidor** (`server/`): Node 22.5+ com `node:sqlite`, sem dependências de produção. Recalcula total e parcelas no servidor, filtra os dados por perfil e grava reservas em transação. Um trigger no banco recusa períodos sobrepostos.
- **Leaflet / react-leaflet** com blocos do ArcGIS World Street Map (uso de demonstração; produção exige provedor licenciado)
- **jsPDF** para PDFs demonstrativos com marca d'água
- `src/lib`: regras puras: disponibilidade e conflitos (`availability.ts`), orçamento e parcelas (`payment.ts`), distâncias em linha reta (`geo.ts`), preenchimento de contratos (`contract.ts`)
- `src/services`: **pontos de integração futura** (gateway de pagamento, assinatura eletrônica, autenticação), hoje com implementações simuladas e a mesma interface que a versão real vai implementar

## O que falta

Lista completa e em ordem de prioridade em [DOCUMENTACAO.md › O que falta](DOCUMENTACAO.md#7-o-que-falta-antes-de-ir-para-produção). Resumo:

1. Login real, com permissões validadas no servidor.
2. Hospedar o servidor (`server/`) e apontar `VITE_API_URL` para ele.
3. Pix real (chave verdadeira ou Pix dinâmico de um provedor) e cartão real.
4. Nome, logo, imóveis, fotos e valores reais.
5. Revisão jurídica e assinatura eletrônica dos contratos.
6. Circuitos oficiais no mapa e provedor de mapas com licença.
7. Atualizar pacotes com alertas de segurança (`npm audit`).

## Créditos das imagens

Fotos geradas com Higgsfield (modelo `z_image`) a partir dos prompts em `scripts/gen-images.mjs`. São ilustrativas e não retratam imóveis reais.

Design system de referência: `Real estate design system/`.
