import React, { useCallback } from 'react';
import { Toggle, IToggleProps, ThemeProvider } from '@fluentui/react';
import { useAppDispatch } from './hooks/reduxHooks';
import { activateGamepadConfigAction, disableGamepadConfigAction } from '../state/actions';
import { fluentXboxHeaderTheme } from './theme';
import Logo from './Logo';
import HeaderMoreOptions from './HeaderMoreOptions';

interface HeaderProps {
  gameName: string | null;
  isEnabled: boolean;
  activeConfig: string;
}

export default function Header({ gameName, activeConfig, isEnabled }: HeaderProps) {
  const dispatch = useAppDispatch();
  const handleToggle: IToggleProps['onChange'] = useCallback(
    (event, checked) => {
      if (!checked) {
        dispatch(disableGamepadConfigAction());
      } else {
        dispatch(activateGamepadConfigAction({ name: activeConfig }));
      }
    },
    [dispatch, activeConfig],
  );

  return (
    <ThemeProvider theme={fluentXboxHeaderTheme}>
      <header className="box horizontal green-bg space-between setup-details">
        <div className="logo unselectable horizontal centered-v">
          <Logo isEnabled={isEnabled} />
          <Toggle
            title={`${isEnabled ? 'Disable' : 'Enable'} mouse and keyboard`}
            checked={isEnabled}
            onChange={handleToggle}
            className="no-margin margin-left"
          />
        </div>
        <div className="horizontal centered">
          <div className="vertical centered-v left-aligned margin-right">
            <div className="overflow-ellipsis">
              <small>Playing:</small> <span>{gameName || 'None'}</span>
            </div>
            <div className="overflow-ellipsis">
              <small>Preset:</small> <span>{activeConfig || 'None'}</span>
            </div>
          </div>
          <HeaderMoreOptions />
        </div>
      </header>
    </ThemeProvider>
  );
}
