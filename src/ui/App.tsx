import { useEffect } from 'react';
import { useT } from '../i18n/useT';
import { setupServiceWorker } from '../pwa/registerSW';
import { useAppStore } from '../store/useAppStore';
import { MainScreen } from './MainScreen';
import { SelectScreen } from './SelectScreen';

export function App() {
  const { locale } = useT();
  const hasPet = useAppStore((s) => s.game.pet !== null);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => setupServiceWorker(), []);

  return hasPet ? <MainScreen /> : <SelectScreen />;
}
