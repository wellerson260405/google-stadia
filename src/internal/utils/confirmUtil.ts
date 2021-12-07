function isSafari() {
  // https://stackoverflow.com/a/23522755
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

export function confirm(message: string) {
  // TODO move to a react modal based approach?
  if (isSafari()) {
    // Safari does not support "confirm" inside a popup, so we default to assuming
    // the user allowed the action.
    return true;
  }
  return window.confirm(message);
}
