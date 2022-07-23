import classnames from 'classnames';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import KeybindingsTable from '../../internal/components/KeybindingsTable';
import { getInjectedImagePaths } from '../../shared/pageInjectUtils';
import { selectors } from '../state';
import MouseEnableTarget from './MouseEnableTarget';

function KeyboardOnlyIcon() {
  return <img className="left-xmnk" style={{ opacity: 0.5 }} src={getInjectedImagePaths()['keyboard.svg']} />;
}

export default function Toolbar() {
  const [size, setSize] = useState<0 | 1 | 2>(2); // TODO use redux and chrome prefs
  const mouse = useSelector(selectors.selectMouse);
  const preset = useSelector(selectors.selectPreset);

  const increaseSize = () => setSize(size < 2 ? ((size + 1) as any) : size);
  const decreaseSize = () => setSize(size > 0 ? ((size - 1) as any) : size);

  const presetHasMouseControls = preset.preset?.mouseConfig.mouseControls !== undefined;

  return (
    <div className={classnames(mouse.status === 'listening' && 'mouse-listening-xmnk')}>
      <div className={classnames('header-xmnk', `header-xmnk-size-${size}`)}>
        {size !== 2 && (presetHasMouseControls ? <MouseEnableTarget {...mouse} /> : <KeyboardOnlyIcon />)}
        {size !== 0 && <div className="preset-name-xmnk">{preset.presetName}</div>}
        <div className="size-buttons-xmnk">
          {size !== 2 && (
            <button onClick={increaseSize} title="Show more">
              +
            </button>
          )}
          {size !== 0 && (
            <button onClick={decreaseSize} title="Show less">
              -
            </button>
          )}
        </div>
      </div>

      {size === 2 && (
        <div
          className="keybindings-xmnk"
          style={!presetHasMouseControls || mouse.status === 'listening' ? { borderBottom: 'none' } : undefined}
        >
          <KeybindingsTable hideMissing gamepadConfig={preset.preset} />
          <div className="explanation-xmnk">To edit bindings use the toolbar button for the extension.</div>
        </div>
      )}

      {size === 2 && presetHasMouseControls && <MouseEnableTarget isExpanded {...mouse} />}
    </div>
  );
}
