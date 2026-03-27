'use client'

import { useEffect, useState, useCallback } from 'react'
import { useGameStore } from '@/lib/game-store'
import { fetchTeamStatus } from '@/lib/supabase/db-actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Users,
  CheckCircle2,
  Clock,
  Loader2,
  Database,
  LogOut,
  ShieldAlert,
  Timer,
} from 'lucide-react'

export function WaitingRoom() {
  const { currentPlayer, currentTeam, waitingMode, setView, logout, setWaitingMode, setLeaderboardInitialTab, setLeaderboardInitialSection } = useGameStore()
  const [pollCount, setPollCount] = useState(0)
  const [isChecking, setIsChecking] = useState(false)
  const [conditionMet, setConditionMet] = useState(false)
  const [onlyExit, setOnlyExit] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)

  const playerSlot = currentPlayer?.playerSlot ?? 1
  const partnerSlot = playerSlot === 1 ? 2 : 1
  const myName = playerSlot === 1 ? currentTeam?.player1Name : currentTeam?.player2Name
  const partnerName = playerSlot === 1 ? currentTeam?.player2Name : currentTeam?.player1Name

  const checkAndAdvance = useCallback(async () => {
    if (!currentTeam || !currentPlayer) return
    if (conditionMet) return

    setIsChecking(true)
    try {
      const status = await fetchTeamStatus(currentTeam.code)
      if (!status.team) return

      const myData = playerSlot === 1 ? status.player1 : status.player2
      const partnerData = partnerSlot === 1 ? status.player1 : status.player2
      const isSolo = !currentTeam.player2Name

      const eitherDisqualified =
        currentPlayer.isDisqualified || myData?.isDisqualified || partnerData?.isDisqualified

      if (eitherDisqualified) {
        if (waitingMode === 'post-r1' || waitingMode === 'post-r2') {
          setConditionMet(true)
          setOnlyExit(true)
        } else {
          setView('dashboard')
        }
        return
      }

      const partnerR1Done = isSolo || (partnerData?.round1Completed ?? false) || (partnerData?.isDisqualified ?? false)
      const partnerR2Done = isSolo || (partnerData?.round2Completed ?? false) || (partnerData?.isDisqualified ?? false)

      if (waitingMode === 'pre-game') {
        const partnerJoined = isSolo || (partnerSlot === 1 ? status.team.player1Joined : status.team.player2Joined)
        if (partnerJoined) {
          setView('dashboard')
        }
      } else if (waitingMode === 'post-r1') {
        const myDone = myData?.round1Completed ?? currentPlayer.round1Completed
        if (myDone && partnerR1Done) {
          setConditionMet(true)
        }
      } else if (waitingMode === 'pre-r2') {
        const myR2Enabled = myData?.round2Enabled ?? currentPlayer.round2Enabled
        if (myR2Enabled) {
          setView('dashboard')
        }
      } else if (waitingMode === 'post-r2') {
        const myDone = myData?.round2Completed ?? currentPlayer.round2Completed
        if (myDone && partnerR2Done) {
          setConditionMet(true)
        }
      }

      setPollCount(c => c + 1)
    } catch (e) {
      console.error('Waiting room poll error:', e)
    } finally {
      setIsChecking(false)
    }
  }, [currentTeam, currentPlayer, waitingMode, playerSlot, partnerSlot, setView, setWaitingMode, conditionMet])

  useEffect(() => {
    checkAndAdvance()
    const interval = setInterval(checkAndAdvance, 3000)
    return () => clearInterval(interval)
  }, [checkAndAdvance])

  const [partnerStatus, setPartnerStatus] = useState<{
    joined: boolean
    round1Completed: boolean
    round2Completed: boolean
    round2Enabled: boolean
    isDisqualified: boolean
  } | null>(null)

  useEffect(() => {
    const poll = async () => {
      if (!currentTeam || conditionMet) return
      const status = await fetchTeamStatus(currentTeam.code)
      if (partnerSlot === 1) {
        setPartnerStatus(status.player1 ? { joined: status.team?.player1Joined ?? false, ...status.player1 } : null)
      } else {
        setPartnerStatus(status.player2 ? { joined: status.team?.player2Joined ?? false, ...status.player2 } : null)
      }
    }
    poll()
    const interval = setInterval(poll, 3000)
    return () => clearInterval(interval)
  }, [currentTeam, partnerSlot, conditionMet])

  // Auto-redirect countdown after condition is met for post-round lobbies
  useEffect(() => {
    if (!conditionMet || onlyExit) return
    if (waitingMode !== 'post-r1' && waitingMode !== 'post-r2') return

    setCountdown(5)
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [conditionMet, onlyExit, waitingMode])

  // Trigger redirect when countdown hits 0
  useEffect(() => {
    if (countdown !== 0) return
    if (waitingMode === 'post-r1') {
      setLeaderboardInitialTab('round1')
      setLeaderboardInitialSection('teams')
      setView('leaderboard')
    } else if (waitingMode === 'post-r2') {
      setLeaderboardInitialTab('overall')
      setLeaderboardInitialSection('teams')
      setView('leaderboard')
    }
  }, [countdown, waitingMode, setView, setLeaderboardInitialTab, setLeaderboardInitialSection])

  const getTitle = () => {
    if (conditionMet && onlyExit) return 'Player Disqualified'
    if (conditionMet && waitingMode === 'post-r1') return 'Both Done with Round 1!'
    if (conditionMet && waitingMode === 'post-r2') return 'Competition Complete!'
    if (waitingMode === 'pre-game') return 'Waiting for Your Teammate'
    if (waitingMode === 'post-r1') return 'Round 1 Complete!'
    if (waitingMode === 'pre-r2') return 'Waiting for Round 2'
    if (waitingMode === 'post-r2') return 'Round 2 Complete!'
    return 'Please Wait'
  }

  const getSubtitle = () => {
    if (conditionMet && onlyExit) return 'A player has been disqualified — you can exit now'
    if (conditionMet && waitingMode === 'post-r1') return 'Your team has finished Round 1 — redirecting to Round 1 leaderboard…'
    if (conditionMet && waitingMode === 'post-r2') return 'Your team has completed the competition — redirecting to overall leaderboard…'
    if (waitingMode === 'pre-game') return 'The game starts once your teammate enters the arena'
    if (waitingMode === 'post-r1') return 'Waiting for your teammate to finish Round 1'
    if (waitingMode === 'pre-r2') return "Round 2 hasn't started yet — sit tight, it will begin shortly"
    if (waitingMode === 'post-r2') return 'Waiting for your teammate to finish Round 2'
    return 'Syncing with your team...'
  }

  const getMyStatus = () => {
    if (waitingMode === 'pre-game') return 'Entered'
    if (waitingMode === 'post-r1') return 'Finished Round 1'
    if (waitingMode === 'pre-r2') return 'Finished Round 1'
    if (waitingMode === 'post-r2') return 'Finished Round 2'
    return 'Ready'
  }

  const getPartnerStatusLabel = () => {
    if (!partnerStatus) return { label: 'Waiting...', done: false }
    if (partnerStatus.isDisqualified) return { label: 'Disqualified', done: false }
    if (waitingMode === 'pre-game') {
      return partnerStatus.joined
        ? { label: 'Entered', done: true }
        : { label: 'Not yet joined', done: false }
    }
    if (waitingMode === 'post-r1') {
      return partnerStatus.round1Completed
        ? { label: 'Finished Round 1', done: true }
        : { label: 'Still playing...', done: false }
    }
    if (waitingMode === 'pre-r2') {
      return partnerStatus.round1Completed
        ? { label: 'Finished Round 1', done: true }
        : { label: 'Still playing...', done: false }
    }
    if (waitingMode === 'post-r2') {
      return partnerStatus.round2Completed
        ? { label: 'Finished Round 2', done: true }
        : { label: 'Still playing...', done: false }
    }
    return { label: 'Waiting...', done: false }
  }

  const partnerStatusInfo = getPartnerStatusLabel()

  const isPostRoundLobby = waitingMode === 'post-r1' || waitingMode === 'post-r2'
  const exitEnabled = conditionMet || !isPostRoundLobby

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-violet [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black_40%,transparent_100%)] opacity-50" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/18 rounded-full blur-[130px] animate-pulse" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[350px] bg-accent/12 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 w-full max-w-md space-y-6">
        <div className="flex items-center justify-center gap-3">
          <Database className="w-8 h-8 text-primary" />
          <div className="text-center">
            <h1 className="text-xl font-bold text-foreground leading-tight">ITRIX 2026<br />COMMIT OR ROLLBACK</h1>
            <p className="text-xs text-muted-foreground">IST, CEG, Anna University</p>
          </div>
        </div>

        {currentTeam && (
          <div className="text-center">
            <Badge variant="outline" className="border-primary/50 text-primary text-sm px-4 py-1">
              <Users className="w-3.5 h-3.5 mr-1.5" />
              Team: {currentTeam.name}
            </Badge>
          </div>
        )}

        <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-xl shadow-black/20">
          <CardHeader className="text-center pb-3">
            <div className="flex items-center justify-center mb-3">
              {conditionMet ? (
                onlyExit ? (
                  <ShieldAlert className="w-10 h-10 text-destructive" />
                ) : (
                  <CheckCircle2 className="w-10 h-10 text-primary" />
                )
              ) : isChecking ? (
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              ) : (
                <div className="w-10 h-10 rounded-full border-2 border-primary/30 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <CardTitle className="text-xl text-foreground">{getTitle()}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{getSubtitle()}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <PlayerStatusRow
                name={myName || 'You'}
                label={getMyStatus()}
                isDone={true}
                isYou={true}
              />
              {partnerName && (
                <PlayerStatusRow
                  name={partnerName}
                  label={partnerStatusInfo.label}
                  isDone={partnerStatusInfo.done}
                  isYou={false}
                />
              )}
            </div>

            {/* Countdown redirect banner */}
            {conditionMet && !onlyExit && countdown !== null && countdown > 0 && (
              <div className="pt-2 border-t border-primary/30">
                <div className="flex items-center justify-center gap-2 text-primary">
                  <Timer className="w-4 h-4" />
                  <p className="text-sm font-semibold">
                    Redirecting to leaderboard in {countdown}s…
                  </p>
                </div>
              </div>
            )}

            {waitingMode === 'pre-r2' && !conditionMet && (
              <div className="pt-2 border-t border-border/50">
                <p className="text-xs text-center text-primary/70">
                  Round 2 will be unlocked by the admin when the time comes
                </p>
              </div>
            )}

            {!conditionMet && (
              <div className="pt-2 border-t border-border/50">
                <p className="text-xs text-center text-muted-foreground">
                  Checking every 3 seconds · {pollCount} checks done
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            variant={onlyExit ? 'outline' : 'ghost'}
            className={
              onlyExit
                ? 'flex-1 border-primary/40 text-primary disabled:opacity-30 disabled:cursor-not-allowed'
                : 'flex-1 text-muted-foreground hover:text-destructive disabled:opacity-30 disabled:cursor-not-allowed'
            }
            onClick={logout}
            disabled={!exitEnabled}
            title={!exitEnabled ? 'Available once both players are done' : undefined}
          >
            <LogOut className="w-3.5 h-3.5 mr-2" />
            Exit
          </Button>
        </div>
      </div>
    </div>
  )
}

function PlayerStatusRow({
  name,
  label,
  isDone,
  isYou,
}: {
  name: string
  label: string
  isDone: boolean
  isYou: boolean
}) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${
      isDone ? 'border-primary/30 bg-primary/5' : 'border-border/50 bg-card/50'
    }`}>
      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
        isYou ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
      }`}>
        {name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {name}
          {isYou && <span className="ml-2 text-xs text-primary">(You)</span>}
        </p>
        <p className={`text-xs ${isDone ? 'text-primary' : 'text-muted-foreground'}`}>
          {label}
        </p>
      </div>
      <div>
        {isDone ? (
          <CheckCircle2 className="w-5 h-5 text-primary" />
        ) : (
          <Clock className="w-5 h-5 text-muted-foreground animate-pulse" />
        )}
      </div>
    </div>
  )
}
