import { create } from 'zustand'
import {
  fetchAllPlayers,
  fetchPlayerById,
  createPlayer as dbCreatePlayer,
  updatePlayer as dbUpdatePlayer,
  deletePlayer as dbDeletePlayer,
  enableRound2ForPlayer,
  disableRound2ForPlayer,
  resetAllPlayers,
  getLeaderboard as dbGetLeaderboard,
  updatePlayerCheckpoints as dbUpdatePlayerCheckpoints,
  // Question management
  fetchRound1Questions,
  createRound1Question as dbCreateRound1Question,
  updateRound1Question as dbUpdateRound1Question,
  deleteRound1Question as dbDeleteRound1Question,
  // Challenge management
  fetchRound2Challenges,
  createRound2Challenge as dbCreateRound2Challenge,
  updateRound2Challenge as dbUpdateRound2Challenge,
  deleteRound2Challenge as dbDeleteRound2Challenge,
  // Team management
  fetchTeamByCode,
  fetchAllTeams,
  createTeam as dbCreateTeam,
  deleteTeam as dbDeleteTeam,
  updateTeamJoined,
  fetchTeamStatus,
  type Team,
} from './supabase/db-actions'
export type { Team }

// Fisher-Yates shuffle algorithm for randomizing arrays
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Shuffle questions within each difficulty group (easy, medium, hard) then combine
function shuffleByDifficulty<T extends { difficulty: string }>(items: T[]): T[] {
  const easy = items.filter(q => q.difficulty === 'easy')
  const medium = items.filter(q => q.difficulty === 'medium')
  const hard = items.filter(q => q.difficulty === 'hard')
  
  return [
    ...shuffleArray(easy),
    ...shuffleArray(medium),
    ...shuffleArray(hard)
  ]
}

// Select a limited random subset per difficulty, then combine easy → medium → hard
function selectByDifficulty<T extends { difficulty: string }>(
  items: T[],
  limits: { easy: number; medium: number; hard: number }
): T[] {
  const easy = shuffleArray(items.filter(q => q.difficulty === 'easy')).slice(0, limits.easy)
  const medium = shuffleArray(items.filter(q => q.difficulty === 'medium')).slice(0, limits.medium)
  const hard = shuffleArray(items.filter(q => q.difficulty === 'hard')).slice(0, limits.hard)
  return [...easy, ...medium, ...hard]
}


export type Difficulty = 'easy' | 'medium' | 'hard'
export type Round = 1 | 2
export type GameView = 'landing' | 'login' | 'terms' | 'dashboard' | 'round1' | 'round2' | 'leaderboard' | 'admin' | 'waiting'

export interface Question {
  id: number
  type: 'mcq' | 'query' | 'scenario'
  difficulty: Difficulty
  question: string
  scenario?: string
  options: string[]
  correctAnswer: number
  points: number
}

export interface TableColumn {
  name: string
  type: string
  isPrimaryKey?: boolean
  isForeignKey?: boolean
}

export interface TableData {
  tableName: string
  columns: TableColumn[]
  rows: (string | number | null)[][]
}

export interface TestCase {
  id: number
  name: string
  description?: string
  tableData: TableData[]
  expectedOutput: (string | number | null)[][]
  expectedColumns: string[]
  isHidden: boolean
  points: number
}

export interface TestCaseResult {
  testCaseId: number
  passed: boolean
  actualOutput: (string | number | null)[][] | null
  error?: string
}

export interface SQLChallenge {
  id: number
  difficulty: Difficulty
  title: string
  description: string
  scenario: string
  schema: string
  baseTableData: TableData[] // Base table shown to user
  testCases: TestCase[]
  expectedKeywords: string[]
  totalPoints: number
  timeLimit: number
  correctQuery?: string // The correct SQL query to generate expected output
}

export interface Player {
  id: string
  name: string
  score: number
  round1Score: number
  round2Score: number
  round1Completed: boolean
  round2Enabled: boolean
  round2Completed: boolean
  tabSwitchCount: number
  fullScrnExitCount: number
  tabSwitchCount2: number
  fullScrnExitCount2: number
  windowButtonCount: number
  windowButtonCount2: number
  isDisqualified: boolean
  round1Answers: Record<number, number>
  startTime?: number
  startTime2?: number
  r1Checkpoints?: object | null
  r2Checkpoints?: object | null
  // Student details
  college?: string
  department?: string
  yearOfStudy?: string
  contactNumber?: string
  email?: string
  teamCode?: string
  playerSlot?: number
}

export interface LeaderboardEntry {
  rank: number
  player: Player
  totalScore: number
}

interface SubmissionResult {
  testResults: TestCaseResult[]
  totalPassed: number
  totalTests: number
  pointsEarned: number
  allPassed: boolean
}

interface GameState {
  currentView: GameView
  isFullscreen: boolean
  currentPlayer: Player | null
  players: Player[]
  currentRound: Round
  currentQuestionIndex: number
  timeRemaining: number
  isTimerRunning: boolean
  tabSwitchCount: number
  fullScrnExitCount: number
  tabSwitchCount2: number
  fullScrnExitCount2: number
  windowButtonCount: number
  windowButtonCount2: number
  maxViolations: number
  isProctoring: boolean
  violations: string[]
  pendingView: 'dashboard' | 'waiting' | null
  round1Questions: Question[]
  round2Challenges: SQLChallenge[]
  isAdmin: boolean
  adminPassword: string
  currentTeam: Team | null
  waitingMode: 'pre-game' | 'post-r1' | 'pre-r2' | 'post-r2' | null
  teams: Team[]
  leaderboardInitialTab: 'overall' | 'round1' | 'round2'
  leaderboardInitialSection: 'students' | 'teams'

