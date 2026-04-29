'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn, generateInitials } from '@/lib/utils'
import {
  LayoutDashboard, FileText, BookOpen, CheckSquare,
  Map, BarChart3, Settings, Zap, LogOut, X
} from 'lucide-react'
import { logoutAction } from '@/app/auth/actions'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/resume',    label: 'Resume',    icon: FileText },
  { href: '/studies',   label: 'Studies',   icon: BookOpen },
  { href: '/tasks',     label: 'Tasks',     icon: CheckSquare },
  { href: '/roadmap',   label: 'Roadmap',   icon: Map },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
]

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
  isMobile?: boolean
}

export function Sidebar({ isOpen, onClose, isMobile }: SidebarProps) {
  const pathname = usePathname()
  const [profile, setProfile] = useState<{ full_name: string | null; degree: string | null; current_semester: number | null; cgpa: number | null } | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('profiles')
        .select('full_name, degree, current_semester, cgpa')
        .eq('id', user.id)
        .single()
        .then(({ data }) => setProfile(data))
    })
  }, [])

  const displayName = profile?.full_name || 'User'
  const displaySub = [
    profile?.degree || 'Student',
    profile?.current_semester ? `Sem ${profile.current_semester}` : null,
    profile?.cgpa ? `${profile.cgpa} CGPA` : null,
  ].filter(Boolean).join(' · ')

  return (
    <>
      {isMobile && isOpen && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden" onClick={onClose} />
      )}

      <aside className={cn(
        'fixed left-0 top-0 z-50 h-full w-64 flex-col border-r border-border/50 bg-card/95 backdrop-blur-xl',
        'flex flex-col transition-transform duration-300 ease-in-out',
        isMobile ? (isOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0 hidden lg:flex'
      )}>
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-border/50">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 border border-primary/30">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <span className="text-base font-bold tracking-tight gradient-text">RiseOS</span>
          </Link>
          {isMobile && (
            <button onClick={onClose} className="p-1 rounded-md text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Navigation</p>
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link key={href} href={href} onClick={isMobile ? onClose : undefined} className={cn('nav-item', active && 'active')}>
                <Icon className="h-4 w-4 shrink-0" />
                <span>{label}</span>
                {active && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
              </Link>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t border-border/50 px-3 py-4 space-y-1">
          <Link href="/settings" className={cn('nav-item', pathname === '/settings' && 'active')}>
            <Settings className="h-4 w-4 shrink-0" /><span>Settings</span>
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="nav-item w-full text-left hover:text-rose-400 hover:bg-rose-400/10">
              <LogOut className="h-4 w-4 shrink-0" /><span>Sign Out</span>
            </button>
          </form>
        </div>

        {/* User badge — dynamic from DB */}
        <div className="px-4 pb-4">
          <div className="rounded-lg bg-primary/5 border border-primary/10 px-3 py-2.5 flex items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 border border-primary/30 text-[10px] font-bold text-primary">
              {generateInitials(displayName)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">{displayName}</p>
              <p className="text-[10px] text-muted-foreground truncate">{displaySub}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
