// Wrapped to support both manifest v2 and v3
// https://developer.chrome.com/docs/extensions/mv3/intro/mv3-migration/#action-api-unification

export function disableActionButton() {
  if (chrome.action !== undefined) {
    return chrome.action.disable();
  } else {
    return chrome.browserAction.disable();
  }
}

export function enableActionButton(tabId?: number) {
  if (chrome.action !== undefined) {
    return chrome.action.enable(tabId);
  } else {
    return chrome.browserAction.enable(tabId);
  }
}
