import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'siteContent',
  title: 'Contenu de la page',
  type: 'document',
  groups: [
    { name: 'hero', title: 'Hero' },
    { name: 'about', title: 'À propos' },
    { name: 'products', title: 'Produits' },
    { name: 'order', title: 'Commande' },
    { name: 'footer', title: 'Pied de page' },
  ],
  fields: [
    // Hero
    defineField({ name: 'heroBadge', title: 'Badge hero', type: 'string', group: 'hero' }),
    defineField({ name: 'heroTitle', title: 'Titre hero', type: 'string', group: 'hero' }),
    defineField({ name: 'heroTitleAccent', title: 'Titre hero (accent)', type: 'string', group: 'hero' }),
    defineField({ name: 'heroSubtitle', title: 'Sous-titre hero', type: 'text', rows: 3, group: 'hero' }),
    defineField({ name: 'heroCtaPrimary', title: 'CTA principal', type: 'string', group: 'hero' }),
    defineField({ name: 'heroCtaSecondary', title: 'CTA secondaire', type: 'string', group: 'hero' }),
    defineField({
      name: 'heroImage',
      title: 'Image hero',
      type: 'image',
      options: { hotspot: true },
      group: 'hero',
    }),

    // About
    defineField({ name: 'aboutLabel', title: 'Label', type: 'string', group: 'about' }),
    defineField({ name: 'aboutTitle', title: 'Titre', type: 'string', group: 'about' }),
    defineField({ name: 'aboutTitleAccent', title: 'Titre (accent)', type: 'string', group: 'about' }),
    defineField({
      name: 'aboutText',
      title: 'Texte',
      type: 'array',
      of: [{ type: 'block' }],
      group: 'about',
    }),
    defineField({
      name: 'aboutImage',
      title: 'Image',
      type: 'image',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Texte alternatif', type: 'string' })],
      group: 'about',
    }),
    defineField({
      name: 'values',
      title: 'Valeurs',
      type: 'array',
      of: [{ type: 'valuePillar' }],
      group: 'about',
    }),

    // Products section
    defineField({ name: 'productsLabel', title: 'Label', type: 'string', group: 'products' }),
    defineField({ name: 'productsTitle', title: 'Titre', type: 'string', group: 'products' }),
    defineField({ name: 'productsTitleAccent', title: 'Titre (accent)', type: 'string', group: 'products' }),
    defineField({ name: 'productsSubtitle', title: 'Sous-titre', type: 'text', rows: 3, group: 'products' }),
    defineField({ name: 'saturdayNotice', title: 'Note du samedi', type: 'string', group: 'products' }),

    // Order section
    defineField({ name: 'orderLabel', title: 'Label', type: 'string', group: 'order' }),
    defineField({ name: 'orderTitle', title: 'Titre', type: 'string', group: 'order' }),
    defineField({ name: 'orderTitleAccent', title: 'Titre (accent)', type: 'string', group: 'order' }),
    defineField({ name: 'orderSubtitle', title: 'Sous-titre', type: 'text', rows: 3, group: 'order' }),
    defineField({ name: 'orderNotice', title: 'Avis (délai, etc.)', type: 'text', rows: 3, group: 'order' }),

    // Footer
    defineField({ name: 'footerDescription', title: 'Description du pied de page', type: 'text', rows: 3, group: 'footer' }),
  ],
  preview: {
    prepare() {
      return { title: 'Contenu de la page' }
    },
  },
})
