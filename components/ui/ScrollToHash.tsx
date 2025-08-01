'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function ScrollToHash() {
  const pathname = usePathname()

  useEffect(() => {
    // URLにハッシュがある場合、その要素までスクロール
    const hash = window.location.hash
    if (hash) {
      setTimeout(() => {
        const element = document.querySelector(hash)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
    }
  }, [pathname])

  return null
}