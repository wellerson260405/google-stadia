import { TooltipHost } from '@fluentui/react';
import classnames from 'classnames';
import React, { useCallback, MouseEvent } from 'react';
import { getInjectedImagePaths } from '../../shared/pageInjectUtils';
import { mouseTriggerListener } from '../browserEventProcessor';
import { MouseState } from '../state';

export const firstClickText = 'Click here to enable mouse control';
export const secondClickText = 'Click again to enable mouse';

interface MouseEnableTargetProps extends MouseState {
  isExpanded?: boolean;
}

function MouseEnableTarget({ status, isExpanded }: MouseEnableTargetProps) {
  const mouseText = status === 'error' ? secondClickText : firstClickText;
  const imgPaths = getInjectedImagePaths();
  const mouseImgSrc = imgPaths['mouse.svg'];

  const expandedStyle = { height: '1.5em', paddingRight: '15px' };

  const handleMouseDown = useCallback((e: MouseEvent) => {
    mouseTriggerListener(e.nativeEvent);
  }, []);

  return isExpanded && status === 'listening' ? null : (
    <TooltipHost content={mouseText} id="enable-mouse-tooltip">
      <div
        id="click-to-enable-mouse-xmnk"
        className={classnames(isExpanded && 'expanded-xmnk', 'left-xmnk')}
        onMouseDown={status !== 'listening' ? handleMouseDown : undefined}
      >
        <img src={mouseImgSrc} style={isExpanded ? expandedStyle : undefined} />
        {isExpanded ? <span>{mouseText}</span> : null}
      </div>
    </TooltipHost>
  );
}

export default MouseEnableTarget;
