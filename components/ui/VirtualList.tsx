'use client'

import { useRef, useState, useEffect, useCallback, ReactNode } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'

interface VirtualListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => ReactNode
  itemHeight?: number | ((index: number) => number)
  overscan?: number
  className?: string
  onScroll?: (scrollTop: number) => void
  estimateSize?: (index: number) => number
}

export function VirtualList<T>({
  items,
  renderItem,
  itemHeight = 100,
  overscan = 5,
  className = '',
  onScroll,
  estimateSize,
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null)
  const [scrolling, setScrolling] = useState(false)
  const scrollTimeout = useRef<NodeJS.Timeout>()

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: estimateSize || (typeof itemHeight === 'function' ? itemHeight : () => itemHeight as number),
    overscan,
  })

  const handleScroll = useCallback(() => {
    if (!scrolling) {
      setScrolling(true)
    }

    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current)
    }

    scrollTimeout.current = setTimeout(() => {
      setScrolling(false)
    }, 150)

    if (onScroll && parentRef.current) {
      onScroll(parentRef.current.scrollTop)
    }
  }, [scrolling, onScroll])

  useEffect(() => {
    const element = parentRef.current
    if (element) {
      element.addEventListener('scroll', handleScroll, { passive: true })
      return () => element.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  const virtualItems = rowVirtualizer.getVirtualItems()
  const totalSize = rowVirtualizer.getTotalSize()

  return (
    <div
      ref={parentRef}
      className={`overflow-auto ${className}`}
      style={{
        contain: 'strict',
      }}
    >
      <div
        style={{
          height: `${totalSize}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualItem) => {
          const item = items[virtualItem.index]
          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={rowVirtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
                minHeight: `${virtualItem.size}px`,
              }}
              className={scrolling ? 'pointer-events-none' : ''}
            >
              {renderItem(item, virtualItem.index)}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Specialized pharmacy list with optimizations
interface PharmacyListItem {
  id: string
  name: string
  address: string
  distance_km: string
  available_spots: number
  twenty_four_support?: boolean
  has_clean_room?: boolean
  handles_narcotics?: boolean
}

interface VirtualPharmacyListProps {
  pharmacies: PharmacyListItem[]
  onPharmacyClick: (pharmacy: PharmacyListItem) => void
  selectedPharmacyId?: string | null
  className?: string
}

export function VirtualPharmacyList({
  pharmacies,
  onPharmacyClick,
  selectedPharmacyId,
  className = '',
}: VirtualPharmacyListProps) {
  const renderPharmacy = useCallback(
    (pharmacy: PharmacyListItem) => (
      <div
        className={`p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors ${
          selectedPharmacyId === pharmacy.id ? 'bg-blue-50 border-blue-200' : ''
        }`}
        onClick={() => onPharmacyClick(pharmacy)}
      >
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-900 flex-1 mr-2">{pharmacy.name}</h3>
          <span className="text-sm text-gray-500 whitespace-nowrap">
            {pharmacy.distance_km}km
          </span>
        </div>
        
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{pharmacy.address}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {pharmacy.twenty_four_support && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                24h
              </span>
            )}
            {pharmacy.has_clean_room && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                無菌
              </span>
            )}
            {pharmacy.handles_narcotics && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                麻薬
              </span>
            )}
          </div>
          
          <span className="text-sm font-medium text-gray-700">
            空き: {pharmacy.available_spots}名
          </span>
        </div>
      </div>
    ),
    [onPharmacyClick, selectedPharmacyId]
  )

  return (
    <VirtualList
      items={pharmacies}
      renderItem={renderPharmacy}
      itemHeight={120}
      overscan={3}
      className={className}
    />
  )
}

// Export a memoized version for better performance
import { memo } from 'react'

export const MemoizedVirtualList = memo(VirtualList) as typeof VirtualList
export const MemoizedVirtualPharmacyList = memo(VirtualPharmacyList)