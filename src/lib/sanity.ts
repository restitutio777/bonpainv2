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
