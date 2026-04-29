'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  BookOpen, Plus, Calendar, ChevronDown, ChevronUp,
  CheckCircle2, Circle, Trash2, Trophy, AlertTriangle,
  FileText, Link2, Upload, File, X, Loader2,
  Presentation, ExternalLink, Download, Edit3,
  Check, Archive, GraduationCap, RefreshCw
} from 'lucide-react'
import { cn, formatDate, daysUntil, getPriorityColor } from '@/lib/utils'
import { toast } from '@/components/ui/toaster'
import {
  getSubjects, addSubject, updateSubject, deleteSubject,
  getStudyMaterials, addStudyMaterial, deleteStudyMaterial, uploadMaterialFile
} from '@/lib/db'
import { createClient } from '@/lib/supabase/client'
import type { Subject, SyllabusTopic, StudyMaterial } from '@/lib/types'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6']

type SubjectStatus = 'current' | 'completed' | 'archived'
type FilterTab = 'current' | 'completed' | 'archived' | 'all'

const STATUS_CONFIG: Record<SubjectStatus, { label: string; color: string; icon: React.ReactNode }> = {
  current:   { label: 'Current',   color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', icon: <BookOpen className="h-3 w-3" /> },
  completed: { label: 'Completed', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',         icon: <GraduationCap className="h-3 w-3" /> },
  archived:  { label: 'Archived',  color: 'text-muted-foreground bg-muted/50 border-border',          icon: <Archive className="h-3 w-3" /> },
}

const MATERIAL_ICONS: Record<string, React.ReactNode> = {
  pdf:   <FileText className="h-4 w-4 text-rose-400" />,
  ppt:   <Presentation className="h-4 w-4 text-amber-400" />,
  doc:   <FileText className="h-4 w-4 text-blue-400" />,
  link:  <Link2 className="h-4 w-4 text-emerald-400" />,
  note:  <FileText className="h-4 w-4 text-violet-400" />,
  other: <File className="h-4 w-4 text-muted-foreground" />,
}

function getMaterialType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  if (ext === 'pdf') return 'pdf'
  if (['ppt', 'pptx'].includes(ext)) return 'ppt'
  if (['doc', 'docx', 'txt', 'md'].includes(ext)) return 'doc'
  return 'other'
}

function formatSize(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ─────────────────────────────────────────────────────────────────────────────
// Confirm Dialog (simple inline)
// ─────────────────────────────────────────────────────────────────────────────
function ConfirmDelete({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20 animate-fade-in">
      <p className="text-xs text-destructive flex-1">Delete this subject and all its data?</p>
      <Button size="sm" variant="destructive" className="h-6 text-[10px] px-2" onClick={onConfirm}>Delete</Button>
      <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={onCancel}>Cancel</Button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Materials Panel
// ─────────────────────────────────────────────────────────────────────────────
function MaterialsPanel({ subject }: { subject: Subject }) {
  const [materials, setMaterials] = useState<StudyMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showLinkForm, setShowLinkForm] = useState(false)
  const [linkForm, setLinkForm] = useState({ name: '', url: '' })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const loadMaterials = useCallback(() => {
    setLoading(true)
    getStudyMaterials(subject.id).then(d => {
      setMaterials(d as StudyMaterial[])
      setLoading(false)
    })
  }, [subject.id])

  useEffect(() => { loadMaterials() }, [loadMaterials])

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast({ title: 'Not authenticated', variant: 'destructive' }); setUploading(false); return }

    const { url, error: uploadError } = await uploadMaterialFile(file, user.id, subject.id)
    if (uploadError || !url) {
      toast({ title: 'Upload failed', description: 'Make sure the "study-materials" bucket is set up in Supabase Storage.', variant: 'destructive' })
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    const { data, error } = await addStudyMaterial({
      subject_id: subject.id, name: file.name,
      type: getMaterialType(file.name), file_url: url, size_bytes: file.size,
    })
    if (error) {
      toast({ title: 'Failed to save file', variant: 'destructive' })
    } else {
      setMaterials(prev => [data as StudyMaterial, ...prev])
      toast({ title: `${file.name} uploaded ✅` })
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleAddLink() {
    if (!linkForm.name.trim() || !linkForm.url.trim()) {
      toast({ title: 'Name and URL are required', variant: 'destructive' }); return
    }
    const url = linkForm.url.startsWith('http') ? linkForm.url : `https://${linkForm.url}`
    const { data, error } = await addStudyMaterial({
      subject_id: subject.id, name: linkForm.name.trim(), type: 'link', external_url: url,
    })
    if (error) { toast({ title: 'Failed to save link', variant: 'destructive' }); return }
    setMaterials(prev => [data as StudyMaterial, ...prev])
    setLinkForm({ name: '', url: '' })
    setShowLinkForm(false)
    toast({ title: 'Link saved ✅' })
  }

  async function handleDelete(material: StudyMaterial) {
    setMaterials(prev => prev.filter(m => m.id !== material.id))
    if (material.file_url) {
      const path = material.file_url.split('/study-materials/')[1]
      if (path) await supabase.storage.from('study-materials').remove([path])
    }
    const { error } = await deleteStudyMaterial(material.id)
    if (error) { toast({ title: 'Failed to remove', variant: 'destructive' }); loadMaterials() }
    else toast({ title: 'Removed' })
  }

  return (
    <div className="space-y-3">
      {/* Action buttons */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Study Materials</p>
        <div className="flex gap-1.5">
          <input ref={fileInputRef} type="file" className="hidden"
            accept=".pdf,.ppt,.pptx,.doc,.docx,.txt,.md,.png,.jpg"
            onChange={handleFileUpload} />
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5"
            onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
            {uploading ? 'Uploading…' : 'Upload File'}
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5"
            onClick={() => setShowLinkForm(!showLinkForm)}>
            <Link2 className="h-3 w-3" /> Add Link
          </Button>
        </div>
      </div>

      {/* Link form */}
      {showLinkForm && (
        <div className="p-3 rounded-lg border border-primary/20 bg-primary/5 space-y-2 animate-fade-in">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Label (e.g. DBMS PYQ 2023)" className="h-8 text-xs"
              value={linkForm.name} onChange={e => setLinkForm({ ...linkForm, name: e.target.value })} />
            <Input placeholder="URL (YouTube, Drive, etc.)" className="h-8 text-xs"
              value={linkForm.url} onChange={e => setLinkForm({ ...linkForm, url: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && handleAddLink()} />
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="h-7 text-xs" onClick={handleAddLink}>Save Link</Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowLinkForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-1.5">{[1,2].map(i => <div key={i} className="h-10 rounded-lg bg-secondary/40 animate-pulse" />)}</div>
      ) : materials.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground border border-dashed border-border/50 rounded-lg">
          <File className="h-6 w-6 mx-auto mb-1.5 opacity-30" />
          <p className="text-xs">No materials yet</p>
          <p className="text-[10px] mt-0.5 opacity-60">Upload PDFs, PPTs, notes or add links (YouTube, Drive, PYQs)</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {materials.map(m => (
            <div key={m.id} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-secondary/40 group hover:bg-secondary/60 transition-colors">
              <div className="shrink-0">{MATERIAL_ICONS[m.type] ?? MATERIAL_ICONS.other}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{m.name}</p>
                <p className="text-[10px] text-muted-foreground capitalize">
                  {m.type}{m.size_bytes ? ` · ${formatSize(m.size_bytes)}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {(m.file_url || m.external_url) && (
                  <a href={m.file_url ?? m.external_url ?? '#'} target="_blank" rel="noreferrer"
                    className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
                    {m.type === 'link' ? <ExternalLink className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />}
                  </a>
                )}
                <button onClick={() => handleDelete(m)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Studies Page
// ─────────────────────────────────────────────────────────────────────────────
export default function StudiesPage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [filterTab, setFilterTab] = useState<FilterTab>('current')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [innerTab, setInnerTab] = useState<Record<string, 'topics' | 'materials'>>({})
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  // Add form
  const [showAdd, setShowAdd] = useState(false)
  const [addSaving, setAddSaving] = useState(false)
  const [newSubject, setNewSubject] = useState({
    name: '', code: '', credits: 3, exam_date: '', priority: 'medium' as Subject['priority'],
  })

  // Edit form — per subject
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    name: '', code: '', credits: 3, exam_date: '', priority: 'medium' as Subject['priority'],
    status: 'current' as SubjectStatus,
  })
  const [editSaving, setEditSaving] = useState(false)

  // Topic add
  const [newTopic, setNewTopic] = useState<Record<string, string>>({})

  // ── Load subjects fresh from DB ─────────────────────────────────────────────
  const loadSubjects = useCallback(() => {
    setLoading(true)
    getSubjects()
      .then(d => { setSubjects(d as Subject[]); setLoading(false) })
      .catch(() => { toast({ title: 'Failed to load subjects', variant: 'destructive' }); setLoading(false) })
  }, [])

  useEffect(() => { loadSubjects() }, [loadSubjects])

  // ── Derived ─────────────────────────────────────────────────────────────────
  const currentSubjects  = subjects.filter(s => (s as Subject & { status?: string }).status === 'current'   || !(s as Subject & { status?: string }).status)
  const completedSubjects = subjects.filter(s => (s as Subject & { status?: string }).status === 'completed')
  const archivedSubjects  = subjects.filter(s => (s as Subject & { status?: string }).status === 'archived')

  const filteredSubjects = filterTab === 'all'       ? subjects
    : filterTab === 'current'   ? currentSubjects
    : filterTab === 'completed' ? completedSubjects
    : archivedSubjects

  const overallProgress = currentSubjects.length
    ? Math.round(currentSubjects.reduce((s, sub) => s + sub.progress, 0) / currentSubjects.length) : 0

  // ── ADD SUBJECT ─────────────────────────────────────────────────────────────
  async function handleAddSubject() {
    if (!newSubject.name.trim()) {
      toast({ title: 'Subject name is required', variant: 'destructive' }); return
    }
    if (addSaving) return
    setAddSaving(true)

    const color = COLORS[subjects.length % COLORS.length]
    const payload = {
      name: newSubject.name.trim(),
      code: newSubject.code.trim() || null,
      credits: newSubject.credits,
      exam_date: newSubject.exam_date || null,
      priority: newSubject.priority,
      progress: 0,
      syllabus_topics: [],
      color,
      semester_id: null,
      // status stored as extra column — will be ignored by TS type but saved to DB
    }

    const { data, error } = await addSubject(payload)

    if (error) {
      toast({ title: 'Failed to add subject', description: error, variant: 'destructive' })
      setAddSaving(false)
      return
    }

    // Also set status = 'current' immediately after insert
    if (data) {
      await updateSubject((data as Subject).id, { status: 'current' } as Partial<Subject>)
    }

    // Re-fetch from DB (source of truth) instead of just pushing to state
    // This prevents the "disappearing" bug caused by optimistic state mismatches
    await loadSubjects()

    setNewSubject({ name: '', code: '', credits: 3, exam_date: '', priority: 'medium' })
    setShowAdd(false)
    toast({ title: `${(data as Subject).name} added 📚` })
    setAddSaving(false)
  }

  // ── DELETE SUBJECT ──────────────────────────────────────────────────────────
  async function handleDeleteSubject(id: string) {
    setConfirmDelete(null)
    // Optimistic
    setSubjects(prev => prev.filter(s => s.id !== id))
    if (expanded === id) setExpanded(null)

    const { error } = await deleteSubject(id)
    if (error) {
      toast({ title: 'Failed to delete subject', description: error, variant: 'destructive' })
      // Roll back — re-fetch
      loadSubjects()
    } else {
      toast({ title: 'Subject deleted ✅' })
    }
  }

  // ── EDIT SUBJECT ────────────────────────────────────────────────────────────
  function startEdit(subject: Subject & { status?: string }) {
    setEditingId(subject.id)
    setEditForm({
      name: subject.name,
      code: subject.code ?? '',
      credits: subject.credits,
      exam_date: subject.exam_date ?? '',
      priority: subject.priority,
      status: (subject.status as SubjectStatus) ?? 'current',
    })
  }

  function cancelEdit() { setEditingId(null) }

  async function handleSaveEdit(id: string) {
    if (!editForm.name.trim()) {
      toast({ title: 'Subject name is required', variant: 'destructive' }); return
    }
    setEditSaving(true)

    const updates = {
      name: editForm.name.trim(),
      code: editForm.code.trim() || null,
      credits: editForm.credits,
      exam_date: editForm.exam_date || null,
      priority: editForm.priority,
      status: editForm.status,
    }

    // Optimistic UI update
    setSubjects(prev => prev.map(s => s.id === id ? { ...s, ...updates } as Subject : s))
    setEditingId(null)

    const { error } = await updateSubject(id, updates as Partial<Subject>)
    if (error) {
      toast({ title: 'Failed to save changes', description: error, variant: 'destructive' })
      loadSubjects() // roll back
    } else {
      toast({ title: 'Subject updated ✅' })
    }
    setEditSaving(false)
  }

  // ── STATUS CHANGE (quick) ───────────────────────────────────────────────────
  async function handleStatusChange(subject: Subject, newStatus: SubjectStatus) {
    setSubjects(prev => prev.map(s => s.id === subject.id ? { ...s, status: newStatus } as Subject : s))
    const { error } = await updateSubject(subject.id, { status: newStatus } as Partial<Subject>)
    if (error) {
      toast({ title: 'Failed to update status', variant: 'destructive' })
      loadSubjects()
    } else {
      toast({ title: `Marked as ${STATUS_CONFIG[newStatus].label} ✅` })
    }
  }

  // ── TOPIC HANDLERS ──────────────────────────────────────────────────────────
  async function handleAddTopic(subject: Subject) {
    const text = newTopic[subject.id]?.trim()
    if (!text) return
    const updated: SyllabusTopic[] = [
      ...subject.syllabus_topics,
      { id: Date.now().toString(), topic: text, done: false },
    ]
    const newProgress = Math.round(updated.filter(t => t.done).length / updated.length * 100)
    setSubjects(prev => prev.map(s => s.id === subject.id ? { ...s, syllabus_topics: updated, progress: newProgress } : s))
    setNewTopic(prev => ({ ...prev, [subject.id]: '' }))
    const { error } = await updateSubject(subject.id, { syllabus_topics: updated, progress: newProgress })
    if (error) { toast({ title: 'Failed to save topic', variant: 'destructive' }); loadSubjects() }
  }

  async function handleToggleTopic(subject: Subject, topicId: string) {
    const updated = subject.syllabus_topics.map(t => t.id === topicId ? { ...t, done: !t.done } : t)
    const newProgress = updated.length ? Math.round(updated.filter(t => t.done).length / updated.length * 100) : 0
    setSubjects(prev => prev.map(s => s.id === subject.id ? { ...s, syllabus_topics: updated, progress: newProgress } : s))
    await updateSubject(subject.id, { syllabus_topics: updated, progress: newProgress })
  }

  async function handleDeleteTopic(subject: Subject, topicId: string) {
    const updated = subject.syllabus_topics.filter(t => t.id !== topicId)
    const newProgress = updated.length ? Math.round(updated.filter(t => t.done).length / updated.length * 100) : 0
    setSubjects(prev => prev.map(s => s.id === subject.id ? { ...s, syllabus_topics: updated, progress: newProgress } : s))
    await updateSubject(subject.id, { syllabus_topics: updated, progress: newProgress })
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Study Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {currentSubjects.length} current · {completedSubjects.length} completed · {archivedSubjects.length} archived
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon-sm" onClick={loadSubjects} title="Refresh">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button onClick={() => { setShowAdd(!showAdd); setEditingId(null) }} size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> Add Subject
          </Button>
        </div>
      </div>

      {/* Overall progress (current subjects only) */}
      {currentSubjects.length > 0 && (
        <Card className="gradient-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Current Semester Progress</p>
                <p className="text-3xl font-bold mt-0.5">{overallProgress}%</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1.5 justify-end">
                  <Trophy className="h-4 w-4 text-amber-400" />
                  <p className="text-sm font-semibold">{currentSubjects.filter(s => s.progress >= 80).length} strong</p>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{currentSubjects.length} subjects tracked</p>
              </div>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Add Subject Form */}
      {showAdd && (
        <Card className="border-primary/30 animate-fade-in">
          <CardContent className="pt-5 pb-5 space-y-4">
            <p className="text-sm font-semibold">Add New Subject</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Subject Name *</Label>
                <Input placeholder="e.g. Database Management Systems"
                  value={newSubject.name} onChange={e => setNewSubject({ ...newSubject, name: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && handleAddSubject()} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Subject Code</Label>
                <Input placeholder="CSE301"
                  value={newSubject.code} onChange={e => setNewSubject({ ...newSubject, code: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Credits</Label>
                <Input type="number" min={1} max={6} value={newSubject.credits}
                  onChange={e => setNewSubject({ ...newSubject, credits: parseInt(e.target.value) || 3 })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Exam Date</Label>
                <Input type="date" value={newSubject.exam_date}
                  onChange={e => setNewSubject({ ...newSubject, exam_date: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Priority</Label>
              <div className="flex gap-2">
                {(['high', 'medium', 'low'] as const).map(p => (
                  <button key={p} onClick={() => setNewSubject({ ...newSubject, priority: p })}
                    className={cn('px-4 py-1.5 rounded-md text-xs font-medium border capitalize transition-all',
                      newSubject.priority === p ? getPriorityColor(p) : 'border-border text-muted-foreground hover:border-primary/30')}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <Button onClick={handleAddSubject} size="sm" disabled={addSaving} className="gap-1.5">
                {addSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                {addSaving ? 'Saving…' : 'Add Subject'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg w-fit overflow-x-auto">
        {([
          { key: 'current',   label: `Current (${currentSubjects.length})` },
          { key: 'completed', label: `Completed (${completedSubjects.length})` },
          { key: 'archived',  label: `Archived (${archivedSubjects.length})` },
          { key: 'all',       label: `All (${subjects.length})` },
        ] as { key: FilterTab; label: string }[]).map(({ key, label }) => (
          <button key={key} onClick={() => setFilterTab(key)}
            className={cn('px-4 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all',
              filterTab === key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
            {label}
          </button>
        ))}
      </div>

      {/* Subject list */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-24 rounded-xl bg-secondary/50 animate-pulse" />)}
        </div>
      ) : filteredSubjects.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="font-medium">
            {filterTab === 'all' ? 'No subjects yet' : `No ${filterTab} subjects`}
          </p>
          <p className="text-xs mt-1">
            {filterTab === 'all' ? 'Click "Add Subject" to start tracking' : 'Change the filter above to see other subjects'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSubjects.map(subject => {
            const sub = subject as Subject & { status?: SubjectStatus }
            const subStatus: SubjectStatus = sub.status ?? 'current'
            const isExpanded = expanded === sub.id
            const isEditing = editingId === sub.id
            const isConfirmingDelete = confirmDelete === sub.id
            const days = daysUntil(sub.exam_date)
            const doneTasks = sub.syllabus_topics.filter(t => t.done).length
            const isUrgent = days !== null && days >= 0 && days <= 7
            const currentInnerTab = innerTab[sub.id] ?? 'topics'

            return (
              <Card key={sub.id} className={cn(
                'transition-all duration-200',
                isUrgent && subStatus === 'current' && 'border-rose-400/20',
                subStatus === 'archived' && 'opacity-60',
              )}>
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    {/* Color bar */}
                    <div className="h-full w-1 rounded-full shrink-0 self-stretch mt-0.5" style={{ background: sub.color, minHeight: 40 }} />

                    <div className="flex-1 min-w-0">
                      {/* ── EDIT MODE ── */}
                      {isEditing ? (
                        <div className="space-y-3 animate-fade-in" onClick={e => e.stopPropagation()}>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Edit Subject</p>
                          <div className="grid sm:grid-cols-2 gap-3">
                            <div className="space-y-1"><Label className="text-xs">Name *</Label>
                              <Input className="h-8 text-sm" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /></div>
                            <div className="space-y-1"><Label className="text-xs">Code</Label>
                              <Input className="h-8 text-sm" placeholder="CSE301" value={editForm.code} onChange={e => setEditForm({ ...editForm, code: e.target.value })} /></div>
                            <div className="space-y-1"><Label className="text-xs">Credits</Label>
                              <Input type="number" min={1} max={6} className="h-8 text-sm" value={editForm.credits} onChange={e => setEditForm({ ...editForm, credits: parseInt(e.target.value) || 3 })} /></div>
                            <div className="space-y-1"><Label className="text-xs">Exam Date</Label>
                              <Input type="date" className="h-8 text-sm" value={editForm.exam_date} onChange={e => setEditForm({ ...editForm, exam_date: e.target.value })} /></div>
                          </div>
                          <div className="flex gap-4">
                            <div className="space-y-1">
                              <Label className="text-xs">Priority</Label>
                              <div className="flex gap-1.5">
                                {(['high','medium','low'] as const).map(p => (
                                  <button key={p} onClick={() => setEditForm({ ...editForm, priority: p })}
                                    className={cn('px-3 py-1 rounded text-xs font-medium border capitalize transition-all',
                                      editForm.priority === p ? getPriorityColor(p) : 'border-border text-muted-foreground hover:border-primary/30')}>
                                    {p}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Status</Label>
                              <div className="flex gap-1.5">
                                {(['current','completed','archived'] as SubjectStatus[]).map(st => (
                                  <button key={st} onClick={() => setEditForm({ ...editForm, status: st })}
                                    className={cn('px-3 py-1 rounded text-xs font-medium border capitalize transition-all',
                                      editForm.status === st ? STATUS_CONFIG[st].color : 'border-border text-muted-foreground hover:border-primary/30')}>
                                    {STATUS_CONFIG[st].label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 pt-1">
                            <Button size="sm" className="h-7 text-xs gap-1.5" onClick={() => handleSaveEdit(sub.id)} disabled={editSaving}>
                              {editSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                              {editSaving ? 'Saving…' : 'Save Changes'}
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={cancelEdit}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        /* ── VIEW MODE ── */
                        <div>
                          <div className="flex items-center gap-2 flex-wrap cursor-pointer" onClick={() => setExpanded(isExpanded ? null : sub.id)}>
                            <h3 className="font-semibold text-sm">{sub.name}</h3>
                            {sub.code && <span className="text-xs text-muted-foreground font-mono">{sub.code}</span>}
                            <Badge className={cn('text-[10px] border', STATUS_CONFIG[subStatus].color)}>
                              {STATUS_CONFIG[subStatus].label}
                            </Badge>
                            <Badge className={cn('text-[10px]', getPriorityColor(sub.priority))}>{sub.priority}</Badge>
                            {isUrgent && subStatus === 'current' && (
                              <Badge variant="error" className="text-[10px] gap-1">
                                <AlertTriangle className="h-2.5 w-2.5" />{days}d left
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-2 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : sub.id)}>
                            <Progress value={sub.progress} className="flex-1 h-1.5" />
                            <span className="text-xs font-mono text-muted-foreground shrink-0">{sub.progress}%</span>
                          </div>
                          <div className="flex items-center gap-4 mt-1.5 text-[10px] text-muted-foreground cursor-pointer" onClick={() => setExpanded(isExpanded ? null : sub.id)}>
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />{doneTasks}/{sub.syllabus_topics.length} topics
                            </span>
                            {sub.exam_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />Exam: {formatDate(sub.exam_date)}
                              </span>
                            )}
                            <span>{sub.credits} credits</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action buttons (right side) */}
                    {!isEditing && (
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Quick status cycle */}
                        <div className="relative group/status">
                          <button
                            title="Change status"
                            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors text-[10px]"
                            onClick={e => e.stopPropagation()}
                          >
                            <div className={cn('flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px]', STATUS_CONFIG[subStatus].color)}>
                              {STATUS_CONFIG[subStatus].icon}
                              <span className="hidden sm:inline">{STATUS_CONFIG[subStatus].label}</span>
                            </div>
                          </button>
                          {/* Dropdown on hover */}
                          <div className="absolute right-0 top-full mt-1 z-20 hidden group-hover/status:flex flex-col gap-0.5 bg-card border border-border rounded-lg shadow-xl p-1 min-w-[120px]">
                            {(['current','completed','archived'] as SubjectStatus[]).map(st => (
                              <button key={st} onClick={e => { e.stopPropagation(); handleStatusChange(sub, st) }}
                                className={cn('flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all w-full text-left',
                                  subStatus === st ? STATUS_CONFIG[st].color : 'text-muted-foreground hover:bg-secondary hover:text-foreground')}>
                                {STATUS_CONFIG[st].icon}
                                {STATUS_CONFIG[st].label}
                                {subStatus === st && <Check className="h-3 w-3 ml-auto" />}
                              </button>
                            ))}
                          </div>
                        </div>
                        {/* Edit */}
                        <button onClick={e => { e.stopPropagation(); startEdit(sub) }}
                          className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                          title="Edit subject">
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        {/* Delete */}
                        <button onClick={e => { e.stopPropagation(); setConfirmDelete(sub.id) }}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          title="Delete subject">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        {/* Expand toggle */}
                        <button onClick={() => setExpanded(isExpanded ? null : sub.id)}
                          className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Confirm delete */}
                  {isConfirmingDelete && (
                    <div className="mt-3" onClick={e => e.stopPropagation()}>
                      <ConfirmDelete
                        onConfirm={() => handleDeleteSubject(sub.id)}
                        onCancel={() => setConfirmDelete(null)}
                      />
                    </div>
                  )}
                </CardHeader>

                {/* Expanded content */}
                {isExpanded && !isEditing && (
                  <CardContent className="pt-0 border-t border-border/50 animate-fade-in">
                    <div className="mt-4 space-y-4">
                      {/* Inner tab switcher */}
                      <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg w-fit">
                        {(['topics', 'materials'] as const).map(t => (
                          <button key={t} onClick={() => setInnerTab(prev => ({ ...prev, [sub.id]: t }))}
                            className={cn('px-4 py-1.5 rounded-md text-xs font-medium transition-all',
                              currentInnerTab === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
                            {t === 'topics'
                              ? `📋 Topics (${sub.syllabus_topics.length})`
                              : '📁 Materials'}
                          </button>
                        ))}
                      </div>

                      {/* Topics */}
                      {currentInnerTab === 'topics' && (
                        <div className="space-y-1">
                          {sub.syllabus_topics.length === 0 && (
                            <p className="text-xs text-muted-foreground text-center py-3">No topics yet. Add one below.</p>
                          )}
                          {sub.syllabus_topics.map(topic => (
                            <div key={topic.id}
                              className={cn('flex items-center gap-2 p-2 rounded-lg group/t cursor-pointer transition-colors',
                                topic.done ? 'bg-emerald-500/5' : 'hover:bg-secondary/50')}
                              onClick={() => handleToggleTopic(sub, topic.id)}>
                              {topic.done
                                ? <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                : <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />}
                              <span className={cn('text-sm flex-1', topic.done && 'line-through text-muted-foreground')}>
                                {topic.topic}
                              </span>
                              <button onClick={e => { e.stopPropagation(); handleDeleteTopic(sub, topic.id) }}
                                className="opacity-0 group-hover/t:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all shrink-0">
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                          <div className="flex gap-2 mt-2">
                            <Input
                              placeholder="Add topic (e.g. Unit 3 — Normalization)…"
                              className="h-8 text-xs flex-1"
                              value={newTopic[sub.id] ?? ''}
                              onChange={e => setNewTopic(prev => ({ ...prev, [sub.id]: e.target.value }))}
                              onKeyDown={e => e.key === 'Enter' && handleAddTopic(sub)}
                            />
                            <Button size="sm" className="h-8 text-xs px-3" onClick={() => handleAddTopic(sub)}>Add</Button>
                          </div>
                        </div>
                      )}

                      {/* Materials */}
                      {currentInnerTab === 'materials' && <MaterialsPanel subject={sub} />}
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
