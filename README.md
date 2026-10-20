# Projeto Imóvel: Carnaval de Salvador

Protótipo **demonstrativo** de uma plataforma de locação de apartamentos para o Carnaval de Salvador, feito para apresentação comercial.

> Todos os imóveis, fotos, valores, pessoas, reservas e contratos são **fictícios**. Não há cobranças reais, e os contratos gerados **não têm validade jurídica**.

- **Demonstração online (página privada do Claude):** https://claude.ai/artifact/QLnmYYVxCJ3Vr9PUto56Yr
- **Documentação completa:** [DOCUMENTACAO.md](DOCUMENTACAO.md)

## Rodar localmente

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera /dist (site estático, funciona em GitHub Pages)
```

## Jornadas

| Perfil | Onde | O que faz |
|---|---|---|
| Visitante | `/`, `/buscar`, `/imovel/:id` | Home por bairros, busca com lista + mapa, filtros (bairro, preço, hóspedes, distância dos circuitos, comodidades), detalhe com calendário |
| Visitante | `/carrinho`, `/checkout` | Carrinho com vários imóveis, Pix ou cartão, entrada + parcelas, confirmação simulada |
| Cliente | `/cliente` | Reservas, pagamentos (simular pagamento), contratos (ver, PDF, assinatura simulada), mapa com circuitos e pontos de interesse |
| Admin | `/admin` | Mapa e lista com status (disponível, reservado, pendente, bloqueado), imóveis (editar, bloquear datas), reservas (confirmar/cancelar), clientes, modelos de contrato editáveis, condições de pagamento |

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
- **Zustand** (`src/store`) como “banco de dados” da demo, persistido no `localStorage`. É a fonte única de verdade para mapa, catálogo, checkout, área do cliente e admin.
- **Leaflet / react-leaflet** com tiles do OpenStreetMap
- **jsPDF** para PDFs demonstrativos com marca d'água
- `src/lib`: regras puras: disponibilidade e conflitos (`availability.ts`), orçamento e parcelas (`payment.ts`), distâncias em linha reta (`geo.ts`), preenchimento de contratos (`contract.ts`)
- `src/services`: **pontos de integração futura** (gateway de pagamento, assinatura eletrônica, autenticação), hoje com implementações simuladas e a mesma interface que a versão real vai implementar

## Antes de ir para produção

- Substituir os traçados dos circuitos pela geometria oficial; hoje são aproximações ilustrativas.
- Usar um provedor de mapas com contrato/chave (o tile público do OSM não é para tráfego de produção).
- Implementar autenticação real e **validar permissões no backend**. Hoje a separação visitante/cliente/admin existe só no front-end.
- Trocar o store local por API + banco de dados, com verificação transacional de disponibilidade.
- Integrar PSP (Pix/cartão) sem coletar dados de cartão no front-end, além de um provedor de assinatura eletrônica.
- Submeter os modelos de contrato a revisão jurídica.

## Créditos das imagens

Fotos geradas com Higgsfield (modelo `z_image`) a partir dos prompts em `scripts/gen-images.mjs`. São ilustrativas e não retratam imóveis reais.

Design system de referência: `Real estate design system/`.
