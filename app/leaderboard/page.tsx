'use client'

import { useEffect, useState, useCallback } from 'react'
import { Player } from '@/lib/game-store'
import { getLeaderboard, getTeamLeaderboard } from '@/lib/supabase/db-actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Trophy,
  Medal,
  Crown,
  Zap,
  TrendingUp,
  Users,
  Flame,
  RefreshCcw,
  Loader2,
  Building,
  User,
} from 'lucide-react'

type TeamEntry = {
  teamCode: string
  teamName: string
  player1Name: string
  player2Name: string | null
  player1Score: number
  player2Score: number
  avgScore: number
  round1Avg: number
  round2Avg: number
  round1Completed: boolean
  round2Completed: boolean
  bothCompleted: boolean
}

export default function PublicLeaderboardPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [teams, setTeams] = useState<TeamEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [section, setSection] = useState<'students' | 'teams'>('students')

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [allPlayers, allTeams] = await Promise.all([
        getLeaderboard(),
        getTeamLeaderboard(),
      ])
      setPlayers(allPlayers.filter(p => !p.isDisqualified))
      setTeams(allTeams)
      setLastRefresh(new Date())
    } catch {
      // keep existing data on error
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(loadData, 10000)
    return () => clearInterval(interval)
  }, [autoRefresh, loadData])

  // Filtered + sorted player lists — only show players who completed the relevant round(s)
  const byOverall = [...players].filter(p => p.round1Completed && p.round2Completed).sort((a, b) => b.score - a.score)
  const byR1 = [...players].filter(p => p.round1Completed).sort((a, b) => b.round1Score - a.round1Score)
  const byR2 = [...players].filter(p => p.round2Completed).sort((a, b) => b.round2Score - a.round2Score)

  // Filtered + sorted team lists — only show teams who completed the relevant round(s)
  const teamsByOverall = [...teams].filter(t => t.bothCompleted).sort((a, b) => b.avgScore - a.avgScore)
  const teamsByR1 = [...teams].filter(t => t.round1Completed).sort((a, b) => b.round1Avg - a.round1Avg)
  const teamsByR2 = [...teams].filter(t => t.round2Completed).sort((a, b) => b.round2Avg - a.round2Avg)

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.06)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black_40%,transparent_100%)]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 rounded-full blur-[150px]" />

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-base font-bold">Live Leaderboard</h1>
                <p className="text-xs text-muted-foreground leading-tight">ITRIX 2026 · COMMIT OR ROLLBACK</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={autoRefresh ? 'border-neon-green/50 text-neon-green' : 'border-muted-foreground/30 text-muted-foreground'}
              >
                {autoRefresh ? 'Auto-Refresh ON' : 'Auto-Refresh OFF'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                disabled={isLoading}
                className="border-primary/50 text-primary"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                <span className="ml-2">Refresh</span>
              </Button>
              {lastRefresh && (
                <span className="text-xs text-muted-foreground">Last: {lastRefresh.toLocaleTimeString()}</span>
              )}
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">

          {/* Section toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setSection('students')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all border ${
                section === 'students'
                  ? 'bg-primary/10 border-primary text-primary shadow-sm shadow-primary/20'
                  : 'border-border/50 text-muted-foreground hover:border-primary/40 hover:text-foreground'
              }`}
            >
              <User className="w-4 h-4" />
              Students Leaderboard
            </button>
            <button
              onClick={() => setSection('teams')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all border ${
                section === 'teams'
                  ? 'bg-primary/10 border-primary text-primary shadow-sm shadow-primary/20'
                  : 'border-border/50 text-muted-foreground hover:border-primary/40 hover:text-foreground'
              }`}
            >
              <Users className="w-4 h-4" />
              Team Leaderboard
            </button>
          </div>

          {/* ── STUDENTS ── */}
          {section === 'students' && (
            <StudentsSection
              byOverall={byOverall}
              byR1={byR1}
              byR2={byR2}
              isLoading={isLoading}
              autoRefresh={autoRefresh}
            />
          )}

          {/* ── TEAMS ── */}
          {section === 'teams' && (
            <TeamsSection
              byOverall={teamsByOverall}
              byR1={teamsByR1}
              byR2={teamsByR2}
              isLoading={isLoading}
              autoRefresh={autoRefresh}
            />
          )}
        </main>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// STUDENTS SECTION
// ─────────────────────────────────────────────
function StudentsSection({
  byOverall, byR1, byR2, isLoading, autoRefresh
}: {
  byOverall: Player[]
  byR1: Player[]
  byR2: Player[]
  isLoading: boolean
  autoRefresh: boolean
}) {
  const totalPlayers = byOverall.length
  const topScore = byOverall[0]?.score ?? 0
  const avgScore = Math.round(byOverall.reduce((s, p) => s + p.score, 0) / (totalPlayers || 1))

  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={<Users className="w-5 h-5" />} label="Total Students" value={totalPlayers.toString()} color="text-primary" />
        <StatCard icon={<Zap className="w-5 h-5" />} label="Top Score" value={topScore.toString()} color="text-neon-green" />
        <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Average Score" value={avgScore.toString()} color="text-neon-orange" />
      </div>

      <Tabs defaultValue="overall">
        <TabsList className="mb-4 bg-card/80 border border-border/50">
          <TabsTrigger value="overall">Overall</TabsTrigger>
          <TabsTrigger value="round1">Round 1</TabsTrigger>
          <TabsTrigger value="round2">Round 2</TabsTrigger>
        </TabsList>

        <TabsContent value="overall">
          <PlayerPodium entries={byOverall} scoreKey="score" />
          <PlayerTable entries={byOverall} scoreKey="score" label="Overall" isLoading={isLoading} autoRefresh={autoRefresh} />
        </TabsContent>
        <TabsContent value="round1">
          <PlayerPodium entries={byR1} scoreKey="round1Score" />
          <PlayerTable entries={byR1} scoreKey="round1Score" label="Round 1" isLoading={isLoading} autoRefresh={false} />
        </TabsContent>
        <TabsContent value="round2">
          <PlayerPodium entries={byR2} scoreKey="round2Score" />
          <PlayerTable entries={byR2} scoreKey="round2Score" label="Round 2" isLoading={isLoading} autoRefresh={false} />
        </TabsContent>
      </Tabs>
    </>
  )
}

