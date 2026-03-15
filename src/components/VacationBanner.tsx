import { useState } from 'react'
import { X } from 'lucide-react'
import { useSanity } from '../context/SanityContext'

export default function VacationBanner() {
  const [dismissed, setDismissed] = useState(false)
  const { vacation } = useSanity()

  if (dismissed || !vacation?.isActive) return null

  const message = vacation.messageFr
  const messageDe = vacation.messageDe
  const emoji = vacation.emoji || ''

  return (
    <div
      className="relative z-50 px-10 py-1.5 text-center text-xs"
      style={{
        background: 'linear-gradient(135deg, #6E4D32, #4A3321)',
        color: '#F5EDE3',
        animation: 'slideDown 0.5s ease',
      }}
    >
      <p className="leading-snug">
        {emoji && <span className="mr-1">{emoji}</span>}
        <strong>{message}</strong>
        {messageDe && (
          <>
            {' '}&nbsp;|&nbsp;{' '}
            <strong>{messageDe}</strong>
          </>
        )}
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors"
        style={{ color: '#D4BFA5' }}
        aria-label="Fermer"
      >
        <X size={16} />
      </button>
    </div>
  )
}
