import type { StructureResolver } from 'sanity/structure'

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Contenu')
    .items([
      S.listItem()
        .title('Réglages du site')
        .id('siteSettings')
        .child(
          S.document()
            .schemaType('siteSettings')
            .documentId('siteSettings')
            .title('Réglages du site')
        ),
      S.listItem()
        .title('Contenu de la page')
        .id('siteContent')
        .child(
          S.document()
            .schemaType('siteContent')
            .documentId('siteContent')
            .title('Contenu de la page')
        ),
      S.listItem()
        .title('Bandeau vacances')
        .id('vacationBanner')
        .child(
          S.document()
            .schemaType('vacationBanner')
            .documentId('vacationBanner')
            .title('Bandeau vacances')
        ),
      S.divider(),
      S.documentTypeListItem('product').title('Produits'),
      S.documentTypeListItem('schedule').title('Horaires'),
    ])
