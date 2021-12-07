import { IconButton, IContextualMenuItem } from '@fluentui/react';
import React from 'react';
import { fluentXboxTheme } from './theme';

const menuItems: IContextualMenuItem[] = [
  {
    key: 'version',
    text: `Version ${chrome.runtime.getManifest().version}`,
    disabled: true,
  },
  {
    key: 'about',
    text: 'About',
    href: chrome.runtime.getURL('/about.html'),
    target: '_blank',
    iconProps: { iconName: 'InfoSolid' },
  },
  {
    key: 'issues',
    text: 'File an issue',
    href: 'https://github.com/idolize/xcloud-keyboard-mouse/issues',
    target: '_blank',
    iconProps: { iconName: 'IssueTracking' },
  },
  {
    key: 'testGamepad',
    text: 'Test your preset',
    href: 'https://gamepad-tester.com',
    target: '_blank',
    iconProps: { iconName: 'TestBeakerSolid' },
  },
  {
    key: 'xcloud',
    text: 'Go to xCloud',
    href: 'https://xbox.com/play',
    target: '_blank',
    iconProps: { iconName: 'Cloud' },
  },
];

export default function HeaderMoreOptions() {
  return (
    <IconButton
      menuProps={{
        items: menuItems,
        theme: fluentXboxTheme,
        calloutProps: {
          // Needed to fix issue in Safari
          preventDismissOnEvent: (e) => e.type === 'resize',
        },
      }}
      role="menuitem"
      title="More options"
    />
  );
}
