import LegalLayout from './LegalLayout';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2
        className="font-display font-semibold mb-4"
        style={{ fontSize: '1.2rem', color: '#2D1F14', borderLeft: '3px solid #A67C52', paddingLeft: '0.75rem' }}
      >
        {title}
      </h2>
      <div className="text-sm leading-[1.9]" style={{ color: '#6E4D32' }}>
        {children}
      </div>
    </section>
  );
}

export default function MentionsLegales() {
  return (
    <LegalLayout title="Mentions légales" description="Mentions légales de Bon Pain Fait Main — Benjamin Ramakers, Rue de la Roer 19, 4950 Waimes, BE 0564.844.064.">
      <Section title="Éditeur du site">
        <p>
          <strong style={{ color: '#2D1F14' }}>Benjamin Ramakers</strong><br />
          Bon pain fait main<br />
          Rue de la Roer 19<br />
          4950 Waimes, Belgique<br />
          Numéro d'entreprise : <strong style={{ color: '#2D1F14' }}>BE 0564.844.064</strong>
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Téléphone : <a href="tel:+32493210925" className="no-underline hover:underline" style={{ color: '#A67C52' }}>+32 493 21 09 25</a><br />
          E-Mail : <a href="mailto:bonpain.artisan@gmail.com" className="no-underline hover:underline" style={{ color: '#A67C52' }}>bonpain.artisan@gmail.com</a>
        </p>
      </Section>

      <Section title="Hébergement">
        <p>
          Ce site est hébergé par un prestataire tiers. Les coordonnées de l'hébergeur sont disponibles sur demande.
        </p>
      </Section>

      <Section title="Propriété intellectuelle">
        <p>
          L'ensemble des contenus présents sur ce site (textes, images, graphismes, logo) sont la propriété exclusive de Benjamin Ramakers — Bon pain fait main, sauf mentions contraires. Toute reproduction, distribution ou utilisation sans autorisation écrite préalable est interdite.
        </p>
      </Section>

      <Section title="Responsabilité">
        <p>
          Benjamin Ramakers s'efforce de maintenir les informations de ce site à jour et exactes. Cependant, il ne peut être tenu responsable des erreurs ou omissions, ni des dommages résultant de l'utilisation des informations publiées.
        </p>
      </Section>

      <Section title="Droit applicable">
        <p>
          Le présent site est soumis au droit belge. Tout litige relatif à son utilisation relèvera de la compétence exclusive des tribunaux belges.
        </p>
      </Section>
    </LegalLayout>
  );
}
