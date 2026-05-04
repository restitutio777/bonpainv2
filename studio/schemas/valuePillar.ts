import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'valuePillar',
  title: 'Valeur',
  type: 'object',
  fields: [
    defineField({ name: 'title', title: 'Titre', type: 'string', validation: (R) => R.required() }),
    defineField({ name: 'description', title: 'Description', type: 'text', rows: 3 }),
    defineField({
      name: 'icon',
      title: 'Icône',
      type: 'string',
      description: 'Nom Lucide (ex. clock, shield, map-pin, leaf, heart)',
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'icon' },
  },
})
