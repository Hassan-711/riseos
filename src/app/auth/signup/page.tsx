'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { signupAction } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react'

function SignupForm() {
  const searchParams = useSearchParams()
  const [showPw, setShowPw] = useState(false)
  const [pending, setPending] = useState(false)

  const errorMsg = searchParams.get('error')

  useEffect(() => {
    if (errorMsg) setPending(false)
  }, [errorMsg])

  return (
    <div className="space-y-6 animate-fade-in w-full max-w-sm mx-auto">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Create account</h1>
        <p className="text-sm text-muted-foreground">Start tracking your career journey</p>
      </div>

      {errorMsg && (
        <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2.5 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          {errorMsg}
        </div>
      )}

      <form action={signupAction} onSubmit={() => setPending(true)} className="space-y-4">
        {/* Core Account Details */}
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" name="name" placeholder="Your name" required autoComplete="name" />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="you@example.com" required autoComplete="email" />
        </div>

        {/* 🚀 ACADEMIC & CAREER PROFILE */}
        <div className="space-y-2">
          <Label htmlFor="role">Role / Target Title</Label>
          <Input id="role" name="role" placeholder="e.g. AI Backend Engineer" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="university">University / College</Label>
          <Input id="university" name="university" placeholder="e.g. Amity University" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="degree">Degree / Major</Label>
          <Input id="degree" name="degree" placeholder="e.g. B.Tech CSE" required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="current_semester">Current Semester</Label>
            <Input id="current_semester" name="current_semester" type="number" min="1" max="12" placeholder="e.g. 4" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cgpa">Current CGPA</Label>
            <Input id="cgpa" name="cgpa" type="number" step="0.01" min="0" max="10" placeholder="e.g. 8.5" required />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2 pt-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password" name="password"
              type={showPw ? 'text' : 'password'}
              placeholder="Min 8 characters" minLength={8} required autoComplete="new-password"
            />
            <button type="button" onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" className="w-full mt-2" size="lg" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {pending ? 'Creating account…' : 'Create Account'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-primary hover:underline font-medium">Sign in</Link>
      </p>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6 animate-pulse w-full max-w-sm mx-auto">
        <div className="h-8 w-40 bg-secondary rounded" />
        <div className="space-y-3">
          <div className="h-10 bg-secondary rounded-lg" />
          <div className="h-10 bg-secondary rounded-lg" />
          <div className="h-10 bg-secondary rounded-lg" />
          <div className="h-12 bg-secondary rounded-lg mt-4" />
        </div>
      </div>
    }>
      <SignupForm />
    </Suspense>
  )
}