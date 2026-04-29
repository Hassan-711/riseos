'use client'

import { useState, useEffect } from 'react'
import { Menu, Sun, Moon, Bell } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import { generateInitials } from '@/lib/utils'

interface NavbarProps {
  onMenuClick: () => void
  title?: string
}

export function Navbar({ onMenuClick, title }: NavbarProps) {
  const { theme, setTheme } = useTheme()
  const today = format(new Date(), 'EEEE, MMM d')
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
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border/50 bg-background/80 backdrop-blur-xl px-4 lg:px-6">
      <Button variant="ghost" size="icon-sm" className="lg:hidden" onClick={onMenuClick}>
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex-1">
        {title && <h1 className="text-base font-semibold text-foreground hidden sm:block">{title}</h1>}
        <p className="text-xs text-muted-foreground">{today}</p>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon-sm" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="text-muted-foreground hover:text-foreground">
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon-sm" className="relative text-muted-foreground hover:text-foreground">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
        </Button>
        <div className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 border border-primary/30 text-xs font-bold text-primary">
          {initials}
        </div>
      </div>
    </header>
  )
}
