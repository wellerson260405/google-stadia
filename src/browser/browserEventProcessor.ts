import { CodeMap, DEFAULT_SENSITIVITY, isButtonMapping, processGamepadConfig } from '../shared/gamepadConfig';
import {
  enableSimulator,
  simulateAxeDirPress,
  simulateAxeDirUnpress,
  simulateAxeMove,
  simulateBtnPress,
  simulateBtnUnpress,
} from './gamepadSimulator';
import { Direction, GamepadConfig, StickNum } from '../shared/types';
import { actions, store } from './state';

const listeners = {
  keydown: null as null | EventListener,
  keyup: null as null | EventListener,
  pointerlockchange: null as null | EventListener,
  mousemove: null as null | EventListener,
  mousedown: null as null | EventListener,
  mouseup: null as null | EventListener,
  wheel: null as null | EventListener,
};

const getParentElement = () => {
  return document.querySelector("[data-active='ui-container']") || document.body;
};

const mouseLockError = () => {
  store.dispatch(actions.setListening('error'));
};

function listenMouseMove(axe: StickNum = 1, sensitivity = DEFAULT_SENSITIVITY) {
  let stopMovingTimer: any;
  let needRaf = true; // used for requestAnimationFrame to only trigger at 60fps
  let movementX = 0;
  let movementY = 0;
  const handleMouseMove = () => {
    needRaf = true;
    clearTimeout(stopMovingTimer);
    stopMovingTimer = setTimeout(() => {
      simulateAxeMove(axe, 0, 0);
    }, 50);
    // trigger the joystick on move
    const clampedX = movementX === 0 ? 0 : Math.max(Math.min(movementX / sensitivity, 1), -1);
    const clampedY = movementY === 0 ? 0 : Math.max(Math.min(movementY / sensitivity, 1), -1);
    movementX = 0;
    movementY = 0;
    simulateAxeMove(axe, clampedX, clampedY);
  };
  listeners.mousemove = function onMouseMove(e: Event) {
    const { movementX: mx, movementY: my } = e as PointerEvent;
    movementX += mx;
    movementY += my;
    if (needRaf) {
      needRaf = false;
      // Queue processing
      setTimeout(handleMouseMove, 40); // 16 ms = 60 fps, 32 ms = 30 fps
    }
  };
  listeners.pointerlockchange = function onPointerLockChange() {
    if (!listeners.mousemove) return;
    if (document.pointerLockElement) {
      store.dispatch(actions.setListening('listening'));
      document.addEventListener('mousemove', listeners.mousemove);
    } else {
      clearTimeout(stopMovingTimer);
      document.removeEventListener('mousemove', listeners.mousemove);
      // show click element again
      store.dispatch(actions.setListening('not-listening'));
    }
  };
  document.addEventListener('pointerlockchange', listeners.pointerlockchange);
  document.addEventListener('pointerlockerror', mouseLockError);
  store.dispatch(actions.setListening('not-listening'));
}

