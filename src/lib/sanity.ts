import { createClient } from '@sanity/client'

export const sanityClient = createClient({
  projectId: '5f1udd5l',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
})
