'use client'

import { motion, MotionProps } from 'framer-motion'
import { ReactNode, forwardRef } from 'react'

interface TouchFeedbackProps extends MotionProps {
  children: ReactNode
  className?: string
  hapticFeedback?: 'light' | 'medium' | 'heavy'
  disabled?: boolean
}

// iOS-style touch feedback with haptic simulation
const TouchFeedback = forwardRef<HTMLDivElement, TouchFeedbackProps>(
  ({ children, className = '', hapticFeedback = 'light', disabled = false, ...props }, ref) => {
    const handleTapStart = () => {
      if (disabled) return
      
      // Simulate haptic feedback with visual feedback
      // In a real app, you'd use the Haptics API or similar
      if (hapticFeedback === 'heavy') {
        // Heavy feedback - more pronounced visual effect
      }
    }

    return (
      <motion.div
        ref={ref}
        className={`cursor-pointer select-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        whileTap={disabled ? undefined : { scale: 0.95 }}
        whileHover={disabled ? undefined : { scale: 1.02 }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 17
        }}
        onTapStart={handleTapStart}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

TouchFeedback.displayName = 'TouchFeedback'

export default TouchFeedback

// iOS-style button with enhanced feedback
export function IOSButton({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  className = '',
  onClick,
  ...props
}: {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  className?: string
  onClick?: () => void
} & MotionProps) {
  
  const baseClasses = 'font-semibold rounded-xl transition-all duration-200 flex items-center justify-center'
  
  const variantClasses = {
    primary: 'bg-blue-500 text-white shadow-lg',
    secondary: 'bg-gray-100 text-gray-900 border border-gray-200',
    danger: 'bg-red-500 text-white shadow-lg'
  }
  
  const sizeClasses = {
    small: 'px-4 py-2 text-sm min-h-[36px]',
    medium: 'px-6 py-3 text-base min-h-[44px]',
    large: 'px-8 py-4 text-lg min-h-[52px]'
  }
  
  return (
    <TouchFeedback
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled}
      hapticFeedback="medium"
      onTap={onClick}
      {...props}
    >
      {children}
    </TouchFeedback>
  )
}

// Swipe gesture component
export function SwipeableItem({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  className = ''
}: {
  children: ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  leftAction?: ReactNode
  rightAction?: ReactNode
  className?: string
}) {
  return (
    <motion.div
      className={`relative overflow-hidden ${className}`}
      drag="x"
      dragConstraints={{ left: -100, right: 100 }}
      dragElastic={0.1}
      onDragEnd={(event, info) => {
        if (info.offset.x > 50 && onSwipeRight) {
          onSwipeRight()
        } else if (info.offset.x < -50 && onSwipeLeft) {
          onSwipeLeft()
        }
      }}
      whileDrag={{ scale: 0.98 }}
    >
      {/* Left action (swipe right to reveal) */}
      {leftAction && (
        <motion.div
          className="absolute left-0 top-0 bottom-0 w-20 flex items-center justify-center bg-green-500 text-white"
          initial={{ x: -100 }}
          animate={{ x: 0 }}
        >
          {leftAction}
        </motion.div>
      )}
      
      {/* Right action (swipe left to reveal) */}
      {rightAction && (
        <motion.div
          className="absolute right-0 top-0 bottom-0 w-20 flex items-center justify-center bg-red-500 text-white"
          initial={{ x: 100 }}
          animate={{ x: 0 }}
        >
          {rightAction}
        </motion.div>
      )}
      
      {/* Main content */}
      <motion.div className="bg-white relative z-10">
        {children}
      </motion.div>
    </motion.div>
  )
}