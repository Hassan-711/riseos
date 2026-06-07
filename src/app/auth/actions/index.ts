'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// ── LOGIN ──────────────────────────────────────────────────────────────────────
export async function loginAction(formData: FormData) {
  const supabase = createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) redirect('/auth/login?error=Email+and+password+are+required')

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) redirect(`/auth/login?error=${encodeURIComponent(error.message)}`)
  if (!data.session) redirect('/auth/login?error=No+session+returned.+Please+try+again.')

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

// ── SIGNUP ─────────────────────────────────────────────────────────────────────
export async function signupAction(formData: FormData) {
  const supabase = createClient()

  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const role = formData.get('role') as string
  const university = formData.get('university') as string
  const degree = formData.get('degree') as string
  const current_semester = parseInt(formData.get('current_semester') as string) || null
  const cgpa = parseFloat(formData.get('cgpa') as string) || null

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { 
      data: { 
        full_name: name,
        career_goal: role, // 🔥 FIX: Saved as career_goal instead of role
        university: university,
        degree: degree,
        current_semester: current_semester,
        cgpa: cgpa
      } 
    },
  })

  if (error) redirect(`/auth/signup?error=${encodeURIComponent(error.message)}`)

  redirect('/auth/login?message=Check+your+email+to+verify+your+account')
}

// ── LOGOUT ─────────────────────────────────────────────────────────────────────
export async function logoutAction() {
  const supabase = createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/auth/login')
}