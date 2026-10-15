/** Inline error message with an optional retry hint. */

import { AlertCircle, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface ErrorAlertProps {
  message: string
  onDismiss?: () => void
}

export function ErrorAlert({ message, onDismiss }: ErrorAlertProps) {
  const { t } = useTranslation()

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-200"
    >
      <AlertCircle aria-hidden="true" size={18} className="mt-0.5 shrink-0" />
      <p className="flex-1">{message}</p>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-lg p-1 text-rose-700 hover:bg-rose-100 dark:text-rose-300 dark:hover:bg-rose-900/50"
          aria-label={t('actions.cancel')}
        >
          <X aria-hidden="true" size={16} />
        </button>
      ) : null}
    </div>
  )
}
