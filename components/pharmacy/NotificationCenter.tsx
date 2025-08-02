'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, X, ExternalLink, Clock, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

interface Notification {
  id: string
  type: 'new_request' | 'request_update' | 'system'
  title: string
  message: string
  link?: string
  created_at: string
  read: boolean
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()

  // 初期通知データ（デモ用）
  useEffect(() => {
    // デモ用の通知を設定
    const demoNotifications: Notification[] = [
      {
        id: '1',
        type: 'new_request',
        title: '新規依頼が届きました',
        message: '○○クリニックから在宅医療の依頼が届いています',
        link: '/dashboard/requests',
        created_at: new Date().toISOString(),
        read: false
      },
      {
        id: '2',
        type: 'new_request',
        title: '緊急依頼',
        message: '△△病院から緊急対応の依頼が届いています',
        link: '/dashboard/requests',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        read: false
      }
    ]
    
    setNotifications(demoNotifications)
    setUnreadCount(demoNotifications.filter(n => !n.read).length)

    // リアルタイム通知の購読（実装時）
    // const subscription = supabase
    //   .channel('pharmacy-notifications')
    //   .on('postgres_changes', {
    //     event: 'INSERT',
    //     schema: 'public',
    //     table: 'requests',
    //     filter: `pharmacy_id=eq.${pharmacyId}`
    //   }, (payload) => {
    //     // 新規依頼の通知を追加
    //   })
    //   .subscribe()

    // return () => {
    //   subscription.unsubscribe()
    // }
  }, [])

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const clearAll = () => {
    setNotifications([])
    setUnreadCount(0)
  }

  return (
    <>
      {/* 通知ベルアイコン */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full"
          >
            {unreadCount}
          </motion.span>
        )}
      </button>

      {/* 通知パネル */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* オーバーレイ */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 lg:hidden"
            />
            
            {/* 通知パネル */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 mt-2 w-80 lg:w-96 bg-white rounded-lg shadow-lg z-50 overflow-hidden"
            >
              {/* ヘッダー */}
              <div className="px-4 py-3 bg-gray-50 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">通知</h3>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        すべて既読
                      </button>
                    )}
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <X className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 通知リスト */}
              <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`p-4 hover:bg-gray-50 transition-colors ${
                          !notification.read ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                            notification.type === 'new_request' 
                              ? 'bg-blue-100' 
                              : 'bg-gray-100'
                          }`}>
                            {notification.type === 'new_request' ? (
                              <Bell className="h-5 w-5 text-blue-600" />
                            ) : (
                              <CheckCircle className="h-5 w-5 text-gray-600" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium text-gray-900 ${
                              !notification.read ? 'font-semibold' : ''
                            }`}>
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(notification.created_at).toLocaleTimeString('ja-JP', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              {notification.link && (
                                <Link
                                  href={notification.link}
                                  onClick={() => {
                                    markAsRead(notification.id)
                                    setIsOpen(false)
                                  }}
                                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                >
                                  詳細を見る
                                  <ExternalLink className="h-3 w-3" />
                                </Link>
                              )}
                            </div>
                          </div>

                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full"
                              title="既読にする"
                            />
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">通知はありません</p>
                  </div>
                )}
              </div>

              {/* フッター */}
              {notifications.length > 0 && (
                <div className="px-4 py-3 bg-gray-50 border-t">
                  <button
                    onClick={clearAll}
                    className="text-sm text-gray-600 hover:text-gray-800 w-full text-center"
                  >
                    すべてクリア
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}