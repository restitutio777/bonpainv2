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

export default function CGV() {
  return (
    <LegalLayout title="Conditions Générales de Vente" description="Conditions générales de vente de Bon Pain Fait Main — commandes, retrait, prix et annulations pour la boulangerie artisanale à Waimes.">
      <p className="text-sm leading-[1.9] mb-10" style={{ color: '#6E4D32' }}>
        Les présentes conditions générales de vente régissent les commandes passées auprès de Bon pain fait main — Benjamin Ramakers.
      </p>

      <Section title="1. Vendeur">
        <p>
          <strong style={{ color: '#2D1F14' }}>Benjamin Ramakers</strong><br />
          Bon pain fait main<br />
          Rue de la Roer 19, 4950 Waimes, Belgique<br />
          BE 0564.844.064<br />
          <a href="tel:+32493210925" className="no-underline hover:underline" style={{ color: '#A67C52' }}>+32 493 21 09 25</a>{' '}·{' '}
          <a href="mailto:bonpain.artisan@gmail.com" className="no-underline hover:underline" style={{ color: '#A67C52' }}>bonpain.artisan@gmail.com</a>
        </p>
      </Section>

      <Section title="2. Produits">
        <p>
          Les produits proposés sont des pains et viennoiseries artisanaux fabriqués à la main avec des ingrédients naturels. Les produits sont fabriqués uniquement sur commande. Toute commande doit être passée <strong style={{ color: '#2D1F14' }}>au minimum 2 jours à l'avance</strong> (4 jours pour le Panettone).
        </p>
      </Section>

      <Section title="3. Commandes">
        <p>
          Les commandes sont effectuées via le formulaire en ligne ou par contact direct (téléphone, e-mail). Une commande n'est confirmée qu'après réponse écrite ou orale de notre part. Nous nous réservons le droit de refuser une commande en cas de stock ou capacité insuffisants.
        </p>
      </Section>

      <Section title="4. Prix">
        <p>
          Les prix sont indiqués en euros (€) toutes taxes comprises (TVA incluse). Bon pain fait main se réserve le droit de modifier ses prix à tout moment. Les prix applicables sont ceux en vigueur au moment de la confirmation de la commande.
        </p>
      </Section>

      <Section title="5. Retrait et livraison">
        <p>
          Les produits sont disponibles en retrait à l'atelier (Rue de la Roer 19, 4950 Waimes) aux horaires suivants :
        </p>
        <ul className="mt-3 space-y-1 list-disc list-inside">
          <li>Mercredi : 8h00 – 12h00</li>
          <li>Vendredi : 8h00 – 12h00 & 13h00 – 15h00</li>
          <li>Samedi : 8h00 – 12h00</li>
        </ul>
        <p className="mt-3">
          Les produits sont également disponibles dans nos épiceries partenaires. Aucune livraison à domicile n'est proposée.
        </p>
      </Section>

      <Section title="6. Paiement">
        <p>
          Le paiement s'effectue au moment du retrait, en espèces ou par virement bancaire. Aucun paiement en ligne n'est actuellement proposé.
        </p>
      </Section>

      <Section title="7. Annulation et rétractation">
        <p>
          Compte tenu du caractère périssable des produits alimentaires et de leur fabrication sur commande, <strong style={{ color: '#2D1F14' }}>aucun remboursement ni échange ne pourra être accordé</strong> après confirmation de la commande, sauf en cas d'erreur de notre part ou de défaut avéré du produit. Toute annulation doit être signalée au moins 24 heures avant le jour de retrait prévu.
        </p>
      </Section>

      <Section title="8. Allergènes">
        <p>
          Nos produits contiennent du gluten, des œufs, du beurre et d'autres allergènes potentiels. Pour toute demande spécifique liée à des allergies, veuillez nous contacter avant de passer commande. Nos produits sont fabriqués dans un atelier non certifié sans gluten.
        </p>
      </Section>

      <Section title="9. Droit applicable et litiges">
        <p>
          Les présentes CGV sont soumises au droit belge. En cas de litige, une solution amiable sera recherchée en priorité. À défaut, les tribunaux de l'arrondissement de Liège seront compétents.
        </p>
      </Section>
    </LegalLayout>
  );
}
