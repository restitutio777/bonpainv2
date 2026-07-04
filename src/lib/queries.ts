export const PRODUCTS_QUERY = `*[_type == "product" && isActive == true] | order(sortOrder asc) {
  _id,
  name,
  "slug": slug.current,
  category,
  description,
  price,
  image,
  "imageAlt": image.alt,
  availability,
  isSeasonal,
  seasonStart,
  seasonEnd,
  hasModal,
  modalTitleFr,
  modalTitleDe,
  modalSubtitleFr,
  modalSubtitleDe,
  modalBodyFr,
  modalBodyDe,
  badge,
  orderInForm,
  sortOrder
}`

export const SCHEDULE_QUERY = `*[_type == "schedule"] | order(sortOrder asc) {
  _id,
  day,
  isOpen,
  slots[] { open, close },
  note,
  sortOrder
}`

export const VACATION_QUERY = `*[_type == "vacationBanner"][0] {
  isActive,
  startDate,
  endDate,
  messageFr,
  messageDe,
  emoji,
  disableOrdering
}`

export const SITE_SETTINGS_QUERY = `*[_type == "siteSettings"][0] {
  bakeryName,
  bakeryTagline,
  ownerName,
  vatNumber,
  email,
  phone,
  address { street, postalCode, city, country },
  orderLeadDays,
  facebookUrl,
  instagramUrl,
  partnerStores[] { name, city, url },
  seoTitle,
  seoDescription,
  "seoImage": seoImage.asset->url + "?w=1200&h=630&auto=format&fit=crop&q=80"
}`

export const SITE_CONTENT_QUERY = `*[_type == "siteContent"][0] {
  heroBadge,
  heroTitle,
  heroTitleAccent,
  heroSubtitle,
  heroCtaPrimary,
  heroCtaSecondary,
  "heroImage": heroImage.asset->url + "?w=1920&auto=format&fit=max&q=75",
  aboutLabel,
  aboutTitle,
  aboutTitleAccent,
  aboutText,
  "aboutImage": aboutImage.asset->url + "?w=1000&auto=format&fit=max&q=75",
  "aboutImageAlt": aboutImage.alt,
  productsLabel,
  productsTitle,
  productsTitleAccent,
  productsSubtitle,
  saturdayNotice,
  orderLabel,
  orderTitle,
  orderTitleAccent,
  orderSubtitle,
  orderNotice,
  footerDescription
}`
