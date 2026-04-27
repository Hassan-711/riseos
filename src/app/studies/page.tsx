'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BookOpen, Plus, Calendar, ChevronDown, ChevronUp, CheckCircle2, Circle, Trash2, Trophy, AlertTriangle } from 'lucide-react'
import { cn, formatDate, daysUntil, getPriorityColor } from '@/lib/utils'
import { toast } from '@/components/ui/toaster'
import { getSubjects, addSubject, updateSubject, deleteSubject } from '@/lib/db'
import type { Subject, SyllabusTopic } from '@/lib/types'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4']

export default function StudiesPage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newSubject, setNewSubject] = useState({ name: '', code: '', credits: 3, exam_date: '', priority: 'medium' as Subject['priority'] })
  // Topic add state per subject
  const [newTopic, setNewTopic] = useState<Record<string, string>>({})

  useEffect(() => { getSubjects().then(d => { setSubjects(d as Subject[]); setLoading(false) }) }, [])

  const overallProgress = subjects.length ? Math.round(subjects.reduce((s, sub) => s + sub.progress, 0) / subjects.length) : 0

  async function handleAddSubject() {
    if (!newSubject.name.trim() || saving) return
    setSaving(true)
    const color = COLORS[subjects.length % COLORS.length]
    const { data, error } = await addSubject({
      name: newSubject.name.trim(), code: newSubject.code.trim(),
      credits: newSubject.credits, exam_date: newSubject.exam_date || null,
      priority: newSubject.priority, progress: 0, syllabus_topics: [], color,
      semester_id: null,
    })
    if (error) { toast({ title: 'Failed to add subject', description: error, variant: 'destructive' }) }
    else {
      setSubjects(prev => [...prev, data as Subject])
      setNewSubject({ name: '', code: '', credits: 3, exam_date: '', priority: 'medium' })
      setShowAdd(false)
      toast({ title: `${(data as Subject).name} added 📚` })
    }
    setSaving(false)
  }

  async function handleDeleteSubject(id: string) {
    setSubjects(prev => prev.filter(s => s.id !== id))
    const { error } = await deleteSubject(id)
    if (error) { toast({ title: 'Failed to delete', variant: 'destructive' }); getSubjects().then(d => setSubjects(d as Subject[])) }
    else toast({ title: 'Subject removed' })
  }

  async function handleAddTopic(subject: Subject) {
    const text = newTopic[subject.id]?.trim()
    if (!text) return
    const updatedTopics: SyllabusTopic[] = [...subject.syllabus_topics, { id: Date.now().toString(), topic: text, done: false }]
    const newProgress = Math.round(updatedTopics.filter(t => t.done).length / updatedTopics.length * 100)
    setSubjects(prev => prev.map(s => s.id === subject.id ? { ...s, syllabus_topics: updatedTopics, progress: newProgress } : s))
    setNewTopic(prev => ({ ...prev, [subject.id]: '' }))
    const { error } = await updateSubject(subject.id, { syllabus_topics: updatedTopics, progress: newProgress })
    if (error) { toast({ title: 'Failed to save topic', variant: 'destructive' }); getSubjects().then(d => setSubjects(d as Subject[])) }
  }

  async function handleToggleTopic(subject: Subject, topicId: string) {
    const updatedTopics = subject.syllabus_topics.map(t => t.id === topicId ? { ...t, done: !t.done } : t)
    const newProgress = updatedTopics.length ? Math.round(updatedTopics.filter(t => t.done).length / updatedTopics.length * 100) : 0
    setSubjects(prev => prev.map(s => s.id === subject.id ? { ...s, syllabus_topics: updatedTopics, progress: newProgress } : s))
    await updateSubject(subject.id, { syllabus_topics: updatedTopics, progress: newProgress })
  }

  async function handleDeleteTopic(subject: Subject, topicId: string) {
    const updatedTopics = subject.syllabus_topics.filter(t => t.id !== topicId)
    const newProgress = updatedTopics.length ? Math.round(updatedTopics.filter(t => t.done).length / updatedTopics.length * 100) : 0
    setSubjects(prev => prev.map(s => s.id === subject.id ? { ...s, syllabus_topics: updatedTopics, progress: newProgress } : s))
    await updateSubject(subject.id, { syllabus_topics: updatedTopics, progress: newProgress })
  }

  async function handleUpdateExamDate(subject: Subject, date: string) {
    setSubjects(prev => prev.map(s => s.id === subject.id ? { ...s, exam_date: date } : s))
    await updateSubject(subject.id, { exam_date: date || null })
    toast({ title: 'Exam date saved ✅' })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div><h1 className="text-2xl font-bold">Study Dashboard</h1><p className="text-muted-foreground text-sm mt-1">Track your subjects, topics, and exam dates</p></div>
        <Button onClick={() => setShowAdd(!showAdd)} size="sm" className="gap-2"><Plus className="h-4 w-4" />Add Subject</Button>
      </div>

      {subjects.length > 0 && (
        <Card className="gradient-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div><p className="text-sm font-medium text-muted-foreground">Overall Progress</p><p className="text-3xl font-bold mt-1">{overallProgress}%</p></div>
              <div className="flex items-center gap-2"><Trophy className="h-5 w-5 text-amber-400" /><div className="text-right"><p className="text-sm font-semibold">Subjects</p><p className="text-lg font-bold gradient-text">{subjects.length}</p></div></div>
            </div>
            <Progress value={overallProgress} className="h-2.5" />
          </CardContent>
        </Card>
      )}

      {showAdd && (
        <Card className="border-primary/30 animate-fade-in">
          <CardHeader><CardTitle className="text-base">Add New Subject</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Subject Name *</Label><Input placeholder="e.g. Operating Systems" value={newSubject.name} onChange={e => setNewSubject({ ...newSubject, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Subject Code</Label><Input placeholder="CSE202" value={newSubject.code} onChange={e => setNewSubject({ ...newSubject, code: e.target.value })} /></div>
              <div className="space-y-2"><Label>Credits</Label><Input type="number" min={1} max={6} value={newSubject.credits} onChange={e => setNewSubject({ ...newSubject, credits: parseInt(e.target.value) || 3 })} /></div>
              <div className="space-y-2"><Label>Exam Date</Label><Input type="date" value={newSubject.exam_date} onChange={e => setNewSubject({ ...newSubject, exam_date: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Priority</Label>
              <div className="flex gap-2">
                {(['high', 'medium', 'low'] as const).map(p => (
                  <button key={p} onClick={() => setNewSubject({ ...newSubject, priority: p })}
                    className={cn('px-4 py-1.5 rounded-md text-xs font-medium border capitalize transition-all', newSubject.priority === p ? getPriorityColor(p) : 'border-border text-muted-foreground')}>{p}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleAddSubject} size="sm" disabled={saving}>{saving ? 'Saving…' : 'Add Subject'}</Button>
              <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 rounded-xl bg-secondary/50 animate-pulse" />)}</div>
      ) : subjects.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="font-medium">No subjects yet</p>
          <p className="text-xs mt-1">Click "Add Subject" to start tracking your studies</p>
        </div>
      ) : (
        <div className="space-y-3">
          {subjects.map(subject => {
            const isExpanded = expanded === subject.id
            const days = daysUntil(subject.exam_date)
            const doneTasks = subject.syllabus_topics.filter(t => t.done).length
            const isUrgent = days !== null && days >= 0 && days <= 7

            return (
              <Card key={subject.id} className={cn('transition-all duration-200', isUrgent && 'border-rose-400/20')}>
                <CardHeader className="pb-3 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : subject.id)}>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-1 rounded-full shrink-0" style={{ background: subject.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm">{subject.name}</h3>
                        {subject.code && <span className="text-xs text-muted-foreground font-mono">{subject.code}</span>}
                        <Badge className={cn('text-[10px]', getPriorityColor(subject.priority))}>{subject.priority}</Badge>
                        {isUrgent && <Badge variant="error" className="text-[10px] gap-1"><AlertTriangle className="h-2.5 w-2.5" />{days}d left</Badge>}
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <Progress value={subject.progress} className="flex-1 h-1.5" />
                        <span className="text-xs font-mono text-muted-foreground shrink-0">{subject.progress}%</span>
                      </div>
                      <div className="flex items-center gap-4 mt-1.5 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />{doneTasks}/{subject.syllabus_topics.length} topics</span>
                        {subject.exam_date && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Exam: {formatDate(subject.exam_date)}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={e => { e.stopPropagation(); handleDeleteSubject(subject.id) }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0 border-t border-border/50 animate-fade-in">
                    <div className="mt-4 space-y-4">
                      {/* Exam date edit */}
                      <div className="flex items-center gap-3">
                        <Label className="text-xs shrink-0">Exam Date:</Label>
                        <Input type="date" className="h-8 text-xs flex-1"
                          defaultValue={subject.exam_date ?? ''}
                          onBlur={e => { if (e.target.value !== (subject.exam_date ?? '')) handleUpdateExamDate(subject, e.target.value) }} />
                      </div>

                      {/* Topics */}
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Syllabus Topics</p>
                        {subject.syllabus_topics.map(topic => (
                          <div key={topic.id} className={cn('flex items-center gap-2 p-2 rounded-lg mb-1 group/topic cursor-pointer transition-colors', topic.done ? 'bg-emerald-500/5' : 'hover:bg-secondary/50')}
                            onClick={() => handleToggleTopic(subject, topic.id)}>
                            {topic.done ? <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" /> : <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />}
                            <span className={cn('text-sm flex-1', topic.done && 'line-through text-muted-foreground')}>{topic.topic}</span>
                            <button onClick={e => { e.stopPropagation(); handleDeleteTopic(subject, topic.id) }}
                              className="opacity-0 group-hover/topic:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all shrink-0">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                        {/* Add topic input */}
                        <div className="flex gap-2 mt-2">
                          <Input placeholder="Add a topic..." className="h-8 text-xs flex-1"
                            value={newTopic[subject.id] ?? ''}
                            onChange={e => setNewTopic(prev => ({ ...prev, [subject.id]: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && handleAddTopic(subject)} />
                          <Button size="sm" className="h-8 text-xs px-3" onClick={() => handleAddTopic(subject)}>Add</Button>
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