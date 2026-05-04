import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'product',
  title: 'Produit',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Nom',
      type: 'string',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name', maxLength: 96 },
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'category',
      title: 'Catégorie',
      type: 'string',
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
      type: 'string',
      validation: (R) => R.max(140),
    }),
    defineField({
      name: 'price',
      title: 'Prix (€)',
      type: 'number',
      validation: (R) => R.required().min(0),
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Texte alternatif',
          type: 'string',
        }),
      ],
    }),
    defineField({
      name: 'availability',
      title: 'Disponibilité',
      type: 'string',
      options: {
        list: [
          { title: 'Toujours disponible', value: 'all' },
          { title: 'Samedi uniquement', value: 'saturday' },
          { title: 'Sur commande', value: 'on_order' },
        ],
        layout: 'radio',
      },
      initialValue: 'all',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'isActive',
      title: 'Actif (visible sur le site)',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'isSeasonal',
      title: 'Produit saisonnier',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'seasonStart',
      title: 'Début de saison',
      type: 'date',
      hidden: ({ document }) => !document?.isSeasonal,
    }),
    defineField({
      name: 'seasonEnd',
      title: 'Fin de saison',
      type: 'date',
      hidden: ({ document }) => !document?.isSeasonal,
    }),
    defineField({
      name: 'badge',
      title: 'Badge (ex. Nouveau, Bio)',
      type: 'string',
    }),
    defineField({
      name: 'orderInForm',
      title: 'Disponible dans le formulaire de commande',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'sortOrder',
      title: 'Ordre d\'affichage',
      type: 'number',
      initialValue: 100,
    }),
    defineField({
      name: 'hasModal',
      title: 'Activer la fiche détaillée',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'modalTitleFr',
      title: 'Titre fiche (FR)',
      type: 'string',
      hidden: ({ document }) => !document?.hasModal,
    }),
    defineField({
      name: 'modalTitleDe',
      title: 'Titre fiche (DE)',
      type: 'string',
      hidden: ({ document }) => !document?.hasModal,
    }),
    defineField({
      name: 'modalSubtitleFr',
      title: 'Sous-titre fiche (FR)',
      type: 'string',
      hidden: ({ document }) => !document?.hasModal,
    }),
    defineField({
      name: 'modalSubtitleDe',
      title: 'Sous-titre fiche (DE)',
      type: 'string',
      hidden: ({ document }) => !document?.hasModal,
    }),
    defineField({
      name: 'modalBodyFr',
      title: 'Texte fiche (FR)',
      type: 'array',
      of: [{ type: 'block' }],
      hidden: ({ document }) => !document?.hasModal,
    }),
    defineField({
      name: 'modalBodyDe',
      title: 'Texte fiche (DE)',
      type: 'array',
      of: [{ type: 'block' }],
      hidden: ({ document }) => !document?.hasModal,
    }),
  ],
  orderings: [
    {
      title: 'Ordre d\'affichage',
      name: 'sortOrderAsc',
      by: [{ field: 'sortOrder', direction: 'asc' }],
    },
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'category',
      media: 'image',
      isActive: 'isActive',
    },
    prepare({ title, subtitle, media, isActive }) {
      return {
        title,
        subtitle: `${subtitle}${isActive === false ? ' • inactif' : ''}`,
        media,
      }
    },
  },
})
