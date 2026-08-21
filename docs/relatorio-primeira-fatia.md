# Agentarium — relatório de evidências da primeira fatia

Data: 2026-08-19

## Resultado

A primeira fatia jogável entrega uma vila medieval 3D pixelizada, navegável e responsiva. O jogador explora o mapa, corre, colide com o cenário, encontra nove edifícios e interage para descobrir a função futura de cada um.

O resultado deve ser chamado de **primeira fatia jogável polida**. Ele não recebe o rótulo Premium/AAA/Showcase: a revisão visual independente manteve personagem, obstáculos, recompensas e VFX abaixo do limiar 2.

## Game design brief

- Promessa: explorar uma vila acolhedora em que cada lugar representa uma parte real do futuro sistema de agentes.
- Verbo principal: caminhar e explorar.
- Verbo secundário: correr e interagir.
- Objetivo: descobrir os nove centros de atividade.
- Pressão/falha: nenhuma; é uma fatia de exploração tranquila.
- Escopo excluído: backend, IA real, persistência, interiores, personagens finais, combate e execução de ferramentas.
- Documento completo: [`primeira-fatia-jogavel.md`](primeira-fatia-jogavel.md).

## Core loop

O jogador explora a vila → identifica um marco e sua entrada → aproxima-se → recebe o prompt contextual → interage → registra uma descoberta e lê a função futura → volta imediatamente a explorar.

## Level/encounter plan

Não há combate ou encontro hostil nesta fatia. O plano espacial cumpre o papel de level design:

- Portão sul como início seguro e silhueta clara do jogador.
- Casa do jogador próxima ao início.
- Praça, fonte, Mercado e Guilda como âncora central.
- Taverna/Ferraria no circuito oeste.
- Hospital/Biblioteca/Igreja no circuito leste.
- Torre do Mago no norte e castelo minúsculo no horizonte oeste.
- Estradas conectam entradas; jardins e praça oferecem recuperação visual.

## Skill-loading ledger

| Skill | Uso | Resultado |
|---|---|---|
| `threejs-game-director` | Sim, skill primária | Orquestrou design, implementação, gráficos, UI, perfil e QA. |
| `threejs-gameplay-systems` | Sim | Scaffold Vite/TS/Three, loop, input, câmera, personagem, colisão e interação. |
| `threejs-aaa-graphics-builder` | Sim | Direção visual, kit procedural, render pixelizado, technical art e scorecard. |
| `threejs-game-ui-designer` | Sim | HUD medieval responsiva, modais, teclado, touch, safe areas e acessibilidade. |
| `threejs-debug-profiler` | Sim | Diagnósticos, budgets, otimização de draw calls e inspeção de erros. |
| `threejs-qa-release` | Sim | Playwright, canvas inspector, screenshots, teste real e visual test harness. |
| `threejs-3d-generator` | Sim, avaliado | Geração externa bloqueada pela ausência de credencial; autoria procedural local. |
| `threejs-image-generator` | Sim, avaliado | Geração externa bloqueada pela ausência de credencial; texturas Canvas locais. |
| `threejs-audio-generator` | Sim, avaliado | Geração externa bloqueada pela ausência de credencial; WebAudio procedural local. |

## Reference ledger

- Gameplay systems: `gameplay-workflows.md`, `game-design-level-design.md`, `game-feel.md`, `physics-engine-selection.md`, checklist de novo jogo, checklist de game design e checklist de game feel — usados para contrato do loop, mapa, input, colisão e feedback.
- AAA graphics: `visual-scorecard.md`, `implementation-blueprint.md`, `model-recipes.md`, `render-recipes.md`, `shader-cookbook.md`, `technical-art.md` e checklists de AAA, scorecard, technical art, detalhe procedural, materiais e performance — usados no kit, materiais, render e budgets.
- UI: `ui-patterns.md` e checklists de qualidade, legibilidade de HUD, responsive fit e mobile input — usados no DOM/CSS responsivo e fluxo por modal.
- Debug/profile: referência e checklists de debug/perfil e performance — usados nos diagnósticos e na redução de chamadas.
- QA/release: referências/checklists de QA, release e visual test harness — usados em Playwright, screenshots determinísticos e inspeção do canvas.
- 3D/image pairing e integração: referências da API Tripo e pareamento imagem→3D — lidas para decidir sourcing; não executadas por falta de chave.
- Audio workflow: referência de geração/integração de áudio — usada para mapear ambience, footsteps, discovery e UI; sem asset externo por falta de chave.
- Templates de prompts reutilizáveis: não usados, pois o usuário não solicitou prompts reutilizáveis.

## Phase ledger

