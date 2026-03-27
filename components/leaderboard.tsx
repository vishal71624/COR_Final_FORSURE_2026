'use client'

import { useEffect, useState, useCallback } from 'react'
import { useGameStore, Player } from '@/lib/game-store'
import { getTeamLeaderboard, getLeaderboard } from '@/lib/supabase/db-actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Trophy,
  Medal,
  ArrowLeft,
  Crown,
  Zap,
  TrendingUp,
  Users,
  Star,
  Flame,
  RefreshCcw,
  Loader2,
  User,
  Building,
} from 'lucide-react'

interface TeamEntry {
  teamCode: string
  teamName: string
  player1Name: string
  player2Name: string | null
  player1Score: number
  player2Score: number
  avgScore: number
  round1Avg: number
  round2Avg: number
}

export function Leaderboard() {
  const { setView, currentPlayer, currentTeam, isAdmin, leaderboardInitialTab, leaderboardInitialSection } = useGameStore()
  const [teams, setTeams] = useState<TeamEntry[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [animate, setAnimate] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [section, setSection] = useState<'students' | 'teams'>(leaderboardInitialSection ?? 'teams')
  const [activeTab, setActiveTab] = useState<string>(leaderboardInitialTab ?? 'overall')

  const loadLeaderboardData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [teamData, playerData] = await Promise.all([
        getTeamLeaderboard(),
        getLeaderboard(),
      ])
      setTeams(teamData)
      setPlayers(playerData.filter(p => !p.isDisqualified))
    } catch (error) {
      console.error('Failed to load leaderboard:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { loadLeaderboardData() }, [loadLeaderboardData])
  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 100)
    return () => clearTimeout(timer)
  }, [teams, players])

  const myTeamCode = currentTeam?.code
  const currentTeamRank = teams.findIndex(e => e.teamCode === myTeamCode) + 1

  // Filtered + sorted player lists — only show players who completed the relevant round(s)
  const byOverall = [...players].filter(p => p.round1Completed && p.round2Completed).sort((a, b) => b.score - a.score)
  const byR1 = [...players].filter(p => p.round1Completed).sort((a, b) => b.round1Score - a.round1Score)
  const byR2 = [...players].filter(p => p.round2Completed).sort((a, b) => b.round2Score - a.round2Score)

  // Filtered + sorted team lists — only show teams who completed the relevant round(s)
  const teamsByOverall = [...teams].filter(t => t.bothCompleted).sort((a, b) => b.avgScore - a.avgScore)
  const teamsByR1 = [...teams].filter(t => t.round1Completed).sort((a, b) => b.round1Avg - a.round1Avg)
  const teamsByR2 = [...teams].filter(t => t.round2Completed).sort((a, b) => b.round2Avg - a.round2Avg)

  return (
    <div className="min-h-screen bg-background relative overflow-hidden z-50">
      <div className="absolute inset-0 bg-grid-violet [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black_35%,transparent_100%)] opacity-50" />
      <div className="absolute -top-32 left-1/4 w-[600px] h-[400px] bg-primary/18 rounded-full blur-[130px] animate-pulse" />
      <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="relative z-10">
        <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
            <Button
              variant="ghost"
              onClick={() => setView(isAdmin ? 'admin' : 'dashboard')}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {isAdmin ? 'Back to Admin' : 'Back to Dashboard'}
            </Button>
            <div className="flex items-center gap-2">
              <Trophy className="w-10 h-10 text-primary" />
              <h1 className="text-xl font-bold">Live Leaderboard</h1>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadLeaderboardData}
              disabled={isLoading}
              className="border-primary/50 text-primary"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
              <span className="ml-2">Refresh</span>
            </Button>
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
              Students
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
              Teams
            </button>
          </div>

          {/* STUDENTS */}
          {section === 'students' && (() => {
            const activeList = activeTab === 'round1' ? byR1 : activeTab === 'round2' ? byR2 : byOverall
            const activeScoreKey = activeTab === 'round1' ? 'round1Score' : activeTab === 'round2' ? 'round2Score' : 'score'
            const topScore = activeList[0]?.[activeScoreKey as keyof typeof activeList[0]] as number ?? 0
            const avgScore = activeList.length > 0
              ? Math.round(activeList.reduce((s, p) => s + (p[activeScoreKey as keyof typeof p] as number), 0) / activeList.length)
              : 0
            // Build teamCode → teamName lookup from the already-loaded teams list
            const teamNameMap: Record<string, string> = {}
            teams.forEach(t => { teamNameMap[t.teamCode] = t.teamName })
            return (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatCard icon={<User className="w-5 h-5" />} label="Total Students" value={activeList.length.toString()} color="text-primary" />
                <StatCard icon={<Zap className="w-5 h-5" />} label="Top Score" value={topScore.toString()} color="text-neon-green" />
                <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Average" value={avgScore.toString()} color="text-neon-orange" />
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4 bg-card/80 border border-border/50">
                  <TabsTrigger value="overall">Overall</TabsTrigger>
                  <TabsTrigger value="round1">Round 1</TabsTrigger>
                  <TabsTrigger value="round2">Round 2</TabsTrigger>
                </TabsList>
                <TabsContent value="overall">
                  <PlayerRankTable entries={byOverall} scoreKey="score" label="Overall" isLoading={isLoading} animate={animate} currentPlayerId={currentPlayer?.id} teamNameMap={teamNameMap} />
                </TabsContent>
                <TabsContent value="round1">
                  <PlayerRankTable entries={byR1} scoreKey="round1Score" label="Round 1" isLoading={isLoading} animate={animate} currentPlayerId={currentPlayer?.id} teamNameMap={teamNameMap} />
                </TabsContent>
                <TabsContent value="round2">
                  <PlayerRankTable entries={byR2} scoreKey="round2Score" label="Round 2" isLoading={isLoading} animate={animate} currentPlayerId={currentPlayer?.id} teamNameMap={teamNameMap} />
                </TabsContent>
              </Tabs>
            </>
            )
          })()}

          {/* TEAMS */}
          {section === 'teams' && (() => {
            const activeTeamList = activeTab === 'round1' ? teamsByR1 : activeTab === 'round2' ? teamsByR2 : teamsByOverall
            const activeTeamScoreKey = activeTab === 'round1' ? 'round1Avg' : activeTab === 'round2' ? 'round2Avg' : 'avgScore'
            const topTeamScore = activeTeamList[0]?.[activeTeamScoreKey as keyof typeof activeTeamList[0]] as number ?? 0
            const avgTeamScore = activeTeamList.length > 0
              ? Math.round(activeTeamList.reduce((s, t) => s + (t[activeTeamScoreKey as keyof typeof t] as number), 0) / activeTeamList.length)
              : 0
            const myActiveRank = activeTeamList.findIndex(t => t.teamCode === myTeamCode) + 1
            return (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={<Users className="w-5 h-5" />} label="Total Teams" value={activeTeamList.length.toString()} color="text-primary" />
                <StatCard icon={<Zap className="w-5 h-5" />} label="Top Avg" value={topTeamScore.toString()} color="text-neon-green" />
                <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Overall Avg" value={avgTeamScore.toString()} color="text-neon-orange" />
                {myTeamCode && myActiveRank > 0 && (
                  <StatCard icon={<Star className="w-5 h-5" />} label="Your Team Rank" value={`#${myActiveRank}`} color="text-accent" />
                )}
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4 bg-card/80 border border-border/50">
                  <TabsTrigger value="overall">Overall</TabsTrigger>
                  <TabsTrigger value="round1">Round 1</TabsTrigger>
                  <TabsTrigger value="round2">Round 2</TabsTrigger>
                </TabsList>
                <TabsContent value="overall">
                  <TeamRankTable entries={teamsByOverall} scoreKey="avgScore" label="Overall" isLoading={isLoading} animate={animate} myTeamCode={myTeamCode} isAdmin={isAdmin} />
                </TabsContent>
                <TabsContent value="round1">
                  <TeamRankTable entries={teamsByR1} scoreKey="round1Avg" label="Round 1" isLoading={isLoading} animate={animate} myTeamCode={myTeamCode} isAdmin={isAdmin} />
                </TabsContent>
                <TabsContent value="round2">
                  <TeamRankTable entries={teamsByR2} scoreKey="round2Avg" label="Round 2" isLoading={isLoading} animate={animate} myTeamCode={myTeamCode} isAdmin={isAdmin} />
                </TabsContent>
              </Tabs>
            </>
            )
          })()}
        </main>
      </div>
    </div>
  )
}

