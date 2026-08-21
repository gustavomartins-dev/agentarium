export type HudBuilding = {
  id: string;
  name: string;
  purpose: string;
  icon?: string;
  status?: string;
};

export type HudAgent = {
  id: string;
  name: string;
  role: string;
  sigil: string;
};

export type HudInteractDetail = {
  building: HudBuilding | null;
};

export type HudAudioDetail = {
  muted: boolean;
};

export const HUD_EVENTS = {
  interact: 'agentarium:interact',
  audioToggle: 'agentarium:audio-toggle',
} as const;

/**
 * Presentation adapter for the village HUD.
 *
 * The game owns discovery/proximity rules. Hud only renders their state and
 * emits player intents through DOM CustomEvents, keeping the interface
 * independent from the world simulation.
 */
export class Hud {
  private readonly scoreValue = this.getElement('#score-value');
  private readonly targetValue = this.getElement('#target-value');
  private readonly timerValue = this.getElement('#timer-value', false);
  private readonly statusLine = this.getElement('#status-line');
  private readonly questTitle = this.getElement('#quest-title');
  private readonly questProgress = this.getElement('.quest-progress');
  private readonly questProgressFill = this.getElement('#quest-progress-fill');
  private readonly locationValue = this.getElement('#location-value');
  private readonly activeAgentBadge = this.getElement('#active-agent-badge');
  private readonly activeAgentSigil = this.getElement('#active-agent-sigil');
  private readonly activeAgentName = this.getElement('#active-agent-name');
  private readonly activeAgentRole = this.getElement('#active-agent-role');
  private readonly interactionPrompt = this.getElement('#interaction-prompt');
  private readonly interactionName = this.getElement('#interaction-name');
  private readonly interactButton = this.getButton('#dash-button');
  private readonly audioButton = this.getButton('#audio-button');
  private readonly helpButton = this.getButton('#help-button');
  private readonly buildingDialog = this.getDialog('#building-panel');
  private readonly buildingClose = this.getButton('#building-close');
  private readonly buildingIcon = this.getElement('#building-icon');
  private readonly buildingName = this.getElement('#building-name');
  private readonly buildingPurpose = this.getElement('#building-purpose');
  private readonly buildingStatus = this.getElement('#building-status');
  private readonly helpDialog = this.getDialog('#help-panel');
  private readonly helpClose = this.getButton('#help-close');
  private readonly announcer = this.getElement('#screen-announcer');

