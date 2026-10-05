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
        Dernière mise à jour : octobre 2026
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
          Base légale : l'exécution de votre commande (article 6.1.b du RGPD). Vos données ne sont ni vendues ni utilisées à des fins commerciales ou publicitaires.
        </p>
      </Section>

      {/* Facts checked 2026-10-05: Vercel functions run in iad1 (deployment
          "regions"), Resend sends through AWS eu-west-1 (MX of
          send.bonpainfaitmain.be), Vercel and Upstash state EU-U.S. DPF
          certification in their privacy policies, Resend's DPA incorporates
          the EU SCCs and states DPF compliance. Update this section when the
          function region, the mail provider or the fonts change. */}
      <Section title="Hébergement et sous-traitants">
        <p>
          Pour faire fonctionner le site et le formulaire de commande, nous faisons appel aux prestataires suivants. Ils traitent les données uniquement pour notre compte.
        </p>
        <ul className="mt-3 space-y-2 list-disc list-inside">
          <li>
            <strong style={{ color: '#2D1F14' }}>Vercel Inc.</strong> (440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis) — hébergement du site et traitement du formulaire de commande, dans un centre de données aux États-Unis. Vercel Web Analytics compte les visites de façon anonyme, sans cookies.
          </li>
          <li>
            <strong style={{ color: '#2D1F14' }}>Resend</strong> (Plus Five Five, Inc., États-Unis) — envoi de la commande à la boulangerie et de l'e-mail de confirmation. L'envoi passe par des serveurs situés en Irlande.
          </li>
          <li>
            <strong style={{ color: '#2D1F14' }}>Upstash</strong> (États-Unis) — enregistrement temporaire des commandes pour établir la liste de chaque jour de retrait.
          </li>
          <li>
            <strong style={{ color: '#2D1F14' }}>Google</strong> — la boîte e-mail de la boulangerie (Gmail), où arrivent les commandes. Les polices de caractères du site sont chargées depuis les serveurs de Google Fonts ; votre navigateur transmet pour cela votre adresse IP à Google.
          </li>
          <li>
            <strong style={{ color: '#2D1F14' }}>Sanity</strong> (Sanity AS, Norvège) — textes et photos du site. Aucune donnée de commande n'y est enregistrée.
          </li>
        </ul>
        <p className="mt-3">
          Lorsque des données sont traitées aux États-Unis, ce transfert repose sur les garanties prévues par le RGPD (cadre de protection des données UE–États-Unis ou clauses contractuelles types de la Commission européenne).
        </p>
      </Section>

      <Section title="Durée de conservation">
        <ul className="space-y-1 list-disc list-inside">
          <li>Liste des commandes du formulaire : effacée automatiquement 60 jours après la dernière commande pour le même jour de retrait.</li>
          <li>Journaux techniques de l'hébergeur : 1 heure.</li>
          <li>E-mails de commande dans la boîte de la boulangerie : le temps nécessaire au traitement de la commande, puis pendant la durée légale de conservation comptable (7 ans pour les données de facturation).</li>
        </ul>
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
        <p className="mt-3">
          Vous pouvez également introduire une réclamation auprès de l'Autorité de protection des données :{' '}
          <a href="https://www.autoriteprotectiondonnees.be" className="no-underline hover:underline" style={{ color: '#A67C52' }}>www.autoriteprotectiondonnees.be</a>
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
