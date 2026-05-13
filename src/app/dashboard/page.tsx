'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { StatCard } from '@/components/dashboard/StatCard'
import {
  CheckSquare, Clock, BookOpen, Map, Calendar, Plus,
  TrendingUp, ChevronRight, Zap, Target, CheckCircle2,
  Loader2, Circle, ArrowRight, Brain
} from 'lucide-react'
import { cn, formatDate, daysUntil, getPriorityColor } from '@/lib/utils'
import { toast } from '@/components/ui/toaster'
import { getTasks, addTask, updateTask, getSubjects, getCareerGoals, getFocusSessions } from '@/lib/db'
import type { Task, Subject, CareerGoal } from '@/lib/types'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client' // 🔥 ADDED THIS IMPORT

const HOUR = new Date().getHours()
const GREETING = HOUR < 12 ? 'Good morning' : HOUR < 17 ? 'Good afternoon' : 'Good evening'
const EMOJI = HOUR < 12 ? '👋' : HOUR < 17 ? '⚡' : '🌙'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [firstName, setFirstName] = useState('') // 🔥 ADDED THIS STATE
  const [tasks, setTasks] = useState<Task[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [goals, setGoals] = useState<CareerGoal[]>([])
  const [focusCount, setFocusCount] = useState(0)
  const [quickTask, setQuickTask] = useState('')
  const [addingTask, setAddingTask] = useState(false)
  const [showQuick, setShowQuick] = useState(false)

  useEffect(() => {
    // 🔥 ADDED THIS TO FETCH REAL NAME FROM DATABASE
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').select('full_name').eq('id', user.id).single().then(({ data }) => {
          if (data?.full_name) {
            setFirstName(data.full_name.split(' ')[0])
          }
        })
      }
    })

    Promise.all([getTasks(), getSubjects(), getCareerGoals(), getFocusSessions()]).then(([t, s, g, f]) => {
      setTasks(t as Task[])
      setSubjects(s as Subject[])
      setGoals(g as CareerGoal[])
      setFocusCount((f as unknown[]).length)
      setLoading(false)
    })
  }, [])

  const todayTasks = tasks.filter(t => t.status !== 'completed').slice(0, 4)
  const completedToday = tasks.filter(t => t.status === 'completed').length
  const currentSubjects = subjects.filter(s => (s as Subject & { status?: string }).status !== 'archived')
  const semesterProgress = currentSubjects.length
    ? Math.round(currentSubjects.reduce((s, sub) => s + sub.progress, 0) / currentSubjects.length) : 0
  const totalMilestones = goals.flatMap(g => g.milestones ?? []).length
  const doneMilestones = goals.flatMap(g => g.milestones ?? []).filter(m => m.status === 'completed').length
  const careerProgress = totalMilestones ? Math.round((doneMilestones / totalMilestones) * 100) : 0
  const upcomingExams = subjects
    .filter(s => s.exam_date && (daysUntil(s.exam_date) ?? 999) >= 0)
    .sort((a, b) => new Date(a.exam_date!).getTime() - new Date(b.exam_date!).getTime())
    .slice(0, 4)

  async function handleQuickAdd() {
    if (!quickTask.trim() || addingTask) return
    setAddingTask(true)
    const { data, error } = await addTask({
      title: quickTask.trim(), priority: 'medium', status: 'pending',
      due_date: new Date().toISOString(), tags: [],
    })
    if (error) {
      toast({ title: 'Failed to add task', variant: 'destructive' })
    } else {
      setTasks(prev => [data as Task, ...prev])
      setQuickTask('')
      setShowQuick(false)
      toast({ title: 'Task added ✅' })
    }
    setAddingTask(false)
  }

  async function handleToggleTask(task: Task) {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } as Task : t))
    await updateTask(task.id, { status: newStatus, completed_at: newStatus === 'completed' ? new Date().toISOString() : null })
    if (newStatus === 'completed') toast({ title: '🎉 Task completed!' })
  }

  if (loading) {
    return (
      <div className="space-y-8 w-full max-w-[1800px] mx-auto">
        <div className="h-9 w-72 shimmer rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-36 rounded-[2rem] shimmer" />)}
        </div>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="h-64 rounded-[2rem] shimmer" />
            <div className="h-48 rounded-[2rem] shimmer" />
          </div>
          <div className="space-y-8">{[1,2,3].map(i => <div key={i} className="h-40 rounded-[2rem] shimmer" />)}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 w-full max-w-[1800px] mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 animate-slide-in relative">
        <div className="absolute -top-10 -left-10 w-64 h-64 bg-purple-400/20 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
            {/* 🔥 REPLACED HARDCODED HASSAN WITH DYNAMIC FIRST NAME 🔥 */}
            {GREETING}{firstName ? `, ${firstName}` : ''}! {EMOJI}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
              {format(new Date(), 'EEEE, MMM d')}
            </p>
            {completedToday > 0 && (
              <>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                  {completedToday} task{completedToday > 1 ? 's' : ''} completed <CheckCircle2 className="w-3.5 h-3.5" />
                </span>
              </>
            )}
          </div>
        </div>
        <Button onClick={() => setShowQuick(!showQuick)} className="relative gap-2 shadow-[0_8px_20px_rgba(79,70,229,0.3)] hover:shadow-[0_12px_25px_rgba(79,70,229,0.4)] hover:-translate-y-0.5 transition-all bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-5 px-6 font-bold">
          <Plus className="h-4 w-4" strokeWidth={3} /> Quick Task
        </Button>
      </div>

      {/* Quick add */}
      {showQuick && (
        <div className="glass-card flex gap-3 animate-fade-in p-4 border-indigo-200/50 dark:border-indigo-500/20">
          <Input
            placeholder="What do you need to do today?"
            value={quickTask}
            onChange={e => setQuickTask(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleQuickAdd()}
            className="flex-1 bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 shadow-sm focus-visible:ring-indigo-500 rounded-xl font-medium"
            autoFocus
          />
          <Button onClick={handleQuickAdd} disabled={addingTask} className="shrink-0 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
            {addingTask ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" onClick={() => setShowQuick(false)} className="shrink-0 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 font-bold">Cancel</Button>
        </div>
      )}

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 stagger">
        <StatCard title="Tasks Done" value={completedToday} subtitle={`of ${tasks.length} total`}
          icon={CheckSquare} color="violet"
          trend={completedToday > 0 ? { value: completedToday, label: 'today' } : undefined} />
        <StatCard title="Focus Sessions" value={focusCount} subtitle="Today's sessions"
          icon={Clock} color="blue" />
        <StatCard title="Semester Avg" value={`${semesterProgress}%`} subtitle={`${currentSubjects.length} subjects`}
          icon={BookOpen} color="emerald" />
        <StatCard title="Career Progress" value={`${careerProgress}%`} subtitle={`${doneMilestones}/${totalMilestones} milestones`}
          icon={Map} color="amber" />
      </div>

      {/* ── Main grid ── */}
      <div className="grid lg:grid-cols-3 gap-8">

        {/* Left — 2 cols */}
        <div className="lg:col-span-2 space-y-8 flex flex-col">

          {/* Today's Plan */}
          <div className="glass-card flex flex-col flex-1">
            <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-200/60 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl icon-violet shadow-sm">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Today&apos;s Plan</h2>
                </div>
              </div>
              <Link href="/tasks">
                <button className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors px-3 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10">
                  View all <ChevronRight className="h-3 w-3" strokeWidth={3} />
                </button>
              </Link>
            </div>

            <div className="p-4 flex flex-col flex-1">
              {tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 py-12 px-6 rounded-[1.5rem] bg-white/40 dark:bg-indigo-950/10 border-2 border-dashed border-slate-200 dark:border-indigo-500/20 text-slate-500 dark:text-slate-400">
                  <div className="flex h-20 w-20 mb-4 items-center justify-center rounded-[1.5rem] bg-white dark:bg-indigo-950/30 shadow-sm border border-slate-100 dark:border-indigo-500/20 text-indigo-500 dark:text-indigo-300">
                    <CheckSquare className="h-10 w-10" />
                  </div>
                  <p className="text-lg font-extrabold text-slate-700 dark:text-slate-200">No tasks yet</p>
                  <p className="text-sm font-semibold mt-1 opacity-70">Click "Quick Task" to add one</p>
                </div>
              ) : todayTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 py-12 px-6 rounded-[1.5rem] bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10">
                  <div className="flex h-20 w-20 mb-4 items-center justify-center rounded-[1.5rem] bg-white dark:bg-emerald-950/30 shadow-sm border border-emerald-50 dark:border-emerald-500/20 text-emerald-500 dark:text-emerald-400">
                    <CheckCircle2 className="h-10 w-10" />
                  </div>
                  <p className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400">All done! Great work 🎉</p>
                  <p className="text-sm font-semibold text-emerald-600/70 dark:text-emerald-400/70 mt-1">You have completed all your tasks for today.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todayTasks.map((task) => (
                    <div key={task.id}
                      className="group flex items-center gap-4 p-4 rounded-xl border border-slate-200/60 dark:border-white/5 bg-white/40 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-500/40 hover:-translate-y-1 transition-all duration-200 cursor-pointer">
                      <button
                        onClick={() => handleToggleTask(task)}
                        className="shrink-0 transition-transform hover:scale-110"
                      >
                        <Circle className="h-5 w-5 text-slate-300 dark:text-slate-600 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors" />
                      </button>
                      <span className="text-[15px] flex-1 truncate font-bold text-slate-700 dark:text-slate-200">{task.title}</span>
                      <Badge className={cn('text-[10px] px-2.5 py-1 font-bold uppercase tracking-wider rounded-lg shadow-sm', getPriorityColor(task.priority))}>
                        {task.priority}
                      </Badge>
                    </div>
                  ))}
                  <button
                    onClick={() => setShowQuick(true)}
                    className="w-full mt-2 flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-indigo-500/20 bg-white/40 dark:bg-indigo-500/5 text-sm font-bold text-slate-500 dark:text-indigo-300 hover:text-indigo-600 dark:hover:text-indigo-200 hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all duration-200"
                  >
                    <Plus className="h-4 w-4" strokeWidth={3} /> Add task
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Subject progress */}
          <div className="glass-card">
            <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-200/60 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl icon-emerald shadow-sm">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Subject Progress</h2>
                  {currentSubjects.length > 0 && (
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{semesterProgress}% overall average</p>
                  )}
                </div>
              </div>
              <Link href="/studies">
                <button className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 transition-colors px-3 py-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/10">
                  Manage <ChevronRight className="h-3 w-3" strokeWidth={3} />
                </button>
              </Link>
            </div>

            <div className="p-6">
              {currentSubjects.length === 0 ? (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                  <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-bold">No subjects added yet</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {currentSubjects.slice(0, 5).map(sub => (
                    <div key={sub.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="h-3 w-3 rounded-full shadow-sm" style={{ background: sub.color }} />
                          <span className="text-[15px] font-bold text-slate-700 dark:text-slate-200">{sub.name}</span>
                          {sub.code && <span className="text-xs font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md">{sub.code}</span>}
                        </div>
                        <span className="text-sm font-extrabold text-slate-600 dark:text-slate-300">{sub.progress}%</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden shadow-inner">
                        <div
                          className="h-full rounded-full transition-all duration-1000 ease-out relative"
                          style={{ 
                            width: `${sub.progress}%`, 
                            background: `linear-gradient(90deg, ${sub.color}dd, ${sub.color})` 
                          }}
                        >
                          <div className="absolute inset-0 bg-white/20 animate-pulse" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right col */}
        <div className="space-y-8">

          {/* Upcoming exams */}
          <div className="glass-card">
            <div className="flex items-center justify-between p-5 border-b border-slate-200/60 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg icon-rose shadow-sm">
                  <Calendar className="h-4 w-4" />
                </div>
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Upcoming Exams</h2>
              </div>
              <Link href="/studies">
                <button className="text-[11px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300">View →</button>
              </Link>
            </div>
            <div className="p-5 space-y-3">
              {upcomingExams.length === 0 ? (
                <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4 font-bold">No exams scheduled</p>
              ) : upcomingExams.map(sub => {
                const days = daysUntil(sub.exam_date)
                const isClose = (days ?? 999) <= 5
                return (
                  <div key={sub.id} className="flex items-center gap-4 p-3 rounded-xl bg-white/40 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 hover:shadow-md hover:border-indigo-200 dark:hover:border-white/20 hover:-translate-y-1 transition-all duration-200">
                    <div className={cn(
                      'flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl shadow-sm border',
                      isClose ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                    )}>
                      <span className="text-lg font-black leading-none">{days}</span>
                      <span className="text-[9px] font-extrabold uppercase tracking-wider mt-0.5 opacity-80">days</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[14px] font-extrabold text-slate-700 dark:text-slate-200 truncate">{sub.name}</p>
                      <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">{formatDate(sub.exam_date)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Career goals */}
          <div className="glass-card stat-amber">
            <div className="flex items-center justify-between p-5 border-b border-slate-200/60 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg icon-amber shadow-sm">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Career Goals</h2>
              </div>
              <Link href="/roadmap">
                <button className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300">View →</button>
              </Link>
            </div>
            <div className="p-5 space-y-2">
              {goals.length === 0 ? (
                <div className="text-center py-4">
                  <Link href="/roadmap">
                    <button className="text-sm font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 flex items-center gap-1 mx-auto bg-amber-50 dark:bg-amber-500/10 px-4 py-2 rounded-xl border border-amber-200 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors">
                      <Plus className="h-4 w-4" strokeWidth={3} /> Add goal
                    </button>
                  </Link>
                </div>
              ) : goals.slice(0, 5).map(goal => (
                <div key={goal.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/60 dark:hover:bg-white/10 transition-colors cursor-default border border-transparent hover:border-slate-200 dark:hover:border-white/20">
                  <div className={cn(
                    'h-2.5 w-2.5 rounded-full shrink-0 shadow-sm',
                    goal.status === 'active' ? 'bg-amber-400 ring-2 ring-amber-100 dark:ring-amber-900/50' :
                    goal.status === 'completed' ? 'bg-emerald-400' : 'bg-slate-300 dark:bg-slate-600'
                  )} />
                  <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200 flex-1 truncate">{goal.title}</span>
                  <span className={cn(
                    'text-[9px] px-2 py-1 rounded-md font-extrabold uppercase tracking-wider shrink-0 shadow-sm',
                    goal.status === 'active' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400' :
                    goal.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                  )}>
                    {goal.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 🔥 AI Predictor CTA injected here 🔥 */}
          <Link href="/ai-predictor" className="block">
            <div className="glass-card p-5 border-indigo-200/60 dark:border-indigo-500/20 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-500/5 dark:to-purple-500/5 hover:from-indigo-100/50 hover:to-purple-100/50 dark:hover:from-indigo-500/10 dark:hover:to-purple-500/10 hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(79,70,229,0.1)] transition-all duration-300 group cursor-pointer relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity duration-300">
                <Brain className="w-24 h-24 rotate-12" />
              </div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white dark:bg-indigo-950 shadow-sm border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300">
                  <Brain className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-[16px] font-extrabold text-indigo-800 dark:text-indigo-200">AI Predictor</h2>
                  <p className="text-[12px] font-bold text-indigo-600/70 dark:text-indigo-400/70 mt-0.5">Check semester risk level →</p>
                </div>
              </div>
            </div>
          </Link>

          {/* Quick stats (Milestones added) */}
          <div className="glass-card stat-cyan">
            <div className="flex items-center gap-3 p-5 border-b border-slate-200/60 dark:border-white/10">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg icon-cyan shadow-sm">
                <Zap className="h-4 w-4" />
              </div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Quick Stats</h2>
            </div>
            <div className="p-5 space-y-2">
              {[
                { label: 'Pending tasks',   value: tasks.filter(t => t.status === 'pending').length,  color: 'text-cyan-700 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-500/10' },
                { label: 'Active goals',    value: goals.filter(g => g.status === 'active').length,   color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
                { label: 'Subjects tracked',value: currentSubjects.length,                            color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
                { label: 'Milestones done', value: doneMilestones,                                    color: 'text-indigo-700 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
              ].map(({ label, value, color, bg }) => (
                <div key={label}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/60 dark:hover:bg-white/10 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-white/20">
                  <span className="text-[13px] font-bold text-slate-600 dark:text-slate-300">{label}</span>
                  <span className={cn('text-sm font-black px-2.5 py-0.5 rounded-lg shadow-sm', bg, color)}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}