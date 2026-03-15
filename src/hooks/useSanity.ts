import { useState, useEffect } from 'react'
import { sanityClient } from '../lib/sanity'

export function useSanityQuery<T>(query: string, fallback: T): { data: T; loading: boolean } {
  const [data, setData] = useState<T>(fallback)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    sanityClient
      .fetch<T>(query)
      .then((result) => {
        if (result !== null && result !== undefined) {
          setData(result)
        }
      })
      .catch((err) => console.error('Sanity fetch error:', err))
      .finally(() => setLoading(false))
  }, [query])

  return { data, loading }
}
