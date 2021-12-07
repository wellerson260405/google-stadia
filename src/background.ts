import { getAllStoredSync, storeActiveGamepadConfig, updateGameName } from './internal/state/chromeStoredData';
import { disableActionButton, enableActionButton } from './internal/utils/actionButtonUtils';
import { getActiveTab } from './internal/utils/tabsUtils';
import { DEFAULT_CONFIG_NAME } from './shared/gamepadConfig';
import { MessageTypes, activateGamepadConfigMsg, Message } from './shared/messages';

/*
 * This script is run as a service worker and may be killed or restarted at any time.
 * Make sure to read the following for more information:
 * https://developer.chrome.com/docs/extensions/mv3/migrating_to_service_workers/
 */

chrome.runtime.onInstalled.addListener(({ reason }) => {
  // Page actions are disabled by default and enabled on select tabs
  disableActionButton();
  if (reason === 'install') {
    // First time install - enable the default gamepad config
    storeActiveGamepadConfig(DEFAULT_CONFIG_NAME);
  }
  if (typeof chrome.runtime.setUninstallURL === 'function') {
    chrome.runtime.setUninstallURL('https://forms.gle/nzToDcw1mmssMBLx6');
  }
});

chrome.runtime.onMessage.addListener((msg: Message, sender, sendResponse) => {
  // Receives messages from the content_script
  if (!sender.tab) return false;
  console.log('Connected');
  if (msg.type === MessageTypes.INJECTED) {
    console.log('Injected');
    enableActionButton(sender.tab.id);
  } else if (msg.type === MessageTypes.INITIALIZED) {
    console.log('Initialized');
    updateGameName(msg.gameName);
    // Send any currently-active config
    getAllStoredSync().then(({ activeConfig, configs }) => {
      const config = !activeConfig ? null : configs[activeConfig];
      sendResponse(activateGamepadConfigMsg(activeConfig, config));
    });
    return true;
  }
  return false;
});

// Listen for any internal messages (e.g. from popup) and proxy to the content_script.
chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener(async (msg: Message) => {
    const tab = await getActiveTab();
    if (tab) {
      chrome.tabs.sendMessage(tab.id!, msg);
    }
  });
});