  private nearbyBuilding: HudBuilding | null = null;
  private muted = false;
  private lastStatus = '';
  private lastDiscovery = -1;
  private lastTarget = -1;
  private activeAgentId: string | null = null;
  private lastFocusedElement: HTMLElement | null = null;
  private announceTimer: number | undefined;

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.code !== 'KeyE' || event.repeat || this.anyDialogOpen()) return;

    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      return;
    }

    event.preventDefault();
    this.requestInteraction();
  };

  private readonly onInteractClick = (): void => this.requestInteraction();

  private readonly onAudioClick = (): void => {
    this.muted = !this.muted;
    this.audioButton.setAttribute('aria-pressed', String(this.muted));
    this.audioButton.setAttribute('aria-label', this.muted ? 'Ativar áudio' : 'Silenciar áudio');
    this.audioButton.title = this.muted ? 'Ativar áudio' : 'Silenciar áudio';
    window.dispatchEvent(
      new CustomEvent<HudAudioDetail>(HUD_EVENTS.audioToggle, { detail: { muted: this.muted } }),
    );
    this.announce(this.muted ? 'Áudio silenciado' : 'Áudio ativado');
  };

  private readonly onHelpClick = (): void => this.openDialog(this.helpDialog);
  private readonly onHelpClose = (): void => this.helpDialog.close();
  private readonly onBuildingClose = (): void => this.closeBuilding();
  private readonly restoreFocus = (): void => {
    this.lastFocusedElement?.focus();
    this.lastFocusedElement = null;
  };

  constructor() {
    window.addEventListener('keydown', this.onKeyDown);
    this.interactButton.addEventListener('click', this.onInteractClick);
    this.audioButton.addEventListener('click', this.onAudioClick);
    this.helpButton.addEventListener('click', this.onHelpClick);
    this.helpClose.addEventListener('click', this.onHelpClose);
    this.buildingClose.addEventListener('click', this.onBuildingClose);
    this.helpDialog.addEventListener('close', this.restoreFocus);
    this.buildingDialog.addEventListener('close', this.restoreFocus);
  }

  /** Update only the goal total without changing current discovery progress. */
  setTarget(target: number): void {
    const safeTarget = this.safeCount(target);
    this.lastTarget = -1;
    this.setDiscovery(this.safeCount(Number(this.scoreValue.textContent)), safeTarget);
  }

  /** Update the exploration progress shown in the quest ribbon. */
  setDiscovery(discovered: number, total: number): void {
    const safeTotal = this.safeCount(total);
    const safeDiscovered = Math.min(this.safeCount(discovered), safeTotal || Number.POSITIVE_INFINITY);
    if (safeDiscovered === this.lastDiscovery && safeTotal === this.lastTarget) return;

    const percentage = safeTotal > 0 ? Math.min(100, (safeDiscovered / safeTotal) * 100) : 0;

    this.scoreValue.textContent = String(safeDiscovered);
    this.targetValue.textContent = String(safeTotal);
    this.questProgressFill.style.width = `${percentage}%`;
    this.lastDiscovery = safeDiscovered;
    this.lastTarget = safeTotal;
    this.updateProgressAccessibility(safeDiscovered, safeTotal);
  }

  /** Change the current quest copy while keeping progress independent. */
  setObjective(objective: string): void {
    this.questTitle.textContent = objective.trim() || 'Explore a vila';
  }

  /** Update the bottom-left diegetic location plaque. */
  setLocation(location: string): void {
    this.locationValue.textContent = location.trim() || 'Arredores da vila';
  }

  /** Reflect the Tavern's current selection without owning agent state. */
  setActiveAgent(agent: HudAgent | null): void {
    const changed = agent?.id !== this.activeAgentId;
    this.activeAgentId = agent?.id ?? null;
    this.activeAgentBadge.hidden = agent === null;
    if (!agent) return;

    this.activeAgentSigil.textContent = agent.sigil;
    this.activeAgentName.textContent = agent.name;
    this.activeAgentRole.textContent = agent.role;
    if (changed) this.announce(`${agent.name} agora é seu agente ativo`);
  }

  /**
   * Show or hide the nearby-building prompt. Pass null as soon as the player
   * leaves interaction range.
   */
  setProximity(building: HudBuilding | null): void {
    this.nearbyBuilding = building;
    this.interactionPrompt.hidden = building === null;
    this.interactButton.toggleAttribute('data-available', building !== null);
    this.interactButton.setAttribute(
      'aria-label',
      building ? `Interagir com ${building.name}` : 'Interagir',
    );

    if (building) this.interactionName.textContent = building.name;
  }

  /** Open the parchment panel for a building supplied by the world. */
  openBuilding(building: HudBuilding = this.requireNearbyBuilding()): void {
    this.buildingIcon.textContent = building.icon || '◆';
    this.buildingName.textContent = building.name;
    this.buildingPurpose.textContent = building.purpose;
    this.buildingStatus.textContent = building.status || 'Em breve';
    this.openDialog(this.buildingDialog);
    this.announce(`${building.name}. ${building.purpose}`);
  }

  closeBuilding(): void {
    if (this.buildingDialog.open) this.buildingDialog.close();
  }

  /** Compatibility update for the current game loop; elapsed stays optional in the visual HUD. */
  update(score: number, target: number, elapsed: number, complete: boolean): void {
    this.setDiscovery(score, target);

    if (this.timerValue) {
      const safeElapsed = Number.isFinite(elapsed) ? Math.max(0, elapsed) : 0;
      const minutes = Math.floor(safeElapsed / 60).toString().padStart(2, '0');
      const seconds = Math.floor(safeElapsed % 60).toString().padStart(2, '0');
      this.timerValue.textContent = `${minutes}:${seconds}`;
    }

    const nextStatus = complete ? 'Exploração concluída' : 'Explore a vila';
    if (nextStatus !== this.lastStatus) {
      this.statusLine.textContent = nextStatus;
      this.lastStatus = nextStatus;
      if (complete) this.announce('Missão de exploração concluída');
    }
  }

  flashPickup(): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    this.questProgress.animate(
      [
        { filter: 'brightness(1)' },
        { filter: 'brightness(1.55)' },
        { filter: 'brightness(1)' },
      ],
      { duration: 260, easing: 'steps(4, end)' },
    );
  }

  /** Remove HUD-owned listeners when the game instance is torn down. */
  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.clearTimeout(this.announceTimer);
    this.interactButton.removeEventListener('click', this.onInteractClick);
    this.audioButton.removeEventListener('click', this.onAudioClick);
    this.helpButton.removeEventListener('click', this.onHelpClick);
    this.helpClose.removeEventListener('click', this.onHelpClose);
    this.buildingClose.removeEventListener('click', this.onBuildingClose);
    this.helpDialog.removeEventListener('close', this.restoreFocus);
    this.buildingDialog.removeEventListener('close', this.restoreFocus);
  }

  private requestInteraction(): void {
    window.dispatchEvent(
      new CustomEvent<HudInteractDetail>(HUD_EVENTS.interact, {
        detail: { building: this.nearbyBuilding },
      }),
    );

    if (!this.nearbyBuilding) this.announce('Nenhum local próximo para interagir');
  }

  private openDialog(dialog: HTMLDialogElement): void {
    if (dialog.open) return;
    this.lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.showModal();
  }

  private anyDialogOpen(): boolean {
    return document.querySelector('dialog[open]') !== null;
  }

  private requireNearbyBuilding(): HudBuilding {
    if (!this.nearbyBuilding) {
      throw new Error('Cannot open a building panel without building data.');
    }
    return this.nearbyBuilding;
  }

  private updateProgressAccessibility(discovered: number, total: number): void {
    this.questProgress.setAttribute('aria-valuemax', String(total));
    this.questProgress.setAttribute('aria-valuenow', String(discovered));
    this.questProgress.setAttribute('aria-valuetext', `${discovered} de ${total} locais descobertos`);
    this.questProgress.closest('.quest-ribbon')
      ?.querySelector('.quest-counter')
      ?.setAttribute('aria-label', `${discovered} de ${total} locais descobertos`);
  }

  private announce(message: string): void {
    window.clearTimeout(this.announceTimer);
    this.announcer.textContent = '';
    this.announceTimer = window.setTimeout(() => {
      this.announcer.textContent = message;
    }, 40);
  }

  private safeCount(value: number): number {
    return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  }

  private getElement(selector: string): HTMLElement;
  private getElement(selector: string, required: true): HTMLElement;
  private getElement(selector: string, required: false): HTMLElement | null;
  private getElement(selector: string, required = true): HTMLElement | null {
    const element = document.querySelector<HTMLElement>(selector);
    if (!element && required) throw new Error(`Missing HUD element: ${selector}`);
    return element;
  }

  private getButton(selector: string): HTMLButtonElement {
    const element = document.querySelector<HTMLButtonElement>(selector);
    if (!element) throw new Error(`Missing HUD button: ${selector}`);
    return element;
  }

  private getDialog(selector: string): HTMLDialogElement {
    const element = document.querySelector<HTMLDialogElement>(selector);
    if (!element) throw new Error(`Missing HUD dialog: ${selector}`);
    return element;
  }
}
