import WheatIcon from './WheatIcon';

const navLinks = [
  { href: '#products', label: 'Nos pains' },
  { href: '#info', label: 'Infos pratiques' },
  { href: '#order', label: 'Commander' },
  { href: '#about', label: 'Notre histoire' },
];

const contactLinks = [
  { href: 'mailto:bonpain.artisan@gmail.com', label: 'bonpain.artisan@gmail.com' },
  { href: 'tel:+32493210925', label: '+32 493 21 09 25' },
  { href: '#', label: 'Rue de la Roer 19, 4950 Waimes' },
];

const legalLinks = [
  { href: '/mentions-legales', label: 'Mentions légales' },
  { href: '/confidentialite', label: 'Confidentialité' },
  { href: '/cgv', label: 'CGV' },
];

export default function Footer() {
  return (
    <footer style={{ background: '#2D1F14', color: '#D4BFA5' }}>
      <div className="container mx-auto px-5 md:px-10 max-w-[1200px] pt-16 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          <div className="lg:col-span-1">
            <a href="#" className="flex items-center gap-3 no-underline mb-4">
              <WheatIcon size={32} style={{ color: '#BFA07E' }} />
              <span
                className="font-display text-xl font-medium"
                style={{ color: '#F5EDE3' }}
              >
                Bon Pain Fait Main
              </span>
            </a>
            <p className="text-sm leading-[1.7]" style={{ color: '#BFA07E', maxWidth: '300px' }}>
              Boulangerie artisanale au levain, nichée au cœur des Ardennes belges. Chaque pain est
              façonné à la main, sur commande.
            </p>
          </div>

          {[
            { title: 'Navigation', links: navLinks },
            { title: 'Contact', links: contactLinks },
            { title: 'Légal', links: legalLinks },
          ].map((col) => (
            <div key={col.title}>
              <h4
                className="font-display text-lg font-semibold mb-5"
                style={{ color: '#F5EDE3' }}
              >
                {col.title}
              </h4>
              <ul className="list-none p-0 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm no-underline transition-colors duration-200 hover:text-warm-100"
                      style={{ color: '#BFA07E' }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.color = '#F5EDE3';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.color = '#BFA07E';
                      }}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 text-xs"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)', color: '#A67C52' }}
        >
          <span>&copy; 2026 Bon Pain Fait Main — Tous droits réservés</span>
          <div className="flex gap-4">
            {[
              {
                label: 'Facebook',
                path: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z',
              },
              {
                label: 'Instagram',
                path: null,
                isInstagram: true,
              },
            ].map((social) => (
              <a
                key={social.label}
                href="#"
                aria-label={social.label}
                className="w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 hover:-translate-y-0.5"
                style={{ background: 'rgba(255,255,255,0.05)', color: '#BFA07E' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)';
                  (e.currentTarget as HTMLElement).style.color = '#F5EDE3';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
                  (e.currentTarget as HTMLElement).style.color = '#BFA07E';
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={18}
                  height={18}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {social.isInstagram ? (
                    <>
                      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                    </>
                  ) : (
                    <path d={social.path!} />
                  )}
                </svg>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
