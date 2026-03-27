'use client'

import { useState } from 'react'
import { useGameStore } from '@/lib/game-store'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Database,
  Maximize,
  AlertTriangle,
  ShieldX,
  MonitorOff,
  Keyboard,
  EyeOff,
  Lock,
  XCircle,
  CheckCircle2,
  LogOut,
  Monitor,
} from 'lucide-react'

export function TermsModal() {
  const {
    currentPlayer,
    tabSwitchCount,
    fullScrnExitCount,
    windowButtonCount,
    maxViolations,
    acceptTerms,
    logout,
  } = useGameStore()

  const [agreed, setAgreed] = useState(false)
  const [enteringFS, setEnteringFS] = useState(false)

  const handleEnterFullscreen = async () => {
    if (!agreed) return
    setEnteringFS(true)
    try {
      await document.documentElement.requestFullscreen()
    } catch {
      // Some browsers may block; proceed anyway
    }
    acceptTerms()
  }

  const handleCancel = () => {
    logout()
  }

  const totalFSViolations = fullScrnExitCount
  const totalTabViolations = tabSwitchCount
  const totalWinViolations = windowButtonCount

  const violationColor = (count: number) => {
    if (count === 0) return 'text-emerald-400'
    if (count < maxViolations) return 'text-yellow-400'
    return 'text-red-400'
  }

  const violationBg = (count: number) => {
    if (count === 0) return 'bg-emerald-500/10 border-emerald-500/30'
    if (count < maxViolations) return 'bg-yellow-500/10 border-yellow-500/30'
    return 'bg-red-500/10 border-red-500/30'
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 bg-grid-violet [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black_40%,transparent_100%)] opacity-40" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/18 rounded-full blur-[130px] animate-pulse" />
      <div className="absolute bottom-0 right-0 w-[350px] h-[350px] bg-accent/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 w-full max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <Database className="w-8 h-8 text-primary" />
          <div className="text-center">
            <h1 className="text-xl font-bold tracking-tight text-foreground leading-tight">
              ITRIX 2026 · COMMIT OR ROLLBACK
            </h1>
            <p className="text-xs text-muted-foreground">IST, CEG, Anna University</p>
          </div>
        </div>

        {/* Main card */}
        <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm shadow-2xl shadow-black/30 overflow-hidden">
          {/* Title bar */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-border/50 bg-yellow-500/5">
            <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0" />
            <div>
              <h2 className="text-base font-bold text-foreground">Rules, Warnings & Terms of Participation</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Welcome, <span className="text-primary font-medium">{currentPlayer?.name ?? 'Participant'}</span>. Read all rules carefully before entering the arena.
              </p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* ─── Violation status ─── */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                Violation Tracking
              </p>
              <div className="grid grid-cols-2 gap-3">
                {/* Column 1 – Fullscreen violations */}
                <div className={`rounded-xl border p-4 ${violationBg(totalFSViolations)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MonitorOff className={`w-4 h-4 ${violationColor(totalFSViolations)}`} />
                      <span className="text-sm font-semibold text-foreground">Fullscreen Exits</span>
                    </div>
                    <ViolationBadge count={totalFSViolations} max={maxViolations} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Exiting fullscreen will trigger an alert and pause your timer.
                  </p>
                </div>

                {/* Column 2 – Tab switch violations */}
                <div className={`rounded-xl border p-4 ${violationBg(totalTabViolations)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <EyeOff className={`w-4 h-4 ${violationColor(totalTabViolations)}`} />
                      <span className="text-sm font-semibold text-foreground">Tab Switches</span>
                    </div>
                    <ViolationBadge count={totalTabViolations} max={maxViolations} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Switching tabs or minimising the window will trigger an alert.
                  </p>
                </div>

                {/* Column 3 – Window/Meta key */}
                <div className={`rounded-xl border p-4 col-span-2 ${violationBg(totalWinViolations)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Keyboard className={`w-4 h-4 ${violationColor(totalWinViolations)}`} />
                      <span className="text-sm font-semibold text-foreground">Windows / Meta Key Presses</span>
                    </div>
                    <ViolationBadge count={totalWinViolations} max={maxViolations} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Pressing ⊞ Win or ⌘ Command will trigger an alert and be logged immediately.
                  </p>
                </div>
              </div>
            </div>

            {/* ─── Warnings ─── */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                Warnings
              </p>
              <div className="space-y-2">
                <WarningRow
                  icon={<MonitorOff className="w-4 h-4 text-red-400" />}
                  title="Fullscreen mode is mandatory"
                  desc="Exiting fullscreen at any point during the quiz will be recorded as a violation. Your screen will be frozen and the timer paused until you re-enter fullscreen."
                />
                <WarningRow
                  icon={<EyeOff className="w-4 h-4 text-red-400" />}
                  title="Tab switching is strictly prohibited"
                  desc="Switching tabs, minimising the window, or opening another application is detected in real-time and recorded as a violation."
                />
                <WarningRow
                  icon={<Keyboard className="w-4 h-4 text-red-400" />}
                  title="Windows / Meta key is blocked"
                  desc="Pressing the Windows key (⊞) or the Mac Command / Meta key is detected and logged as a violation during every round."
                />
                <WarningRow
                  icon={<XCircle className="w-4 h-4 text-red-400" />}
                  title="Copy, paste & right-click are disabled"
                  desc="All clipboard operations and context menus are disabled throughout the competition to maintain integrity."
                />
                <WarningRow
                  icon={<ShieldX className="w-4 h-4 text-red-400" />}
                  title="Disqualification on exceeding violation limit"
                  desc="Each violation type (fullscreen exit, tab switch, window key) has a strict limit. Exceeding any limit results in immediate, permanent disqualification."
                />
                <WarningRow
                  icon={<Monitor className="w-4 h-4 text-yellow-400" />}
                  title="Admin proctoring is active"
                  desc="All violations are logged to the admin panel in real-time. An admin can disqualify or reset any player at any time."
                />
                <WarningRow
                  icon={<Lock className="w-4 h-4 text-yellow-400" />}
                  title="Session is persistent"
                  desc="Your progress is auto-saved. Refreshing or closing the browser will restore your session with all previously recorded violations intact."
                />
              </div>
            </div>

            {/* ─── Terms & Conditions ─── */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                Terms & Conditions
              </p>
              <div className="rounded-xl border border-border/40 bg-muted/20 p-4 text-xs text-muted-foreground space-y-2 leading-relaxed">
                <p>1. By entering the arena you agree to compete fairly and in good faith.</p>
                <p>2. Any form of cheating, collusion, or use of external resources is grounds for immediate disqualification.</p>
                <p>3. The competition timer is authoritative. No extensions will be granted for technical issues on the participant's side.</p>
                <p>4. All decisions made by the admin/organiser are final and binding.</p>
                <p>5. Violation counts are persisted to the database and cannot be appealed once recorded.</p>
                <p>6. Fullscreen mode must be maintained at all times during active rounds. Exiting fullscreen pauses the timer but the violation is still counted.</p>
                <p>7. This platform collects minimal session data (player ID, team code, answers, violation counts) for the purpose of conducting the competition.</p>
                <p>8. ITRIX 2026 organisers reserve the right to modify, pause, or terminate the competition at any time.</p>
              </div>
            </div>

            {/* ─── Agreement checkbox ─── */}
            <div
              className="flex items-start gap-3 rounded-xl border border-primary/40 bg-primary/5 px-4 py-3 cursor-pointer hover:bg-primary/10 transition-colors duration-150"
              onClick={() => setAgreed((v) => !v)}
            >
              <Checkbox
                id="agree-terms"
                checked={agreed}
                onCheckedChange={(val) => setAgreed(!!val)}
                className="mt-0.5 shrink-0 size-5 border-2 border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary ring-0 focus-visible:ring-2 focus-visible:ring-primary/50"
                onClick={(e) => e.stopPropagation()}
              />
              <label
                htmlFor="agree-terms"
                className="text-sm text-foreground leading-snug cursor-pointer select-none"
              >
                I have read and understood all the rules, warnings, and terms of participation. I agree to compete fairly and accept that violations will be tracked and may result in disqualification.
              </label>
            </div>

            {/* ─── Action buttons ─── */}
            <div className="flex items-center gap-3 pt-1">
              <Button
                variant="outline"
                className="flex-1 h-11 border-border/60 text-muted-foreground hover:text-foreground"
                onClick={handleCancel}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cancel &amp; Log Out
              </Button>
              <Button
                className="flex-1 h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-lg shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                disabled={!agreed || enteringFS}
                onClick={handleEnterFullscreen}
              >
                <Maximize className="w-4 h-4 mr-2" />
                {enteringFS ? 'Entering Fullscreen…' : 'Enter Fullscreen & Continue'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ViolationBadge({ count, max }: { count: number; max: number }) {
  if (count === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2.5 py-0.5">
        <CheckCircle2 className="w-3 h-3" />
        Clean
      </span>
    )
  }
  if (count < max) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 rounded-full px-2.5 py-0.5">
        <AlertTriangle className="w-3 h-3" />
        Warning
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/30 rounded-full px-2.5 py-0.5">
      <XCircle className="w-3 h-3" />
      Critical
    </span>
  )
}

function WarningRow({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode
  title: string
  desc: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/30 bg-muted/10 px-4 py-3">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}
