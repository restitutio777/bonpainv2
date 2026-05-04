import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'vacationBanner',
  title: 'Bandeau vacances',
  type: 'document',
  fields: [
    defineField({
      name: 'isActive',
      title: 'Activer le bandeau',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'startDate',
      title: 'Date de début',
      type: 'date',
    }),
    defineField({
      name: 'endDate',
      title: 'Date de fin',
      type: 'date',
    }),
    defineField({
      name: 'messageFr',
      title: 'Message (FR)',
      type: 'string',
    }),
    defineField({
      name: 'messageDe',
      title: 'Message (DE)',
      type: 'string',
    }),
    defineField({
      name: 'emoji',
      title: 'Emoji',
      type: 'string',
    }),
    defineField({
      name: 'disableOrdering',
      title: 'Désactiver les commandes',
      type: 'boolean',
      initialValue: false,
    }),
  ],
  preview: {
    select: { isActive: 'isActive', startDate: 'startDate', endDate: 'endDate' },
    prepare({ isActive, startDate, endDate }) {
      return {
        title: 'Bandeau vacances',
        subtitle: isActive
          ? `Actif : ${startDate ?? '?'} → ${endDate ?? '?'}`
          : 'Inactif',
      }
    },
  },
})
