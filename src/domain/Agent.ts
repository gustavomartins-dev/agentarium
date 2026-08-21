export type AgentId = 'aldren' | 'brunna' | 'selene';

export interface AgentProfile {
  readonly id: AgentId;
  readonly name: string;
  readonly animalClass: string;
  readonly role: string;
  readonly description: string;
  readonly skills: readonly string[];
  readonly status: 'available';
  readonly sigil: string;
  readonly color: string;
  readonly greeting: string;
}

export interface TavernMessage {
  readonly id: string;
  readonly agentId: AgentId;
  readonly author: 'agent' | 'player';
  readonly text: string;
  /** Sequência lógica da sessão; não representa horário de parede. */
  readonly timestamp: number;
}

export interface TavernState {
  readonly focusedAgentId: AgentId;
  readonly selectedAgentId: AgentId | null;
  readonly conversations: Readonly<Record<AgentId, readonly TavernMessage[]>>;
}

/** O primeiro pequeno elenco do Agentarium. */
export const TAVERN_AGENTS = Object.freeze({
  aldren: Object.freeze({
    id: 'aldren',
    name: 'Aldren',
    animalClass: 'Corvo Oráculo',
    role: 'Estrategista',
    description:
      'Enxerga rotas antes da partida e transforma ideias nebulosas em missões claras.',
    skills: Object.freeze(['Planejamento', 'Pesquisa', 'Prompts']),
    status: 'available',
    sigil: '✦',
    color: '#8d7edb',
    greeting:
      'As penas já estão sobre o mapa. Conte-me o destino e eu traçarei a primeira rota.',
  }),
  brunna: Object.freeze({
    id: 'brunna',
    name: 'Brunna',
    animalClass: 'Texugo Ferreiro',
    role: 'Executor',
    description:
      'Forja soluções práticas, testa cada encaixe e não abandona uma tarefa pela metade.',
    skills: Object.freeze(['Código', 'Testes', 'Ferramentas']),
    status: 'available',
    sigil: '⚒',
    color: '#cf7546',
    greeting:
      'Minha bancada está livre. Traga a tarefa e vamos transformar conversa em trabalho feito.',
  }),
  selene: Object.freeze({
    id: 'selene',
    name: 'Selene',
    animalClass: 'Coruja Clériga',
    role: 'Revisora',
    description:
      'Guarda a memória da vila e revisa decisões para que progresso não vire dívida.',
    skills: Object.freeze(['Revisão', 'Memória', 'Segurança']),
    status: 'available',
    sigil: '✥',
    color: '#65a98b',
    greeting:
      'Toda decisão deixa um vestígio. Posso ajudá-lo a lembrar, revisar e seguir em segurança.',
  }),
} satisfies Readonly<Record<AgentId, AgentProfile>>);
