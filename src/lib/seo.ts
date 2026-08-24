import { useEffect } from 'react'
import type { ScheduleDay, SiteSettings } from '../types'
import { dayIndex } from './schedule'

const DAY_SCHEMA_ORG: Record<number, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
}

function setMeta(selector: string, content: string) {
  const el = document.head.querySelector<HTMLMetaElement>(selector)
  if (el) el.setAttribute('content', content)
}

function normalizeTime(t: string): string | null {
  const m = t.trim().match(/^(\d{1,2})[:hH](\d{2})?$/)
  if (!m) return null
  return `${String(parseInt(m[1], 10)).padStart(2, '0')}:${m[2] ?? '00'}`
}

/**
 * Keep the head in sync with what the baker edits in the studio.
 *
 * The static tags in index.html stay as-is — social scrapers never run JS, so
 * they remain the source of truth for link previews. This only upgrades what
 * search engines (which do render) and the browser tab show, plus the opening
 * hours in the Bakery JSON-LD, which would otherwise go stale the moment
 * Benjamin changes a slot in the studio.
 */
export function useSeo(settings: SiteSettings | null, schedule: ScheduleDay[]) {
  const seoTitle = settings?.seoTitle || null
  const seoDescription = settings?.seoDescription || null

  useEffect(() => {
    if (seoTitle) {
      document.title = seoTitle
      setMeta('meta[property="og:title"]', seoTitle)
    }
    if (seoDescription) {
      setMeta('meta[name="description"]', seoDescription)
      setMeta('meta[property="og:description"]', seoDescription)
    }
  }, [seoTitle, seoDescription])

  useEffect(() => {
    const script = document.getElementById('ld-bakery')
    if (!script || schedule.length === 0) return

    const hours = schedule
      .filter((s) => s.isOpen && s.slots && s.slots.length > 0)
      .flatMap((s) => {
        const idx = dayIndex(s.day)
        if (idx === undefined) return []
        return (s.slots || []).flatMap((slot) => {
          const opens = normalizeTime(slot.open)
          const closes = normalizeTime(slot.close)
          if (!opens || !closes) return []
          return [
            {
              '@type': 'OpeningHoursSpecification',
              dayOfWeek: DAY_SCHEMA_ORG[idx],
              opens,
              closes,
            },
          ]
        })
      })

    if (hours.length === 0) return

    try {
      const data = JSON.parse(script.textContent || '{}')
      data.openingHoursSpecification = hours
      script.textContent = JSON.stringify(data)
    } catch {
      // Malformed base JSON-LD — leave it untouched rather than replacing it.
    }
  }, [schedule])
}
