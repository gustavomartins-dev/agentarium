# Agentarium

> Um laboratório visual em pixel art para criar, observar e aprender a trabalhar com agentes de inteligência artificial.

> Projeto desenvolvido com auxílio integral de inteligência artificial, sob direção, decisões e validação de Gustavo Martins.

## Estado atual — vila jogável + Taverna funcional

A primeira fatia jogável está implementada em Three.js: uma vila medieval 3D pixelizada, navegável por teclado e toque, com nove locais interativos. A Taverna já é o primeiro prédio funcional do Agentarium.

```bash
npm install
npm run dev
```

Abra `http://127.0.0.1:5173` (ou a porta indicada pelo Vite).

### Controles

- `WASD` ou setas: caminhar.
- `Shift` ou `Espaço`: correr.
- `E` ou `Enter`: interagir.
- Celular: joystick virtual e botão **Interagir**.

### O que existe nesta fatia

- Guilda, Taverna, Ferraria, Biblioteca, Igreja, Torre do Mago, Mercado, Hospital e Sua Casa.
- Onze casas auxiliares, praça, fonte, estradas, jardins, árvores, cercas, postes, carroça e um castelo distante.
- Personagem voxel provisório, câmera isométrica, corrida, animação e colisão com 36 proxies autorais.
- Missão de descoberta `0/9`, prompt contextual e painel com a futura função de cada local.
- Taverna do Grifo Dourado com três agentes provisórios, fichas, seleção persistente na sessão e conversa simulada local.
- HUD responsiva, controles touch, áudio procedural local e suporte a movimento reduzido.
- Renderização pixelizada adaptativa: contornos por profundidade/normais no desktop e passe econômico no mobile.
- Diagnósticos de render, testes reais de movimento/interação e regressão visual reproduzível.

### Primeira função real: Taverna

Interaja com a Taverna para conhecer Aldren, Brunna e Selene. Cada agente tem classe, papel e especialidades próprias; você pode conversar com respostas determinísticas sem rede e escolher quem ficará ativo no HUD. O provedor de conversa é substituível, mas esta versão não usa API, chave, modelo pago ou backend.

### Verificações

```bash
npm run build
npm test
npm run verify:visual
npx playwright test tests/visual-regression.spec.ts
```

O conceito do mundo está em [`docs/primeira-fatia-jogavel.md`](docs/primeira-fatia-jogavel.md), e o contrato funcional da Taverna em [`docs/fatia-taverna.md`](docs/fatia-taverna.md). As evidências estão nos relatórios da [`vila`](docs/relatorio-primeira-fatia.md) e da [`Taverna`](docs/relatorio-taverna.md).

## Contexto de desenvolvimento

Quero que você atue como arquiteto, mentor técnico e, somente depois da minha aprovação, desenvolvedor deste projeto.

O projeto se chama **Agentarium**. Ele é 100% pessoal e não possui nenhuma relação com a empresa China Link, seus sistemas, arquivos, contratos ou informações.

- Repositório local: `/home/gustavo-fonseca-martins/agentarium`
- GitHub pessoal: `https://github.com/gustavomartins-dev/agentarium`
- Vault pessoal: `/home/gustavo-fonseca-martins/Documentos/Second-Brain`
- Documentação oficial: `/home/gustavo-fonseca-martins/Documentos/Second-Brain/02 - Projetos/Agentarium/`
- Nota principal: `/home/gustavo-fonseca-martins/Documentos/Second-Brain/02 - Projetos/Agentarium/Agentarium.md`

## Visão do produto

Quero criar um ambiente visual e interativo no qual agentes de IA são representados como personagens em um pequeno mundo pixel art.

O usuário cria projetos, transforma objetivos em missões e distribui tarefas para agentes especializados. Enquanto os agentes trabalham, seus estados aparecem visualmente no cenário: pensando, pesquisando, programando, revisando, aguardando aprovação, concluindo uma missão ou encontrando um erro.

O produto não deve ser apenas uma animação bonita. A interface visual precisa representar estados reais do sistema e ajudar o usuário a entender:

- Qual agente está fazendo o quê.
- Por que determinada ferramenta foi usada.
- Quais decisões foram tomadas.
- Quanto cada tarefa custou em tempo e tokens.
- Quando uma ação precisa de aprovação humana.
- O que deu errado e como investigar.
- O que o usuário aprendeu durante o projeto.

## Objetivo de aprendizagem

Este projeto também é meu laboratório de formação. Não quero apenas receber código pronto. Quero aprender a pensar como alguém que projeta e constrói sistemas complexos.