| Fase | Status | Evidência |
|---|---|---|
| Gameplay systems | Concluída | Movimento isométrico, corrida, joystick, ação, câmera, proximidade e colisão. |
| AAA graphics | Concluída para a fatia | Nove silhuetas de edifícios, onze casas, props, castelo, materiais, luz, pixel pass e instancing. |
| UI | Concluída | HUD, progresso 0/9, localização, prompt, painéis, ajuda, áudio e touch. |
| Debug/profile | Concluída | Diagnósticos em runtime, inspeção de canvas e budgets desktop/mobile. |
| QA/release | Concluída para protótipo local | Build, 9 testes aprovados/1 skip intencional, regressão visual e seis estados inspecionados. |

## External asset sourcing

### Credential probe output

```text
TRIPO_API_KEY=MISSING
GEMINI_API_KEY=MISSING
ELEVENLABS_API_KEY=MISSING
```

### Chosen sources

| Superfície | Fonte escolhida | Motivo |
|---|---|---|
| Hero/player | Modelo voxel procedural em Three.js | Personagem final estava fora do escopo; 3D generator sem chave. |
| Edifícios/props | Fábricas procedurais locais | Tripo 3D generator sem chave; permite kit coerente e barato. |
| World/sky/background | Geometria procedural + shader de céu | Image generator sem chave; nenhum download externo necessário. |
| Materials/textures/decals | CanvasTexture e materiais compartilhados | Gemini image generator sem chave; mantém paleta e pixel density controladas. |
| UI/HUD | HTML/CSS autoral | Melhor legibilidade, responsividade e acessibilidade que arte raster fixa. |
| Audio | WebAudio procedural | ElevenLabs audio generator sem chave; evita asset pago e rede. |

Nenhum arquivo externo, asset pago ou chave foi incorporado.

## Physics engine

- Escolha: resolvedor customizado círculo–AABB; Rapier não era necessário para exploração planar sem corpos rígidos.
- Timestep: delta limitado a `0,05 s` no loop e substeps de movimento proporcionais ao raio para evitar atravessar construções durante a corrida.
- Collider: raio do jogador `0,43`; 36 proxies AABB/circulares autorais; sliding por eixo e limites do mundo.
- Evidência: teste real força o jogador contra a varanda da casa e confirma bloqueio, além de auditar os 36 proxies.

## Audio

- Audio generator carregado para avaliação; `ELEVENLABS_API_KEY=MISSING` foi o blocker real.
- Ambience: ruído de brisa em loop, determinístico e filtrado.
- Movimento: passos com pitch/intervalo variáveis por velocidade.
- Descoberta: selo curto de três notas.
- UI: clique tonal curto.
- Toggle de mute e unlock após gesto do usuário.

## Technical art

### Render budget

| Estado | Calls | Triângulos | Geometrias | Texturas | Budget |
|---|---:|---:|---:|---:|---|
| Desktop ativo | 292 | 31.250 | 15 | 15 | ≤300 / ≤750k / ≤300 / ≤60: passou |
| Desktop completo | 296 | 31.562 | 15 | 15 | passou |
| Desktop Torre do Mago | 270 | 26.218 | 16 | 15 | passou |
| Mobile ativo | 121 | 14.414 | 14 | 12 | ≤150 / ≤300k / ≤200 / ≤40: passou |
| Mobile completo | 138 | 15.402 | 15 | 13 | passou |
| Mobile Torre do Mago | 116 | 12.758 | 15 | 12 | passou |

O mundo registra 134 meshes, 55 `InstancedMesh`, 964 instâncias, 12 geometrias compartilhadas, 40 materiais, 8 texturas procedurais, aproximadamente 15.096 triângulos lógicos, 36 colliders e 9 pontos de interação.

### Otimização e tradeoffs

- O primeiro passe integrado media 560 chamadas no desktop; batching global reduziu para 292 no estado ativo.
- O primeiro mobile com normal/depth pass media 240 chamadas; um pixel pass mobile de uma renderização reduziu para 121.
- Desktop preserva arestas por profundidade/normais; mobile preserva pixelização nearest-neighbour e abre mão do segundo normal buffer.
- Somente uma luz projeta sombras; DPR é limitado a 2 no desktop e 1,5 no mobile.
- Interaction markers aparecem apenas a até 10 unidades e desaparecem após descoberta.
- O bundle JavaScript final tem 646,82 kB (166,91 kB gzip); a maior parte é Three.js e addons. Code splitting fica para quando existirem telas/interiores reais.

### VFX readability

- Anel/diamante de interação usa cor por edifício e só surge na aproximação.
- Fonte, fogo, placas e água têm movimento ambiental discreto.
- Descoberta gera flash no medidor e áudio; `prefers-reduced-motion` desliga movimento não essencial.
- Não há partículas densas, bloom ou efeitos que escondam a leitura dos caminhos.

## Visual test harness

