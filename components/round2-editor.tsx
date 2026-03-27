'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useGameStore, TableData, TestCase, TestCaseResult } from '@/lib/game-store'
import { runTestCasesWithEngine, executeQueryOnTableData, QueryExecutionResult } from '@/lib/sql-executor'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  ChevronRight,
  ChevronLeft,
  Database,
  Shield,
  Zap,
  Play,
  Code,
  Trophy,
  Target,
  Table,
  Eye,
  EyeOff,
  Lock,
  FlaskConical,
  Send,
  Sparkles,
  Terminal,
  Rocket,
  Maximize,
  MonitorOff,
  Keyboard,
  ShieldX,
  Monitor,
} from 'lucide-react'

// Table Display Component
function DataTable({ tableData }: { tableData: TableData }) {
  const columns = tableData?.columns || []
  const rows = tableData?.rows || []
  return (
    <div className="rounded-lg border border-border/50 overflow-hidden">
      <div className="bg-secondary/20 px-3 py-2 border-b border-border/50">
        <span className="font-mono text-sm font-medium text-foreground">{tableData?.tableName}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/30">
              {columns.map((col, idx) => (
                <th key={idx} className="px-3 py-2 text-left font-medium text-foreground border-b border-border/30">
                  <div className="flex items-center gap-1">
                    <span>{col.name}</span>
                    {col.isPrimaryKey && <span className="text-[10px] text-neon-sky">(PK)</span>}
                    {col.isForeignKey && <span className="text-[10px] text-neon-orange">(FK)</span>}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-normal">{col.type}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-muted/20 transition-colors">
                {(row || []).map((cell, cellIdx) => (
                  <td key={cellIdx} className="px-3 py-1.5 border-b border-border/20 font-mono text-muted-foreground">
                    {cell === null ? <span className="italic text-muted-foreground/50">NULL</span> : String(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Output Table Component for test results
function OutputTable({ columns, rows, variant = 'default' }: { 
  columns: string[]
  rows: (string | number | null)[][]
  variant?: 'default' | 'expected' | 'actual' | 'correct' | 'wrong'
}) {
  const safeColumns = columns || []
  const safeRows = rows || []
  const borderColors = {
    default: 'border-border/50',
    expected: 'border-accent/50',
    actual: 'border-primary/50',
    correct: 'border-neon-green/50',
    wrong: 'border-destructive/50'
  }

  return (
    <div className={`rounded-lg border overflow-hidden ${borderColors[variant]}`}>
      <div className="overflow-x-auto max-h-[150px]">
        <table className="w-full text-xs">
          <thead className="sticky top-0">
            <tr className="bg-muted/50">
              {safeColumns.map((col, idx) => (
                <th key={idx} className="px-3 py-2 text-left font-medium text-foreground border-b border-border/30">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {safeRows.length === 0 ? (
              <tr>
                <td colSpan={safeColumns.length} className="px-3 py-4 text-center text-muted-foreground italic">
                  No results
                </td>
              </tr>
            ) : (
              safeRows.map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-muted/20 transition-colors">
                  {(row || []).map((cell, cellIdx) => (
                    <td key={cellIdx} className="px-3 py-1.5 border-b border-border/20 font-mono text-muted-foreground">
                      {cell === null ? <span className="italic text-muted-foreground/50">NULL</span> : String(cell)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Test Case Card Component
function TestCaseCard({ 
  testCase, 
  result, 
  isActive, 
  onClick,
  showDetails
}: { 
  testCase: TestCase
  result?: TestCaseResult
  isActive: boolean
  onClick: () => void
  showDetails: boolean
}) {
  const getStatusIcon = () => {
    if (!result) return <FlaskConical className="w-4 h-4 text-muted-foreground" />
    if (result.passed) return <CheckCircle2 className="w-4 h-4 text-neon-green" />
    return <XCircle className="w-4 h-4 text-destructive" />
  }

  const getStatusBg = () => {
    if (!result) return 'bg-muted/30'
    if (result.passed) return 'bg-neon-green/10'
    return 'bg-destructive/10'
  }

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg border transition-all ${
        isActive 
          ? 'border-accent bg-accent/10' 
          : 'border-border/50 hover:border-border'
      } ${getStatusBg()}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-sm font-medium text-foreground">
            {testCase.isHidden ? `Edge Case ${testCase.id}` : testCase.name}
          </span>
          {testCase.isHidden && <Lock className="w-3 h-3 text-muted-foreground" />}
        </div>
      </div>
      {showDetails && !testCase.isHidden && testCase.description && (
        <p className="text-xs text-muted-foreground mt-1">{testCase.description}</p>
      )}
    </button>
  )
}

// Type for storing answers per question
interface QuestionAnswer {
  code: string
  testResults: TestCaseResult[]
  submitted: boolean
}

export function Round2Editor() {
  const {
    currentPlayer,
    currentTeam,
    currentQuestionIndex,
    timeRemaining,
    round2Challenges,
    tabSwitchCount2,
    fullScrnExitCount2,
    maxViolations,
    submitRound2Answer,
    runTestCases,
    goToQuestion,
    recordTabSwitch2,
    recordFullscreenExit2,
    recordWindowButton2,
    setFullscreen,
    updateTimer,
    setView,
    addViolation,
    finishRound2,
    saveR2Checkpoint,
    clearR2Checkpoint,
    syncPlayerToDb,
    logout
  } = useGameStore()

  // Store answers for each question
  const [answers, setAnswers] = useState<Record<number, QuestionAnswer>>({})

  // Restore editor code directly from DB checkpoint on mount
  useEffect(() => {
    if (!currentPlayer) return
    const cp = currentPlayer.r2Checkpoints as { editorCode?: Record<string, string> } | null
    const savedCode = cp?.editorCode || {}
    if (Object.keys(savedCode).length === 0) return
    setAnswers(prev => {
      const restored = { ...prev }
      Object.entries(savedCode).forEach(([idxStr, code]) => {
        const idx = Number(idxStr)
        restored[idx] = { code: code as string, testResults: [], submitted: false }
      })
      return restored
    })
  }, [])

  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(true)
  const [isFullscreenViolation, setIsFullscreenViolation] = useState(false)
  const [showTabWarning, setShowTabWarning] = useState(false)
  const [tabWarningCount, setTabWarningCount] = useState(0)
  const codeCheckpointTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [activeTestCase, setActiveTestCase] = useState(0)
  const [activeTab, setActiveTab] = useState<'testcases' | 'result'>('testcases')
  const [showFinalSubmit, setShowFinalSubmit] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isSubmittingRef = useRef(false)
  const [finalResults, setFinalResults] = useState<{
    totalScore: number
    questionsAttempted: number
    totalQuestions: number
  } | null>(null)

  // Keep a ref to the latest answers so the timer closure always reads fresh data
  const answersRef = useRef(answers)
  useEffect(() => { answersRef.current = answers }, [answers])
  
  // Store computed expected outputs for each test case (keyed by "challengeId-testCaseId")
  const [computedExpectedOutputs, setComputedExpectedOutputs] = useState<Record<string, QueryExecutionResult>>({})
  const [isComputingExpected, setIsComputingExpected] = useState(false)

  const safeChallenges = round2Challenges || []
  const currentChallenge = safeChallenges[currentQuestionIndex]
  const currentAnswer = answers[currentQuestionIndex] || { code: '', testResults: [], submitted: false }
  const progress = safeChallenges.length > 0 ? ((currentQuestionIndex + 1) / safeChallenges.length) * 100 : 0
  
  // Count answered questions
  const answeredCount = Object.values(answers).filter(a => a.code.trim()).length

  // Timer effect
  useEffect(() => {
    if (showFinalSubmit || showFullscreenPrompt || finalResults || isSubmitting) return

    const timer = setInterval(() => {
      if (timeRemaining <= 1) {
        handleFinalSubmit()
        clearInterval(timer)
      } else {
        updateTimer(timeRemaining - 1)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [timeRemaining, showFinalSubmit, showFullscreenPrompt, finalResults, isSubmitting])

  // Checkpoint every 10 seconds
  useEffect(() => {
    if (showFullscreenPrompt || showFinalSubmit) return
    const interval = setInterval(() => {
      const codeMap: Record<number, string> = {}
      setAnswers(prev => {
        Object.entries(prev).forEach(([k, v]) => { codeMap[Number(k)] = v.code })
        return prev
      })
      setTimeout(() => saveR2Checkpoint(codeMap), 0)
    }, 10000)
    return () => clearInterval(interval)
  }, [showFullscreenPrompt, showFinalSubmit, saveR2Checkpoint])

  // Code auto-save debounce — save code to checkpoint 2s after every keystroke
  useEffect(() => {
    if (showFullscreenPrompt || showFinalSubmit) return
    if (codeCheckpointTimer.current) clearTimeout(codeCheckpointTimer.current)
    codeCheckpointTimer.current = setTimeout(() => {
      const codeMap: Record<number, string> = {}
      setAnswers(prev => {
        Object.entries(prev).forEach(([k, v]) => { codeMap[Number(k)] = v.code })
        return prev
      })
      setTimeout(() => saveR2Checkpoint(codeMap), 0)
    }, 2000)
    return () => {
      if (codeCheckpointTimer.current) clearTimeout(codeCheckpointTimer.current)
    }
  }, [answers, showFullscreenPrompt, showFinalSubmit, saveR2Checkpoint])

  // Tab switch detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !showFullscreenPrompt) {
        const canContinue = recordTabSwitch2()
        const newCount = tabSwitchCount2 + 1

        if (!canContinue) {
          setView('dashboard')
          return
        }

        // Show yellow warning — player must click Continue to dismiss
        setTabWarningCount(newCount)
        setShowTabWarning(true)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [showFullscreenPrompt, recordTabSwitch2, setView, tabSwitchCount2])

  // Fullscreen detection — exits count toward the violation limit
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFS = !!document.fullscreenElement
      setFullscreen(isFS)
      if (!isFS && !showFullscreenPrompt) {
        addViolation('Exited fullscreen mode')
        const canContinue = recordFullscreenExit2()
        if (!canContinue) {
          setView('dashboard')
          return
        }
        setIsFullscreenViolation(true)
        setShowFullscreenPrompt(true)
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [showFullscreenPrompt, setFullscreen, addViolation, recordFullscreenExit2, setView])

  // Detect Windows/Meta key presses
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Meta' || e.key === 'OS' || e.code === 'MetaLeft' || e.code === 'MetaRight') {
        e.preventDefault()
        addViolation('Windows/Meta key pressed')
        const canContinue = recordWindowButton2()
        if (!canContinue) {
          setView('dashboard')
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [addViolation, recordWindowButton2, setView])

  // Block copy, paste and right-click
  useEffect(() => {
    const prevent = (e: Event) => e.preventDefault()
    document.addEventListener('copy', prevent)
    document.addEventListener('paste', prevent)
    document.addEventListener('contextmenu', prevent)
    return () => {
      document.removeEventListener('copy', prevent)
      document.removeEventListener('paste', prevent)
      document.removeEventListener('contextmenu', prevent)
    }
  }, [])

  // Compute expected outputs dynamically when challenge changes
  useEffect(() => {
    if (!currentChallenge?.correctQuery || !currentChallenge.testCases?.length) return
    
    const computeExpected = async () => {
      setIsComputingExpected(true)
      
      for (const testCase of currentChallenge.testCases) {
        const key = `${currentChallenge.id}-${testCase.id}`
        
        // Skip if already computed
        if (computedExpectedOutputs[key]) continue
        
        // Compute expected output by running the correct query against test case data
        const result = await executeQueryOnTableData(currentChallenge.correctQuery!, testCase.tableData)
        
        setComputedExpectedOutputs(prev => ({
          ...prev,
          [key]: result
        }))
      }
      
      setIsComputingExpected(false)
    }
    
    computeExpected()
  }, [currentChallenge?.id, currentChallenge?.correctQuery])

  const enterFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen()
      setIsFullscreenViolation(false)
      setShowFullscreenPrompt(false)
    } catch {
      setIsFullscreenViolation(false)
      setShowFullscreenPrompt(false)
    }
  }, [])

  const updateCode = (newCode: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: {
        ...prev[currentQuestionIndex],
        code: newCode,
        testResults: [],
        submitted: false
      }
    }))
  }

  const handleRun = async () => {
    if (!currentAnswer.code.trim() || !currentChallenge) return
    
    setIsRunning(true)
    
    // Run test cases using PGlite engine, pass correctQuery for dynamic expected output computation
    const results = await runTestCasesWithEngine(currentAnswer.code, currentChallenge.testCases, currentChallenge.correctQuery)
    
    const updatedAnswers = {
      ...answers,
      [currentQuestionIndex]: {
        ...answers[currentQuestionIndex],
        testResults: results
      }
    }
    setAnswers(updatedAnswers)

    // Checkpoint: save all current editor code (outside state updater to avoid setState-during-render)
    const codeMap: Record<number, string> = {}
    Object.entries(updatedAnswers).forEach(([k, v]) => { codeMap[Number(k)] = v.code })
    saveR2Checkpoint(codeMap)

    setActiveTab('result')
    setIsRunning(false)
  }

  const handleNavigate = (index: number) => {
    if (index >= 0 && index < safeChallenges.length) {
      setActiveTestCase(0)
      setActiveTab('testcases')
      goToQuestion(index)
    }
  }

  const handleFinalSubmit = async () => {
    // Prevent double-calls (from timer + user click simultaneously)
    if (isSubmittingRef.current) return
    isSubmittingRef.current = true
    setIsSubmitting(true)
    setShowFinalSubmit(false)

    // Use the ref so the timer closure always scores the freshest code
    const currentAnswers = answersRef.current

    let totalScore = 0
    let questionsAttempted = 0

    for (let idx = 0; idx < safeChallenges.length; idx++) {
      const challenge = safeChallenges[idx]
      const answer = currentAnswers[idx]
      if (answer?.code.trim()) {
        questionsAttempted++
        const testResults = await runTestCasesWithEngine(answer.code, challenge.testCases, challenge.correctQuery)

        let pointsEarned = 0
        challenge.testCases.forEach((tc, tcIdx) => {
          if (testResults[tcIdx]?.passed) {
            pointsEarned += tc.points
          }
        })
        totalScore += pointsEarned
      }
    }

    // Read fresh player from store (not the potentially-stale closure value)
    const freshPlayer = useGameStore.getState().currentPlayer
    if (freshPlayer) {
      const updatedPlayer = {
        ...freshPlayer,
        round2Score: freshPlayer.round2Score + totalScore,
        score: freshPlayer.score + totalScore,
        round2Completed: true
      }
      // Update store WITHOUT changing currentView so results screen can render
      useGameStore.setState(s => ({
        currentPlayer: updatedPlayer,
        players: s.players.map(p => p.id === updatedPlayer.id ? updatedPlayer : p),
        isTimerRunning: false
      }))
      // Persist to DB
      try {
        await syncPlayerToDb(updatedPlayer)
      } catch (err) {
        console.error('Failed to sync round2 completion to database:', err)
      }
    }

    // Clear checkpoint and exit fullscreen
    clearR2Checkpoint()
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    }

    // Show the results screen — the "Back" button will handle final navigation
    setFinalResults({
      totalScore,
      questionsAttempted,
      totalQuestions: safeChallenges.length
    })
    isSubmittingRef.current = false
    setIsSubmitting(false)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-neon-green border-neon-green/50 bg-neon-green/10'
      case 'medium': return 'text-neon-orange border-neon-orange/50 bg-neon-orange/10'
      case 'hard': return 'text-neon-red border-neon-red/50 bg-neon-red/10'
      default: return 'text-primary border-primary/50'
    }
  }

  const safeTestCases = currentChallenge?.testCases || []
  const visibleTestCases = safeTestCases.filter(tc => !tc.isHidden)
  const hiddenTestCases = safeTestCases.filter(tc => tc.isHidden)
  const currentTestCase = safeTestCases[activeTestCase]

  if (!currentChallenge) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-foreground">No challenges available</p>
      </div>
    )
  }

  // Final Results Screen
  if (finalResults) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-violet [mask-image:none] opacity-30" />
        
        <Card className="max-w-lg w-full border-neon-green/30 bg-card relative z-10">
          <CardHeader className="text-center pb-2">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-neon-green/20 flex items-center justify-center">
              <Trophy className="w-10 h-10 text-neon-green" />
            </div>
            <CardTitle className="text-3xl text-foreground">Round 2 Complete!</CardTitle>
            <p className="text-muted-foreground mt-2">Great job completing the SQL Challenge Arena</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center p-6 rounded-lg bg-neon-green/10 border border-neon-green/30">
              <p className="text-sm text-muted-foreground mb-2">Your Final Score</p>
              <p className="text-5xl font-bold text-neon-green">{currentPlayer?.round2Score || finalResults.totalScore}</p>
              <p className="text-sm text-muted-foreground mt-2">points earned</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                <p className="text-2xl font-bold text-primary">{finalResults.questionsAttempted}</p>
                <p className="text-xs text-muted-foreground">Questions Attempted</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                <p className="text-2xl font-bold text-accent">{finalResults.totalQuestions}</p>
                <p className="text-xs text-muted-foreground">Total Questions</p>
              </div>
            </div>

            <Button 
              onClick={() => {
                const isTwoPlayer = !!(currentTeam && currentTeam.player2Name)
                if (isTwoPlayer) {
                  useGameStore.setState({ currentView: 'waiting', waitingMode: 'post-r2' })
                } else {
                  useGameStore.setState({ leaderboardInitialTab: 'overall', leaderboardInitialSection: 'teams' })
                  setView('leaderboard')
                }
              }}
              className="w-full h-14 text-lg bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Rocket className="w-5 h-5 mr-2" />
              {!!(currentTeam && currentTeam.player2Name) ? 'Continue to Waiting Room' : 'View Leaderboard'}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Tab switch yellow warning overlay — requires manual dismiss
  if (showTabWarning) {
    return (
      <div className="fixed inset-0 z-[100] bg-yellow-400/95 flex items-center justify-center">
        <div className="text-center space-y-6 p-8 max-w-md">
          <AlertTriangle className="w-20 h-20 text-yellow-900 mx-auto animate-bounce" />
          <h1 className="text-4xl font-black text-yellow-900">TAB SWITCH DETECTED</h1>
          <p className="text-2xl font-bold text-yellow-900">
            Tab Switch Warning {tabWarningCount}
          </p>
          <p className="text-lg text-yellow-800">
            This incident has been reported to the admin.
          </p>
          {tabWarningCount >= maxViolations && (
            <p className="text-xl font-bold text-red-800 bg-red-200 rounded-lg px-4 py-2">
              Next violation will result in DISQUALIFICATION!
            </p>
          )}
          <Button
            onClick={() => setShowTabWarning(false)}
            className="w-full h-12 text-lg bg-yellow-900 text-yellow-100 hover:bg-yellow-800 font-bold"
          >
            I Understand — Continue
          </Button>
        </div>
      </div>
    )
  }

  // Fullscreen violation — red frozen screen
  if (showFullscreenPrompt && isFullscreenViolation) {
    return (
      <div className="fixed inset-0 z-[100] bg-red-900/98 flex items-center justify-center p-6">
        <div className="text-center space-y-6 max-w-lg">
          <XCircle className="w-24 h-24 text-red-300 mx-auto animate-pulse" />
          <h1 className="text-4xl font-black text-white">SCREEN FROZEN</h1>
          <p className="text-xl text-red-200">
            You exited fullscreen mode. Your session is paused and this violation has been reported to the admin.
          </p>
          <div className="bg-red-800/60 rounded-xl p-4 border border-red-500 space-y-1">
            <p className="text-red-100 font-semibold">
              Tab switches: {tabSwitchCount2}
            </p>
            <p className="text-red-100 font-semibold">
              Fullscreen exits: {fullScrnExitCount2}
            </p>
            <p className="text-red-200 text-sm">
              Timer is paused while fullscreen is inactive.
            </p>
          </div>
          {(tabSwitchCount2 >= maxViolations || fullScrnExitCount2 >= maxViolations) && (
            <p className="text-lg font-bold text-yellow-300 bg-yellow-900/40 rounded-lg px-4 py-2 border border-yellow-600">
              One more violation = DISQUALIFICATION
            </p>
          )}
          <Button
            onClick={enterFullscreen}
            className="w-full h-14 text-lg bg-white text-red-900 hover:bg-red-50 font-bold"
          >
            <Maximize className="w-5 h-5 mr-2" />
            Return to Fullscreen to Continue
          </Button>
        </div>
      </div>
    )
  }

  // Fullscreen prompt — compact warning modal (matches Round 1 style)
  if (showFullscreenPrompt) {
    return (
      <div className="min-h-screen bg-r2-bg flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-r2-border bg-r2-card shadow-xl shadow-black/30">
          <CardHeader className="text-center pb-4">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-neon-yellow/20 border border-neon-yellow/30 flex items-center justify-center">
              <Shield className="w-7 h-7 text-neon-yellow" />
            </div>
            <CardTitle className="text-xl text-foreground">Proctored Environment</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Read all warnings before you begin</p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Round Info</p>
              <div className="grid grid-cols-1 gap-1.5 text-sm text-foreground">
                <div className="flex items-center gap-2.5 bg-black/30 rounded-lg px-3 py-2">
                  <Clock className="w-3.5 h-3.5 text-neon-yellow shrink-0" />
                  <span>30 minutes · 10 SQL challenges</span>
                </div>
                <div className="flex items-center gap-2.5 bg-black/30 rounded-lg px-3 py-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-neon-green shrink-0" />
                  <span>Navigate freely between challenges</span>
                </div>
                <div className="flex items-center gap-2.5 bg-black/30 rounded-lg px-3 py-2">
                  <Maximize className="w-3.5 h-3.5 text-neon-yellow shrink-0" />
                  <span>Fullscreen is mandatory throughout</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-destructive/30 bg-destructive/8 p-4 space-y-2.5">
              <p className="text-xs font-bold text-destructive flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5" />
                Proctoring Rules
              </p>
              <ul className="space-y-2 text-xs text-foreground">
                <li className="flex items-start gap-2.5">
                  <span className="shrink-0 mt-0.5 w-4 h-4 rounded-full bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center text-[9px] font-bold text-yellow-400">1</span>
                  <span><span className="text-yellow-400 font-semibold">Tab switch:</span> Yellow warning screen. Limit exceeded = disqualification.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="shrink-0 mt-0.5 w-4 h-4 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center text-[9px] font-bold text-red-400">2</span>
                  <span><span className="text-red-400 font-semibold">Fullscreen exit:</span> Screen freezes. Limit exceeded = disqualification.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="shrink-0 mt-0.5 w-4 h-4 rounded-full bg-destructive/20 border border-destructive/50 flex items-center justify-center text-[9px] font-bold text-destructive">3</span>
                  <span><span className="text-destructive font-semibold">Disqualification:</span> Exceeding either limit = instant DQ.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="shrink-0 mt-0.5 w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground">4</span>
                  <span>Copy, paste, and right-click are disabled.</span>
                </li>
              </ul>
            </div>

            {currentPlayer?.isDisqualified ? (
              <div className="space-y-2">
                <p className="text-center text-sm text-destructive font-semibold">You have been disqualified from this round.</p>
                <Button
                  variant="ghost"
                  onClick={logout}
                  className="w-full h-11 text-muted-foreground hover:text-foreground text-sm"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <>
                <Button
                  onClick={enterFullscreen}
                  className="w-full h-11 bg-neon-blue text-white hover:bg-neon-blue/90 font-semibold shadow-md shadow-neon-blue/20"
                >
                  <Maximize className="w-4 h-4 mr-2" />
                  Start
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setView('dashboard')}
                  className="w-full text-muted-foreground hover:text-foreground text-sm"
                >
                  Cancel
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Submit Confirmation Modal (also used as loading overlay while processing)
  if (showFinalSubmit || isSubmitting) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <Card className="max-w-md w-full border-accent/30 bg-card">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-foreground">
              {isSubmitting ? 'Scoring Your Answers...' : 'Submit All Answers?'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isSubmitting ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-12 h-12 mx-auto rounded-full border-4 border-neon-green/30 border-t-neon-green animate-spin" />
                <p className="text-muted-foreground text-sm">Running all test cases — please wait…</p>
              </div>
            ) : (
              <>
                <div className="text-center text-muted-foreground">
                  <p>You have answered {answeredCount} of {safeChallenges.length} questions.</p>
                  {answeredCount < safeChallenges.length && (
                    <p className="text-neon-orange mt-2">
                      {safeChallenges.length - answeredCount} questions are unanswered!
                    </p>
                  )}
                  <p className="text-sm mt-4 text-primary">
                    Your score will be calculated and shown after submission.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowFinalSubmit(false)}
                    className="flex-1"
                  >
                    Review Answers
                  </Button>
                  <Button
                    onClick={handleFinalSubmit}
                    disabled={isSubmitting}
                    className="flex-1 bg-neon-green text-background hover:bg-neon-green/90"
                  >
                    Submit All
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-r2-bg select-none flex flex-col">
      {/* Header */}
      <header className="border-b border-r2-border/50 bg-r2-card/50 backdrop-blur-sm sticky top-0 z-50 shrink-0">
        <div className="flex items-center justify-between px-4 py-3 max-w-[1600px] mx-auto">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Target className="w-6 h-6 text-neon-yellow" />
              <div>
                <p className="font-semibold text-foreground">Challenge {currentQuestionIndex + 1}/{safeChallenges.length}</p>
                <p className="text-xs text-muted-foreground">{currentChallenge.title}</p>
              </div>
            </div>
            
            <Badge variant="outline" className={getDifficultyColor(currentChallenge.difficulty)}>
              {currentChallenge.difficulty.toUpperCase()}
            </Badge>
            
            <Badge className="bg-muted text-muted-foreground border-0">
              <FlaskConical className="w-3 h-3 mr-1" />
              {safeTestCases.length} tests
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right mr-2">
              <p className="text-xs text-muted-foreground">Answered</p>
              <p className="font-bold text-primary">{answeredCount}/{safeChallenges.length}</p>
            </div>

            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
              tabSwitchCount2 > maxViolations || fullScrnExitCount2 > maxViolations ? 'bg-destructive/20 text-destructive' : 'bg-muted text-foreground'
            }`}>
              <AlertTriangle className="w-4 h-4" />
              Tabs {tabSwitchCount2} · FS {fullScrnExitCount2}
            </div>

            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg ${
              timeRemaining <= 60 
                ? 'bg-destructive/20 text-destructive animate-pulse' 
                : timeRemaining <= 300 
                  ? 'bg-neon-orange/20 text-neon-orange'
                  : 'bg-neon-yellow/20 text-neon-yellow'
            }`}>
              <Clock className="w-5 h-5" />
              {formatTime(timeRemaining)}
            </div>
          </div>
        </div>
        <Progress value={progress} className="h-1" />
      </header>

      {/* Main Content - LeetCode Style Layout */}
      <div className="flex-1 flex gap-0 overflow-hidden">
        {/* Left Panel - Problem Description & Question Nav */}
        <div className="w-[420px] shrink-0 flex flex-col border-r border-r2-border/50 overflow-hidden bg-r2-card/30">
          {/* Question Navigator - Grouped by Difficulty */}
          <div className="p-3 border-b border-r2-border/50 bg-r2-card/50 space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Questions ({answeredCount}/{safeChallenges.length})</p>
            
            {/* Easy SQL group */}
            {(() => {
              const easyQs = safeChallenges.map((q, i) => ({ q, i })).filter(({ q }) => q.difficulty === 'easy')
              const easyAnswered = easyQs.filter(({ i }) => answers[i]?.code.trim()).length
              if (easyQs.length === 0) return null
              return (
                <div className="rounded-lg border border-neon-green/20 bg-neon-green/5 p-2 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-neon-green shrink-0"></div>
                    <span className="text-[10px] font-bold text-neon-green uppercase tracking-wider">Easy</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">{easyAnswered}/{easyQs.length} done</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {easyQs.map(({ q, i }) => {
                      const hasAnswer = answers[i]?.code.trim()
                      const hasResults = answers[i]?.testResults.length > 0
                      const isCurrent = i === currentQuestionIndex
                      return (
                        <button
                          key={`easy-${q.id}`}
                          onClick={() => handleNavigate(i)}
                          title={`Q${i + 1}${hasAnswer ? ' (written)' : ''}`}
                          className={`size-6 shrink-0 rounded-md flex items-center justify-center font-medium text-[10px] transition-all duration-150 border ${
                            isCurrent
                              ? 'bg-neon-blue text-white border-neon-blue shadow-[inset_0_0_0_2px_rgba(255,255,255,0.25)]'
                              : hasAnswer
                                ? hasResults
                                  ? 'bg-neon-green/25 text-neon-green border-neon-green/60 hover:bg-neon-green/35'
                                  : 'bg-neon-orange/25 text-neon-orange border-neon-orange/60 hover:bg-neon-orange/35'
                                : 'bg-muted/60 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground'
                          }`}
                        >
                          {i + 1}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })()}

            {/* Medium SQL group */}
            {(() => {
              const medQs = safeChallenges.map((q, i) => ({ q, i })).filter(({ q }) => q.difficulty === 'medium')
              const medAnswered = medQs.filter(({ i }) => answers[i]?.code.trim()).length
              if (medQs.length === 0) return null
              return (
                <div className="rounded-lg border border-neon-orange/20 bg-neon-orange/5 p-2 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-neon-orange shrink-0"></div>
                    <span className="text-[10px] font-bold text-neon-orange uppercase tracking-wider">Medium</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">{medAnswered}/{medQs.length} done</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {medQs.map(({ q, i }) => {
                      const hasAnswer = answers[i]?.code.trim()
                      const hasResults = answers[i]?.testResults.length > 0
                      const isCurrent = i === currentQuestionIndex
                      return (
                        <button
                          key={`med-${q.id}`}
                          onClick={() => handleNavigate(i)}
                          title={`Q${i + 1}${hasAnswer ? ' (written)' : ''}`}
                          className={`size-6 shrink-0 rounded-md flex items-center justify-center font-medium text-[10px] transition-all duration-150 border ${
                            isCurrent
                              ? 'bg-neon-blue text-white border-neon-blue shadow-[inset_0_0_0_2px_rgba(255,255,255,0.25)]'
                              : hasAnswer
                                ? hasResults
                                  ? 'bg-neon-green/25 text-neon-green border-neon-green/60 hover:bg-neon-green/35'
                                  : 'bg-neon-orange/25 text-neon-orange border-neon-orange/60 hover:bg-neon-orange/35'
                                : 'bg-muted/60 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground'
                          }`}
                        >
                          {i + 1}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })()}

            {/* Hard SQL group */}
            {(() => {
              const hardQs = safeChallenges.map((q, i) => ({ q, i })).filter(({ q }) => q.difficulty === 'hard')
              const hardAnswered = hardQs.filter(({ i }) => answers[i]?.code.trim()).length
              if (hardQs.length === 0) return null
              return (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-2 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-destructive shrink-0"></div>
                    <span className="text-[10px] font-bold text-destructive uppercase tracking-wider">Hard</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">{hardAnswered}/{hardQs.length} done</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {hardQs.map(({ q, i }) => {
                      const hasAnswer = answers[i]?.code.trim()
                      const hasResults = answers[i]?.testResults.length > 0
                      const isCurrent = i === currentQuestionIndex
                      return (
                        <button
                          key={`hard-${q.id}`}
                          onClick={() => handleNavigate(i)}
                          title={`Q${i + 1}${hasAnswer ? ' (written)' : ''}`}
                          className={`size-6 shrink-0 rounded-md flex items-center justify-center font-medium text-[10px] transition-all duration-150 border ${
                            isCurrent
                              ? 'bg-neon-blue text-white border-neon-blue shadow-[inset_0_0_0_2px_rgba(255,255,255,0.25)]'
                              : hasAnswer
                                ? hasResults
                                  ? 'bg-neon-green/25 text-neon-green border-neon-green/60 hover:bg-neon-green/35'
                                  : 'bg-destructive/25 text-destructive border-destructive/60 hover:bg-destructive/35'
                                : 'bg-muted/60 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground'
                          }`}
                        >
                          {i + 1}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })()}

            {/* Legend */}
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-1 border-t border-border/30">
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded bg-neon-green/20 border border-neon-green/40"></div>
                <span>Tested</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded bg-neon-blue"></div>
                <span>Current</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded bg-muted/60"></div>
                <span>Empty</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-4">
            {/* Problem Title & Description */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">{currentChallenge.title}</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{currentChallenge.scenario}</p>
            </div>

            {/* Mission */}
            <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
              <p className="text-xs font-medium text-primary mb-1">Your Mission:</p>
              <p className="text-sm text-foreground whitespace-pre-line">{currentChallenge.description}</p>
            </div>

            {/* Schema */}
            {(() => {
              const parsedTables = (currentChallenge.schema || '')
                .split(/;?\s*CREATE\s+TABLE\s+/i)
                .filter(Boolean)
                .map(block => {
                  const match = block.match(/^(\w+)\s*\(([^)]+)\)/i)
                  if (!match) return null
                  const tableName = match[1]
                  const cols = match[2].split(',').map(c => {
                    const parts = c.trim().split(/\s+/)
                    return { name: parts[0], type: parts.slice(1).join(' ') || 'TEXT' }
                  }).filter(c => c.name)
                  return { tableName, cols }
                })
                .filter(Boolean)
              if (parsedTables.length === 0) return null
              return (
                <div className="space-y-2">
                  {parsedTables.map((tbl, i) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Schema: <span className="text-accent font-mono">{tbl!.tableName}</span></p>
                      <div className="font-mono text-sm">
                        <div className="flex gap-6 text-xs text-muted-foreground mb-1 border-b border-border/30 pb-1">
                          <span className="w-32">Column</span>
                          <span>Type</span>
                        </div>
                        {tbl!.cols.map((col, j) => (
                          <div key={j} className="flex gap-6 py-0.5">
                            <span className="w-32 text-foreground">{col.name}</span>
                            <span className="text-accent/80 uppercase text-xs mt-0.5">{col.type}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}

          </div>
        </div>

        {/* Right Panel - Code Editor & Test Cases */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Code Editor */}
          <div className="h-[40%] min-h-[200px] flex flex-col border-b border-border/50">
            <div className="flex items-center justify-between px-4 py-2 bg-card/50 border-b border-border/50">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium text-foreground">SQL Query</span>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={handleRun}
                  disabled={isRunning || !currentAnswer.code.trim()}
                  className="border-neon-green/50 text-neon-green hover:bg-neon-green/10"
                >
                  <Play className="w-4 h-4 mr-1" />
                  {isRunning ? 'Running...' : 'Run Tests'}
                </Button>
              </div>
            </div>
            <div className="flex-1 p-4">
              <textarea
                value={currentAnswer.code}
                onChange={(e) => updateCode(e.target.value)}
                placeholder="-- Write your SQL query here...&#10;-- Your output will be compared with the expected result"
                className="w-full h-full p-3 rounded-lg bg-dark-surface border border-border/50 font-mono text-sm text-neon-violet placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:border-primary/50"
                spellCheck={false}
              />
            </div>
          </div>

          {/* Test Cases Panel */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'testcases' | 'result')} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <TabsList className="w-full justify-start rounded-none border-b border-border/50 bg-card/50 px-4 shrink-0">
                <TabsTrigger value="testcases" className="data-[state=active]:bg-accent/20">
                  <FlaskConical className="w-4 h-4 mr-2" />
                  Test Cases
                </TabsTrigger>
                <TabsTrigger value="result" className="data-[state=active]:bg-accent/20">
                  <Database className="w-4 h-4 mr-2" />
                  Results
                  {currentAnswer.testResults.length > 0 && (
                    <Badge className="ml-2 text-xs" variant="outline">
                      {currentAnswer.testResults.filter(r => r.passed).length}/{currentAnswer.testResults.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="testcases" className="flex-1 m-0 p-4 overflow-y-auto min-h-0">
                <div className="flex gap-4 h-full">
                  {/* Test Case List */}
                  <div className="w-64 shrink-0 space-y-2 overflow-y-auto pr-2">
                    <p className="text-xs text-muted-foreground font-medium mb-2 flex items-center gap-2">
                      <Eye className="w-3 h-3" />
                      Visible Tests ({visibleTestCases.length})
                    </p>
                    {visibleTestCases.map((tc) => (
                      <TestCaseCard
                        key={tc.id}
                        testCase={tc}
                        result={currentAnswer.testResults.find(r => r.testCaseId === tc.id)}
                        isActive={activeTestCase === safeTestCases.indexOf(tc)}
                        onClick={() => setActiveTestCase(safeTestCases.indexOf(tc))}
                        showDetails={true}
                      />
                    ))}
                    
                    {hiddenTestCases.length > 0 && (
                      <>
                        <p className="text-xs text-muted-foreground font-medium mt-4 mb-2 flex items-center gap-2">
                          <EyeOff className="w-3 h-3" />
                          Edge Cases ({hiddenTestCases.length})
                        </p>
                        {hiddenTestCases.map((tc) => (
                          <TestCaseCard
                            key={tc.id}
                            testCase={tc}
                            result={currentAnswer.testResults.find(r => r.testCaseId === tc.id)}
                            isActive={activeTestCase === safeTestCases.indexOf(tc)}
                            onClick={() => setActiveTestCase(safeTestCases.indexOf(tc))}
                            showDetails={false}
                          />
                        ))}
                      </>
                    )}
                  </div>

                  {/* Test Case Details */}
                  <div className="flex-1 space-y-3 overflow-y-auto">
                    {currentTestCase && !currentTestCase.isHidden ? (
                      <>
                        <div>
                          <p className="text-sm font-medium text-foreground mb-2">Input Data</p>
                          <div className="space-y-2">
                            {(currentTestCase?.tableData ?? []).map((table, idx) => (
                              <DataTable key={idx} tableData={table} />
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground mb-2">Expected Output</p>
                          {(() => {
                            // Use computed expected output if available, otherwise fall back to stored values
                            const key = currentChallenge ? `${currentChallenge.id}-${currentTestCase.id}` : ''
                            const computed = computedExpectedOutputs[key]
                            const columns = computed?.columns?.length ? computed.columns : currentTestCase.expectedColumns
                            const rows = computed?.rows?.length ? computed.rows : currentTestCase.expectedOutput
                            return (
                              <OutputTable 
                                columns={columns}
                                rows={rows}
                                variant="expected"
                              />
                            )
                          })()}
                          {isComputingExpected && <p className="text-xs text-muted-foreground mt-1">Computing expected output...</p>}
                        </div>
                      </>
                    ) : currentTestCase?.isHidden ? (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <Lock className="w-12 h-12 mb-4 opacity-30" />
                        <p className="text-sm font-medium">Edge Case (Hidden)</p>
                        <p className="text-xs">Input and expected output are hidden for this test</p>
                        <p className="text-xs text-neon-orange mt-2">These carry more weightage!</p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <p>Select a test case to view details</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="result" className="flex-1 m-0 p-4 overflow-y-auto min-h-0">
                {currentAnswer.testResults.length > 0 ? (
                  <div className="space-y-4">
                    {/* Run Results */}
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
                      <FlaskConical className="w-5 h-5 text-accent" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">Test Results</p>
                        <p className="text-xs text-muted-foreground">
                          {currentAnswer.testResults.filter(r => r.passed).length}/{currentAnswer.testResults.length} test cases passed
                        </p>
                      </div>
                      <Badge variant="outline" className={currentAnswer.testResults.every(r => r.passed) ? 'border-neon-green text-neon-green' : 'border-neon-orange text-neon-orange'}>
                        {currentAnswer.testResults.every(r => r.passed) ? 'All Passed' : 'Some Failed'}
                      </Badge>
                    </div>

                    {/* Test Results */}
                    <div className="space-y-3">
                      {visibleTestCases.map((tc) => {
                        const result = currentAnswer.testResults.find(r => r.testCaseId === tc.id)
                        if (!result) return null
                        return (
                          <Card key={tc.id} className={`border ${result.passed ? 'border-neon-green/50' : 'border-destructive/50'}`}>
                            <CardContent className="p-3">
                              <div className="flex items-center gap-2 mb-3">
                                {result.passed ? (
                                  <CheckCircle2 className="w-4 h-4 text-neon-green" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-destructive" />
                                )}
                                <span className="text-sm font-medium">{tc.name}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Expected Output:</p>
                                  {(() => {
                                    // Use computed expected output if available
                                    const key = currentChallenge ? `${currentChallenge.id}-${tc.id}` : ''
                                    const computed = computedExpectedOutputs[key]
                                    const columns = computed?.columns?.length ? computed.columns : tc.expectedColumns
                                    const rows = computed?.rows?.length ? computed.rows : tc.expectedOutput
                                    return (
                                      <OutputTable 
                                        columns={columns}
                                        rows={rows.slice(0, 5)}
                                        variant="expected"
                                      />
                                    )
                                  })()}
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Your Output:</p>
                                  <OutputTable 
                                    columns={tc.expectedColumns}
                                    rows={result.actualOutput?.slice(0, 5) || []}
                                    variant={result.passed ? 'correct' : 'wrong'}
                                  />
                                </div>
                              </div>
                              {result.error && !result.passed && (
                                <p className="text-xs text-destructive mt-2">{result.error}</p>
                              )}
                            </CardContent>
                          </Card>
                        )
                      })}
                      
                      {/* Hidden test results summary */}
                      {hiddenTestCases.length > 0 && (
                        <Card className="border border-border/50">
                          <CardContent className="p-3">
                            <div className="flex items-center gap-2">
                              <Lock className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm font-medium">Edge Cases</span>
                              <Badge variant="outline" className="ml-auto">
                                {currentAnswer.testResults.filter(r => hiddenTestCases.some(tc => tc.id === r.testCaseId) && r.passed).length}/{hiddenTestCases.length} passed
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Edge case details are hidden to test your solution robustness</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Database className="w-12 h-12 mb-4 opacity-30" />
                    <p className="text-sm">Run your query to see test results</p>
                    <p className="text-xs mt-1">Your output will be compared with expected results</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <footer className="border-t border-border/50 bg-card/50 px-4 py-3 shrink-0">
        <div className="flex items-center justify-between max-w-[1600px] mx-auto">
          <Button
            variant="outline"
            onClick={() => handleNavigate(currentQuestionIndex - 1)}
            disabled={currentQuestionIndex === 0}
            className="border-border/50"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            {currentQuestionIndex < safeChallenges.length - 1 ? (
              <Button
                onClick={() => handleNavigate(currentQuestionIndex + 1)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : null}
            
            <Button
              onClick={() => setShowFinalSubmit(true)}
              className="bg-neon-green text-background hover:bg-neon-green/90"
            >
              <Send className="w-4 h-4 mr-2" />
              Submit All
            </Button>
          </div>
        </div>
      </footer>
    </div>
  )
}
