import { createAsyncThunk } from '@reduxjs/toolkit';
import { GamepadConfig } from '../../shared/types';
import { DEFAULT_CONFIG_NAME } from '../../shared/gamepadConfig';
import { activateGamepadConfigMsg, disableGamepadMsg, Message } from '../../shared/messages';
import { getGamepadConfig, isConfigActive } from './selectors';
import { RootState } from './store';
import {
  deleteGamepadConfig,
  getAllStoredSync,
  getLocalGameStatus,
  storeActiveGamepadConfig,
  storeGamepadConfig,
  storeGamepadConfigEnabled,
} from './chromeStoredData';
import { getAllTabs } from '../utils/tabsUtils';

const sendMessage = async (msg: Message) => {
  const tabs = await getAllTabs();
  tabs.forEach((tab) => {
    chrome.tabs.sendMessage(tab.id!, msg, () => {
      // Ignore errors here since we blast message to all tabs, some of which may not have listeners
      // https://groups.google.com/a/chromium.org/g/chromium-extensions/c/Y5pYf1iv2k4?pli=1
      // eslint-disable-next-line no-unused-expressions
      chrome.runtime.lastError;
    });
  });
};

export const fetchGameStatusAction = createAsyncThunk('meta/gameStatus', getLocalGameStatus);

export const fetchAllAction = createAsyncThunk('config/fetchAll', getAllStoredSync);

async function _setActiveConfig(name: string, state: RootState) {
  const { config: gamepadConfig } = getGamepadConfig(state, name);
  if (!gamepadConfig) throw new Error('Missing gamepad config cache');
  await sendMessage(activateGamepadConfigMsg(name, gamepadConfig));
  await storeActiveGamepadConfig(name);
  return { name, gamepadConfig };
}

export const activateGamepadConfigAction = createAsyncThunk(
  'config/activate',
  ({ name }: { name: string }, { getState }) => _setActiveConfig(name, getState()),
);

export const disableGamepadConfigAction = createAsyncThunk('config/disable', async () => {
  await sendMessage(disableGamepadMsg());
  await storeGamepadConfigEnabled(false);
});

export const deleteGamepadConfigAction = createAsyncThunk(
  'config/delete',
  async ({ name }: { name: string }, { getState }) => {
    const promises: Promise<any>[] = [];
    if (isConfigActive(getState(), name)) {
      // We are deleting the active config, so activate default instead
      promises.push(_setActiveConfig(DEFAULT_CONFIG_NAME, getState()));
    }
    await Promise.all([...promises, deleteGamepadConfig(name)]);
    return { name };
  },
);

export const modifyGamepadConfigAction = createAsyncThunk(
  'config/modify',
  async ({ name, gamepadConfig }: { name: string; gamepadConfig: GamepadConfig }, { getState }) => {
    if (isConfigActive(getState(), name)) {
      // Update the active config on page
      await sendMessage(activateGamepadConfigMsg(name, gamepadConfig));
    }
    await storeGamepadConfig(name, gamepadConfig);
    return { name, gamepadConfig };
  },
);
