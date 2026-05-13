'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileText, User, Code2, Award, Briefcase, GitBranch, ExternalLink, Plus, Edit3, Download, Github, Linkedin, Trash2, Loader2, CheckCircle2, GraduationCap } from 'lucide-react'
import { cn, generateInitials } from '@/lib/utils'
import { toast } from '@/components/ui/toaster'
import { getProfile, updateProfile, getSkills, addSkill, updateSkill, deleteSkill, getProjects, addProject, deleteProject, getCertifications, addCertification, deleteCertification, getWorkExperience, addWorkExperience, deleteWorkExperience, getAcademics, addAcademic, updateAcademic, deleteAcademic } from '@/lib/db'
import type { Profile, Skill, Project, Certification, WorkExperience } from '@/lib/types'

const SKILL_CATEGORIES = ['language', 'framework', 'database', 'tool', 'soft', 'cloud'] as const
const CATEGORY_LABELS: Record<string, string> = { language: 'Languages', framework: 'Frameworks', database: 'Databases', tool: 'Tools', soft: 'Soft Skills', cloud: 'Cloud' }
const CATEGORY_COLORS: Record<string, string> = { language: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20', framework: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/20', database: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20', tool: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20', soft: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20', cloud: 'text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20' }

type Tab = 'overview' | 'education' | 'skills' | 'projects' | 'certifications' | 'experience' | 'preview'

type Academic = { id: string; institution: string; degree: string; start_year: number; end_year: number; score: string; score_type: string }

const EMPTY_PROFILE: Profile & { role?: string | null } = {
  id: '', full_name: null, email: null, bio: null, avatar_url: null,
  university: null, degree: null, enrollment_no: null, current_semester: null,
  cgpa: null, career_goal: null, role: null, linkedin_url: null, github_url: null,
  portfolio_url: null, created_at: '', updated_at: '',
}

export default function ResumePage() {
  const [tab, setTab] = useState<Tab>('overview')
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile & { role?: string | null }>(EMPTY_PROFILE)
  const [bio, setBio] = useState('')
  const [editBio, setEditBio] = useState(false)
  const [savingBio, setSavingBio] = useState(false)
  
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [tempTitle, setTempTitle] = useState('')

  const [academics, setAcademics] = useState<Academic[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [certs, setCerts] = useState<Certification[]>([])
  const [experience, setExperience] = useState<WorkExperience[]>([])

  const [showAddAcad, setShowAddAcad] = useState(false)
  const [newAcad, setNewAcad] = useState({ institution: '', degree: '', start_year: new Date().getFullYear() - 4, end_year: new Date().getFullYear(), score: '', score_type: 'CGPA' })
  
  // 🔥 New Edit States for Academics
  const [editingAcadId, setEditingAcadId] = useState<string | null>(null)
  const [editAcadData, setEditAcadData] = useState<Partial<Academic>>({})

  const [showAddSkill, setShowAddSkill] = useState(false)
  const [newSkill, setNewSkill] = useState({ name: '', category: 'language' as Skill['category'], proficiency: 50 })
  const [showAddProject, setShowAddProject] = useState(false)
  const [newProject, setNewProject] = useState({ title: '', description: '', tech_stack: '', github_url: '', live_url: '', status: 'in_progress' as Project['status'] })
  const [showAddCert, setShowAddCert] = useState(false)
  const [newCert, setNewCert] = useState({ name: '', issuer: '', issue_date: '', cert_url: '', credential_id: '' })
  const [showAddExp, setShowAddExp] = useState(false)
  const [newExp, setNewExp] = useState({ company: '', role: '', start_date: '', end_date: '', is_current: false, description: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([getProfile(), getAcademics(), getSkills(), getProjects(), getCertifications(), getWorkExperience()]).then(([p, a, s, pr, c, e]) => {
      if (p) {
        const typedProfile = p as Profile & { role?: string | null }
        setProfile(typedProfile)
        setBio(typedProfile.bio ?? '')
        setTempTitle(typedProfile.role ?? typedProfile.career_goal ?? '')
      }
      setAcademics(a as Academic[])
      setSkills(s as Skill[])
      setProjects(pr as Project[])
      setCerts(c as Certification[])
      setExperience(e as WorkExperience[])
      setLoading(false)
    })
  }, [])

  const currentTitle = profile.role || profile.career_goal

  async function saveTitle() {
    setIsEditingTitle(false)
    if (tempTitle.trim() === currentTitle) return
    setProfile(p => ({ ...p, role: tempTitle.trim(), career_goal: tempTitle.trim() }))
    const { error } = await updateProfile({ career_goal: tempTitle.trim(), updated_at: new Date().toISOString() })
    if (error) {
      toast({ title: 'Failed to update title', variant: 'destructive' })
      setTempTitle(currentTitle ?? '')
      setProfile(p => ({ ...p, role: p.role, career_goal: p.career_goal }))
    } else {
      toast({ title: 'Title updated ✅' })
    }
  }

  function handleExportPDF() {
    if (tab !== 'preview') {
      setTab('preview')
      setTimeout(() => window.print(), 300)
    } else {
      window.print()
    }
  }

  async function saveBio() {
    setSavingBio(true)
    await updateProfile({ bio, updated_at: new Date().toISOString() })
    setProfile(p => ({ ...p, bio }))
    setEditBio(false); setSavingBio(false)
    toast({ title: 'Bio saved ✅' })
  }

  // ─── ACADEMICS HANDLERS ───
  async function handleAddAcad() {
    if (!newAcad.institution.trim() || saving) return
    setSaving(true)
    const { data, error } = await addAcademic(newAcad)
    if (error) toast({ title: 'Failed', description: error, variant: 'destructive' })
    else { 
      setAcademics(p => [data as Academic, ...p])
      setNewAcad({ institution: '', degree: '', start_year: new Date().getFullYear() - 4, end_year: new Date().getFullYear(), score: '', score_type: 'CGPA' })
      setShowAddAcad(false)
      toast({ title: 'Education added ✅' }) 
    }
    setSaving(false)
  }

  function startEditAcad(a: Academic) {
    setEditingAcadId(a.id)
    setEditAcadData(a)
  }

  async function handleUpdateAcad() {
    if (!editAcadData.institution?.trim() || saving || !editingAcadId) return
    setSaving(true)
    const { error } = await updateAcademic(editingAcadId, editAcadData)
    if (error) {
      toast({ title: 'Failed to update', description: error, variant: 'destructive' })
    } else {
      setAcademics(p => p.map(a => a.id === editingAcadId ? { ...a, ...editAcadData } as Academic : a))
      toast({ title: 'Education updated ✅' })
      setEditingAcadId(null)
    }
    setSaving(false)
  }

  async function handleDeleteAcad(id: string) {
    setAcademics(p => p.filter(a => a.id !== id))
    await deleteAcademic(id); toast({ title: 'Education removed' })
  }

  // SKILLS HANDLERS
  async function handleAddSkill() {
    if (!newSkill.name.trim() || saving) return
    setSaving(true)
    const { data, error } = await addSkill(newSkill)
    if (error) toast({ title: 'Failed', description: error, variant: 'destructive' })
    else { setSkills(p => [...p, data as Skill]); setNewSkill({ name: '', category: 'language', proficiency: 50 }); setShowAddSkill(false); toast({ title: 'Skill added ✅' }) }
    setSaving(false)
  }
  async function handleDeleteSkill(id: string) {
    setSkills(p => p.filter(s => s.id !== id))
    await deleteSkill(id); toast({ title: 'Skill removed' })
  }
  async function handleUpdateSkillProficiency(skill: Skill, val: number) {
    setSkills(p => p.map(s => s.id === skill.id ? { ...s, proficiency: val } : s))
    await updateSkill(skill.id, { proficiency: val })
  }

  // PROJECTS HANDLERS
  async function handleAddProject() {
    if (!newProject.title.trim() || saving) return
    setSaving(true)
    const { data, error } = await addProject({
      ...newProject, tech_stack: newProject.tech_stack.split(',').map(t => t.trim()).filter(Boolean), highlights: [], start_date: null, end_date: null,
    })
    if (error) toast({ title: 'Failed', description: error, variant: 'destructive' })
    else { setProjects(p => [data as Project, ...p]); setNewProject({ title: '', description: '', tech_stack: '', github_url: '', live_url: '', status: 'in_progress' }); setShowAddProject(false); toast({ title: 'Project added ✅' }) }
    setSaving(false)
  }
  async function handleDeleteProject(id: string) {
    setProjects(p => p.filter(pr => pr.id !== id))
    await deleteProject(id); toast({ title: 'Project removed' })
  }

  // CERTS HANDLERS
  async function handleAddCert() {
    if (!newCert.name.trim() || saving) return
    setSaving(true)
    const { data, error } = await addCertification(newCert)
    if (error) toast({ title: 'Failed', description: error, variant: 'destructive' })
    else { setCerts(p => [data as Certification, ...p]); setNewCert({ name: '', issuer: '', issue_date: '', cert_url: '', credential_id: '' }); setShowAddCert(false); toast({ title: 'Certificate added ✅' }) }
    setSaving(false)
  }
  async function handleDeleteCert(id: string) {
    setCerts(p => p.filter(c => c.id !== id))
    await deleteCertification(id); toast({ title: 'Certificate removed' })
  }

  // EXPERIENCE HANDLERS
  async function handleAddExp() {
    if (!newExp.company.trim() || saving) return
    setSaving(true)
    const { data, error } = await addWorkExperience({ ...newExp, skills_used: [] })
    if (error) toast({ title: 'Failed', description: error, variant: 'destructive' })
    else { setExperience(p => [data as WorkExperience, ...p]); setNewExp({ company: '', role: '', start_date: '', end_date: '', is_current: false, description: '' }); setShowAddExp(false); toast({ title: 'Experience added ✅' }) }
    setSaving(false)
  }
  async function handleDeleteExp(id: string) {
    setExperience(p => p.filter(e => e.id !== id))
    await deleteWorkExperience(id); toast({ title: 'Experience removed' })
  }

  const groupedSkills = SKILL_CATEGORIES.reduce((acc, cat) => { acc[cat] = skills.filter(s => s.category === cat); return acc }, {} as Record<string, Skill[]>)
  const TABS: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'education', label: `Education (${academics.length})` },
    { key: 'skills', label: `Skills (${skills.length})` },
    { key: 'projects', label: `Projects (${projects.length})` },
    { key: 'certifications', label: `Certs (${certs.length})` },
    { key: 'experience', label: `Experience (${experience.length})` },
    { key: 'preview', label: 'ATS Preview' },
  ]

  if (loading) {
    return (
      <div className="space-y-8 w-full max-w-[1800px] mx-auto">
        <div className="h-9 w-72 shimmer rounded-xl" />
        <div className="h-40 rounded-[2rem] shimmer" />
        <div className="h-14 rounded-2xl shimmer w-full" />
        <div className="h-96 rounded-[2rem] shimmer w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-8 w-full max-w-[1800px] mx-auto animate-slide-in">
      
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 relative no-print">
        <div className="relative">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
            Resume Dashboard 📄
          </h1>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-2">
            Manage your professional profile and generate ATS-friendly PDFs
          </p>
        </div>
        <Button onClick={handleExportPDF} className="relative gap-2 shadow-[0_8px_20px_rgba(79,70,229,0.3)] hover:shadow-[0_12px_25px_rgba(79,70,229,0.4)] hover:-translate-y-0.5 transition-all bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-5 px-6 font-bold">
          <Download className="h-4 w-4" strokeWidth={3} /> Export PDF
        </Button>
      </div>

      {/* Profile Card */}
      <div className="glass-card p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start md:items-center relative overflow-hidden no-print">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border-2 border-indigo-200 dark:border-indigo-500/20 text-3xl font-black text-indigo-600 dark:text-indigo-400 shadow-inner">
          {generateInitials(profile.full_name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{profile.full_name || 'Your Name'}</h2>
              <div className="mt-1">
                {isEditingTitle ? (
                  <Input autoFocus value={tempTitle} onChange={(e) => setTempTitle(e.target.value)} onBlur={saveTitle} onKeyDown={(e) => e.key === 'Enter' && saveTitle()} className="h-7 text-sm font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-white/50 dark:bg-white/5 border-indigo-200 dark:border-indigo-500/30 w-full max-w-sm px-2" />
                ) : (
                  <p onClick={() => setIsEditingTitle(true)} className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-2 group">
                    {currentTitle ? currentTitle : <span className="opacity-50 border-b border-dashed border-indigo-400/50">Add Professional Title (e.g. Software Engineer)...</span>}
                    <Edit3 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-[13px] font-bold text-slate-500 dark:text-slate-400">
            {profile.email && <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"/> {profile.email}</span>}
            {profile.github_url && <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-indigo-500 cursor-pointer"><Github className="h-4 w-4" /> {profile.github_url}</span>}
            {profile.linkedin_url && <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-indigo-500 cursor-pointer"><Linkedin className="h-4 w-4" /> {profile.linkedin_url}</span>}
          </div>
        </div>
      </div>

      {/* Tab Nav */}
      <div className="flex gap-2 p-2 rounded-2xl bg-white/40 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 overflow-x-auto scrollbar-hide shadow-sm backdrop-blur-md no-print">
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={cn('flex-shrink-0 px-5 py-2.5 rounded-xl text-[13px] font-extrabold tracking-wide whitespace-nowrap transition-all duration-300',
              tab === key ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-md border border-slate-200/50 dark:border-white/10' : 'text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-white/10 border border-transparent hover:text-slate-700 dark:hover:text-slate-200')}>
            {label}
          </button>
        ))}
      </div>

      {/* ── TAB CONTENTS ── */}

      {/* OVERVIEW */}
      {tab === 'overview' && (
        <div className="glass-card p-6 md:p-8 animate-fade-in flex flex-col gap-6 no-print">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200/60 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl icon-violet shadow-sm">
                <User className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Professional Summary</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setEditBio(!editBio)} className="rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-500">
              <Edit3 className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="pt-2">
            {editBio ? (
              <div className="space-y-4 animate-fade-in">
                <textarea className="w-full min-h-[150px] rounded-xl border-2 border-indigo-100 dark:border-indigo-500/20 bg-white/50 dark:bg-white/5 px-4 py-4 text-[15px] font-medium text-slate-700 dark:text-slate-200 resize-none focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/10 transition-all shadow-inner"
                  value={bio} onChange={e => setBio(e.target.value)} placeholder="Write a compelling summary about your career, goals, and passions..." />
                <div className="flex gap-3">
                  <Button onClick={saveBio} disabled={savingBio} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 shadow-md">
                    {savingBio ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Save Summary
                  </Button>
                  <Button variant="ghost" onClick={() => setEditBio(false)} className="rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 font-bold text-slate-500">Cancel</Button>
                </div>
              </div>
            ) : bio ? (
              <p className="text-[15px] font-medium text-slate-600 dark:text-slate-300 leading-relaxed max-w-4xl">{bio}</p>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <FileText className="h-12 w-12 mb-4 opacity-20" />
                <p className="text-[15px] font-bold">No summary added yet.</p>
                <p className="text-sm font-semibold opacity-70 mt-1">Click the edit button above to write your professional summary.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* EDUCATION TAB */}
      {tab === 'education' && (
        <div className="space-y-6 animate-fade-in no-print">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">Academic History</h3>
            <Button onClick={() => setShowAddAcad(!showAddAcad)} disabled={editingAcadId !== null} className="gap-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 font-bold shadow-sm">
              <Plus className="h-4 w-4" strokeWidth={3} /> Add Education
            </Button>
          </div>

          {/* Add New Education Form */}
          {showAddAcad && (
            <div className="glass-card p-6 border-indigo-200/50 dark:border-indigo-500/20 animate-fade-in">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Institution Name & Board</Label>
                  <Input placeholder="e.g. Amity University OR St. Mary's School (CBSE)" value={newAcad.institution} onChange={e => setNewAcad({...newAcad, institution: e.target.value})} className="bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Degree / Class</Label>
                  <Input placeholder="e.g. B.Tech CSE OR 12th Standard" value={newAcad.degree} onChange={e => setNewAcad({...newAcad, degree: e.target.value})} className="bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Start Year</Label>
                  <Input type="number" value={newAcad.start_year} onChange={e => setNewAcad({...newAcad, start_year: parseInt(e.target.value)})} className="bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">End Year (or Passing Year)</Label>
                  <Input type="number" value={newAcad.end_year} onChange={e => setNewAcad({...newAcad, end_year: parseInt(e.target.value)})} className="bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Score (CGPA or %)</Label>
                  <Input placeholder="e.g. 9.8 or 92%" value={newAcad.score} onChange={e => setNewAcad({...newAcad, score: e.target.value})} className="bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Score Type</Label>
                  <select className="w-full h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 px-3 text-sm font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-400"
                    value={newAcad.score_type} onChange={e => setNewAcad({...newAcad, score_type: e.target.value})}>
                    <option value="CGPA">CGPA</option>
                    <option value="Percentage">Percentage</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6 pt-6 border-t border-slate-200/60 dark:border-white/10">
                <Button onClick={handleAddAcad} disabled={saving} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 shadow-md">{saving ? 'Saving…' : 'Save Education'}</Button>
                <Button variant="ghost" onClick={() => setShowAddAcad(false)} className="rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 font-bold text-slate-500">Cancel</Button>
              </div>
            </div>
          )}

          {academics.length === 0 && !showAddAcad ? (
            <div className="glass-card flex flex-col items-center justify-center py-16 border-dashed border-2">
              <GraduationCap className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-[15px] font-bold text-slate-500">No education added yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {academics.map(a => (
                editingAcadId === a.id ? (
                  // Inline Edit Form for this specific Academic item
                  <div key={a.id} className="glass-card p-6 border-indigo-400 animate-fade-in shadow-md">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Institution Name & Board</Label>
                        <Input placeholder="e.g. Amity University OR St. Mary's School (CBSE)" value={editAcadData.institution || ''} onChange={e => setEditAcadData({...editAcadData, institution: e.target.value})} className="bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl font-bold" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Degree / Class</Label>
                        <Input placeholder="e.g. B.Tech CSE OR 12th Standard" value={editAcadData.degree || ''} onChange={e => setEditAcadData({...editAcadData, degree: e.target.value})} className="bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl font-bold" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Start Year</Label>
                        <Input type="number" value={editAcadData.start_year || ''} onChange={e => setEditAcadData({...editAcadData, start_year: parseInt(e.target.value)})} className="bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">End Year (or Passing Year)</Label>
                        <Input type="number" value={editAcadData.end_year || ''} onChange={e => setEditAcadData({...editAcadData, end_year: parseInt(e.target.value)})} className="bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Score (CGPA or %)</Label>
                        <Input placeholder="e.g. 9.8 or 92%" value={editAcadData.score || ''} onChange={e => setEditAcadData({...editAcadData, score: e.target.value})} className="bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Score Type</Label>
                        <select className="w-full h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 px-3 text-sm font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-400"
                          value={editAcadData.score_type || 'CGPA'} onChange={e => setEditAcadData({...editAcadData, score_type: e.target.value})}>
                          <option value="CGPA">CGPA</option>
                          <option value="Percentage">Percentage</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-6 pt-6 border-t border-slate-200/60 dark:border-white/10">
                      <Button onClick={handleUpdateAcad} disabled={saving} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 shadow-md">{saving ? 'Saving…' : 'Update Details'}</Button>
                      <Button variant="ghost" onClick={() => setEditingAcadId(null)} className="rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 font-bold text-slate-500">Cancel</Button>
                    </div>
                  </div>
                ) : (
                  // Regular Display Card
                  <div key={a.id} className="glass-card group p-6 flex flex-col sm:flex-row gap-6 border border-slate-200/60 dark:border-white/10 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 relative">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-500 shrink-0 shadow-sm">
                      <GraduationCap className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0 pr-16">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100 tracking-tight">{a.degree}</h3>
                      </div>
                      <p className="text-[14px] font-bold text-slate-600 dark:text-slate-300 mb-1">{a.institution}</p>
                      <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-2 uppercase tracking-widest">
                        {a.start_year === a.end_year ? a.end_year : `${a.start_year} - ${a.end_year}`} • {a.score_type}: {a.score}
                      </p>
                    </div>
                    {/* 🔥 Edit & Delete Buttons */}
                    <div className="opacity-0 group-hover:opacity-100 flex gap-2 absolute top-4 right-4 transition-all shrink-0">
                      <button onClick={() => startEditAcad(a)} className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-500 transition-all"><Edit3 className="h-4 w-4" /></button>
                      <button onClick={() => handleDeleteAcad(a.id)} className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-500 transition-all"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                )
              ))}
            </div>
          )}
        </div>
      )}

      {/* SKILLS */}
      {tab === 'skills' && (
        <div className="space-y-6 animate-fade-in no-print">
          {/* Keep your existing skills code exactly as is */}
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">Technical Expertise</h3>
            <Button onClick={() => setShowAddSkill(!showAddSkill)} className="gap-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 font-bold shadow-sm">
              <Plus className="h-4 w-4" strokeWidth={3} /> Add Skill
            </Button>
          </div>

          {showAddSkill && (
            <div className="glass-card p-6 border-indigo-200/50 dark:border-indigo-500/20 animate-fade-in">
               <div className="grid sm:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Skill Name</Label>
                    <Input placeholder="e.g. React, Python" value={newSkill.name} onChange={e => setNewSkill({ ...newSkill, name: e.target.value })} className="bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Category</Label>
                    <select className="w-full h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 px-3 text-sm font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-400"
                      value={newSkill.category} onChange={e => setNewSkill({ ...newSkill, category: e.target.value as Skill['category'] })}>
                      {SKILL_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Proficiency ({newSkill.proficiency}%)</Label>
                    <div className="flex items-center h-10">
                      <input type="range" min={0} max={100} value={newSkill.proficiency} onChange={e => setNewSkill({ ...newSkill, proficiency: parseInt(e.target.value) })} className="w-full accent-indigo-500" />
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-6 pt-6 border-t border-slate-200/60 dark:border-white/10">
                  <Button onClick={handleAddSkill} disabled={saving} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 shadow-md">{saving ? 'Saving…' : 'Add Skill'}</Button>
                  <Button variant="ghost" onClick={() => setShowAddSkill(false)} className="rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 font-bold text-slate-500">Cancel</Button>
                </div>
            </div>
          )}

          {skills.length === 0 ? (
             <div className="glass-card flex flex-col items-center justify-center py-16 border-dashed border-2">
              <Code2 className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-[15px] font-bold text-slate-500">No skills added yet.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {SKILL_CATEGORIES.filter(cat => groupedSkills[cat]?.length > 0).map(cat => (
                <div key={cat} className="glass-card p-6 flex flex-col">
                  <div className="pb-4 border-b border-slate-200/60 dark:border-white/10 mb-4">
                    <Badge className={cn('px-3 py-1 font-extrabold tracking-widest uppercase rounded-lg border', CATEGORY_COLORS[cat])}>
                      {CATEGORY_LABELS[cat]}
                    </Badge>
                  </div>
                  <div className="space-y-4 flex-1">
                    {groupedSkills[cat].map(skill => (
                      <div key={skill.id} className="group flex flex-col gap-2 p-3 rounded-xl hover:bg-white/40 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-white/10">
                        <div className="flex items-center justify-between">
                          <span className="text-[14px] font-bold text-slate-700 dark:text-slate-200">{skill.name}</span>
                          <div className="flex items-center gap-3">
                            <Badge className={cn('text-[10px] uppercase tracking-wider font-extrabold shadow-sm', skill.proficiency >= 80 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : skill.proficiency >= 50 ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200')}>
                              {skill.proficiency >= 80 ? 'Expert' : skill.proficiency >= 50 ? 'Intermediate' : 'Beginner'}
                            </Badge>
                            <button onClick={() => handleDeleteSkill(skill.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-500 transition-all shrink-0"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                           <input type="range" min={0} max={100} value={skill.proficiency}
                            onChange={e => handleUpdateSkillProficiency(skill, parseInt(e.target.value))}
                            className="w-full accent-indigo-400 opacity-60 group-hover:opacity-100 transition-opacity h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PROJECTS */}
      {tab === 'projects' && (
        <div className="space-y-6 animate-fade-in no-print">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">Featured Projects</h3>
            <Button onClick={() => setShowAddProject(!showAddProject)} className="gap-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 font-bold shadow-sm">
              <Plus className="h-4 w-4" strokeWidth={3} /> Add Project
            </Button>
          </div>

          {showAddProject && (
            <div className="glass-card p-6 border-indigo-200/50 dark:border-indigo-500/20 animate-fade-in">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2"><Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Project Title</Label><Input placeholder="Awesome App" value={newProject.title} onChange={e => setNewProject({ ...newProject, title: e.target.value })} className="bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl font-bold" /></div>
                <div className="space-y-2"><Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Status</Label>
                  <select className="w-full h-10 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-white/5 px-3 text-sm font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-400"
                    value={newProject.status} onChange={e => setNewProject({ ...newProject, status: e.target.value as Project['status'] })}>
                    <option value="in_progress">In Progress</option><option value="completed">Completed</option><option value="planned">Planned</option>
                  </select>
                </div>
                <div className="sm:col-span-2 space-y-2"><Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Description</Label><Input placeholder="A brief summary of what you built..." value={newProject.description} onChange={e => setNewProject({ ...newProject, description: e.target.value })} className="bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl" /></div>
                <div className="space-y-2"><Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tech Stack (CSV)</Label><Input placeholder="React, Node.js, MongoDB" value={newProject.tech_stack} onChange={e => setNewProject({ ...newProject, tech_stack: e.target.value })} className="bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl" /></div>
                <div className="space-y-2"><Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">GitHub URL</Label><Input placeholder="github.com/your/repo" value={newProject.github_url} onChange={e => setNewProject({ ...newProject, github_url: e.target.value })} className="bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl" /></div>
                <div className="space-y-2"><Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Live URL</Label><Input placeholder="your-app.com" value={newProject.live_url} onChange={e => setNewProject({ ...newProject, live_url: e.target.value })} className="bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl" /></div>
              </div>
              <div className="flex gap-3 mt-6 pt-6 border-t border-slate-200/60 dark:border-white/10">
                <Button onClick={handleAddProject} disabled={saving} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 shadow-md">{saving ? 'Saving…' : 'Save Project'}</Button>
                <Button variant="ghost" onClick={() => setShowAddProject(false)} className="rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 font-bold text-slate-500">Cancel</Button>
              </div>
            </div>
          )}

          {projects.length === 0 ? (
            <div className="glass-card flex flex-col items-center justify-center py-16 border-dashed border-2">
              <GitBranch className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-[15px] font-bold text-slate-500">No projects added yet.</p>
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-6">
              {projects.map(project => (
                <div key={project.id} className="glass-card group p-6 flex flex-col border border-slate-200/60 dark:border-white/10 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-500 shadow-sm shrink-0">
                        <Code2 className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100 tracking-tight">{project.title}</h3>
                        <Badge className={cn('text-[9px] uppercase tracking-widest font-black mt-1 shadow-sm', project.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : project.status === 'in_progress' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600')}>
                          {project.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteProject(project.id)} className="opacity-0 group-hover:opacity-100 p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-500 transition-all shrink-0"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  
                  {project.description && <p className="text-[14px] text-slate-600 dark:text-slate-300 mb-4 flex-1">{project.description}</p>}
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                    {project.tech_stack.map(t => <Badge key={t} className="bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border-none font-bold text-[11px] px-2.5 py-1">{t}</Badge>)}
                  </div>
                  
                  <div className="flex gap-4 pt-4 border-t border-slate-100 dark:border-white/10 mt-auto">
                    {project.github_url && <a href={project.github_url.startsWith('http') ? project.github_url : `https://${project.github_url}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"><Github className="h-4 w-4" /> View Source</a>}
                    {project.live_url && <a href={project.live_url.startsWith('http') ? project.live_url : `https://${project.live_url}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"><ExternalLink className="h-4 w-4" /> Live Demo</a>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CERTIFICATIONS */}
      {tab === 'certifications' && (
        <div className="space-y-6 animate-fade-in no-print">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">Certifications</h3>
            <Button onClick={() => setShowAddCert(!showAddCert)} className="gap-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 font-bold shadow-sm">
              <Plus className="h-4 w-4" strokeWidth={3} /> Add Certificate
            </Button>
          </div>

          {showAddCert && (
            <div className="glass-card p-6 border-indigo-200/50 dark:border-indigo-500/20 animate-fade-in">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2"><Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Certificate Name</Label><Input placeholder="e.g. NPTEL: Machine Learning" value={newCert.name} onChange={e => setNewCert({ ...newCert, name: e.target.value })} className="bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl font-bold" /></div>
                <div className="space-y-2"><Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Issuer</Label><Input placeholder="e.g. IIT Kharagpur (NPTEL)" value={newCert.issuer} onChange={e => setNewCert({ ...newCert, issuer: e.target.value })} className="bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl" /></div>
                <div className="space-y-2"><Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Issue Date</Label><Input type="date" value={newCert.issue_date} onChange={e => setNewCert({ ...newCert, issue_date: e.target.value })} className="bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl" /></div>
                <div className="space-y-2"><Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Credential ID</Label><Input placeholder="NPTEL24CS123" value={newCert.credential_id} onChange={e => setNewCert({ ...newCert, credential_id: e.target.value })} className="bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl" /></div>
                <div className="sm:col-span-2 space-y-2"><Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Verify URL</Label><Input placeholder="nptel.ac.in/verify/..." value={newCert.cert_url} onChange={e => setNewCert({ ...newCert, cert_url: e.target.value })} className="bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl" /></div>
              </div>
              <div className="flex gap-3 mt-6 pt-6 border-t border-slate-200/60 dark:border-white/10">
                <Button onClick={handleAddCert} disabled={saving} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 shadow-md">{saving ? 'Saving…' : 'Add Certificate'}</Button>
                <Button variant="ghost" onClick={() => setShowAddCert(false)} className="rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 font-bold text-slate-500">Cancel</Button>
              </div>
            </div>
          )}

          {certs.length === 0 ? (
            <div className="glass-card flex flex-col items-center justify-center py-16 border-dashed border-2">
              <Award className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-[15px] font-bold text-slate-500">No certificates added yet.</p>
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-6">
              {certs.map(cert => (
                <div key={cert.id} className="glass-card group p-6 flex flex-col border border-slate-200/60 dark:border-white/10 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 text-amber-500 shadow-sm shrink-0">
                        <Award className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-[15px] text-slate-800 dark:text-slate-100 tracking-tight">{cert.name}</h3>
                        <p className="text-[13px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">{cert.issuer}</p>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteCert(cert.id)} className="opacity-0 group-hover:opacity-100 p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-500 transition-all shrink-0"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-6 pt-4 border-t border-slate-100 dark:border-white/10">
                    {cert.issue_date && <span className="text-xs font-bold text-slate-400">Issued: {cert.issue_date}</span>}
                    {cert.credential_id && <span className="text-xs font-bold text-slate-400 border-l border-slate-200 dark:border-white/10 pl-4">ID: {cert.credential_id}</span>}
                    {cert.cert_url && (
                      <a href={cert.cert_url.startsWith('http') ? cert.cert_url : `https://${cert.cert_url}`} target="_blank" rel="noreferrer" className="ml-auto flex items-center gap-1.5 text-xs font-bold text-indigo-500 hover:text-indigo-600 transition-colors">
                        <ExternalLink className="h-4 w-4" /> Verify
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* EXPERIENCE */}
      {tab === 'experience' && (
        <div className="space-y-6 animate-fade-in no-print">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">Work & Experience</h3>
            <Button onClick={() => setShowAddExp(!showAddExp)} className="gap-2 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 font-bold shadow-sm">
              <Plus className="h-4 w-4" strokeWidth={3} /> Add Experience
            </Button>
          </div>

          {showAddExp && (
            <div className="glass-card p-6 border-indigo-200/50 dark:border-indigo-500/20 animate-fade-in">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2"><Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Company Name</Label><Input placeholder="e.g. Google, Startup Inc." value={newExp.company} onChange={e => setNewExp({ ...newExp, company: e.target.value })} className="bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl font-bold" /></div>
                <div className="space-y-2"><Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Role</Label><Input placeholder="e.g. Backend Engineering Intern" value={newExp.role} onChange={e => setNewExp({ ...newExp, role: e.target.value })} className="bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl font-bold" /></div>
                <div className="space-y-2"><Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Start Date</Label><Input type="date" value={newExp.start_date} onChange={e => setNewExp({ ...newExp, start_date: e.target.value })} className="bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl" /></div>
                <div className="space-y-2"><Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">End Date</Label><Input type="date" value={newExp.end_date} disabled={newExp.is_current} onChange={e => setNewExp({ ...newExp, end_date: e.target.value })} className="bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl" /></div>
                <div className="flex items-center gap-3 col-span-2">
                  <input type="checkbox" id="current" checked={newExp.is_current} onChange={e => setNewExp({ ...newExp, is_current: e.target.checked, end_date: '' })} className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500" />
                  <label htmlFor="current" className="text-sm font-bold text-slate-700 dark:text-slate-200">I am currently working here</label>
                </div>
                <div className="sm:col-span-2 space-y-2"><Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Description</Label><Input placeholder="Summarize your responsibilities and achievements..." value={newExp.description} onChange={e => setNewExp({ ...newExp, description: e.target.value })} className="bg-white/50 dark:bg-white/5 border-slate-200 dark:border-white/10 rounded-xl" /></div>
              </div>
              <div className="flex gap-3 mt-6 pt-6 border-t border-slate-200/60 dark:border-white/10">
                <Button onClick={handleAddExp} disabled={saving} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 shadow-md">{saving ? 'Saving…' : 'Add Experience'}</Button>
                <Button variant="ghost" onClick={() => setShowAddExp(false)} className="rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 font-bold text-slate-500">Cancel</Button>
              </div>
            </div>
          )}

          {experience.length === 0 ? (
            <div className="glass-card flex flex-col items-center justify-center py-16 border-dashed border-2">
              <Briefcase className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-[15px] font-bold text-slate-500">No experience added yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {experience.map(exp => (
                <div key={exp.id} className="glass-card group p-6 flex flex-col sm:flex-row gap-6 border border-slate-200/60 dark:border-white/10 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 shrink-0 shadow-sm">
                    <Briefcase className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100 tracking-tight">{exp.role}</h3>
                      <button onClick={() => handleDeleteExp(exp.id)} className="opacity-0 group-hover:opacity-100 p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-500 transition-all shrink-0 absolute top-4 right-4 sm:relative sm:top-0 sm:right-0"><Trash2 className="h-4 w-4" /></button>
                    </div>
                    <p className="text-[14px] font-bold text-indigo-600 dark:text-indigo-400 mb-1">{exp.company}</p>
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-4 uppercase tracking-widest">{exp.start_date} – {exp.is_current ? 'Present' : exp.end_date}</p>
                    {exp.description && <p className="text-[14px] text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-white/10 pt-4 mt-2">{exp.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ATS PREVIEW (Printable Area) */}
      {tab === 'preview' && (
        <div id="resume-preview" className="glass-card animate-fade-in overflow-hidden border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-2xl">
          <div className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-white/10 p-3 flex justify-center text-xs font-bold text-slate-500 uppercase tracking-widest no-print">
            Print / PDF Preview Mode (A4 Optimized)
          </div>
          <div className="p-8 sm:p-12 font-sans max-w-[800px] mx-auto bg-white dark:bg-white text-black min-h-[1056px] shadow-inner print:p-0 print:shadow-none print:m-0">
            <div className="text-center border-b-2 border-slate-800 pb-6 mb-6">
              <h1 className="text-4xl font-black tracking-tight text-slate-900">{profile.full_name || 'Your Name'}</h1>
              <p className="text-lg font-bold text-indigo-600 mt-1 uppercase tracking-widest">{profile.career_goal || 'Professional Title'}</p>
              <div className="flex justify-center flex-wrap gap-4 mt-3 text-sm font-medium text-slate-600">
                {profile.email && <span>{profile.email}</span>}
                {profile.github_url && <span>{profile.github_url}</span>}
                {profile.linkedin_url && <span>{profile.linkedin_url}</span>}
              </div>
            </div>
            
            {bio && (
              <div className="mb-6">
                <h2 className="text-sm font-black uppercase tracking-widest border-b border-slate-300 pb-1 mb-3 text-slate-800">Summary</h2>
                <p className="text-[15px] leading-relaxed text-slate-700">{bio}</p>
              </div>
            )}
            
            {/* DYNAMIC EDUCATION SECTION */}
            {academics.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-black uppercase tracking-widest border-b border-slate-300 pb-1 mb-3 text-slate-800">Education</h2>
                {academics.map(a => (
                  <div key={a.id} className="mb-3 text-slate-800">
                    <div className="flex justify-between items-baseline">
                      <div>
                        <p className="text-[16px] font-bold">{a.degree}</p>
                        <p className="text-[14px] text-slate-600 font-medium">{a.institution}</p>
                      </div>
                      <div className="text-right text-[14px] font-medium text-slate-600">
                        <p>{a.start_year === a.end_year ? a.end_year : `${a.start_year} – ${a.end_year}`}</p>
                        <p className="font-bold text-slate-800 mt-0.5">{a.score_type}: {a.score}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {skills.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-black uppercase tracking-widest border-b border-slate-300 pb-1 mb-3 text-slate-800">Technical Skills</h2>
                <div className="grid grid-cols-1 gap-2 text-[15px] text-slate-800">
                  {SKILL_CATEGORIES.filter(c => groupedSkills[c]?.length).map(c => (
                    <p key={c}><span className="font-bold min-w-[120px] inline-block">{CATEGORY_LABELS[c]}:</span> {groupedSkills[c].map(s => s.name).join(', ')}</p>
                  ))}
                </div>
              </div>
            )}
            
            {projects.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-black uppercase tracking-widest border-b border-slate-300 pb-1 mb-3 text-slate-800">Projects</h2>
                {projects.map(p => (
                  <div key={p.id} className="mb-4 text-slate-800">
                    <div className="flex justify-between items-baseline">
                      <p className="text-[16px] font-bold">{p.title}</p>
                      <p className="text-[13px] font-bold text-slate-500">{p.tech_stack.join(' | ')}</p>
                    </div>
                    {p.description && <p className="text-[15px] mt-1 text-slate-700">{p.description}</p>}
                  </div>
                ))}
              </div>
            )}

            {experience.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-black uppercase tracking-widest border-b border-slate-300 pb-1 mb-3 text-slate-800">Experience</h2>
                {experience.map(e => (
                  <div key={e.id} className="mb-4 text-slate-800">
                    <div className="flex justify-between items-baseline">
                      <p className="text-[16px] font-bold">{e.role} <span className="font-medium text-slate-600">at {e.company}</span></p>
                      <p className="text-[13px] font-bold text-slate-500">{e.start_date} – {e.is_current ? 'Present' : e.end_date}</p>
                    </div>
                    {e.description && <p className="text-[15px] mt-1 text-slate-700">{e.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}