import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type HighlightStyle = 'glow' | 'solid' | 'underline';
export type AlgorithmVariant = 'iterative' | 'recursive';

export interface AppSettings {
  arraySize: number;
  minValue: number;
  maxValue: number;
  stepDelay: number;
  autoPlay: boolean;
  loopOnComplete: boolean;
  showIndices: boolean;
  showBounds: boolean;
  showMidShadow: boolean;
  highlightStyle: HighlightStyle;
  variant: AlgorithmVariant;
  easeMotion: boolean;
  theme: ThemeMode;
  seed: number;
  peekNextStep: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  arraySize: 12,
  minValue: 2,
  maxValue: 90,
  stepDelay: 650,
  autoPlay: true,
  loopOnComplete: false,
  showIndices: true,
  showBounds: true,
  showMidShadow: true,
  highlightStyle: 'glow',
  variant: 'iterative',
  easeMotion: false,
  theme: 'system',
  seed: 9473,
  peekNextStep: true,
};

interface SettingsContextValue {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => void;
  resetSettings: () => void;
}

const STORAGE_KEY = 'binary-search-playground:v1';

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

const loadStoredSettings = (): AppSettings | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as AppSettings;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
    };
  } catch (error) {
    console.warn('Unable to load stored settings', error);
    return null;
  }
};

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const stored = loadStoredSettings();
    return stored ?? DEFAULT_SETTINGS;
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = (mode: ThemeMode) => {
      const shouldUseDark =
        mode === 'dark' || (mode === 'system' && mediaQuery.matches);

      root.classList.toggle('dark', shouldUseDark);
      root.dataset.theme = shouldUseDark ? 'dark' : 'light';
    };

    applyTheme(settings.theme);

    if (settings.theme !== 'system') {
      return;
    }

    const listener = (event: MediaQueryListEvent) => {
      if (settings.theme === 'system') {
        applyTheme(event.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [settings.theme]);

  const updateSetting: SettingsContextValue['updateSetting'] = useCallback(
    (key, value) => {
      setSettings((prev) => {
        const next = { ...prev, [key]: value } as AppSettings;

        if (key === 'arraySize') {
          next.arraySize = Math.min(36, Math.max(4, Number(value)));
        }

        if (key === 'minValue') {
          const newMin = Math.min(Number(value), next.maxValue - 2);
          next.minValue = newMin;
        }

        if (key === 'maxValue') {
          const newMax = Math.max(Number(value), next.minValue + 2);
          next.maxValue = newMax;
        }

        if (key === 'stepDelay') {
          next.stepDelay = Math.min(2000, Math.max(120, Number(value)));
        }

        if (key === 'seed') {
          const sanitized = Math.abs(Math.floor(Number(value))) % 100000;
          next.seed = sanitized;
        }

        return next;
      });
    },
    []
  );

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  const value = useMemo<SettingsContextValue>(
    () => ({ settings, updateSetting, resetSettings }),
    [settings, updateSetting, resetSettings]
  );

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return ctx;
};

export const useDefaultSettings = () => DEFAULT_SETTINGS;
