import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'address',
  title: 'Adresse',
  type: 'object',
  fields: [
    defineField({ name: 'street', title: 'Rue', type: 'string' }),
    defineField({ name: 'postalCode', title: 'Code postal', type: 'string' }),
    defineField({ name: 'city', title: 'Ville', type: 'string' }),
    defineField({ name: 'country', title: 'Pays', type: 'string', initialValue: 'Belgique' }),
  ],
})