function PlayerPodium({ entries, scoreKey }: { entries: Player[]; scoreKey: keyof Player }) {
  const [animate, setAnimate] = useState(false)
  useEffect(() => {
    setAnimate(false)
    const t = setTimeout(() => setAnimate(true), 80)
    return () => clearTimeout(t)
  }, [entries])

  if (entries.length < 3) return null

  return (
    <div className="flex items-end justify-center gap-6 mb-8">
      {/* 2nd */}
      <PodiumBlock entry={entries[1]} score={entries[1][scoreKey] as number} place={2} animate={animate} delay={200} height="h-28" color="text-gray-400" bg="from-gray-500/20 to-gray-400/10" border="border-gray-500/30" icon={<Medal className="w-10 h-10 mx-auto text-gray-400" />} />
      {/* 1st */}
      <PodiumBlock entry={entries[0]} score={entries[0][scoreKey] as number} place={1} animate={animate} delay={0} height="h-36" color="text-yellow-500" bg="from-yellow-500/20 to-yellow-400/10" border="border-yellow-500/30" icon={<Crown className="w-12 h-12 mx-auto text-yellow-500 animate-pulse" />} />
      {/* 3rd */}
      <PodiumBlock entry={entries[2]} score={entries[2][scoreKey] as number} place={3} animate={animate} delay={400} height="h-24" color="text-amber-700" bg="from-amber-700/20 to-amber-600/10" border="border-amber-700/30" icon={<Medal className="w-10 h-10 mx-auto text-amber-700" />} />
    </div>
  )
}

