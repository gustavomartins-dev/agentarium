# Agentarium — fatia funcional da Taverna

Data: 2026-08-20

## Promessa

A Taverna transforma o primeiro prédio da vila em uma função real: conhecer um pequeno grupo de agentes, entender o papel de cada um, conversar sem custo com uma simulação local e escolher quem ficará ativo.

## Jornada do jogador

1. Caminhar até a entrada da Taverna.
2. Interagir e descobrir o local.
3. Comparar três perfis com papéis complementares.
4. Fazer perguntas por atalhos ou texto livre.
5. Escolher um agente.
6. Fechar a Taverna e continuar na vila com o agente ativo visível no HUD.

## Elenco provisório

| Agente | Classe medieval | Papel | Especialidades |
|---|---|---|---|
| Aldren | Corvo Oráculo | Estrategista | Planejamento, pesquisa e prompts |
| Brunna | Texugo Ferreiro | Executor | Código, testes e ferramentas |
| Selene | Coruja Clériga | Revisora | Revisão, memória e segurança |

Os nomes, sigilos e retratos são provisórios. Esta fatia valida o produto e o fluxo; não define a arte final dos personagens.

## Contrato do loop

O jogador **inspeciona** agentes para **entender suas diferenças**, conversa para **antecipar como cada um trabalharia** e seleciona um perfil para **formar o primeiro vínculo entre a vila e o sistema de agentes**.

Não existe falha. O jogador pode trocar de agente, reformular uma pergunta ou sair da Taverna a qualquer momento.

## Modelo de estado

```text
Taverna
├── catálogo imutável de agentes
├── agente em foco
├── agente ativo (opcional)
└── conversas por agente
    ├── saudação inicial
    ├── mensagens do jogador
    └── respostas do provedor
```

O `TavernSystem` é a fonte de verdade. O painel apenas apresenta esse estado e envia intenções. A geração de resposta fica atrás de `AgentConversationProvider`, permitindo substituir a simulação por um backend de IA futuramente sem reescrever a interface.

## Simulação sem custo

- Nenhuma chamada de rede, chave, modelo ou serviço pago.
- Respostas determinísticas por agente e por grupos de palavras-chave.
- IDs e ordem de mensagens determinísticos para testes visuais estáveis.
- Estado somente na sessão; persistência fica fora desta fatia.

## Não objetivos

- Agentes reais executando ferramentas.
- Streaming de tokens, histórico em banco ou autenticação.
- Interior 3D navegável da Taverna.
- Personagens finais, inventário, contratação por moeda ou progressão.
- Criação de projetos e missões; essa responsabilidade continuará pertencendo à Guilda.

## Critérios de conclusão

- A interação real com a entrada abre a Taverna em desktop e mobile.
- Os três perfis podem ser comparados e têm conteúdo legível.
- Uma pergunta gera uma resposta local coerente e determinística.
- A escolha do agente persiste ao fechar o painel e aparece no HUD.
- O restante da vila, os nove pontos de interação e os controles continuam funcionando.
- Build, testes funcionais, regressão visual e inspeção manual de screenshots passam sem erros de console.
