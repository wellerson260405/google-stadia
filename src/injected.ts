import { disableConfig, enableConfig } from './browser/browserEventProcessor';
import { showToast } from './browser/dom/snackbar';
import { renderToolbar } from './browser/dom/toolbar';
import { modifyGamepadGlobals, isEnabled as gamepadSimulatorIsEnabled } from './browser/gamepadSimulator';
import { actions, store } from './browser/state';
import { gameChanged, intializedMsg, Message, MessageTypes } from './shared/messages';
import { GamepadConfig } from './shared/types';

/*
 * This script is injected and run inside the browser page itself and thus
 * has no "isolated world" or sandboxing.
 * It uses window.postMessage to communicate with the content_script.
 */

modifyGamepadGlobals();

let interval: ReturnType<typeof setInterval>;

function postMessageToWindow(msg: any) {
  window.postMessage({ ...msg, source: 'xcloud-page' });
}

function getXboxGameInfo(): { gameName: string; gameId: string } | null {
  // e.g. "Halo Infinite | Xbox Cloud Gaming (Beta) on Xbox.com"
  // Page URL: https://www.xbox.com/en-US/play/launch/fortnite/BT5P2X999VH2
  const inGameUrlRegex = /https:\/\/(www.)?xbox.com\/[\w-]+\/launch\/[\w-]+\/([A-Z0-9]+)/;
  const matches = window.location.href.match(inGameUrlRegex);
  if (matches && matches[1]) {
    const gameId = matches[1];
    const titleSplit = document.title.split(/\s+\|/);
    if (titleSplit.length === 2) {
      const gameName = titleSplit[0];
      return {
        gameName,
        gameId,
      };
    }
  }
  return null;
}

function checkIfInGame() {
  // Headings only shown when there are errors or need sign in
  const isXbox = window.location.href.indexOf('xbox.com') !== -1;
  const { gameName, gameId } = getXboxGameInfo() || { gameName: null, gameId: null };
  let isInGame = !isXbox;
  if (isXbox) {
    // const h1 = document.querySelector('h1');
    // const closeBtn = document.querySelector("[data-id='ui-container'] [aria-label='Close']");
    // const streamDiv = document.getElementById('game-stream');
    // isInGame = !h1 && !closeBtn && !!streamDiv;
    isInGame = true;
  }
  return {
    isInGame,
    isXbox,
    gameName,
    gameId,
  };
}

function handleDisableVirtualGamepad() {
  // Disable the fake gamepad and let them use their real gamepad
  if (gamepadSimulatorIsEnabled()) {
    showToast('Mouse/keyboard disabled');
  }
  disableConfig();
  store.dispatch(actions.updatePreset({ presetName: null, preset: null }));
}

function handleGamepadConfigUpdate(name: string, config: GamepadConfig) {
  showToast(`'${name}' preset activated`);
  enableConfig(config);
  store.dispatch(actions.updatePreset({ presetName: name, preset: config }));
}

function connectToExtension(gameName: string | null) {
  // Setting up connection to content script via postMessage
  postMessageToWindow(intializedMsg(gameName));

  window.addEventListener('message', (event) => {
    if (event.source != window || event.data.source !== 'xcloud-keyboard-mouse-content-script') {
      // We only accept messages from ourselves
      return;
    }
    const msg: Message = event.data;
    // Got message from extension
    if (msg.type === MessageTypes.ACTIVATE_GAMEPAD_CONFIG) {
      handleGamepadConfigUpdate(msg.name, msg.gamepadConfig);
    } else if (msg.type === MessageTypes.DISABLE_GAMEPAD) {
      handleDisableVirtualGamepad();
    }
  });

  // Periodically check if user leaves the game
  clearInterval(interval);
  interval = setInterval(() => {
    const { isInGame } = checkIfInGame();
    if (!isInGame) {
      clearInterval(interval);
      // The user is no longer playing a game, so disable the virtual gamepad
      handleDisableVirtualGamepad();
      postMessageToWindow(gameChanged(null));
      // Begin listening again for a game to start
      waitForActiveGame();
    }
  }, 1000);
}

function waitForActiveGame() {
  // Periodically check if user enters a game
  clearInterval(interval);
  interval = setInterval(() => {
    const { isInGame, gameName } = checkIfInGame();
    if (isInGame) {
      clearInterval(interval);
      connectToExtension(gameName);
    }
  }, 1000);
}

function bootstrap() {
  renderToolbar();
  waitForActiveGame();
}

// We need to use 'pageshow' here instead of 'load' because the 'load' event
// doesn't always trigger if the page is cached (e.g. pressing the back button)
window.addEventListener('pageshow', bootstrap, false);
// Not sure yet if this is needed:
// win.addEventListener('popstate', onLoad, false);
