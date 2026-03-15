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

export default function Confidentialite() {
  return (
    <LegalLayout title="Politique de confidentialité" description="Politique de confidentialité et protection des données (RGPD) de Bon Pain Fait Main, boulangerie artisanale à Waimes, Belgique.">
      <p className="text-sm leading-[1.9] mb-10" style={{ color: '#6E4D32' }}>
        Dernière mise à jour : mars 2025
      </p>

      <Section title="Responsable du traitement">
        <p>
          <strong style={{ color: '#2D1F14' }}>Benjamin Ramakers</strong><br />
          Bon pain fait main — Rue de la Roer 19, 4950 Waimes<br />
          BE 0564.844.064<br />
          <a href="mailto:bonpain.artisan@gmail.com" className="no-underline hover:underline" style={{ color: '#A67C52' }}>bonpain.artisan@gmail.com</a>
        </p>
      </Section>

      <Section title="Données collectées">
        <p>
          Lors de la passation d'une commande via le formulaire en ligne, les données suivantes sont collectées :
        </p>
        <ul className="mt-3 space-y-1 list-disc list-inside">
          <li>Nom et prénom</li>
          <li>Adresse e-mail</li>
          <li>Numéro de téléphone (optionnel)</li>
          <li>Contenu de la commande et remarques éventuelles</li>
        </ul>
      </Section>

      <Section title="Finalité du traitement">
        <p>
          Les données collectées sont utilisées exclusivement pour :
        </p>
        <ul className="mt-3 space-y-1 list-disc list-inside">
          <li>Traiter et confirmer votre commande</li>
          <li>Vous contacter en cas de question relative à votre commande</li>
        </ul>
        <p className="mt-3">
          Aucune donnée n'est transmise à des tiers ni utilisée à des fins commerciales ou publicitaires.
        </p>
      </Section>

      <Section title="Durée de conservation">
        <p>
          Les données sont conservées le temps nécessaire au traitement de la commande et pendant la durée légale de conservation comptable (7 ans pour les données de facturation).
        </p>
      </Section>

      <Section title="Vos droits (RGPD)">
        <p>
          Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :
        </p>
        <ul className="mt-3 space-y-1 list-disc list-inside">
          <li>Droit d'accès à vos données personnelles</li>
          <li>Droit de rectification</li>
          <li>Droit à l'effacement</li>
          <li>Droit à la limitation du traitement</li>
          <li>Droit d'opposition</li>
        </ul>
        <p className="mt-3">
          Pour exercer ces droits, contactez-nous à :{' '}
          <a href="mailto:bonpain.artisan@gmail.com" className="no-underline hover:underline" style={{ color: '#A67C52' }}>bonpain.artisan@gmail.com</a>
        </p>
      </Section>

      <Section title="Cookies">
        <p>
          Ce site n'utilise pas de cookies de suivi ou publicitaires. Des cookies techniques peuvent être utilisés pour le bon fonctionnement du site.
        </p>
      </Section>
    </LegalLayout>
  );
}
