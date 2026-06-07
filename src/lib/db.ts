'use client'

import { createClient } from '@/lib/supabase/client'
import type { Task, Skill, Project, Certification, WorkExperience, Subject, CareerGoal, CareerMilestone } from '@/lib/types'

const db = () => createClient()

// ─── PROFILE ────────────────────────────────────────────────────────────────
export async function getProfile() {
  const { data: { user } } = await db().auth.getUser()
  if (!user) return null
  const { data } = await db().from('profiles').select('*').eq('id', user.id).single()
  return data
}

export async function updateProfile(updates: Record<string, unknown>) {
  const { data: { user } } = await db().auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { error } = await db().from('profiles').update(updates).eq('id', user.id)
  return { error: error?.message }
}

// ─── TASKS ───────────────────────────────────────────────────────────────────
export async function getTasks() {
  const { data: { user } } = await db().auth.getUser()
  if (!user) return []
  const { data } = await db()
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function addTask(task: Partial<Task>) {
  const { data: { user } } = await db().auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data, error } = await db().from('tasks').insert({ ...task, user_id: user.id }).select().single()
  return { data, error: error?.message }
}

export async function updateTask(id: string, updates: Partial<Task>) {
  const { data: { user } } = await db().auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { error } = await db().from('tasks').update(updates).eq('id', id).eq('user_id', user.id)
  return { error: error?.message }
}

export async function deleteTask(id: string) {
  const { data: { user } } = await db().auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { error } = await db().from('tasks').delete().eq('id', id).eq('user_id', user.id)
  return { error: error?.message }
}

// ─── SKILLS ──────────────────────────────────────────────────────────────────
export async function getSkills() {
  const { data: { user } } = await db().auth.getUser()
  if (!user) return []
  const { data } = await db().from('skills').select('*').eq('user_id', user.id).order('category')
  return data ?? []
}

export async function addSkill(skill: Partial<Skill>) {
  const { data: { user } } = await db().auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data, error } = await db().from('skills').insert({ ...skill, user_id: user.id }).select().single()
  return { data, error: error?.message }
}

export async function updateSkill(id: string, updates: Partial<Skill>) {
  const { data: { user } } = await db().auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { error } = await db().from('skills').update(updates).eq('id', id).eq('user_id', user.id)
  return { error: error?.message }
}

export async function deleteSkill(id: string) {
  const { data: { user } } = await db().auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { error } = await db().from('skills').delete().eq('id', id).eq('user_id', user.id)
  return { error: error?.message }
}

// ─── PROJECTS ────────────────────────────────────────────────────────────────
export async function getProjects() {
  const { data: { user } } = await db().auth.getUser()
  if (!user) return []
  const { data } = await db().from('projects').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
  return data ?? []
}

export async function addProject(project: Partial<Project>) {
  const { data: { user } } = await db().auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data, error } = await db().from('projects').insert({ ...project, user_id: user.id }).select().single()
  return { data, error: error?.message }
}

export async function updateProject(id: string, updates: Partial<Project>) {
  const { data: { user } } = await db().auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { error } = await db().from('projects').update(updates).eq('id', id).eq('user_id', user.id)
  return { error: error?.message }
}

export async function deleteProject(id: string) {
  const { data: { user } } = await db().auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { error } = await db().from('projects').delete().eq('id', id).eq('user_id', user.id)
  return { error: error?.message }
}

// ─── CERTIFICATIONS ──────────────────────────────────────────────────────────
export async function getCertifications() {
  const { data: { user } } = await db().auth.getUser()
  if (!user) return []
  const { data } = await db().from('certifications').select('*').eq('user_id', user.id).order('issue_date', { ascending: false })
  return data ?? []
}

export async function addCertification(cert: Partial<Certification>) {
  const { data: { user } } = await db().auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data, error } = await db().from('certifications').insert({ ...cert, user_id: user.id }).select().single()
  return { data, error: error?.message }
}

export async function deleteCertification(id: string) {
  const { data: { user } } = await db().auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { error } = await db().from('certifications').delete().eq('id', id).eq('user_id', user.id)
  return { error: error?.message }
}

// ─── WORK EXPERIENCE ─────────────────────────────────────────────────────────
export async function getWorkExperience() {
  const { data: { user } } = await db().auth.getUser()
  if (!user) return []
  const { data } = await db().from('work_experience').select('*').eq('user_id', user.id).order('start_date', { ascending: false })
  return data ?? []
}

