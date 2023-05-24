import { lazy } from 'react';
import isElectron from 'is-electron';
import styled from 'styled-components';
import {
  useWindowSettings,
  useSettingsStore,
  useHotkeySettings,
} from '/@/renderer/store/settings.store';
import { Platform, PlaybackType } from '/@/renderer/types';
import { MainContent } from '/@/renderer/layouts/default-layout/main-content';
import { PlayerBar } from '/@/renderer/layouts/default-layout/player-bar';
import { useHotkeys } from '@mantine/hooks';
import { CommandPalette } from '/@/renderer/features/search/components/command-palette';
import { useCommandPalette } from '/@/renderer/store';

if (!isElectron()) {
  useSettingsStore.getState().actions.setSettings({
    playback: {
      ...useSettingsStore.getState().playback,
      type: PlaybackType.WEB,
    },
  });
}

const Layout = styled.div<{ windowBarStyle: Platform }>`
  display: grid;
  grid-template-areas:
    'window-bar'
    'main-content'
    'player';
  grid-template-rows: ${(props) =>
    props.windowBarStyle === Platform.WINDOWS || props.windowBarStyle === Platform.MACOS
      ? '30px calc(100vh - 120px) 90px'
      : '0px calc(100vh - 90px) 90px'};
  grid-template-columns: 1fr;
  gap: 0;
  height: 100%;
`;

const WindowBar = lazy(() =>
  import('/@/renderer/layouts/window-bar').then((module) => ({
    default: module.WindowBar,
  })),
);

interface DefaultLayoutProps {
  shell?: boolean;
}

export const DefaultLayout = ({ shell }: DefaultLayoutProps) => {
  const { windowBarStyle } = useWindowSettings();
  const { opened, ...handlers } = useCommandPalette();
  const { bindings } = useHotkeySettings();

  useHotkeys([[bindings.globalSearch.hotkey, () => handlers.open()]]);

  return (
    <>
      <Layout
        id="default-layout"
        windowBarStyle={windowBarStyle}
      >
        {windowBarStyle !== Platform.WEB && <WindowBar />}
        <MainContent shell={shell} />
        <PlayerBar />
      </Layout>
      <CommandPalette modalProps={{ handlers, opened }} />
    </>
  );
};

DefaultLayout.defaultProps = {
  shell: false,
};
