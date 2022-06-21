import React, { useCallback, MouseEvent } from 'react';
import { useSelector } from 'react-redux';
import { mouseTriggerListener } from '../browserEventProcessor';
import { selectors } from '../state';

export const firstClickText = 'Click here to enable analog mouse control';
export const secondClickText = 'Click again to enable';

export default function Toolbar() {
  const mouse = useSelector(selectors.selectMouse);
  const preset = useSelector(selectors.selectPreset);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    mouseTriggerListener(e.nativeEvent);
  }, []);

  // (preset)
  // mouse clicker
  // (more -> shows full list + how to)
  return (
    <div>
      <div>Hi from toolbar!</div>
      <div>preset name: {preset.presetName}</div>
      {mouse.status === 'listening' || preset.preset?.mouseConfig.mouseControls === undefined ? null : (
        <div id="click-to-enable-mouse-xmnk" onMouseDown={handleMouseDown}>
          <span>{mouse.status === 'error' ? secondClickText : firstClickText}</span>
        </div>
      )}
    </div>
  );
}
