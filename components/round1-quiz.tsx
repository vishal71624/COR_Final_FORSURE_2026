'use client'

import { useState, useEffect, useCallback } from 'react'
import { useGameStore } from '@/lib/game-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Maximize,
  Database,
  Shield,
  ChevronLeft,
  ChevronRight,
  Send,
  XCircle
} from 'lucide-react'
import { QueryScenarioRenderer } from '@/components/query-scenario-renderer'

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case 'easy': return 'text-neon-green border-neon-green/50 bg-neon-green/10'
    case 'medium': return 'text-neon-orange border-neon-orange/50 bg-neon-orange/10'
    case 'hard': return 'text-destructive border-destructive/50 bg-destructive/10'
    default: return 'text-primary border-primary/50'
  }
}

export function Round1Quiz() {
  const {
    currentPlayer,
    currentQuestionIndex,
    timeRemaining,
    round1Questions,
    tabSwitchCount,
    fullScrnExitCount,
    maxViolations,
    saveAnswer,
    goToQuestion,
    submitRound1,
    recordTabSwitch1,
    recordFullscreenExit1,
    recordWindowButton1,
    setFullscreen,
    updateTimer,
    setView,
    addViolation,
    saveR1Checkpoint
  } = useGameStore()

  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(true)
  const [isFullscreenViolation, setIsFullscreenViolation] = useState(false)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [showTabWarning, setShowTabWarning] = useState(false)
  const [tabWarningCount, setTabWarningCount] = useState(0)

  const currentQuestion = round1Questions[currentQuestionIndex]
  const selectedAnswer = currentPlayer?.round1Answers[currentQuestion?.id]
  const answeredCount = Object.keys(currentPlayer?.round1Answers || {}).length

  // Timer
  useEffect(() => {
    if (showFullscreenPrompt) return

    const timer = setInterval(() => {
      if (timeRemaining <= 1) {
        submitRound1()
        clearInterval(timer)
      } else {
        updateTimer(timeRemaining - 1)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [timeRemaining, showFullscreenPrompt, updateTimer, submitRound1])

  // Periodic 10-second checkpoint sync to DB
  useEffect(() => {
    if (showFullscreenPrompt) return
    const interval = setInterval(() => {
      saveR1Checkpoint()
    }, 10000)
    return () => clearInterval(interval)
  }, [showFullscreenPrompt, saveR1Checkpoint])

  // Tab switch detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !showFullscreenPrompt) {
        const canContinue = recordTabSwitch1()
        const newCount = tabSwitchCount + 1

        if (!canContinue) {
          setView('dashboard')
          return
        }

        setTabWarningCount(newCount)
        setShowTabWarning(true)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [showFullscreenPrompt, recordTabSwitch1, setView, tabSwitchCount])

  // Fullscreen detection
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFS = !!document.fullscreenElement
      setFullscreen(isFS)
      if (!isFS && !showFullscreenPrompt) {
        addViolation('Exited fullscreen mode')
        const canContinue = recordFullscreenExit1()
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
  }, [showFullscreenPrompt, setFullscreen, addViolation, recordFullscreenExit1, setView])

  // Block copy/paste
  useEffect(() => {
    const handleCopy = (e: ClipboardEvent) => { e.preventDefault() }
    const handlePaste = (e: ClipboardEvent) => { e.preventDefault() }
    const handleContextMenu = (e: MouseEvent) => { e.preventDefault() }

    document.addEventListener('copy', handleCopy)
    document.addEventListener('paste', handlePaste)
    document.addEventListener('contextmenu', handleContextMenu)

    return () => {
      document.removeEventListener('copy', handleCopy)
      document.removeEventListener('paste', handlePaste)
      document.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [])

  // Detect Windows/Meta key presses
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Meta' || e.key === 'OS' || e.code === 'MetaLeft' || e.code === 'MetaRight') {
        e.preventDefault()
        addViolation('Windows/Meta key pressed')
        const canContinue = recordWindowButton1()
        if (!canContinue) {
          setView('dashboard')
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [addViolation, recordWindowButton1, setView])

  const enterFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen()
    } catch {
      // fallback — proceed anyway
    }
    setIsFullscreenViolation(false)
    setShowFullscreenPrompt(false)
  }, [])

  const handleSelectAnswer = (answerIndex: number) => {
    if (currentQuestion) {
      saveAnswer(currentQuestion.id, answerIndex)
    }
  }

  const handleSubmit = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    }
    submitRound1()
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">No questions available</p>
      </div>
    )
  }

  // Tab switch yellow warning overlay
  if (showTabWarning) {
    return (
      <div className="fixed inset-0 z-[100] bg-yellow-400/97 flex items-center justify-center p-6">
        <div className="text-center space-y-5 max-w-sm w-full">
          <AlertTriangle className="w-16 h-16 text-yellow-900 mx-auto animate-bounce" />
          <div>
            <h1 className="text-3xl font-black text-yellow-900">TAB SWITCH DETECTED</h1>
            <p className="text-lg font-bold text-yellow-800 mt-1">
              Warning {tabWarningCount}
            </p>
          </div>
          <p className="text-yellow-800 text-sm">
            This incident has been reported to the admin.
          </p>
          {tabWarningCount >= maxViolations && (
            <div className="bg-red-800/20 border border-red-700 rounded-xl px-4 py-3">
              <p className="text-sm font-bold text-red-800">
                ⚠ Next violation will result in DISQUALIFICATION
              </p>
            </div>
          )}
          <Button
            onClick={() => setShowTabWarning(false)}
            className="w-full h-12 text-base bg-yellow-900 text-yellow-100 hover:bg-yellow-800 font-bold rounded-xl"
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
      <div className="fixed inset-0 z-[100] bg-red-950 flex items-center justify-center p-6">
        <div className="text-center space-y-5 max-w-md w-full">
          <XCircle className="w-20 h-20 text-red-400 mx-auto animate-pulse" />
          <div>
            <h1 className="text-3xl font-black text-white">SCREEN FROZEN</h1>
            <p className="text-red-300 mt-2 text-sm">
              You exited fullscreen. Your session is paused and this violation has been reported.
            </p>
          </div>
          <div className="bg-red-900/60 rounded-xl p-4 border border-red-700/50 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-red-300">Tab switches</span>
              <span className={`font-bold ${tabSwitchCount >= maxViolations ? 'text-red-400' : 'text-red-200'}`}>
                {tabSwitchCount}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-red-300">Fullscreen exits</span>
              <span className={`font-bold ${fullScrnExitCount >= maxViolations ? 'text-red-400' : 'text-red-200'}`}>
                {fullScrnExitCount}
              </span>
            </div>
            <p className="text-xs text-red-400 pt-1 border-t border-red-800">
              Timer is paused while fullscreen is inactive
            </p>
          </div>
          {(tabSwitchCount >= maxViolations || fullScrnExitCount >= maxViolations) && (
            <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-lg px-4 py-2.5">
              <p className="text-sm font-bold text-yellow-300">One more violation = DISQUALIFICATION</p>
            </div>
          )}
          <Button
            onClick={enterFullscreen}
            className="w-full h-12 text-base bg-white text-red-900 hover:bg-red-50 font-bold rounded-xl"
          >
            <Maximize className="w-4 h-4 mr-2" />
            Return to Fullscreen to Continue
          </Button>
        </div>
      </div>
    )
  }

  // Initial fullscreen prompt
  if (showFullscreenPrompt) {
    return (
      <div className="min-h-screen bg-r1-bg flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-r1-border bg-r1-card shadow-xl shadow-black/30">
          <CardHeader className="text-center pb-4">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-neon-red/20 border border-neon-red/30 flex items-center justify-center">
              <Shield className="w-7 h-7 text-neon-red" />
            </div>
            <CardTitle className="text-xl text-foreground">Proctored Environment</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Read all warnings before you begin</p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Round Info</p>
              <div className="grid grid-cols-1 gap-1.5 text-sm text-foreground">
                <div className="flex items-center gap-2.5 bg-black/30 rounded-lg px-3 py-2">
                  <Clock className="w-3.5 h-3.5 text-neon-red shrink-0" />
                  <span>45 minutes · 30 questions</span>
                </div>
                <div className="flex items-center gap-2.5 bg-black/30 rounded-lg px-3 py-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-neon-green shrink-0" />
                  <span>Navigate freely between questions</span>
                </div>
                <div className="flex items-center gap-2.5 bg-black/30 rounded-lg px-3 py-2">
                  <Maximize className="w-3.5 h-3.5 text-neon-red shrink-0" />
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
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-r1-bg select-none flex flex-col relative">
      <div className="fixed inset-0 bg-grid-r1 [mask-image:radial-gradient(ellipse_90%_50%_at_50%_0%,black_40%,transparent_100%)] opacity-30 pointer-events-none" />
      <div className="fixed top-0 left-0 w-[400px] h-[400px] bg-neon-red/15 rounded-full blur-[130px] pointer-events-none" />
      {/* Header */}
      <header className="border-b border-r1-border/40 bg-r1-bg/60 backdrop-blur-md sticky top-0 z-50 shrink-0 relative">
        <div className="flex items-center justify-between px-4 py-2.5 max-w-6xl mx-auto">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-neon-red" />
            <div>
              <p className="font-semibold text-sm text-foreground">Round 1 — Scenario Challenge</p>
              <p className="text-[10px] text-muted-foreground">
                {answeredCount} of {round1Questions.length} answered
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Violation indicator */}
            <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${
              tabSwitchCount > maxViolations || fullScrnExitCount > maxViolations
                ? 'bg-destructive/15 border-destructive/40 text-destructive'
                : tabSwitchCount > 0 || fullScrnExitCount > 0
                  ? 'bg-neon-orange/10 border-neon-orange/30 text-neon-orange'
                  : 'bg-muted border-border/50 text-muted-foreground'
            }`}>
              <AlertTriangle className="w-3 h-3" />
              <span>T:{tabSwitchCount}</span>
              <span className="opacity-50">·</span>
              <span>FS:{fullScrnExitCount}</span>
            </div>

            {/* Timer */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-sm font-bold ${
              timeRemaining <= 60
                ? 'bg-destructive/20 text-destructive animate-pulse'
                : timeRemaining <= 300
                  ? 'bg-neon-orange/15 text-neon-orange'
                  : 'bg-neon-red/15 text-neon-red'
            }`}>
              <Clock className="w-4 h-4" />
              {formatTime(timeRemaining)}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row gap-3 p-3 max-w-6xl mx-auto w-full">

        {/* Question Navigator — Sidebar */}
        <div className="lg:w-72 shrink-0">
          <Card className="border-border/50 bg-card/80 lg:sticky lg:top-[57px]">
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Questions — {answeredCount}/{round1Questions.length} answered
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 space-y-3">
              {/* Easy — MCQ group */}
              {(() => {
                const easyQs = round1Questions.map((q, i) => ({ q, i })).filter(({ q }) => q.difficulty === 'easy')
                const easyAnswered = easyQs.filter(({ q }) => currentPlayer?.round1Answers[q.id] !== undefined).length
                return (
                  <div className="rounded-lg border border-neon-green/20 bg-neon-green/5 p-2 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-neon-green shrink-0"></div>
                      <span className="text-[10px] font-bold text-neon-green uppercase tracking-wider">Easy — MCQ</span>
                      <span className="text-[10px] text-muted-foreground ml-auto">{easyAnswered}/{easyQs.length} done</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {easyQs.map(({ q, i }) => {
                        const isAnswered = currentPlayer?.round1Answers[q.id] !== undefined
                        const isCurrent = i === currentQuestionIndex
                        return (
                          <button
                            key={`easy-${q.id}`}
                            onClick={() => goToQuestion(i)}
                            title={`Q${i + 1}${isAnswered ? ' (answered)' : ''}`}
                            className={`size-6 shrink-0 rounded-md flex items-center justify-center font-medium text-[10px] transition-all duration-150 border ${
                              isCurrent
                                ? 'bg-primary text-primary-foreground border-primary shadow-[inset_0_0_0_2px_rgba(255,255,255,0.25)]'
                                : isAnswered
                                  ? 'bg-neon-green/25 text-neon-green border-neon-green/60 hover:bg-neon-green/35'
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

              {/* Medium — Query Based group */}
              {(() => {
                const medQs = round1Questions.map((q, i) => ({ q, i })).filter(({ q }) => q.difficulty === 'medium')
                const medAnswered = medQs.filter(({ q }) => currentPlayer?.round1Answers[q.id] !== undefined).length
                return (
                  <div className="rounded-lg border border-neon-orange/20 bg-neon-orange/5 p-2 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-neon-orange shrink-0"></div>
                      <span className="text-[10px] font-bold text-neon-orange uppercase tracking-wider">Medium — Query</span>
                      <span className="text-[10px] text-muted-foreground ml-auto">{medAnswered}/{medQs.length} done</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {medQs.map(({ q, i }) => {
                        const isAnswered = currentPlayer?.round1Answers[q.id] !== undefined
                        const isCurrent = i === currentQuestionIndex
                        return (
                          <button
                            key={`med-${q.id}`}
                            onClick={() => goToQuestion(i)}
                            title={`Q${i + 1}${isAnswered ? ' (answered)' : ''}`}
                            className={`size-6 shrink-0 rounded-md flex items-center justify-center font-medium text-[10px] transition-all duration-150 border ${
                              isCurrent
                                ? 'bg-primary text-primary-foreground border-primary shadow-[inset_0_0_0_2px_rgba(255,255,255,0.25)]'
                                : isAnswered
                                  ? 'bg-neon-orange/25 text-neon-orange border-neon-orange/60 hover:bg-neon-orange/35'
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

              {/* Hard — Scenario Based group */}
              {(() => {
                const hardQs = round1Questions.map((q, i) => ({ q, i })).filter(({ q }) => q.difficulty === 'hard')
                const hardAnswered = hardQs.filter(({ q }) => currentPlayer?.round1Answers[q.id] !== undefined).length
                return (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-2 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-destructive shrink-0"></div>
                      <span className="text-[10px] font-bold text-destructive uppercase tracking-wider">Hard — Scenario</span>
                      <span className="text-[10px] text-muted-foreground ml-auto">{hardAnswered}/{hardQs.length} done</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {hardQs.map(({ q, i }) => {
                        const isAnswered = currentPlayer?.round1Answers[q.id] !== undefined
                        const isCurrent = i === currentQuestionIndex
                        return (
                          <button
                            key={`hard-${q.id}`}
                            onClick={() => goToQuestion(i)}
                            title={`Q${i + 1}${isAnswered ? ' (answered)' : ''}`}
                            className={`size-6 shrink-0 rounded-md flex items-center justify-center font-medium text-[10px] transition-all duration-150 border ${
                              isCurrent
                                ? 'bg-primary text-primary-foreground border-primary shadow-[inset_0_0_0_2px_rgba(255,255,255,0.25)]'
                                : isAnswered
                                  ? 'bg-destructive/25 text-destructive border-destructive/60 hover:bg-destructive/35'
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
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded bg-primary"></div>
                  <span>Current</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded bg-muted/60"></div>
                  <span>Unanswered</span>
                </div>
              </div>

              {/* Submit button in sidebar */}
              <div className="pt-1 border-t border-border/30">
                <Button
                  onClick={() => setShowSubmitConfirm(true)}
                  variant="outline"
                  size="sm"
                  className="w-full border-neon-green/40 text-neon-green hover:bg-neon-green/10 hover:border-neon-green/70 text-xs h-9 transition-colors"
                >
                  <Send className="w-3 h-3 mr-1.5" />
                  Submit Round 1
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Question Card */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          <Card className="border-border/50 bg-card/80 flex-1">
            <CardHeader className="pb-3 pt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">Q{currentQuestionIndex + 1} / {round1Questions.length}</span>
                  <Badge variant="outline" className={`text-[10px] h-5 ${getDifficultyColor(currentQuestion.difficulty)}`}>
                    {currentQuestion.difficulty.toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className={`text-[10px] h-5 ${
                    currentQuestion.type === 'mcq'
                      ? 'text-neon-green border-neon-green/50'
                      : currentQuestion.type === 'query'
                        ? 'text-neon-orange border-neon-orange/50'
                        : 'text-accent border-accent/50'
                  }`}>
                    {currentQuestion.type === 'mcq' ? 'MCQ' : currentQuestion.type === 'query' ? 'QUERY' : 'SCENARIO'}
                  </Badge>
                </div>
                <Badge className="bg-primary/15 text-primary border-0 text-xs">
                  {currentQuestion.points} pts
                </Badge>
              </div>

              {currentQuestion.scenario && currentQuestion.type === 'query' && (
                <div className="mb-3">
                  <QueryScenarioRenderer scenario={currentQuestion.scenario} label="Query / Transaction Scenario" />
                </div>
              )}
              {currentQuestion.scenario && currentQuestion.type === 'scenario' && (
                <div className="mb-3">
                  <QueryScenarioRenderer scenario={currentQuestion.scenario} label="Scenario" />
                </div>
              )}

              <CardTitle className="text-base leading-relaxed text-foreground font-medium">
                {currentQuestion.question}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-2.5 pb-4">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswer === index
                return (
                  <button
                    key={index}
                    onClick={() => handleSelectAnswer(index)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all duration-150 ${
                      isSelected
                        ? 'bg-primary/15 border-primary/70 shadow-sm shadow-primary/10'
                        : 'bg-muted/20 border-border/40 hover:border-primary/40 hover:bg-primary/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {isSelected ? <CheckCircle2 className="w-3.5 h-3.5" /> : String.fromCharCode(65 + index)}
                      </span>
                      <span className={`text-sm flex-1 ${isSelected ? 'text-foreground font-medium' : 'text-foreground'}`}>
                        {option}
                      </span>
                    </div>
                  </button>
                )
              })}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToQuestion(currentQuestionIndex - 1)}
              disabled={currentQuestionIndex === 0}
              className="border-border/50 disabled:opacity-40 transition-opacity"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              {currentQuestionIndex < round1Questions.length - 1 ? (
                <Button
                  size="sm"
                  onClick={() => goToQuestion(currentQuestionIndex + 1)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setShowSubmitConfirm(true)}
                  className="bg-neon-green text-background hover:bg-neon-green/90"
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  Submit Round 1
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="max-w-sm w-full border-border/50 bg-card shadow-2xl shadow-black/40">
            <CardHeader className="text-center pb-3">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-neon-green/15 border border-neon-green/30 flex items-center justify-center">
                <Send className="w-6 h-6 text-neon-green" />
              </div>
              <CardTitle className="text-lg text-foreground">Submit Round 1?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-1">
                <p className="text-sm text-muted-foreground">
                  <span className="text-foreground font-semibold">{answeredCount}</span> of <span className="text-foreground font-semibold">{round1Questions.length}</span> questions answered
                </p>
                {answeredCount < round1Questions.length && (
                  <p className="text-sm font-medium text-neon-orange">
                    {round1Questions.length - answeredCount} question{round1Questions.length - answeredCount !== 1 ? 's' : ''} left unanswered
                  </p>
                )}
                <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
              </div>
              <div className="flex gap-2.5">
                <Button
                  variant="outline"
                  onClick={() => setShowSubmitConfirm(false)}
                  className="flex-1 border-border/50 text-sm"
                >
                  Review Answers
                </Button>
                <Button
                  onClick={handleSubmit}
                  className="flex-1 bg-neon-green text-background hover:bg-neon-green/90 text-sm font-semibold"
                >
                  Submit
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
