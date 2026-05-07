import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'siteSettings',
  title: 'Mon entreprise',
  type: 'document',
  groups: [
    { name: 'identity', title: 'Identité', default: true },
    { name: 'contact', title: 'Contact' },
    { name: 'partners', title: 'Points de vente partenaires' },
    { name: 'seo', title: 'Visibilité Google' },
  ],
  fields: [
    // — Identité
    defineField({
      name: 'bakeryName',
      title: 'Nom de la boulangerie',
      description: 'Apparaît dans le titre du site et le pied de page.',
      type: 'string',
      group: 'identity',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'bakeryTagline',
      title: 'Slogan',
      description:
        "Phrase courte qui décrit la boulangerie (ex. « Pain au levain artisanal à Sourbrodt »).",
      type: 'string',
      group: 'identity',
    }),
    defineField({
      name: 'ownerName',
      title: 'Nom du boulanger',
      description: 'Affiché dans le pied de page et les mentions légales.',
      type: 'string',
      group: 'identity',
    }),
    defineField({
      name: 'vatNumber',
      title: 'Numéro de TVA',
      description: 'Obligatoire pour les mentions légales (impressum).',
      type: 'string',
      group: 'identity',
    }),

    // — Contact
    defineField({
      name: 'email',
      title: 'Adresse email',
      description: 'Affichée sur le site, et utilisée pour recevoir les commandes.',
      type: 'string',
      group: 'contact',
      validation: (R) => R.required().email(),
    }),
    defineField({
      name: 'phone',
      title: 'Numéro de téléphone',
      description: 'Format international, ex. +32 493 21 09 25.',
      type: 'string',
      group: 'contact',
    }),
    defineField({
      name: 'address',
      title: 'Adresse postale',
      type: 'address',
      group: 'contact',
    }),
    defineField({
      name: 'orderLeadDays',
      title: 'Délai minimum de commande (en jours)',
      description:
        'Combien de jours à l\'avance les clients doivent commander. 2 = on commande au plus tard avant-hier.',
      type: 'number',
      initialValue: 2,
      group: 'contact',
      validation: (R) => R.min(0).max(14),
    }),
    defineField({
      name: 'facebookUrl',
      title: 'Page Facebook',
      description: 'Lien complet (https://...). Laisser vide si pas de page.',
      type: 'url',
      group: 'contact',
    }),
    defineField({
      name: 'instagramUrl',
      title: 'Page Instagram',
      description: 'Lien complet (https://...). Laisser vide si pas de page.',
      type: 'url',
      group: 'contact',
    }),

    // — Points de vente partenaires
    defineField({
      name: 'partnerStores',
      title: 'Liste des points de vente partenaires',
      description:
        'Épiceries / magasins qui revendent vos pains. Apparaît en bas de page.',
      type: 'array',
      of: [{ type: 'partnerStore' }],
      group: 'partners',
    }),

    // — Visibilité Google
    defineField({
      name: 'seoTitle',
      title: 'Titre dans les résultats Google',
      description:
        "Apparaît en bleu dans la recherche Google (50–60 caractères max).",
      type: 'string',
      group: 'seo',
      validation: (R) => R.max(70),
    }),
    defineField({
      name: 'seoDescription',
      title: 'Description dans les résultats Google',
      description:
        "Apparaît en gris sous le titre dans Google (140–160 caractères max).",
      type: 'text',
      rows: 3,
      group: 'seo',
      validation: (R) => R.max(180),
    }),
    defineField({
      name: 'seoImage',
      title: 'Image de partage (Facebook, WhatsApp…)',
      description:
        "Image affichée quand quelqu'un partage le lien. Format paysage idéal (1200 × 630 px).",
      type: 'image',
      options: { hotspot: true },
      group: 'seo',
    }),
  ],
  preview: {
    select: { title: 'bakeryName' },
    prepare({ title }) {
      return { title: title || 'Mon entreprise' }
    },
  },
})
