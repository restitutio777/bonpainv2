import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'siteSettings',
  title: 'Réglages du site',
  type: 'document',
  groups: [
    { name: 'identity', title: 'Identité' },
    { name: 'contact', title: 'Contact' },
    { name: 'partners', title: 'Partenaires' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({ name: 'bakeryName', title: 'Nom de la boulangerie', type: 'string', group: 'identity' }),
    defineField({ name: 'bakeryTagline', title: 'Slogan', type: 'string', group: 'identity' }),
    defineField({ name: 'ownerName', title: 'Propriétaire', type: 'string', group: 'identity' }),
    defineField({ name: 'vatNumber', title: 'N° TVA', type: 'string', group: 'identity' }),
    defineField({ name: 'email', title: 'Email', type: 'string', group: 'contact' }),
    defineField({ name: 'phone', title: 'Téléphone', type: 'string', group: 'contact' }),
    defineField({ name: 'address', title: 'Adresse', type: 'address', group: 'contact' }),
    defineField({
      name: 'orderLeadDays',
      title: 'Délai de commande (jours)',
      type: 'number',
      initialValue: 2,
      group: 'contact',
    }),
    defineField({ name: 'facebookUrl', title: 'Facebook', type: 'url', group: 'contact' }),
    defineField({ name: 'instagramUrl', title: 'Instagram', type: 'url', group: 'contact' }),
    defineField({
      name: 'partnerStores',
      title: 'Points de vente partenaires',
      type: 'array',
      of: [{ type: 'partnerStore' }],
      group: 'partners',
    }),
    defineField({ name: 'seoTitle', title: 'Titre SEO', type: 'string', group: 'seo' }),
    defineField({ name: 'seoDescription', title: 'Description SEO', type: 'text', rows: 3, group: 'seo' }),
    defineField({
      name: 'seoImage',
      title: 'Image partage (Facebook/Twitter)',
      type: 'image',
      options: { hotspot: true },
      group: 'seo',
    }),
  ],
  preview: {
    select: { title: 'bakeryName' },
    prepare({ title }) {
      return { title: title || 'Réglages du site' }
    },
  },
})