- `tests/visual-regression.spec.ts` congela RNG, movimento ambiente, debug e simulação.
- Baselines cobrem portão sul e missão concluída em desktop e mobile.
- A comparação final passou nos quatro casos com tolerância máxima de 1,5%.
- Seis capturas adicionais e JSONs ficam localmente em `artifacts/final/`.

## Visual scorecard

As âncoras `scene-1.jpg`, `scene-2.jpg` e `scene-3.jpg` foram vistas antes da pontuação.

| Categoria | Autoavaliação | Fresh-eyes review | Nota reconciliada | Evidência/decisão |
|---|---:|---:|---:|---|
| Art direction | 2 | 2 | 2 | Identidade medieval pixel/voxel coesa em formas, paleta e HUD. |
| Hero/player | 2 | 1 | 1 | Tem construção, animação e collider autorais, mas ainda lê como personagem provisório de blocos. |
| Obstacles/enemies | 2 | 1 | 1 | Há família ambiental e 36 proxies, mas nenhum encontro/telegraph; o jogo é pacífico. |
| Rewards/interactables | 2 | 1 | 1 | Nove edifícios distintos, prompt, progresso, painel e áudio; o marcador/recompensa ainda tem uma forma principal. |
| World/environment | 3 | 2 | 2 | Mundo denso e autoral; algumas molduras mobile/iniciais ainda expõem grandes áreas de grama repetida. |
| Materials/textures | 3 | 2 | 2 | 40 papéis e 8 texturas procedurais; tiles ainda repetem em superfícies amplas. |
| Lighting/render | 2 | 2 | 2 | Key/fill/rim, sombras, tone mapping, fog e passes disciplinados; não é cinematográfico. |
| VFX/motion | 2 | 1 | 1 | Movimento e feedback existem, mas faltam VFX fortes de descoberta/conclusão comprovados visualmente. |
| UI/HUD | 3 | 2 | 2 | Hierarquia e resposta mobile fortes; o ribbon ocupa bastante espaço em telas estreitas. |
| Performance evidence | 3 | 2 | 3 | Evidência adicional concreta: baseline/pós, gargalos, budgets e tradeoff mobile documentados acima. |

### Measured evidence

| Viewport/estado | Entropia | Edge density | Contraste | Cor dominante |
|---|---:|---:|---:|---:|
| Baseline desktop | 1,63 | 0,088 | 77,1 | 0,633 |
| Final desktop ativo | 4,99 | 0,529 | 146,7 | 0,176 |
| Baseline mobile | 1,82 | 0,093 | 111,1 | 0,634 |
| Final mobile ativo | 5,29 | 0,483 | 173,0 | 0,155 |

### Fresh-eyes review

O revisor independente recebeu somente as seis screenshots finais, seis JSONs, scorecard e âncoras. Sua média foi **1,6/3,0**. A autoavaliação foi **2,4/3,0**. A reconciliação usa a menor nota em cada categoria, exceto performance evidence, elevada por baseline/pós e tradeoffs concretos que não faziam parte do pacote cego.

**Average reconciliada:** 1,7/3,0.

### Automatic failures remaining

- Hero/player ainda é primitivo para a régua Premium.
- Obstacles/enemies não formam uma família de encontros com telegraph; essa categoria não é central nesta fatia pacífica.
- Rewards/interactables e VFX/motion ainda dependem de um marcador/feedback principal.
- A jogabilidade por input real, que o pacote cego não comprovava, foi verificada pela suíte Playwright e portanto não permanece como falha.
- External asset sourcing e diagnósticos estão documentados; a ausência de outputs externos tem blocker real de credenciais.

**Premium:** não alcançado. **Showcase:** não alcançado.

Próximo passe visual exato para buscar Premium: substituir o viajante provisório por um herói voxel mais expressivo, criar ao menos dois tipos de descoberta/recompensa, adicionar VFX event-driven de descoberta e conclusão, e variar o primeiro plano de grama no portão sul.

## Verificação final

- `npm run build`: passou; TypeScript + Vite, bundle final medido.
- `npm test`: 9 testes passaram; 1 skip intencional porque o tour completo de teclado compartilha o mesmo grafo no mobile.
- Fluxos reais: movimento desktop/mobile, interação, reinteração idempotente, nove entradas e colisão da casa.
- Visual regression: 4/4 passou.
- Canvas inspector: 6/6 estados passaram, sem console error ou page error.
- Screenshot: seis capturas finais inspecionadas visualmente em desktop e mobile.
- Pixel checks: todos os canvas não vazios e com diversidade/contraste medidos.
- `npm audit --json`: 0 vulnerabilidades.
- `git diff --check`: passou.
- GPU: SwiftShader em headless; pixel/budget são válidos, FPS/frame-time não foi usado como evidência.
- Nenhum commit ou push foi criado.
