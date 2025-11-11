import { useEffect, useMemo, useState } from 'react';
import { AlgorithmVariant, useSettings } from '../contexts/SettingsContext';
import { cn } from '../utils/cn';

type SearchOutcome = 'idle' | 'searching' | 'found' | 'not-found';
type SearchDirection = 'left' | 'right' | 'found' | 'miss';

interface SearchStep {
  low: number;
  high: number;
  mid: number;
  value: number | null;
  direction: SearchDirection;
  depth: number;
}

const createRng = (seed: number) => {
  let t = (seed + 0x6d2b79f5) >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), 1 | x);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
};

const generateSortedArray = (
  size: number,
  minValue: number,
  maxValue: number,
  seed: number
) => {
  const rng = createRng(seed || 1);
  const values: number[] = [];
  const spread = Math.max(maxValue - minValue, size + 4);
  const baseStep = Math.max(1, Math.floor(spread / (size + 1)));
  let cursor = minValue + baseStep;

  for (let index = 0; index < size; index += 1) {
    const jitter = Math.round((rng() - 0.5) * baseStep * 0.8);
    cursor = Math.max(cursor + 1, cursor + jitter + baseStep);
    const remainingSlots = size - index;
    const maxAllowed = maxValue - (remainingSlots - 1);
    if (cursor > maxAllowed) {
      cursor = maxAllowed;
    }
    if (index > 0 && cursor <= values[index - 1]) {
      cursor = values[index - 1] + 1;
    }
    values.push(cursor);
  }

  // Ensure values stay within bounds.
  const overflow = values[values.length - 1] - maxValue;
  if (overflow > 0) {
    for (let i = values.length - 1; i >= 0; i -= 1) {
      values[i] -= overflow;
    }
  }

  const underflow = minValue - values[0];
  if (underflow > 0) {
    for (let i = 0; i < values.length; i += 1) {
      values[i] += underflow;
    }
  }

  for (let i = 1; i < values.length; i += 1) {
    if (values[i] <= values[i - 1]) {
      values[i] = values[i - 1] + 1;
    }
  }

  return values;
};

const computeBinarySearchSteps = (
  array: number[],
  target: number,
  variant: AlgorithmVariant
): SearchStep[] => {
  if (!array.length) {
    return [];
  }

  const steps: SearchStep[] = [];

  if (variant === 'iterative') {
    let low = 0;
    let high = array.length - 1;
    let depth = 0;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const value = array[mid];
      let direction: SearchDirection;

      if (value === target) {
        direction = 'found';
      } else if (value > target) {
        direction = 'left';
      } else {
        direction = 'right';
      }

      steps.push({ low, high, mid, value, direction, depth });

      if (direction === 'found') {
        return steps;
      }

      if (direction === 'left') {
        high = mid - 1;
      } else if (direction === 'right') {
        low = mid + 1;
      }

      depth += 1;
    }

    steps.push({
      low,
      high,
      mid: Math.floor((low + high) / 2),
      value: array[Math.min(array.length - 1, Math.max(0, Math.floor((low + high) / 2)))] ?? null,
      direction: 'miss',
      depth,
    });

    return steps;
  }

  const visitRecursive = (low: number, high: number, depth: number) => {
    if (low > high) {
      steps.push({
        low,
        high,
        mid: Math.floor((low + high) / 2),
        value: null,
        direction: 'miss',
        depth,
      });
      return;
    }

    const mid = Math.floor((low + high) / 2);
    const value = array[mid];
    let direction: SearchDirection;

    if (value === target) {
      direction = 'found';
    } else if (value > target) {
      direction = 'left';
    } else {
      direction = 'right';
    }

    steps.push({ low, high, mid, value, direction, depth });

    if (direction === 'left') {
      visitRecursive(low, mid - 1, depth + 1);
    } else if (direction === 'right') {
      visitRecursive(mid + 1, high, depth + 1);
    }
  };

  visitRecursive(0, array.length - 1, 0);

  return steps;
};

const directionLabel: Record<SearchDirection, string> = {
  left: 'Search left half',
  right: 'Search right half',
  found: 'Target found',
  miss: 'Target missing',
};

