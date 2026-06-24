'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { markAllNotificationsRead } from '@/actions/admin'
import styles from './dashboard.module.css'

interface NotificationBellProps {
  initialUnreadCount: number
}

export default function NotificationBell({ initialUnreadCount }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)

  // Keep state in sync if initial value changes (e.g., page revalidates)
  useEffect(() => {
    setUnreadCount(initialUnreadCount)
  }, [initialUnreadCount])

  const handleClick = async () => {
    if (unreadCount > 0) {
      setUnreadCount(0)
      try {
        await markAllNotificationsRead()
      } catch (err) {
        console.error('Failed to mark notifications as read:', err)
      }
    }
  }

  return (
    <a 
      href="#notifications" 
      onClick={handleClick} 
      className={styles.notifBadge} 
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', textDecoration: 'none' }}
    >
      <Bell size={20} />
      {unreadCount > 0 && <span className={styles.notifCount}>{unreadCount}</span>}
    </a>
  )
}
