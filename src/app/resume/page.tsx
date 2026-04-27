'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { FileText, User, Code2, Award, Briefcase, GitBranch, ExternalLink, Plus, Edit3, Download, Eye, Github, Linkedin, Save, Trash2, X, Loader2 } from 'lucide-react'
import { cn, generateInitials, getPriorityColor } from '@/lib/utils'
import { toast } from '@/components/ui/toaster'
import { getProfile, updateProfile, getSkills, addSkill, updateSkill, deleteSkill, getProjects, addProject, deleteProject, getCertifications, addCertification, deleteCertification, getWorkExperience, addWorkExperience, deleteWorkExperience } from '@/lib/db'
import type { Skill, Project, Certification, WorkExperience } from '@/lib/types'

const SKILL_CATEGORIES = ['language', 'framework', 'database', 'tool', 'soft', 'cloud'] as const
const CATEGORY_LABELS: Record<string, string> = { language: 'Languages', framework: 'Frameworks', database: 'Databases', tool: 'Tools', soft: 'Soft Skills', cloud: 'Cloud' }
const CATEGORY_COLORS: Record<string, string> = { language: 'text-blue-400 bg-blue-400/10', framework: 'text-violet-400 bg-violet-400/10', database: 'text-emerald-400 bg-emerald-400/10', tool: 'text-amber-400 bg-amber-400/10', soft: 'text-rose-400 bg-rose-400/10', cloud: 'text-cyan-400 bg-cyan-400/10' }

type Tab = 'overview' | 'skills' | 'projects' | 'certifications' | 'experience' | 'preview'