Durante o desenvolvimento, ensine de forma prática:

- Decomposição de problemas.
- Modelagem de domínio.
- Arquitetura de software.
- Frontend e interfaces interativas.
- Backend e APIs.
- Bancos de dados e persistência.
- Eventos em tempo real.
- Integração com modelos de IA.
- Prompts, ferramentas e agentes.
- Filas, jobs e máquinas de estado.
- Testes, observabilidade e depuração.
- Segurança, permissões e proteção de segredos.
- Git, commits, branches e evolução de produto.
- Avaliação de custos e trade-offs técnicos.

Antes de implementar uma parte importante, explique:

1. Qual problema estamos resolvendo.
2. Quais opções existem.
3. Qual opção você recomenda e por quê.
4. O que eu devo observar no código.
5. Como podemos testar se a solução realmente funciona.

Faça perguntas que me ajudem a raciocinar. Não esconda toda a complexidade, mas também não introduza complexidade sem necessidade.

## Conceito inicial

### Mundo visual

- Escritório ou laboratório em pixel art.
- Agentes como personagens com papéis diferentes.
- Salas ou estações para planejamento, pesquisa, código, revisão e memória.
- Animações ligadas aos estados reais das tarefas.
- Linha do tempo mostrando eventos e decisões.
- Possibilidade futura de personalizar personagens e ambientes.

### Sistema de agentes

- Criar agentes com nome, função, instruções e ferramentas permitidas.
- Delegar missões e acompanhar subtarefas.
- Exigir aprovação para ações sensíveis.
- Exibir raciocínio operacional resumido, decisões, entradas e resultados sem fingir transparência que o modelo não oferece.
- Registrar uso de ferramentas, erros, tentativas e resultados.
- Permitir começar com agentes simulados antes de conectar APIs reais.

### Gamificação

- Objetivos transformados em missões.
- Tarefas transformadas em quests menores.
- Experiência por aprendizado e conclusão, não por consumo compulsivo.
- Níveis de agentes associados a capacidades desbloqueadas.
- Conquistas por boas práticas: escrever testes, documentar decisões, corrigir bugs e revisar segurança.
- Árvore de habilidades representando o que aprendi.
- Histórico de projetos como um diário de campanha.

### Aprendizado

- Explicações contextuais sobre arquitetura e código.
- Perguntas rápidas para confirmar entendimento.
- Registro de conceitos aprendidos no Obsidian.
- Revisões periódicas.
- Desafios em que eu implemento uma pequena parte com orientação.
- Painel mostrando tecnologias e conceitos praticados.

## Primeira versão possível

A primeira versão deve ser pequena o suficiente para terminar, mas completa o suficiente para provar a ideia:

1. Uma aplicação web local.
2. Um cenário pixel art simples.
3. Três agentes com papéis predefinidos.
4. Criação de projeto e missão.
5. Quadro de tarefas com estados bem definidos.
6. Personagens reagindo aos estados das tarefas.
7. Feed de eventos em tempo real.
8. Agentes inicialmente simulados para validar a experiência sem custos.
9. Integração opcional posterior com uma API de IA escolhida pelo usuário.
10. Persistência local dos projetos e do progresso.
11. Sistema básico de experiência e conquistas.
12. Tela que explica o que está acontecendo e o conceito técnico envolvido.

## Ideias futuras

- Editor visual de agentes e ferramentas.
- Múltiplos cenários e personagens.
- Agentes realmente executando tarefas em ambientes isolados.
- Integração com GitHub e acompanhamento de pull requests.
- Memória pesquisável por projeto.
- Multiplayer ou compartilhamento de mundos.
- Marketplace de agentes, missões e cenários.
- Modelo local por Ollama ou tecnologia equivalente.
- Aplicativo instalável como PWA.
- Plugins e API pública.
- Replay visual da execução de uma missão.

Essas ideias não fazem parte automaticamente do MVP. Avalie-as antes de adicioná-las.

## Restrições

- Priorize ferramentas gratuitas e de código aberto.
- O sistema deve funcionar localmente antes de depender de nuvem.
- Não crie cobranças, assinaturas ou serviços pagos sem minha aprovação.
- Não adicione telemetria, publicidade ou coleta oculta de dados.
- Nunca coloque chaves de API no frontend, no Git ou no Obsidian.
- APIs pagas devem ser opcionais e ter limite de custo configurável.
- Prefira uma arquitetura que permita usar simulação, modelos locais ou diferentes provedores.
- Não execute código gerado por agentes sem isolamento e aprovação explícita.
- Não permita que agentes alterem arquivos fora do diretório autorizado.
- Não acesse, analise ou altere a pasta `China Link`.
- Trabalhe somente no repositório `agentarium` e na pasta autorizada do Obsidian.
- Não faça commit ou push sem meu pedido explícito.

