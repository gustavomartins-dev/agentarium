import {
  TAVERN_AGENTS,
  type AgentId,
  type AgentProfile,
  type TavernMessage,
  type TavernState,
} from '../domain/Agent';
import { TavernSystem } from './TavernSystem';

/**
 * DOM adapter for the Tavern. The system remains the single source of truth;
 * this class only renders snapshots and translates controls into player intent.
 */
export class TavernPanel {
  private readonly dialog = this.getDialog('#tavern-panel');
  private readonly closeButton = this.getButton('#tavern-close');
  private readonly roster = this.getElement('#tavern-roster');
  private readonly agentSigil = this.getElement('#tavern-agent-sigil');
  private readonly agentName = this.getElement('#tavern-agent-name');
  private readonly agentClass = this.getElement('#tavern-agent-class');
  private readonly agentRole = this.getElement('#tavern-agent-role');
  private readonly agentDescription = this.getElement('#tavern-agent-description');
  private readonly agentStatus = this.getElement('#tavern-agent-status');
  private readonly agentSkills = this.getElement('#tavern-agent-skills');
  private readonly selectAgentButton = this.getButton('#tavern-select-agent');
  private readonly chatLog = this.getElement('#tavern-chat-log');
  private readonly chatForm = this.getForm('#tavern-chat-form');
  private readonly chatInput = this.getInput('#tavern-chat-input');
  private readonly quickPrompts = Array.from(
    this.dialog.querySelectorAll<HTMLButtonElement>('.tavern-quick-prompt'),
  );
  private readonly rosterButtons = new Map<AgentId, HTMLButtonElement>();
  private readonly unsubscribe: () => void;

  private focusedAgentId: AgentId = 'aldren';
  private previouslyFocusedElement: HTMLElement | null = null;
  private disposed = false;

  private readonly onCloseClick = (): void => this.close();

  private readonly onDialogClose = (): void => {
    this.previouslyFocusedElement?.focus();
    this.previouslyFocusedElement = null;
  };

  private readonly onSelectAgent = (): void => {
    this.system.selectAgent(this.focusedAgentId);
  };

  private readonly onChatSubmit = (event: SubmitEvent): void => {
    event.preventDefault();
    if (!this.system.sendMessage(this.chatInput.value)) return;

    this.chatInput.value = '';
    this.chatInput.focus();
  };

  private readonly onQuickPrompt = (event: Event): void => {
    const button = event.currentTarget;
    if (!(button instanceof HTMLButtonElement)) return;

    const prompt = button.dataset.prompt?.trim();
    if (!prompt || !this.system.sendMessage(prompt)) return;

    this.chatInput.value = '';
    this.chatInput.focus();
  };

  constructor(private readonly system: TavernSystem) {
    this.createRoster();
    this.closeButton.addEventListener('click', this.onCloseClick);
    this.dialog.addEventListener('close', this.onDialogClose);
    this.selectAgentButton.addEventListener('click', this.onSelectAgent);
    this.chatForm.addEventListener('submit', this.onChatSubmit);
    this.quickPrompts.forEach((button) => button.addEventListener('click', this.onQuickPrompt));
    this.unsubscribe = this.system.subscribe((state) => this.render(state));
  }

  open(): void {
    if (this.disposed || this.dialog.open) return;

    this.previouslyFocusedElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this.dialog.showModal();
    this.scrollConversationToEnd();
    window.requestAnimationFrame(() => {
      this.rosterButtons.get(this.focusedAgentId)?.focus({ preventScroll: true });
    });
  }

  close(): void {
    if (this.dialog.open) this.dialog.close();
  }

  isOpen(): boolean {
    return this.dialog.open;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.close();
    this.unsubscribe();
    this.closeButton.removeEventListener('click', this.onCloseClick);
    this.dialog.removeEventListener('close', this.onDialogClose);
    this.selectAgentButton.removeEventListener('click', this.onSelectAgent);
    this.chatForm.removeEventListener('submit', this.onChatSubmit);
    this.quickPrompts.forEach((button) => button.removeEventListener('click', this.onQuickPrompt));
    this.roster.replaceChildren();
    this.rosterButtons.clear();
  }

