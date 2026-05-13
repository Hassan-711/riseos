'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn, generateInitials } from '@/lib/utils'
import {
  LayoutDashboard, FileText, BookOpen, CheckSquare,
  Map, BarChart3, Settings, Zap, LogOut, X, Brain
} from 'lucide-react'
import { logoutAction } from '@/app/auth/actions'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard, iconClass: 'icon-violet',  activeAccent: 'text-[hsl(243,68%,52%)]' },
  { href: '/resume',       label: 'Resume',       icon: FileText,        iconClass: 'icon-blue',    activeAccent: 'text-[hsl(215,80%,48%)]' },
  { href: '/studies',      label: 'Studies',      icon: BookOpen,        iconClass: 'icon-emerald', activeAccent: 'text-[hsl(160,60%,36%)]' },
  { href: '/tasks',        label: 'Tasks',        icon: CheckSquare,     iconClass: 'icon-amber',   activeAccent: 'text-[hsl(38,90%,42%)]' },
  { href: '/roadmap',      label: 'Roadmap',      icon: Map,             iconClass: 'icon-rose',    activeAccent: 'text-[hsl(350,72%,50%)]' },
  { href: '/analytics',    label: 'Analytics',    icon: BarChart3,       iconClass: 'icon-cyan',    activeAccent: 'text-[hsl(190,70%,38%)]' },
  { href: '/ai-predictor', label: 'AI Predictor', icon: Brain,           iconClass: 'icon-violet',  activeAccent: 'text-[hsl(243,68%,52%)]' },
]

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
  isMobile?: boolean
}

export function Sidebar({ isOpen, onClose, isMobile }: SidebarProps) {
  const pathname = usePathname()
  const [profile, setProfile] = useState<{
    full_name: string | null
    degree: string | null
    current_semester: number | null
    cgpa: number | null
  } | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('profiles').select('full_name, degree, current_semester, cgpa')
        .eq('id', user.id).single().then(({ data }) => setProfile(data))
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
        <div className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden" onClick={onClose} />
      )}

      <aside className={cn(
        'fixed left-0 top-0 z-50 h-full w-[215px] flex flex-col',
        'bg-background/60 backdrop-blur-xl border-r border-border shadow-lg',
        'transition-transform duration-300 ease-in-out',
        isMobile ? (isOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0 hidden lg:flex'
      )}>

        {/* Logo */}
        <div className="flex h-14 items-center justify-between px-5 border-b border-border/50">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl icon-violet shadow-sm transition-transform group-hover:scale-105">
              <Zap className="h-4 w-4" />
            </div>
            <span className="text-[15px] font-bold tracking-tight gradient-text">RiseOS</span>
          </Link>
          {isMobile && (
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-0.5">
          <p className="section-label px-2 mb-3">Navigation</p>
          {navItems.map(({ href, label, icon: Icon, iconClass }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                onClick={isMobile ? onClose : undefined}
                className={cn('nav-item group', active && 'active')}
              >
                <div className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-lg shrink-0 transition-transform group-hover:scale-105',
                  active ? iconClass : 'bg-muted text-muted-foreground'
                )}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <span className="text-[13px]">{label}</span>
                {active && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary animate-pulse-slow" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t border-border/50 px-3 py-4 space-y-0.5">
          <p className="section-label px-2 mb-2">Account</p>
          <Link href="/settings" className={cn('nav-item', pathname === '/settings' && 'active')}>
            <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg shrink-0', pathname === '/settings' ? 'icon-violet' : 'bg-muted text-muted-foreground')}>
              <Settings className="h-3.5 w-3.5" />
            </div>
            <span className="text-[13px]">Settings</span>
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="nav-item w-full text-left group hover:bg-red-50 hover:text-red-600 dark:hover:bg-rose-950 dark:hover:text-rose-400">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0 bg-muted text-muted-foreground group-hover:bg-red-100 group-hover:text-red-500 dark:group-hover:bg-rose-900 dark:group-hover:text-rose-400 transition-colors">
                <LogOut className="h-3.5 w-3.5" />
              </div>
              <span className="text-[13px]">Sign Out</span>
            </button>
          </form>
        </div>

        {/* 🔥 USER CARD - NOW CLICKABLE! (Tracker Point 1 Fixed) 🔥 */}
        <div className="px-3 pb-4">
          <Link href="/settings" className="block outline-none">
            <div className="glass-card p-3 cursor-pointer hover:bg-white/60 dark:hover:bg-white/10 hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg icon-violet text-xs font-bold shadow-sm">
                  {generateInitials(displayName)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-foreground truncate">{displayName}</p>
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">{displaySub}</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

      </aside>
    </>
  )
}