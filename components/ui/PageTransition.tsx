'use client'

import { ReactNode, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'

interface PageTransitionProps {
  children: ReactNode
}

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()
  const [displayChildren, setDisplayChildren] = useState(children)
  const [transitionStage, setTransitionStage] = useState('idle')

  useEffect(() => {
    setTransitionStage('fade-out')
  }, [pathname])

  useEffect(() => {
    if (children !== displayChildren && transitionStage === 'fade-out') {
      setTransitionStage('fade-in')
      setDisplayChildren(children)
    }
  }, [children, displayChildren, transitionStage])

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{
          type: 'spring',
          stiffness: 350,
          damping: 30,
          mass: 0.8
        }}
        onAnimationComplete={() => {
          if (transitionStage === 'fade-in') {
            setTransitionStage('idle')
          }
        }}
      >
        {displayChildren}
      </motion.div>
    </AnimatePresence>
  )
}

// iOS-style slide transition
export function IOSPageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()
  
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '-20%' }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
          mass: 0.8
        }}
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%'
        }}
      >
        <motion.div
          initial={{ opacity: 0.3 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0.3 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Fade transition for modals
export function FadeTransition({ children, show }: { children: ReactNode; show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Scale transition for cards
export function ScaleTransition({ children }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      transition={{
        type: 'spring',
        stiffness: 350,
        damping: 25
      }}
    >
      {children}
    </motion.div>
  )
}