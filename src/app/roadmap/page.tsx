'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Map, CheckCircle2, Circle, ChevronDown, ChevronUp, Plus, Target, Trophy, TrendingUp, Trash2, Calendar } from 'lucide-react'
import { cn, formatDate, getCategoryColor } from '@/lib/utils'
import { toast } from '@/components/ui/toaster'
import { getCareerGoals, addCareerGoal, updateCareerGoal, addMilestone, updateMilestone } from '@/lib/db'
import type { CareerGoal, CareerMilestone } from '@/lib/types'

const CATEGORY_LABELS: Record<string, string> = {
  dsa: 'DSA', backend: 'Backend', ai_ml: 'AI/ML',
  project: 'Projects', internship: 'Internship',
  placement: 'Placement', system_design: 'System Design',
}

const CATEGORIES = Object.keys(CATEGORY_LABELS) as CareerGoal['category'][]

export default function RoadmapPage() {
  const [goals, setGoals] = useState<CareerGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showAddGoal, setShowAddGoal] = useState(false)
  const [newGoal, setNewGoal] = useState({ title: '', description: '', category: 'dsa' as CareerGoal['category'], target_date: '', priority: 5 })
  const [newMilestone, setNewMilestone] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => { getCareerGoals().then(d => { setGoals(d as CareerGoal[]); setLoading(false) }) }, [])

  const totalMilestones = goals.flatMap(g => g.milestones ?? []).length
  const completedMilestones = goals.flatMap(g => g.milestones ?? []).filter(m => m.status === 'completed').length
  const overallProgress = totalMilestones ? Math.round((completedMilestones / totalMilestones) * 100) : 0

  async function handleAddGoal() {
    if (!newGoal.title.trim() || saving) return
    setSaving(true)
    const { data, error } = await addCareerGoal({
      title: newGoal.title.trim(), description: newGoal.description.trim(),
      category: newGoal.category, target_date: newGoal.target_date || null,
      priority: newGoal.priority, status: 'pending',
    })
    if (error) toast({ title: 'Failed to add goal', description: error, variant: 'destructive' })
    else {
      setGoals(prev => [...prev, { ...(data as CareerGoal), milestones: [] }])
      setNewGoal({ title: '', description: '', category: 'dsa', target_date: '', priority: 5 })
      setShowAddGoal(false)
      toast({ title: 'Goal added 🎯' })
    }
    setSaving(false)
  }

  async function handleToggleGoalStatus(goal: CareerGoal) {
    const next = goal.status === 'pending' ? 'active' : goal.status === 'active' ? 'completed' : 'pending'
    setGoals(prev => prev.map(g => g.id === goal.id ? { ...g, status: next } : g))
    await updateCareerGoal(goal.id, { status: next })
    toast({ title: `Goal marked as ${next}` })
  }

  async function handleAddMilestone(goalId: string) {
    const text = newMilestone[goalId]?.trim()
    if (!text) return
    const { data, error } = await addMilestone({ goal_id: goalId, title: text, status: 'pending', resources: [] })
    if (error) toast({ title: 'Failed to add milestone', variant: 'destructive' })
    else {
      setGoals(prev => prev.map(g => g.id === goalId ? { ...g, milestones: [...(g.milestones ?? []), data as CareerMilestone] } : g))
      setNewMilestone(prev => ({ ...prev, [goalId]: '' }))
    }
  }

  async function handleToggleMilestone(goalId: string, milestone: CareerMilestone) {
    const next = milestone.status === 'completed' ? 'pending' : 'completed'
    const updates = { status: next, completed_at: next === 'completed' ? new Date().toISOString().split('T')[0] : null }
    setGoals(prev => prev.map(g => g.id === goalId ? {
      ...g, milestones: (g.milestones ?? []).map(m => m.id === milestone.id ? { ...m, ...updates } as CareerMilestone : m)
    } : g))
    await updateMilestone(milestone.id, updates as Partial<CareerMilestone>)
    if (next === 'completed') toast({ title: '✅ Milestone completed!' })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div><h1 className="text-2xl font-bold">Career Roadmap</h1><p className="text-muted-foreground text-sm mt-1">AI-Powered Backend Engineer · Target: ₹12–25 LPA</p></div>
        <Button onClick={() => setShowAddGoal(!showAddGoal)} size="sm" className="gap-2"><Plus className="h-4 w-4" />Add Goal</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 text-center"><p className="text-2xl font-bold gradient-text">{overallProgress}%</p><p className="text-xs text-muted-foreground mt-1">Overall Progress</p></Card>
        <Card className="p-4 text-center"><p className="text-2xl font-bold text-emerald-400">{completedMilestones}</p><p className="text-xs text-muted-foreground mt-1">Done</p></Card>
        <Card className="p-4 text-center"><p className="text-2xl font-bold text-amber-400">{goals.filter(g => g.status === 'active').length}</p><p className="text-xs text-muted-foreground mt-1">Active</p></Card>
        <Card className="p-4 text-center"><p className="text-2xl font-bold text-violet-400">{goals.length}</p><p className="text-xs text-muted-foreground mt-1">Total Goals</p></Card>
      </div>

      {totalMilestones > 0 && (
        <Card className="gradient-border"><CardContent className="p-5">
          <div className="flex items-center justify-between mb-3"><span className="text-sm font-semibold flex items-center gap-2"><Map className="h-4 w-4 text-primary" />Roadmap Progress</span><span className="text-xs text-muted-foreground font-mono">{completedMilestones}/{totalMilestones} milestones</span></div>
          <Progress value={overallProgress} className="h-2.5" />
        </CardContent></Card>
      )}

      {showAddGoal && (
        <Card className="border-primary/30 animate-fade-in">
          <CardHeader><CardTitle className="text-base">Add New Goal</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-2"><Label>Goal Title *</Label><Input placeholder="e.g. Master FastAPI" value={newGoal.title} onChange={e => setNewGoal({ ...newGoal, title: e.target.value })} /></div>
              <div className="sm:col-span-2 space-y-2"><Label>Description</Label><Input placeholder="What does achieving this look like?" value={newGoal.description} onChange={e => setNewGoal({ ...newGoal, description: e.target.value })} /></div>
              <div className="space-y-2"><Label>Category</Label>
                <select className="w-full h-10 rounded-lg border border-input bg-background/50 px-3 text-sm"
                  value={newGoal.category} onChange={e => setNewGoal({ ...newGoal, category: e.target.value as CareerGoal['category'] })}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                </select>
              </div>
              <div className="space-y-2"><Label>Target Date</Label><Input type="date" value={newGoal.target_date} onChange={e => setNewGoal({ ...newGoal, target_date: e.target.value })} /></div>
              <div className="space-y-2"><Label>Priority (1–10): {newGoal.priority}</Label>
                <input type="range" min={1} max={10} value={newGoal.priority} onChange={e => setNewGoal({ ...newGoal, priority: parseInt(e.target.value) })} className="w-full" />
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleAddGoal} size="sm" disabled={saving}>{saving ? 'Saving…' : 'Add Goal'}</Button>
              <Button variant="ghost" size="sm" onClick={() => setShowAddGoal(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 rounded-xl bg-secondary/50 animate-pulse" />)}</div>
      ) : goals.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Target className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="font-medium">No goals yet</p>
          <p className="text-xs mt-1">Click "Add Goal" to start building your career roadmap</p>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((goal, idx) => {
            const isExpanded = expanded === goal.id
            const milestones = goal.milestones ?? []
            const done = milestones.filter(m => m.status === 'completed').length
            const progress = milestones.length ? Math.round((done / milestones.length) * 100) : 0

            return (
              <Card key={goal.id} className={cn('transition-all duration-200', goal.status === 'active' && 'border-primary/30', goal.status === 'completed' && 'border-emerald-500/20')}>
                <CardHeader className="pb-3 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : goal.id)}>
                  <div className="flex items-start gap-3">
                    <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold',
                      goal.status === 'active' ? 'bg-primary/20 text-primary border border-primary/30' :
                      goal.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-secondary text-muted-foreground')}>{idx + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm">{goal.title}</h3>
                        <Badge className={cn('text-[10px]', getCategoryColor(goal.category))}>{CATEGORY_LABELS[goal.category]}</Badge>
                        <button onClick={e => { e.stopPropagation(); handleToggleGoalStatus(goal) }}
                          className={cn('text-[10px] px-2 py-0.5 rounded-full border font-medium transition-all',
                            goal.status === 'active' ? 'border-emerald-400/30 text-emerald-400 bg-emerald-400/10' :
                            goal.status === 'completed' ? 'border-primary/30 text-primary bg-primary/10' : 'border-border text-muted-foreground hover:border-primary/30')}>
                          {goal.status}
                        </button>
                      </div>
                      {goal.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{goal.description}</p>}
                      <div className="flex items-center gap-3 mt-2">
                        <Progress value={progress} className="flex-1 h-1.5" />
                        <span className="text-xs font-mono text-muted-foreground shrink-0">{progress}%</span>
                        {goal.target_date && <span className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0"><Calendar className="h-3 w-3" />{formatDate(goal.target_date, 'MMM yyyy')}</span>}
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0 border-t border-border/50 animate-fade-in">
                    <div className="mt-4 relative">
                      <div className="absolute left-3.5 top-0 bottom-0 w-px bg-border/50" />
                      <div className="space-y-2 pl-8">
                        {milestones.map(milestone => (
                          <div key={milestone.id} className="relative">
                            <div className={cn('absolute -left-[22px] mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all',
                              milestone.status === 'completed' ? 'bg-emerald-400/20 border-emerald-400 hover:bg-emerald-400/30' : 'bg-background border-border hover:border-primary')}
                              onClick={() => handleToggleMilestone(goal.id, milestone)}>
                              {milestone.status === 'completed' && <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
                            </div>
                            <div className={cn('p-2.5 rounded-lg border transition-colors',
                              milestone.status === 'completed' ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-secondary/30 border-border/30')}>
                              <div className="flex items-center justify-between gap-2">
                                <p className={cn('text-xs font-medium', milestone.status === 'completed' && 'line-through text-muted-foreground')}>{milestone.title}</p>
                                {milestone.target_date && <span className="text-[10px] text-muted-foreground shrink-0">{formatDate(milestone.target_date, 'MMM yyyy')}</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                        {/* Add milestone */}
                        <div className="relative">
                          <div className="absolute -left-[22px] mt-2 h-4 w-4 rounded-full border-2 border-dashed border-border" />
                          <div className="flex gap-2">
                            <Input placeholder="Add a milestone..." className="h-8 text-xs flex-1"
                              value={newMilestone[goal.id] ?? ''}
                              onChange={e => setNewMilestone(prev => ({ ...prev, [goal.id]: e.target.value }))}
                              onKeyDown={e => e.key === 'Enter' && handleAddMilestone(goal.id)} />
                            <Button size="sm" className="h-8 text-xs px-3" onClick={() => handleAddMilestone(goal.id)}>Add</Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
