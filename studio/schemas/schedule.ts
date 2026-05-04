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
      title: 'Jour',
      type: 'string',
      options: { list: DAYS, layout: 'radio' },
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'isOpen',
      title: 'Ouvert ce jour',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'slots',
      title: 'Créneaux',
      type: 'array',
      of: [{ type: 'timeSlot' }],
      hidden: ({ document }) => !document?.isOpen,
    }),
    defineField({
      name: 'note',
      title: 'Note (optionnel)',
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
      title: 'Ordre',
      name: 'sortOrderAsc',
      by: [{ field: 'sortOrder', direction: 'asc' }],
    },
  ],
  preview: {
    select: { day: 'day', isOpen: 'isOpen' },
    prepare({ day, isOpen }) {
      const label = DAYS.find((d) => d.value === day)?.title || day
      return {
        title: label,
        subtitle: isOpen ? 'Ouvert' : 'Fermé',
      }
    },
  },
})
