'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { CheckSquare, Flame, Clock, BookOpen, Map, Calendar, Plus, TrendingUp, ChevronRight, Zap, Target, Circle, CheckCircle2, Loader2 } from 'lucide-react'
import { cn, formatDate, daysUntil, getPriorityColor } from '@/lib/utils'
import { toast } from '@/components/ui/toaster'
import { getTasks, addTask, updateTask, getSubjects, getCareerGoals, getFocusSessions } from '@/lib/db'
import type { Task, Subject, CareerGoal } from '@/lib/types'
import { format } from 'date-fns'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [goals, setGoals] = useState<CareerGoal[]>([])
  const [focusCount, setFocusCount] = useState(0)
  const [quickTask, setQuickTask] = useState('')
  const [addingTask, setAddingTask] = useState(false)
  const [showQuick, setShowQuick] = useState(false)

  useEffect(() => {
    Promise.all([getTasks(), getSubjects(), getCareerGoals(), getFocusSessions()]).then(([t, s, g, f]) => {
      setTasks(t as Task[])
      setSubjects(s as Subject[])
      setGoals(g as CareerGoal[])
      setFocusCount((f as unknown[]).length)
      setLoading(false)
    })
  }, [])

  const todayTasks = tasks.filter(t => t.status !== 'completed').slice(0, 3)
  const completedToday = tasks.filter(t => t.status === 'completed').length
  const semesterProgress = subjects.length
    ? Math.round(subjects.reduce((s, sub) => s + sub.progress, 0) / subjects.length)
    : 0
  const totalMilestones = goals.flatMap(g => g.milestones ?? []).length
  const completedMilestones = goals.flatMap(g => g.milestones ?? []).filter(m => m.status === 'completed').length
  const careerProgress = totalMilestones ? Math.round((completedMilestones / totalMilestones) * 100) : 0
  const upcomingExams = subjects
    .filter(s => s.exam_date && (daysUntil(s.exam_date) ?? 999) >= 0)
    .sort((a, b) => new Date(a.exam_date!).getTime() - new Date(b.exam_date!).getTime())
    .slice(0, 3)

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
      <div className="space-y-6">
        <div className="h-10 w-64 bg-secondary/50 rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 rounded-xl bg-secondary/50 animate-pulse" />)}
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">{[1,2].map(i => <div key={i} className="h-48 rounded-xl bg-secondary/50 animate-pulse" />)}</div>
          <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-32 rounded-xl bg-secondary/50 animate-pulse" />)}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'} 👋
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {format(new Date(), 'EEEE, MMMM d')} · {completedToday} tasks done today
            {focusCount > 0 && ` · ${focusCount} focus sessions 🍅`}
          </p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => setShowQuick(!showQuick)}>
          <Plus className="h-4 w-4" /> Quick Task
        </Button>
      </div>

      {/* Quick add task */}
      {showQuick && (
        <div className="flex gap-2 animate-fade-in">
          <Input
            placeholder="What do you need to do?"
            value={quickTask}
            onChange={e => setQuickTask(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleQuickAdd()}
            autoFocus
          />
          <Button onClick={handleQuickAdd} disabled={addingTask} className="shrink-0">
            {addingTask ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
          </Button>
          <Button variant="ghost" onClick={() => setShowQuick(false)} className="shrink-0">Cancel</Button>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        {[
          { title: 'Tasks Done', value: completedToday, subtitle: `of ${tasks.length} total`, icon: CheckSquare, iconColor: 'text-emerald-400', iconBg: 'bg-emerald-400/10' },
          { title: 'Focus Sessions', value: focusCount, subtitle: 'Today', icon: Clock, iconColor: 'text-blue-400', iconBg: 'bg-blue-400/10' },
          { title: 'Semester Progress', value: `${semesterProgress}%`, subtitle: `${subjects.length} subjects`, icon: BookOpen, iconColor: 'text-amber-400', iconBg: 'bg-amber-400/10' },
          { title: 'Career Progress', value: `${careerProgress}%`, subtitle: `${completedMilestones}/${totalMilestones} milestones`, icon: Map, iconColor: 'text-violet-400', iconBg: 'bg-violet-400/10' },
        ].map(({ title, value, subtitle, icon: Icon, iconColor, iconBg }) => (
          <div key={title} className="relative rounded-xl border border-border/50 bg-card p-5 overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-10" style={{ background: iconColor }} />
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
                <p className="text-2xl font-bold mt-1">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
              </div>
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', iconBg)}>
                <Icon className={cn('h-5 w-5', iconColor)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">

          {/* Today's top tasks */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2"><Target className="h-4 w-4 text-primary" />Today&apos;s Top Tasks</CardTitle>
                <Link href="/tasks"><Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground">View all <ChevronRight className="h-3 w-3" /></Button></Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {tasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No tasks yet</p>
                  <Link href="/tasks"><Button size="sm" variant="outline" className="mt-3 gap-1"><Plus className="h-3.5 w-3.5" />Add your first task</Button></Link>
                </div>
              ) : todayTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-400 opacity-60" />
                  <p className="text-sm">All tasks completed! 🎉</p>
                </div>
              ) : todayTasks.map((task, i) => (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/40 hover:bg-secondary/60 transition-colors group">
                  <div className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                    i === 0 ? 'bg-amber-400/20 text-amber-400' : i === 1 ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground')}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    <Badge className={cn('text-[10px] px-1.5 py-0 mt-0.5', getPriorityColor(task.priority))}>{task.priority}</Badge>
                  </div>
                  <button onClick={() => handleToggleTask(task)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <CheckSquare className="h-4 w-4 text-muted-foreground hover:text-primary" />
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Subject Progress */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-emerald-400" />Subject Progress</CardTitle>
                <Link href="/studies"><Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground">Manage <ChevronRight className="h-3 w-3" /></Button></Link>
              </div>
            </CardHeader>
            <CardContent>
              {subjects.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No subjects yet</p>
                  <Link href="/studies"><Button size="sm" variant="outline" className="mt-3 gap-1"><Plus className="h-3.5 w-3.5" />Add subjects</Button></Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {subjects.map(subject => (
                    <div key={subject.id} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full" style={{ background: subject.color }} />
                          <span className="text-sm font-medium">{subject.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground font-mono">{subject.progress}%</span>
                      </div>
                      <Progress value={subject.progress} className="h-1.5" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Upcoming Exams */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2"><Calendar className="h-4 w-4 text-rose-400" />Upcoming Exams</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingExams.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">No exams scheduled yet</p>
              ) : upcomingExams.map(subject => {
                const days = daysUntil(subject.exam_date)
                return (
                  <div key={subject.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/40 mb-2 last:mb-0">
                    <div className={cn('flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg text-center',
                      (days ?? 999) <= 3 ? 'bg-rose-400/10 border border-rose-400/20' : 'bg-secondary')}>
                      <span className="text-sm font-bold leading-none">{days}</span>
                      <span className="text-[9px] text-muted-foreground">days</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{subject.name}</p>
                      <p className="text-[10px] text-muted-foreground">{formatDate(subject.exam_date)}</p>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Career Goals Quick View */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-violet-400" />Career Goals</CardTitle>
                <Link href="/roadmap"><Button variant="ghost" size="sm" className="text-xs gap-1 text-muted-foreground">View <ChevronRight className="h-3 w-3" /></Button></Link>
              </div>
            </CardHeader>
            <CardContent>
              {goals.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <p className="text-xs">No goals yet</p>
                  <Link href="/roadmap"><Button size="sm" variant="outline" className="mt-2 gap-1 text-xs"><Plus className="h-3 w-3" />Add goal</Button></Link>
                </div>
              ) : goals.slice(0, 5).map(goal => (
                <div key={goal.id} className="flex items-center gap-2.5 py-1.5">
                  <div className={cn('h-2 w-2 rounded-full shrink-0',
                    goal.status === 'active' ? 'bg-emerald-400 animate-pulse-slow' :
                    goal.status === 'completed' ? 'bg-primary' : 'bg-muted-foreground/30')} />
                  <span className="text-xs flex-1 truncate">{goal.title}</span>
                  <Badge variant={goal.status === 'active' ? 'success' : goal.status === 'completed' ? 'default' : 'secondary'} className="text-[10px]">
                    {goal.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2"><Zap className="h-4 w-4 text-amber-400" />Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: 'Pending tasks', value: tasks.filter(t => t.status === 'pending').length },
                { label: 'Active goals', value: goals.filter(g => g.status === 'active').length },
                { label: 'Subjects tracked', value: subjects.length },
                { label: 'Milestones done', value: completedMilestones },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-1 border-b border-border/30 last:border-0">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="text-xs font-semibold">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
