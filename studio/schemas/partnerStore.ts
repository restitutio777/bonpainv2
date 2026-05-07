import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'partnerStore',
  title: 'Point de vente partenaire',
  type: 'object',
  fields: [
    defineField({
      name: 'name',
      title: "Nom de l'épicerie",
      description: "Ex. « L'Épicerie am Eck ».",
      type: 'string',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'city',
      title: 'Ville',
      type: 'string',
    }),
    defineField({
      name: 'url',
      title: 'Site web (optionnel)',
      description: "Lien complet (https://...). Laisser vide si pas de site.",
      type: 'url',
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'city' },
  },
})