  setView: (view: GameView) => void
  setWaitingMode: (mode: 'pre-game' | 'post-r1' | 'pre-r2' | 'post-r2' | null) => void
  setLeaderboardInitialTab: (tab: 'overall' | 'round1' | 'round2') => void
  setLeaderboardInitialSection: (section: 'students' | 'teams') => void
  login: (teamCode: string, slot: 1 | 2) => Promise<boolean>
  adminLogin: (password: string) => boolean
  restoreSession: () => Promise<boolean>
  saveR1Checkpoint: () => void
  clearR1Checkpoint: () => void
  saveR2Checkpoint: (editorCode: Record<number, string>) => void
  clearR2Checkpoint: () => void
  logout: () => void
  startRound1: () => Promise<void>
  startRound2: () => Promise<void>
  saveAnswer: (questionId: number, answer: number) => void
  submitRound1: () => Promise<void>
  submitRound2Answer: (code: string) => SubmissionResult
  runTestCases: (code: string) => TestCaseResult[]
  nextChallenge: () => void
  finishRound2: () => Promise<void>
  goToQuestion: (index: number) => void
  recordTabSwitch1: () => boolean
  recordFullscreenExit1: () => boolean
  recordTabSwitch2: () => boolean
  recordFullscreenExit2: () => boolean
  recordWindowButton1: () => boolean
  recordWindowButton2: () => boolean
  acceptTerms: () => void
  setFullscreen: (isFullscreen: boolean) => void
  updateTimer: (time: number) => void
  addViolation: (violation: string) => void
  updateLeaderboard: () => LeaderboardEntry[]
  addPlayer: (code: string, studentDetails?: { name?: string; college?: string; department?: string; yearOfStudy?: string; contactNumber?: string; email?: string; teamCode?: string; playerSlot?: 1 | 2 }) => void
  removePlayer: (id: string) => void
  enableRound2: (playerId: string) => void
  disableRound2: (playerId: string) => void
  updatePlayerDetails: (id: string, details: { name?: string; college?: string; department?: string; yearOfStudy?: string; contactNumber?: string; email?: string }) => Promise<void>
  resetGame: () => void
  loadPlayers: () => Promise<void>
  syncPlayerToDb: (player: Player) => Promise<void>
  loadTeams: () => Promise<void>
  addTeam: (team: { code: string; name: string; player1Name: string; player2Name?: string }) => Promise<void>
  removeTeam: (code: string) => Promise<void>  
  enableRound2ForTeam: (teamCode: string) => void
  disableRound2ForTeam: (teamCode: string) => void
  // Question management
  loadRound1Questions: () => Promise<void>
  addRound1Question: (question: Omit<Question, 'id'>) => Promise<void>
  updateRound1Question: (id: number, question: Partial<Question>) => Promise<void>
  deleteRound1Question: (id: number) => Promise<void>
  // Round 2 table and challenge management
  loadRound2Challenges: () => Promise<void>
  updateRound2Tables: (tables: TableData[]) => void
  addRound2Challenge: (challenge: Omit<SQLChallenge, 'id'>) => Promise<void>
  updateRound2Challenge: (id: number, challenge: Partial<SQLChallenge>) => Promise<void>
  deleteRound2Challenge: (id: number) => Promise<void>
}


const createInitialPlayer = (id: string): Player => ({
  id,
  name: id,
  score: 0,
  round1Score: 0,
  round2Score: 0,
  round1Completed: false,
  round2Enabled: false,
  round2Completed: false,
  tabSwitchCount: 0,
  fullScrnExitCount: 0,
  tabSwitchCount2: 0,
  fullScrnExitCount2: 0,
  windowButtonCount: 0,
  windowButtonCount2: 0,
  isDisqualified: false,
  round1Answers: {}
})

