import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'timeSlot',
  title: 'Plage horaire',
  type: 'object',
  fields: [
    defineField({
      name: 'open',
      title: 'Heure d\'ouverture',
      description: 'Format 24 h, ex. « 8:00 ».',
      type: 'string',
      validation: (R) =>
        R.required().regex(/^\d{1,2}:\d{2}$/, {
          name: 'time',
          invert: false,
        }).error('Format attendu : HH:MM (ex. 8:00 ou 13:30)'),
    }),
    defineField({
      name: 'close',
      title: 'Heure de fermeture',
      description: 'Format 24 h, ex. « 12:00 ».',
      type: 'string',
      validation: (R) =>
        R.required().regex(/^\d{1,2}:\d{2}$/, {
          name: 'time',
          invert: false,
        }).error('Format attendu : HH:MM (ex. 12:00 ou 15:30)'),
    }),
  ],
  preview: {
    select: { open: 'open', close: 'close' },
    prepare({ open, close }) {
      return { title: open && close ? `${open} – ${close}` : 'Plage horaire' }
    },
  },
})
