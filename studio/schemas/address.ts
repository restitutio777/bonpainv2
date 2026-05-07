import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'address',
  title: 'Adresse',
  type: 'object',
  fields: [
    defineField({
      name: 'street',
      title: 'Rue et numéro',
      description: 'Ex. « Rue de la Roer 19 ».',
      type: 'string',
    }),
    defineField({
      name: 'postalCode',
      title: 'Code postal',
      description: 'Ex. « 4950 ».',
      type: 'string',
    }),
    defineField({
      name: 'city',
      title: 'Ville',
      description: 'Ex. « Waimes ».',
      type: 'string',
    }),
    defineField({
      name: 'country',
      title: 'Pays',
      type: 'string',
      initialValue: 'Belgique',
    }),
  ],
  preview: {
    select: { street: 'street', postalCode: 'postalCode', city: 'city' },
    prepare({ street, postalCode, city }) {
      const parts = [street, [postalCode, city].filter(Boolean).join(' ')].filter(Boolean)
      return {
        title: parts.join(', ') || 'Adresse',
      }
    },
  },
})
