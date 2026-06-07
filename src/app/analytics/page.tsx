'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Clock, CheckSquare, BookOpen, Calendar, BarChart3, Target } from 'lucide-react'
import { getTasks, getSubjects } from '@/lib/db'
import { createClient } from '@/lib/supabase/client'
import { format, subDays } from 'date-fns'
import { StatCard } from '@/components/dashboard/StatCard'

// 🔥 Helper for formatting minutes to "Xh Ym"
function formatTime(mins: number) {
  if (!mins) return '0m'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h > 0 ? h + 'h ' : ''}${m > 0 || h === 0 ? m + 'm' : ''}`.trim()
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-card rounded-xl p-4 border border-slate-200/50 dark:border-white/10 text-xs shadow-[0_8px_30px_rgba(0,0,0,0.12)] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
      <p className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest mb-3">{label}</p>
      {payload.map(({ name, value, color }) => (
        <div key={name} className="flex items-center gap-3 mb-1.5 last:mb-0">
          <div className="h-2.5 w-2.5 rounded-full shadow-sm" style={{ background: color }} />
          <span className="text-slate-500 font-bold uppercase tracking-wider">{name}:</span>
          <span className="font-black text-slate-700 dark:text-slate-200 text-sm">{name === 'Hours' ? `${value} hr` : value}</span>
        </div>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<{ completed: number; total: number }>({ completed: 0, total: 0 })
  const [allTasks, setAllTasks] = useState<Array<{ status: string; updated_at?: string; created_at?: string }>>([])
  const [subjects, setSubjects] = useState<{ name: string; progress: number }[]>([])
  
  const [allSessions, setAllSessions] = useState<Array<{ duration_minutes: number; started_at: string }>>([])

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      const [t, s, sessionsRes] = await Promise.all([
        getTasks(),
        getSubjects(),
        user ? supabase.from('focus_sessions').select('duration_minutes, started_at').eq('user_id', user.id) : { data: [] }
      ])

      const taskArr = t as Array<{ status: string; updated_at?: string; created_at?: string }>
      
      setAllTasks(taskArr)
      setTasks({ completed: taskArr.filter(task => task.status === 'completed').length, total: taskArr.length })
      
      setSubjects((s as Array<{ name: string; progress: number }>).map(sub => ({ name: sub.name.length > 12 ? sub.name.slice(0, 12) + '…' : sub.name, progress: sub.progress })))
      
      setAllSessions(sessionsRes.data || [])
      setLoading(false)
    }

    fetchData()
  }, [])

  // ── Calculate Stats from DB Data ──
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  
  const getLocalDate = (dateStr: string) => {
    if (!dateStr) return new Date()
    const safeStr = dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z'
    return new Date(safeStr)
  }
  
  const todayMins = allSessions
    .filter(s => s.started_at && format(getLocalDate(s.started_at), 'yyyy-MM-dd') === todayStr)
    .reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0)

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i)
    const dateStr = format(date, 'yyyy-MM-dd')
    
    const dayMins = allSessions
      .filter(s => s.started_at && format(getLocalDate(s.started_at), 'yyyy-MM-dd') === dateStr)
      .reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0)

    const realTasksCompleted = allTasks.filter(t => {
      if (t.status !== 'completed') return false;
      const taskDate = t.updated_at || t.created_at || ''; 
      if (!taskDate) return false;
      return format(getLocalDate(taskDate), 'yyyy-MM-dd') === dateStr;
    }).length;

    return { 
      day: format(date, 'EEE'), 
      hours: +(dayMins / 60).toFixed(2), // 🔥 2 decimals so 2m (0.03 hr) doesn't become 0
      rawMins: dayMins, // 🔥 Tracks exact minutes for the empty state check
      tasks: realTasksCompleted 
    }
  })

  const completionRate = tasks.total ? Math.round((tasks.completed / tasks.total) * 100) : 0

  if (loading) {
    return (
      <div className="space-y-8 w-full max-w-[1800px] mx-auto">
        <div className="h-9 w-72 shimmer rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-32 rounded-2xl shimmer" />)}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          {[1,2].map(i => <div key={i} className="h-[300px] rounded-3xl shimmer" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 w-full max-w-[1800px] mx-auto animate-slide-in">
      
      {/* ── Header ── */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">Analytics 📈</h1>
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-2">Your real productivity and study data</p>
      </div>

      {/* ── 4 STAT CARDS ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Tasks Completed" value={tasks.completed} color="emerald" icon={CheckSquare} />
        <StatCard title="Focus Time Today" value={formatTime(todayMins)} color="blue" icon={Clock} />
        <StatCard title="Completion Rate" value={`${completionRate}%`} color="violet" icon={TrendingUp} />
        <StatCard title="Subjects Tracked" value={subjects.length} color="amber" icon={BookOpen} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* Study Hours Chart (BarChart) */}
        <div className="glass-card p-6 md:p-8 flex flex-col hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group border border-slate-200/60 dark:border-white/10">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-white/5">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
              <Clock className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-black tracking-tight text-slate-800 dark:text-slate-100">Focus Hours <span className="text-sm font-bold text-slate-400 ml-2">(Last 7 Days)</span></h3>
          </div>
          
          {/* 🔥 Checks rawMins instead of rounded hours */}
          {last7Days.every(d => d.rawMins === 0) ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-10 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
              <BarChart3 className="h-10 w-10 opacity-20 mb-3" />
              <p className="text-[15px] font-bold">No focus time logged yet</p>
              <p className="text-xs font-semibold mt-1 opacity-70">Complete Timer sessions to see data here</p>
            </div>
          ) : (
            <div className="flex-1 min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={last7Days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" opacity={0.5} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} dx={-10} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.05)' }} />
                  <Bar dataKey="hours" name="Hours" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Tasks Completed Chart */}
        <div className="glass-card p-6 md:p-8 flex flex-col hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group border border-slate-200/60 dark:border-white/10">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-white/5">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
              <CheckSquare className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-black tracking-tight text-slate-800 dark:text-slate-100">Tasks Completed <span className="text-sm font-bold text-slate-400 ml-2">(Last 7 Days)</span></h3>
          </div>
          
          {last7Days.every(d => d.tasks === 0) ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-10 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
              <CheckSquare className="h-10 w-10 opacity-20 mb-3" />
              <p className="text-[15px] font-bold">No tasks completed yet</p>
              <p className="text-xs font-semibold mt-1 opacity-70">Complete tasks to see your progress here</p>
            </div>
          ) : (
            <div className="flex-1 min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={last7Days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" opacity={0.5} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} dx={-10} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.05)' }} />
                  <Bar dataKey="tasks" name="Tasks" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Subject Progress Chart */}
        <div className="glass-card lg:col-span-2 p-6 md:p-8 flex flex-col hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group border border-slate-200/60 dark:border-white/10">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-white/5">
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform">
              <BookOpen className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-black tracking-tight text-slate-800 dark:text-slate-100">Subject Progress <span className="text-sm font-bold text-slate-400 ml-2">(Current Sem)</span></h3>
          </div>
          
          {subjects.length === 0 ? (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-16 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
              <BookOpen className="h-10 w-10 opacity-20 mb-3" />
              <p className="text-[15px] font-bold">No subjects tracked yet</p>
              <p className="text-xs font-semibold mt-1 opacity-70">Add subjects in the Studies section</p>
            </div>
          ) : (
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjects} layout="vertical" margin={{ top: 5, right: 40, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" horizontal={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" opacity={0.5} />
                  <XAxis type="number" domain={[0,100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} dx={10} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} width={90} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.05)' }} />
                  <Bar dataKey="progress" name="Progress %" fill="#8b5cf6" radius={[0, 6, 6, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {tasks.total === 0 && subjects.length === 0 && todayMins === 0 && (
        <div className="glass-card p-10 border-indigo-200/50 dark:border-indigo-500/20 text-center animate-fade-in relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><Target className="w-64 h-64" /></div>
          <BarChart3 className="h-16 w-16 mx-auto mb-4 text-indigo-500 opacity-60" />
          <h3 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">Start using RiseOS to build data!</h3>
          <p className="text-sm font-bold text-slate-500 mt-2 max-w-md mx-auto">Add tasks, complete Timer sessions, and track subjects. Your real productivity data will visualize here.</p>
        </div>
      )}
    </div>
  )
}