export const BinarySearchVisualizer = () => {
  const { settings, updateSetting } = useSettings();
  const [targetInput, setTargetInput] = useState<string>('');
  const [target, setTarget] = useState<number | null>(null);
  const [status, setStatus] = useState<SearchOutcome>('idle');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [pendingAutoStart, setPendingAutoStart] = useState(false);

  const array = useMemo(
    () =>
      generateSortedArray(
        settings.arraySize,
        settings.minValue,
        settings.maxValue,
        settings.seed
      ),
    [settings.arraySize, settings.maxValue, settings.minValue, settings.seed]
  );

  useEffect(() => {
    if (array.length) {
      const middleValue = array[Math.floor(array.length / 2)];
      setTarget(middleValue);
      setTargetInput(String(middleValue));
      setStatus('idle');
      setCurrentStepIndex(-1);
    }
  }, [array]);

  const steps = useMemo(() => {
    if (typeof target !== 'number' || Number.isNaN(target)) {
      return [];
    }
    return computeBinarySearchSteps(array, target, settings.variant);
  }, [array, target, settings.variant]);

  const currentStep =
    currentStepIndex >= 0 && currentStepIndex < steps.length
      ? steps[currentStepIndex]
      : null;

  const nextStep =
    settings.peekNextStep && currentStepIndex + 1 < steps.length
      ? steps[currentStepIndex + 1]
      : null;

  useEffect(() => {
    if (status !== 'searching' || !isPlaying) {
      return;
    }

    if (!steps.length || currentStepIndex >= steps.length - 1) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setCurrentStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
    }, settings.stepDelay);

    return () => window.clearTimeout(timeout);
  }, [currentStepIndex, isPlaying, settings.stepDelay, status, steps]);

  useEffect(() => {
    if (currentStepIndex < 0 || currentStepIndex >= steps.length) {
      return;
    }

    const step = steps[currentStepIndex];

    if (step.direction === 'found') {
      setStatus('found');
      setIsPlaying(false);
    } else if (step.direction === 'miss' && currentStepIndex === steps.length - 1) {
      setStatus('not-found');
      setIsPlaying(false);
    } else {
      setStatus('searching');
    }

    if (
      currentStepIndex === steps.length - 1 &&
      settings.loopOnComplete &&
      (step.direction === 'found' || step.direction === 'miss')
    ) {
      const rng = createRng(settings.seed * 3 + 7 + currentStepIndex);
      const randomIndex = Math.floor(rng() * array.length);
      const nextTarget =
        array[randomIndex] ??
        Math.round(settings.minValue + rng() * (settings.maxValue - settings.minValue));
      const restartDelay = Math.max(220, settings.stepDelay + 120);

      window.setTimeout(() => {
        setTarget(nextTarget);
        setTargetInput(String(nextTarget));
        setCurrentStepIndex(-1);
        setStatus('idle');
        if (settings.autoPlay) {
          setPendingAutoStart(true);
        }
      }, restartDelay);
    }
  }, [
    array,
    currentStepIndex,
    settings.autoPlay,
    settings.loopOnComplete,
    settings.maxValue,
    settings.minValue,
    settings.seed,
    settings.stepDelay,
    steps,
  ]);

  useEffect(() => {
    if (status !== 'searching') {
      return;
    }
    setIsPlaying(settings.autoPlay);
  }, [settings.autoPlay, status]);

  useEffect(() => {
    if (!pendingAutoStart) {
      return;
    }

    const startDelay = settings.easeMotion ? 80 : 160;
    const timeout = window.setTimeout(() => {
      if (steps.length) {
        setCurrentStepIndex(0);
        setStatus('searching');
        setIsPlaying(settings.autoPlay);
      } else {
        setStatus('not-found');
      }
      setPendingAutoStart(false);
    }, startDelay);

    return () => window.clearTimeout(timeout);
  }, [pendingAutoStart, settings.autoPlay, settings.easeMotion, steps.length]);

  const handleStart = () => {
    if (!steps.length) {
      setStatus('not-found');
      return;
    }
    setPendingAutoStart(false);
    setCurrentStepIndex(0);
    setStatus('searching');
    setIsPlaying(settings.autoPlay);
  };

  const handleReset = () => {
    setCurrentStepIndex(-1);
    setStatus('idle');
    setIsPlaying(false);
    setPendingAutoStart(false);
  };

  const handleStepForward = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
      setStatus('searching');
    }
  };

  const handleStepBackward = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
      setStatus('searching');
    }
  };

  const handleTargetSubmit = () => {
    const parsed = Number(targetInput);
    if (Number.isFinite(parsed)) {
      setTarget(parsed);
      setCurrentStepIndex(-1);
      setStatus('idle');
      if (settings.autoPlay) {
        setPendingAutoStart(true);
      }
    }
  };

  const handleArrayRegenerate = () => {
    updateSetting('seed', Math.floor(Math.random() * 90000) + 1000);
  };

  const indicatorClass = settings.easeMotion ? 'duration-200' : 'duration-500';

  const renderStatusLabel = () => {
    switch (status) {
      case 'found':
        return 'Target located!';
      case 'not-found':
        return 'Target not present';
      case 'searching':
        return 'Searching…';
      default:
        return 'Awaiting input';
    }
  };

  const headingAccent = status === 'found' ? 'text-emerald-500' : status === 'not-found' ? 'text-rose-500' : 'text-brand';

  return (
    <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-10 rounded-3xl border border-slate-200 bg-white/80 px-6 py-10 shadow-xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
      <div className="flex flex-col gap-4 text-center">
        <span
          className={cn(
            'mx-auto inline-flex items-center gap-2 rounded-full bg-brand/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand shadow-sm',
            status === 'found' && 'bg-emerald-100 text-emerald-600',
            status === 'not-found' && 'bg-rose-100 text-rose-600'
          )}
        >
          {renderStatusLabel()}
        </span>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Binary Search Playground
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Experiment with a sorted list, tweak the algorithm settings, and watch how the low, mid, and high pointers adjust over time.
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <label className="flex flex-1 flex-col gap-2 text-left text-sm">
            <span className="font-semibold text-slate-600 dark:text-slate-300">Target to search for</span>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={targetInput}
                onChange={(event) => setTargetInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    handleTargetSubmit();
                  }
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-base shadow-inner outline-none transition focus:border-brand focus:ring-1 focus:ring-brand dark:border-slate-700 dark:bg-slate-900"
              />
              <button
                type="button"
                onClick={handleTargetSubmit}
                className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-light focus:ring-offset-2"
              >
                Apply
              </button>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Choose any number within or beyond the list to see how binary search reacts.
            </span>
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleStart}
              className="rounded-full border border-brand bg-brand px-6 py-2 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-[1px] hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-light focus:ring-offset-2"
            >
              Start search
            </button>
            <button
              type="button"
              onClick={() => setIsPlaying((prev) => !prev)}
              disabled={status === 'found' || status === 'not-found' || steps.length === 0}
              className={cn(
                'rounded-full border px-6 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-brand-light focus:ring-offset-2',
                isPlaying
                  ? 'border-amber-400 bg-amber-100 text-amber-600 dark:bg-amber-400/20'
                  : 'border-slate-200 text-slate-600 hover:border-brand hover:text-brand dark:border-slate-700 dark:text-slate-300'
              )}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-full border border-slate-200 px-6 py-2 text-sm font-semibold text-slate-600 transition hover:border-brand hover:text-brand focus:outline-none focus:ring-2 focus:ring-brand-light focus:ring-offset-2 dark:border-slate-700 dark:text-slate-300"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleArrayRegenerate}
              className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:border-brand hover:text-brand dark:border-slate-600 dark:text-slate-400"
            >
              Regenerate list
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span className={cn('inline-flex items-center gap-2', headingAccent)}>
            <span className="inline-block h-2 w-2 rounded-full bg-current" />
            {status === 'found'
              ? 'Found the target'
              : status === 'not-found'
              ? 'Target not in bounds'
              : 'Ready to explore'}
          </span>
          <span>|</span>
          <span>Variant: {settings.variant === 'iterative' ? 'Iterative loop' : 'Recursive calls'}</span>
          <span>|</span>
          <span>Length: {array.length}</span>
        </div>
      </div>

      <div className="space-y-6">
        <div className="overflow-x-auto">
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: `repeat(${Math.max(array.length, 6)}, minmax(3rem, 1fr))`,
            }}
          >
            {array.map((value, index) => {
              const isMid = currentStep?.mid === index;
              const isLow = currentStep?.low === index;
              const isHigh = currentStep?.high === index;
              const visited = Boolean(currentStep) && index >= (currentStep?.low ?? 0) && index <= (currentStep?.high ?? array.length - 1);

              return (
                <button
                  type="button"
                  key={value}
                  onClick={() => {
                    setTarget(value);
                    setTargetInput(String(value));
                    handleReset();
                  }}
                  className={cn(
                    'group relative flex h-20 flex-col items-center justify-center rounded-2xl border px-2 text-center transition-all',
                    visited
                      ? 'border-brand/60 bg-brand/5 text-brand-dark dark:border-brand/50 dark:bg-brand/10 dark:text-brand-light'
                      : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200',
                    settings.highlightStyle === 'solid' && isMid && 'bg-brand text-white shadow-glow dark:bg-brand/90',
                    settings.highlightStyle === 'underline' && isMid && 'border-b-4 border-b-brand',
                    settings.highlightStyle === 'glow' && isMid && 'shadow-glow',
                    settings.showMidShadow && isMid && 'scale-[1.04]',
                    settings.easeMotion ? 'duration-200' : 'duration-500',
                    'hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-light'
                  )}
                >
                  <span className="text-lg font-semibold">{value}</span>
                  {settings.showIndices && (
                    <span className="text-xs text-slate-400 transition group-hover:text-brand dark:text-slate-500">
                      idx {index}
                    </span>
                  )}
                  {isLow && settings.showBounds && (
                    <Badge label="low" className={`absolute -top-3 left-3 ${indicatorClass}`} />
                  )}
                  {isHigh && settings.showBounds && (
                    <Badge label="high" className={`absolute -top-3 right-3 ${indicatorClass}`} />
                  )}
                  {isMid && (
                    <Badge
                      label="mid"
                      className={`absolute -bottom-3 left-1/2 -translate-x-1/2 ${indicatorClass}`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex h-full flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-900/60">
            <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Step details
            </h2>
            {currentStep ? (
              <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <p>
                  Inspecting index <span className="font-semibold">{currentStep.mid}</span> with value{' '}
                  <span className="font-semibold">{currentStep.value}</span>.
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  {directionLabel[currentStep.direction]}
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Tag label={`low → ${currentStep.low}`} />
                  <Tag label={`high → ${currentStep.high}`} />
                  <Tag label={`depth ${currentStep.depth}`} />
                  <Tag label={`direction: ${currentStep.direction}`} />
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Launch the search to populate the timeline. You can also scrub manually using the controls below.
              </p>
            )}

            {nextStep && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 p-4 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900/40">
                <span className="block font-semibold uppercase tracking-wide text-slate-400">
                  Next move
                </span>
                <span>Low → {nextStep.low}, High → {nextStep.high}, Mid → {nextStep.mid}</span>
              </div>
            )}

            <div className="mt-auto flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleStepBackward}
                disabled={currentStepIndex <= 0}
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 transition disabled:cursor-not-allowed disabled:opacity-50 hover:border-brand hover:text-brand focus:outline-none focus:ring-2 focus:ring-brand-light focus:ring-offset-2 dark:border-slate-700 dark:text-slate-400"
              >
                Step back
              </button>
              <button
                type="button"
                onClick={handleStepForward}
                disabled={currentStepIndex >= steps.length - 1}
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 transition disabled:cursor-not-allowed disabled:opacity-50 hover:border-brand hover:text-brand focus:outline-none focus:ring-2 focus:ring-brand-light focus:ring-offset-2 dark:border-slate-700 dark:text-slate-400"
              >
                Step forward
              </button>
            </div>
          </div>

          <div className="flex h-full flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-900/60">
            <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Timeline</h2>
            <div className="flex-1 space-y-2 overflow-y-auto pr-1 text-sm">
              {currentStepIndex >= 0 ? (
                steps.slice(0, currentStepIndex + 1).map((step, index) => (
                  <div
                    key={`${step.mid}-${index}`}
                    className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900/60"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Step {index + 1}</span>
                      <span>depth {step.depth}</span>
                    </div>
                    <p className="text-sm">
                      {step.direction === 'miss'
                        ? 'No more values in range.'
                        : `Inspect value ${step.value} at index ${step.mid}.`}
                    </p>
                    <p className="text-xs text-slate-400">
                      {directionLabel[step.direction]}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Steps will appear here once the search begins.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface BadgeProps {
  label: string;
  className?: string;
}

const Badge = ({ label, className }: BadgeProps) => (
  <span
    className={cn(
      'inline-flex min-w-[3rem] justify-center rounded-full border border-slate-200 bg-white px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-wider text-slate-500 shadow-sm transition-all dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300',
      className
    )}
  >
    {label}
  </span>
);

const Tag = ({ label }: { label: string }) => (
  <span className="rounded-full bg-white/60 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400 shadow dark:bg-slate-800/60">
    {label}
  </span>
);