function PodiumBlock({ entry, score, place, animate, delay, height, color, bg, border, icon }: {
  entry: Player; score: number; place: number
  animate: boolean; delay: number
  height: string; color: string; bg: string; border: string
  icon: React.ReactNode
}) {
  return (
    <div className={`w-44 transition-all duration-700 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: `${delay}ms` }}>
      <div className="text-center mb-3">
        {icon}
        <p className={`font-semibold text-lg mt-2 truncate ${place === 1 ? 'text-xl font-bold' : ''}`}>{entry.name}</p>
        <p className="text-xs text-muted-foreground">{entry.college || '-'}</p>
      </div>
      <div className={`${height} bg-gradient-to-t ${bg} rounded-t-lg border ${border} flex items-center justify-center relative overflow-hidden`}>
        {place === 1 && <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(234,179,8,0.3),transparent_70%)]" />}
        <span className={`${place === 1 ? 'text-4xl' : 'text-3xl'} font-bold ${color} relative z-10`}>{score}</span>
      </div>
    </div>
  )
}

function PlayerTable({ entries, scoreKey, label, isLoading, autoRefresh }: {
  entries: Player[]
  scoreKey: keyof Player
  label: string
  isLoading: boolean
  autoRefresh: boolean
}) {
  return (
    <Card className="border-border/50 bg-card/80 overflow-hidden gap-0 py-0">
      <CardHeader className="bg-primary/5 border-b border-border/50 flex items-center py-3 px-6">
        <CardTitle className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-primary" />
          {label} Rankings
          {autoRefresh && (
            <span className="ml-auto text-sm font-normal text-neon-green flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
              Auto-refreshing every 10s
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/50">
          {entries.map((player, index) => (
            <div
              key={player.id}
              className={`flex items-center gap-4 p-4 transition-all ${
                index === 0 ? 'border-l-2 border-l-yellow-500 bg-yellow-500/5'
                  : index === 1 ? 'border-l-2 border-l-gray-400 bg-gray-400/5'
                  : index === 2 ? 'border-l-2 border-l-amber-700 bg-amber-700/5'
                  : 'hover:bg-muted/30'
              }`}
            >
              <div className="w-8 flex items-center">
                {index === 0 ? <Crown className="w-6 h-6 text-yellow-500" />
                  : index === 1 ? <Medal className="w-6 h-6 text-gray-400" />
                  : index === 2 ? <Medal className="w-6 h-6 text-amber-700" />
                  : <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>}
              </div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                index === 0 ? 'bg-yellow-500/20 text-yellow-500'
                  : index === 1 ? 'bg-gray-400/20 text-gray-400'
                  : index === 2 ? 'bg-amber-700/20 text-amber-700'
                  : 'bg-primary/20 text-primary'
              }`}>
                {player.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{player.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-1"><Building className="w-3 h-3" />{player.college || '-'}</span>
                  <span>|</span>
                  <span>{player.department || '-'}</span>
                  <span>|</span>
                  <span>{player.yearOfStudy || '-'}</span>
                </div>
              </div>
              {scoreKey === 'score' && (
                <div className="hidden md:flex items-center gap-6 text-sm">
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground">Round 1</p>
                    <p className="font-mono text-lg text-primary">{player.round1Score}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground">Round 2</p>
                    <p className="font-mono text-lg text-accent">{player.round2Score}</p>
                  </div>
                </div>
              )}
              <div className="text-left min-w-[60px]">
                <p className={`text-2xl font-bold ${
                  index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-amber-700' : 'text-foreground'
                }`}>{player[scoreKey] as number}</p>
                <p className="text-xs text-muted-foreground">
                  {scoreKey === 'score' ? 'total pts' : scoreKey === 'round1Score' ? 'R1 pts' : 'R2 pts'}
                </p>
              </div>
            </div>
          ))}

          {isLoading && entries.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">
              <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
              <p>Loading leaderboard...</p>
            </div>
          )}
          {!isLoading && entries.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">
              <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No students on the leaderboard yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ─────────────────────────────────────────────
// TEAMS SECTION
// ─────────────────────────────────────────────
function TeamsSection({
  byOverall, byR1, byR2, isLoading, autoRefresh
}: {
  byOverall: TeamEntry[]
  byR1: TeamEntry[]
  byR2: TeamEntry[]
  isLoading: boolean
  autoRefresh: boolean
}) {
  const totalTeams = byOverall.length
  const topAvg = byOverall[0]?.avgScore ?? 0
  const globalAvg = Math.round(byOverall.reduce((s, t) => s + t.avgScore, 0) / (totalTeams || 1))

  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={<Users className="w-5 h-5" />} label="Total Teams" value={totalTeams.toString()} color="text-primary" />
        <StatCard icon={<Zap className="w-5 h-5" />} label="Top Avg Score" value={topAvg.toString()} color="text-neon-green" />
        <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Overall Avg" value={globalAvg.toString()} color="text-neon-orange" />
      </div>

      <Tabs defaultValue="overall">
        <TabsList className="mb-4 bg-card/80 border border-border/50">
          <TabsTrigger value="overall">Overall</TabsTrigger>
          <TabsTrigger value="round1">Round 1</TabsTrigger>
          <TabsTrigger value="round2">Round 2</TabsTrigger>
        </TabsList>

        <TabsContent value="overall">
          <TeamPodium entries={byOverall} scoreKey="avgScore" />
          <TeamTable entries={byOverall} scoreKey="avgScore" label="Overall" isLoading={isLoading} autoRefresh={autoRefresh} />
        </TabsContent>
        <TabsContent value="round1">
          <TeamPodium entries={byR1} scoreKey="round1Avg" />
          <TeamTable entries={byR1} scoreKey="round1Avg" label="Round 1" isLoading={isLoading} autoRefresh={false} />
        </TabsContent>
        <TabsContent value="round2">
          <TeamPodium entries={byR2} scoreKey="round2Avg" />
          <TeamTable entries={byR2} scoreKey="round2Avg" label="Round 2" isLoading={isLoading} autoRefresh={false} />
        </TabsContent>
      </Tabs>
    </>
  )
}

