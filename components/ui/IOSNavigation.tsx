'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, MoreHorizontal } from 'lucide-react'
import { ReactNode } from 'react'
import TouchFeedback from './TouchFeedback'

interface IOSNavigationProps {
  title: string
  leftAction?: {
    icon?: ReactNode
    text?: string
    onClick: () => void
  }
  rightAction?: {
    icon?: ReactNode
    text?: string
    onClick: () => void
  }
  className?: string
}

export default function IOSNavigation({
  title,
  leftAction,
  rightAction,
  className = ''
}: IOSNavigationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between min-h-[56px] ${className}`}
    >
      {/* Left Action */}
      <div className="flex-1 flex justify-start">
        {leftAction && (
          <TouchFeedback
            onTap={leftAction.onClick}
            className="flex items-center space-x-1 px-2 py-1 -ml-2 min-h-[44px] min-w-[44px] justify-center"
            hapticFeedback="light"
          >
            {leftAction.icon || <ArrowLeft className="h-5 w-5" />}
            {leftAction.text && (
              <span className="text-blue-600 font-medium text-base">
                {leftAction.text}
              </span>
            )}
          </TouchFeedback>
        )}
      </div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="text-lg font-semibold text-gray-900 text-center px-4 truncate max-w-[200px]"
      >
        {title}
      </motion.h1>

      {/* Right Action */}
      <div className="flex-1 flex justify-end">
        {rightAction && (
          <TouchFeedback
            onTap={rightAction.onClick}
            className="flex items-center space-x-1 px-2 py-1 -mr-2 min-h-[44px] min-w-[44px] justify-center"
            hapticFeedback="light"
          >
            {rightAction.text && (
              <span className="text-blue-600 font-medium text-base">
                {rightAction.text}
              </span>
            )}
            {rightAction.icon || <MoreHorizontal className="h-5 w-5" />}
          </TouchFeedback>
        )}
      </div>
    </motion.div>
  )
}

// iOS-style tab bar
interface IOSTabBarProps {
  tabs: Array<{
    id: string
    label: string
    icon: ReactNode
    isActive?: boolean
    onClick: () => void
    badge?: number
  }>
  className?: string
}

export function IOSTabBar({ tabs, className = '' }: IOSTabBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white border-t border-gray-200 px-2 py-1 flex justify-around ${className}`}
    >
      {tabs.map((tab, index) => (
        <TouchFeedback
          key={tab.id}
          onTap={tab.onClick}
          className={`flex flex-col items-center px-3 py-2 min-h-[60px] min-w-[60px] justify-center relative ${
            tab.isActive ? 'text-blue-600' : 'text-gray-500'
          }`}
          hapticFeedback="light"
        >
          <motion.div
            animate={{
              scale: tab.isActive ? 1.1 : 1,
              y: tab.isActive ? -1 : 0
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            className="relative"
          >
            {tab.icon}
            {tab.badge && tab.badge > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium"
              >
                {tab.badge > 99 ? '99+' : tab.badge}
              </motion.span>
            )}
          </motion.div>
          <motion.span
            animate={{
              fontSize: tab.isActive ? '11px' : '10px',
              fontWeight: tab.isActive ? '600' : '400'
            }}
            className="mt-1"
          >
            {tab.label}
          </motion.span>
        </TouchFeedback>
      ))}
    </motion.div>
  )
}