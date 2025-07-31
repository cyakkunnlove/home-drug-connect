'use client'

import { motion } from 'framer-motion'

interface LoadingSkeletonProps {
  className?: string
  lines?: number
  showAvatar?: boolean
}

const shimmerVariants = {
  initial: { x: '-100%' },
  animate: { x: '100%' },
}

const shimmerTransition = {
  repeat: Infinity,
  duration: 1.5,
  ease: 'linear'
}

function SkeletonBox({ className = '' }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-gray-200 rounded ${className}`}>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-40"
        variants={shimmerVariants}
        initial="initial"
        animate="animate"
        transition={shimmerTransition}
      />
    </div>
  )
}

export default function LoadingSkeleton({ 
  className = '', 
  lines = 3,
  showAvatar = false 
}: LoadingSkeletonProps) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="flex space-x-4">
        {showAvatar && (
          <SkeletonBox className="h-12 w-12 rounded-full flex-shrink-0" />
        )}
        <div className="flex-1 space-y-3">
          {Array.from({ length: lines }).map((_, index) => (
            <SkeletonBox
              key={index}
              className={`h-4 ${
                index === lines - 1 
                  ? 'w-3/4' 
                  : index === 0 
                    ? 'w-full' 
                    : 'w-5/6'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// Card skeleton for request/response items
export function RequestCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 animate-pulse">
      <div className="flex items-start space-x-3">
        <SkeletonBox className="h-10 w-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <SkeletonBox className="h-5 w-1/3" />
            <SkeletonBox className="h-5 w-16" />
          </div>
          <SkeletonBox className="h-4 w-2/3" />
          <SkeletonBox className="h-4 w-1/2" />
          <div className="flex space-x-2">
            <SkeletonBox className="h-8 w-20" />
            <SkeletonBox className="h-8 w-20" />
          </div>
        </div>
      </div>
    </div>
  )
}

// List skeleton
export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <RequestCardSkeleton key={index} />
      ))}
    </div>
  )
}