import { useState } from 'react';
import { X } from 'lucide-react';
import { Lang } from '../types';

interface ModalContent {
  fr: { title: string; subtitle: string; body: string[] };
  de: { title: string; subtitle: string; body: string[] };
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: ModalContent;
}

export default function Modal({ isOpen, onClose, content }: ModalProps) {
  const [lang, setLang] = useState<Lang>('fr');

  if (!isOpen) return null;

  const c = content[lang];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 transition-opacity duration-300"
      style={{
        background: 'rgba(45,31,20,0.6)',
        backdropFilter: 'blur(8px)',
        opacity: isOpen ? 1 : 0,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-h-[85vh] overflow-y-auto rounded-[20px]"
        style={{
          maxWidth: '560px',
          background: 'white',
          boxShadow: '0 16px 48px rgba(45,31,20,0.12)',
          animation: 'scaleIn 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <div className="relative pt-8 px-8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200"
            style={{ background: '#FDF8F3', color: '#6E4D32' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = '#F5EDE3';
              (e.currentTarget as HTMLElement).style.color = '#2D1F14';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = '#FDF8F3';
              (e.currentTarget as HTMLElement).style.color = '#6E4D32';
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-8 pb-8 pt-2">
          <div className="flex gap-2 mb-5">
            {(['fr', 'de'] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className="px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide transition-all duration-200"
                style={{
                  border: '1px solid',
                  borderColor: lang === l ? '#A67C52' : '#E8D9C8',
                  background: lang === l ? '#A67C52' : 'transparent',
                  color: lang === l ? 'white' : '#6E4D32',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          <h2
            className="font-display font-medium mb-2"
            style={{ fontSize: '1.8rem', color: '#2D1F14' }}
          >
            {c.title}
          </h2>
          <p className="text-sm mb-5" style={{ color: '#8B7A6B' }}>
            {c.subtitle}
          </p>
          {c.body.map((paragraph, i) => (
            <p key={i} className="text-sm leading-[1.7] mb-3" style={{ color: '#6E4D32' }}>
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
