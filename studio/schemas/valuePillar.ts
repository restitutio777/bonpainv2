import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'valuePillar',
  title: 'Valeur',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Titre court',
      description: 'Ex. « Fermentation lente », « Zéro gaspillage ».',
      type: 'string',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      description: 'Une à deux phrases qui expliquent pourquoi cette valeur est importante.',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'icon',
      title: 'Icône',
      description:
        "Nom d'une icône Lucide (ex. clock, shield, map-pin, leaf, heart). Voir lucide.dev/icons pour la liste.",
      type: 'string',
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'icon' },
    prepare({ title, subtitle }) {
      return {
        title: title || 'Valeur',
        subtitle: subtitle ? `Icône : ${subtitle}` : undefined,
      }
    },
  },
})
