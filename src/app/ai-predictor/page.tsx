'use client'

import { useState, useEffect, useCallback } from 'react'
import { Brain, TrendingUp, Info, Activity, Loader2, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// ── Types ────────────────────────────────────────────────────────────────────
interface PredictionResult {
  outcome: string
  confidence: number
}

interface ShapData {
  G1: number
  G2: number
  failures: number
  absences: number
  studytime: number
  health: number
  [key: string]: number
}

interface StatusDisplay {
  title: string
  sgpa: string
  color: string
  bg: string
  border: string
  message: string
}

interface ApiPayload {
  G1: number; G2: number; failures: number; studytime: number
  absences: number; health: number; Medu: number; Fedu: number
  internet: number; higher: number; Walc: number; Dalc: number
  goout: number; freetime: number
}

// ── Constants ─────────────────────────────────────────────────────────────────
const API_URL = process.env.NEXT_PUBLIC_ML_API_URL ?? 'https://riseos-ml-api.onrender.com'

const SHAP_LABELS: Record<string, string> = {
  G1: 'Current CGPA',
  G2: 'Internal Marks',
  failures: 'Active Backlogs',
  absences: 'Syllabus Coverage',
  studytime: 'Study Routine',
  health: 'Stress Management'
}

// ── Domain Adaptation Layer ───────────────────────────────────────────────────
function buildPayload(cgpa: number, internals: number, backlogs: number, syllabus: number, studyHours: number, stress: number): ApiPayload {
  return {
    G1: Math.min(20, Math.max(0, parseFloat((cgpa * 2).toFixed(2)))),
    G2: Math.min(20, Math.max(0, parseFloat((internals / 2).toFixed(2)))),
    failures: Math.min(backlogs, 3),
    studytime: studyHours < 2 ? 1 : studyHours <= 5 ? 2 : studyHours <= 10 ? 3 : 4,
    absences: Math.round((100 - syllabus) / 2),
    health: Math.max(1, 6 - stress),
    Medu: 3, Fedu: 3, internet: 1, higher: 1, Walc: 1, Dalc: 1, goout: 2, freetime: 2,
  }
}

// ── Mock fallback ─────────────────────────────────────────────────────────────
function getMockPrediction(cgpa: number, internals: number, backlogs: number, syllabus: number, studyHours: number, stress: number) {
  let score = cgpa * 2.5 + internals / 1.5 - backlogs * 8
  if (syllabus < 30) score -= 15
  else score += syllabus * 0.1
  if (studyHours < 2) score -= 12
  else score += studyHours * 0.4

  let outcome = 'Pass'
  let confidence = 65
  if (score >= 45 && backlogs === 0 && syllabus >= 40 && studyHours >= 3) {
    outcome = 'Excellent'; confidence = 88
  } else if (score < 25 || backlogs >= 2 || syllabus < 20 || studyHours < 1) {
    outcome = 'Fail'; confidence = 45
  }

  return {
    result: { outcome, confidence },
    shap: {
      G1: parseFloat(((cgpa - 6) * 0.15).toFixed(4)),
      G2: parseFloat(((internals - 20) * 0.08).toFixed(4)),
      failures: parseFloat((backlogs * -0.25).toFixed(4)),
      absences: syllabus < 30 ? -0.45 : parseFloat(((75 - syllabus) * -0.005).toFixed(4)),
      studytime: studyHours < 2 ? -0.32 : parseFloat(((studyHours - 7) * 0.02).toFixed(4)),
      health: parseFloat(((3 - stress) * 0.05).toFixed(4))
    },
  }
}

// ── Status mapper (ULTIMATE ML GUARDRAILS) ─────────────────────────────────
function getStatus(result: PredictionResult | null, currentBacklogs: number, syllabus: number, studyHours: number, cgpa: number, internals: number): StatusDisplay | null {
  if (!result) return null

  // 🛑 GUARDRAIL 1: The "Strict KT" Rule
  if (currentBacklogs >= 2) {
    return {
      title: 'Target: CRITICAL RISK 🚨', sgpa: '< 5.5',
      color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-200 dark:border-rose-800',
      message: `You have ${currentBacklogs} active KTs. Clearing them is mandatory regardless of current grades.`,
    }
  }

  // 🛑 GUARDRAIL 2: The "Zero Effort" Rule
  if (syllabus < 30 || studyHours < 2) {
    return {
      title: 'Target: HIGH RISK ⚠️', sgpa: '< 6.0',
      color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-200 dark:border-rose-800',
      message: 'Your past grades are good, but extremely low syllabus coverage or study time heavily increases failure risk.',
    }
  }

  // 🟢 GUARDRAIL 3: The "Topper Override" (Fixes the 34 vs 35 ML Bug)
  // If the student is objectively doing great, IGNORE the ML model's hallucination.
  if (cgpa >= 7.5 && internals >= 25 && currentBacklogs === 0 && syllabus >= 50 && studyHours >= 5) {
    return {
      title: 'Target: CLEAR ✅', sgpa: '8.0 – 10.0', color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800',
      message: 'Your academic metrics are consistently strong. You are solidly in the safe zone.',
    }
  }

  // If no guardrails trigger, trust the ML model
  const o = result.outcome.toLowerCase()
  let expectedSgpa = '6.0 – 7.5' 
  if (o.includes('excellent') || (o.includes('good') && result.confidence > 70)) expectedSgpa = '8.0 – 10.0'
  else if (o.includes('fail') || result.confidence < 50) expectedSgpa = '< 5.5'

  if (o.includes('excellent') || (o.includes('good') && result.confidence > 70)) {
    return {
      title: 'Target: CLEAR ✅', sgpa: expectedSgpa, color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800',
      message: 'You are in the safe zone. Maintain current momentum.',
    }
  }
  if (o.includes('fail') || result.confidence < 50) {
    return {
      title: 'Target: BACKLOG PROBABLE 🚨', sgpa: expectedSgpa, color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-200 dark:border-rose-800',
      message: 'High risk detected. Immediate corrective action required.',
    }
  }
  return {
    title: 'Target: BORDERLINE ⚠️', sgpa: expectedSgpa, color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800',
    message: 'Moderate risk. Push harder before the external exam.',
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function AIPredictorPage() {
  const [cgpa, setCgpa] = useState<number>(8.86)
  const [internals, setInternals] = useState<number>(28)
  const [backlogs, setBacklogs] = useState<number>(0)
  const [syllabus, setSyllabus] = useState<number>(75)
  const [studyHours, setStudyHours] = useState<number>(10)
  const [stress, setStress] = useState<number>(3)

  const [profileLoading, setProfileLoading] = useState(true)
  const [predLoading, setPredLoading] = useState(false)
  const [apiDown, setApiDown] = useState(false)
  const [result, setResult] = useState<PredictionResult | null>(null)
  const [shap, setShap] = useState<ShapData | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setProfileLoading(false); return }
      supabase.from('profiles').select('cgpa').eq('id', user.id).single()
        .then(({ data }) => {
          if (data?.cgpa) setCgpa(Number(data.cgpa))
          setProfileLoading(false)
        })
    })
  }, [])

  const fetchPrediction = useCallback(async () => {
    setPredLoading(true)
    setApiDown(false)
    const payload = buildPayload(cgpa, internals, backlogs, syllabus, studyHours, stress)

    try {
      const res = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8000), 
      })

      if (res.ok) {
        const data = await res.json()
        const outcomeVal = data.prediction || data.outcome
        
        setResult({ 
          outcome: outcomeVal, 
          confidence: data.confidence ? data.confidence * 100 : 0 
        })
        
        if (data.shap_explanation) {
          const shapObj: any = {}
          // Removed the stupid polarity flip that broke the math. 
          // SHAP values will now render exactly as the API intended.
          ;(data.shap_explanation as Array<{ feature: string; value: number }>).forEach(item => {
            shapObj[item.feature] = item.value
          })
          setShap(shapObj)
        } else if (data.shap_values) {
          setShap(data.shap_values)
        }
      } else {
        throw new Error('API error')
      }
    } catch {
      setApiDown(true)
      const { result: mockResult, shap: mockShap } = getMockPrediction(cgpa, internals, backlogs, syllabus, studyHours, stress)
      setResult(mockResult)
      setShap(mockShap)
    } finally {
      setPredLoading(false)
    }
  }, [cgpa, internals, backlogs, syllabus, studyHours, stress])

  useEffect(() => {
    if (profileLoading) return
    const timer = setTimeout(fetchPrediction, 600)
    return () => clearTimeout(timer)
  }, [fetchPrediction, profileLoading])

  const status = getStatus(result, backlogs, syllabus, studyHours, cgpa, internals)
  const maxShap = shap ? Math.max(...Object.values(shap).map(Math.abs), 0.01) : 0.01

  // 🔥 ACTION PLAN 100% DECOUPLED FROM BUGGY SHAP VALUES 🔥
  // We now read directly from the UI sliders, so it will NEVER give illogical advice.
  const warnBacklogs = backlogs >= 1
  const warnInternals = internals <= 22 // Warn if internals are below 22/40
  const warnSyllabus = syllabus <= 40 // Warn if syllabus < 40%
  const warnStudy = studyHours <= 4 // Warn if study < 4 hours
  const warnStress = stress >= 4 

  const isClear = status?.title?.includes('CLEAR')
  const isBorderline = status?.title?.includes('BORDERLINE')
  const isRisk = status?.title?.includes('RISK') || status?.title?.includes('PROBABLE')

  const noSpecificWarnings = !warnBacklogs && !warnInternals && !warnSyllabus && !warnStudy && !warnStress

  const showKeepItUp = isClear && noSpecificWarnings
  const showBorderlineFallback = isBorderline && noSpecificWarnings
  const showRiskFallback = isRisk && noSpecificWarnings

  return (
    <div className="space-y-6 animate-fade-in pb-12 w-full">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <div className="ico ico-indigo h-9 w-9">
            <Brain className="h-5 w-5" />
          </div>
          AI Performance Predictor
        </h1>
        <p className="text-sm text-muted-foreground ml-11">
          Real-time risk assessment and actionable insights powered by Explainable AI.
        </p>
        {apiDown ? (
          <div className="ml-11 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-1.5 rounded-lg w-fit">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            Local Simulator Mode (API Offline)
          </div>
        ) : (
          <div className="ml-11 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-lg w-fit">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            Live AI Connected
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-border bg-white/70 dark:bg-card/70 backdrop-blur-sm shadow-sm p-6 space-y-6">
            <h3 className="text-sm font-semibold flex items-center gap-2 pb-3 border-b border-border">
              <Info className="h-4 w-4 text-muted-foreground" />
              Academic Parameters
              {profileLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground ml-auto" />}
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Current CGPA</label>
                <input type="number" min={0} max={10} step={0.1} value={cgpa} onChange={e => setCgpa(Math.min(10, Math.max(0, Number(e.target.value))))} className="w-full rounded-xl border border-input bg-background/80 px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Internal Marks (40)</label>
                <input type="number" min={0} max={40} value={internals} onChange={e => setInternals(Math.min(40, Math.max(0, Number(e.target.value))))} className="w-full rounded-xl border border-input bg-background/80 px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all" />
              </div>
            </div>

            <SliderField label="Active Backlogs / KTs" value={backlogs} min={0} max={5} display={String(backlogs)} onChange={setBacklogs} />
            <SliderField label="Syllabus Covered" value={syllabus} min={0} max={100} display={`${syllabus}%`} onChange={setSyllabus} />
            <SliderField label="Weekly Self-Study" value={studyHours} min={0} max={30} display={`${studyHours} hrs`} onChange={setStudyHours} />

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-muted-foreground">Stress Level</label>
                <span className="text-sm font-bold text-foreground">
                  {stress === 1 ? '😌 Low' : stress === 2 ? '🙂 Mild' : stress === 3 ? '😐 Mod' : stress === 4 ? '😟 High' : '😰 Very High'}
                </span>
              </div>
              <input type="range" min={1} max={5} value={stress} onChange={e => setStress(Number(e.target.value))} className="w-full accent-primary" />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Prediction card */}
          <div className={`relative overflow-hidden rounded-2xl border shadow-sm p-6 transition-all duration-500 ${status ? `${status.bg} ${status.border}` : 'bg-muted/30 border-border'}`}>
            {predLoading && <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-primary/60 to-transparent animate-pulse" />}

            {!result ? (
              <div className="flex items-center gap-3 text-muted-foreground py-4">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Calculating your prediction…</span>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-[11px] font-bold tracking-widest uppercase text-muted-foreground">AI Projection</p>
                  <h2 className={`text-2xl font-bold ${status?.color}`}>{status?.title}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{status?.message}</p>
                </div>
                <div className={`px-4 py-3 rounded-xl flex flex-col items-end shrink-0 border ${status?.border} bg-white/50 dark:bg-black/20`}>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Expected SGPA</span>
                  <span className={`text-xl font-bold ${status?.color}`}>{status?.sgpa}</span>
                </div>
              </div>
            )}
          </div>

          {/* SHAP Analysis */}
          <div className="rounded-2xl border border-border bg-white/70 dark:bg-card/70 backdrop-blur-sm shadow-sm p-6">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-5">
              <div className="ico ico-blue h-7 w-7"><Activity className="h-3.5 w-3.5" /></div>
              Explainable AI (SHAP)
            </h3>

            {!shap ? (
              <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-8 shimmer" />)}</div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center text-[10px] text-muted-foreground font-medium">
                  <div className="flex-1 text-right pr-2">Lowers score</div>
                  <div className="w-px h-3 bg-border mx-2" />
                  <div className="flex-1 pl-2">Boosts score</div>
                </div>

                {Object.entries(shap)
                  .filter(([k, v]) => Math.abs(v as number) >= 0.005 && Object.keys(SHAP_LABELS).includes(k)) 
                  .sort(([, a], [, b]) => Math.abs(b as number) - Math.abs(a as number))
                  .map(([key, val]) => {
                    const isPos = (val as number) > 0
                    const barPct = Math.min((Math.abs(val as number) / maxShap) * 48, 48) 
                    const label = SHAP_LABELS[key]

                    return (
                      <div key={key} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-foreground">{label}</span>
                          <span className={`font-mono text-[11px] ${isPos ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                            {isPos ? '+' : ''}{(val as number).toFixed(4)}
                          </span>
                        </div>
                        <div className="relative h-2.5 w-full rounded-full bg-muted overflow-hidden flex">
                          <div className="w-1/2 flex justify-end">
                            {!isPos && <div className="h-full rounded-l-full bg-rose-500 transition-all duration-700" style={{ width: `${barPct * 2}%` }} />}
                          </div>
                          <div className="w-px bg-border/60 shrink-0" />
                          <div className="w-1/2">
                            {isPos && <div className="h-full rounded-r-full bg-emerald-500 transition-all duration-700" style={{ width: `${barPct * 2}%` }} />}
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>

          {/* Action Plan */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-primary flex items-center gap-2 mb-4">
              <div className="ico ico-indigo h-7 w-7"><TrendingUp className="h-3.5 w-3.5" /></div>
              Targeted Action Plan
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {warnBacklogs && <ActionCard icon="🚨" title="Clear Backlogs" desc="Active backlogs are severely dropping your overall projection. Focus heavily on clearing KTs." variant="rose" full />}
              {warnInternals && <ActionCard icon="🎯" title="Maximize Externals" desc="Internal marks are dragging you down. You must score heavily in the external exam." variant="amber" />}
              {warnSyllabus && <ActionCard icon="📚" title="Cover Syllabus" desc="Major syllabus gap detected. Prioritize high-weightage topics from previous year papers." variant="amber" />}
              {warnStudy && <ActionCard icon="⏱️" title="Track Focus Hours" desc="Self-study time is critically low. Start using RiseOS focus timer for daily sessions." variant="amber" />}
              {warnStress && <ActionCard icon="🧘‍♂️" title="Manage Stress" desc="High stress levels are negatively impacting your performance and health. Take short breaks and prioritize sleep." variant="rose" />}
              
              {showKeepItUp && (
                <ActionCard icon="🚀" title="Keep it up!" desc="Your academic metrics look solid across the board. Maintain this consistency to secure your grades." variant="emerald" full />
              )}
              {showBorderlineFallback && (
                <ActionCard icon="⚠️" title="Push a Little Harder" desc="You are in the borderline zone. Pushing your self-study hours or maximizing your internals slightly will push you into the safe zone." variant="amber" full />
              )}
              {showRiskFallback && (
                <ActionCard icon="🚨" title="High Risk Alert" desc="Your overall profile is at risk. Please review your study plan immediately and consult your mentor if needed." variant="rose" full />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Reusable Subcomponents ────────────────────────────────────────────────────
function SliderField({ label, value, min, max, display, onChange }: any) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-xs font-semibold text-muted-foreground">{label}</label>
        <span className="text-sm font-bold text-foreground">{display}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={e => onChange(Number(e.target.value))} className="w-full accent-primary" />
    </div>
  )
}

function ActionCard({ icon, title, desc, variant, full }: any) {
  const styles = {
    rose: 'border-rose-200 bg-rose-50',
    amber: 'border-amber-200 bg-amber-50',
    emerald: 'border-emerald-200 bg-emerald-50',
  }
  const titleStyles = { rose: 'text-rose-700', amber: 'text-amber-700', emerald: 'text-emerald-700' }

  return (
    <div className={`rounded-xl border p-4 ${styles[variant as keyof typeof styles]} ${full ? 'sm:col-span-2' : ''}`}>
      <p className={`text-sm font-bold mb-1 ${titleStyles[variant as keyof typeof titleStyles]}`}>{icon} {title}</p>
      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  )
}