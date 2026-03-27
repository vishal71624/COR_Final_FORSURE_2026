'use client'

import { useState, useEffect, useCallback } from 'react'
import { useGameStore, Question, SQLChallenge, TableData, TableColumn, TestCase } from '@/lib/game-store'
import { QueryScenarioRenderer } from '@/components/query-scenario-renderer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Shield, 
  Users, 
  Trophy,
  UserPlus, 
  Trash2, 
  RefreshCcw,
  Database,
  LogOut,
  Copy,
  Check,
  Zap,
  Ban,
  Unlock,
  Lock,
  CheckCircle2,
  Loader2,
  Search,
  Shuffle,
  GraduationCap,
  Building,
  Phone,
  Mail,
  BookOpen,
  Eye,
  Plus,
  Edit,
  FileQuestion,
  Table,
  Code,
  Play,
  Crown,
  Medal,
  Download,
  ArrowUpDown,
  ChevronDown,
  SlidersHorizontal
} from 'lucide-react'

export function AdminPanel() {
  const { 
    players, 
    round1Questions,
    round2Challenges,
    teams,
    logout, 
    setView,
    addPlayer,
    removePlayer,
    enableRound2,
    disableRound2,
    updatePlayerDetails,
    loadPlayers,
    loadRound1Questions,
    loadRound2Challenges,
    loadTeams,
    addTeam,
    removeTeam,
    enableRound2ForTeam,
    disableRound2ForTeam,
    addRound1Question,
    updateRound1Question,
    deleteRound1Question,
    addRound2Challenge,
    updateRound2Challenge,
    deleteRound2Challenge
  } = useGameStore()

  const [generatedCode, setGeneratedCode] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [addedCount, setAddedCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'score' | 'r1' | 'r2'>('score')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'r2enabled' | 'r2complete' | 'disqualified' | 'pending'>('all')
  const [isLoading, setIsLoading] = useState(false)
  
  // Student details form state
  const [studentName, setStudentName] = useState('')
  const [studentCollege, setStudentCollege] = useState('')
  const [studentDepartment, setStudentDepartment] = useState('')
  const [studentYear, setStudentYear] = useState('')
  const [studentContact, setStudentContact] = useState('')
  const [studentEmail, setStudentEmail] = useState('')

  // Team-based add form state
  const [teamType, setTeamType] = useState<'solo' | 'duo'>('duo')
  const [addTeamName, setAddTeamName] = useState('')
  const [addTeamCode, setAddTeamCode] = useState('')
  const [p2Name, setP2Name] = useState('')
  const [p2College, setP2College] = useState('')
  const [p2Department, setP2Department] = useState('')
  const [p2Year, setP2Year] = useState('')
  const [p2Contact, setP2Contact] = useState('')
  const [p2Email, setP2Email] = useState('')
  const [isCreatingTeamPlayers, setIsCreatingTeamPlayers] = useState(false)
  const [addSuccess, setAddSuccess] = useState('')

  // Team expand + player edit state
  const [expandedTeamCode, setExpandedTeamCode] = useState<string | null>(null)
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', college: '', department: '', yearOfStudy: '', contactNumber: '', email: '' })
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  // Team form state
  const [teamCode, setTeamCode] = useState('')
  const [teamName, setTeamName] = useState('')
  const [teamPlayer1, setTeamPlayer1] = useState('')
  const [teamPlayer2, setTeamPlayer2] = useState('')
  const [teamError, setTeamError] = useState('')
  const [isAddingTeam, setIsAddingTeam] = useState(false)

  // Round 1 Question form state
  const [showR1QuestionDialog, setShowR1QuestionDialog] = useState(false)
  const [editingR1Question, setEditingR1Question] = useState<Question | null>(null)
  const [r1Question, setR1Question] = useState('')
  const [r1Scenario, setR1Scenario] = useState('')
  const [r1Type, setR1Type] = useState<'mcq' | 'query' | 'scenario'>('mcq')
  const [r1Difficulty, setR1Difficulty] = useState<'easy' | 'medium' | 'hard'>('easy')
  const [r1Options, setR1Options] = useState(['', '', '', ''])
  const [r1CorrectAnswer, setR1CorrectAnswer] = useState(1)
  const [r1Points, setR1Points] = useState(10)

  // Round 2 Challenge form state
  const [showR2ChallengeDialog, setShowR2ChallengeDialog] = useState(false)
  const [editingR2Challenge, setEditingR2Challenge] = useState<SQLChallenge | null>(null)
  
  const [r2Title, setR2Title] = useState('')
  const [r2Description, setR2Description] = useState('')
  const [r2Scenario, setR2Scenario] = useState('')
  const [r2Schema, setR2Schema] = useState('')
  const [r2Difficulty, setR2Difficulty] = useState<'easy' | 'medium' | 'hard'>('easy')
  const [r2CorrectQuery, setR2CorrectQuery] = useState('')
  const [r2TableName, setR2TableName] = useState('')
  const [r2TableColumns, setR2TableColumns] = useState('')
  const [r2TableRows, setR2TableRows] = useState('')

  interface TestCaseForm {
    id: number
    name: string
    description: string
    rows: string
    points: number
  }

  const defaultTestCase = (): TestCaseForm => ({
    id: Date.now() + Math.random(),
    name: 'Test Case',
    description: '',
    rows: '',
    points: 5
  })

  const defaultHiddenCase = (): TestCaseForm => ({
    id: Date.now() + Math.random(),
    name: 'Hidden Case',
    description: '',
    rows: '',
    points: 10
  })

  const [r2TestCases, setR2TestCases] = useState<TestCaseForm[]>([defaultTestCase()])
  const [r2HiddenCases, setR2HiddenCases] = useState<TestCaseForm[]>([defaultHiddenCase()])

  // Load players and questions from database on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await Promise.all([
        loadPlayers(),
        loadRound1Questions(),
        loadRound2Challenges(),
        loadTeams(),
      ])
      setIsLoading(false)
    }
    loadData()
  }, [loadPlayers, loadRound1Questions, loadRound2Challenges])
  
  const disqualifiedPlayers = players.filter(p => p.isDisqualified).length
  const round1Completed = players.filter(p => p.round1Completed).length
  const round2Enabled = players.filter(p => p.round2Enabled).length

  // Filter players based on search + status filter
  const filteredPlayers = [...players]
    .filter(p =>
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.college && p.college.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.department && p.department.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.email && p.email.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .filter(p => {
      if (filterStatus === 'all') return true
      if (filterStatus === 'completed') return p.round1Completed && !p.isDisqualified
      if (filterStatus === 'r2enabled') return p.round2Enabled && !p.isDisqualified
      if (filterStatus === 'disqualified') return p.isDisqualified
      if (filterStatus === 'pending') return !p.round1Completed && !p.isDisqualified
      if (filterStatus === 'r2complete') return p.round2Completed && !p.isDisqualified
      return true
    })
    .sort((a, b) => {
      let va = 0, vb = 0
      if (sortBy === 'name') {
        va = a.name.localeCompare(b.name)
        return sortDir === 'asc' ? va : -va
      }
      if (sortBy === 'score') { va = a.score; vb = b.score }
      if (sortBy === 'r1') { va = a.round1Score; vb = b.round1Score }
      if (sortBy === 'r2') { va = a.round2Score; vb = b.round2Score }
      return sortDir === 'asc' ? va - vb : vb - va
    })

  // Export CSV helper — team-based layout
  const exportCSV = () => {
    const headers = [
      'Team ID', 'Team Name',
      'Player 1 Name', 'Player 1 Email', 'Player 1 Phone', 'Player 1 College', 'Player 1 Department', 'Player 1 Year',
      'P1 R1 Score', 'P1 R2 Score', 'P1 Overall Score',
      'Player 2 Name', 'Player 2 Email', 'Player 2 Phone', 'Player 2 College', 'Player 2 Department', 'Player 2 Year',
      'P2 R1 Score', 'P2 R2 Score', 'P2 Overall Score',
      'Avg R1 Score', 'Avg R2 Score', 'Avg Overall Score'
    ]

    const dataRows = teams.map(team => {
      const p1 = players.find(p => p.id === `${team.code}_1`)
      const p2 = players.find(p => p.id === `${team.code}_2`)

      const p1R1 = p1?.round1Score ?? 0
      const p1R2 = p1?.round2Score ?? 0
      const p1Total = p1?.score ?? 0

      const p2R1 = p2?.round1Score ?? 0
      const p2R2 = p2?.round2Score ?? 0
      const p2Total = p2?.score ?? 0

      const playerCount = team.player2Name ? 2 : 1
      const avgR1 = Math.round((p1R1 + p2R1) / playerCount)
      const avgR2 = Math.round((p1R2 + p2R2) / playerCount)
      const avgTotal = Math.round((p1Total + p2Total) / playerCount)

      return [
        team.code,
        team.name,
        p1?.name ?? team.player1Name,
        p1?.email ?? '',
        p1?.contactNumber ?? '',
        p1?.college ?? '',
        p1?.department ?? '',
        p1?.yearOfStudy ?? '',
        p1R1, p1R2, p1Total,
        p2?.name ?? team.player2Name ?? '',
        p2?.email ?? '',
        p2?.contactNumber ?? '',
        p2?.college ?? '',
        p2?.department ?? '',
        p2?.yearOfStudy ?? '',
        team.player2Name ? p2R1 : '',
        team.player2Name ? p2R2 : '',
        team.player2Name ? p2Total : '',
        avgR1, avgR2, avgTotal
      ]
    })

    const rows = [headers, ...dataRows]
    const csv = rows.map(r => r.map(v => JSON.stringify(String(v))).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'itrix2026-teams.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  // Generate a random unique student code
  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = 'IST'
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    // Check if code already exists, regenerate if so
    const exists = players.find(p => p.id === code)
    if (exists) {
      return generateRandomCode() // Recursively generate new code if exists
    }
    setGeneratedCode(code)
    return code
  }

  const handleAddPlayer = () => {
    if (!generatedCode.trim()) {
      alert('Please generate a student code first!')
      return
    }
    const exists = players.find(p => p.id === generatedCode.toUpperCase().trim())
    if (exists) {
      alert('Player with this code already exists! Please generate a new code.')
      return
    }
    addPlayer(generatedCode.trim(), {
      name: studentName || generatedCode.trim(),
      college: studentCollege,
      department: studentDepartment,
      yearOfStudy: studentYear,
      contactNumber: studentContact,
      email: studentEmail,
    })
    // Reset form
    setGeneratedCode('')
    setStudentName('')
    setStudentCollege('')
    setStudentDepartment('')
    setStudentYear('')
    setStudentContact('')
    setStudentEmail('')
    setAddedCount(1)
    setTimeout(() => setAddedCount(0), 2000)
  }

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleRefreshPlayers = async () => {
    setIsLoading(true)
    await loadPlayers()
    setIsLoading(false)
  }

  // Round 1 Question handlers
  const resetR1Form = () => {
    setR1Question('')
    setR1Scenario('')
    setR1Type('mcq')
    setR1Difficulty('easy')
    setR1Options(['', '', '', ''])
    setR1CorrectAnswer(0)
    setR1Points(10)
    setEditingR1Question(null)
  }

  const handleEditR1Question = (question: Question) => {
    setEditingR1Question(question)
    setR1Question(question.question)
    setR1Scenario(question.scenario || '')
    setR1Type(question.type)
    setR1Difficulty(question.difficulty)
    setR1Options([...question.options])
    setR1CorrectAnswer(question.correctAnswer)
    setR1Points(question.points)
    setShowR1QuestionDialog(true)
  }

  const handleSaveR1Question = async () => {
    if (!r1Question.trim() || r1Options.some(o => !o.trim())) {
      alert('Please fill in the question and all options')
      return
    }

    const questionData = {
      type: r1Type,
      difficulty: r1Difficulty,
      question: r1Question,
      scenario: r1Scenario || undefined,
      options: r1Options,
      correctAnswer: r1CorrectAnswer,
      points: r1Points
    }

    if (editingR1Question) {
      await updateRound1Question(editingR1Question.id, questionData)
    } else {
      await addRound1Question(questionData)
    }

    resetR1Form()
    setShowR1QuestionDialog(false)
  }

  // Round 2 Challenge handlers
  const resetR2Form = () => {
    setR2Title('')
    setR2Description('')
    setR2Scenario('')
    setR2Schema('')
    setR2Difficulty('easy')
    setR2CorrectQuery('')
    setR2TableName('')
    setR2TableColumns('')
    setR2TableRows('')
    setR2TestCases([defaultTestCase()])
    setR2HiddenCases([defaultHiddenCase()])
    setEditingR2Challenge(null)
  }

  const updateTestCase = (index: number, field: keyof TestCaseForm, value: string | number) => {
    setR2TestCases(prev => prev.map((tc, i) => i === index ? { ...tc, [field]: value } : tc))
  }

  const updateHiddenCase = (index: number, field: keyof TestCaseForm, value: string | number) => {
    setR2HiddenCases(prev => prev.map((tc, i) => i === index ? { ...tc, [field]: value } : tc))
  }

  const addTestCase = () => setR2TestCases(prev => [...prev, defaultTestCase()])
  const removeTestCase = (index: number) => setR2TestCases(prev => prev.filter((_, i) => i !== index))
  const addHiddenCase = () => setR2HiddenCases(prev => [...prev, defaultHiddenCase()])
  const removeHiddenCase = (index: number) => setR2HiddenCases(prev => prev.filter((_, i) => i !== index))

  const handleEditR2Challenge = (challenge: SQLChallenge) => {
    setEditingR2Challenge(challenge)
    setR2Title(challenge.title)
    setR2Description(challenge.description)
    setR2Scenario(challenge.scenario)
    setR2Schema(challenge.schema)
    setR2Difficulty(challenge.difficulty)
    setR2CorrectQuery(challenge.correctQuery || '')
    if (challenge.baseTableData.length > 0) {
      const table = challenge.baseTableData[0]
      setR2TableName(table.tableName)
      setR2TableColumns(table.columns.map(c => `${c.name}:${c.type}${c.isPrimaryKey ? ':PK' : ''}${c.isForeignKey ? ':FK' : ''}`).join(', '))
      setR2TableRows(table.rows.map(row => row.join(', ')).join('\n'))
    }

    const visible = challenge.testCases.filter(tc => !tc.isHidden)
    const hidden = challenge.testCases.filter(tc => tc.isHidden)

    setR2TestCases(visible.length > 0 ? visible.map(tc => ({
      id: tc.id,
      name: tc.name,
      description: tc.description || '',
      rows: tc.tableData?.[0]?.rows.map(r => r.join(', ')).join('\n') || '',
      points: tc.points
    })) : [defaultTestCase()])

    setR2HiddenCases(hidden.length > 0 ? hidden.map(tc => ({
      id: tc.id,
      name: tc.name,
      description: tc.description || '',
      rows: tc.tableData?.[0]?.rows.map(r => r.join(', ')).join('\n') || '',
      points: tc.points
    })) : [defaultHiddenCase()])

    setShowR2ChallengeDialog(true)
  }

  const parseTableData = (): TableData[] => {
    if (!r2TableName || !r2TableColumns) return []
    
    const columns: TableColumn[] = r2TableColumns.split(',').map(col => {
      const parts = col.trim().split(':')
      return {
        name: parts[0],
        type: parts[1] || 'VARCHAR',
        isPrimaryKey: parts.includes('PK'),
        isForeignKey: parts.includes('FK')
      }
    })

    const rows = r2TableRows.split('\n').filter(r => r.trim()).map(row => 
      row.split(',').map(cell => {
        const trimmed = cell.trim()
        if (trimmed === 'NULL' || trimmed === 'null') return null
        const num = Number(trimmed)
        return isNaN(num) ? trimmed : num
      })
    )

    return [{
      tableName: r2TableName,
      columns,
      rows
    }]
  }

  const parseTestCaseTableData = (rows: string): TableData[] => {
    if (!r2TableName || !r2TableColumns) return []
    const columns: TableColumn[] = r2TableColumns.split(',').map(col => {
      const parts = col.trim().split(':')
      return {
        name: parts[0],
        type: parts[1] || 'VARCHAR',
        isPrimaryKey: parts.includes('PK'),
        isForeignKey: parts.includes('FK')
      }
    })
    const parsedRows = rows.split('\n').filter(r => r.trim()).map(row =>
      row.split(',').map(cell => {
        const trimmed = cell.trim()
        if (trimmed === 'NULL' || trimmed === 'null') return null
        const num = Number(trimmed)
        return isNaN(num) ? trimmed : num
      })
    )
    return [{ tableName: r2TableName, columns, rows: parsedRows }]
  }

  const handleSaveR2Challenge = async () => {
    if (!r2Title.trim() || !r2Description.trim() || !r2CorrectQuery.trim()) {
      alert('Please fill in the title, description, and correct query')
      return
    }

    const baseTableData = parseTableData()

    let tcId = 1
    const testCases: TestCase[] = [
      ...r2TestCases.map(tc => ({
        id: tcId++,
        name: tc.name || 'Test Case',
        description: tc.description,
        tableData: tc.rows.trim() ? parseTestCaseTableData(tc.rows) : baseTableData,
        expectedOutput: [] as (string | number | null)[][],
        expectedColumns: [] as string[],
        isHidden: false,
        points: tc.points
      })),
      ...r2HiddenCases.map(tc => ({
        id: tcId++,
        name: tc.name || 'Hidden Case',
        description: tc.description,
        tableData: tc.rows.trim() ? parseTestCaseTableData(tc.rows) : baseTableData,
        expectedOutput: [] as (string | number | null)[][],
        expectedColumns: [] as string[],
        isHidden: true,
        points: tc.points
      }))
    ]

    const totalPoints = testCases.reduce((sum, tc) => sum + tc.points, 0)

    const challengeData: Omit<SQLChallenge, 'id'> = {
      difficulty: r2Difficulty,
      title: r2Title,
      description: r2Description,
      scenario: r2Scenario,
      schema: r2Schema,
      baseTableData,
      testCases,
      expectedKeywords: r2CorrectQuery.toLowerCase().split(/\s+/).filter(w => ['select', 'from', 'where', 'join', 'group', 'order', 'having'].includes(w)),
      totalPoints,
      timeLimit: 180,
      correctQuery: r2CorrectQuery.trim()
    }

    if (editingR2Challenge) {
      await updateRound2Challenge(editingR2Challenge.id, challengeData)
    } else {
      await addRound2Challenge(challengeData)
    }

    resetR2Form()
    setShowR2ChallengeDialog(false)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-neon-green border-neon-green/50 bg-neon-green/10'
      case 'medium': return 'text-neon-orange border-neon-orange/50 bg-neon-orange/10'
      case 'hard': return 'text-neon-red border-neon-red/50 bg-neon-red/10'
      default: return 'text-primary border-primary/50'
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <div>
              <h1 className="font-bold text-lg text-foreground">Admin Panel</h1>
              <p className="text-xs text-muted-foreground">COMMIT OR ROLLBACK - ITRIX 2026</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={logout}
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-border/50 bg-card/80">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Players</p>
                  <p className="text-3xl font-bold text-primary">{players.length}</p>
                </div>
                <Users className="w-8 h-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/80">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">R1 Completed</p>
                  <p className="text-3xl font-bold text-neon-green">{round1Completed}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-neon-green/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/80">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">R2 Enabled</p>
                  <p className="text-3xl font-bold text-accent">{round2Enabled}</p>
                </div>
                <Unlock className="w-8 h-8 text-accent/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/80">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Disqualified</p>
                  <p className="text-3xl font-bold text-destructive">{disqualifiedPlayers}</p>
                </div>
                <Ban className="w-8 h-8 text-destructive/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="teams" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="teams" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Users className="w-4 h-4 mr-2" />
              Teams
            </TabsTrigger>
            <TabsTrigger value="add" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Team
            </TabsTrigger>
            <TabsTrigger value="round1" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileQuestion className="w-4 h-4 mr-2" />
              Round 1 Questions
            </TabsTrigger>
            <TabsTrigger value="round2" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Code className="w-4 h-4 mr-2" />
              Round 2 Challenges
            </TabsTrigger>
          </TabsList>

          {/* Add Student Tab */}
          <TabsContent value="add">
            <Card className="border-border/50 bg-card/80 max-w-3xl mx-auto">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-primary" />
                  Add Team & Players
                </CardTitle>
                <CardDescription>Create a team with 1 or 2 players. Players log in using the shared team code.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">

                {/* Solo / Duo Toggle */}
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant={teamType === 'solo' ? 'default' : 'outline'}
                    className={teamType === 'solo' ? 'bg-primary text-primary-foreground flex-1' : 'flex-1 border-border/50'}
                    onClick={() => setTeamType('solo')}
                  >
                    Solo Team (1 Player)
                  </Button>
                  <Button
                    type="button"
                    variant={teamType === 'duo' ? 'default' : 'outline'}
                    className={teamType === 'duo' ? 'bg-primary text-primary-foreground flex-1' : 'flex-1 border-border/50'}
                    onClick={() => setTeamType('duo')}
                  >
                    Duo Team (2 Players)
                  </Button>
                </div>

                {/* Team Info */}
                <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 space-y-4">
                  <p className="text-sm font-medium text-primary uppercase tracking-wide">Team Details</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Team Name *</Label>
                      <Input
                        placeholder="e.g. Alpha Squad"
                        value={addTeamName}
                        onChange={e => {
                          setAddTeamName(e.target.value)
                          if (!addTeamCode) {
                            const auto = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)
                            setAddTeamCode(auto)
                          }
                        }}
                        className="bg-input border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Team Code * (players use this to log in)</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="e.g. TEAM001"
                          value={addTeamCode}
                          onChange={e => setAddTeamCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                          className="bg-input border-border font-mono"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="border-primary/50 text-primary shrink-0"
                          onClick={() => {
                            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
                            let code = 'T'
                            for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)]
                            setAddTeamCode(code)
                          }}
                        >
                          <Shuffle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Player 1 */}
                <div className="space-y-4">
                  <p className="text-sm font-medium text-foreground border-b border-border/50 pb-2">
                    {teamType === 'solo' ? 'Player Details' : 'Player 1 Details'}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label>Full Name *</Label>
                      <Input placeholder="Player 1 full name" value={studentName} onChange={e => setStudentName(e.target.value)} className="bg-input border-border" />
                    </div>
                    <div className="space-y-2">
                      <Label>College</Label>
                      <Input placeholder="" value={studentCollege} onChange={e => setStudentCollege(e.target.value)} className="bg-input border-border" />
                    </div>
                    <div className="space-y-2">
                      <Label>Department</Label>
                      <Input placeholder="" value={studentDepartment} onChange={e => setStudentDepartment(e.target.value)} className="bg-input border-border" />
                    </div>
                    <div className="space-y-2">
                      <Label>Year</Label>
                      <Input placeholder="" value={studentYear} onChange={e => setStudentYear(e.target.value)} className="bg-input border-border" />
                    </div>
                    <div className="space-y-2">
                      <Label>Contact</Label>
                      <Input placeholder="" value={studentContact} onChange={e => setStudentContact(e.target.value)} className="bg-input border-border" />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input placeholder="" value={studentEmail} onChange={e => setStudentEmail(e.target.value)} className="bg-input border-border" />
                    </div>
                  </div>
                </div>

                {/* Player 2 (only if duo) */}
                {teamType === 'duo' && (
                  <div className="space-y-4">
                    <p className="text-sm font-medium text-foreground border-b border-border/50 pb-2">Player 2 Details</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <Label>Full Name *</Label>
                        <Input placeholder="Player 2 full name" value={p2Name} onChange={e => setP2Name(e.target.value)} className="bg-input border-border" />
                      </div>
                      <div className="space-y-2">
                        <Label>College</Label>
                        <Input placeholder="" value={p2College} onChange={e => setP2College(e.target.value)} className="bg-input border-border" />
                      </div>
                      <div className="space-y-2">
                        <Label>Department</Label>
                        <Input placeholder="" value={p2Department} onChange={e => setP2Department(e.target.value)} className="bg-input border-border" />
                      </div>
                      <div className="space-y-2">
                        <Label>Year</Label>
                        <Input placeholder="" value={p2Year} onChange={e => setP2Year(e.target.value)} className="bg-input border-border" />
                      </div>
                      <div className="space-y-2">
                        <Label>Contact</Label>
                        <Input placeholder="" value={p2Contact} onChange={e => setP2Contact(e.target.value)} className="bg-input border-border" />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input placeholder="" value={p2Email} onChange={e => setP2Email(e.target.value)} className="bg-input border-border" />
                      </div>
                    </div>
                  </div>
                )}

                {addSuccess && (
                  <div className="flex items-center gap-2 text-neon-green text-sm bg-neon-green/10 px-4 py-3 rounded-lg border border-neon-green/20">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    {addSuccess}
                  </div>
                )}

                <Button
                  className="w-full bg-primary text-primary-foreground h-12 text-base font-semibold"
                  disabled={
                    isCreatingTeamPlayers ||
                    !addTeamCode.trim() ||
                    !addTeamName.trim() ||
                    !studentName.trim() ||
                    (teamType === 'duo' && !p2Name.trim())
                  }
                  onClick={async () => {
                    const code = addTeamCode.trim().toUpperCase()
                    if (teams.find(t => t.code === code)) {
                      alert('A team with code ' + code + ' already exists.')
                      return
                    }
                    setIsCreatingTeamPlayers(true)
                    setAddSuccess('')
                    await addTeam({
                      code,
                      name: addTeamName.trim(),
                      player1Name: studentName.trim(),
                      player2Name: teamType === 'duo' ? p2Name.trim() : undefined,
                    })
                    addPlayer(code + '_1', {
                      name: studentName.trim(),
                      college: studentCollege,
                      department: studentDepartment,
                      yearOfStudy: studentYear,
                      contactNumber: studentContact,
                      email: studentEmail,
                      teamCode: code,
                      playerSlot: 1,
                    })
                    if (teamType === 'duo' && p2Name.trim()) {
                      addPlayer(code + '_2', {
                        name: p2Name.trim(),
                        college: p2College,
                        department: p2Department,
                        yearOfStudy: p2Year,
                        contactNumber: p2Contact,
                        email: p2Email,
                        teamCode: code,
                        playerSlot: 2,
                      })
                    }
                    setAddSuccess(
                      teamType === 'duo'
                        ? 'Team "' + addTeamName.trim() + '" created with 2 players! Share code: ' + code
                        : 'Solo team "' + addTeamName.trim() + '" created! Share code: ' + code
                    )
                    setAddTeamCode(''); setAddTeamName(''); setStudentName('')
                    setStudentCollege(''); setStudentDepartment(''); setStudentYear(''); setStudentContact(''); setStudentEmail('')
                    setP2Name(''); setP2College(''); setP2Department(''); setP2Year(''); setP2Contact(''); setP2Email('')
                    setIsCreatingTeamPlayers(false)
                  }}
                >
                  {isCreatingTeamPlayers ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</>
                  ) : (
                    <><UserPlus className="w-4 h-4 mr-2" />
                    {teamType === 'duo' ? 'Create Team with 2 Players' : 'Create Solo Team'}</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

                    {/* Round 1 Questions Tab */}
          <TabsContent value="round1">
            <Card className="border-border/50 bg-card/80">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-foreground">Round 1 Questions</CardTitle>
                    <CardDescription>Manage MCQ and scenario-based questions ({round1Questions.length} questions)</CardDescription>
                  </div>
                  <Dialog open={showR1QuestionDialog} onOpenChange={(open) => { setShowR1QuestionDialog(open); if (!open) resetR1Form(); }}>
                    <DialogTrigger asChild>
                      <Button className="bg-primary text-primary-foreground">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Question
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{editingR1Question ? 'Edit Question' : 'Add New Question'}</DialogTitle>
                        <DialogDescription>Create an MCQ or scenario-based question</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Difficulty</Label>
                            <Select value={r1Difficulty} onValueChange={(v: 'easy' | 'medium' | 'hard') => {
                              setR1Difficulty(v)
                              if (v === 'easy') setR1Type('mcq')
                              else if (v === 'medium') setR1Type('query')
                              else setR1Type('scenario')
                            }}>
                              <SelectTrigger className="bg-input border-border">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="easy">Easy (10 pts)</SelectItem>
                                <SelectItem value="medium">Medium (15 pts)</SelectItem>
                                <SelectItem value="hard">Hard (20 pts)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Type</Label>
                            <Select value={r1Type} onValueChange={(v: 'mcq' | 'query' | 'scenario') => setR1Type(v)}>
                              <SelectTrigger className="bg-input border-border">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="mcq">MCQ (Easy)</SelectItem>
                                <SelectItem value="query">Query Based (Medium)</SelectItem>
                                <SelectItem value="scenario">Scenario (Hard)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Points</Label>
                            <Input
                              type="number"
                              value={r1Points}
                              onChange={(e) => setR1Points(parseInt(e.target.value) || 10)}
                              className="bg-input border-border"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>
                            {r1Type === 'query' ? 'Query / Transaction (shown as code block)' : r1Type === 'scenario' ? 'Scenario' : 'Scenario (optional)'}
                          </Label>
                          <Textarea
                            placeholder={r1Type === 'query' ? 'Paste SQL query or transaction steps here...' : 'Describe a real-world scenario...'}
                            value={r1Scenario}
                            onChange={(e) => setR1Scenario(e.target.value)}
                            className={`bg-input border-border ${r1Type === 'query' ? 'font-mono text-sm' : ''}`}
                            rows={r1Type === 'query' ? 5 : 3}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Question *</Label>
                          <Textarea
                            placeholder="Enter the question..."
                            value={r1Question}
                            onChange={(e) => setR1Question(e.target.value)}
                            className="bg-input border-border"
                          />
                        </div>

                        <div className="space-y-3">
                          <Label>Options *</Label>
                          {r1Options.map((option, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant={r1CorrectAnswer === idx + 1 ? "default" : "outline"}
                                size="sm"
                                className={r1CorrectAnswer === idx + 1 ? "bg-neon-green text-background" : ""}
                                onClick={() => setR1CorrectAnswer(idx + 1)}
                              >
                                {String.fromCharCode(65 + idx)}
                              </Button>
                              <Input
                                placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                                value={option}
                                onChange={(e) => {
                                  const newOptions = [...r1Options]
                                  newOptions[idx] = e.target.value
                                  setR1Options(newOptions)
                                }}
                                className="flex-1 bg-input border-border"
                              />
                              {r1CorrectAnswer === idx + 1 && (
                                <Badge className="bg-neon-green/20 text-neon-green border-0">Correct</Badge>
                              )}
                            </div>
                          ))}
                          <p className="text-xs text-muted-foreground">Click the letter button to mark as correct answer</p>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="ghost" onClick={() => { setShowR1QuestionDialog(false); resetR1Form(); }}>Cancel</Button>
                        <Button onClick={handleSaveR1Question} className="bg-neon-green text-background hover:bg-neon-green/90">
                          {editingR1Question ? 'Update Question' : 'Add Question'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...round1Questions].sort((a, b) => {
                    const order = { easy: 0, medium: 1, hard: 2 }
                    return (order[a.difficulty as keyof typeof order] ?? 0) - (order[b.difficulty as keyof typeof order] ?? 0)
                  }).map((q, idx) => (
                    <div key={`q-${q.id}-${q.difficulty}`} className="p-4 rounded-lg border border-border/50 hover:border-border/80 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-muted-foreground">Q{idx + 1}</span>
                            <Badge variant="outline" className={getDifficultyColor(q.difficulty)}>
                              {q.difficulty}
                            </Badge>
                            <Badge variant="outline" className={
                              q.type === 'mcq' ? 'text-neon-green border-neon-green/50' :
                              q.type === 'query' ? 'text-neon-orange border-neon-orange/50' :
                              'text-accent border-accent/50'
                            }>
                              {q.type === 'mcq' ? 'MCQ' : q.type === 'query' ? 'Query' : 'Scenario'}
                            </Badge>
                            <Badge variant="outline">{q.points} pts</Badge>
                          </div>
                          {q.scenario && q.type === 'query' && (
                            <div className="mb-2">
                              <QueryScenarioRenderer scenario={q.scenario} label="Query / Transaction Scenario" />
                            </div>
                          )}
                          {q.scenario && q.type === 'scenario' && (
                            <div className="mb-2">
                              <QueryScenarioRenderer scenario={q.scenario} label="Scenario" />
                            </div>
                          )}
                          <p className="text-sm text-foreground">{q.question}</p>
                          <div className="mt-2 grid grid-cols-2 gap-1">
                            {q.options.map((opt, optIdx) => (
                              <p key={optIdx} className={`text-xs ${optIdx + 1 === q.correctAnswer ? 'text-neon-green font-medium' : 'text-muted-foreground'}`}>
                                {String.fromCharCode(65 + optIdx)}. {opt} {optIdx + 1 === q.correctAnswer && '(Correct)'}
                              </p>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary hover:bg-primary/10"
                            onClick={() => handleEditR1Question(q)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => deleteRound1Question(q.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Round 2 Challenges Tab */}
          <TabsContent value="round2">
            <Card className="border-border/50 bg-card/80">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-foreground">Round 2 SQL Challenges</CardTitle>
                    <CardDescription>Manage SQL query challenges ({round2Challenges.length} challenges)</CardDescription>
                  </div>
                  <Dialog open={showR2ChallengeDialog} onOpenChange={(open) => { setShowR2ChallengeDialog(open); if (!open) resetR2Form(); }}>
                    <DialogTrigger asChild>
                      <Button className="bg-accent text-accent-foreground">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Challenge
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border-border max-w-3xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{editingR2Challenge ? 'Edit Challenge' : 'Add New Challenge'}</DialogTitle>
                        <DialogDescription>Create an SQL query challenge with test data</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Title *</Label>
                            <Input
                              placeholder="e.g., Find Top Customers"
                              value={r2Title}
                              onChange={(e) => setR2Title(e.target.value)}
                              className="bg-input border-border"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Difficulty</Label>
                            <Select value={r2Difficulty} onValueChange={(v: 'easy' | 'medium' | 'hard') => setR2Difficulty(v)}>
                              <SelectTrigger className="bg-input border-border">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="easy">Easy</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="hard">Hard</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Scenario</Label>
                          <Textarea
                            placeholder="Describe the business context..."
                            value={r2Scenario}
                            onChange={(e) => setR2Scenario(e.target.value)}
                            className="bg-input border-border"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Description / Task *</Label>
                          <Textarea
                            placeholder="What should the student do? e.g., Write a query to find all customers who spent more than 10000..."
                            value={r2Description}
                            onChange={(e) => setR2Description(e.target.value)}
                            className="bg-input border-border"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Schema Description</Label>
                          <Input
                            placeholder="e.g., customers (id, name, email, total_spent)"
                            value={r2Schema}
                            onChange={(e) => setR2Schema(e.target.value)}
                            className="bg-input border-border font-mono"
                          />
                        </div>

                        <div className="border-t border-border/50 pt-4">
                          <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                            <Table className="w-4 h-4" />
                            Base Table (shown to student)
                          </h4>
                          
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <Label>Table Name</Label>
                              <Input
                                placeholder="e.g., customers"
                                value={r2TableName}
                                onChange={(e) => setR2TableName(e.target.value)}
                                className="bg-input border-border font-mono"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Columns (format: name:TYPE:PK/FK)</Label>
                              <Input
                                placeholder="e.g., id:INT:PK, name:VARCHAR, total:DECIMAL"
                                value={r2TableColumns}
                                onChange={(e) => setR2TableColumns(e.target.value)}
                                className="bg-input border-border font-mono"
                              />
                              <p className="text-xs text-muted-foreground">Separate columns with comma. Add :PK for primary key, :FK for foreign key</p>
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Sample Data (one row per line)</Label>
                              <Textarea
                                placeholder={"1, John, 15000\n2, Jane, 8000\n3, Bob, 22000"}
                                value={r2TableRows}
                                onChange={(e) => setR2TableRows(e.target.value)}
                                className="bg-input border-border font-mono min-h-24"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-border/50 pt-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-foreground flex items-center gap-2">
                              <Play className="w-4 h-4 text-neon-green" />
                              Test Cases
                              <span className="text-xs text-muted-foreground font-normal">(visible to student)</span>
                            </h4>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={addTestCase}
                              className="border-neon-green/50 text-neon-green hover:bg-neon-green/10 h-7 px-2"
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Add Test Case
                            </Button>
                          </div>
                          <div className="space-y-3">
                            {r2TestCases.map((tc, idx) => (
                              <div key={tc.id} className="p-3 rounded-lg border border-neon-green/20 bg-neon-green/5 space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-medium text-neon-green">Test Case #{idx + 1}</span>
                                  {r2TestCases.length > 1 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-destructive hover:bg-destructive/10"
                                      onClick={() => removeTestCase(idx)}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-1">
                                    <Label className="text-xs">Name</Label>
                                    <Input
                                      value={tc.name}
                                      onChange={(e) => updateTestCase(idx, 'name', e.target.value)}
                                      placeholder="e.g., Basic Test"
                                      className="bg-input border-border h-8 text-sm"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Points</Label>
                                    <Input
                                      type="number"
                                      value={tc.points}
                                      onChange={(e) => updateTestCase(idx, 'points', Number(e.target.value))}
                                      className="bg-input border-border h-8 text-sm"
                                    />
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Description</Label>
                                  <Input
                                    value={tc.description}
                                    onChange={(e) => updateTestCase(idx, 'description', e.target.value)}
                                    placeholder="Optional description"
                                    className="bg-input border-border h-8 text-sm"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Data Rows (leave empty to use base table data)</Label>
                                  <Textarea
                                    value={tc.rows}
                                    onChange={(e) => updateTestCase(idx, 'rows', e.target.value)}
                                    placeholder={"1, Alice, 5000\n2, Bob, 12000"}
                                    className="bg-input border-border font-mono min-h-16 text-xs"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="border-t border-border/50 pt-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-foreground flex items-center gap-2">
                              <Eye className="w-4 h-4 text-neon-orange" />
                              Hidden Test Cases
                              <span className="text-xs text-muted-foreground font-normal">(not visible to student)</span>
                            </h4>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={addHiddenCase}
                              className="border-neon-orange/50 text-neon-orange hover:bg-neon-orange/10 h-7 px-2"
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Add Hidden Test Case
                            </Button>
                          </div>
                          <div className="space-y-3">
                            {r2HiddenCases.map((tc, idx) => (
                              <div key={tc.id} className="p-3 rounded-lg border border-neon-orange/20 bg-neon-orange/5 space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-medium text-neon-orange">Hidden Case #{idx + 1}</span>
                                  {r2HiddenCases.length > 1 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-destructive hover:bg-destructive/10"
                                      onClick={() => removeHiddenCase(idx)}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  )}
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-1">
                                    <Label className="text-xs">Name</Label>
                                    <Input
                                      value={tc.name}
                                      onChange={(e) => updateHiddenCase(idx, 'name', e.target.value)}
                                      placeholder="e.g., Edge Case"
                                      className="bg-input border-border h-8 text-sm"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Points</Label>
                                    <Input
                                      type="number"
                                      value={tc.points}
                                      onChange={(e) => updateHiddenCase(idx, 'points', Number(e.target.value))}
                                      className="bg-input border-border h-8 text-sm"
                                    />
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Description</Label>
                                  <Input
                                    value={tc.description}
                                    onChange={(e) => updateHiddenCase(idx, 'description', e.target.value)}
                                    placeholder="Optional description"
                                    className="bg-input border-border h-8 text-sm"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Data Rows (leave empty to use base table data)</Label>
                                  <Textarea
                                    value={tc.rows}
                                    onChange={(e) => updateHiddenCase(idx, 'rows', e.target.value)}
                                    placeholder={"1, Alice, 0\n2, Bob, NULL"}
                                    className="bg-input border-border font-mono min-h-16 text-xs"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="border-t border-border/50 pt-4">
                          <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                            <Code className="w-4 h-4" />
                            Correct Query
                          </h4>
                          <div className="space-y-2">
                            <Label>Correct SQL Query *</Label>
                            <Textarea
                              placeholder="SELECT * FROM customers WHERE total_spent > 10000"
                              value={r2CorrectQuery}
                              onChange={(e) => setR2CorrectQuery(e.target.value)}
                              className="bg-input border-border font-mono min-h-20"
                            />
                            <p className="text-xs text-muted-foreground">This query runs against each test case&apos;s data and its result is compared with the student&apos;s query output</p>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="ghost" onClick={() => { setShowR2ChallengeDialog(false); resetR2Form(); }}>Cancel</Button>
                        <Button onClick={handleSaveR2Challenge} className="bg-neon-green text-background hover:bg-neon-green/90">
                          {editingR2Challenge ? 'Update Challenge' : 'Add Challenge'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {round2Challenges.map((c, idx) => (
                    <div key={`ch-${c.id}-${c.difficulty}`} className="p-4 rounded-lg border border-border/50 hover:border-border/80 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-muted-foreground">#{idx + 1}</span>
                            <Badge variant="outline" className={getDifficultyColor(c.difficulty)}>
                              {c.difficulty}
                            </Badge>
                            <Badge variant="outline">{c.totalPoints} pts</Badge>
                            <Badge variant="outline" className="text-accent border-accent/50">
                              {c.testCases.length} test cases
                            </Badge>
                          </div>
                          <p className="text-sm font-medium text-foreground">{c.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{c.description}</p>
                          <p className="text-xs font-mono text-accent mt-2">{c.schema}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary hover:bg-primary/10"
                            onClick={() => handleEditR2Challenge(c)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => deleteRound2Challenge(c.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Teams Tab */}
          <TabsContent value="teams">
            <Card className="border-border/50 bg-card/80">
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      Team Management ({teams.length} teams)
                    </CardTitle>
                    <CardDescription>Click a team to view and manage its members</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleRefreshPlayers} disabled={isLoading} className="border-primary/50 text-primary h-9">
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportCSV} className="h-9 border-neon-green/50 text-neon-green hover:bg-neon-green/10">
                      <Download className="w-4 h-4 mr-1.5" />Export CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {teams.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>No teams yet. Use Add Team to create your first team.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {teams.map(team => {
                      const p1 = players.find(p => p.id === team.code + '_1')
                      const p2 = players.find(p => p.id === team.code + '_2')
                      const r2Enabled = p1?.round2Enabled || p2?.round2Enabled
                      const avgScore = team.player2Name
                        ? Math.round(((p1?.score ?? 0) + (p2?.score ?? 0)) / 2)
                        : (p1?.score ?? 0)
                      const isExpanded = expandedTeamCode === team.code
                      const members = [
                        p1 ? { player: p1, slot: 1, name: team.player1Name } : null,
                        (p2 && team.player2Name) ? { player: p2, slot: 2, name: team.player2Name } : null,
                      ].filter(Boolean) as { player: typeof p1 & object; slot: number; name: string }[]

                      return (
                        <div key={team.code}>
                          {/* Team Row - clickable header */}
                          <div
                            className={'flex items-center gap-4 p-4 cursor-pointer transition-colors ' + (isExpanded ? 'bg-primary/5 border-l-2 border-primary' : 'hover:bg-muted/20')}
                            onClick={() => {
                              setExpandedTeamCode(isExpanded ? null : team.code)
                              setEditingPlayerId(null)
                            }}
                          >
                            <div className={'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-colors ' + (isExpanded ? 'bg-primary text-primary-foreground' : 'bg-primary/20 text-primary')}>
                              {team.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-foreground">{team.name}</p>
                                <Badge variant="outline" className="font-mono text-xs border-primary/40 text-primary">{team.code}</Badge>
                                {team.player2Name ? <Badge variant="outline" className="text-xs">2 Players</Badge> : <Badge variant="outline" className="text-xs">Solo</Badge>}
                                {r2Enabled && <Badge variant="outline" className="text-xs border-accent/50 text-accent">R2 On</Badge>}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {team.player1Name}{team.player2Name ? ' · ' + team.player2Name : ''}
                                <span className="ml-3 text-primary">Avg: {avgScore} pts</span>
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                              {r2Enabled ? (
                                <Button variant="outline" size="sm" className="border-destructive/50 text-destructive h-8" onClick={() => disableRound2ForTeam(team.code)}>
                                  <Lock className="w-3.5 h-3.5 mr-1" />Lock R2
                                </Button>
                              ) : (
                                <Button variant="outline" size="sm" className="border-accent/50 text-accent h-8" onClick={() => enableRound2ForTeam(team.code)}>
                                  <Unlock className="w-3.5 h-3.5 mr-1" />Enable R2
                                </Button>
                              )}
                              <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 h-8"
                                onClick={() => { if (window.confirm('Delete team "' + team.name + '" and all its player records? Cannot be undone.')) { removeTeam(team.code); if(p1) removePlayer(p1.id); if(p2) removePlayer(p2.id); } }}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                              <ChevronDown className={'w-4 h-4 text-muted-foreground transition-transform ' + (isExpanded ? 'rotate-180' : '')} />
                            </div>
                          </div>

                          {/* Expanded: member details */}
                          {isExpanded && (
                            <div className="bg-muted/10 border-t border-border/30 px-4 pb-4 space-y-3">
                              {members.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">No player records found for this team. Players appear after they log in.</p>
                              ) : members.map(({ player, slot, name }) => {
                                const isEditing = editingPlayerId === player.id
                                return (
                                  <div key={player.id} className="mt-3 rounded-lg border border-border/50 bg-card/60 overflow-hidden">
                                    {/* Member header */}
                                    <div className="flex items-center gap-3 px-4 py-3 bg-card/80">
                                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                                        P{slot}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-foreground">{player.name || name}</p>
                                        <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                          <span className="text-xs text-muted-foreground font-mono">{player.id}</span>
                                          {player.isDisqualified
                                            ? <Badge variant="destructive" className="text-xs bg-destructive/20 text-destructive border-0">DQ</Badge>
                                            : player.round1Completed
                                            ? <Badge className="text-xs bg-neon-green/20 text-neon-green border-0">R1 Done</Badge>
                                            : <Badge variant="outline" className="text-xs text-muted-foreground">Pending</Badge>}
                                          <span className="text-xs text-primary">R1: {player.round1Score}</span>
                                          <span className="text-xs text-accent">R2: {player.round2Score}</span>
                                          <span className="text-xs font-bold text-foreground">Total: {player.score}</span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0">
                                        {player.round2Enabled ? (
                                          <Button size="sm" variant="outline" onClick={() => disableRound2(player.id)} className="h-7 text-xs border-neon-green/50 text-neon-green">
                                            <Unlock className="w-3 h-3 mr-1" />R2 On
                                          </Button>
                                        ) : (
                                          <Button size="sm" variant="outline" onClick={() => enableRound2(player.id)} disabled={!player.round1Completed} className="h-7 text-xs border-muted-foreground/30 text-muted-foreground disabled:opacity-50">
                                            <Lock className="w-3 h-3 mr-1" />R2 Off
                                          </Button>
                                        )}
                                        <Button size="sm" variant="outline" className="h-7 text-xs border-primary/50 text-primary"
                                          onClick={() => {
                                            if (isEditing) {
                                              setEditingPlayerId(null)
                                            } else {
                                              setEditingPlayerId(player.id)
                                              setEditForm({ name: player.name || '', college: player.college || '', department: player.department || '', yearOfStudy: player.yearOfStudy || '', contactNumber: player.contactNumber || '', email: player.email || '' })
                                            }
                                          }}>
                                          {isEditing ? 'Cancel' : 'Edit'}
                                        </Button>
                                        <Button size="sm" variant="ghost" className="h-7 text-destructive hover:bg-destructive/10"
                                          onClick={() => { if (window.confirm('Remove ' + player.name + ' from the game?')) removePlayer(player.id) }}>
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                      </div>
                                    </div>

                                    {/* Info row (when not editing) */}
                                    {!isEditing && (
                                      <div className="px-4 py-2 grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1 text-xs text-muted-foreground border-t border-border/30">
                                        {player.college && <span><span className="text-foreground/60">College:</span> {player.college}</span>}
                                        {player.department && <span><span className="text-foreground/60">Dept:</span> {player.department}</span>}
                                        {player.yearOfStudy && <span><span className="text-foreground/60">Year:</span> {player.yearOfStudy}</span>}
                                        {player.contactNumber && <span><span className="text-foreground/60">Phone:</span> {player.contactNumber}</span>}
                                        {player.email && <span className="md:col-span-2"><span className="text-foreground/60">Email:</span> {player.email}</span>}
                                      </div>
                                    )}

                                    {/* Edit form (when editing) */}
                                    {isEditing && (
                                      <div className="px-4 py-3 border-t border-border/30 space-y-3">
                                        <div className="grid grid-cols-2 gap-3">
                                          <div className="space-y-1">
                                            <Label className="text-xs">Name</Label>
                                            <Input value={editForm.name} onChange={e => setEditForm(f => ({...f, name: e.target.value}))} className="h-8 text-sm bg-input border-border" />
                                          </div>
                                          <div className="space-y-1">
                                            <Label className="text-xs">College</Label>
                                            <Input value={editForm.college} onChange={e => setEditForm(f => ({...f, college: e.target.value}))} className="h-8 text-sm bg-input border-border" />
                                          </div>
                                          <div className="space-y-1">
                                            <Label className="text-xs">Department</Label>
                                            <Input value={editForm.department} onChange={e => setEditForm(f => ({...f, department: e.target.value}))} className="h-8 text-sm bg-input border-border" />
                                          </div>
                                          <div className="space-y-1">
                                            <Label className="text-xs">Year</Label>
                                            <Input value={editForm.yearOfStudy} onChange={e => setEditForm(f => ({...f, yearOfStudy: e.target.value}))} className="h-8 text-sm bg-input border-border" />
                                          </div>
                                          <div className="space-y-1">
                                            <Label className="text-xs">Phone</Label>
                                            <Input value={editForm.contactNumber} onChange={e => setEditForm(f => ({...f, contactNumber: e.target.value}))} className="h-8 text-sm bg-input border-border" />
                                          </div>
                                          <div className="space-y-1">
                                            <Label className="text-xs">Email</Label>
                                            <Input value={editForm.email} onChange={e => setEditForm(f => ({...f, email: e.target.value}))} className="h-8 text-sm bg-input border-border" />
                                          </div>
                                        </div>
                                        <div className="flex justify-end gap-2">
                                          <Button size="sm" variant="ghost" onClick={() => setEditingPlayerId(null)} className="h-8 text-xs">Cancel</Button>
                                          <Button size="sm" className="h-8 text-xs bg-primary text-primary-foreground"
                                            disabled={isSavingEdit}
                                            onClick={async () => {
                                              setIsSavingEdit(true)
                                              await updatePlayerDetails(player.id, editForm)
                                              setEditingPlayerId(null)
                                              setIsSavingEdit(false)
                                            }}>
                                            {isSavingEdit ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                                            Save Changes
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>


        </Tabs>
      </main>
    </div>
  )
}
