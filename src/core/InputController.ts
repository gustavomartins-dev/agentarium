import * as THREE from 'three';

type PointerState = {
  active: boolean;
  id: number | null;
  centerX: number;
  centerY: number;
  radius: number;
};

const DASH_KEYS = new Set(['Space', 'ShiftLeft', 'ShiftRight']);
const ACTION_KEYS = new Set(['KeyE', 'Enter', 'NumpadEnter']);
const GAMEPLAY_KEYS = new Set([
  'KeyW',
  'KeyA',
  'KeyS',
  'KeyD',
  'ArrowUp',
  'ArrowLeft',
  'ArrowDown',
  'ArrowRight',
  ...DASH_KEYS,
  ...ACTION_KEYS,
]);

/** Collects browser input and exposes game intents, not scene actions. */
export class InputController {
  private readonly keys = new Set<string>();
  private readonly pointer = new THREE.Vector2();
  private readonly keyVector = new THREE.Vector2();
  private readonly pointerState: PointerState = {
    active: false,
    id: null,
    centerX: 0,
    centerY: 0,
    radius: 1,
  };

  private actionPointerId: number | null = null;
  private actionPointerDown = false;
  private actionPressed = false;

  private readonly onKeyDown = (event: KeyboardEvent) => {
    if (!GAMEPLAY_KEYS.has(event.code) || this.isTypingTarget(event.target)) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;

    const wasDown = this.keys.has(event.code);
    this.keys.add(event.code);
    if (ACTION_KEYS.has(event.code) && !wasDown && !event.repeat) {
      this.actionPressed = true;
    }
    event.preventDefault();
  };

  private readonly onKeyUp = (event: KeyboardEvent) => {
    if (!GAMEPLAY_KEYS.has(event.code)) return;
    this.keys.delete(event.code);
    if (!this.isTypingTarget(event.target)) event.preventDefault();
  };

  private readonly onStickDown = (event: PointerEvent) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault();
    const rect = this.stick.getBoundingClientRect();
    this.pointerState.active = true;
    this.pointerState.id = event.pointerId;
    this.pointerState.centerX = rect.left + rect.width / 2;
    this.pointerState.centerY = rect.top + rect.height / 2;
    this.pointerState.radius = Math.max(rect.width * 0.42, 1);
    try {
      this.stick.setPointerCapture(event.pointerId);
    } catch {
      // Synthetic test events do not always have a capturable pointer id.
    }
    this.updatePointer(event.clientX, event.clientY);
  };

  private readonly onStickMove = (event: PointerEvent) => {
    if (!this.pointerState.active || event.pointerId !== this.pointerState.id) return;
    event.preventDefault();
    this.updatePointer(event.clientX, event.clientY);
  };

  private readonly onStickUp = (event: PointerEvent) => {
    if (event.pointerId !== this.pointerState.id) return;
    event.preventDefault();
    this.releaseStick();
  };

  // The existing #dash-button is intentionally the contextual action button.
  // Keyboard dash remains on Shift/Space.
  private readonly onActionDown = (event: PointerEvent) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault();
    this.actionButton.blur();
    if (!this.actionPointerDown) this.actionPressed = true;
    this.actionPointerDown = true;
    this.actionPointerId = event.pointerId;
    try {
      this.actionButton.setPointerCapture(event.pointerId);
    } catch {
      // Synthetic test events do not always have a capturable pointer id.
    }
  };

  private readonly onActionUp = (event: PointerEvent) => {
    if (this.actionPointerId !== null && event.pointerId !== this.actionPointerId) return;
    event.preventDefault();
    this.actionPointerDown = false;
    this.actionPointerId = null;
  };

  private readonly onWindowBlur = () => {
    this.clearTransientState();
  };

  private readonly onVisibilityChange = () => {
    if (document.hidden) this.clearTransientState();
  };

  constructor(
    private readonly stick: HTMLElement,
    private readonly knob: HTMLElement,
    private readonly actionButton: HTMLElement,
  ) {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onWindowBlur);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.stick.addEventListener('pointerdown', this.onStickDown);
    this.stick.addEventListener('pointermove', this.onStickMove);
    this.stick.addEventListener('pointerup', this.onStickUp);
    this.stick.addEventListener('pointercancel', this.onStickUp);
    this.stick.addEventListener('lostpointercapture', this.onStickUp);
    this.actionButton.addEventListener('pointerdown', this.onActionDown);
    this.actionButton.addEventListener('pointerup', this.onActionUp);
    this.actionButton.addEventListener('pointercancel', this.onActionUp);
    this.actionButton.addEventListener('lostpointercapture', this.onActionUp);
    this.actionButton.addEventListener('pointerleave', this.onActionUp);
  }

  readMovement(target: THREE.Vector2): THREE.Vector2 {
    this.keyVector.set(0, 0);
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) this.keyVector.x -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) this.keyVector.x += 1;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) this.keyVector.y -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) this.keyVector.y += 1;

    target.copy(this.keyVector).add(this.pointer);
    if (target.lengthSq() > 1) target.normalize();
    return target;
  }

  isDashHeld(): boolean {
    for (const code of DASH_KEYS) {
      if (this.keys.has(code)) return true;
    }
    return false;
  }

  isActionHeld(): boolean {
    if (this.actionPointerDown) return true;
    for (const code of ACTION_KEYS) {
      if (this.keys.has(code)) return true;
    }
    return false;
  }

  /** Returns true once for each E/Enter or action-button press. */
  consumeActionPressed(): boolean {
    const pressed = this.actionPressed;
    this.actionPressed = false;
    return pressed;
  }

  clearTransientState(): void {
    this.keys.clear();
    this.actionPointerDown = false;
    this.actionPointerId = null;
    this.actionPressed = false;
    this.releaseStick();
  }

  dispose(): void {
    this.clearTransientState();
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onWindowBlur);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.stick.removeEventListener('pointerdown', this.onStickDown);
    this.stick.removeEventListener('pointermove', this.onStickMove);
    this.stick.removeEventListener('pointerup', this.onStickUp);
    this.stick.removeEventListener('pointercancel', this.onStickUp);
    this.stick.removeEventListener('lostpointercapture', this.onStickUp);
    this.actionButton.removeEventListener('pointerdown', this.onActionDown);
    this.actionButton.removeEventListener('pointerup', this.onActionUp);
    this.actionButton.removeEventListener('pointercancel', this.onActionUp);
    this.actionButton.removeEventListener('lostpointercapture', this.onActionUp);
    this.actionButton.removeEventListener('pointerleave', this.onActionUp);
  }

  private updatePointer(clientX: number, clientY: number): void {
    const dx = clientX - this.pointerState.centerX;
    const dy = clientY - this.pointerState.centerY;
    this.pointer.set(dx / this.pointerState.radius, dy / this.pointerState.radius);
    if (this.pointer.lengthSq() > 1) this.pointer.normalize();
    this.updateKnob();
  }

  private releaseStick(): void {
    this.pointerState.active = false;
    this.pointerState.id = null;
    this.pointer.set(0, 0);
    this.updateKnob();
  }

  private updateKnob(): void {
    const distance = 38;
    this.knob.style.transform = `translate(calc(-50% + ${this.pointer.x * distance}px), calc(-50% + ${this.pointer.y * distance}px))`;
  }

  private isTypingTarget(target: EventTarget | null): boolean {
    if (!(target instanceof Element)) return false;
    return Boolean(target.closest('input, textarea, select, button, [contenteditable="true"]'));
  }
}
