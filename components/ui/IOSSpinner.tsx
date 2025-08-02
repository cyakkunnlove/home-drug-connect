'use client'

import { motion } from 'framer-motion'

interface IOSSpinnerProps {
  size?: 'small' | 'medium' | 'large'
  color?: string
  className?: string
}

export default function IOSSpinner({ 
  size = 'medium', 
  color = 'text-gray-400',
  className = '' 
}: IOSSpinnerProps) {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-6 w-6',
    large: 'h-8 w-8'
  }

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {Array.from({ length: 12 }).map((_, index) => (
        <motion.div
          key={index}
          className={`absolute inset-0 ${color}`}
          initial={{ opacity: 0.3 }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: index * 0.1,
            ease: 'easeInOut'
          }}
        >
          <div
            className="h-full w-full"
            style={{
              transform: `rotate(${index * 30}deg)`,
              transformOrigin: 'center'
            }}
          >
            <div 
              className="h-2 w-0.5 bg-current rounded-full"
              style={{
                margin: '0 auto',
                transform: 'translateY(-50%)'
              }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// Full page loading overlay
export function IOSLoadingOverlay({ message = 'Loading...' }: { message?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl p-6 shadow-xl flex flex-col items-center space-y-4"
      >
        <IOSSpinner size="large" color="text-blue-600" />
        <p className="text-sm font-medium text-gray-700">{message}</p>
      </motion.div>
    </motion.div>
  )
}

// Inline loading state
export function IOSInlineLoader({ text = 'Loading' }: { text?: string }) {
  return (
    <div className="flex items-center space-x-2">
      <IOSSpinner size="small" />
      <span className="text-sm text-gray-600">{text}</span>
    </div>
  )
}