export const useGameStore = create<GameState>((set, get) => ({
  currentView: 'landing',
  isFullscreen: false,
  currentPlayer: null,
  players: [],
  currentRound: 1,
  currentQuestionIndex: 0,
  timeRemaining: 0,
  isTimerRunning: false,
  tabSwitchCount: 0,
  fullScrnExitCount: 0,
  tabSwitchCount2: 0,
  fullScrnExitCount2: 0,
  windowButtonCount: 0,
  windowButtonCount2: 0,
  maxViolations: 2,
  isProctoring: false,
  violations: [],
  pendingView: null,
  round1Questions: [],
  round2Challenges: [],
  isAdmin: false,
  adminPassword: 'ITRIX2026ADMIN',
  currentTeam: null,
  waitingMode: null,
  teams: [],
  leaderboardInitialTab: 'overall',
  leaderboardInitialSection: 'teams',

  setView: (view) => set({ currentView: view }),
  setWaitingMode: (mode) => set({ waitingMode: mode }),
  setLeaderboardInitialTab: (tab) => set({ leaderboardInitialTab: tab }),
  setLeaderboardInitialSection: (section) => set({ leaderboardInitialSection: section }),

  login: async (teamCode, slot) => {
    const code = teamCode.toUpperCase().trim()
    
    // Verify team exists
    const team = await fetchTeamByCode(code)
    if (!team) return false

    // Player ID based on slot
    const playerId = `${code}_${slot}`
    
    // Fetch or create the player record
    let player = await fetchPlayerById(playerId)
    if (!player) {
      const playerName = slot === 1 ? team.player1Name : (team.player2Name || team.player1Name)
      player = await dbCreatePlayer(playerId, { name: playerName })
      if (!player) return false
      player = { ...player, teamCode: code, playerSlot: slot }
    }

    // Mark as joined in teams table
    await updateTeamJoined(code, slot, true)
    const updatedTeam = { ...team, [slot === 1 ? 'player1Joined' : 'player2Joined']: true }

    // Check if partner has joined (for pre-game waiting)
    const isSolo = !team.player2Name
    const partnerJoined = slot === 1 ? team.player2Joined : team.player1Joined
    const needsWaiting = !isSolo && !partnerJoined

    set(s => ({
      currentPlayer: player,
      currentTeam: updatedTeam,
      players: s.players.some(p => p.id === player!.id)
        ? s.players.map(p => p.id === player!.id ? player! : p)
        : [...s.players, player!],
      currentView: 'terms',
      pendingView: needsWaiting ? 'waiting' : 'dashboard',
      waitingMode: needsWaiting ? 'pre-game' : null,
      isProctoring: true,
      // Sync violation counters from DB so the UI reflects real values
      tabSwitchCount: player!.tabSwitchCount,
      fullScrnExitCount: player!.fullScrnExitCount,
      tabSwitchCount2: player!.tabSwitchCount2,
      fullScrnExitCount2: player!.fullScrnExitCount2,
      windowButtonCount: player!.windowButtonCount ?? 0,
      windowButtonCount2: player!.windowButtonCount2 ?? 0,
    }))
    if (typeof window !== 'undefined') {
      localStorage.setItem('itrix_player_code', playerId)
      localStorage.setItem('itrix_team_code', code)
      localStorage.setItem('itrix_player_slot', String(slot))
      localStorage.removeItem('itrix_admin_session')
    }
    return true
  },

  adminLogin: (password) => {
    if (password === get().adminPassword) {
      set({ isAdmin: true, currentView: 'admin' })
      if (typeof window !== 'undefined') {
        localStorage.setItem('itrix_admin_session', 'true')
        localStorage.removeItem('itrix_player_code')
      }
      return true
    }
    return false
  },

  restoreSession: async () => {
    if (typeof window === 'undefined') return false
    const playerCode = localStorage.getItem('itrix_player_code')
    const adminSession = localStorage.getItem('itrix_admin_session')

    if (adminSession === 'true') {
      set({ isAdmin: true, currentView: 'admin' })
      return true
    }

    if (playerCode) {
      const teamCode = localStorage.getItem('itrix_team_code')
      const teamSlot = parseInt(localStorage.getItem('itrix_player_slot') || '1') as 1 | 2
      const player = await fetchPlayerById(playerCode)
      if (player) {
        const state = get()

        // Read checkpoints directly from the DB player record
        const r1Cp = (player.r1Checkpoints || null) as { questionIndex: number; timeRemaining: number; questionIds: number[] } | null
        const r2Cp = (player.r2Checkpoints || null) as { challengeIndex: number; timeRemaining: number; challengeIds: number[]; editorCode?: Record<string, string> } | null

        let restoredView: GameView = 'dashboard'
        let restoredIndex = 0
        let restoredTime = 0
        let restoredR1Questions = state.round1Questions
        let restoredR2Challenges = state.round2Challenges

        if (!player.round1Completed && r1Cp) {
          // Reorder questions to match the saved shuffle
          const idMap = new Map(state.round1Questions.map(q => [q.id, q]))
          const ordered = r1Cp.questionIds.map(id => idMap.get(id)).filter(Boolean) as typeof state.round1Questions
          if (ordered.length > 0) {
            restoredView = 'round1'
            restoredIndex = Math.min(r1Cp.questionIndex, ordered.length - 1)
            restoredTime = r1Cp.timeRemaining
            restoredR1Questions = ordered
          }
        } else if (player.round2Enabled && !player.round2Completed && r2Cp) {
          // Reorder challenges to match the saved shuffle
          const idMap = new Map(state.round2Challenges.map(c => [c.id, c]))
          const ordered = r2Cp.challengeIds.map(id => idMap.get(id)).filter(Boolean) as typeof state.round2Challenges
          if (ordered.length > 0) {
            restoredView = 'round2'
            restoredIndex = Math.min(r2Cp.challengeIndex, ordered.length - 1)
            restoredTime = r2Cp.timeRemaining
            restoredR2Challenges = ordered
          }
        }

        // Restore team if available
        let restoredTeam = null
        if (teamCode) {
          restoredTeam = await fetchTeamByCode(teamCode)
        }

        // Determine the correct waiting mode based on live DB state (handles refresh/navigation)
        let restoredWaitingMode: 'pre-game' | 'post-r1' | 'pre-r2' | 'post-r2' | null = null
        if (restoredView === 'dashboard' && restoredTeam && teamCode) {
          const isSolo = !restoredTeam.player2Name
          if (!isSolo) {
            const partnerSlot = teamSlot === 1 ? 2 : 1
            const status = await fetchTeamStatus(teamCode)
            const partnerJoined = partnerSlot === 1 ? status.team?.player1Joined : status.team?.player2Joined
            const partnerData = partnerSlot === 1 ? status.player1 : status.player2

            const eitherDisqualified = player.isDisqualified || (partnerData?.isDisqualified ?? false)
            if (eitherDisqualified) {
              // If either player is disqualified, skip waiting rooms entirely
            } else if (!player.round1Completed && !partnerJoined) {
              // Partner hasn't entered the lobby yet
              restoredView = 'waiting'
              restoredWaitingMode = 'pre-game'
            } else if (player.round1Completed && !partnerData?.round1Completed && !partnerData?.isDisqualified) {
              // I finished R1 but partner hasn't yet (and isn't disqualified)
              restoredView = 'waiting'
              restoredWaitingMode = 'post-r1'
            } else if (player.round1Completed && (partnerData?.round1Completed || partnerData?.isDisqualified) && !player.round2Enabled) {
              // Both done with R1 (or partner disqualified) but R2 hasn't been unlocked yet
              restoredView = 'waiting'
              restoredWaitingMode = 'pre-r2'
            } else if (player.round2Completed && !partnerData?.round2Completed && !partnerData?.isDisqualified) {
              // I finished R2 but partner hasn't yet (and isn't disqualified)
              restoredView = 'waiting'
              restoredWaitingMode = 'post-r2'
            }
          }
        }

        set(s => ({
          currentPlayer: player,
          currentTeam: restoredTeam,
          players: s.players.some(p => p.id === player.id)
            ? s.players.map(p => p.id === player.id ? player : p)
            : [...s.players, player],
          currentView: restoredView,
          waitingMode: restoredWaitingMode,
          isProctoring: true,
          currentQuestionIndex: restoredIndex,
          timeRemaining: restoredTime > 0 ? restoredTime : s.timeRemaining,
          isTimerRunning: restoredView === 'round1' || restoredView === 'round2',
          round1Questions: restoredR1Questions,
          round2Challenges: restoredR2Challenges,
          // Sync violation counters from DB so the UI reflects real values
          tabSwitchCount: player.tabSwitchCount,
          fullScrnExitCount: player.fullScrnExitCount,
          tabSwitchCount2: player.tabSwitchCount2,
          fullScrnExitCount2: player.fullScrnExitCount2,
          windowButtonCount: player.windowButtonCount ?? 0,
          windowButtonCount2: player.windowButtonCount2 ?? 0,
        }))
        return true
      }
      localStorage.removeItem('itrix_player_code')
    }

    return false
  },

  saveR1Checkpoint: () => {
    const state = get()
    if (!state.currentPlayer) return
    const cp = {
      questionIndex: state.currentQuestionIndex,
      timeRemaining: state.timeRemaining,
      questionIds: state.round1Questions.map(q => q.id)
    }
    // Update in-store player so restoreSession reads fresh data
    set(s => ({
      currentPlayer: s.currentPlayer ? { ...s.currentPlayer, r1Checkpoints: cp, startTime: state.timeRemaining } : null
    }))
    // Persist checkpoint AND current answers to DB so score is correct after page refresh
    dbUpdatePlayerCheckpoints(state.currentPlayer.id, {
      r1Checkpoints: cp,
      startTime: state.timeRemaining,
      round1Answers: state.currentPlayer.round1Answers,
    }).catch(() => {})
  },

  clearR1Checkpoint: () => {
    const state = get()
    if (!state.currentPlayer) return
    set(s => ({
      currentPlayer: s.currentPlayer ? { ...s.currentPlayer, r1Checkpoints: null, startTime: undefined } : null
    }))
    dbUpdatePlayerCheckpoints(state.currentPlayer.id, {
      r1Checkpoints: null,
      startTime: null,
    }).catch(() => {})
  },

  saveR2Checkpoint: (editorCode: Record<number, string>) => {
    const state = get()
    if (!state.currentPlayer) return
    // Merge with the existing in-store checkpoint editorCode so no code is lost
    const existing = (state.currentPlayer.r2Checkpoints as { editorCode?: Record<string, string> } | null)?.editorCode || {}
    const cp = {
      challengeIndex: state.currentQuestionIndex,
      timeRemaining: state.timeRemaining,
      challengeIds: state.round2Challenges.map(c => c.id),
      editorCode: { ...existing, ...editorCode }
    }
    // Update in-store player
    set(s => ({
      currentPlayer: s.currentPlayer ? { ...s.currentPlayer, r2Checkpoints: cp, startTime2: state.timeRemaining } : null
    }))
    // Persist directly to DB
    dbUpdatePlayerCheckpoints(state.currentPlayer.id, {
      r2Checkpoints: cp,
      startTime2: state.timeRemaining,
    }).catch(() => {})
  },

  clearR2Checkpoint: () => {
    const state = get()
    if (!state.currentPlayer) return
    set(s => ({
      currentPlayer: s.currentPlayer ? { ...s.currentPlayer, r2Checkpoints: null, startTime2: undefined } : null
    }))
    dbUpdatePlayerCheckpoints(state.currentPlayer.id, {
      r2Checkpoints: null,
      startTime2: null,
    }).catch(() => {})
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      const teamCode = localStorage.getItem('itrix_team_code')
      const slot = parseInt(localStorage.getItem('itrix_player_slot') || '1') as 1 | 2
      if (teamCode) {
        updateTeamJoined(teamCode, slot, false).catch(() => {})
      }
      localStorage.removeItem('itrix_player_code')
      localStorage.removeItem('itrix_team_code')
      localStorage.removeItem('itrix_player_slot')
      localStorage.removeItem('itrix_admin_session')
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {})
      }
    }
    set({
      currentPlayer: null,
      currentTeam: null,
      waitingMode: null,
      currentView: 'landing',
      isAdmin: false,
      isProctoring: false,
      tabSwitchCount: 0,
      windowButtonCount: 0,
      windowButtonCount2: 0,
      pendingView: null,
      violations: []
    })
  },

  startRound1: async () => {
    const state = get()
    // Prevent re-attending if already completed
    if (!state.currentPlayer || state.currentPlayer.round1Completed) return

    // Fetch fresh player data from DB to sync violation counts
    const freshPlayer = await fetchPlayerById(state.currentPlayer.id)
    if (freshPlayer) {
      set(s => ({
        currentPlayer: s.currentPlayer ? { ...s.currentPlayer, tabSwitchCount: freshPlayer.tabSwitchCount, fullScrnExitCount: freshPlayer.fullScrnExitCount } : null,
        tabSwitchCount: freshPlayer.tabSwitchCount,
        fullScrnExitCount: freshPlayer.fullScrnExitCount,
      }))
    }

    const updatedState = get()

    // If a checkpoint exists, resume from where the player left off
    const r1Cp = (updatedState.currentPlayer!.r1Checkpoints || null) as { questionIndex: number; timeRemaining: number; questionIds: number[] } | null
    if (r1Cp && r1Cp.questionIds?.length > 0) {
      const idMap = new Map(updatedState.round1Questions.map(q => [q.id, q]))
      const ordered = r1Cp.questionIds.map(id => idMap.get(id)).filter(Boolean) as typeof updatedState.round1Questions
      if (ordered.length > 0) {
        set({
          currentRound: 1,
          currentQuestionIndex: Math.min(r1Cp.questionIndex, ordered.length - 1),
          timeRemaining: r1Cp.timeRemaining > 0 ? r1Cp.timeRemaining : 45 * 60,
          isTimerRunning: true,
          currentView: 'round1',
          round1Questions: ordered
        })
        return
      }
    }

    // No checkpoint — fresh start
    const shuffledQuestions = selectByDifficulty(updatedState.round1Questions, { easy: 15, medium: 10, hard: 5 })
    set({
      currentRound: 1,
      currentQuestionIndex: 0,
      timeRemaining: 45 * 60,
      isTimerRunning: true,
      currentView: 'round1',
      round1Questions: shuffledQuestions
    })
    get().saveR1Checkpoint()
  },

  startRound2: async () => {
    const state = get()
    // Prevent re-attending if already completed or not enabled
    if (!state.currentPlayer || !state.currentPlayer.round2Enabled || state.currentPlayer.round2Completed) return

    // Fetch fresh player data from DB to sync violation counts
    const freshPlayer = await fetchPlayerById(state.currentPlayer.id)
    if (freshPlayer) {
      set(s => ({
        currentPlayer: s.currentPlayer ? { ...s.currentPlayer, tabSwitchCount2: freshPlayer.tabSwitchCount2, fullScrnExitCount2: freshPlayer.fullScrnExitCount2 } : null,
        tabSwitchCount2: freshPlayer.tabSwitchCount2,
        fullScrnExitCount2: freshPlayer.fullScrnExitCount2,
      }))
    }

    const updatedState = get()

    // If a checkpoint exists, resume from where the player left off
    const r2Cp = (updatedState.currentPlayer!.r2Checkpoints || null) as { challengeIndex: number; timeRemaining: number; challengeIds: number[]; editorCode?: Record<string, string> } | null
    if (r2Cp && r2Cp.challengeIds?.length > 0) {
      const idMap = new Map(updatedState.round2Challenges.map(c => [c.id, c]))
      const ordered = r2Cp.challengeIds.map(id => idMap.get(id)).filter(Boolean) as typeof updatedState.round2Challenges
      if (ordered.length > 0) {
        set({
          currentRound: 2,
          currentQuestionIndex: Math.min(r2Cp.challengeIndex, ordered.length - 1),
          timeRemaining: r2Cp.timeRemaining > 0 ? r2Cp.timeRemaining : 30 * 60,
          isTimerRunning: true,
          currentView: 'round2',
          round2Challenges: ordered
        })
        return
      }
    }

    // No checkpoint — fresh start
    const shuffledChallenges = selectByDifficulty(updatedState.round2Challenges, { easy: 4, medium: 3, hard: 3 })
    set({
      currentRound: 2,
      currentQuestionIndex: 0,
      timeRemaining: 30 * 60,
      isTimerRunning: true,
      currentView: 'round2',
      round2Challenges: shuffledChallenges
    })
    get().saveR2Checkpoint({})
  },

  saveAnswer: (questionId, answer) => {
    const state = get()
    if (!state.currentPlayer) return

    const updatedAnswers = { ...state.currentPlayer.round1Answers, [questionId]: answer }

    set(s => ({
      currentPlayer: s.currentPlayer ? { ...s.currentPlayer, round1Answers: updatedAnswers } : null
    }))

    // Checkpoint on every answer selection
    get().saveR1Checkpoint()
  },

  goToQuestion: (index) => {
    set({ currentQuestionIndex: index })
  },

  submitRound1: async () => {
    const state = get()
    if (!state.currentPlayer) return

    // Exit fullscreen before transitioning to lobby/dashboard
    if (typeof document !== 'undefined' && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    }

    // Calculate score: player answers are 0-indexed (0=A,1=B,2=C,3=D),
    // DB correct_answer is 1-indexed (1=A,2=B,3=C,4=D), so add 1 to answer before comparing.
    const answers = state.currentPlayer?.round1Answers ?? {}
    let totalScore = 0
    for (const q of state.round1Questions) {
      const raw = answers[q.id]
      if (raw === undefined || raw === null) continue
      const playerAnswer = Number(raw) + 1          // convert 0-based → 1-based
      const correctAnswer = Number(q.correctAnswer)  // already 1-based from DB
      if (!Number.isNaN(playerAnswer) && !Number.isNaN(correctAnswer) && playerAnswer === correctAnswer) {
        totalScore += q.points
      }
    }

    const updatedPlayer = {
      ...state.currentPlayer,
      round1Score: totalScore,
      score: totalScore,
      round1Completed: true
    }

    const team = get().currentTeam
    const isTwoPlayerTeam = !!(team && team.player2Name)

    // Update local state first for immediate UI feedback
    set(s => ({
      currentPlayer: updatedPlayer,
      players: s.players.map(p => p.id === updatedPlayer.id ? updatedPlayer : p),
      currentView: isTwoPlayerTeam ? 'waiting' : 'leaderboard',
      waitingMode: isTwoPlayerTeam ? 'post-r1' : null,
      leaderboardInitialTab: isTwoPlayerTeam ? s.leaderboardInitialTab : 'round1',
      leaderboardInitialSection: 'teams',
      isTimerRunning: false
    }))

    // Clear checkpoint on successful round completion
    get().clearR1Checkpoint()

    // Sync to database and wait for it to complete
    try {
      await dbUpdatePlayer(updatedPlayer)
    } catch (error) {
      console.error('Failed to sync player to database:', error)
    }
  },

