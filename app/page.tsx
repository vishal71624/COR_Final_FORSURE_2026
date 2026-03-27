'use client'

import { useEffect, useState } from 'react'
import { useGameStore } from '@/lib/game-store'
import { LandingPage } from '@/components/landing-page'
import { LoginPage } from '@/components/login-page'
import { TermsModal } from '@/components/terms-modal'
import { Dashboard } from '@/components/dashboard'
import { Round1Quiz } from '@/components/round1-quiz'
import { Round2Editor } from '@/components/round2-editor'
import { Leaderboard } from '@/components/leaderboard'
import { AdminPanel } from '@/components/admin-panel'
import { WaitingRoom } from '@/components/waiting-room'

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [restoringSession, setRestoringSession] = useState(true)
  const currentView = useGameStore((s) => s.currentView)
  const loadRound1Questions = useGameStore((s) => s.loadRound1Questions)
  const loadRound2Challenges = useGameStore((s) => s.loadRound2Challenges)
  const restoreSession = useGameStore((s) => s.restoreSession)

  useEffect(() => {
    setMounted(true)
    const init = async () => {
      await Promise.all([loadRound1Questions(), loadRound2Challenges()])
      await restoreSession()
      setRestoringSession(false)
    }
    init()
  }, [])

  if (!mounted || restoringSession) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-full border-2 border-border/30" />
          <div className="absolute inset-0 w-14 h-14 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-medium text-foreground leading-tight text-center">ITRIX 2026<br />COMMIT OR ROLLBACK</p>
          <p className="text-xs text-muted-foreground">Connecting to arena…</p>
        </div>
      </div>
    )
  }

  switch (currentView) {
    case 'landing':
      return <LandingPage />
    case 'login':
      return <LoginPage />
    case 'terms':
      return <TermsModal />
    case 'dashboard':
      return <Dashboard />
    case 'round1':
      return <Round1Quiz />
    case 'round2':
      return <Round2Editor />
    case 'leaderboard':
      return <Leaderboard />
    case 'admin':
      return <AdminPanel />
    case 'waiting':
      return <WaitingRoom />
    default:
      return <LandingPage />
  }
}
