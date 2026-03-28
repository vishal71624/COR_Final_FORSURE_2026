'use client'

import { Button } from '@/components/ui/button'
import { useGameStore } from '@/lib/game-store'
import { Database, Terminal, Zap, Shield, Code2, Trophy, ArrowRight } from 'lucide-react'

export function LandingPage() {
  const setView = useGameStore((s) => s.setView)

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">

      {/* Mesh gradient background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[120px] animate-pulse" />
        <div className="absolute top-1/3 -right-48 w-[500px] h-[500px] rounded-full bg-accent/15 blur-[130px] animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute -bottom-24 left-1/3 w-[450px] h-[450px] rounded-full bg-neon-rose/10 blur-[120px] animate-pulse" style={{ animationDelay: '3s' }} />
      </div>

      {/* Dot grid */}
      <div className="absolute inset-0 bg-grid-violet [mask-image:radial-gradient(ellipse_75%_75%_at_50%_50%,black_30%,transparent_100%)] opacity-60" />

      <div className="relative z-10 flex-1 flex flex-col">

        {/* Header */}
        <header className="flex items-center justify-between px-6 lg:px-12 py-5 border-b border-border/30 bg-background/40 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Database className="w-5 h-5 text-primary" />
            </div>
            <div className="font-mono text-sm font-bold tracking-tight text-foreground leading-tight">
              ITRIX 2026<br />
              <span className="text-primary">COMMIT OR ROLLBACK</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-primary/8 px-3.5 py-1.5 rounded-full border border-primary/20">
            <Zap className="w-3 h-3 text-neon-amber fill-neon-amber" />
            <span className="font-medium">Live Competition</span>
          </div>
        </header>

        {/* Hero */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-10 py-16">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/25 text-xs text-primary font-semibold tracking-wide uppercase">
            <Database className="w-3.5 h-3.5" />
            DBMS Challenge · CEG, Anna University
          </div>

          {/* Title */}
          <div className="space-y-4 max-w-5xl w-full">
            <h1 className="font-extrabold tracking-tighter leading-[0.9] text-center whitespace-nowrap" style={{ fontSize: 'clamp(2.4rem, 7.5vw, 6rem)' }}>
              <span className="text-foreground">COMMIT</span>
              <span className="text-muted-foreground/40 mx-3 md:mx-5 font-light" style={{ fontSize: 'clamp(1.8rem, 5.5vw, 4.5rem)' }}>or</span>
              <span className="text-gradient-primary">ROLLBACK</span>
            </h1>

          </div>

          {/* CTA */}
          <div className="flex flex-col items-center gap-4">
            <Button
              size="lg"
              className="relative bg-primary text-primary-foreground hover:bg-primary/90 px-12 py-7 text-lg font-bold shadow-2xl shadow-primary/30 transition-all duration-300 hover:shadow-primary/50 hover:scale-[1.04] active:scale-[0.97] rounded-xl glow-primary"
              onClick={() => setView('login')}
            >
              <Terminal className="w-5 h-5 mr-2.5" />
              Enter the Arena
              <ArrowRight className="w-5 h-5 ml-2.5" />
            </Button>
          </div>

          {/* Feature cards */}
          <div className="grid sm:grid-cols-3 gap-4 w-full max-w-3xl mt-4">
            <div className="card-glass rounded-2xl p-5 text-left group hover:border-primary/40 transition-colors duration-300">
              <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center mb-3 group-hover:bg-primary/25 transition-colors">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <p className="font-bold text-sm text-foreground">Round 1 — MCQ</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">30 scenario-based DBMS questions in 45 minutes</p>
            </div>
            <div className="card-glass rounded-2xl p-5 text-left group hover:border-accent/40 transition-colors duration-300">
              <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/25 flex items-center justify-center mb-3 group-hover:bg-accent/25 transition-colors">
                <Code2 className="w-5 h-5 text-accent" />
              </div>
              <p className="font-bold text-sm text-foreground">Round 2 — SQL</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Live SQL coding arena with real-time validation</p>
            </div>
            <div className="card-glass rounded-2xl p-5 text-left group hover:border-neon-rose/40 transition-colors duration-300">
              <div className="w-10 h-10 rounded-xl bg-neon-rose/15 border border-neon-rose/25 flex items-center justify-center mb-3 group-hover:bg-neon-rose/25 transition-colors">
                <Trophy className="w-5 h-5 text-neon-rose" />
              </div>
              <p className="font-bold text-sm text-foreground">Live Leaderboard</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Real-time team & individual rankings updated live</p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-5 text-center text-xs text-muted-foreground border-t border-border/20">
          <div className="flex items-center justify-center gap-1.5">
            <Shield className="w-3 h-3 text-primary/60" />
            Department of Information Science and Technology, CEG, Anna University
          </div>
        </footer>
      </div>
    </div>
  )
}
