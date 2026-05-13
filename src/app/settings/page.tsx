'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
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
    current_semester: '', career_goal: '', // 🔥 CHANGED 'role' TO 'career_goal'
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
          current_semester: data.current_semester?.toString() ?? '', 
          career_goal: data.career_goal ?? '', // 🔥 CHANGED 'role' TO 'career_goal'
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
      current_semester: parseInt(profile.current_semester) || null, 
      career_goal: profile.career_goal, // 🔥 CHANGED 'role' TO 'career_goal'
      enrollment_no: profile.enrollment_no,
      cgpa: parseFloat(profile.cgpa) || null,
      linkedin_url: profile.linkedin_url,
      github_url: profile.github_url,
      portfolio_url: profile.portfolio_url,
      updated_at: new Date().toISOString(),
    })
    if (error) toast({ title: 'Failed to save', description: error, variant: 'destructive' })
    else toast({ title: 'Profile saved successfully ✅' })
    setSaving(false)
  }

  const SECTIONS = [
    { key: 'profile' as Section, label: 'Profile', icon: User },
    { key: 'appearance' as Section, label: 'Appearance', icon: Palette },
    { key: 'notifications' as Section, label: 'Notifications', icon: Bell },
    { key: 'data' as Section, label: 'Data & Export', icon: Database },
    { key: 'account' as Section, label: 'Account', icon: Shield },
  ]

  if (loading) {
    return (
      <div className="space-y-8 w-full max-w-[1800px] mx-auto">
        <div className="h-9 w-72 shimmer rounded-xl" />
        <div className="grid md:grid-cols-4 gap-8">
           <div className="md:col-span-1 space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-12 rounded-2xl shimmer" />)}</div>
           <div className="md:col-span-3 h-[500px] rounded-3xl shimmer" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 w-full max-w-[1800px] mx-auto animate-slide-in">
      
      {/* ── Header ── */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">Settings ⚙️</h1>
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-2">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* ── Sidebar Navigation ── */}
        <div className="md:col-span-1 flex flex-row md:flex-col gap-2 overflow-x-auto pb-4 md:pb-0 scrollbar-hide">
          {SECTIONS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-black uppercase tracking-widest transition-all whitespace-nowrap md:whitespace-normal text-left',
                activeSection === key 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 border-none' 
                  : 'glass-card border border-slate-200/50 dark:border-white/5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-white/10'
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", activeSection === key ? "text-indigo-200" : "text-slate-400")} />
              {label}
            </button>
          ))}
        </div>

        {/* ── Main Content Area ── */}
        <div className="md:col-span-3">
          
          {/* PROFILE SECTION */}
          {activeSection === 'profile' && (
            <div className="glass-card p-6 md:p-8 animate-fade-in border border-slate-200/60 dark:border-white/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none"><User className="w-64 h-64" /></div>
              
              <div className="mb-8 pb-6 border-b border-slate-100 dark:border-white/5 relative z-10">
                <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">Profile Information</h2>
                <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Changes are synced to your database</p>
              </div>

              <div className="space-y-6 relative z-10">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name</Label>
                    <Input className="h-12 rounded-xl font-bold bg-white/50 dark:bg-white/5" placeholder="Your Name" value={profile.full_name} onChange={e => setProfile({...profile, full_name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex justify-between">Email <span className="text-slate-400/50">(Read-only)</span></Label>
                    <Input className="h-12 rounded-xl font-bold bg-slate-50/50 dark:bg-slate-900/50 text-slate-400 border-dashed cursor-not-allowed" value={profile.email} readOnly />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  {/* 🔥 CHANGED 'role' TO 'career_goal' HERE 🔥 */}
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Role / Target Title</Label>
                    <Input className="h-12 rounded-xl font-bold bg-white/50 dark:bg-white/5" placeholder="e.g. AI Backend Engineer" value={profile.career_goal} onChange={e => setProfile({...profile, career_goal: e.target.value})} /></div>
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Semester</Label>
                    <Input type="number" className="h-12 rounded-xl font-bold bg-white/50 dark:bg-white/5" placeholder="e.g. 4" value={profile.current_semester} onChange={e => setProfile({...profile, current_semester: e.target.value})} /></div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">University</Label>
                    <Input className="h-12 rounded-xl font-bold bg-white/50 dark:bg-white/5" placeholder="e.g. Amity University" value={profile.university} onChange={e => setProfile({...profile, university: e.target.value})} /></div>
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Degree</Label>
                    <Input className="h-12 rounded-xl font-bold bg-white/50 dark:bg-white/5" placeholder="e.g. B.Tech CSE" value={profile.degree} onChange={e => setProfile({...profile, degree: e.target.value})} /></div>
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Enrollment No.</Label>
                    <Input className="h-12 rounded-xl font-bold bg-white/50 dark:bg-white/5" value={profile.enrollment_no} onChange={e => setProfile({...profile, enrollment_no: e.target.value})} /></div>
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">CGPA</Label>
                    <Input className="h-12 rounded-xl font-bold bg-white/50 dark:bg-white/5" placeholder="e.g. 8.5" value={profile.cgpa} onChange={e => setProfile({...profile, cgpa: e.target.value})} /></div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">GitHub URL</Label>
                    <Input className="h-12 rounded-xl font-bold bg-white/50 dark:bg-white/5" placeholder="github.com/username" value={profile.github_url} onChange={e => setProfile({...profile, github_url: e.target.value})} /></div>
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">LinkedIn URL</Label>
                    <Input className="h-12 rounded-xl font-bold bg-white/50 dark:bg-white/5" placeholder="linkedin.com/in/username" value={profile.linkedin_url} onChange={e => setProfile({...profile, linkedin_url: e.target.value})} /></div>
                  <div className="sm:col-span-2 space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Portfolio URL</Label>
                    <Input className="h-12 rounded-xl font-bold bg-white/50 dark:bg-white/5" placeholder="yoursite.dev" value={profile.portfolio_url} onChange={e => setProfile({...profile, portfolio_url: e.target.value})} /></div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bio / Summary</Label>
                  <textarea className="w-full min-h-[120px] p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 text-sm font-bold focus:outline-none focus:border-indigo-400 transition-colors text-slate-800 dark:text-slate-100 resize-none" 
                    placeholder="Tell us a bit about your journey..." value={profile.bio} onChange={e => setProfile({...profile, bio: e.target.value})} />
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex justify-end">
                  <Button onClick={handleSave} disabled={saving} className="h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 shadow-md w-full sm:w-auto">
                    {saving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                    {saving ? 'Saving...' : 'Save Profile'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* APPEARANCE SECTION */}
          {activeSection === 'appearance' && (
            <div className="glass-card p-6 md:p-8 animate-fade-in border border-slate-200/60 dark:border-white/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none"><Palette className="w-64 h-64" /></div>
              <div className="mb-8 pb-6 border-b border-slate-100 dark:border-white/5 relative z-10">
                <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">Appearance</h2>
                <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Customize your workspace</p>
              </div>
              <div className="space-y-4 relative z-10">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Theme Preference</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[{ value: 'dark', label: 'Dark Mode', icon: Moon }, { value: 'light', label: 'Light Mode', icon: Sun }, { value: 'system', label: 'System Sync', icon: Monitor }].map(({ value, label, icon: Icon }) => (
                    <button key={value} onClick={() => setTheme(value)}
                      className={cn('flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all',
                        theme === value ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-md' : 'border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 text-slate-500 hover:border-indigo-300 dark:hover:border-indigo-500/50')}>
                      <Icon className="h-8 w-8" /><span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS SECTION */}
          {activeSection === 'notifications' && (
            <div className="glass-card p-6 md:p-8 animate-fade-in border border-slate-200/60 dark:border-white/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none"><Bell className="w-64 h-64" /></div>
              <div className="mb-8 pb-6 border-b border-slate-100 dark:border-white/5 relative z-10">
                <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">Alerts & Reminders</h2>
                <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Choose what you want to be notified about</p>
              </div>
              <div className="space-y-2 relative z-10">
                {[
                  { key: 'dailyReminder', label: 'Daily Study Reminder', desc: 'Get a push to open your books every day.' },
                  { key: 'streakAlert', label: 'Streak Protection', desc: 'Warn me if I am about to lose my daily streak.' },
                  { key: 'examCountdown', label: 'Exam Countdowns', desc: 'Intense alerts 7 days before an exam date.' },
                  { key: 'taskDue', label: 'Task Deadlines', desc: 'Notification when a high-priority task is due today.' },
                  { key: 'weeklyReview', label: 'Weekly Summary', desc: 'Get a Sunday morning report of your progress.' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-slate-100 dark:border-white/5 bg-white/40 dark:bg-white/5 hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all">
                    <div>
                      <p className="text-[14px] font-bold text-slate-800 dark:text-slate-100">{label}</p>
                      <p className="text-[11px] font-bold text-slate-400 mt-0.5">{desc}</p>
                    </div>
                    <button onClick={() => setNotifications(p => ({ ...p, [key]: !p[key as keyof typeof p] }))}
                      className={cn('relative h-7 w-12 rounded-full transition-colors shrink-0 shadow-inner border-2',
                        notifications[key as keyof typeof notifications] ? 'bg-emerald-500 border-emerald-500' : 'bg-slate-200 dark:bg-slate-700 border-slate-200 dark:border-slate-700')}>
                      <div className={cn('absolute top-[2px] h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
                        notifications[key as keyof typeof notifications] ? 'translate-x-[22px]' : 'translate-x-[2px]')} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ACCOUNT SECTION */}
          {activeSection === 'account' && (
            <div className="glass-card p-6 md:p-8 animate-fade-in border border-rose-200/50 dark:border-rose-500/20 bg-rose-50/30 dark:bg-rose-500/5 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none text-rose-500"><Shield className="w-64 h-64" /></div>
              <div className="mb-8 pb-6 border-b border-rose-100 dark:border-rose-500/10 relative z-10">
                <h2 className="text-2xl font-black tracking-tight text-rose-600 dark:text-rose-400 flex items-center gap-2"><Trash2 className="h-6 w-6" /> Danger Zone</h2>
                <p className="text-[11px] font-bold text-rose-400/70 mt-1 uppercase tracking-widest">Irreversible actions for your account</p>
              </div>
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white/60 dark:bg-slate-900/50 border border-rose-100 dark:border-rose-500/20">
                <div>
                  <p className="text-[15px] font-bold text-slate-800 dark:text-slate-100">Delete Account</p>
                  <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Permanently erase all your data and progress.</p>
                </div>
                <Button variant="destructive" className="h-10 rounded-xl font-bold px-6 bg-rose-500 hover:bg-rose-600 shadow-md w-full sm:w-auto" onClick={() => toast({ title: 'Contact support to delete account', variant: 'destructive' })}>
                  Delete Account
                </Button>
              </div>
            </div>
          )}

          {/* DATA/EXPORT (Placeholder) */}
          {activeSection === 'data' && (
            <div className="glass-card p-16 flex flex-col items-center justify-center text-slate-400 border border-slate-200/60 dark:border-white/10 h-[400px]">
              <Database className="h-16 w-16 opacity-20 mb-4" />
              <h2 className="text-xl font-black text-slate-700 dark:text-slate-200 tracking-tight">Data & Export</h2>
              <p className="text-[11px] font-bold mt-2 opacity-70 uppercase tracking-widest">Export features coming in v2.0</p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}