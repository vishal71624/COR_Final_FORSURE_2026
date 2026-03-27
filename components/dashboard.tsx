'use client'

import { useState } from 'react'
import { useGameStore } from '@/lib/game-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Database,
  LogOut,
  Trophy,
  Lock,
  Play,
  Zap,
  Target,
  Code,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  RotateCcw,
  Users,
} from 'lucide-react'

export function Dashboard() {
  const {
    currentPlayer,
    currentTeam,
    logout,
    setView,
    startRound1,
    startRound2,
    tabSwitchCount,
    fullScrnExitCount,
    tabSwitchCount2,
    fullScrnExitCount2,
    maxViolations,
    violations
  } = useGameStore()

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  if (!currentPlayer) return null

  const hasR1Violations = tabSwitchCount > 0 || fullScrnExitCount > 0
  const hasR2Violations = tabSwitchCount2 > 0 || fullScrnExitCount2 > 0
  const r1ViolationDanger = tabSwitchCount > maxViolations || fullScrnExitCount > maxViolations
  const r2ViolationDanger = tabSwitchCount2 > maxViolations || fullScrnExitCount2 > maxViolations
  const hasR1Checkpoint = !!currentPlayer.r1Checkpoints
  const hasR2Checkpoint = !!currentPlayer.r2Checkpoints

  // Disqualified view - only show logout button
  if (currentPlayer.isDisqualified) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-violet [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black_40%,transparent_100%)] opacity-50" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-destructive/18 rounded-full blur-[130px] animate-pulse" />

        <div className="relative z-10 w-full max-w-md space-y-6">
          <div className="flex items-center justify-center gap-3">
            <Database className="w-8 h-8 text-primary" />
            <div className="text-center">
              <h1 className="text-xl font-bold text-foreground leading-tight">ITRIX 2026<br />COMMIT OR ROLLBACK</h1>
              <p className="text-xs text-muted-foreground">IST, CEG, Anna University</p>
            </div>
          </div>

          <Card className="border-destructive/50 bg-card/80 backdrop-blur-sm shadow-xl shadow-black/20">
            <CardContent className="pt-6 pb-6 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-destructive/20 flex items-center justify-center">
                <ShieldAlert className="w-10 h-10 text-destructive" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-destructive">Disqualified</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Your account exceeded the proctoring violation limit.
                </p>
                <p className="text-sm text-muted-foreground">
                  You cannot participate further in the competition.
                </p>
              </div>
            </CardContent>
          </Card>

          <Button
            variant="outline"
            className="w-full border-primary/40 text-primary hover:bg-primary/10"
            onClick={logout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Exit
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-violet [mask-image:radial-gradient(ellipse_90%_60%_at_50%_0%,black_40%,transparent_100%)] opacity-40 pointer-events-none" />
      <div className="absolute -top-48 left-0 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[140px] animate-pulse pointer-events-none" />
      <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[130px] animate-pulse pointer-events-none" style={{ animationDelay: '2s' }} />
      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-background/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="max-w-sm w-full bg-card border border-border/60 rounded-2xl p-6 shadow-2xl shadow-black/40 space-y-4">
            <h2 className="text-lg font-bold text-foreground">Exit Competition?</h2>
            <p className="text-sm text-muted-foreground">You will be logged out. Any unsaved progress in an active round may be lost.</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowLogoutConfirm(false)} className="flex-1">Cancel</Button>
              <Button onClick={logout} className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90">Exit</Button>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <header className="border-b border-border/40 bg-background/60 backdrop-blur-md sticky top-0 z-50 relative">
        <div className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <Database className="w-7 h-7 text-primary" />
            <div>
              <h1 className="font-bold text-base text-foreground leading-tight">ITRIX 2026<br />COMMIT OR ROLLBACK</h1>
              <p className="text-[11px] text-muted-foreground">IST, CEG, Anna University</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary hover:bg-primary/12 transition-colors rounded-lg"
              onClick={() => setView('leaderboard')}
            >
              <Trophy className="w-3.5 h-3.5 mr-1.5" />
              Leaderboard
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLogoutConfirm(true)}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors rounded-lg"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
              Exit
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Disqualification Banner */}
        {currentPlayer.isDisqualified && (
          <div className="p-4 rounded-xl bg-destructive/15 border border-destructive/40 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-destructive">You have been disqualified</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Your account exceeded the proctoring violation limit. You cannot participate further.
              </p>
            </div>
          </div>
        )}

        {/* Player Info Card */}
        <Card className="border-border/50 bg-card/80">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                  <span className="text-xl font-bold text-primary">
                    {currentPlayer.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-base font-semibold text-foreground">{currentPlayer.name}</p>
                  {currentTeam && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Users className="w-3 h-3 text-primary" />
                      <p className="text-xs text-primary font-medium">{currentTeam.name}</p>
                      {currentTeam.player2Name && (
                        <p className="text-xs text-muted-foreground">
                          · with {currentPlayer.playerSlot === 1 ? currentTeam.player2Name : currentTeam.player1Name}
                        </p>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">{currentTeam?.code || currentPlayer.id}</p>
                  {/* Violation badges */}
                  {(hasR1Violations || hasR2Violations) && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {hasR1Violations && (
                        <Badge
                          variant="outline"
                          className={`text-[10px] py-0 h-5 ${r1ViolationDanger ? 'border-destructive/70 text-destructive' : 'border-neon-orange/60 text-neon-orange'}`}
                        >
                          <AlertTriangle className="w-2.5 h-2.5 mr-1" />
                          R1: {tabSwitchCount} tab switch{tabSwitchCount !== 1 ? 'es' : ''} · {fullScrnExitCount} fullscreen exit{fullScrnExitCount !== 1 ? 's' : ''}
                        </Badge>
                      )}
                      {hasR2Violations && (
                        <Badge
                          variant="outline"
                          className={`text-[10px] py-0 h-5 ${r2ViolationDanger ? 'border-destructive/70 text-destructive' : 'border-neon-orange/60 text-neon-orange'}`}
                        >
                          <AlertTriangle className="w-2.5 h-2.5 mr-1" />
                          R2: {tabSwitchCount2} tab switch{tabSwitchCount2 !== 1 ? 'es' : ''} · {fullScrnExitCount2} fullscreen exit{fullScrnExitCount2 !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="text-xs text-muted-foreground mb-0.5">Total Score</p>
                <p className="text-4xl font-bold text-primary tabular-nums">{currentPlayer.score}</p>
                {(currentPlayer.round1Score > 0 || currentPlayer.round2Score > 0) && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    R1: {currentPlayer.round1Score} · R2: {currentPlayer.round2Score}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Violations (last 2 only, compact) */}
        {violations.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-neon-orange/5 border border-neon-orange/20">
            <AlertTriangle className="w-3.5 h-3.5 text-neon-orange shrink-0" />
            <p className="text-xs text-neon-orange font-medium">Recent:</p>
            <p className="text-xs text-muted-foreground truncate">{violations[violations.length - 1]}</p>
          </div>
        )}

        {/* Round Cards */}
        <div className="grid md:grid-cols-2 gap-5">
          {/* Round 1 */}
          <Card className="border-border/50 bg-card/80 overflow-hidden transition-shadow hover:shadow-md hover:shadow-black/20 gap-0 py-0">
            <CardHeader className="bg-primary/5 border-b border-border/50 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="outline" className="mb-2 border-primary/50 text-primary text-[10px] h-5">
                    Round 1
                  </Badge>
                  <CardTitle className="text-lg text-foreground">Scenario Challenge</CardTitle>
                  <CardDescription className="text-xs mt-0.5">30 DBMS questions · 45 minutes</CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary tabular-nums">{currentPlayer.round1Score}</p>
                  <p className="text-[10px] text-muted-foreground">pts</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-5">
              {currentPlayer.isDisqualified ? (
                <div className="text-center py-4">
                  <ShieldAlert className="w-12 h-12 mx-auto mb-3 text-destructive" />
                  <p className="font-semibold text-destructive">Access Revoked</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    You have been disqualified from this round
                  </p>
                </div>
              ) : currentPlayer.round1Completed ? (
                <div className="text-center py-4">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-neon-green" />
                  <p className="font-semibold text-neon-green">Round 1 Complete!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    You scored {currentPlayer.round1Score} points
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Target className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>15 Easy · 10 Medium · 5 Hard</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>45 minutes · Navigate freely</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>Points: 10 / 15 / 20 per question</span>
                    </div>
                  </div>

                  {hasR1Checkpoint && (
                    <div className="flex items-center gap-2 text-xs text-neon-orange bg-neon-orange/10 border border-neon-orange/20 rounded-lg px-3 py-2">
                      <RotateCcw className="w-3 h-3 shrink-0" />
                      Session in progress — will resume from where you left off
                    </div>
                  )}

                  <Button
                    onClick={startRound1}
                    className="w-full h-11 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {hasR1Checkpoint ? 'Resume Round 1' : 'Start Round 1'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Round 2 */}
          <Card className={`border-border/50 bg-card/80 overflow-hidden gap-0 py-0 transition-shadow hover:shadow-md hover:shadow-black/20 ${!currentPlayer.round2Enabled ? 'opacity-60' : ''}`}>
            <CardHeader className="bg-accent/5 border-b border-border/50 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="outline" className="mb-2 border-accent/50 text-accent text-[10px] h-5">
                    Round 2
                  </Badge>
                  <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                    SQL Challenge Arena
                    {!currentPlayer.round2Enabled && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">10 SQL challenges · 30 minutes</CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-accent tabular-nums">{currentPlayer.round2Score}</p>
                  <p className="text-[10px] text-muted-foreground">pts</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-5">
              {currentPlayer.round2Completed ? (
                <div className="text-center py-4">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-neon-green" />
                  <p className="font-semibold text-neon-green">Round 2 Complete!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    You scored {currentPlayer.round2Score} points
                  </p>
                </div>
              ) : !currentPlayer.round2Enabled ? (
                <div className="text-center py-4">
                  <Lock className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-muted-foreground font-medium text-sm">Round 2 Locked</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Complete Round 1 and wait for admin to unlock
                  </p>
                </div>
              ) : currentPlayer.isDisqualified ? (
                <div className="text-center py-4">
                  <ShieldAlert className="w-12 h-12 mx-auto mb-3 text-destructive" />
                  <p className="font-semibold text-destructive">Access Revoked</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    You have been disqualified from this round
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Code className="w-3.5 h-3.5 text-accent shrink-0" />
                      <span>Write real SQL queries in a live editor</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-accent shrink-0" />
                      <span>30 minutes total time</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-accent shrink-0" />
                      <span>Test cases auto-validated in browser</span>
                    </div>
                  </div>

                  {hasR2Checkpoint && (
                    <div className="flex items-center gap-2 text-xs text-neon-orange bg-neon-orange/10 border border-neon-orange/20 rounded-lg px-3 py-2">
                      <RotateCcw className="w-3 h-3 shrink-0" />
                      Session in progress — will resume from where you left off
                    </div>
                  )}

                  <Button
                    onClick={startRound2}
                    className="w-full h-11 text-sm font-semibold bg-accent text-accent-foreground hover:bg-accent/90 transition-all shadow-md shadow-accent/20"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {hasR2Checkpoint ? 'Resume Round 2' : 'Start Round 2'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
