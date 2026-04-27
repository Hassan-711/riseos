'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { CheckSquare, Plus, Timer, Flame, Trash2, Circle, CheckCircle2, Clock, RotateCcw, Play, Pause, Square } from 'lucide-react'
import { cn, formatDate, getPriorityColor } from '@/lib/utils'
import { toast } from '@/components/ui/toaster'
import { getTasks, addTask, updateTask, deleteTask, addFocusSession } from '@/lib/db'
import type { Task } from '@/lib/types'

const POMODORO_SECS = 25 * 60
const SHORT_BREAK = 5 * 60
const LONG_BREAK = 15 * 60

function PomodoroTimer() {
  const [mode, setMode] = useState<'work' | 'short' | 'long'>('work')
  const [seconds, setSeconds] = useState(POMODORO_SECS)
  const [running, setRunning] = useState(false)
  const [sessions, setSessions] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const totalSecs = mode === 'work' ? POMODORO_SECS : mode === 'short' ? SHORT_BREAK : LONG_BREAK
  const progress = ((totalSecs - seconds) / totalSecs) * 100
  const circumference = 2 * Math.PI * 54

  const reset = useCallback(() => { setRunning(false); setSeconds(totalSecs) }, [totalSecs])
  useEffect(() => { reset() }, [mode, reset])

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            setRunning(false)
            if (mode === 'work') {
              const newCount = sessions + 1
              setSessions(newCount)
              addFocusSession({ duration_minutes: 25, session_type: 'pomodoro' })
              toast({ title: '🍅 Pomodoro done! Great focus session.' })
            }
            return 0
          }
          return s - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, mode, sessions])

  const mins = String(Math.floor(seconds / 60)).padStart(2, '0')
  const secs = String(seconds % 60).padStart(2, '0')

  return (
    <Card className="gradient-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm"><Timer className="h-4 w-4 text-primary" />Pomodoro Timer</CardTitle>
        <div className="flex gap-1 mt-2">
          {(['work', 'short', 'long'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={cn('flex-1 rounded-md py-1.5 text-[11px] font-medium transition-all',
                mode === m ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary')}>
              {m === 'work' ? '🍅 Focus' : m === 'short' ? '☕ Short' : '🌿 Long'}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 pt-2">
        <div className="relative flex items-center justify-center">
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r="54" fill="none" stroke="hsl(var(--secondary))" strokeWidth="8" />
            <circle cx="70" cy="70" r="54" fill="none" stroke="hsl(var(--primary))" strokeWidth="8"
              strokeLinecap="round" strokeDasharray={circumference}
              strokeDashoffset={circumference - (circumference * progress) / 100}
              className="timer-ring transition-all duration-1000" />
          </svg>
          <div className="absolute text-center">
            <p className="text-3xl font-bold font-mono">{mins}:{secs}</p>
            <p className="text-[10px] text-muted-foreground capitalize">{mode === 'work' ? 'Focus' : mode === 'short' ? 'Break' : 'Long break'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" onClick={reset}><RotateCcw className="h-3.5 w-3.5" /></Button>
          <Button onClick={() => setRunning(!running)} className="gap-2 px-6">
            {running ? <><Pause className="h-4 w-4" />Pause</> : <><Play className="h-4 w-4" />Start</>}
          </Button>
          <Button variant="outline" size="icon-sm" onClick={() => { setRunning(false); setSeconds(0) }}><Square className="h-3.5 w-3.5" /></Button>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Flame className="h-3.5 w-3.5 text-amber-400" /><span>{sessions} sessions today</span>
        </div>
      </CardContent>
    </Card>
  )
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')
  const [newTitle, setNewTitle] = useState('')
  const [newPriority, setNewPriority] = useState<Task['priority']>('medium')
  const [newDueDate, setNewDueDate] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getTasks().then(data => { setTasks(data as Task[]); setLoading(false) })
  }, [])

  const completed = tasks.filter(t => t.status === 'completed').length
  const filtered = tasks.filter(t => filter === 'all' ? true : t.status === filter)

  async function handleAdd() {
    if (!newTitle.trim() || saving) return
    setSaving(true)
    const { data, error } = await addTask({
      title: newTitle.trim(),
      priority: newPriority,
      status: 'pending',
      due_date: newDueDate || null,
      tags: [],
    })
    if (error) {
      toast({ title: 'Failed to add task', description: error, variant: 'destructive' })
    } else {
      setTasks(prev => [data as Task, ...prev])
      setNewTitle('')
      setNewDueDate('')
      setShowAdd(false)
      toast({ title: 'Task added ✅' })
    }
    setSaving(false)
  }

  async function handleToggle(task: Task) {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    const updates = { status: newStatus, completed_at: newStatus === 'completed' ? new Date().toISOString() : null }
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, ...updates } as Task : t))
    const { error } = await updateTask(task.id, updates as Partial<Task>)
    if (error) {
      setTasks(prev => prev.map(t => t.id === task.id ? task : t))
      toast({ title: 'Failed to update', variant: 'destructive' })
    } else if (newStatus === 'completed') {
      toast({ title: '🎉 Task completed!' })
    }
  }

  async function handleDelete(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id))
    const { error } = await deleteTask(id)
    if (error) {
      toast({ title: 'Failed to delete', variant: 'destructive' })
      getTasks().then(data => setTasks(data as Task[]))
    } else {
      toast({ title: 'Task deleted' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Daily Targets</h1>
          <p className="text-muted-foreground text-sm mt-1">{completed}/{tasks.length} completed today</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />Add Task
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-4 text-center"><p className="text-2xl font-bold text-emerald-400">{completed}</p><p className="text-xs text-muted-foreground mt-1">Completed</p></Card>
            <Card className="p-4 text-center"><p className="text-2xl font-bold text-amber-400">{tasks.length - completed}</p><p className="text-xs text-muted-foreground mt-1">Remaining</p></Card>
            <Card className="p-4 text-center"><p className="text-2xl font-bold gradient-text">{tasks.length ? Math.round((completed / tasks.length) * 100) : 0}%</p><p className="text-xs text-muted-foreground mt-1">Rate</p></Card>
          </div>

          {showAdd && (
            <Card className="border-primary/30 animate-fade-in">
              <CardContent className="pt-5 space-y-3">
                <Input placeholder="What needs to be done?" value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()} autoFocus />
                <div className="flex items-center gap-2 flex-wrap">
                  {(['urgent', 'high', 'medium', 'low'] as const).map(p => (
                    <button key={p} onClick={() => setNewPriority(p)}
                      className={cn('px-3 py-1.5 rounded-md text-xs font-medium border transition-all capitalize',
                        newPriority === p ? getPriorityColor(p) : 'border-border text-muted-foreground hover:border-primary/30')}>
                      {p}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Input type="datetime-local" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} className="flex-1 text-xs" />
                  <Button size="sm" onClick={handleAdd} disabled={saving}>{saving ? 'Saving…' : 'Add'}</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg w-fit">
            {(['all', 'pending', 'completed'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn('px-4 py-1.5 rounded-md text-xs font-medium transition-all capitalize',
                  filter === f ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
                {f}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-secondary/50 animate-pulse" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckSquare className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No tasks here. Add one above!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(task => (
                <div key={task.id} className={cn('flex items-start gap-3 p-3.5 rounded-xl border border-border/50 bg-card transition-all duration-200 group', task.status === 'completed' && 'opacity-60')}>
                  <button onClick={() => handleToggle(task)} className="mt-0.5 shrink-0 transition-transform hover:scale-110">
                    {task.status === 'completed' ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : <Circle className="h-5 w-5 text-muted-foreground/40 hover:text-primary" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-medium', task.status === 'completed' && 'line-through text-muted-foreground')}>{task.title}</p>
                    <div className="flex items-center gap-2 flex-wrap mt-1.5">
                      <Badge className={cn('text-[10px] px-1.5', getPriorityColor(task.priority))}>{task.priority}</Badge>
                      {task.due_date && <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><Clock className="h-2.5 w-2.5" />{formatDate(task.due_date, 'MMM d, h:mm a')}</span>}
                    </div>
                  </div>
                  <button onClick={() => handleDelete(task.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive shrink-0">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <PomodoroTimer />
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10"><Flame className="h-5 w-5 text-amber-400" /></div>
                <div><p className="text-xs text-muted-foreground">Today's Progress</p><p className="text-xl font-bold text-amber-400">{completed} done 🔥</p></div>
              </div>
              <p className="text-xs text-muted-foreground">Complete tasks consistently to build your streak!</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
