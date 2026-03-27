'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useGameStore } from '@/lib/game-store'
import { fetchTeamByCode, type Team } from '@/lib/supabase/db-actions'
import { Database, ArrowLeft, AlertCircle, Lock, Loader2, Users, ChevronRight } from 'lucide-react'

export function LoginPage() {
  const { setView, login } = useGameStore()
  const [step, setStep] = useState<'code' | 'name'>('code')
  const [teamCode, setTeamCode] = useState('')
  const [teamInfo, setTeamInfo] = useState<Team | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string>('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!teamCode.trim()) {
      setError('Please enter your team code')
      return
    }
    setIsLoading(true)
    try {
      const team = await fetchTeamByCode(teamCode.toUpperCase().trim())
      if (!team) {
        setError('Invalid team code. Please check and try again.')
        setIsLoading(false)
        return
      }
      setTeamInfo(team)
      setStep('name')
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!selectedSlot) {
      setError('Please select your name')
      return
    }
    if (!teamInfo) return
    setIsLoading(true)
    try {
      const slot = parseInt(selectedSlot) as 1 | 2
      const success = await login(teamInfo.code, slot)
      if (!success) {
        setError('Login failed. Please try again.')
        setIsLoading(false)
      }
    } catch {
      setError('Connection error. Please try again.')
      setIsLoading(false)
    }
  }

  const getAvailableSlots = () => {
    if (!teamInfo) return []
    const slots: { slot: 1 | 2; name: string; alreadyIn: boolean }[] = [
      { slot: 1, name: teamInfo.player1Name, alreadyIn: !!teamInfo.player1Joined },
    ]
    if (teamInfo.player2Name) {
      slots.push({ slot: 2, name: teamInfo.player2Name, alreadyIn: !!teamInfo.player2Joined })
    }
    return slots
  }

  const selectedSlotInfo = getAvailableSlots().find(s => String(s.slot) === selectedSlot)
  const isResume = selectedSlotInfo?.alreadyIn ?? false

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-violet [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black_40%,transparent_100%)]" />
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-primary/20 blur-[130px] animate-pulse" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-accent/12 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 w-full max-w-sm">
        <Button
          variant="ghost"
          className="mb-6 text-muted-foreground hover:text-foreground -ml-2"
          onClick={() => {
            if (step === 'name') {
              setStep('code')
              setTeamInfo(null)
              setSelectedSlot('')
              setError('')
            } else {
              setView('landing')
            }
          }}
          disabled={isLoading}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {step === 'name' ? 'Change Team Code' : 'Back'}
        </Button>

        <div className="flex items-center justify-center gap-3 mb-8">
          <Database className="w-9 h-9 text-primary" />
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground leading-tight">ITRIX 2026<br />COMMIT OR ROLLBACK</h1>
            <p className="text-xs text-muted-foreground">IST, CEG, Anna University</p>
          </div>
        </div>

        {step === 'code' ? (
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-xl shadow-black/20">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl text-foreground">Team Login</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Enter the team code provided by your admin</p>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleCodeSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2 text-foreground">
                    <Lock className="w-3.5 h-3.5 text-primary" />
                    Team Code
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. TEAM001"
                    value={teamCode}
                    onChange={(e) => {
                      setTeamCode(e.target.value)
                      if (error) setError('')
                    }}
                    className="font-mono uppercase bg-input border-border focus:border-primary text-center text-xl tracking-widest h-12 transition-colors"
                    autoComplete="off"
                    autoFocus
                    disabled={isLoading}
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2.5 rounded-lg border border-destructive/20">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-base font-semibold transition-all duration-200 shadow-md shadow-primary/20"
                  disabled={isLoading || !teamCode.trim()}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying…
                    </>
                  ) : (
                    <>
                      Continue
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-xl shadow-black/20">
            <CardHeader className="text-center pb-2">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Users className="w-5 h-5 text-primary" />
                <span className="text-sm font-semibold text-primary">{teamInfo?.name}</span>
              </div>
              <CardTitle className="text-xl text-foreground">Select Your Name</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Code: <span className="font-mono text-primary">{teamInfo?.code}</span>
              </p>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleNameSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2 text-foreground">
                    <Users className="w-3.5 h-3.5 text-primary" />
                    Who are you?
                  </label>
                  <Select
                    value={selectedSlot}
                    onValueChange={(val) => {
                      setSelectedSlot(val)
                      if (error) setError('')
                    }}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="h-12 text-base border-border focus:border-primary">
                      <SelectValue placeholder="Select your name" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableSlots().map(({ slot, name, alreadyIn }) => (
                        <SelectItem
                          key={slot}
                          value={String(slot)}
                        >
                          {name}
                          {alreadyIn && (
                            <span className="ml-1.5 text-xs text-neon-orange">(already in game)</span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isResume && (
                    <p className="text-xs text-neon-orange flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      This player has an active session — you'll resume from where you left off
                    </p>
                  )}
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2.5 rounded-lg border border-destructive/20">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-base font-semibold transition-all duration-200 shadow-md shadow-primary/20"
                  disabled={isLoading || !selectedSlot}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {isResume ? 'Resuming…' : 'Entering Challenge…'}
                    </>
                  ) : (
                    isResume ? 'Resume Session' : 'Enter Challenge'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
