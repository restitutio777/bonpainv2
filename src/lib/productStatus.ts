import type { SanityProduct } from '../types'

export type ProductStatusKind = 'unavailable' | 'info' | null

export interface ProductStatus {
  /** Whether the product can be ordered right now. */
  available: boolean
  /** Short label to show on the product card / order line, or null. */
  badge: string | null
  /** Visual treatment hint: 'unavailable' = warning style, 'info' = neutral. */
  kind: ProductStatusKind
}

/**
 * Compute the effective status for a product, combining:
 *   1. Seasonal date window (highest priority — if outside the window, product
 *      is unavailable and gets a clear badge).
 *   2. Manual `badge` field set in Sanity (if any).
 *   3. Saturday-only availability (auto-derived badge).
 *
 * The result is purely derived; the caller should use it to render the badge
 * and to disable the add-to-cart action when `available` is false.
 */
export function getProductStatus(
  product: SanityProduct,
  now: Date = new Date()
): ProductStatus {
  // 1. Seasonal — only when isSeasonal AND at least one bound is set.
  if (product.isSeasonal && (product.seasonStart || product.seasonEnd)) {
    const start = product.seasonStart ? new Date(product.seasonStart) : null
    const end = product.seasonEnd ? endOfDay(new Date(product.seasonEnd)) : null

    if (end && now > end) {
      return {
        available: false,
        badge: 'Saison terminée',
        kind: 'unavailable',
      }
    }
    if (start && now < start) {
      return {
        available: false,
        badge: `Disponible dès le ${formatDay(start)}`,
        kind: 'unavailable',
      }
    }
    // In season — fall through; manual badge / saturday rules can still apply.
  }

  // 2. Manual badge wins over the saturday auto-badge.
  if (product.badge) {
    return { available: true, badge: product.badge, kind: 'info' }
  }

  // 3. Saturday-only auto-badge.
  if (product.availability === 'saturday') {
    return { available: true, badge: 'Samedi uniquement', kind: 'info' }
  }

  return { available: true, badge: null, kind: null }
}

function endOfDay(d: Date): Date {
  const e = new Date(d)
  e.setHours(23, 59, 59, 999)
  return e
}

function formatDay(d: Date): string {
  // 20 mars, 6 avril, etc.
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
  }).format(d)
}