export async function addWorkExperience(exp: Partial<WorkExperience>) {
  const { data: { user } } = await db().auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data, error } = await db().from('work_experience').insert({ ...exp, user_id: user.id }).select().single()
  return { data, error: error?.message }
}

export async function deleteWorkExperience(id: string) {
  const { data: { user } } = await db().auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { error } = await db().from('work_experience').delete().eq('id', id).eq('user_id', user.id)
  return { error: error?.message }
}

// ─── SUBJECTS ────────────────────────────────────────────────────────────────
export async function getSubjects() {
  const { data: { user } } = await db().auth.getUser()
  if (!user) return []
  const { data } = await db()
    .from('subjects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
  return data ?? []
}

export async function addSubject(subject: Partial<Subject>) {
  const { data: { user } } = await db().auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data, error } = await db().from('subjects').insert({ ...subject, user_id: user.id }).select().single()
  return { data, error: error?.message }
}

export async function updateSubject(id: string, updates: Partial<Subject>) {
  const { data: { user } } = await db().auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { error } = await db().from('subjects').update(updates).eq('id', id).eq('user_id', user.id)
  return { error: error?.message }
}

export async function deleteSubject(id: string) {
  const { data: { user } } = await db().auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { error } = await db().from('subjects').delete().eq('id', id).eq('user_id', user.id)
  return { error: error?.message }
}

// ─── CAREER GOALS ────────────────────────────────────────────────────────────
export async function getCareerGoals() {
  const { data: { user } } = await db().auth.getUser()
  if (!user) return []
  const { data } = await db()
    .from('career_goals')
    .select('*, milestones:career_milestones(*)')
    .eq('user_id', user.id)
    .order('priority', { ascending: false })
  return data ?? []
}

export async function addCareerGoal(goal: Partial<CareerGoal>) {
  const { data: { user } } = await db().auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { milestones, ...goalData } = goal as CareerGoal & { milestones?: CareerMilestone[] }
  const { data, error } = await db().from('career_goals').insert({ ...goalData, user_id: user.id }).select().single()
  return { data, error: error?.message }
}

export async function updateCareerGoal(id: string, updates: Partial<CareerGoal>) {
  const { data: { user } } = await db().auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { milestones, ...rest } = updates as Partial<CareerGoal> & { milestones?: CareerMilestone[] }
  const { error } = await db().from('career_goals').update(rest).eq('id', id).eq('user_id', user.id)
  return { error: error?.message }
}

export async function addMilestone(milestone: Partial<CareerMilestone>) {
  const { data: { user } } = await db().auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data, error } = await db().from('career_milestones').insert({ ...milestone, user_id: user.id }).select().single()
  return { data, error: error?.message }
}

export async function updateMilestone(id: string, updates: Partial<CareerMilestone>) {
  const { data: { user } } = await db().auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { error } = await db().from('career_milestones').update(updates).eq('id', id).eq('user_id', user.id)
  return { error: error?.message }
}

