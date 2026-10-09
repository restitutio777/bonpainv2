import { createClient } from '@sanity/client'
import { createImageUrlBuilder } from '@sanity/image-url'
import type { SanityImageSource } from '@sanity/image-url'

// Public read only, deliberately without a token: Vite inlines every VITE_*
// variable into the public bundle, so a token here would be readable by
// anyone. Write access belongs in studio/scripts (SANITY_WRITE_TOKEN).
export const sanityClient = createClient({
  projectId: import.meta.env.VITE_SANITY_PROJECT_ID || '5f1udd5l',
  dataset: import.meta.env.VITE_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
})

const builder = createImageUrlBuilder(sanityClient)

/**
 * Build an image URL that respects the document's crop + hotspot.
 * Pass the full image object (with asset reference) — NOT just an asset URL.
 *
 *   urlFor(product.image).width(800).height(600).fit('crop').url()
 */
export function urlFor(source: SanityImageSource) {
  return builder.image(source)
}

/**
 * srcset for a plain cdn.sanity.io asset URL (asset->url in a query). Sanity
 * resizes and picks AVIF/WebP per browser. Widths beyond the original (its
 * size is part of the file name) are dropped, so no candidate promises more
 * pixels than the file has.
 */
export function sanitySrcSet(assetUrl: string, widths: number[], quality = 75) {
  const original = Number(assetUrl.match(/-(\d+)x\d+\.\w+$/)?.[1]) || Infinity
  const list = widths.filter((w) => w < original)
  if (list.length < widths.length) list.push(original)
  return list
    .map((w) => `${assetUrl}?w=${w}&auto=format&fit=max&q=${quality} ${w}w`)
    .join(', ')
}
