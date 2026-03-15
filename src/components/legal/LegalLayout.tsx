import { ReactNode, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import WheatIcon from '../WheatIcon';

interface Props {
  title: string;
  description?: string;
  children: ReactNode;
}

export default function LegalLayout({ title, description, children }: Props) {
  useEffect(() => {
    document.title = `${title} — Bon Pain Fait Main`;
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      (metaDesc as HTMLMetaElement).name = 'description';
      document.head.appendChild(metaDesc);
    }
    (metaDesc as HTMLMetaElement).content = description ?? `${title} — Bon Pain Fait Main, boulangerie artisanale à Waimes.`;
    return () => {
      document.title = 'Bon Pain Fait Main — Boulangerie artisanale au levain, Waimes';
    };
  }, [title, description]);

  return (
    <div style={{ background: '#FAF6F1', minHeight: '100vh' }}>
      <header
        className="sticky top-0 z-40 h-[64px] flex items-center px-5 md:px-10"
        style={{ background: 'rgba(250,246,241,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #E8D9C8' }}
      >
        <div className="container mx-auto max-w-[900px] flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5 no-underline">
            <WheatIcon size={28} style={{ color: '#A67C52' }} />
            <span className="font-display text-lg font-medium" style={{ color: '#2D1F14' }}>
              Bon Pain Fait Main
            </span>
          </a>
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium no-underline transition-colors duration-200"
            style={{ color: '#A67C52' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#6E4D32'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#A67C52'; }}
          >
            <ArrowLeft size={16} />
            Retour
          </a>
        </div>
      </header>

      <main className="container mx-auto px-5 md:px-10 max-w-[900px] py-16 md:py-24">
        <h1
          className="font-display font-normal mb-12"
          style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', color: '#2D1F14', borderBottom: '2px solid #E8D9C8', paddingBottom: '1.5rem' }}
        >
          {title}
        </h1>
        <div
          className="prose-legal"
          style={{ color: '#4A3321' }}
        >
          {children}
        </div>
      </main>

      <footer
        className="py-8 text-center text-xs"
        style={{ background: '#2D1F14', color: '#BFA07E' }}
      >
        <p>&copy; 2025 Bon Pain Fait Main — Benjamin Ramakers — BE 0564.844.064</p>
      </footer>
    </div>
  );
}
