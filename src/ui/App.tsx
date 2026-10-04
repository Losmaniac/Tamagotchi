import { useEffect } from 'react';
import { useT } from '../i18n/useT';
import { UpdateToast } from '../pwa/PwaBanners';
import { setupServiceWorker } from '../pwa/registerSW';
import { useFeedbackEffects } from './effects';
import { useAppStore } from '../store/useAppStore';
import { MainScreen } from './MainScreen';
import { SelectScreen } from './SelectScreen';

export function App() {
  const { locale } = useT();
  const hasPet = useAppStore((s) => s.game.pet !== null);
  useFeedbackEffects();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => setupServiceWorker(), []);

  return (
    <>
      {hasPet ? <MainScreen /> : <SelectScreen />}
      <UpdateToast />
    </>
  );
}