export default function ResumePage() {
  const [tab, setTab] = useState<Tab>('overview')
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Record<string, unknown>>({})
  const [bio, setBio] = useState(''); const [editBio, setEditBio] = useState(false); const [savingBio, setSavingBio] = useState(false)
  const [skills, setSkills] = useState<Skill[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [certs, setCerts] = useState<Certification[]>([])
  const [experience, setExperience] = useState<WorkExperience[]>([])

  // Add forms
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
    Promise.all([getProfile(), getSkills(), getProjects(), getCertifications(), getWorkExperience()]).then(([p, s, pr, c, e]) => {
      if (p) { setProfile(p as Record<string, unknown>); setBio((p as Record<string, unknown>).bio as string ?? '') }
      setSkills(s as Skill[]); setProjects(pr as Project[]); setCerts(c as Certification[]); setExperience(e as WorkExperience[])
      setLoading(false)
    })
  }, [])

  async function saveBio() {
    setSavingBio(true)
    await updateProfile({ bio, updated_at: new Date().toISOString() })
    setProfile(p => ({ ...p, bio }))
    setEditBio(false); setSavingBio(false)
    toast({ title: 'Bio saved ✅' })
  }

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

  async function handleAddProject() {
    if (!newProject.title.trim() || saving) return
    setSaving(true)
    const { data, error } = await addProject({
      ...newProject,
      tech_stack: newProject.tech_stack.split(',').map(t => t.trim()).filter(Boolean),
      highlights: [], start_date: null, end_date: null,
    })
    if (error) toast({ title: 'Failed', description: error, variant: 'destructive' })
    else { setProjects(p => [data as Project, ...p]); setNewProject({ title: '', description: '', tech_stack: '', github_url: '', live_url: '', status: 'in_progress' }); setShowAddProject(false); toast({ title: 'Project added ✅' }) }
    setSaving(false)
  }

  async function handleDeleteProject(id: string) {
    setProjects(p => p.filter(pr => pr.id !== id))
    await deleteProject(id); toast({ title: 'Project removed' })
  }

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
    { key: 'overview', label: 'Overview' }, { key: 'skills', label: `Skills (${skills.length})` },
    { key: 'projects', label: `Projects (${projects.length})` }, { key: 'certifications', label: `Certs (${certs.length})` },
    { key: 'experience', label: `Experience (${experience.length})` }, { key: 'preview', label: 'ATS Preview' },
  ]

  if (loading) return <div className="space-y-4">{[1,2,3,4].map(i => <div key={i} className="h-20 rounded-xl bg-secondary/50 animate-pulse" />)}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div><h1 className="text-2xl font-bold">Resume Dashboard</h1><p className="text-muted-foreground text-sm mt-1">All data saved to your Supabase profile</p></div>
        <Button onClick={() => toast({ title: 'PDF export — add Puppeteer in production' })} className="gap-2"><Download className="h-4 w-4" />Export PDF</Button>
      </div>

      {/* Profile card */}
      <Card className="gradient-border overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/20 border-2 border-primary/30 text-2xl font-bold text-primary">
              {generateInitials(profile.full_name as string)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-xl font-bold">{(profile.full_name as string) || 'Your Name'}</h2>
                  <p className="text-sm text-primary font-medium">{(profile.career_goal as string) || 'AI-Powered Backend Engineer'}</p>
                </div>
                {profile.cgpa && <Badge variant="success">{profile.cgpa as string} CGPA</Badge>}
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                {profile.email && <span className="flex items-center gap-1">✉ {profile.email as string}</span>}
                {profile.university && <span>🎓 {profile.university as string}</span>}
                {profile.github_url && <span className="flex items-center gap-1"><Github className="h-3 w-3" />{profile.github_url as string}</span>}
                {profile.linkedin_url && <span className="flex items-center gap-1"><Linkedin className="h-3 w-3" />{profile.linkedin_url as string}</span>}
              </div>
              {!profile.full_name && <p className="text-xs text-amber-400 mt-2">⚠ Update your profile in Settings to see your info here</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab nav */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={cn('flex-shrink-0 px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
              tab === key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary')}>
            {label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === 'overview' && (
        <Card className="animate-fade-in">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4 text-primary" />Professional Summary</CardTitle>
              <Button variant="ghost" size="icon-sm" onClick={() => setEditBio(!editBio)}><Edit3 className="h-3.5 w-3.5" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            {editBio ? (
              <div className="space-y-3">
                <textarea className="w-full min-h-[100px] rounded-lg border border-input bg-background/50 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring/50"
                  value={bio} onChange={e => setBio(e.target.value)} placeholder="Write your professional summary..." />
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveBio} disabled={savingBio}>{savingBio ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditBio(false)}>Cancel</Button>
                </div>
              </div>
            ) : bio ? <p className="text-sm text-muted-foreground leading-relaxed">{bio}</p>
            : <p className="text-sm text-muted-foreground italic">Click the edit icon to add your professional summary...</p>}
          </CardContent>
        </Card>
      )}

      {/* SKILLS */}
      {tab === 'skills' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{skills.length} skills</p>
            <Button size="sm" variant="outline" className="gap-2" onClick={() => setShowAddSkill(!showAddSkill)}><Plus className="h-3.5 w-3.5" />Add Skill</Button>
          </div>

          {showAddSkill && (
            <Card className="border-primary/30 animate-fade-in">
              <CardContent className="pt-5 space-y-3">
                <div className="grid sm:grid-cols-3 gap-3">
                  <Input placeholder="Skill name" value={newSkill.name} onChange={e => setNewSkill({ ...newSkill, name: e.target.value })} />
                  <select className="h-10 rounded-lg border border-input bg-background/50 px-3 text-sm"
                    value={newSkill.category} onChange={e => setNewSkill({ ...newSkill, category: e.target.value as Skill['category'] })}>
                    {SKILL_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                  </select>
                  <div className="flex items-center gap-2">
                    <input type="range" min={0} max={100} value={newSkill.proficiency} onChange={e => setNewSkill({ ...newSkill, proficiency: parseInt(e.target.value) })} className="flex-1" />
                    <span className="text-xs w-8">{newSkill.proficiency}%</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddSkill} disabled={saving}>{saving ? 'Saving…' : 'Add'}</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowAddSkill(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {skills.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground"><Code2 className="h-10 w-10 mx-auto mb-3 opacity-20" /><p className="text-sm">No skills yet. Add your first skill!</p></div>
          ) : SKILL_CATEGORIES.filter(cat => groupedSkills[cat]?.length > 0).map(cat => (
            <Card key={cat}>
              <CardHeader className="pb-3"><CardTitle className="text-sm"><Badge className={cn('text-[10px]', CATEGORY_COLORS[cat])}>{CATEGORY_LABELS[cat]}</Badge></CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {groupedSkills[cat].map(skill => (
                  <div key={skill.id} className="flex items-center gap-3 group">
                    <span className="text-sm w-28 shrink-0">{skill.name}</span>
                    <div className="flex-1">
                      <input type="range" min={0} max={100} value={skill.proficiency}
                        onChange={e => handleUpdateSkillProficiency(skill, parseInt(e.target.value))}
                        className="w-full accent-primary" />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground w-8 text-right">{skill.proficiency}%</span>
                    <Badge variant={skill.proficiency >= 70 ? 'success' : skill.proficiency >= 40 ? 'warning' : 'secondary'} className="text-[10px] shrink-0">
                      {skill.proficiency >= 70 ? 'Strong' : skill.proficiency >= 40 ? 'Mid' : 'Learning'}
                    </Badge>
                    <button onClick={() => handleDeleteSkill(skill.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all shrink-0">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* PROJECTS */}
      {tab === 'projects' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{projects.length} projects</p>
            <Button size="sm" variant="outline" className="gap-2" onClick={() => setShowAddProject(!showAddProject)}><Plus className="h-3.5 w-3.5" />Add Project</Button>
          </div>
          {showAddProject && (
            <Card className="border-primary/30 animate-fade-in">
              <CardContent className="pt-5 space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1"><Label className="text-xs">Title *</Label><Input placeholder="Project name" value={newProject.title} onChange={e => setNewProject({ ...newProject, title: e.target.value })} /></div>
                  <div className="space-y-1"><Label className="text-xs">Status</Label>
                    <select className="w-full h-10 rounded-lg border border-input bg-background/50 px-3 text-sm"
                      value={newProject.status} onChange={e => setNewProject({ ...newProject, status: e.target.value as Project['status'] })}>
                      <option value="in_progress">In Progress</option><option value="completed">Completed</option><option value="planned">Planned</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2 space-y-1"><Label className="text-xs">Description</Label><Input placeholder="What does this project do?" value={newProject.description} onChange={e => setNewProject({ ...newProject, description: e.target.value })} /></div>
                  <div className="space-y-1"><Label className="text-xs">Tech Stack (comma separated)</Label><Input placeholder="FastAPI, PostgreSQL, Redis" value={newProject.tech_stack} onChange={e => setNewProject({ ...newProject, tech_stack: e.target.value })} /></div>
                  <div className="space-y-1"><Label className="text-xs">GitHub URL</Label><Input placeholder="github.com/user/repo" value={newProject.github_url} onChange={e => setNewProject({ ...newProject, github_url: e.target.value })} /></div>
                  <div className="space-y-1"><Label className="text-xs">Live URL</Label><Input placeholder="yourproject.vercel.app" value={newProject.live_url} onChange={e => setNewProject({ ...newProject, live_url: e.target.value })} /></div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddProject} disabled={saving}>{saving ? 'Saving…' : 'Add Project'}</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowAddProject(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}
          {projects.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground"><GitBranch className="h-10 w-10 mx-auto mb-3 opacity-20" /><p className="text-sm">No projects yet.</p></div>
          ) : projects.map(project => (
            <Card key={project.id} className="group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm">{project.title}</h3>
                      <Badge variant={project.status === 'completed' ? 'success' : project.status === 'in_progress' ? 'info' : 'secondary'} className="text-[10px]">
                        {project.status === 'in_progress' ? 'In Progress' : project.status}
                      </Badge>
                    </div>
                    {project.description && <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{project.description}</p>}
                    <div className="flex flex-wrap gap-1.5 mt-2">{project.tech_stack.map(t => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}</div>
                    <div className="flex gap-3 mt-2">
                      {project.github_url && <a href={project.github_url.startsWith('http') ? project.github_url : `https://${project.github_url}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><Github className="h-3 w-3" />GitHub</a>}
                      {project.live_url && <a href={project.live_url.startsWith('http') ? project.live_url : `https://${project.live_url}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ExternalLink className="h-3 w-3" />Live</a>}
                    </div>
                  </div>
                  <button onClick={() => handleDeleteProject(project.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all shrink-0"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* CERTIFICATIONS */}
      {tab === 'certifications' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{certs.length} certificates</p>
            <Button size="sm" variant="outline" className="gap-2" onClick={() => setShowAddCert(!showAddCert)}><Plus className="h-3.5 w-3.5" />Add Certificate</Button>
          </div>
          {showAddCert && (
            <Card className="border-primary/30 animate-fade-in">
              <CardContent className="pt-5 space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1"><Label className="text-xs">Certificate Name *</Label><Input placeholder="e.g. NPTEL: Machine Learning" value={newCert.name} onChange={e => setNewCert({ ...newCert, name: e.target.value })} /></div>
                  <div className="space-y-1"><Label className="text-xs">Issuer *</Label><Input placeholder="e.g. IIT Kharagpur (NPTEL)" value={newCert.issuer} onChange={e => setNewCert({ ...newCert, issuer: e.target.value })} /></div>
                  <div className="space-y-1"><Label className="text-xs">Issue Date</Label><Input type="date" value={newCert.issue_date} onChange={e => setNewCert({ ...newCert, issue_date: e.target.value })} /></div>
                  <div className="space-y-1"><Label className="text-xs">Credential ID</Label><Input placeholder="NPTEL24CS123" value={newCert.credential_id} onChange={e => setNewCert({ ...newCert, credential_id: e.target.value })} /></div>
                  <div className="sm:col-span-2 space-y-1"><Label className="text-xs">Verify URL</Label><Input placeholder="nptel.ac.in/verify/..." value={newCert.cert_url} onChange={e => setNewCert({ ...newCert, cert_url: e.target.value })} /></div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddCert} disabled={saving}>{saving ? 'Saving…' : 'Add Certificate'}</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowAddCert(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}
          {certs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground"><Award className="h-10 w-10 mx-auto mb-3 opacity-20" /><p className="text-sm">No certificates yet.</p></div>
          ) : certs.map(cert => (
            <Card key={cert.id} className="group">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 border border-amber-400/20"><Award className="h-5 w-5 text-amber-400" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{cert.name}</p>
                    <p className="text-xs text-muted-foreground">{cert.issuer}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {cert.issue_date && <span>{cert.issue_date}</span>}
                      {cert.credential_id && <span>ID: {cert.credential_id}</span>}
                    </div>
                    {cert.cert_url && <a href={cert.cert_url.startsWith('http') ? cert.cert_url : `https://${cert.cert_url}`} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-1 text-xs text-primary hover:underline"><ExternalLink className="h-3 w-3" />Verify</a>}
                  </div>
                  <button onClick={() => handleDeleteCert(cert.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all shrink-0"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* EXPERIENCE */}
      {tab === 'experience' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{experience.length} entries</p>
            <Button size="sm" variant="outline" className="gap-2" onClick={() => setShowAddExp(!showAddExp)}><Plus className="h-3.5 w-3.5" />Add Experience</Button>
          </div>
          {showAddExp && (
            <Card className="border-primary/30 animate-fade-in">
              <CardContent className="pt-5 space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1"><Label className="text-xs">Company *</Label><Input placeholder="Company name" value={newExp.company} onChange={e => setNewExp({ ...newExp, company: e.target.value })} /></div>
                  <div className="space-y-1"><Label className="text-xs">Role *</Label><Input placeholder="e.g. Backend Intern" value={newExp.role} onChange={e => setNewExp({ ...newExp, role: e.target.value })} /></div>
                  <div className="space-y-1"><Label className="text-xs">Start Date</Label><Input type="date" value={newExp.start_date} onChange={e => setNewExp({ ...newExp, start_date: e.target.value })} /></div>
                  <div className="space-y-1"><Label className="text-xs">End Date</Label><Input type="date" value={newExp.end_date} disabled={newExp.is_current} onChange={e => setNewExp({ ...newExp, end_date: e.target.value })} /></div>
                  <div className="flex items-center gap-2 col-span-2">
                    <input type="checkbox" id="current" checked={newExp.is_current} onChange={e => setNewExp({ ...newExp, is_current: e.target.checked, end_date: '' })} />
                    <label htmlFor="current" className="text-xs">Currently working here</label>
                  </div>
                  <div className="sm:col-span-2 space-y-1"><Label className="text-xs">Description</Label><Input placeholder="What did you do?" value={newExp.description} onChange={e => setNewExp({ ...newExp, description: e.target.value })} /></div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddExp} disabled={saving}>{saving ? 'Saving…' : 'Add Experience'}</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowAddExp(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}
          {experience.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground"><Briefcase className="h-12 w-12 mx-auto mb-4 opacity-20" /><p className="text-sm">No experience yet. Add internships or jobs.</p></div>
          ) : experience.map(exp => (
            <Card key={exp.id} className="group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{exp.role}</p>
                    <p className="text-xs text-muted-foreground">{exp.company}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{exp.start_date} – {exp.is_current ? 'Present' : exp.end_date}</p>
                    {exp.description && <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{exp.description}</p>}
                  </div>
                  <button onClick={() => handleDeleteExp(exp.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all shrink-0"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ATS PREVIEW */}
      {tab === 'preview' && (
        <Card className="animate-fade-in">
          <CardContent className="p-8 font-sans max-w-3xl mx-auto">
            <div className="text-center border-b border-border pb-4 mb-4">
              <h1 className="text-2xl font-bold">{(profile.full_name as string) || 'Your Name'}</h1>
              <p className="text-sm text-primary font-medium mt-0.5">{(profile.career_goal as string) || 'AI-Powered Backend Engineer'}</p>
              <div className="flex justify-center flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                {profile.email && <span>{profile.email as string}</span>}
                {profile.github_url && <span>{profile.github_url as string}</span>}
                {profile.linkedin_url && <span>{profile.linkedin_url as string}</span>}
              </div>
            </div>
            {bio && <div className="mb-4"><h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-1 mb-2">Summary</h2><p className="text-sm leading-relaxed">{bio}</p></div>}
            {profile.university && <div className="mb-4"><h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-1 mb-2">Education</h2>
              <div className="flex justify-between"><div><p className="text-sm font-semibold">{profile.degree as string}</p><p className="text-xs text-muted-foreground">{profile.university as string}</p></div><div className="text-right text-xs text-muted-foreground"><p>2023 – 2027</p><p className="font-semibold text-foreground">CGPA: {profile.cgpa as string}</p></div></div></div>}
            {skills.length > 0 && <div className="mb-4"><h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-1 mb-2">Technical Skills</h2>
              <div className="grid grid-cols-2 gap-1 text-xs">
                {SKILL_CATEGORIES.filter(c => groupedSkills[c]?.length).map(c => <p key={c}><strong>{CATEGORY_LABELS[c]}:</strong> {groupedSkills[c].map(s => s.name).join(', ')}</p>)}
              </div></div>}
            {projects.length > 0 && <div className="mb-4"><h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-1 mb-2">Projects</h2>
              {projects.map(p => <div key={p.id} className="mb-2"><div className="flex justify-between"><p className="text-sm font-semibold">{p.title}</p><p className="text-xs text-muted-foreground">{p.tech_stack.join(', ')}</p></div>{p.description && <p className="text-xs text-muted-foreground mt-0.5">• {p.description}</p>}</div>)}</div>}
            {certs.length > 0 && <div><h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-1 mb-2">Certifications</h2>
              {certs.map(c => <div key={c.id} className="flex justify-between text-xs mb-1"><span className="font-medium">{c.name}</span><span className="text-muted-foreground">{c.issuer} · {c.issue_date}</span></div>)}</div>}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
