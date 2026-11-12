import type { MetadataRoute } from 'next'
import { publicEnv } from '@/lib/env'
import { buildRobots } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  return buildRobots(publicEnv().NEXT_PUBLIC_SITE_URL)
}
