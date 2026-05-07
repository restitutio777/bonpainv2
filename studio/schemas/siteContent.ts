import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'siteContent',
  title: 'Textes du site',
  type: 'document',
  groups: [
    { name: 'hero', title: "Bannière d'accueil", default: true },
    { name: 'about', title: 'Notre histoire' },
    { name: 'products', title: 'Section « Nos pains »' },
    { name: 'order', title: 'Section commande' },
    { name: 'footer', title: 'Pied de page' },
  ],
  fields: [
    // — Bannière d'accueil (hero)
    defineField({
      name: 'heroBadge',
      title: 'Petite étiquette en haut',
      description:
        "Texte court au-dessus du grand titre (ex. « Boulangerie artisanale - Sourbrodt »). Laisser vide pour ne rien afficher.",
      type: 'string',
      group: 'hero',
    }),
    defineField({
      name: 'heroTitle',
      title: 'Grand titre — première partie',
      description: 'Ex. « Pain au levain, » (la virgule fait partie du texte).',
      type: 'string',
      group: 'hero',
    }),
    defineField({
      name: 'heroTitleAccent',
      title: 'Grand titre — partie en couleur',
      description:
        "Suite du titre, mise en valeur en orange (ex. « fait à la main »).",
      type: 'string',
      group: 'hero',
    }),
    defineField({
      name: 'heroSubtitle',
      title: 'Phrase sous le grand titre',
      description: 'Une à deux phrases qui expliquent ce que fait la boulangerie.',
      type: 'text',
      rows: 3,
      group: 'hero',
    }),
    defineField({
      name: 'heroCtaPrimary',
      title: 'Bouton principal',
      description: 'Texte du gros bouton orange (ex. « Commander maintenant »).',
      type: 'string',
      group: 'hero',
    }),
    defineField({
      name: 'heroCtaSecondary',
      title: 'Bouton secondaire',
      description:
        "Texte du second bouton, plus discret (ex. « Découvrir notre histoire »).",
      type: 'string',
      group: 'hero',
    }),
    defineField({
      name: 'heroImage',
      title: "Photo d'arrière-plan de la bannière",
      description: 'Photo qui apparaît derrière le grand titre. Format paysage recommandé.',
      type: 'image',
      options: { hotspot: true },
      group: 'hero',
    }),

    // — Notre histoire (about)
    defineField({
      name: 'aboutLabel',
      title: 'Petite étiquette',
      description: 'Texte court au-dessus du titre (ex. « Notre histoire »).',
      type: 'string',
      group: 'about',
    }),
    defineField({
      name: 'aboutTitle',
      title: 'Titre — première partie',
      description: 'Ex. « Le boulanger, » (la virgule fait partie du texte).',
      type: 'string',
      group: 'about',
    }),
    defineField({
      name: 'aboutTitleAccent',
      title: 'Titre — partie en couleur',
      description: 'Suite du titre, mise en valeur en orange (ex. « Benjamin Ramakers »).',
      type: 'string',
      group: 'about',
    }),
    defineField({
      name: 'aboutText',
      title: 'Texte de présentation',
      description:
        "Quelques paragraphes qui racontent l'histoire de la boulangerie. Vous pouvez mettre des mots en gras ou italique.",
      type: 'array',
      of: [{ type: 'block' }],
      group: 'about',
    }),
    defineField({
      name: 'aboutImage',
      title: 'Photo de présentation',
      description: 'Photo qui accompagne le texte de présentation.',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: "Description de l'image",
          description:
            "Décrivez ce qu'on voit (ex. « Benjamin pétrit la pâte »). Utilisé par les lecteurs d'écran et Google.",
          type: 'string',
        }),
      ],
      group: 'about',
    }),
    defineField({
      name: 'values',
      title: 'Nos valeurs (3 cartes)',
      description:
        'Trois petits encadrés qui mettent en avant ce qui rend votre pain spécial (fermentation, zéro gaspillage, etc.).',
      type: 'array',
      of: [{ type: 'valuePillar' }],
      group: 'about',
      validation: (R) => R.max(4),
    }),

    // — Section « Nos pains » (products)
    defineField({
      name: 'productsLabel',
      title: 'Petite étiquette',
      description: 'Texte court au-dessus du titre (ex. « Nos pains »).',
      type: 'string',
      group: 'products',
    }),
    defineField({
      name: 'productsTitle',
      title: 'Titre — première partie',
      description: 'Ex. « Cuits ».',
      type: 'string',
      group: 'products',
    }),
    defineField({
      name: 'productsTitleAccent',
      title: 'Titre — partie en couleur',
      description: 'Suite du titre, en orange (ex. « uniquement sur commande »).',
      type: 'string',
      group: 'products',
    }),
    defineField({
      name: 'productsSubtitle',
      title: 'Phrase sous le titre',
      description:
        'Une à deux phrases qui décrivent les pains. Apparaît au-dessus de la liste des produits.',
      type: 'text',
      rows: 3,
      group: 'products',
    }),
    defineField({
      name: 'saturdayNotice',
      title: 'Note du samedi',
      description:
        'Mention spéciale (ex. « Samedi uniquement : Croissants et pains au chocolat sur commande. »). Laisser vide pour ne rien afficher.',
      type: 'string',
      group: 'products',
    }),

    // — Section commande (order)
    defineField({
      name: 'orderLabel',
      title: 'Petite étiquette',
      description: 'Texte court au-dessus du titre (ex. « Commander »).',
      type: 'string',
      group: 'order',
    }),
    defineField({
      name: 'orderTitle',
      title: 'Titre — première partie',
      description: 'Ex. « Passez votre ».',
      type: 'string',
      group: 'order',
    }),
    defineField({
      name: 'orderTitleAccent',
      title: 'Titre — partie en couleur',
      description: 'Suite du titre, en orange (ex. « commande »).',
      type: 'string',
      group: 'order',
    }),
    defineField({
      name: 'orderSubtitle',
      title: 'Phrase sous le titre',
      description: "Une phrase qui guide le client (ex. « Sélectionnez vos pains, indiquez vos coordonnées, choisissez le jour de retrait. »).",
      type: 'text',
      rows: 3,
      group: 'order',
    }),
    defineField({
      name: 'orderNotice',
      title: 'Avertissement (délai, conditions…)',
      description:
        "Texte affiché dans un encadré au-dessus du formulaire (ex. « Commande au minimum 2 jours à l'avance. »).",
      type: 'text',
      rows: 3,
      group: 'order',
    }),

    // — Footer
    defineField({
      name: 'footerDescription',
      title: 'Texte du pied de page',
      description:
        'Petite phrase de présentation tout en bas de page, à côté du logo.',
      type: 'text',
      rows: 3,
      group: 'footer',
    }),
  ],
  preview: {
    prepare() {
      return { title: 'Textes du site' }
    },
  },
})
