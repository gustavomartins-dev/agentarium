# Agentarium — primeira fatia jogável

> Registro histórico da fundação visual. Em 2026-08-20, conversar e selecionar agentes passaram a existir na Taverna; consulte [`fatia-taverna.md`](fatia-taverna.md).

## Promessa ao jogador

Explorar uma vila medieval acolhedora em que cada lugar representa uma parte real do trabalho com agentes de IA.

## Sensação desejada

- Curiosidade e descoberta, não urgência.
- Um pequeno mundo artesanal, legível e cheio de detalhes.
- A impressão de que a vila continuará crescendo junto com o projeto.

## Contrato do loop principal

O jogador **explora** a vila para **descobrir seus nove centros de atividade**, enquanto caminhos, obstáculos e marcos distantes orientam sua rota; cada descoberta **registra progresso e explica a função do local**, e o jogador pode continuar a exploração imediatamente.

## Verbos

- Primário: caminhar/explorar.
- Secundários: correr e interagir.
- Futuro, fora desta fatia: conversar, aceitar missão, administrar agentes e entrar em edifícios.

## Objetivo e progresso

- Visitar os nove edifícios principais.
- Aproximar-se da entrada e interagir para registrar a descoberta.
- A interface mostra o local próximo, as descobertas e a função futura de cada edifício.

## Pressão, falha e retomada

Esta fatia é de exploração tranquila. Não existe combate ou morte. O único contratempo é ficar preso por um obstáculo; colisões simples e limites do mapa impedem isso. O jogador sempre pode continuar caminhando. Futuras missões terão seus próprios estados de falha e recuperação no domínio, fora do mundo visual.

## Expressão de habilidade

Um jogador mais familiarizado com o mapa escolhe rotas curtas entre os marcos e usa a corrida de forma eficiente. Nesta primeira fatia, habilidade não bloqueia conteúdo.

## Plano espacial

- **Início seguro:** portão sul, a poucos passos da casa do jogador.
- **Primeira decisão:** seguir para a praça/guilda ou pela rota oeste até a taverna.
- **Primeira recompensa:** descobrir um edifício e abrir sua placa funcional.
- **Marco central:** guilda e árvore/praça.
- **Rota oeste:** taverna, mercado e ferraria.
- **Rota leste:** hospital, biblioteca e igreja.
- **Rota norte:** torre do mago; atrás dela, o castelo distante estabelece escala.
- **Recuperação:** praça e jardins são áreas abertas de orientação.
- **Leitura:** estradas conectam as entradas; telhados, placas e luzes distinguem os locais sem depender somente de cor.

## Direção visual

- Diorama 3D pixelado/voxel, câmera isométrica e resolução interna moderada.
- Formas grandes, telhados fortes, madeira/pedra/reboco e silhuetas distintas.
- Paleta de fim de tarde: verdes suaves, pedra quente, madeira escura e telhas terrosas.
- Primeiro, formas autorais; depois, materiais, iluminação, névoa e movimento ambiente.
- O castelo é uma silhueta minúscula no fundo, não um local interativo.

## Orçamento técnico inicial

| Métrica | Desktop | Mobile |
|---|---:|---:|
| Draw calls | até 300 | até 150 |
| Triângulos | até 750 mil | até 300 mil |
| Geometrias | até 300 | até 200 |
| Texturas | até 60 | até 40 |
| DPR | até 2 | até 1,5 |
| Luzes com sombra | 1 | 1 |

## Não objetivos desta fatia

- Agentes de IA reais, backend, contas ou banco de dados.
- Interiores dos prédios.
- Personagens finais, animações rigadas ou combate.
- Geração externa de 3D, imagens ou áudio.
- Física rígida, multiplayer ou pathfinding.

## Critérios de conclusão

- A primeira tela já é a vila jogável.
- Movimento funciona por teclado e toque.
- Os nove locais são distinguíveis, alcançáveis e interativos.
- HUD e painel de local funcionam em desktop e mobile.
- Cena, estado visual e diagnósticos derivam de uma fonte de verdade.
- Build, auditoria, teste de interação, screenshots e inspeção do canvas passam.
