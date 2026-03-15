import { createContext, useContext, ReactNode } from 'react'
import { useSanityQuery } from '../hooks/useSanity'
import {
  PRODUCTS_QUERY,
  SCHEDULE_QUERY,
  VACATION_QUERY,
  SITE_SETTINGS_QUERY,
  SITE_CONTENT_QUERY,
} from '../lib/queries'
import type {
  SanityProduct,
  ScheduleDay,
  VacationBanner,
  SiteSettings,
  SiteContent,
} from '../types'

interface SanityData {
  products: SanityProduct[]
  schedule: ScheduleDay[]
  vacation: VacationBanner | null
  settings: SiteSettings | null
  content: SiteContent | null
  loading: boolean
}

const SanityContext = createContext<SanityData>({
  products: [],
  schedule: [],
  vacation: null,
  settings: null,
  content: null,
  loading: true,
})

export function SanityProvider({ children }: { children: ReactNode }) {
  const { data: products, loading: l1 } = useSanityQuery<SanityProduct[]>(PRODUCTS_QUERY, [])
  const { data: schedule, loading: l2 } = useSanityQuery<ScheduleDay[]>(SCHEDULE_QUERY, [])
  const { data: vacation, loading: l3 } = useSanityQuery<VacationBanner | null>(VACATION_QUERY, null)
  const { data: settings, loading: l4 } = useSanityQuery<SiteSettings | null>(SITE_SETTINGS_QUERY, null)
  const { data: content, loading: l5 } = useSanityQuery<SiteContent | null>(SITE_CONTENT_QUERY, null)

  const loading = l1 || l2 || l3 || l4 || l5

  return (
    <SanityContext.Provider value={{ products, schedule, vacation, settings, content, loading }}>
      {children}
    </SanityContext.Provider>
  )
}

export function useSanity() {
  return useContext(SanityContext)
}
