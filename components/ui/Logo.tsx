'use client'

import Link from 'next/link'
import { Home, Heart } from 'lucide-react'

interface LogoProps {
  size?: 'small' | 'medium' | 'large'
  showText?: boolean
  href?: string
}

export default function Logo({ size = 'medium', showText = true, href = '/' }: LogoProps) {
  const sizes = {
    small: {
      icon: 'w-8 h-8',
      text: 'text-lg',
      subtext: 'text-xs',
      container: 'gap-2'
    },
    medium: {
      icon: 'w-10 h-10',
      text: 'text-xl',
      subtext: 'text-sm',
      container: 'gap-3'
    },
    large: {
      icon: 'w-12 h-12',
      text: 'text-2xl',
      subtext: 'text-base',
      container: 'gap-4'
    }
  }

  const currentSize = sizes[size]

  const LogoContent = () => (
    <>
      <div className="relative">
        <div className={`${currentSize.icon} relative bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg`}>
          <Home className="w-2/3 h-2/3 text-white" />
          <Heart className="absolute -bottom-1 -right-1 w-1/3 h-1/3 text-red-500 bg-white rounded-full p-0.5" />
        </div>
      </div>
      {showText && (
        <div className="flex flex-col">
          <span className={`font-bold ${currentSize.text} text-gray-900 dark:text-gray-100 leading-none`}>
            HOME-DRUG CONNECT
          </span>
          <span className={`${currentSize.subtext} text-gray-600 dark:text-gray-400 leading-none mt-0.5`}>
            在宅医療薬局マッチング
          </span>
        </div>
      )}
    </>
  )

  if (href) {
    return (
      <Link href={href} className={`flex items-center ${currentSize.container} hover:opacity-90 transition-opacity`}>
        <LogoContent />
      </Link>
    )
  }

  return (
    <div className={`flex items-center ${currentSize.container}`}>
      <LogoContent />
    </div>
  )
}