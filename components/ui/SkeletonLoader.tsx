'use client'

import { motion } from 'framer-motion'

interface SkeletonLoaderProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular' | 'card'
  width?: string | number
  height?: string | number
  count?: number
}

export default function SkeletonLoader({ 
  className = '', 
  variant = 'text', 
  width, 
  height,
  count = 1 
}: SkeletonLoaderProps) {
  const baseClasses = "relative overflow-hidden bg-gray-200"
  
  const variantClasses = {
    text: 'rounded h-4 w-full',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
    card: 'rounded-xl'
  }

  const shimmerAnimation = {
    initial: { x: '-100%' },
    animate: { x: '100%' },
    transition: { 
      repeat: Infinity, 
      duration: 1.5,
      ease: 'easeInOut'
    }
  }

  const renderSkeleton = () => (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={{ 
        width: width || (variant === 'circular' ? 40 : '100%'), 
        height: height || (variant === 'circular' ? 40 : variant === 'card' ? 120 : 16) 
      }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        initial="initial"
        animate="animate"
        variants={shimmerAnimation}
      />
    </div>
  )

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={count > 1 ? 'mb-2' : ''}>
          {renderSkeleton()}
        </div>
      ))}
    </>
  )
}

// 特定用途のスケルトンコンポーネント
export function RequestCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3">
          <SkeletonLoader variant="circular" width={40} height={40} />
          <div className="flex-1">
            <SkeletonLoader width={120} height={20} className="mb-2" />
            <SkeletonLoader width={80} height={14} />
          </div>
        </div>
        <SkeletonLoader width={60} height={24} className="rounded-full" />
      </div>
      
      <div className="space-y-3">
        <div className="bg-gray-50 rounded-lg p-3">
          <SkeletonLoader width={180} height={16} className="mb-2" />
          <SkeletonLoader count={2} height={14} />
        </div>
        
        <div className="bg-gray-50 rounded-lg p-3">
          <SkeletonLoader width={150} height={16} className="mb-2" />
          <SkeletonLoader count={3} height={14} />
        </div>
      </div>
      
      <div className="mt-4 flex justify-end">
        <SkeletonLoader variant="rectangular" width={100} height={36} />
      </div>
    </div>
  )
}

export function PharmacyCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
      <SkeletonLoader variant="rectangular" height={200} className="rounded-none" />
      <div className="p-4">
        <SkeletonLoader width={200} height={24} className="mb-2" />
        <SkeletonLoader width={150} height={16} className="mb-3" />
        <div className="flex gap-2">
          <SkeletonLoader variant="rectangular" width={80} height={28} />
          <SkeletonLoader variant="rectangular" width={80} height={28} />
          <SkeletonLoader variant="rectangular" width={80} height={28} />
        </div>
      </div>
    </div>
  )
}