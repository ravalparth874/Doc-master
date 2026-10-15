/** DOC Master wordmark and icon, drawn in the brand gradient. */

interface LogoProps {
  className?: string
  /** Accessible label. Leave empty for a purely decorative logo. */
  title?: string
}

export function LogoMark({ className = 'h-9 w-9', title }: LogoProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
      xmlns="http://www.w3.org/2000/svg"
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <linearGradient
          id="docmaster-mark"
          x1="8"
          y1="4"
          x2="42"
          y2="46"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#4f46e5" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#docmaster-mark)" />
      <path
        d="M14 11h12.6L34 18.4V34a3 3 0 0 1-3 3H17a3 3 0 0 1-3-3V14a3 3 0 0 1 3-3Z"
        fill="#ffffff"
        fillOpacity="0.96"
      />
      <path d="M26.5 11 34 18.4h-5a2.5 2.5 0 0 1-2.5-2.5V11Z" fill="#c7d2fe" />
      <path
        d="m18.6 26.4 3.5 3.6 6.6-7.2"
        fill="none"
        stroke="#4f46e5"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

interface WordmarkProps {
  className?: string
}

export function Wordmark({ className = 'text-lg' }: WordmarkProps) {
  return (
    <span className={`font-extrabold tracking-tight text-slate-900 dark:text-white ${className}`}>
      DOC <span className="text-brand-600 dark:text-brand-400">Master</span>
    </span>
  )
}