## Primeira tarefa de desenvolvimento (concluída — registro histórico)

Esta restrição valeu para a Etapa 0 e foi cumprida. Depois da proposta e das conversas de direção, o usuário autorizou explicitamente a implementação do frontend da vila em 19 de agosto de 2026. Nenhum commit ou push faz parte dessa autorização.

Primeiro, entregue uma proposta contendo:

1. Definição clara do problema e do público inicial.
2. Jornada principal do usuário.
3. Escopo recomendado para o MVP.
4. Funcionalidades que devem ficar para depois.
5. Comparação das tecnologias adequadas.
6. Recomendação de stack com justificativa e alternativas.
7. Arquitetura inicial sem complexidade prematura.
8. Modelo de dados inicial.
9. Máquina de estados para agentes, missões e tarefas.
10. Estratégia para o mundo pixel art e suas animações.
11. Estratégia para eventos em tempo real.
12. Forma segura de integrar APIs de IA futuramente.
13. Estratégia de simulação para desenvolver sem gastar dinheiro.
14. Riscos técnicos, de segurança, custo e escopo.
15. Plano de implementação dividido em marcos pequenos.
16. Estratégia de testes.
17. Plano de aprendizado associado a cada marco.
18. Decisões que precisam da minha aprovação antes da implementação.

Apresente diagramas simples quando ajudarem. Diferencie fatos, recomendações e hipóteses. Ao recomendar uma ferramenta cuja situação possa ter mudado, consulte sua documentação oficial.

## Caminho de desenvolvimento

Não tente construir o produto inteiro de uma vez. Trabalhe em uma etapa por vez e espere minha aprovação antes de avançar.

### Etapa 0 — Descoberta e decisões

**Objetivo:** transformar a visão em um plano realista antes de escolher ferramentas.

- Definir problema, público e jornada principal.
- Separar MVP, versões futuras e ideias experimentais.
- Definir o que torna o Agentarium útil além do visual.
- Comparar stacks e registrar os trade-offs.
- Criar mapa de riscos e perguntas em aberto.
- Produzir arquitetura conceitual e modelo de domínio inicial.

**Aprendizado:** produto, escopo, requisitos, trade-offs e modelagem.

**Saída:** proposta para minha aprovação, registrada no Obsidian. Nenhum código de aplicação.

### Etapa 1 — Fundação do repositório

**Objetivo:** criar uma base pequena, compreensível e confiável.

- Inicializar a stack aprovada.
- Configurar formatação, lint e testes.
- Definir estrutura inicial de pastas.
- Criar documentação de execução local.
- Construir somente uma página vazia identificando o projeto.

**Aprendizado:** estrutura de projeto, ferramentas, dependências e qualidade automática.

**Critério de conclusão:** aplicação executa localmente e verificações automáticas passam.

### Etapa 2 — Protótipo do mundo visual

**Objetivo:** validar a experiência visual sem backend e sem IA.

- Criar um cenário pixel art mínimo.
- Mostrar personagens e estações.
- Implementar estados visuais falsos controlados pela interface.
- Validar legibilidade, navegação e identidade visual.

**Aprendizado:** componentes, estado de interface, renderização, animação e design responsivo.

**Critério de conclusão:** é possível alternar estados e entender visualmente o que cada agente está fazendo.

### Etapa 3 — Domínio e persistência local

**Objetivo:** transformar o protótipo em um sistema real, ainda sem IA.

- Modelar projetos, missões, tarefas, agentes e eventos.
- Implementar as máquinas de estado.
- Salvar e restaurar dados localmente.
- Criar missões e mover tarefas pelo fluxo.
- Registrar uma linha do tempo auditável.

**Aprendizado:** modelagem, regras de negócio, persistência, migrações e testes.

**Critério de conclusão:** recarregar a aplicação não perde o projeto nem seu histórico.

### Etapa 4 — Gamificação com propósito

**Objetivo:** recompensar aprendizado e boas práticas sem criar mecânicas vazias.

- Definir experiência, níveis e conquistas.
- Ligar recompensas a eventos reais.
- Criar árvore inicial de habilidades.
- Mostrar por que cada recompensa foi conquistada.

**Aprendizado:** regras derivadas, progressão, ética de produto e feedback visual.

**Critério de conclusão:** toda recompensa é explicável, testável e ligada a uma ação útil.

