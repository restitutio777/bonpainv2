import { useState } from 'react';
import { X } from 'lucide-react';

export default function VacationBanner() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

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
        <strong>Vacances 22–30 mars</strong> · Aucune commande &nbsp;|&nbsp; <strong>Urlaub 22.–30. März</strong> · Keine Bestellungen
      </p>
      <button
        onClick={() => setVisible(false)}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors"
        style={{ color: '#D4BFA5' }}
        aria-label="Fermer"
      >
        <X size={16} />
      </button>
    </div>
  );
}
