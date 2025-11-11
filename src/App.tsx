import { useEffect, useState } from 'react';
import { BinarySearchVisualizer } from './components/BinarySearchVisualizer';
import { SettingsPanel } from './components/SettingsPanel';
import { SettingsToggle } from './components/SettingsToggle';
import { SettingsProvider } from './contexts/SettingsContext';
import { cn } from './utils/cn';

const AppShell = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const original = document.body.style.overflow;
    if (isSettingsOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = original;
    }
    return () => {
      document.body.style.overflow = original;
    };
  }, [isSettingsOpen]);

  return (
    <div className="relative min-h-screen bg-slate-100 text-slate-900 transition-colors duration-500 dark:bg-slate-950 dark:text-slate-100">
      <SettingsToggle
        isActive={isSettingsOpen}
        onClick={() => setIsSettingsOpen((prev) => !prev)}
      />

      <main
        className={cn(
          'mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-4 py-16 transition-all duration-500',
          isSettingsOpen && 'pointer-events-none select-none blur-sm'
        )}
      >
        <BinarySearchVisualizer />
      </main>

      <SettingsPanel open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};

const App = () => (
  <SettingsProvider>
    <AppShell />
  </SettingsProvider>
);

export default App;
