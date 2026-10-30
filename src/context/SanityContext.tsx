import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { sanityFetch } from '../lib/sanity'
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

type Snapshot = Omit<SanityData, 'loading'>

const EMPTY: Snapshot = { products: [], schedule: [], vacation: null, settings: null, content: null }

// One request instead of five: on a phone every extra round trip to the
// Sanity CDN showed up as seconds of "Chargement...".
const ALL_QUERY = `{
  "products": ${PRODUCTS_QUERY},
  "schedule": ${SCHEDULE_QUERY},
  "vacation": ${VACATION_QUERY},
  "settings": ${SITE_SETTINGS_QUERY},
  "content": ${SITE_CONTENT_QUERY}
}`

// The last answer is kept on the device and shown at once on the next visit
// (installed app above all), then replaced by the fresh one. The key carries
// the query length so a changed query never reads an old shape.
const CACHE_KEY = `bonpain:sanity:${ALL_QUERY.length}`

function readCache(): Snapshot | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? (JSON.parse(raw) as Snapshot) : null
  } catch {
    return null
  }
}

function writeCache(data: Snapshot) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data))
  } catch {
    // Private mode or full storage: the site works without the cache.
  }
}

const SanityContext = createContext<SanityData>({ ...EMPTY, loading: true })

export function SanityProvider({ children }: { children: ReactNode }) {
  const [cached] = useState(readCache)
  const [data, setData] = useState<Snapshot>(cached ?? EMPTY)
  const [loading, setLoading] = useState(!cached)

  useEffect(() => {
    sanityFetch<Snapshot>(ALL_QUERY)
      .then((result) => {
        const fresh: Snapshot = {
          products: result?.products ?? [],
          schedule: result?.schedule ?? [],
          vacation: result?.vacation ?? null,
          settings: result?.settings ?? null,
          content: result?.content ?? null,
        }
        setData(fresh)
        writeCache(fresh)
      })
      .catch((err) => console.error('Sanity fetch error:', err))
      .finally(() => setLoading(false))
  }, [])

  return <SanityContext.Provider value={{ ...data, loading }}>{children}</SanityContext.Provider>
}

export function useSanity() {
  return useContext(SanityContext)
}