### Etapa 5 — Agentes simulados

**Objetivo:** validar a orquestração sem pagar API nem depender de um modelo.

- Criar um motor determinístico de simulação.
- Simular planejamento, execução, revisão, erro e aprovação.
- Alimentar o feed de eventos e o mundo visual.
- Medir tempo e custos fictícios.

**Aprendizado:** eventos, jobs, assincronismo, máquinas de estado e testes determinísticos.

**Critério de conclusão:** uma missão simulada percorre o fluxo completo e pode ser reproduzida.

### Etapa 6 — Primeira integração de IA

**Objetivo:** trocar apenas uma parte da simulação por uma integração real e controlada.

- Definir uma interface independente de provedor.
- Começar por uma ação de baixo risco, como decompor uma missão.
- Proteger a chave no backend ou processo local apropriado.
- Adicionar limites de custo, timeout, cancelamento e tratamento de erros.
- Manter o modo simulado disponível.

**Aprendizado:** APIs de modelos, prompts, saída estruturada, segurança, custo e avaliação.

**Critério de conclusão:** a mesma funcionalidade roda em modo simulado e real, sem expor segredos.

### Etapa 7 — Ferramentas e aprovações

**Objetivo:** permitir ações úteis com limites claros.

- Criar sistema de ferramentas permitidas.
- Exigir confirmação humana para ações sensíveis.
- Limitar diretórios e capacidades.
- Registrar entrada, saída e resultado de cada ferramenta.
- Pesquisar isolamento antes de executar qualquer código gerado.

**Aprendizado:** segurança, permissões, sandbox, auditoria e falhas seguras.

**Critério de conclusão:** nenhuma ação sensível ocorre silenciosamente ou fora do escopo autorizado.

### Etapa 8 — Consolidação do MVP

**Objetivo:** integrar e polir somente o que provou valor.

- Melhorar experiência, acessibilidade e desempenho.
- Completar testes dos fluxos essenciais.
- Revisar segurança e documentação.
- Preparar instalação local e demonstração.
- Comparar o resultado com os critérios definidos na Etapa 0.

**Aprendizado:** integração, qualidade, entrega e avaliação de produto.

**Critério de conclusão:** o MVP resolve a jornada principal de ponta a ponta e pode ser explicado por mim.

### Regra de avanço

Ao iniciar cada etapa:

1. Releia o estado atual no Obsidian.
2. Explique o objetivo e os conceitos envolvidos.
3. Proponha uma entrega pequena e verificável.
4. Apresente decisões que precisam da minha aprovação.
5. Só implemente depois que eu aprovar.

Ao encerrar cada etapa:

1. Execute os testes definidos.
2. Confira as alterações.
3. Explique o que foi construído e como funciona.
4. Faça perguntas curtas para verificar meu entendimento.
5. Atualize o Obsidian.
6. Espere minha autorização para commit, push ou próxima etapa.

## Obsidian obrigatório

Use o Second Brain como memória oficial e contínua do projeto desde a primeira análise. Atualizar o Obsidian faz parte da definição de pronto; uma tarefa relevante não está concluída enquanto sua documentação não estiver atualizada.

A nota principal deverá conter:

- Visão e objetivo.
- Estado atual.
- Arquitetura.
- Stack e justificativas.
- Decisões e seus trade-offs.
- Funcionalidades implementadas.
- Conceitos aprendidos.
- Perguntas em aberto.
- Pendências e problemas conhecidos.
- Próxima ação.
- Links importantes.
- Histórico resumido das atualizações.

Para cada alteração futura:

1. Explique antes o que será feito e o que vou aprender.
2. Implemente somente depois de autorizado.
3. Execute testes proporcionais ao risco.
4. Confira o diff.
5. Atualize a documentação do projeto no Obsidian.
6. Registre data, resumo, arquivos afetados, decisões, aprendizado, testes, resultado e próxima ação.
7. Informe claramente o que mudou.
8. Espere autorização explícita para commit e push.

Também atualize o Obsidian quando houver apenas planejamento, pesquisa ou decisão, mesmo que nenhum código tenha mudado. Não crie registros artificiais para ações sem relevância; consolide pequenas mudanças relacionadas em uma entrada útil.

Antes de trabalhar, leia a nota principal e apenas as notas do Agentarium necessárias para recuperar o contexto. Ao concluir, garanta que outra sessão consiga continuar dali sem depender da conversa anterior.

Comece pela **Etapa 0 — Descoberta e decisões**. Faça a análise, registre-a no Obsidian e aguarde minha aprovação. Não implemente o produto antes disso.
