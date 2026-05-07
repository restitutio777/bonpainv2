import type { StructureResolver } from 'sanity/structure'

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Bon Pain Fait Main')
    .items([
      S.listItem()
        .title('Mon entreprise')
        .icon(() => '🏷️')
        .id('siteSettings')
        .child(
          S.document()
            .schemaType('siteSettings')
            .documentId('siteSettings')
            .title('Mon entreprise')
        ),
      S.listItem()
        .title('Textes du site')
        .icon(() => '✏️')
        .id('siteContent')
        .child(
          S.document()
            .schemaType('siteContent')
            .documentId('siteContent')
            .title('Textes du site')
        ),
      S.listItem()
        .title('Bandeau vacances')
        .icon(() => '🌴')
        .id('vacationBanner')
        .child(
          S.document()
            .schemaType('vacationBanner')
            .documentId('vacationBanner')
            .title('Bandeau vacances')
        ),
      S.divider(),
      S.documentTypeListItem('product')
        .title('Produits')
        .icon(() => '🥖'),
      S.documentTypeListItem('schedule')
        .title('Horaires')
        .icon(() => '🕐'),
    ])
