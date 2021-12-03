export const firstClickText = 'Click here to enable analog mouse control';
export const secondClickText = 'Click again to enable';

export function createClickElement(isMinimized = false) {
  const clickElement = document.createElement('div');
  clickElement.id = 'click-to-enable-mouse-xmc';
  const minimize = document.createElement('div');
  minimize.className = 'minimize-btn';
  minimize.innerText = isMinimized ? '+' : '-';
  const text = document.createElement('span');
  text.innerText = firstClickText;
  if (isMinimized) {
    clickElement.className = 'minimized';
  }
  clickElement.appendChild(text);
  clickElement.appendChild(minimize);
  minimize.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    if (clickElement.className === 'minimized') {
      clickElement.className = '';
      minimize.innerText = '-';
    } else {
      clickElement.className = 'minimized';
      minimize.innerText = '+';
    }
  });
  return { clickElement, text };
}
