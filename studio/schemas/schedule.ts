import { defineType, defineField } from 'sanity'

const DAYS = [
  { title: 'Lundi', value: 'monday' },
  { title: 'Mardi', value: 'tuesday' },
  { title: 'Mercredi', value: 'wednesday' },
  { title: 'Jeudi', value: 'thursday' },
  { title: 'Vendredi', value: 'friday' },
  { title: 'Samedi', value: 'saturday' },
  { title: 'Dimanche', value: 'sunday' },
]

export default defineType({
  name: 'schedule',
  title: 'Horaire',
  type: 'document',
  fields: [
    defineField({
      name: 'day',
      title: 'Jour de la semaine',
      type: 'string',
      options: { list: DAYS, layout: 'radio' },
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'isOpen',
      title: 'Ouvert ce jour',
      description:
        "Si décoché, ce jour apparaît comme fermé sur le site et les créneaux ci-dessous sont ignorés.",
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'slots',
      title: 'Plages horaires',
      description:
        'Une ou plusieurs plages d\'ouverture (ex. 8:00–12:00 puis 13:00–15:00).',
      type: 'array',
      of: [{ type: 'timeSlot' }],
      hidden: ({ document }) => !document?.isOpen,
      validation: (R) =>
        R.custom((slots, ctx) => {
          const doc = ctx.document as { isOpen?: boolean } | undefined
          if (doc?.isOpen && (!slots || (slots as unknown[]).length === 0)) {
            return 'Ajoutez au moins une plage horaire ou décochez « Ouvert ce jour ».'
          }
          return true
        }),
    }),
    defineField({
      name: 'note',
      title: 'Mention spéciale (optionnel)',
      description:
        'Affichée à côté de l\'horaire (ex. « Pains & Viennoiseries » pour le samedi).',
      type: 'string',
    }),
    defineField({
      name: 'sortOrder',
      title: 'Ordre',
      type: 'number',
      hidden: true,
      initialValue: 1,
    }),
  ],
  orderings: [
    {
      title: 'Ordre des jours',
      name: 'sortOrderAsc',
      by: [{ field: 'sortOrder', direction: 'asc' }],
    },
  ],
  preview: {
    select: { day: 'day', isOpen: 'isOpen', note: 'note' },
    prepare({ day, isOpen, note }) {
      const label = DAYS.find((d) => d.value === day)?.title || day
      return {
        title: label,
        subtitle: isOpen ? `Ouvert${note ? ` · ${note}` : ''}` : 'Fermé',
      }
    },
  },
})
