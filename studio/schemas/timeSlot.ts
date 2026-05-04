import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'timeSlot',
  title: 'Créneau horaire',
  type: 'object',
  fields: [
    defineField({
      name: 'open',
      title: 'Ouverture (HH:MM)',
      type: 'string',
      validation: (R) => R.required().regex(/^\d{1,2}:\d{2}$/, 'Format HH:MM'),
    }),
    defineField({
      name: 'close',
      title: 'Fermeture (HH:MM)',
      type: 'string',
      validation: (R) => R.required().regex(/^\d{1,2}:\d{2}$/, 'Format HH:MM'),
    }),
  ],
  preview: {
    select: { open: 'open', close: 'close' },
    prepare({ open, close }) {
      return { title: `${open} – ${close}` }
    },
  },
})
