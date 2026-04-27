'use client'

import { useState, useEffect } from 'react'
import { AreaChart, Area, BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Clock, CheckSquare, BookOpen, Calendar, BarChart3 } from 'lucide-react'
import { getAnalyticsLogs, getFocusSessions, getTasks, getSubjects } from '@/lib/db'
import { format, subDays, parseISO } from 'date-fns'

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-lg p-3 border border-border/50 text-xs shadow-xl">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map(({ name, value, color }) => (
        <div key={name} className="flex items-center gap-2"><div className="h-2 w-2 rounded-full" style={{ background: color }} /><span className="text-muted-foreground capitalize">{name}:</span><span className="font-medium">{value}</span></div>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<{ completed: number; total: number }>({ completed: 0, total: 0 })
  const [subjects, setSubjects] = useState<{ name: string; progress: number }[]>([])
  const [focusToday, setFocusToday] = useState(0)
  const [analyticsLogs, setAnalyticsLogs] = useState<Array<{ date: string; study_minutes: number; tasks_completed: number }>>([])

  useEffect(() => {
    Promise.all([getTasks(), getSubjects(), getFocusSessions(), getAnalyticsLogs()]).then(([t, s, f, logs]) => {
      const taskArr = t as Array<{ status: string }>
      setTasks({ completed: taskArr.filter(t => t.status === 'completed').length, total: taskArr.length })
      setSubjects((s as Array<{ name: string; progress: number }>).map(sub => ({ name: sub.name.length > 12 ? sub.name.slice(0, 12) + '…' : sub.name, progress: sub.progress })))
      setFocusToday((f as unknown[]).length)
      setAnalyticsLogs((logs as Array<{ date: string; study_minutes: number; tasks_completed: number }>).slice(0, 14).reverse())
      setLoading(false)
    })
  }, [])

  // Build last 7 days chart data from logs or show zeros
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i)
    const dateStr = format(date, 'yyyy-MM-dd')
    const log = analyticsLogs.find(l => l.date === dateStr)
    return { day: format(date, 'EEE'), hours: log ? +(log.study_minutes / 60).toFixed(1) : 0, tasks: log ? log.tasks_completed : 0 }
  })

  const completionRate = tasks.total ? Math.round((tasks.completed / tasks.total) * 100) : 0

  if (loading) return <div className="space-y-4">{[1,2,3,4].map(i => <div key={i} className="h-48 rounded-xl bg-secondary/50 animate-pulse" />)}</div>

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Analytics</h1><p className="text-muted-foreground text-sm mt-1">Your real productivity data</p></div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: CheckSquare, label: 'Tasks Completed', value: tasks.completed, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { icon: Clock, label: 'Focus Sessions Today', value: focusToday, color: 'text-blue-400', bg: 'bg-blue-400/10' },
          { icon: TrendingUp, label: 'Completion Rate', value: `${completionRate}%`, color: 'text-violet-400', bg: 'bg-violet-400/10' },
          { icon: BookOpen, label: 'Subjects Tracked', value: subjects.length, color: 'text-amber-400', bg: 'bg-amber-400/10' },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <Card key={label} className="p-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${bg}`}><Icon className={`h-4 w-4 ${color}`} /></div>
              <div><p className="text-xs text-muted-foreground">{label}</p><p className={`text-lg font-bold ${color}`}>{value}</p></div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4 text-blue-400" />Study Hours — Last 7 Days</CardTitle></CardHeader>
          <CardContent>
            {last7Days.every(d => d.hours === 0) ? (
              <div className="h-[220px] flex flex-col items-center justify-center text-muted-foreground">
                <BarChart3 className="h-10 w-10 opacity-20 mb-3" />
                <p className="text-sm">No study sessions logged yet</p>
                <p className="text-xs mt-1">Complete Pomodoro sessions to see data here</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={last7Days} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs><linearGradient id="studyGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} /><stop offset="95%" stopColor="#6366f1" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="hours" name="Hours" stroke="#6366f1" fill="url(#studyGrad)" strokeWidth={2} dot={{ fill: '#6366f1', r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><CheckSquare className="h-4 w-4 text-emerald-400" />Tasks Completed — Last 7 Days</CardTitle></CardHeader>
          <CardContent>
            {last7Days.every(d => d.tasks === 0) ? (
              <div className="h-[220px] flex flex-col items-center justify-center text-muted-foreground">
                <CheckSquare className="h-10 w-10 opacity-20 mb-3" />
                <p className="text-sm">No tasks completed yet</p>
                <p className="text-xs mt-1">Complete tasks to see your progress here</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={last7Days} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="tasks" name="Tasks" fill="#10b981" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BookOpen className="h-4 w-4 text-amber-400" />Subject Progress</CardTitle></CardHeader>
          <CardContent>
            {subjects.length === 0 ? (
              <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground">
                <BookOpen className="h-10 w-10 opacity-20 mb-3" />
                <p className="text-sm">No subjects tracked yet</p>
                <p className="text-xs mt-1">Add subjects in the Studies section</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={subjects} layout="vertical" margin={{ top: 5, right: 40, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                  <XAxis type="number" domain={[0,100]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="progress" name="Progress %" fill="#6366f1" radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {tasks.total === 0 && subjects.length === 0 && focusToday === 0 && (
        <Card className="border-primary/20">
          <CardContent className="p-6 text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-3 text-primary/30" />
            <h3 className="font-semibold">Start using RiseOS to see your analytics!</h3>
            <p className="text-sm text-muted-foreground mt-1">Add tasks, complete Pomodoro sessions, track subjects — your real data will appear here.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
