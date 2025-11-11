import { FormEvent, useMemo } from 'react';
import {
  HighlightStyle,
  ThemeMode,
  useDefaultSettings,
  useSettings,
} from '../contexts/SettingsContext';
import { cn } from '../utils/cn';

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

const themeOptions: Array<{ label: string; value: ThemeMode }> = [
  { label: 'System', value: 'system' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
];

const highlightOptions: Array<{ label: string; value: HighlightStyle }> = [
  { label: 'Glow', value: 'glow' },
  { label: 'Solid fill', value: 'solid' },
  { label: 'Underline', value: 'underline' },
];

export const SettingsPanel = ({ open, onClose }: SettingsPanelProps) => {
  const { settings, updateSetting, resetSettings } = useSettings();
  const defaults = useDefaultSettings();

  const showPanel = open;

  const panelContent = useMemo(() => {
    if (!showPanel) {
      return null;
    }

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 py-8"
        role="dialog"
        aria-modal="true"
        onClick={onClose}
      >
        <div
          className="relative flex w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl transition-all dark:border-slate-700 dark:bg-slate-900"
          onClick={(event: FormEvent<HTMLDivElement>) => event.stopPropagation()}
        >
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
            <div>
              <h2 className="text-xl font-semibold">Settings</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Tune the binary search playground to match your learning style.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-transparent px-3 py-1 text-sm font-medium text-slate-500 transition hover:border-slate-200 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-light focus:ring-offset-2 dark:hover:border-slate-600 dark:hover:text-slate-300"
            >
              Close
            </button>
          </header>

          <div className="scrollbar-thin space-y-8 overflow-y-auto px-6 py-6" style={{ maxHeight: '70vh' }}>
            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Data set
              </h3>
              <div className="grid gap-5 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm">
                  <span className="flex items-center justify-between font-medium text-slate-700 dark:text-slate-200">
                    Array size
                    <span className="text-xs font-semibold text-brand">{settings.arraySize}</span>
                  </span>
                  <input
                    type="range"
                    min={4}
                    max={36}
                    value={settings.arraySize}
                    onChange={(event) => updateSetting('arraySize', Number(event.target.value))}
                    className="accent-brand"
                  />
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Controls how many sorted values are displayed.
                  </span>
                </label>

                <label className="flex flex-col gap-2 text-sm">
                  <span className="flex items-center justify-between font-medium text-slate-700 dark:text-slate-200">
                    Number seed
                    <span className="text-xs font-semibold text-brand">#{settings.seed}</span>
                  </span>
                  <div className="flex gap-3">
                    <input
                      type="number"
                      value={settings.seed}
                      onChange={(event) => updateSetting('seed', Number(event.target.value))}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-brand focus:ring-1 focus:ring-brand dark:border-slate-600 dark:bg-slate-800 dark:focus:border-brand-light"
                    />
                    <button
                      type="button"
                      onClick={() => updateSetting('seed', Math.floor(Math.random() * 90000) + 1000)}
                      className="rounded-lg border border-brand/40 px-3 py-2 text-sm font-medium text-brand transition hover:border-brand hover:bg-brand/10"
                    >
                      Shuffle
                    </button>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Use the same seed to reproduce a sequence of numbers.
                  </span>
                </label>

                <label className="flex flex-col gap-2 text-sm">
                  <span className="flex items-center justify-between font-medium text-slate-700 dark:text-slate-200">
                    Minimum value
                    <span className="text-xs font-semibold text-brand">{settings.minValue}</span>
                  </span>
                  <input
                    type="range"
                    min={-10}
                    max={settings.maxValue - 2}
                    value={settings.minValue}
                    onChange={(event) => updateSetting('minValue', Number(event.target.value))}
                    className="accent-brand"
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm">
                  <span className="flex items-center justify-between font-medium text-slate-700 dark:text-slate-200">
                    Maximum value
                    <span className="text-xs font-semibold text-brand">{settings.maxValue}</span>
                  </span>
                  <input
                    type="range"
                    min={settings.minValue + 2}
                    max={160}
                    value={settings.maxValue}
                    onChange={(event) => updateSetting('maxValue', Number(event.target.value))}
                    className="accent-brand"
                  />
                </label>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Playback
              </h3>
              <div className="grid gap-5 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm">
                  <span className="flex items-center justify-between font-medium text-slate-700 dark:text-slate-200">
                    Step delay
                    <span className="text-xs font-semibold text-brand">{settings.stepDelay} ms</span>
                  </span>
                  <input
                    type="range"
                    min={120}
                    max={2000}
                    step={20}
                    value={settings.stepDelay}
                    onChange={(event) => updateSetting('stepDelay', Number(event.target.value))}
                    className="accent-brand"
                  />
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Controls the automatic playback speed.
                  </span>
                </label>

                <ToggleRow
                  label="Automatically play steps"
                  description="Start animations immediately whenever you search."
                  checked={settings.autoPlay}
                  onChange={(value) => updateSetting('autoPlay', value)}
                />

                <ToggleRow
                  label="Loop when finished"
                  description="Restart with a new target once the search completes."
                  checked={settings.loopOnComplete}
                  onChange={(value) => updateSetting('loopOnComplete', value)}
                />

                <ToggleRow
                  label="Peek next move"
                  description="Preview the upcoming low / high indices."
                  checked={settings.peekNextStep}
                  onChange={(value) => updateSetting('peekNextStep', value)}
                />

                <ToggleRow
                  label="Respect reduced motion"
                  description="Tone down transitions if animations are distracting."
                  checked={settings.easeMotion}
                  onChange={(value) => updateSetting('easeMotion', value)}
                />
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Visuals
              </h3>
              <div className="grid gap-5 md:grid-cols-2">
                <ToggleRow
                  label="Show index labels"
                  description="Display the index beneath each value."
                  checked={settings.showIndices}
                  onChange={(value) => updateSetting('showIndices', value)}
                />
                <ToggleRow
                  label="Highlight boundaries"
                  description="Keep the current low / high bounds highlighted."
                  checked={settings.showBounds}
                  onChange={(value) => updateSetting('showBounds', value)}
                />
                <ToggleRow
                  label="Midpoint glow"
                  description="Add a gentle aura to the inspected value."
                  checked={settings.showMidShadow}
                  onChange={(value) => updateSetting('showMidShadow', value)}
                />

                <div className="flex flex-col gap-2 text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-200">Highlight style</span>
                  <div className="flex flex-wrap gap-2">
                    {highlightOptions.map(({ label, value }) => {
                      const selected = settings.highlightStyle === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => updateSetting('highlightStyle', value)}
                          className={cn(
                            'rounded-full border px-4 py-1 text-sm font-medium transition',
                            selected
                              ? 'border-brand bg-brand text-white shadow-glow'
                              : 'border-slate-200 text-slate-600 hover:border-brand hover:text-brand dark:border-slate-600 dark:text-slate-300'
                          )}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Algorithm
              </h3>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="flex flex-col gap-3 text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-200">
                    Binary search flavor
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {['iterative', 'recursive'].map((variant) => {
                      const label = variant === 'iterative' ? 'Iterative' : 'Recursive';
                      const selected = settings.variant === variant;
                      return (
                        <button
                          key={variant}
                          type="button"
                          onClick={() => updateSetting('variant', variant as typeof settings.variant)}
                          className={cn(
                            'rounded-xl border px-4 py-2 text-sm font-medium transition',
                            selected
                              ? 'border-brand bg-brand/10 text-brand shadow-glow'
                              : 'border-slate-200 text-slate-600 hover:border-brand hover:text-brand dark:border-slate-600 dark:text-slate-300'
                          )}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-2 text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-200">Theme</span>
                  <div className="flex flex-wrap gap-2">
                    {themeOptions.map(({ label, value }) => {
                      const selected = settings.theme === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => updateSetting('theme', value)}
                          className={cn(
                            'rounded-full border px-4 py-1 text-sm font-medium transition',
                            selected
                              ? 'border-brand bg-brand text-white shadow-glow'
                              : 'border-slate-200 text-slate-600 hover:border-brand hover:text-brand dark:border-slate-600 dark:text-slate-300'
                          )}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          </div>

          <footer className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/80 p-6 text-sm dark:border-slate-700 dark:bg-slate-900/60 md:flex-row md:items-center md:justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your preferences are stored locally so the playground feels familiar every time.
            </p>
            <button
              type="button"
              onClick={resetSettings}
              className="self-start rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-brand hover:text-brand dark:border-slate-600 dark:text-slate-300"
            >
              Reset to defaults
            </button>
          </footer>
        </div>
      </div>
    );
  }, [onClose, resetSettings, settings, showPanel, updateSetting]);

  return panelContent;
};

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const ToggleRow = ({ label, description, checked, onChange }: ToggleRowProps) => {
  return (
    <label className="flex items-start justify-between gap-4 rounded-2xl border border-transparent bg-slate-100/50 p-4 transition hover:border-brand/40 hover:bg-brand/5 dark:bg-slate-800/60">
      <span>
        <span className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
          {label}
        </span>
        <span className="block text-xs text-slate-500 dark:text-slate-400">{description}</span>
      </span>
      <span className="inline-flex items-center">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span
          aria-hidden
          className={cn(
            'relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full border border-slate-200 bg-white transition-all duration-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand dark:border-slate-600 dark:bg-slate-700',
            checked && 'border-brand bg-brand'
          )}
        >
          <span
            className={cn(
              'absolute left-1 h-4 w-4 rounded-full bg-slate-400 transition-all duration-300',
              checked && 'left-6 bg-white'
            )}
          />
        </span>
      </span>
    </label>
  );
};