function TeamPodium({ entries, scoreKey }: { entries: TeamEntry[]; scoreKey: keyof TeamEntry }) {
  const [animate, setAnimate] = useState(false)
  useEffect(() => {
    setAnimate(false)
    const t = setTimeout(() => setAnimate(true), 80)
    return () => clearTimeout(t)
  }, [entries])

  if (entries.length < 3) return null

  const podiumConfig = [
    { entry: entries[1], place: 2, delay: 200, height: 'h-28', color: 'text-gray-400', bg: 'from-gray-500/20 to-gray-400/10', border: 'border-gray-500/30', icon: <Medal className="w-10 h-10 mx-auto text-gray-400" /> },
    { entry: entries[0], place: 1, delay: 0, height: 'h-36', color: 'text-yellow-500', bg: 'from-yellow-500/20 to-yellow-400/10', border: 'border-yellow-500/30', icon: <Crown className="w-12 h-12 mx-auto text-yellow-500 animate-pulse" /> },
    { entry: entries[2], place: 3, delay: 400, height: 'h-24', color: 'text-amber-700', bg: 'from-amber-700/20 to-amber-600/10', border: 'border-amber-700/30', icon: <Medal className="w-10 h-10 mx-auto text-amber-700" /> },
  ]

  return (
    <div className="flex items-end justify-center gap-6 mb-8">
      {podiumConfig.map(({ entry, place, delay, height, color, bg, border, icon }) => (
        <div key={entry.teamCode} className={`w-44 transition-all duration-700 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: `${delay}ms` }}>
          <div className="text-center mb-3">
            {icon}
            <p className={`font-semibold mt-2 truncate ${place === 1 ? 'text-xl font-bold' : 'text-lg'}`}>{entry.teamName}</p>
            <p className="text-xs text-muted-foreground truncate">{entry.player1Name}{entry.player2Name ? ` & ${entry.player2Name}` : ''}</p>
          </div>
          <div className={`${height} bg-gradient-to-t ${bg} rounded-t-lg border ${border} flex flex-col items-center justify-center relative overflow-hidden gap-0.5`}>
            {place === 1 && <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(234,179,8,0.3),transparent_70%)]" />}
            <span className={`${place === 1 ? 'text-4xl' : 'text-3xl'} font-bold ${color} relative z-10`}>{entry[scoreKey] as number}</span>
            <span className="text-xs text-muted-foreground relative z-10">avg pts</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function TeamTable({ entries, scoreKey, label, isLoading, autoRefresh }: {
  entries: TeamEntry[]
  scoreKey: keyof TeamEntry
  label: string
  isLoading: boolean
  autoRefresh: boolean
}) {
  return (
    <Card className="border-border/50 bg-card/80 overflow-hidden gap-0 py-0">
      <CardHeader className="bg-primary/5 border-b border-border/50 flex items-center py-3 px-6">
        <CardTitle className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-primary" />
          {label} Team Rankings
          {autoRefresh && (
            <span className="ml-auto text-sm font-normal text-neon-green flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
              Auto-refreshing every 10s
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/50">
          {entries.map((team, index) => (
            <div
              key={team.teamCode}
              className={`flex items-center gap-4 p-4 transition-all ${
                index === 0 ? 'border-l-2 border-l-yellow-500 bg-yellow-500/5'
                  : index === 1 ? 'border-l-2 border-l-gray-400 bg-gray-400/5'
                  : index === 2 ? 'border-l-2 border-l-amber-700 bg-amber-700/5'
                  : 'hover:bg-muted/30'
              }`}
            >
              {/* Rank */}
              <div className="w-8 flex items-center">
                {index === 0 ? <Crown className="w-6 h-6 text-yellow-500" />
                  : index === 1 ? <Medal className="w-6 h-6 text-gray-400" />
                  : index === 2 ? <Medal className="w-6 h-6 text-amber-700" />
                  : <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>}
              </div>

              {/* Avatar */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                index === 0 ? 'bg-yellow-500/20 text-yellow-500'
                  : index === 1 ? 'bg-gray-400/20 text-gray-400'
                  : index === 2 ? 'bg-amber-700/20 text-amber-700'
                  : 'bg-primary/20 text-primary'
              }`}>
                {team.teamName.charAt(0)}
              </div>

              {/* Team Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{team.teamName}</p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                  <Users className="w-3 h-3" />
                  <span>{team.player1Name}{team.player2Name ? ` & ${team.player2Name}` : ' (Solo)'}</span>
                </div>
              </div>

              {/* R1 / R2 avgs — only in Overall */}
              {scoreKey === 'avgScore' && (
                <div className="hidden md:flex items-center gap-6 text-sm">
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground">R1 Avg</p>
                    <p className="font-mono text-lg text-primary">{team.round1Avg}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground">R2 Avg</p>
                    <p className="font-mono text-lg text-accent">{team.round2Avg}</p>
                  </div>
                </div>
              )}

              {/* Player scores + Score */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-left min-w-[60px]">
                  <p className={`text-2xl font-bold ${
                    index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-amber-700' : 'text-foreground'
                  }`}>{team[scoreKey] as number}</p>
                  <p className="text-xs text-muted-foreground">
                    {scoreKey === 'avgScore' ? 'avg pts' : scoreKey === 'round1Avg' ? 'R1 avg' : 'R2 avg'}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {isLoading && entries.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">
              <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
              <p>Loading team leaderboard...</p>
            </div>
          )}
          {!isLoading && entries.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">
              <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No teams on the leaderboard yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ─────────────────────────────────────────────
// SHARED
// ─────────────────────────────────────────────
function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <Card className="border-border/50 bg-card/80">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
          </div>
          <div className={`${color} opacity-50`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}
