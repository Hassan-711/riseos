'use client'

import { useState, useEffect } from 'react'
import { Menu, Sun, Moon, Bell } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { generateInitials } from '@/lib/utils'
import Link from 'next/link' // 🔥 IMPORT ADDED FOR POINT 2
import { toast } from '@/components/ui/toaster' // 🔥 IMPORT ADDED FOR POINT 3

interface NavbarProps {
  onMenuClick: () => void
  title?: string
}

export function Navbar({ onMenuClick, title }: NavbarProps) {
  const { theme, setTheme } = useTheme()
  const today = format(new Date(), "EEE, MMM d")
  const [initials, setInitials] = useState('U')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('profiles').select('full_name').eq('id', user.id).single().then(({ data }) => {
        if (data?.full_name) setInitials(generateInitials(data.full_name))
        else if (user.email) setInitials(user.email[0].toUpperCase())
      })
    })
  }, [])

  return (
    // FIXED: Changed lg:px-5 to lg:px-6 to align with the page body
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 px-4 lg:px-6 bg-background/60 backdrop-blur-xl border-b border-border shadow-sm">
      <Button variant="ghost" size="icon-sm" className="lg:hidden shrink-0 hover:bg-muted" onClick={onMenuClick}>
        <Menu className="h-4 w-4" />
      </Button>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          {title && <h1 className="text-sm font-semibold text-foreground hidden sm:block truncate">{title}</h1>}
          {title && <span className="hidden sm:block text-muted-foreground/40">·</span>}
          <p className="text-xs text-muted-foreground">{today}</p>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all hover:scale-105"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* 🔥 FIX FOR POINT 3: Notification Bell Toast 🔥 */}
        <button 
          onClick={() => toast({ title: '🔔 Coming Soon!', description: 'Notifications feature is under development.' })}
          className="relative flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all hover:scale-105"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-rose-500" />
        </button>

        {/* 🔥 FIX FOR POINT 2: Clickable Avatar to Settings 🔥 */}
        <Link href="/settings" className="ml-1 outline-none">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg icon-violet text-xs font-bold cursor-pointer hover:scale-105 transition-transform shadow-sm">
            {initials}
          </div>
        </Link>
      </div>
    </header>
  )
}