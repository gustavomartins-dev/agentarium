import {
  TAVERN_AGENTS,
  type AgentId,
  type AgentProfile,
  type TavernMessage,
  type TavernState,
} from '../domain/Agent';

type TavernStateListener = (state: TavernState) => void;
type ConversationTopic = 'planning' | 'code' | 'memory' | 'fallback';

export interface AgentConversationProvider {
  reply(
    agent: AgentProfile,
    message: string,
    conversation: readonly TavernMessage[],
  ): string;
}

const RESPONSES: Readonly<
  Record<AgentId, Readonly<Record<ConversationTopic, string>>>
> = {
  aldren: {
    planning:
      'Eu começaria definindo o objetivo, o sinal de sucesso e a menor missão que prova a ideia. Depois, desenho as próximas rotas.',
    code:
      'Posso organizar o problema e pesquisar alternativas; para forjar código e testes, Brunna é a companheira mais direta.',
    memory:
      'Registrarei as premissas no plano. Selene pode revisar a decisão e preservar o que aprendermos.',
    fallback:
      'Vejo algumas rotas possíveis. Diga qual resultado você quer alcançar e eu o transformarei em um plano pequeno e verificável.',
  },
  brunna: {
    planning:
      'Dê-me uma missão pequena com critério de aceite. Eu separo as peças, implemento e mostro o resultado funcionando.',
    code:
      'Vamos reproduzir o problema, escrever a correção mais simples e cobri-la com testes antes de chamar o serviço de pronto.',
    memory:
      'Deixo rastros claros no código e nos testes. Selene pode fazer a revisão final e guardar a decisão na memória da vila.',
    fallback:
      'Mostre a tarefa concreta e o resultado esperado. Eu preparo as ferramentas e começo pela menor peça executável.',
  },
  selene: {
    planning:
      'Antes da missão partir, revisarei objetivo, riscos e decisões irreversíveis. Um plano lembrado é mais seguro que um plano apenas imaginado.',
    code:
      'Revisarei comportamento, testes, efeitos colaterais e sinais de falha. Para a execução da forja, convoque Brunna.',
    memory:
      'Posso comparar a decisão com o histórico, registrar o aprendizado e apontar riscos de segurança antes que se repitam.',
    fallback:
      'Conte o que foi decidido e o que ainda causa dúvida. Eu organizarei a memória, as ressalvas e a próxima revisão.',
  },
};

/** Provedor local usado enquanto a Taverna ainda não conversa com modelos reais. */
export class SimulatedAgentProvider implements AgentConversationProvider {
  reply(
    agent: AgentProfile,
    message: string,
    conversation: readonly TavernMessage[],
  ): string {
    const normalized = normalizeForMatching(message);
    const topic = identifyTopic(normalized);

    // A leitura do contexto mantém este contrato compatível com provedores futuros.
    void conversation;
    return RESPONSES[agent.id][topic];
  }
}

/** Fonte única de verdade para foco, recrutamento e conversas da Taverna. */
export class TavernSystem {
  private readonly listeners = new Set<TavernStateListener>();
  private state: TavernState = createInitialState();
  private sequence = 0;
  private disposed = false;

  constructor(
    private readonly provider: AgentConversationProvider = new SimulatedAgentProvider(),
  ) {}

  getState(): TavernState {
    return copyState(this.state);
  }

  subscribe(listener: TavernStateListener): () => void {
    listener(this.getState());
    if (this.disposed) return () => undefined;

    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  focusAgent(id: AgentId): void {
    if (this.disposed || this.state.focusedAgentId === id) return;
    this.state = { ...this.state, focusedAgentId: id };
    this.emit();
  }

  selectAgent(id: AgentId): void {
    if (
      this.disposed ||
      (this.state.selectedAgentId === id && this.state.focusedAgentId === id)
    ) {
      return;
    }

    this.state = {
      ...this.state,
      focusedAgentId: id,
      selectedAgentId: id,
    };
    this.emit();
  }

  sendMessage(text: string): boolean {
    if (this.disposed) return false;

    const message = sanitizeText(text, 280);
    if (!message) return false;

    const agentId = this.state.focusedAgentId;
    const conversation = this.state.conversations[agentId];
    const playerMessage = this.createMessage(agentId, 'player', message);
    const response = sanitizeText(
      this.provider.reply(
        TAVERN_AGENTS[agentId],
        message,
        Object.freeze([...conversation, playerMessage]),
      ),
      560,
    );
    const agentMessage = this.createMessage(
      agentId,
      'agent',
      response || 'Preciso de outras palavras para compreender essa missão.',
    );

    this.state = {
      ...this.state,
      conversations: {
        ...this.state.conversations,
        [agentId]: Object.freeze([...conversation, playerMessage, agentMessage]),
      },
    };
    this.emit();
    return true;
  }

  reset(): void {
    if (this.disposed) return;
    this.sequence = 0;
    this.state = createInitialState();
    this.emit();
  }

  dispose(): void {
    this.disposed = true;
    this.listeners.clear();
  }

  private createMessage(
    agentId: AgentId,
    author: TavernMessage['author'],
    text: string,
  ): TavernMessage {
    this.sequence += 1;
    return Object.freeze({
      id: `${agentId}-${author}-${this.sequence}`,
      agentId,
      author,
      text,
      timestamp: this.sequence,
    });
  }

  private emit(): void {
    const snapshot = this.getState();
    this.listeners.forEach((listener) => listener(snapshot));
  }
}

function createInitialState(): TavernState {
  return {
    focusedAgentId: 'aldren',
    selectedAgentId: null,
    conversations: {
      aldren: Object.freeze([createGreeting('aldren')]),
      brunna: Object.freeze([createGreeting('brunna')]),
      selene: Object.freeze([createGreeting('selene')]),
    },
  };
}

function createGreeting(agentId: AgentId): TavernMessage {
  return Object.freeze({
    id: `${agentId}-agent-greeting`,
    agentId,
    author: 'agent',
    text: TAVERN_AGENTS[agentId].greeting,
    timestamp: 0,
  });
}

function copyState(state: TavernState): TavernState {
  return Object.freeze({
    focusedAgentId: state.focusedAgentId,
    selectedAgentId: state.selectedAgentId,
    conversations: Object.freeze({
      aldren: Object.freeze([...state.conversations.aldren]),
      brunna: Object.freeze([...state.conversations.brunna]),
      selene: Object.freeze([...state.conversations.selene]),
    }),
  });
}

function sanitizeText(value: string, maxLength: number): string {
  return value.trim().replace(/\s+/g, ' ').slice(0, maxLength).trim();
}

function normalizeForMatching(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
}

function identifyTopic(message: string): ConversationTopic {
  if (/\b(projeto|missao|plano|planejamento|objetivo)\b/.test(message)) {
    return 'planning';
  }
  if (/\b(codigo|erro|teste|testes|bug|ferramenta|ferramentas)\b/.test(message)) {
    return 'code';
  }
  if (/\b(memoria|revisao|seguranca|historico|decisao)\b/.test(message)) {
    return 'memory';
  }
  return 'fallback';
}
