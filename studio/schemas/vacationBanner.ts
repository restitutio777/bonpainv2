import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'vacationBanner',
  title: 'Bandeau vacances',
  type: 'document',
  fields: [
    defineField({
      name: 'isActive',
      title: 'Activer le bandeau',
      description:
        "Coche cette case pour afficher un bandeau de vacances en haut de toutes les pages du site.",
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'startDate',
      title: 'Premier jour de fermeture',
      description: "Date à partir de laquelle la boulangerie est fermée.",
      type: 'date',
    }),
    defineField({
      name: 'endDate',
      title: 'Dernier jour de fermeture',
      description: 'Date du dernier jour de fermeture (inclus).',
      type: 'date',
    }),
    defineField({
      name: 'messageFr',
      title: 'Message en français',
      description:
        "Texte affiché dans le bandeau (ex. « Boulangerie fermée du 15 au 18 février. »).",
      type: 'string',
    }),
    defineField({
      name: 'messageDe',
      title: 'Message en allemand (optionnel)',
      description: "Laisser vide si vous n'utilisez pas la version allemande.",
      type: 'string',
    }),
    defineField({
      name: 'emoji',
      title: 'Emoji (optionnel)',
      description: 'Petit symbole à côté du message (ex. 🌴, ❄️, 🥖).',
      type: 'string',
    }),
    defineField({
      name: 'disableOrdering',
      title: 'Désactiver les commandes pendant cette période',
      description:
        'Si activé, le formulaire de commande est masqué — les clients ne peuvent pas commander.',
      type: 'boolean',
      initialValue: false,
    }),
  ],
  preview: {
    select: { isActive: 'isActive', startDate: 'startDate', endDate: 'endDate', message: 'messageFr' },
    prepare({ isActive, startDate, endDate, message }) {
      return {
        title: 'Bandeau vacances',
        subtitle: isActive
          ? `Actif : ${startDate ?? '?'} → ${endDate ?? '?'}${message ? ` · ${message}` : ''}`
          : 'Inactif',
      }
    },
  },
})