runTestCases: (_code) => {
    // Deprecated: Use runTestCasesWithEngine from lib/sql-executor.ts instead
    // This stub remains for type compatibility
    return []
  },

  submitRound2Answer: (code) => {
    const state = get()
    const emptyResult: SubmissionResult = {
      testResults: [],
      totalPassed: 0,
      totalTests: 0,
      pointsEarned: 0,
      allPassed: false
    }
    
    if (!state.currentPlayer) return emptyResult
    
    const challenge = state.round2Challenges[state.currentQuestionIndex]
    if (!challenge) return emptyResult
    
    // Run all test cases
    const testResults = get().runTestCases(code)
    const totalPassed = testResults.filter(r => r.passed).length
    const totalTests = testResults.length
    
    // Calculate points based on test cases passed
    let pointsEarned = 0
    challenge.testCases.forEach((tc, idx) => {
      if (testResults[idx]?.passed) {
        pointsEarned += tc.points
      }
    })
    
    const allPassed = totalPassed === totalTests
    
    if (pointsEarned > 0) {
      const updatedPlayer = {
        ...state.currentPlayer,
        round2Score: state.currentPlayer.round2Score + pointsEarned,
        score: state.currentPlayer.score + pointsEarned
      }
      
      set(s => ({
        currentPlayer: updatedPlayer,
        players: s.players.map(p => p.id === updatedPlayer.id ? updatedPlayer : p)
      }))
      
      // Sync to database asynchronously
      dbUpdatePlayer(updatedPlayer).catch(error => {
        console.error('Failed to sync player score to database:', error)
      })
    }
    
    return {
      testResults,
      totalPassed,
      totalTests,
      pointsEarned,
      allPassed
    }
  },

  nextChallenge: () => {
    const state = get()
    const totalChallenges = state.round2Challenges.length

    if (state.currentQuestionIndex >= totalChallenges - 1) {
      // Round 2 complete - use finishRound2 for proper completion
      get().finishRound2()
    } else {
      set({ currentQuestionIndex: state.currentQuestionIndex + 1 })
    }
  },

  finishRound2: async () => {
    const state = get()
    if (!state.currentPlayer) return

    // Exit fullscreen before transitioning to lobby/dashboard
    if (typeof document !== 'undefined' && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    }

    // Mark round 2 as completed
    const updatedPlayer = {
      ...state.currentPlayer,
      round2Completed: true
    }

    const team2 = get().currentTeam
    const isTwoPlayerTeam2 = !!(team2 && team2.player2Name)

    // Update local state immediately
    set(s => ({
      currentPlayer: updatedPlayer,
      players: s.players.map(p => p.id === updatedPlayer.id ? updatedPlayer : p),
      currentView: isTwoPlayerTeam2 ? 'waiting' : 'dashboard',
      waitingMode: isTwoPlayerTeam2 ? 'post-r2' : null,
      isTimerRunning: false
    }))

    // Clear checkpoint on successful round completion
    get().clearR2Checkpoint()

    // Sync to database and wait for completion
    try {
      await dbUpdatePlayer(updatedPlayer)
    } catch (error) {
      console.error('Failed to sync round2 completion to database:', error)
    }
  },

  recordTabSwitch1: () => {
    const state = get()
    const newCount = (state.currentPlayer?.tabSwitchCount ?? state.tabSwitchCount) + 1
    const disqualify = newCount > 2 // Disqualify if exceeds 2

    if (state.currentPlayer) {
      const updatedPlayer = { ...state.currentPlayer, tabSwitchCount: newCount, isDisqualified: disqualify || state.currentPlayer.isDisqualified }
      set(s => ({
        tabSwitchCount: newCount,
        violations: [...s.violations, disqualify ? `Disqualified: Tab switches exceeded limit (${newCount})` : `R1 Tab switch detected (${newCount}/2)`],
        currentPlayer: updatedPlayer,
        players: s.players.map(p => p.id === updatedPlayer.id ? updatedPlayer : p),
        ...(disqualify ? { currentView: 'dashboard' } : {})
      }))
      dbUpdatePlayer(updatedPlayer).catch(error => {
        console.error('Failed to sync R1 tab switch to database:', error)
      })
    } else {
      set(s => ({
        tabSwitchCount: newCount,
        violations: [...s.violations, `R1 Tab switch detected (${newCount}/2)`]
      }))
    }
    return !disqualify
  },

  recordFullscreenExit1: () => {
    const state = get()
    const newCount = (state.currentPlayer?.fullScrnExitCount ?? state.fullScrnExitCount) + 1
    const disqualify = newCount > 2 // Disqualify if exceeds 2

    if (state.currentPlayer) {
      const updatedPlayer = { ...state.currentPlayer, fullScrnExitCount: newCount, isDisqualified: disqualify || state.currentPlayer.isDisqualified }
      set(s => ({
        fullScrnExitCount: newCount,
        violations: [...s.violations, disqualify ? `Disqualified: Fullscreen exits exceeded limit (${newCount})` : `R1 Fullscreen exit (${newCount}/2)`],
        currentPlayer: updatedPlayer,
        players: s.players.map(p => p.id === updatedPlayer.id ? updatedPlayer : p),
        ...(disqualify ? { currentView: 'dashboard' } : {})
      }))
      dbUpdatePlayer(updatedPlayer).catch(error => {
        console.error('Failed to sync R1 fullscreen exit to database:', error)
      })
    } else {
      set(s => ({
        fullScrnExitCount: newCount,
        violations: [...s.violations, `R1 Fullscreen exit (${newCount}/2)`]
      }))
    }
    return !disqualify
  },

  recordTabSwitch2: () => {
    const state = get()
    const newCount = (state.currentPlayer?.tabSwitchCount2 ?? state.tabSwitchCount2) + 1
    const disqualify = newCount > 2 // Disqualify if exceeds 2

    if (state.currentPlayer) {
      const updatedPlayer = { ...state.currentPlayer, tabSwitchCount2: newCount, isDisqualified: disqualify || state.currentPlayer.isDisqualified }
      set(s => ({
        tabSwitchCount2: newCount,
        violations: [...s.violations, disqualify ? `Disqualified: R2 Tab switches exceeded limit (${newCount})` : `R2 Tab switch detected (${newCount}/2)`],
        currentPlayer: updatedPlayer,
        players: s.players.map(p => p.id === updatedPlayer.id ? updatedPlayer : p),
        ...(disqualify ? { currentView: 'dashboard' } : {})
      }))
      dbUpdatePlayer(updatedPlayer).catch(error => {
        console.error('Failed to sync R2 tab switch to database:', error)
      })
    } else {
      set(s => ({
        tabSwitchCount2: newCount,
        violations: [...s.violations, `R2 Tab switch detected (${newCount}/2)`]
      }))
    }
    return !disqualify
  },

  recordFullscreenExit2: () => {
    const state = get()
    const newCount = (state.currentPlayer?.fullScrnExitCount2 ?? state.fullScrnExitCount2) + 1
    const disqualify = newCount > 2 // Disqualify if exceeds 2

    if (state.currentPlayer) {
      const updatedPlayer = { ...state.currentPlayer, fullScrnExitCount2: newCount, isDisqualified: disqualify || state.currentPlayer.isDisqualified }
      set(s => ({
        fullScrnExitCount2: newCount,
        violations: [...s.violations, disqualify ? `Disqualified: R2 Fullscreen exits exceeded limit (${newCount})` : `R2 Fullscreen exit (${newCount}/2)`],
        currentPlayer: updatedPlayer,
        players: s.players.map(p => p.id === updatedPlayer.id ? updatedPlayer : p),
        ...(disqualify ? { currentView: 'dashboard' } : {})
      }))
      dbUpdatePlayer(updatedPlayer).catch(error => {
        console.error('Failed to sync R2 fullscreen exit to database:', error)
      })
    } else {
      set(s => ({
        fullScrnExitCount2: newCount,
        violations: [...s.violations, `R2 Fullscreen exit (${newCount}/2)`]
      }))
    }
    return !disqualify
  },

  acceptTerms: () => {
    const state = get()
    const dest = state.pendingView ?? 'dashboard'
    set({ currentView: dest, pendingView: null })
  },

  recordWindowButton1: () => {
    const state = get()
    const newCount = (state.currentPlayer?.windowButtonCount ?? state.windowButtonCount) + 1
    // No disqualification - just count and log

    if (state.currentPlayer) {
      const updatedPlayer = { ...state.currentPlayer, windowButtonCount: newCount }
      set(s => ({
        windowButtonCount: newCount,
        violations: [...s.violations, `R1 Window key pressed (${newCount})`],
        currentPlayer: updatedPlayer,
        players: s.players.map(p => p.id === updatedPlayer.id ? updatedPlayer : p)
      }))
      dbUpdatePlayer(updatedPlayer).catch(error => {
        console.error('Failed to sync R1 window button to database:', error)
      })
    } else {
      set(s => ({
        windowButtonCount: newCount,
        violations: [...s.violations, `R1 Window key pressed (${newCount})`]
      }))
    }
    return true // Always allow continuing
  },

  recordWindowButton2: () => {
    const state = get()
    const newCount = (state.currentPlayer?.windowButtonCount2 ?? state.windowButtonCount2) + 1
    // No disqualification - just count and log

    if (state.currentPlayer) {
      const updatedPlayer = { ...state.currentPlayer, windowButtonCount2: newCount }
      set(s => ({
        windowButtonCount2: newCount,
        violations: [...s.violations, `R2 Window key pressed (${newCount})`],
        currentPlayer: updatedPlayer,
        players: s.players.map(p => p.id === updatedPlayer.id ? updatedPlayer : p)
      }))
      dbUpdatePlayer(updatedPlayer).catch(error => {
        console.error('Failed to sync R2 window button to database:', error)
      })
    } else {
      set(s => ({
        windowButtonCount2: newCount,
        violations: [...s.violations, `R2 Window key pressed (${newCount})`]
      }))
    }
    return true // Always allow continuing
  },

  setFullscreen: (isFullscreen) => set({ isFullscreen }),

  updateTimer: (time) => {
    set({ timeRemaining: time })
  },

  addViolation: (violation) => {
    set(s => ({ violations: [...s.violations, violation] }))
    const state = get()
    if (state.currentPlayer) {
      dbUpdatePlayer(state.currentPlayer).catch(error => {
        console.error('Failed to sync violation to database:', error)
      })
    }
  },

  updateLeaderboard: () => {
    const players = get().players
      .filter(p => !p.isDisqualified)
      .sort((a, b) => b.score - a.score)
      .map((player, index) => ({
        rank: index + 1,
        player,
        totalScore: player.score
      }))
    return players
  },

  addPlayer: (code, studentDetails) => {
    const normalizedCode = code.toUpperCase().trim()
    const exists = get().players.find(p => p.id === normalizedCode)
    if (exists) return

    const newPlayer = {
      ...createInitialPlayer(normalizedCode),
      name: studentDetails?.name || normalizedCode,
      college: studentDetails?.college || '',
      department: studentDetails?.department || '',
      yearOfStudy: studentDetails?.yearOfStudy || '',
      contactNumber: studentDetails?.contactNumber || '',
      email: studentDetails?.email || '',
      teamCode: studentDetails?.teamCode,
      playerSlot: studentDetails?.playerSlot || 1,
    }
    set(s => ({ players: [...s.players, newPlayer] }))

    // Sync to database
    dbCreatePlayer(normalizedCode, studentDetails)
  },

  removePlayer: (id) => {
    set(s => ({
      players: s.players.filter(p => p.id !== id)
    }))
    // Sync to database
    dbDeletePlayer(id)
  },

  enableRound2: (playerId) => {
    set(s => ({
      players: s.players.map(p =>
        p.id === playerId ? { ...p, round2Enabled: true } : p
      ),
      currentPlayer: s.currentPlayer?.id === playerId
        ? { ...s.currentPlayer, round2Enabled: true }
        : s.currentPlayer
    }))
    // Sync to database
    enableRound2ForPlayer(playerId)
  },

  disableRound2: (playerId) => {
    set(s => ({
      players: s.players.map(p =>
        p.id === playerId ? { ...p, round2Enabled: false } : p
      ),
      currentPlayer: s.currentPlayer?.id === playerId
        ? { ...s.currentPlayer, round2Enabled: false }
        : s.currentPlayer
    }))
    // Sync to database
    disableRound2ForPlayer(playerId)
  },

  updatePlayerDetails: async (id, details) => {
    const player = get().players.find(p => p.id === id)
    if (!player) return
    const updated = { ...player, ...details }
    set(s => ({ players: s.players.map(p => p.id === id ? updated : p) }))
    await dbUpdatePlayer(updated)
  },

  resetGame: () => {
    set(s => ({
      players: s.players.map(p => ({
        ...p,
        score: 0,
        round1Score: 0,
        round2Score: 0,
        round1Completed: false,
        round2Enabled: false,
        round2Completed: false,
        tabSwitchCount: 0,
        isDisqualified: false,
        round1Answers: {}
      }))
    }))
    // Sync to database
    resetAllPlayers()
  },

  loadPlayers: async () => {
    const dbPlayers = await fetchAllPlayers()
    
    // Merge database players with local state, preferring local scores if they're higher
    // This prevents overwriting locally updated scores with stale DB data
    set(state => {
      const localPlayerMap = new Map(state.players.map(p => [p.id, p]))
      
      const mergedPlayers = dbPlayers.map(dbPlayer => {
        const localPlayer = localPlayerMap.get(dbPlayer.id)
        if (localPlayer) {
          // If local player has higher scores, keep them (they may not have synced to DB yet)
          return {
            ...dbPlayer,
            score: Math.max(localPlayer.score, dbPlayer.score),
            round1Score: Math.max(localPlayer.round1Score, dbPlayer.round1Score),
            round2Score: Math.max(localPlayer.round2Score, dbPlayer.round2Score),
            round1Completed: localPlayer.round1Completed || dbPlayer.round1Completed,
            round2Completed: localPlayer.round2Completed || dbPlayer.round2Completed,
          }
        }
        return dbPlayer
      })
      
      // Also include any local players not in DB yet
      const dbPlayerIds = new Set(dbPlayers.map(p => p.id))
      const localOnlyPlayers = state.players.filter(p => !dbPlayerIds.has(p.id))
      
      // Update currentPlayer if it exists in the merged list
      const allPlayers = [...mergedPlayers, ...localOnlyPlayers]
      const updatedCurrentPlayer = state.currentPlayer 
        ? allPlayers.find(p => p.id === state.currentPlayer!.id) || state.currentPlayer
        : null
      
      return { 
        players: allPlayers,
        currentPlayer: updatedCurrentPlayer
      }
    })
  },

  syncPlayerToDb: async (player) => {
    await dbUpdatePlayer(player)
  },

  // Load questions from database
  loadRound1Questions: async () => {
    const dbQuestions = await fetchRound1Questions()
    if (dbQuestions.length > 0) {
      set({ round1Questions: dbQuestions })
    }
    // If no questions in DB, keep the default hardcoded ones
  },

  // Question management functions - now using database
  addRound1Question: async (question) => {
    const newQuestion = await dbCreateRound1Question(question)
    if (newQuestion) {
      set(s => ({ round1Questions: [...s.round1Questions, newQuestion] }))
    }
  },

  updateRound1Question: async (id, question) => {
    const updated = await dbUpdateRound1Question(id, question)
    if (updated) {
      set(s => ({
        round1Questions: s.round1Questions.map(q => 
          q.id === id ? updated : q
        )
      }))
    }
  },

  deleteRound1Question: async (id) => {
    const success = await dbDeleteRound1Question(id)
    if (success) {
      set(s => ({
        round1Questions: s.round1Questions.filter(q => q.id !== id)
      }))
    }
  },

  // Load challenges from database
  loadRound2Challenges: async () => {
    const dbChallenges = await fetchRound2Challenges()
    if (dbChallenges.length > 0) {
      set({ round2Challenges: dbChallenges })
    }
    // If no challenges in DB, keep the default hardcoded ones
  },

  // Round 2 management
  updateRound2Tables: (tables) => {
    // Update base table data for all challenges
    set(s => ({
      round2Challenges: s.round2Challenges.map(c => ({
        ...c,
        baseTableData: tables
      }))
    }))
  },

  addRound2Challenge: async (challenge) => {
    const newChallenge = await dbCreateRound2Challenge(challenge)
    if (newChallenge) {
      set(s => ({ round2Challenges: [...s.round2Challenges, newChallenge] }))
    }
  },

  updateRound2Challenge: async (id, challenge) => {
    const updated = await dbUpdateRound2Challenge(id, challenge)
    if (updated) {
      set(s => ({
        round2Challenges: s.round2Challenges.map(c => 
          c.id === id ? updated : c
        )
      }))
    }
  },

  deleteRound2Challenge: async (id) => {
    const success = await dbDeleteRound2Challenge(id)
    if (success) {
      set(s => ({
        round2Challenges: s.round2Challenges.filter(c => c.id !== id)
      }))
    }
  },

  loadTeams: async () => {
    const dbTeams = await fetchAllTeams()
    set({ teams: dbTeams })
  },

  addTeam: async (team) => {
    const newTeam = await dbCreateTeam(team)
    if (newTeam) {
      set(s => ({ teams: [...s.teams, newTeam] }))
    }
  },

  removeTeam: async (code) => {
    const success = await dbDeleteTeam(code)
    if (success) {
      set(s => ({ teams: s.teams.filter(t => t.code !== code) }))
    }
  },

  enableRound2ForTeam: (teamCode) => {
    const state = get()
    const team = state.teams.find(t => t.code === teamCode)
    if (!team) return
    const p1Id = `${teamCode}_1`
    const p2Id = `${teamCode}_2`
    set(s => ({
      players: s.players.map(p =>
        (p.id === p1Id || p.id === p2Id) ? { ...p, round2Enabled: true } : p
      ),
      currentPlayer: s.currentPlayer && (s.currentPlayer.id === p1Id || s.currentPlayer.id === p2Id)
        ? { ...s.currentPlayer, round2Enabled: true }
        : s.currentPlayer
    }))
    enableRound2ForPlayer(p1Id).catch(() => {})
    if (team.player2Name) enableRound2ForPlayer(p2Id).catch(() => {})
  },

  disableRound2ForTeam: (teamCode) => {
    const state = get()
    const team = state.teams.find(t => t.code === teamCode)
    if (!team) return
    const p1Id = `${teamCode}_1`
    const p2Id = `${teamCode}_2`
    set(s => ({
      players: s.players.map(p =>
        (p.id === p1Id || p.id === p2Id) ? { ...p, round2Enabled: false } : p
      ),
      currentPlayer: s.currentPlayer && (s.currentPlayer.id === p1Id || s.currentPlayer.id === p2Id)
        ? { ...s.currentPlayer, round2Enabled: false }
        : s.currentPlayer
    }))
    disableRound2ForPlayer(p1Id).catch(() => {})
    if (team.player2Name) disableRound2ForPlayer(p2Id).catch(() => {})
  },
}))
