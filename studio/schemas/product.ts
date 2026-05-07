import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'product',
  title: 'Produit',
  type: 'document',
  groups: [
    { name: 'basics', title: 'Informations principales', default: true },
    { name: 'availability', title: 'Disponibilité' },
    { name: 'modal', title: 'Fiche détaillée (optionnel)' },
    { name: 'german', title: 'Allemand (optionnel)' },
    { name: 'advanced', title: 'Avancé' },
  ],
  fields: [
    // — Informations principales
    defineField({
      name: 'name',
      title: 'Nom du produit',
      description: 'Ex. « Pain au levain », « Croissant », « Tarte aux fraises ».',
      type: 'string',
      group: 'basics',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'category',
      title: 'Catégorie',
      description: 'Détermine où le produit apparaît sur le site.',
      type: 'string',
      group: 'basics',
      options: {
        list: [
          { title: 'Pain', value: 'bread' },
          { title: 'Viennoiserie', value: 'viennoiserie' },
          { title: 'Spécialité', value: 'specialty' },
          { title: 'Tarte', value: 'tart' },
        ],
        layout: 'radio',
      },
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description courte',
      description:
        'Une phrase qui décrit le produit (max. 140 caractères). Apparaît sous le nom dans la liste.',
      type: 'string',
      group: 'basics',
      validation: (R) => R.max(140),
    }),
    defineField({
      name: 'price',
      title: 'Prix (€)',
      description: 'En euros. Utilisez le point pour les centimes (ex. 6.50).',
      type: 'number',
      group: 'basics',
      validation: (R) => R.required().min(0),
    }),
    defineField({
      name: 'image',
      title: 'Photo du produit',
      description: 'Format carré recommandé. Cliquez pour cadrer la photo.',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: "Description de l'image",
          description:
            'Décrivez le produit (ex. « Pain au levain doré »). Utilisé par Google et les lecteurs d\'écran.',
          type: 'string',
        }),
      ],
      group: 'basics',
    }),
    defineField({
      name: 'badge',
      title: 'Petit badge (ex. Nouveau, Bio)',
      description:
        'Étiquette colorée affichée sur la photo. Laisser vide pour ne rien afficher.',
      type: 'string',
      group: 'basics',
    }),

    // — Disponibilité
    defineField({
      name: 'availability',
      title: "Quand le produit est-il disponible ?",
      type: 'string',
      group: 'availability',
      options: {
        list: [
          { title: 'Toujours disponible', value: 'all' },
          { title: 'Samedi uniquement', value: 'saturday' },
          { title: 'Sur commande spéciale', value: 'on_order' },
        ],
        layout: 'radio',
      },
      initialValue: 'all',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'isActive',
      title: 'Produit visible sur le site',
      description:
        'Décocher pour cacher temporairement le produit (sans le supprimer).',
      type: 'boolean',
      initialValue: true,
      group: 'availability',
    }),
    defineField({
      name: 'orderInForm',
      title: 'Disponible dans le formulaire de commande',
      description:
        'Si activé, le client peut ajouter ce produit à sa commande en ligne.',
      type: 'boolean',
      initialValue: true,
      group: 'availability',
    }),
    defineField({
      name: 'isSeasonal',
      title: 'Produit saisonnier',
      description: 'Cocher si le produit n\'est disponible que sur une période donnée.',
      type: 'boolean',
      initialValue: false,
      group: 'availability',
    }),
    defineField({
      name: 'seasonStart',
      title: 'Début de saison',
      type: 'date',
      group: 'availability',
      hidden: ({ document }) => !document?.isSeasonal,
    }),
    defineField({
      name: 'seasonEnd',
      title: 'Fin de saison',
      type: 'date',
      group: 'availability',
      hidden: ({ document }) => !document?.isSeasonal,
    }),

    // — Fiche détaillée (modal)
    defineField({
      name: 'hasModal',
      title: 'Activer une fiche détaillée',
      description:
        "Si activé, un bouton « En savoir plus » apparaît et ouvre une fenêtre avec plus d'infos sur le produit.",
      type: 'boolean',
      initialValue: false,
      group: 'modal',
    }),
    defineField({
      name: 'modalTitleFr',
      title: 'Titre de la fiche',
      type: 'string',
      group: 'modal',
      hidden: ({ document }) => !document?.hasModal,
    }),
    defineField({
      name: 'modalSubtitleFr',
      title: 'Sous-titre de la fiche',
      type: 'string',
      group: 'modal',
      hidden: ({ document }) => !document?.hasModal,
    }),
    defineField({
      name: 'modalBodyFr',
      title: 'Texte de la fiche',
      description:
        "L'histoire du produit, les ingrédients, les détails. Vous pouvez mettre des mots en gras ou italique.",
      type: 'array',
      of: [{ type: 'block' }],
      group: 'modal',
      hidden: ({ document }) => !document?.hasModal,
    }),

    // — Allemand (optionnel)
    defineField({
      name: 'modalTitleDe',
      title: 'Titre de la fiche (allemand)',
      description:
        "Laisser vide si vous n'utilisez pas la version allemande du site.",
      type: 'string',
      group: 'german',
      hidden: ({ document }) => !document?.hasModal,
    }),
    defineField({
      name: 'modalSubtitleDe',
      title: 'Sous-titre de la fiche (allemand)',
      type: 'string',
      group: 'german',
      hidden: ({ document }) => !document?.hasModal,
    }),
    defineField({
      name: 'modalBodyDe',
      title: 'Texte de la fiche (allemand)',
      type: 'array',
      of: [{ type: 'block' }],
      group: 'german',
      hidden: ({ document }) => !document?.hasModal,
    }),

    // — Avancé
    defineField({
      name: 'slug',
      title: 'Adresse web (slug)',
      description:
        "Adresse web du produit, créée automatiquement à partir du nom. Ne modifier que si vous savez ce que vous faites.",
      type: 'slug',
      options: { source: 'name', maxLength: 96 },
      group: 'advanced',
      validation: (R) => R.required(),
      readOnly: false,
    }),
    defineField({
      name: 'sortOrder',
      title: "Ordre d'affichage",
      description:
        'Plus le chiffre est petit, plus le produit apparaît en haut. Laisser à 100 pour la plupart des produits.',
      type: 'number',
      initialValue: 100,
      group: 'advanced',
    }),
  ],
  orderings: [
    {
      title: "Ordre d'affichage",
      name: 'sortOrderAsc',
      by: [{ field: 'sortOrder', direction: 'asc' }],
    },
    {
      title: 'Nom (A → Z)',
      name: 'nameAsc',
      by: [{ field: 'name', direction: 'asc' }],
    },
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'category',
      media: 'image',
      isActive: 'isActive',
      price: 'price',
    },
    prepare({ title, subtitle, media, isActive, price }) {
      const cat: Record<string, string> = {
        bread: 'Pain',
        viennoiserie: 'Viennoiserie',
        specialty: 'Spécialité',
        tart: 'Tarte',
      }
      const parts = [cat[subtitle] || subtitle]
      if (typeof price === 'number') parts.push(`${price.toFixed(2)} €`)
      if (isActive === false) parts.push('• caché')
      return {
        title,
        subtitle: parts.filter(Boolean).join(' · '),
        media,
      }
    },
  },
})
