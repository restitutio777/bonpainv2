import { createClient } from '@sanity/client'

const token = import.meta.env.VITE_SANITY_TOKEN

export const sanityClient = createClient({
  projectId: import.meta.env.VITE_SANITY_PROJECT_ID || '5f1udd5l',
  dataset: import.meta.env.VITE_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: !token,
  ...(token ? { token } : {}),
})