  private createRoster(): void {
    const items = Object.values(TAVERN_AGENTS).map((agent) => {
      const item = document.createElement('div');
      const button = document.createElement('button');
      const sigil = document.createElement('span');
      const copy = document.createElement('span');
      const name = document.createElement('strong');
      const agentClass = document.createElement('span');
      const role = document.createElement('span');

      item.className = 'tavern-roster-item';
      item.setAttribute('role', 'listitem');
      button.type = 'button';
      button.className = 'tavern-agent-card';
      button.dataset.agentId = agent.id;
      button.setAttribute(
        'aria-label',
        `Ver ficha de ${agent.name}, ${agent.animalClass}, ${agent.role}`,
      );
      button.style.setProperty('--card-accent', agent.color);
      button.addEventListener('click', () => this.system.focusAgent(agent.id));

      sigil.className = 'tavern-agent-card__sigil';
      sigil.setAttribute('aria-hidden', 'true');
      sigil.textContent = agent.sigil;
      copy.className = 'tavern-agent-card__copy';
      name.className = 'tavern-agent-card__name';
      name.textContent = agent.name;
      agentClass.className = 'tavern-agent-card__class';
      agentClass.textContent = agent.animalClass;
      role.className = 'tavern-agent-card__role';
      role.textContent = agent.role;

      copy.append(name, agentClass, role);
      button.append(sigil, copy);
      item.append(button);
      this.rosterButtons.set(agent.id, button);
      return item;
    });

    this.roster.replaceChildren(...items);
  }

  private render(state: TavernState): void {
    const agent = TAVERN_AGENTS[state.focusedAgentId];
    const selected = state.selectedAgentId === agent.id;
    this.focusedAgentId = agent.id;
    this.dialog.style.setProperty('--agent-accent', agent.color);

    this.agentSigil.textContent = agent.sigil;
    this.agentName.textContent = agent.name;
    this.agentClass.textContent = agent.animalClass;
    this.agentRole.textContent = agent.role;
    this.agentDescription.textContent = agent.description;
    this.agentStatus.textContent = this.statusLabel(agent);
    this.agentSkills.replaceChildren(
      ...agent.skills.map((skill) => {
        const item = document.createElement('li');
        item.textContent = skill;
        return item;
      }),
    );

    this.rosterButtons.forEach((button, id) => {
      const isFocused = id === state.focusedAgentId;
      const isSelected = id === state.selectedAgentId;
      button.setAttribute('aria-current', String(isFocused));
      button.toggleAttribute('data-selected', isSelected);
      button.title = isSelected ? 'Agente ativo' : `Ver ficha de ${TAVERN_AGENTS[id].name}`;
    });

    this.selectAgentButton.dataset.selected = String(selected);
    this.selectAgentButton.setAttribute('aria-pressed', String(selected));
    this.setActionLabel(selected);
    this.chatInput.placeholder = `Conte sua missão a ${agent.name}...`;
    this.renderMessages(agent, state.conversations[agent.id]);
  }

  private renderMessages(agent: AgentProfile, messages: readonly TavernMessage[]): void {
    const entries = messages.map((message) => {
      const entry = document.createElement('article');
      const speaker = document.createElement('span');
      const text = document.createElement('p');

      entry.className = 'tavern-message';
      entry.dataset.messageRole = message.author;
      entry.dataset.messageId = message.id;
      speaker.className = 'tavern-message__speaker';
      speaker.textContent = message.author === 'player' ? 'Você' : agent.name;
      text.textContent = message.text;
      entry.append(speaker, text);
      return entry;
    });

    this.chatLog.replaceChildren(...entries);
    this.scrollConversationToEnd();
  }

  private setActionLabel(selected: boolean): void {
    const glyph = this.selectAgentButton.querySelector<HTMLElement>('span:first-child');
    const label = this.selectAgentButton.querySelector<HTMLElement>('span:last-child');
    if (glyph) glyph.textContent = selected ? '✓' : '⚔';
    if (label) label.textContent = selected ? 'Agente ativo na expedição' : 'Viajar com este agente';
  }

  private scrollConversationToEnd(): void {
    if (!this.dialog.open) return;
    window.requestAnimationFrame(() => {
      this.chatLog.scrollTop = this.chatLog.scrollHeight;
    });
  }

  private statusLabel(agent: AgentProfile): string {
    return agent.status === 'available' ? 'Disponível' : agent.status;
  }

  private getElement(selector: string): HTMLElement {
    const element = document.querySelector<HTMLElement>(selector);
    if (!element) throw new Error(`Missing ${selector} element.`);
    return element;
  }

  private getButton(selector: string): HTMLButtonElement {
    const element = document.querySelector<HTMLButtonElement>(selector);
    if (!element) throw new Error(`Missing ${selector} button.`);
    return element;
  }

  private getDialog(selector: string): HTMLDialogElement {
    const element = document.querySelector<HTMLDialogElement>(selector);
    if (!element) throw new Error(`Missing ${selector} dialog.`);
    return element;
  }

  private getForm(selector: string): HTMLFormElement {
    const element = document.querySelector<HTMLFormElement>(selector);
    if (!element) throw new Error(`Missing ${selector} form.`);
    return element;
  }

  private getInput(selector: string): HTMLInputElement {
    const element = document.querySelector<HTMLInputElement>(selector);
    if (!element) throw new Error(`Missing ${selector} input.`);
    return element;
  }
}
