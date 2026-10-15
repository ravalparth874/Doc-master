/** Progress bar for uploads, exposed to assistive technology. */

interface ProgressBarProps {
  value: number
  label: string
  busy?: boolean
}

export function ProgressBar({ value, label, busy = true }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)))

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
        <span>{label}</span>
        <span aria-hidden="true">{clamped}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
      >
        <div
          className={`h-full rounded-full bg-gradient-to-r from-brand-600 to-accent-600 transition-[width] duration-200 ${
            busy ? '' : 'opacity-70'
          }`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <p className="sr-only" aria-live="polite">
        {`${label} ${clamped}%`}
      </p>
    </div>
  )
}