// ─── ANALYTICS ───────────────────────────────────────────────────────────────
export async function getAnalyticsLogs() {
  const { data: { user } } = await db().auth.getUser()
  if (!user) return []
  const { data } = await db()
    .from('analytics_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(30)
  return data ?? []
}

export async function upsertAnalyticsLog(log: { date: string; study_minutes?: number; tasks_completed?: number; tasks_total?: number; focus_sessions?: number }) {
  const { data: { user } } = await db().auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { error } = await db().from('analytics_logs').upsert(
    { ...log, user_id: user.id },
    { onConflict: 'user_id,date' }
  )
  return { error: error?.message }
}

export async function getFocusSessions() {
  const { data: { user } } = await db().auth.getUser()
  if (!user) return []
  const today = new Date().toISOString().split('T')[0]
  const { data } = await db()
    .from('focus_sessions')
    .select('*')
    .eq('user_id', user.id)
    .gte('started_at', today)
  return data ?? []
}

export async function addFocusSession(session: { duration_minutes: number; session_type: string }) {
  const { data: { user } } = await db().auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { error } = await db().from('focus_sessions').insert({
    ...session,
    user_id: user.id,
    started_at: new Date().toISOString(),
    ended_at: new Date().toISOString(),
  })
  return { error: error?.message }
}

// ─── STUDY MATERIALS ─────────────────────────────────────────────────────────
export async function getStudyMaterials(subjectId: string) {
  const { data: { user } } = await db().auth.getUser()
  if (!user) return []
  const { data } = await db()
    .from('study_materials')
    .select('*')
    .eq('subject_id', subjectId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function addStudyMaterial(material: {
  subject_id: string
  name: string
  type: string
  file_url?: string | null
  external_url?: string | null
  size_bytes?: number | null
}) {
  const { data: { user } } = await db().auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data, error } = await db()
    .from('study_materials')
    .insert({ ...material, user_id: user.id })
    .select()
    .single()
  return { data, error: error?.message }
}

export async function deleteStudyMaterial(id: string) {
  const { data: { user } } = await db().auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { error } = await db()
    .from('study_materials')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  return { error: error?.message }
}

export async function uploadMaterialFile(file: File, userId: string, subjectId: string): Promise<{ url: string | null; error: string | null }> {
  const supabase = db()
  const ext = file.name.split('.').pop()
  const path = `${userId}/${subjectId}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`

  const { error } = await supabase.storage
    .from('study-materials')
    .upload(path, file, { cacheControl: '3600', upsert: false })

  if (error) return { url: null, error: error.message }

  const { data } = supabase.storage.from('study-materials').getPublicUrl(path)
  return { url: data.publicUrl, error: null }
}

// ─── DELETE CAREER GOAL ───────────────────────────────────────────────────────
export async function deleteCareerGoal(id: string) {
  const { data: { user } } = await db().auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { error } = await db()
    .from('career_goals')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  return { error: error?.message }
}

// ─── DELETE MILESTONE ─────────────────────────────────────────────────────────
export async function deleteMilestone(id: string) {
  const { data: { user } } = await db().auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { error } = await db()
    .from('career_milestones')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  return { error: error?.message }
}

/// ─── ACADEMICS (EDUCATION) ───────────────────────────────────────────────────
export async function getAcademics() {
  const { data: { user } } = await db().auth.getUser()
  if (!user) return []
  const { data } = await db()
    .from('academics')
    .select('*')
    .eq('user_id', user.id)
    .order('end_year', { ascending: false })
  return data ?? []
}

export async function addAcademic(academic: any) {
  const { data: { user } } = await db().auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { data, error } = await db()
    .from('academics')
    .insert({ ...academic, user_id: user.id })
    .select()
    .single()
  return { data, error: error?.message }
}

export async function updateAcademic(id: string, updates: any) {
  const { data: { user } } = await db().auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { error } = await db()
    .from('academics')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
  return { error: error?.message }
}

export async function deleteAcademic(id: string) {
  const { data: { user } } = await db().auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { error } = await db()
    .from('academics')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  return { error: error?.message }
}

// ─── NEW: FOCUS TIME STATS (DASHBOARD) ───────────────────────────────────────
export async function getFocusTimeStats() {
  const { data: { user } } = await db().auth.getUser()
  if (!user) return { today: 0, week: 0, lifetime: 0 }

  const { data } = await db()
    .from('focus_sessions')
    .select('duration_minutes, started_at')
    .eq('user_id', user.id)

  if (!data) return { today: 0, week: 0, lifetime: 0 }

  const now = new Date()

  // 🔥 NAYA LOGIC: Current Calendar Week (Hafta Monday se shuru hota hai)
  const startOfWeek = new Date(now)
  const day = startOfWeek.getDay() // 0 = Sunday, 1 = Monday...
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1) // Adjust karke Monday par le aao
  startOfWeek.setDate(diff)
  startOfWeek.setHours(0, 0, 0, 0) // Monday ki raat 12:00 AM

  let todayMin = 0
  let weekMin = 0
  let lifetimeMin = 0

  data.forEach(session => {
     const d = session.duration_minutes || 0
     lifetimeMin += d

     // 🔥 BULLETPROOF UTC TO LOCAL TIME CONVERTER
     const safeDateStr = session.started_at.endsWith('Z') || session.started_at.includes('+') 
       ? session.started_at 
       : session.started_at + 'Z'
     const sessionDate = new Date(safeDateStr)
     
     // Check for Today
     if (
       sessionDate.getDate() === now.getDate() &&
       sessionDate.getMonth() === now.getMonth() &&
       sessionDate.getFullYear() === now.getFullYear()
     ) {
       todayMin += d
     }

     // 🔥 Check for Current Week (Monday ke baad ke saare sessions)
     if (sessionDate >= startOfWeek) {
       weekMin += d
     }
  })

  return { today: todayMin, week: weekMin, lifetime: lifetimeMin }
}