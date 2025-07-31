'use client'

import { useEffect, useState } from 'react'
import SearchPageWithMap from './SearchPageWithMap'
import SearchPageMobile from './SearchPageMobile'

export default function SearchPage() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return isMobile ? <SearchPageMobile /> : <SearchPageWithMap />
}