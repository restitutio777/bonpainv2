export interface SanityProduct {
  _id: string
  name: string
  slug: string
  category: 'bread' | 'viennoiserie' | 'specialty' | 'tart'
  description: string
  price: number
  image: string | null
  imageAlt: string | null
  availability: 'all' | 'saturday' | 'on_order'
  isSeasonal: boolean
  seasonStart: string | null
  seasonEnd: string | null
  hasModal: boolean
  modalTitleFr: string | null
  modalTitleDe: string | null
  modalSubtitleFr: string | null
  modalSubtitleDe: string | null
  modalBodyFr: any[] | null
  modalBodyDe: any[] | null
  badge: string | null
  orderInForm: boolean
  sortOrder: number
}

export interface ScheduleDay {
  _id: string
  day: string
  isOpen: boolean
  slots: { open: string; close: string }[] | null
  note: string | null
  sortOrder: number
}

export interface VacationBanner {
  isActive: boolean
  startDate: string | null
  endDate: string | null
  messageFr: string
  messageDe: string | null
  emoji: string | null
  disableOrdering: boolean
}

export interface SiteSettings {
  bakeryName: string
  bakeryTagline: string | null
  ownerName: string | null
  vatNumber: string | null
  email: string
  phone: string | null
  address: {
    street: string
    postalCode: string
    city: string
    country: string
  }
  orderLeadDays: number
  facebookUrl: string | null
  instagramUrl: string | null
  partnerStores: { name: string; city: string; url: string | null }[]
  seoTitle: string | null
  seoDescription: string | null
  seoImage: string | null
}

export interface ValuePillar {
  title: string
  description: string
  icon: string
}

export interface SiteContent {
  heroBadge: string | null
  heroTitle: string
  heroTitleAccent: string | null
  heroSubtitle: string | null
  heroCtaPrimary: string
  heroCtaSecondary: string | null
  heroImage: string | null
  aboutLabel: string | null
  aboutTitle: string
  aboutTitleAccent: string | null
  aboutText: any[] | null
  aboutImage: string | null
  aboutImageAlt: string | null
  values: ValuePillar[]
  productsLabel: string | null
  productsTitle: string
  productsTitleAccent: string | null
  productsSubtitle: string | null
  saturdayNotice: string | null
  orderLabel: string | null
  orderTitle: string
  orderTitleAccent: string | null
  orderSubtitle: string | null
  orderNotice: string | null
  footerDescription: string | null
}

export type Lang = 'fr' | 'de'
