import { GamepadConfig } from './types';

export enum MessageTypes {
  INJECTED = 'INJECTED',
  INITIALIZED = 'INITIALIZED',
  GAME_CHANGED = 'GAME_CHANGED',
  ACTIVATE_GAMEPAD_CONFIG = 'ACTIVATE_GAMEPAD_CONFIG',
  DISABLE_GAMEPAD = 'DISABLE_GAMEPAD',
}

export type Message =
  | ReturnType<typeof injectedMsg>
  | ReturnType<typeof intializedMsg>
  | ReturnType<typeof gameChanged>
  | ReturnType<typeof activateGamepadConfigMsg>
  | ReturnType<typeof disableGamepadMsg>;

// Sent from page to background to enable the context button in the toolbar
export function injectedMsg() {
  return { type: MessageTypes.INJECTED as const };
}

// Sent from page to background to load all settings
export function intializedMsg(gameName: string | null) {
  return { type: MessageTypes.INITIALIZED as const, gameName };
}

// Sent from page to background to set game name manually
export function gameChanged(gameName: string | null) {
  return { type: MessageTypes.GAME_CHANGED as const, gameName };
}

// Sent from background to page to set active mouse+keyboard config (null for disabled)
export function activateGamepadConfigMsg(name: string | null, gamepadConfig: GamepadConfig | null) {
  if (!gamepadConfig || !name) {
    return disableGamepadMsg();
  }
  return { type: MessageTypes.ACTIVATE_GAMEPAD_CONFIG as const, name, gamepadConfig };
}

// Sent from background to page to disable mouse+keyboard
export function disableGamepadMsg() {
  return { type: MessageTypes.DISABLE_GAMEPAD as const };
}
