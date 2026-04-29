import { Zap, CheckCircle2, TrendingUp, BookOpen } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-rise-950 via-background to-background border-r border-border/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-violet-500/8 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 border border-primary/30">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xl font-bold gradient-text">RiseOS</span>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-4xl font-bold leading-tight">
              Your personal OS
              <br />
              <span className="gradient-text">for builders.</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-sm mt-4">
              Track career goals, study progress, daily tasks, and analytics — all in one place.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="space-y-3">
            {[
              { icon: TrendingUp, text: 'Career roadmap with milestone tracking' },
              { icon: BookOpen,   text: 'Study dashboard with syllabus progress' },
              { icon: CheckCircle2, text: 'Daily tasks, Pomodoro timer & streak' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                </div>
                {text}
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-muted-foreground/50">
          RiseOS — Personal Productivity & Career OS
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 border border-primary/30">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <span className="text-lg font-bold gradient-text">RiseOS</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
