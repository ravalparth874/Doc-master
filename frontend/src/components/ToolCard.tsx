/** Card used in the homepage tool grid. */

import { Link } from 'react-router-dom'
import { ArrowRight, type LucideIcon } from 'lucide-react'

interface ToolCardProps {
  to: string
  title: string
  description: string
  icon: LucideIcon
}

export function ToolCard({ to, title, description, icon: Icon }: ToolCardProps) {
  return (
    <Link
      to={to}
      className="card group flex h-full flex-col p-4 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 sm:p-5 dark:hover:border-brand-700"
    >
      <span className="flex items-start justify-between gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-accent-600 text-white shadow-sm">
          <Icon aria-hidden="true" size={22} />
        </span>
        <span
          aria-hidden="true"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-brand-600 dark:text-slate-500 dark:group-hover:text-brand-300"
        >
          <ArrowRight size={18} />
        </span>
      </span>

      <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">{title}</h3>
      <p className="mt-1.5 flex-1 text-sm text-slate-600 dark:text-slate-300">{description}</p>
    </Link>
  )
}
