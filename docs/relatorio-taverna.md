# Agentarium — relatório da fatia funcional da Taverna

Data: 2026-08-20

## Resultado

A Taverna do Grifo Dourado é o primeiro prédio funcional da vila. O jogador chega pela entrada existente, abre um salão responsivo, compara três agentes, conversa com uma simulação local, escolhe um agente ativo e continua a exploração com essa escolha visível no HUD.

Esta entrega valida o fluxo e a arquitetura. Ela não conecta IA real, backend, banco, ferramentas ou serviços pagos.

## Fluxo entregue

```text
entrada da Taverna
  → descoberta idempotente do prédio
  → roster de Aldren, Brunna e Selene
  → ficha e especialidades do agente em foco
  → conversa determinística por agente
  → seleção de agente ativo
  → badge persistente no HUD durante a sessão
```

## Arquitetura

- `Agent.ts`: catálogo e tipos imutáveis dos três perfis.
- `TavernSystem.ts`: fonte única de verdade para foco, seleção e conversas.
- `AgentConversationProvider`: fronteira substituível entre domínio e geração de respostas.
- `SimulatedAgentProvider`: respostas locais por tema; sem rede, chave, custo ou aleatoriedade.
- `TavernPanel.ts`: adaptador DOM que apresenta snapshots e transforma controles em intenções.
- `Game.ts`: integra descoberta, modal, HUD, diagnósticos e estado determinístico de teste.

IDs, timestamps lógicos e respostas são determinísticos. Cada agente mantém sua própria conversa. O painel nunca gera estado paralelo nem insere texto digitado por meio de HTML.

## UX e acessibilidade

- Desktop: roster, ficha e conversa simultâneos em três colunas.
- 761–900 px: composição intermediária em duas colunas.
- Mobile: conteúdo empilhado, roster horizontal e shell rolável sem overflow lateral.
- Alvos de toque de pelo menos 44 px, labels acessíveis, `dialog` nativo, Escape, restauração de foco e log com `aria-live`.
- Prompts rápidos e campo de texto oferecem dois caminhos para conversar.
- Movimento é neutralizado enquanto um diálogo está aberto.
- O agente selecionado permanece legível fora do modal pelo badge do HUD.

Durante a inspeção visual foram corrigidos dois defeitos que o teste funcional não revelava: cards do roster sobrepostos à ficha no mobile e foco inicial rolando o título/botão de fechar para fora da tela.

## Render e orçamento

Com qualquer modal aberto, o mundo ao fundo usa o passe pixelado de uma renderização. Como o backdrop já escurece e desfoca a cena, o custo do segundo passe de normais não traz ganho visual útil nesse estado.

| Estado | Calls | Triângulos | Geometrias | Texturas | Resultado |
|---|---:|---:|---:|---:|---|
| Taverna desktop | 155 | 15.838 | 16 | 16 | Dentro do budget |
| Taverna mobile | 146 | 15.222 | 15 | 13 | Dentro do budget |

As duas inspeções usaram SwiftShader; métricas de pixels e budgets são válidas, mas FPS não foi usado como evidência.

## Verificação

- `npm run build`: passou; bundle principal `659,90 kB` (`171,20 kB` gzip).
- `npm test`: 13 testes passaram e 1 tour mobile compartilhado foi ignorado intencionalmente.
- Fluxo dedicado da Taverna: 2/2 em desktop e mobile.
- Regressão visual: 6/6, incluindo os dois novos baselines `tavern-open`.
- Tour das nove entradas e colisão existente: passou.
- Inspector de canvas desktop/mobile: canvas não vazio, budgets respeitados, zero erro de console/página.
- `npm audit --json`: zero vulnerabilidades conhecidas.
- `git diff --check`: passou.

Evidências visuais locais ficam em `artifacts/tavern/` e `artifacts/tavern-ui-mobile-fixed2/`; os baselines versionáveis ficam em `tests/visual-regression.spec.ts-snapshots/`.

## Skill-loading ledger

| Skill | Uso nesta fatia |
|---|---|
| `threejs-game-director` | Orquestração, fronteira de escopo e gates. |
| `threejs-gameplay-systems` | Loop funcional, estado, integração e feedback. |
| `threejs-game-ui-designer` | Modal state-driven, HUD, responsividade, touch e acessibilidade. |
| `threejs-qa-release` | Fluxos Playwright, screenshots, inspeção visual e release checks. |

Referências aplicadas: phase playbook; gameplay workflows; game/level design; UI patterns e checklists de HUD, fit responsivo e mobile input; QA/release, playtest, visual verification e visual test harness.

Nenhum gerador 2D/3D/áudio ou asset externo foi necessário: esta fatia usa o mundo já autorado, UI em HTML/CSS e sigilos provisórios. Nenhum commit ou push foi criado.

## Próximo marco recomendado

Depois do playtest do proprietário, a Guilda pode consumir o agente escolhido para criar um projeto e uma primeira missão simulada. Esse passo conecta a seleção feita na Taverna ao loop central do produto sem exigir IA real ainda.
