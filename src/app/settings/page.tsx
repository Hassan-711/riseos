'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Palette, Bell, Database, Shield, Sun, Moon, Monitor, Save, Loader2, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from '@/components/ui/toaster'
import { getProfile, updateProfile } from '@/lib/db'

type Section = 'profile' | 'appearance' | 'notifications' | 'data' | 'account'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [activeSection, setActiveSection] = useState<Section>('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState({
    full_name: '', email: '', phone: '', university: '', degree: '',
    enrollment_no: '', cgpa: '', linkedin_url: '', github_url: '', portfolio_url: '', bio: '',
  })
  const [notifications, setNotifications] = useState({
    dailyReminder: true, streakAlert: true, examCountdown: true, taskDue: true, weeklyReview: false,
  })

  useEffect(() => {
    getProfile().then(data => {
      if (data) {
        setProfile({
          full_name: data.full_name ?? '',
          email: data.email ?? '',
          phone: (data as Record<string, unknown>).phone as string ?? '',
          university: data.university ?? '',
          degree: data.degree ?? '',
          enrollment_no: data.enrollment_no ?? '',
          cgpa: data.cgpa?.toString() ?? '',
          linkedin_url: data.linkedin_url ?? '',
          github_url: data.github_url ?? '',
          portfolio_url: data.portfolio_url ?? '',
          bio: data.bio ?? '',
        })
      }
      setLoading(false)
    })
  }, [])

  async function handleSave() {
    setSaving(true)
    const { error } = await updateProfile({
      full_name: profile.full_name,
      bio: profile.bio,
      university: profile.university,
      degree: profile.degree,
      enrollment_no: profile.enrollment_no,
      cgpa: parseFloat(profile.cgpa) || null,
      linkedin_url: profile.linkedin_url,
      github_url: profile.github_url,
      portfolio_url: profile.portfolio_url,
      updated_at: new Date().toISOString(),
    })
    if (error) toast({ title: 'Failed to save', description: error, variant: 'destructive' })
    else toast({ title: '✅ Profile saved!' })
    setSaving(false)
  }

  const SECTIONS = [
    { key: 'profile' as Section, label: 'Profile', icon: User },
    { key: 'appearance' as Section, label: 'Appearance', icon: Palette },
    { key: 'notifications' as Section, label: 'Notifications', icon: Bell },
    { key: 'data' as Section, label: 'Data & Export', icon: Database },
    { key: 'account' as Section, label: 'Account', icon: Shield },
  ]

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-secondary/50 animate-pulse" />)}</div>

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Settings</h1><p className="text-muted-foreground text-sm mt-1">Manage your account and preferences</p></div>
      <div className="grid lg:grid-cols-4 gap-6">
        <nav className="lg:col-span-1 space-y-1">
          {SECTIONS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveSection(key)}
              className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                activeSection === key ? 'bg-primary/10 text-foreground border border-primary/20' : 'text-muted-foreground hover:text-foreground hover:bg-secondary')}>
              <Icon className={cn('h-4 w-4', activeSection === key && 'text-primary')} />{label}
            </button>
          ))}
        </nav>

        <div className="lg:col-span-3 space-y-4">
          {activeSection === 'profile' && (
            <Card className="animate-fade-in">
              <CardHeader><CardTitle>Profile Information</CardTitle><CardDescription>Changes are saved to your Supabase profile</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { field: 'full_name', label: 'Full Name', placeholder: 'Hassan' },
                    { field: 'email', label: 'Email (read-only)', placeholder: 'hassan@example.com', readonly: true },
                    { field: 'university', label: 'University', placeholder: 'Amity University Lucknow' },
                    { field: 'degree', label: 'Degree', placeholder: 'B.Tech CSE' },
                    { field: 'enrollment_no', label: 'Enrollment No.', placeholder: 'A7605224098' },
                    { field: 'cgpa', label: 'CGPA', placeholder: '8.86' },
                    { field: 'github_url', label: 'GitHub URL', placeholder: 'github.com/username' },
                    { field: 'linkedin_url', label: 'LinkedIn URL', placeholder: 'linkedin.com/in/username' },
                  ].map(({ field, label, placeholder, readonly }) => (
                    <div key={field} className="space-y-2">
                      <Label>{label}</Label>
                      <Input placeholder={placeholder} value={profile[field as keyof typeof profile]}
                        readOnly={readonly}
                        className={readonly ? 'opacity-60 cursor-not-allowed' : ''}
                        onChange={e => !readonly && setProfile({ ...profile, [field]: e.target.value })} />
                    </div>
                  ))}
                  <div className="sm:col-span-2 space-y-2">
                    <Label>Portfolio URL</Label>
                    <Input placeholder="yoursite.dev" value={profile.portfolio_url} onChange={e => setProfile({ ...profile, portfolio_url: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <Label>Bio / Summary</Label>
                    <textarea className="w-full min-h-[90px] rounded-lg border border-input bg-background/50 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring/50"
                      placeholder="Write a short professional bio..."
                      value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })} />
                  </div>
                </div>
                <Button onClick={handleSave} className="gap-2" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {saving ? 'Saving…' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>
          )}

          {activeSection === 'appearance' && (
            <Card className="animate-fade-in">
              <CardHeader><CardTitle>Appearance</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Label>Theme</Label>
                <div className="grid grid-cols-3 gap-3">
                  {[{ value: 'dark', label: 'Dark', icon: Moon }, { value: 'light', label: 'Light', icon: Sun }, { value: 'system', label: 'System', icon: Monitor }].map(({ value, label, icon: Icon }) => (
                    <button key={value} onClick={() => setTheme(value)}
                      className={cn('flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                        theme === value ? 'border-primary bg-primary/5' : 'border-border text-muted-foreground hover:border-primary/30')}>
                      <Icon className="h-5 w-5" /><span className="text-xs font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'notifications' && (
            <Card className="animate-fade-in">
              <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: 'dailyReminder', label: 'Daily Study Reminder', desc: 'Reminder to study every day' },
                  { key: 'streakAlert', label: 'Streak Alerts', desc: 'Notify when your streak is at risk' },
                  { key: 'examCountdown', label: 'Exam Countdown', desc: 'Alerts before exam dates' },
                  { key: 'taskDue', label: 'Task Due Reminders', desc: 'Remind for due tasks' },
                  { key: 'weeklyReview', label: 'Weekly Review', desc: 'Sunday summary of progress' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-start justify-between gap-4 py-2">
                    <div><p className="text-sm font-medium">{label}</p><p className="text-xs text-muted-foreground">{desc}</p></div>
                    <button onClick={() => setNotifications(p => ({ ...p, [key]: !p[key as keyof typeof p] }))}
                      className={cn('relative h-6 w-11 rounded-full border-2 transition-colors shrink-0 mt-0.5',
                        notifications[key as keyof typeof notifications] ? 'bg-primary border-primary' : 'bg-secondary border-border')}>
                      <div className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
                        notifications[key as keyof typeof notifications] ? 'translate-x-5' : 'translate-x-0.5')} />
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {activeSection === 'account' && (
            <Card className="border-destructive/20 animate-fade-in">
              <CardHeader><CardTitle className="text-destructive flex items-center gap-2"><Trash2 className="h-4 w-4" />Danger Zone</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div><p className="text-sm font-medium">Delete Account</p><p className="text-xs text-muted-foreground">Irreversible. All data will be lost.</p></div>
                  <Button variant="destructive" size="sm" onClick={() => toast({ title: 'Contact support to delete account', variant: 'destructive' })}>Delete</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
