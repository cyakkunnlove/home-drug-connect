'use client'

import { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { usePathname } from 'next/navigation'

export default function Template({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, x: 20 }}
        animate={{ 
          opacity: 1, 
          x: 0,
          transition: {
            duration: 0.3,
            ease: [0.25, 0.1, 0.25, 1] // iOS-like easing
          }
        }}
        exit={{ 
          opacity: 0, 
          x: -20,
          transition: {
            duration: 0.2,
            ease: [0.25, 0.1, 0.25, 1]
          }
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}