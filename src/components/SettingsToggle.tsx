import { cn } from '../utils/cn';

interface SettingsToggleProps {
  onClick: () => void;
  isActive: boolean;
}

export const SettingsToggle = ({ onClick, isActive }: SettingsToggleProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      aria-expanded={isActive}
      className={cn(
        'group fixed right-4 top-4 z-40 flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-sm font-medium shadow-sm backdrop-blur transition-all duration-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-light focus:ring-offset-2 dark:border-slate-700 dark:bg-slate-900/80 dark:hover:border-brand-light',
        isActive && 'ring-2 ring-brand-light ring-offset-2 dark:ring-offset-slate-950'
      )}
    >
      <span aria-hidden className="text-xl transition-transform duration-500 group-hover:rotate-90">
        ⚙️
      </span>
      <span
        className={cn(
          'max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold text-slate-600 transition-all duration-500 group-hover:max-w-[96px] group-hover:translate-x-1 group-hover:text-brand dark:text-slate-300',
          isActive && 'max-w-[96px] translate-x-1 text-brand'
        )}
      >
        Settings
      </span>
      <span className="sr-only">Toggle settings panel</span>
    </button>
  );
};
