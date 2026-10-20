# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React + Vite + TypeScript (escolhido pelo usuário). SPA com dados fictícios centralizados e camada de serviços preparada para trocar por API real.

## Users

- **Visitante:** pessoa (turista ou soteropolitano) procurando apartamento para o Carnaval de Salvador; quer ver localização em relação aos circuitos, preço total do período e condições de pagamento.
- **Cliente:** quem já fez uma reserva; acompanha imóvel reservado, pagamentos, contratos e pontos de interesse próximos.
- **Administrador:** corretor/imobiliária que gerencia imóveis, reservas, clientes, contratos e disponibilidade.
- **Público imediato:** potenciais compradores/parceiros vendo o protótipo numa apresentação comercial.

## Product Purpose

Plataforma de locação de imóveis para o Carnaval de Salvador. Nesta fase é um **protótipo demonstrativo para apresentação comercial**: navegável, convincente e com as jornadas principais (busca → detalhe → carrinho → checkout simulado → área do cliente; painel admin) funcionando com dados fictícios.

## Positioning

Foco nos **imóveis e bairros** de Salvador (Barra em destaque, Ondina, Rio Vermelho, Graça, Campo Grande, Pituba, Pelourinho…) para o período do Carnaval. Os circuitos Dodô, Osmar e Batatinha são **complemento** (camada no mapa, filtro de proximidade, informação no detalhe), não o eixo da página.

## Capabilities and Constraints

- ~12 apartamentos fictícios em bairros de Salvador; mapa interativo com circuitos; filtros por bairro, preço, hóspedes e proximidade.
- Painel admin com status por cor + texto: disponível, reservado, pendente, bloqueado.
- Carrinho/checkout simulado; pagamento com total, entrada, parcelas, Pix e cartão em condições demonstrativas configuráveis.
- Modelos de contrato editáveis com preenchimento automático e PDF demonstrativo.
- Calendário de disponibilidade por imóvel impedindo reservas conflitantes no fluxo demo.
- **Sem cobranças reais. Contratos não são documentos juridicamente válidos.**
- Geometria dos circuitos é ilustrativa/aproximada; distâncias são estimativas em linha reta e assim rotuladas.
- Estrutura preparada para futuras integrações: pagamento, autenticação, assinatura eletrônica, banco de dados.

## Brand Commitments

- Nome: placeholder **"Sua Marca"**, configurável em um único arquivo.
- Design system em `Real estate design system/uploads/design-system-imobiliaria-carnaval.md` é vinculante: azul-marinho, dourado e branco; Inter; layout lista + mapa; nada de rosa/Airbnb.
- Protótipo de referência: `Real estate design system/Busca de Imoveis.dc.html`.
- **Preferência firme do usuário:** estrutura e padrões do Airbnb (busca em cápsula, chips de filtro, grade de cards fotográficos, lista + mapa, linhas de imóveis por bairro na home). Convenção é o compromisso, executada com o nível de acabamento do Airbnb, na identidade marinho/dourado.

## Evidence on Hand

Nenhum imóvel, foto, cliente, avaliação ou condição comercial real. Tudo é demonstrativo e deve ser rotulado ("Imagem ilustrativa", "Demonstração"). Não inventar avaliações, depoimentos ou descontos.

## Product Principles

1. Imóvel primeiro: foto, bairro, capacidade e preço total lideram; circuito é contexto.
2. Preço total claro; parcela nunca substitui o total.
3. Honestidade demonstrativa: o que é fictício é rotulado, sem parecer amador.
4. Experiências separadas: visitante, cliente e administrador não se misturam.

## Accessibility & Inclusion

WCAG AA; status nunca comunicado só por cor; alvos de 44px; lista como alternativa ao mapa.