function listenKeyboard(codeMapping: Record<string, CodeMap>) {
  let stopScrollTimer: any;
  const handleKeyEvent = (
    code: string,
    buttonFn: (index: number) => void,
    axisFn: (axis: number, dir: Direction) => void,
  ) => {
    const mapping = codeMapping[code];
    if (mapping) {
      if (isButtonMapping(mapping)) {
        const { gamepadIndex } = mapping;
        buttonFn(gamepadIndex);
      } else {
        const { axisIndex, axisDirection } = mapping;
        axisFn(axisIndex, axisDirection);
      }
      return true;
    }
    return false;
  };

  listeners.keydown = function keyDown(e) {
    const event = e as KeyboardEvent;
    if (event.repeat) return;
    const handled = handleKeyEvent(event.code, simulateBtnPress, simulateAxeDirPress);
    if (handled && e.cancelable) e.preventDefault();
  };
  listeners.keyup = function keyUp(e) {
    handleKeyEvent((e as KeyboardEvent).code, simulateBtnUnpress, simulateAxeDirUnpress);
  };
  document.addEventListener('keydown', listeners.keydown);
  document.addEventListener('keyup', listeners.keyup);
  if (codeMapping.Click || codeMapping.RightClick) {
    const parentElement = getParentElement();
    listeners.mousedown = function mouseDown(e) {
      const { button } = e as MouseEvent;
      if (button === 0 && codeMapping.Click) {
        handleKeyEvent('Click', simulateBtnPress, simulateAxeDirPress);
      } else if (button === 2 && codeMapping.RightClick) {
        handleKeyEvent('RightClick', simulateBtnPress, simulateAxeDirPress);
      }
    };
    listeners.mouseup = function mouseUp(e) {
      const { button } = e as MouseEvent;
      if (button === 0 && codeMapping.Click) {
        handleKeyEvent('Click', simulateBtnUnpress, simulateAxeDirUnpress);
      } else if (button === 2 && codeMapping.RightClick) {
        handleKeyEvent('RightClick', simulateBtnUnpress, simulateAxeDirUnpress);
      }
    };
    parentElement.addEventListener('mousedown', listeners.mousedown);
    parentElement.addEventListener('mouseup', listeners.mouseup);
  }
  if (codeMapping.Scroll) {
    const parentElement = getParentElement();
    listeners.wheel = function wheel(e) {
      const handled = handleKeyEvent('Scroll', simulateBtnPress, simulateAxeDirPress);
      if (handled) {
        if (e.cancelable) e.preventDefault();
        clearTimeout(stopScrollTimer);
        stopScrollTimer = setTimeout(() => {
          handleKeyEvent('Scroll', simulateBtnUnpress, simulateAxeDirUnpress);
        }, 20);
      }
    };
    parentElement.addEventListener('wheel', listeners.wheel);
  }
}

function unlistenKeyboard() {
  if (listeners.keydown) {
    document.removeEventListener('keydown', listeners.keydown);
  }
  if (listeners.keyup) {
    document.removeEventListener('keyup', listeners.keyup);
  }
  const parentElement = getParentElement();
  if (listeners.mousedown) {
    parentElement.removeEventListener('mousedown', listeners.mousedown);
  }
  if (listeners.mouseup) {
    parentElement.removeEventListener('mouseup', listeners.mouseup);
  }
  if (listeners.wheel) {
    parentElement.removeEventListener('wheel', listeners.wheel);
  }
}

function unlistenMouseMove() {
  document.exitPointerLock();
  store.dispatch(actions.setListening('not-listening'));
}

function unlistenAll() {
  unlistenKeyboard();
  unlistenMouseMove();
}

export function mouseTriggerListener(e: MouseEvent) {
  // Note: make sure the game stream is still in focus or the game will pause input!
  e.preventDefault(); // prevent bluring when clicked
  const req: any = getParentElement().requestPointerLock();
  // This shouldn't be needed now with above preventDefault, but just to be safe...
  const doFocus = () => {
    const streamDiv = document.getElementById('game-stream');
    streamDiv?.focus();
  };
  if (req) {
    // Chrome returns a Promise here
    req.then(doFocus).catch(mouseLockError);
  } else {
    doFocus();
  }
}

export function enableConfig(config: GamepadConfig) {
  const { mouseConfig, keyConfig } = config;
  const { codeMapping, invalidButtons, hasErrors } = processGamepadConfig(keyConfig);
  if (hasErrors) {
    // This should have been handled in the Popup UI, but just in case, we print error
    // and still proceed with the part of the config that is valid
    console.error('Invalid button mappings in gamepad config object', invalidButtons);
  }
  unlistenAll();
  listenKeyboard(codeMapping);
  if (mouseConfig.mouseControls !== undefined) {
    listenMouseMove(mouseConfig.mouseControls, mouseConfig.sensitivity);
  }
  enableSimulator(true);
}

export function disableConfig() {
  unlistenAll();
  enableSimulator(false);
}
