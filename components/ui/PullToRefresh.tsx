'use client'

import { useState, useRef, useCallback, ReactNode } from 'react'
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion'
import { RefreshCw } from 'lucide-react'

interface PullToRefreshProps {
  children: ReactNode
  onRefresh: () => Promise<void>
  className?: string
}

const PULL_THRESHOLD = 80
const MAX_PULL = 120

export default function PullToRefresh({
  children,
  onRefresh,
  className = ''
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isPulling, setIsPulling] = useState(false)
  const constraintsRef = useRef<HTMLDivElement>(null)
  
  const y = useMotionValue(0)
  const pullProgress = useTransform(y, [0, PULL_THRESHOLD], [0, 1])
  const rotateZ = useTransform(pullProgress, [0, 1], [0, 360])
  
  const handleDragStart = () => {
    setIsPulling(true)
  }
  
  const handleDragEnd = async (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsPulling(false)
    
    if (info.offset.y > PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
      }
    }
    
    y.set(0)
  }

  return (
    <div ref={constraintsRef} className={`relative overflow-hidden ${className}`}>
      {/* Pull indicator */}
      <motion.div
        className="absolute top-0 left-0 right-0 flex items-center justify-center bg-blue-50 border-b border-blue-100"
        style={{
          height: useTransform(y, [0, PULL_THRESHOLD], [0, 60]),
          opacity: useTransform(y, [0, 20], [0, 1])
        }}
      >
        <motion.div
          className="flex items-center space-x-2 text-blue-600"
          style={{ rotate: rotateZ }}
        >
          <RefreshCw className="h-5 w-5" />
          <span className="text-sm font-medium">
            {isRefreshing ? '更新中...' : isPulling ? '離して更新' : '引っ張って更新'}
          </span>
        </motion.div>
      </motion.div>

      {/* Content */}
      <motion.div
        drag="y"
        dragConstraints={constraintsRef}
        dragElastic={{ top: 0.5, bottom: 0 }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        style={{ y }}
        animate={isRefreshing ? { y: 60 } : undefined}
        transition={{
          type: 'spring',
          damping: 20,
          stiffness: 300
        }}
        className="relative z-10"
      >
        {children}
      </motion.div>
    </div>
  )
}