// ─── Player rank table ───────────────────────
function PlayerRankTable({ entries, scoreKey, label, isLoading, animate, currentPlayerId, teamNameMap }: {
  entries: Player[]
  scoreKey: keyof Player
  label: string
  isLoading: boolean
  animate: boolean
  currentPlayerId?: string
  teamNameMap?: Record<string, string>
}) {
  return (
    <Card className="border-border/50 bg-card/80 overflow-hidden gap-0 py-0">
      <CardHeader className="bg-primary/5 border-b border-border/50 flex items-center py-3 px-6">
        <CardTitle className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-primary" />
          {label} Rankings
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/50">
          {entries.map((player, index) => {
            const isMe = player.id === currentPlayerId
            const teamName = player.teamCode && teamNameMap ? teamNameMap[player.teamCode] : undefined
            const borderClass = index === 0 ? 'border-l-2 border-l-yellow-500 bg-yellow-500/5'
              : index === 1 ? 'border-l-2 border-l-gray-400 bg-gray-400/5'
              : index === 2 ? 'border-l-2 border-l-amber-700 bg-amber-700/5'
              : isMe ? 'bg-primary/10 border-l-2 border-l-primary'
              : 'hover:bg-muted/30'
            return (
              <div
                key={player.id}
                className={`flex items-center gap-4 p-4 transition-all duration-500 ${borderClass} ${animate ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
                style={{ transitionDelay: `${index * 40}ms` }}
              >
                <div className="w-8 flex items-center">
                  {index === 0 ? <Crown className="w-6 h-6 text-yellow-500" />
                    : index === 1 ? <Medal className="w-6 h-6 text-gray-400" />
                    : index === 2 ? <Medal className="w-6 h-6 text-amber-700" />
                    : <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>}
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                  index === 0 ? 'bg-yellow-500/20 text-yellow-500'
                    : index === 1 ? 'bg-gray-400/20 text-gray-400'
                    : index === 2 ? 'bg-amber-700/20 text-amber-700'
                    : 'bg-primary/20 text-primary'
                }`}>
                  {player.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold truncate">{player.name}</p>
                    {isMe && <Badge variant="outline" className="text-xs border-primary/50 text-primary">You</Badge>}
                    {teamName && (
                      <Badge variant="outline" className="text-xs border-accent/40 text-accent gap-1">
                        <Users className="w-2.5 h-2.5" />{teamName}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1"><Building className="w-3 h-3" />{player.college || '-'}</span>
                    <span>|</span>
                    <span>{player.department || '-'}</span>
                  </div>
                </div>
                {scoreKey === 'score' && (
                  <div className="hidden md:flex items-center gap-4 text-sm">
                    <div className="text-left">
                      <p className="text-xs text-muted-foreground">Round 1</p>
                      <p className="font-mono text-primary">{player.round1Score}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-muted-foreground">Round 2</p>
                      <p className="font-mono text-accent">{player.round2Score}</p>
                    </div>
                  </div>
                )}
                <div className="text-right shrink-0">
                  <p className={`text-xl font-bold ${
                    index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-amber-700' : 'text-foreground'
                  }`}>{player[scoreKey] as number}</p>
                  <p className="text-xs text-muted-foreground">
                    {scoreKey === 'score' ? 'total pts' : scoreKey === 'round1Score' ? 'R1 pts' : 'R2 pts'}
                  </p>
                </div>
              </div>
            )
          })}
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

// ─── Team rank table ─────────────────────────
function TeamRankTable({ entries, scoreKey, label, isLoading, animate, myTeamCode, isAdmin }: {
  entries: TeamEntry[]
  scoreKey: keyof TeamEntry
  label: string
  isLoading: boolean
  animate: boolean
  myTeamCode?: string
  isAdmin: boolean
}) {
  return (
    <Card className="border-border/50 bg-card/80 overflow-hidden gap-0 py-0">
      <CardHeader className="bg-primary/5 border-b border-border/50 flex items-center py-3 px-6">
        <CardTitle className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-primary" />
          {label} Team Rankings
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/50">
          {entries.map((entry, index) => {
            const isMyTeam = entry.teamCode === myTeamCode
            const borderClass = index === 0 ? 'border-l-2 border-l-yellow-500 bg-yellow-500/5'
              : index === 1 ? 'border-l-2 border-l-gray-400 bg-gray-400/5'
              : index === 2 ? 'border-l-2 border-l-amber-700 bg-amber-700/5'
              : isMyTeam ? 'bg-primary/10 border-l-2 border-l-primary'
              : 'hover:bg-muted/30'
            return (
              <div
                key={entry.teamCode}
                className={`flex items-center gap-4 p-4 transition-all duration-500 ${borderClass} ${animate ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
                style={{ transitionDelay: `${index * 40}ms` }}
              >
                <div className="w-8 flex items-center">
                  {index === 0 ? <Crown className="w-6 h-6 text-yellow-500" />
                    : index === 1 ? <Medal className="w-6 h-6 text-gray-400" />
                    : index === 2 ? <Medal className="w-6 h-6 text-amber-700" />
                    : <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>}
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                  index === 0 ? 'bg-yellow-500/20 text-yellow-500'
                    : index === 1 ? 'bg-gray-400/20 text-gray-400'
                    : index === 2 ? 'bg-amber-700/20 text-amber-700'
                    : 'bg-primary/20 text-primary'
                }`}>
                  {entry.teamName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-foreground truncate">{entry.teamName}</p>
                    {isMyTeam && <Badge variant="outline" className="text-xs border-primary/50 text-primary">Your Team</Badge>}
                    {isAdmin && <span className="text-xs text-muted-foreground font-mono">({entry.teamCode})</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {entry.player1Name}{entry.player2Name ? ` · ${entry.player2Name}` : ' (solo)'}
                  </p>
                </div>
                {scoreKey === 'avgScore' && (
                  <div className="hidden md:flex items-center gap-4 text-sm">
                    <div className="text-left">
                      <p className="text-xs text-muted-foreground">R1 Avg</p>
                      <p className="font-mono text-primary">{entry.round1Avg}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-muted-foreground">R2 Avg</p>
                      <p className="font-mono text-accent">{entry.round2Avg}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right shrink-0">
                    <p className={`text-xl font-bold ${
                      index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-amber-700' : 'text-foreground'
                    }`}>{entry[scoreKey] as number}</p>
                    <p className="text-xs text-muted-foreground">
                      {scoreKey === 'avgScore' ? 'avg pts' : scoreKey === 'round1Avg' ? 'R1 avg' : 'R2 avg'}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
          {isLoading && entries.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">
              <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
              <p>Loading leaderboard...</p>
            </div>
          )}
          {!isLoading && entries.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">
              <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No teams on the leaderboard yet</p>
              <p className="text-sm mt-1">Complete challenges to appear here</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <Card className="border-border/50 bg-card/80">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
          <div className={`${color} opacity-50`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}
