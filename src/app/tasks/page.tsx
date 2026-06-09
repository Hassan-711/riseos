'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { CheckSquare, Plus, Timer, Flame, Trash2, Circle, CheckCircle2, Clock, RotateCcw, Play, Pause, Square, Target, Maximize, Minimize, Settings2, Volume2, VolumeX } from 'lucide-react'
import { cn, formatDate, getPriorityColor } from '@/lib/utils'
import { toast } from '@/components/ui/toaster'
import { getTasks, addTask, updateTask, deleteTask, addFocusSession } from '@/lib/db'
import type { Task } from '@/lib/types'
import { StatCard } from '@/components/dashboard/StatCard'

// 🔥 SMART TIMEZONE HELPER
function getSafeUTCDate(dateStr: string) {
  if (!dateStr) return dateStr;
  if (dateStr.includes('Z') || dateStr.includes('+') || dateStr.match(/-\d{2}:\d{2}$/)) return dateStr;
  return dateStr + 'Z';
}

// Timer Component
function PomodoroTimer() {
  const [mode, setMode] = useState<'work' | 'short' | 'long' | 'custom'>('work')
  const [customMins, setCustomMins] = useState('45')
  const [totalSecs, setTotalSecs] = useState(25 * 60)
  const [seconds, setSeconds] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [sessions, setSessions] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  const [soundEnabled, setSoundEnabled] = useState(true)
  
  const timerContainerRef = useRef<HTMLDivElement>(null)
  const wakeLockRef = useRef<any>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  const progress = ((totalSecs - seconds) / totalSecs) * 100
  const circumference = 2 * Math.PI * 54

  useEffect(() => {
    const savedSound = localStorage.getItem('timer_sound_enabled')
    if (savedSound !== null) setSoundEnabled(savedSound === 'true')
  }, [])

  const toggleSound = () => {
    const newVal = !soundEnabled
    setSoundEnabled(newVal)
    localStorage.setItem('timer_sound_enabled', String(newVal))
    
    if (newVal) {
      toast({ title: 'Alarm Enabled 🔊' })
      try {
        if(audioRef.current){
            audioRef.current.volume = 0.5;
            audioRef.current.currentTime = 0;
            audioRef.current.play().then(() => {
              setTimeout(() => { if(audioRef.current) audioRef.current.pause() }, 1500)
            }).catch(() => {})
        }
      } catch (e) {}
    } else {
      toast({ title: 'Alarm Muted 🔇' })
    }
  }

  const playAlarm = useCallback(() => {
    if (soundEnabled && audioRef.current) {
      try {
        audioRef.current.currentTime = 0
        audioRef.current.volume = 0.8
        audioRef.current.play().catch((e) => {
          console.log('Audio blocked by browser:', e)
          toast({ title: '⏰ Timer Finished! (Audio blocked by browser)', variant: 'destructive' })
        })
      } catch (e) {}
    }
  }, [soundEnabled])

  useEffect(() => {
    if (running || isPaused) return
    if (mode === 'work') setTotalSecs(25 * 60)
    else if (mode === 'short') setTotalSecs(5 * 60)
    else if (mode === 'long') setTotalSecs(15 * 60)
    else setTotalSecs(parseInt(customMins || '0') * 60)
  }, [mode, customMins, running, isPaused])

  useEffect(() => {
    if (!running && !isPaused) {
      setSeconds(totalSecs)
    }
  }, [totalSecs, running, isPaused])

  const saveSession = useCallback(async (spentSecs: number) => {
    const mins = Math.floor(spentSecs / 60)
    if (mins > 0) {
      await addFocusSession({ duration_minutes: mins, session_type: mode })
      if (mode === 'work' || mode === 'custom') setSessions(s => s + 1)
      toast({ title: `Logged ${mins} min focus time! 🔥` })
    }
  }, [mode])

  const toggleTimer = () => {
    if (running) {
      setRunning(false)
      setIsPaused(true)
      localStorage.removeItem('timer_end')
      localStorage.setItem('timer_paused_rem', seconds.toString())
    } else {
      setIsPaused(false)
      const endTime = Date.now() + (seconds * 1000)
      localStorage.setItem('timer_end', endTime.toString())
      localStorage.setItem('timer_total', totalSecs.toString())
      localStorage.setItem('timer_mode', mode)
      localStorage.removeItem('timer_paused_rem')
      setRunning(true)
      
      if(audioRef.current && soundEnabled){
          audioRef.current.volume = 0;
          audioRef.current.play().then(()=>{audioRef.current!.pause(); audioRef.current!.currentTime=0}).catch(()=>{})
      }
    }
  }

  const stopTimer = () => {
    const spentSecs = totalSecs - seconds
    saveSession(spentSecs) 
    setRunning(false)
    setIsPaused(false)
    setSeconds(totalSecs)
    localStorage.removeItem('timer_end')
    localStorage.removeItem('timer_total')
    localStorage.removeItem('timer_mode')
    localStorage.removeItem('timer_paused_rem')
    if(audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
  }

  const resetTimer = () => {
    setRunning(false)
    setIsPaused(false)
    setSeconds(totalSecs)
    localStorage.removeItem('timer_end')
    localStorage.removeItem('timer_paused_rem')
    if(audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
  }

  useEffect(() => {
    const checkBackgroundTimer = () => {
      const endStr = localStorage.getItem('timer_end')
      const totalStr = localStorage.getItem('timer_total')
      const modeStr = localStorage.getItem('timer_mode') as any
      const pausedRem = localStorage.getItem('timer_paused_rem')

      if (pausedRem && totalStr) {
        setTotalSecs(parseInt(totalStr, 10))
        if (modeStr) setMode(modeStr)
        setSeconds(parseInt(pausedRem, 10))
        setIsPaused(true)
        setRunning(false)
      } 
      else if (endStr && totalStr) {
        const end = parseInt(endStr, 10)
        const now = Date.now()
        
        if (end > now) {
          setTotalSecs(parseInt(totalStr, 10))
          if (modeStr) setMode(modeStr)
          setSeconds(Math.ceil((end - now) / 1000))
          setRunning(true)
        } else {
          saveSession(parseInt(totalStr, 10))
          localStorage.removeItem('timer_end')
          localStorage.removeItem('timer_total')
          setRunning(false)
          setIsPaused(false)
          playAlarm()
          toast({ title: 'Time is up! 🎉' })
        }
      }
    }
    checkBackgroundTimer()

    if (running) {
      intervalRef.current = setInterval(() => {
        const endStr = localStorage.getItem('timer_end')
        if (endStr) {
          const remaining = Math.ceil((parseInt(endStr, 10) - Date.now()) / 1000)
          if (remaining <= 0) {
            setRunning(false)
            setIsPaused(false)
            setSeconds(0)
            saveSession(totalSecs)
            localStorage.removeItem('timer_end')
            playAlarm()
            toast({ title: 'Time is up! 🎉' })
          } else {
            setSeconds(remaining)
          }
        }
      }, 1000)
    }

    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, totalSecs, saveSession, playAlarm])

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      try {
        await timerContainerRef.current?.requestFullscreen()
        if ('wakeLock' in navigator) wakeLockRef.current = await (navigator as any).wakeLock.request('screen')
        setIsFullscreen(true)
      } catch (e) {
          console.error("Fullscreen error", e)
      }
    } else {
      try {
        if (document.exitFullscreen) {
            await document.exitFullscreen()
        }
        wakeLockRef.current?.release()
        setIsFullscreen(false)
      } catch (e) {
         console.error("Exit fullscreen error", e)
         setIsFullscreen(false)
      }
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const mins = String(Math.floor(seconds / 60)).padStart(2, '0')
  const secs = String(seconds % 60).padStart(2, '0')

  return (
    <div ref={timerContainerRef} className={cn("flex flex-col transition-all duration-700 ease-in-out relative overflow-hidden", isFullscreen ? "fixed inset-0 z-50 items-center justify-center !rounded-none !border-none bg-slate-950" : "glass-card p-6")}>
      
      <audio ref={audioRef} src="/alarm.mp3" preload="auto" />

      {isFullscreen && (
        <div className="absolute inset-0 z-0 pointer-events-none animate-in fade-in duration-1000">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black opacity-90" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-500/10 blur-[100px] rounded-full animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100%_4px] opacity-40 mix-blend-overlay" />
        </div>
      )}

      {/* 🔥 FIX: Changed z-index to z-[100] and absolute positioning to guarantee it's always on top */}
      <div className={cn("flex items-center justify-between w-full transition-opacity duration-500", isFullscreen ? "absolute top-0 left-0 right-0 p-8 z-[100] pointer-events-auto" : "relative z-10 mb-6")}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl icon-rose shadow-sm">
            <Timer className="h-5 w-5" />
          </div>
          <h2 className={cn("font-bold tracking-tight", isFullscreen ? "text-2xl text-white/90 drop-shadow-md" : "text-slate-800 dark:text-slate-100 text-lg")}>Focus Timer</h2>
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={toggleSound} title={soundEnabled ? "Mute Alarm" : "Enable Alarm"} className={cn("transition-colors duration-300 rounded-xl", isFullscreen ? "text-white/60 hover:text-white hover:bg-white/10" : "text-slate-500 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-white/10")}>
            {soundEnabled ? <Volume2 className={cn(isFullscreen ? "h-6 w-6" : "h-5 w-5")} /> : <VolumeX className={cn(isFullscreen ? "h-6 w-6" : "h-5 w-5")} />}
          </Button>

          <Button variant="ghost" size="icon" onClick={toggleFullscreen} className={cn("transition-colors duration-300 rounded-xl cursor-pointer", isFullscreen ? "text-white/60 hover:text-white hover:bg-white/10" : "text-slate-500 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-white/10")}>
            {isFullscreen ? <Minimize className="h-6 w-6" /> : <Maximize className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      
      {/* ── MAIN CONTENT ── */}
      <div className={cn("flex flex-col items-center justify-center flex-1 w-full relative z-10", isFullscreen ? "gap-14" : "gap-8")}>
        
        {!running && !isPaused && (
          <div className={cn("flex flex-wrap justify-center p-1 rounded-xl border shadow-sm transition-all duration-500 animate-in slide-in-from-bottom-2", isFullscreen ? "gap-2 bg-white/5 border-white/10 backdrop-blur-md" : "gap-1.5 bg-slate-50/50 dark:bg-white/5 border-slate-200 dark:border-white/10 w-full")}>
            {(['work', 'short', 'long', 'custom'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={cn('rounded-lg font-extrabold uppercase tracking-wider transition-all duration-300 shadow-sm flex items-center justify-center',
                  isFullscreen ? 'px-6 py-2.5 text-sm' : 'flex-1 py-1.5 px-3 text-[11px]',
                  mode === m 
                    ? (isFullscreen ? 'bg-white text-slate-900 shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-md border border-slate-200/50 dark:border-white/10') 
                    : (isFullscreen ? 'text-white/50 hover:text-white hover:bg-white/10' : 'text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-white/5')
                )}>
                {m === 'work' ? '25m' : m === 'short' ? '5m' : m === 'long' ? '15m' : <Settings2 className={cn(isFullscreen ? "h-5 w-5" : "h-3 w-3")} />}
              </button>
            ))}
          </div>
        )}

        {mode === 'custom' && !running && !isPaused && (
          <div className="flex items-center gap-3 animate-in fade-in">
            <Input type="number" min="1" max="300" value={customMins} onChange={(e) => setCustomMins(e.target.value)} 
              className={cn("text-center font-bold transition-colors", isFullscreen ? "w-28 h-12 text-lg bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-white/30" : "w-20")} />
            <span className={cn("font-bold tracking-widest uppercase text-xs", isFullscreen ? "text-white/60" : "text-slate-500")}>Minutes</span>
          </div>
        )}

        <div className={cn("relative flex items-center justify-center transition-transform duration-700", !isFullscreen && "scale-110")}>
          <svg width={isFullscreen ? "380" : "140"} height={isFullscreen ? "380" : "140"} viewBox="0 0 140 140" className="drop-shadow-2xl">
            <circle cx="70" cy="70" r="54" fill="none" className={cn("stroke-slate-200 dark:stroke-white/5 transition-colors", isFullscreen && "!stroke-white/10")} strokeWidth="8" />
            <circle cx="70" cy="70" r="54" fill="none" className={cn("stroke-rose-400 transition-colors", isFullscreen && "!stroke-rose-500")} strokeWidth="8"
              strokeLinecap="round" strokeDasharray={circumference}
              strokeDashoffset={circumference - (circumference * progress) / 100}
              style={{ transition: 'stroke-dashoffset 1s linear' }} />
          </svg>
          <div className="absolute text-center flex flex-col items-center">
            <p className={cn("font-black tracking-tighter transition-colors duration-500", isFullscreen ? "text-[5.5rem] text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]" : "text-3xl text-slate-800 dark:text-slate-100")}>{mins}:{secs}</p>
          </div>
        </div>

        <div className={cn("flex items-center transition-all duration-500", isFullscreen ? "gap-6" : "gap-3")}>
          <button onClick={resetTimer} className={cn("flex items-center justify-center rounded-xl border transition-all duration-300 hover:-translate-y-0.5", isFullscreen ? "h-16 w-16 border-white/20 text-white/70 hover:text-white hover:bg-white/10 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]" : "h-10 w-10 border-slate-200 dark:border-white/10 hover:bg-slate-50 text-slate-500")}>
            <RotateCcw className={isFullscreen ? "h-6 w-6" : "h-4 w-4"} />
          </button>
          
          <Button onClick={toggleTimer} className={cn("gap-2 rounded-xl bg-rose-500 hover:bg-rose-600 shadow-[0_8px_20px_rgba(244,63,94,0.3)] hover:-translate-y-1 transition-all duration-300 text-white font-bold", isFullscreen ? "px-14 py-8 text-2xl hover:shadow-[0_10px_40px_rgba(244,63,94,0.4)]" : "px-8 py-5")}>
            {running ? <><Pause className={cn(isFullscreen ? "h-7 w-7 mr-2 fill-current" : "h-4 w-4")} />Pause</> : <><Play className={cn(isFullscreen ? "h-7 w-7 mr-2 fill-current" : "h-4 w-4")} />{isPaused ? 'Resume' : 'Start'}</>}
          </Button>
          
          <button onClick={stopTimer} className={cn("flex items-center justify-center rounded-xl border transition-all duration-300 hover:-translate-y-0.5", isFullscreen ? "h-16 w-16 border-white/20 text-white/70 hover:text-white hover:bg-white/10 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]" : "h-10 w-10 border-slate-200 dark:border-white/10 hover:bg-slate-50 text-slate-500")}>
            <Square className={isFullscreen ? "h-6 w-6" : "h-4 w-4"} />
          </button>
        </div>
        
        {!isFullscreen && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100/50 dark:border-amber-500/20 text-[11px] font-extrabold uppercase tracking-widest text-amber-600 dark:text-amber-400 animate-in fade-in slide-in-from-bottom-2">
            <Flame className="h-3.5 w-3.5" /><span>{sessions} blocks today</span>
          </div>
        )}
      </div>
    </div>
  )
}

// Tasks Page Component
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
    
    let finalDueDate = null;
    if (newDueDate) {
      finalDueDate = new Date(newDueDate).toISOString();
    }

    const { data, error } = await addTask({
      title: newTitle.trim(),
      priority: newPriority,
      status: 'pending',
      due_date: finalDueDate,
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
    <div className="space-y-8 w-full max-w-[1800px] mx-auto animate-slide-in">
      
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 relative">
        <div className="relative">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
            Daily Targets 🎯
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
              Manage your tasks and focus
            </p>
          </div>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)} className="relative gap-2 shadow-[0_8px_20px_rgba(79,70,229,0.3)] hover:shadow-[0_12px_25px_rgba(79,70,229,0.4)] hover:-translate-y-0.5 transition-all bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-5 px-6 font-bold">
          <Plus className="h-4 w-4" strokeWidth={3} /> Add Task
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-8 flex flex-col">
          
          <div className="grid grid-cols-3 gap-6">
            <StatCard title="Completed" value={completed} color="emerald" icon={CheckCircle2} />
            <StatCard title="Remaining" value={tasks.length - completed} color="amber" icon={Clock} />
            <StatCard title="Hit Rate" value={`${tasks.length ? Math.round((completed / tasks.length) * 100) : 0}%`} color="violet" icon={Target} />
          </div>

          {showAdd && (
            <div className="glass-card flex flex-col animate-in fade-in slide-in-from-top-4 p-5 border-indigo-200/50 dark:border-indigo-500/20">
               <Input placeholder="What needs to be done?" value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()} 
                  className="bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 shadow-sm focus-visible:ring-indigo-500 rounded-xl font-bold text-lg px-4 py-6 mb-4"
                  autoFocus />
               
               <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    {(['urgent', 'high', 'medium', 'low'] as const).map(p => (
                      <button key={p} onClick={() => setNewPriority(p)}
                        className={cn('px-4 py-1.5 rounded-lg text-[10px] font-extrabold tracking-widest uppercase transition-all shadow-sm border',
                          newPriority === p ? getPriorityColor(p) : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600')}>
                        {p}
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Input type="datetime-local" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} className="flex-1 sm:w-auto bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl font-bold text-xs" />
                    <Button onClick={handleAdd} disabled={saving} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6">{saving ? 'Saving…' : 'Save Task'}</Button>
                    <Button variant="ghost" onClick={() => setShowAdd(false)} className="rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 font-bold">Cancel</Button>
                  </div>
               </div>
            </div>
          )}

          <div className="glass-card flex flex-col flex-1">
             <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-200/60 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl icon-violet shadow-sm">
                  <CheckSquare className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Your Tasks</h2>
              </div>
              
              <div className="flex gap-1.5 p-1 rounded-xl bg-slate-50/50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                {(['all', 'pending', 'completed'] as const).map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={cn('px-4 py-1.5 rounded-lg text-[11px] font-extrabold uppercase tracking-wider transition-all shadow-sm',
                      filter === f ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-md border border-slate-200/50 dark:border-white/10' : 'text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-white/5 border border-transparent')}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 flex flex-col flex-1 relative overflow-hidden">
               {loading ? (
                <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-16 rounded-xl shimmer border border-slate-200/50 dark:border-white/5" />)}</div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 py-16 px-6 rounded-[1.5rem] bg-slate-50/50 dark:bg-indigo-950/10 border-2 border-dashed border-slate-200 dark:border-indigo-500/20 text-slate-500 dark:text-slate-400 animate-in fade-in duration-500">
                  <div className="flex h-20 w-20 mb-4 items-center justify-center rounded-[1.5rem] bg-white dark:bg-indigo-950/30 shadow-sm border border-slate-100 dark:border-indigo-500/20 text-indigo-400 dark:text-indigo-300">
                    <CheckSquare className="h-10 w-10" />
                  </div>
                  <p className="text-lg font-extrabold text-slate-700 dark:text-slate-200">No tasks here</p>
                  <p className="text-sm font-semibold mt-1 opacity-70">You're all caught up!</p>
                </div>
              ) : (
                <div className="space-y-3 relative z-10">
                  {filtered.map((task, index) => (
                    <div key={task.id} 
                      className={cn('group flex items-center gap-4 p-4 rounded-xl border border-slate-200/60 dark:border-white/5 bg-white/40 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-500/40 hover:-translate-y-1 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2', 
                      task.status === 'completed' && 'opacity-60 grayscale-[50%]')}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <button onClick={() => handleToggle(task)} className="shrink-0 transition-transform hover:scale-110 duration-300">
                        {task.status === 'completed' ? <CheckCircle2 className="h-6 w-6 text-emerald-500 dark:text-emerald-400 drop-shadow-sm" /> : <Circle className="h-6 w-6 text-slate-300 dark:text-slate-600 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors" />}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-[15px] font-bold transition-colors duration-300', task.status === 'completed' ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-200')}>{task.title}</p>
                        <div className="flex items-center gap-3 flex-wrap mt-1.5">
                          <Badge className={cn('text-[9px] px-2 py-0.5 font-extrabold uppercase tracking-widest rounded-md shadow-sm', getPriorityColor(task.priority))}>{task.priority}</Badge>
                          
                          {task.due_date && <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400 dark:text-slate-500"><Clock className="h-3 w-3" />{formatDate(getSafeUTCDate(task.due_date), 'MMM d, h:mm a')}</span>}
                        </div>
                      </div>
                      
                      <button onClick={() => handleDelete(task.id)} className="opacity-0 group-hover:opacity-100 transition-all duration-300 p-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-500 dark:text-rose-400 shrink-0 border border-transparent hover:border-rose-200 dark:hover:border-rose-500/30">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Col */}
        <div className="space-y-8">
          <PomodoroTimer />
        </div>
        
      </div>
    </div>
  )
}