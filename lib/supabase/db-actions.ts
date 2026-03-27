"use server"

import { createClient } from "./server"
import type { Player, Question, SQLChallenge, TableData, TestCase } from "../game-store"

// ============ TEAMS ============

export interface Team {
  code: string
  name: string
  player1Name: string
  player2Name: string | null
  player1Joined: boolean
  player2Joined: boolean
}

interface DbTeam {
  code: string
  name: string
  player1_name: string
  player2_name: string | null
  player1_joined: boolean
  player2_joined: boolean
}

function dbToTeam(row: DbTeam): Team {
  return {
    code: row.code,
    name: row.name,
    player1Name: row.player1_name,
    player2Name: row.player2_name,
    player1Joined: row.player1_joined,
    player2Joined: row.player2_joined,
  }
}

export async function fetchTeamByCode(code: string): Promise<Team | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .single()
    if (error || !data) return null
    return dbToTeam(data)
  } catch (e) {
    console.error('fetchTeamByCode error:', e)
    return null
  }
}

export async function fetchAllTeams(): Promise<Team[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('code', { ascending: true })
    if (error || !data) return []
    return data.map(dbToTeam)
  } catch (e) {
    console.error('fetchAllTeams error:', e)
    return []
  }
}

export async function createTeam(team: {
  code: string
  name: string
  player1Name: string
  player2Name?: string
}): Promise<Team | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('teams')
      .insert({
        code: team.code.toUpperCase().trim(),
        name: team.name.trim(),
        player1_name: team.player1Name.trim(),
        player2_name: team.player2Name?.trim() || null,
        player1_joined: false,
        player2_joined: false,
      })
      .select()
      .single()
    if (error || !data) {
      console.error('createTeam error:', error)
      return null
    }
    return dbToTeam(data)
  } catch (e) {
    console.error('createTeam error:', e)
    return null
  }
}

export async function deleteTeam(code: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('teams').delete().eq('code', code)
    return !error
  } catch (e) {
    console.error('deleteTeam error:', e)
    return false
  }
}

export async function updateTeamJoined(
  code: string,
  slot: 1 | 2,
  joined: boolean
): Promise<boolean> {
  try {
    const supabase = await createClient()
    const field = slot === 1 ? 'player1_joined' : 'player2_joined'
    const { error } = await supabase
      .from('teams')
      .update({ [field]: joined, updated_at: new Date().toISOString() })
      .eq('code', code)
    return !error
  } catch (e) {
    console.error('updateTeamJoined error:', e)
    return false
  }
}

export async function fetchTeamStatus(teamCode: string): Promise<{
  team: Team | null
  player1: { round1Completed: boolean; round2Completed: boolean; round2Enabled: boolean; isDisqualified: boolean } | null
  player2: { round1Completed: boolean; round2Completed: boolean; round2Enabled: boolean; isDisqualified: boolean } | null
}> {
  try {
    const supabase = await createClient()
    const [teamRes, p1Res, p2Res] = await Promise.all([
      supabase.from('teams').select('*').eq('code', teamCode).single(),
      supabase.from('players').select('round1_completed,round2_completed,round2_enabled,is_disqualified').eq('id', `${teamCode}_1`).single(),
      supabase.from('players').select('round1_completed,round2_completed,round2_enabled,is_disqualified').eq('id', `${teamCode}_2`).single(),
    ])

    const team = teamRes.data ? dbToTeam(teamRes.data) : null
    const player1 = p1Res.data
      ? { round1Completed: p1Res.data.round1_completed, round2Completed: p1Res.data.round2_completed, round2Enabled: p1Res.data.round2_enabled, isDisqualified: p1Res.data.is_disqualified }
      : null
    const player2 = p2Res.data
      ? { round1Completed: p2Res.data.round1_completed, round2Completed: p2Res.data.round2_completed, round2Enabled: p2Res.data.round2_enabled, isDisqualified: p2Res.data.is_disqualified }
      : null

    return { team, player1, player2 }
  } catch (e) {
    console.error('fetchTeamStatus error:', e)
    return { team: null, player1: null, player2: null }
  }
}

export async function getTeamLeaderboard(): Promise<{
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
}[]> {
  try {
    const supabase = await createClient()
    const [teamsRes, playersRes] = await Promise.all([
      supabase.from('teams').select('*').order('code'),
      supabase.from('players').select('id,score,round1_score,round2_score,round1_completed,round2_completed,is_disqualified').eq('is_disqualified', false),
    ])

    const teams = (teamsRes.data || []).map(dbToTeam)
    const players = playersRes.data || []

    return teams.map(team => {
      const p1 = players.find(p => p.id === `${team.code}_1`)
      const p2 = players.find(p => p.id === `${team.code}_2`)
      const p1Score = p1?.score ?? 0
      const p2Score = p2?.score ?? 0
      const p1R1 = p1?.round1_score ?? 0
      const p2R1 = p2?.round1_score ?? 0
      const p1R2 = p1?.round2_score ?? 0
      const p2R2 = p2?.round2_score ?? 0
      const playerCount = team.player2Name ? 2 : 1
      const totalScore = team.player2Name ? p1Score + p2Score : p1Score
      const totalR1 = team.player2Name ? p1R1 + p2R1 : p1R1
      const totalR2 = team.player2Name ? p1R2 + p2R2 : p1R2

      const p1R1Done = p1?.round1_completed ?? false
      const p2R1Done = p2?.round1_completed ?? false
      const p1R2Done = p1?.round2_completed ?? false
      const p2R2Done = p2?.round2_completed ?? false

      const round1Completed = p1R1Done || p2R1Done
      const round2Completed = p1R2Done || p2R2Done
      const bothCompleted = team.player2Name
        ? (p1R1Done && p1R2Done) || (p2R1Done && p2R2Done)
        : p1R1Done && p1R2Done

      return {
        teamCode: team.code,
        teamName: team.name,
        player1Name: team.player1Name,
        player2Name: team.player2Name,
        player1Score: p1Score,
        player2Score: p2Score,
        avgScore: Math.round(totalScore / playerCount),
        round1Avg: Math.round(totalR1 / playerCount),
        round2Avg: Math.round(totalR2 / playerCount),
        round1Completed,
        round2Completed,
        bothCompleted,
      }
    }).sort((a, b) => b.avgScore - a.avgScore)
  } catch (e) {
    console.error('getTeamLeaderboard error:', e)
    return []
  }
}

// ============ ROUND 1 QUESTIONS ============

interface DbRound1Question {
  id: number
  type: string
  difficulty: string
  question: string
  scenario: string | null
  options: string[]
  correct_answer: number
  points: number
  is_active: boolean
}

function dbToQuestion(row: DbRound1Question): Question {
  return {
    id: row.id,
    type: row.type as 'mcq' | 'query' | 'scenario',
    difficulty: row.difficulty as 'easy' | 'medium' | 'hard',
    question: row.question,
    scenario: row.scenario || undefined,
    options: row.options,
    correctAnswer: row.correct_answer,
    points: row.points,
  }
}

function questionToDb(q: Omit<Question, 'id'>) {
  return {
    type: q.type,
    difficulty: q.difficulty,
    question: q.question,
    scenario: q.scenario || null,
    options: q.options,
    correct_answer: q.correctAnswer,
    points: q.points,
    is_active: true,
  }
}

export async function fetchRound1Questions(): Promise<Question[]> {
  try {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("round1_questions")
    .select("*")
    .eq("is_active", true)
    .order("difficulty", { ascending: true })
    .order("id", { ascending: true })

  if (error) {
    console.error("Error fetching round1 questions:", error)
    return []
  }

  return (data || []).map(dbToQuestion)
  } catch (e) {
    console.error("fetchRound1Questions error:", e)
    return []
  }
}

export async function createRound1Question(question: Omit<Question, 'id'>): Promise<Question | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("round1_questions")
    .insert(questionToDb(question))
    .select()
    .single()

  if (error) {
    console.error("Error creating round1 question:", error)
    return null
  }

  return dbToQuestion(data)
}

export async function updateRound1Question(id: number, question: Partial<Omit<Question, 'id'>>): Promise<Question | null> {
  const supabase = await createClient()
  
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (question.type !== undefined) updateData.type = question.type
  if (question.difficulty !== undefined) updateData.difficulty = question.difficulty
  if (question.question !== undefined) updateData.question = question.question
  if (question.scenario !== undefined) updateData.scenario = question.scenario || null
  if (question.options !== undefined) updateData.options = question.options
  if (question.correctAnswer !== undefined) updateData.correct_answer = question.correctAnswer
  if (question.points !== undefined) updateData.points = question.points

  const { data, error } = await supabase
    .from("round1_questions")
    .update(updateData)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating round1 question:", error)
    return null
  }

  return dbToQuestion(data)
}

export async function deleteRound1Question(id: number): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("round1_questions")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting round1 question:", error)
    return false
  }

  return true
}

// ============ ROUND 2 CHALLENGES ============

interface DbRound2Challenge {
  id: number
  difficulty: string
  title: string
  description: string
  scenario: string | null
  schema: string | null
  base_table_data: TableData[]
  test_cases: TestCase[]
  expected_keywords: string[]
  total_points: number
  time_limit: number
  is_active: boolean
  correct_query: string | null
}

function normalizeTableData(td: TableData): TableData {
  return {
    tableName: td?.tableName || '',
    columns: td?.columns || [],
    rows: td?.rows || [],
  }
}

function normalizeTestCase(tc: TestCase): TestCase {
  return {
    ...tc,
    tableData: (tc?.tableData || []).map(normalizeTableData),
    expectedOutput: tc?.expectedOutput || [],
    expectedColumns: tc?.expectedColumns || [],
  }
}

function unescapeNewlines(str: string | null | undefined): string {
  return (str || '').replace(/\\n/g, '\n')
}

function dbToChallenge(row: DbRound2Challenge): SQLChallenge {
  return {
    id: row.id,
    difficulty: row.difficulty as 'easy' | 'medium' | 'hard',
    title: row.title,
    description: unescapeNewlines(row.description),
    scenario: unescapeNewlines(row.scenario),
    schema: unescapeNewlines(row.schema),
    baseTableData: (row.base_table_data || []).map(normalizeTableData),
    testCases: (row.test_cases || []).map(normalizeTestCase),
    expectedKeywords: row.expected_keywords || [],
    totalPoints: row.total_points,
    timeLimit: row.time_limit,
    correctQuery: row.correct_query || undefined,
  }
}

function challengeToDb(c: Omit<SQLChallenge, 'id'>) {
  return {
    difficulty: c.difficulty,
    title: c.title,
    description: c.description,
    scenario: c.scenario || null,
    schema: c.schema || null,
    base_table_data: c.baseTableData,
    test_cases: c.testCases,
    expected_keywords: c.expectedKeywords,
    total_points: c.totalPoints,
    time_limit: c.timeLimit,
    is_active: true,
    correct_query: c.correctQuery || null,
  }
}

export async function fetchRound2Challenges(): Promise<SQLChallenge[]> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from("round2_challenges")
      .select("*")
      .eq("is_active", true)
      .order("id", { ascending: true })

    if (error) {
      console.error("Error fetching round2 challenges:", error)
      return []
    }

    const difficultyOrder: Record<string, number> = { easy: 0, medium: 1, hard: 2 }
    return (data || [])
      .map(dbToChallenge)
      .sort((a, b) => {
        const da = difficultyOrder[a.difficulty?.toLowerCase() ?? ""] ?? 99
        const db = difficultyOrder[b.difficulty?.toLowerCase() ?? ""] ?? 99
        return da - db
      })
  } catch (e) {
    console.error("fetchRound2Challenges error:", e)
    return []
  }
}

export async function createRound2Challenge(challenge: Omit<SQLChallenge, 'id'>): Promise<SQLChallenge | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("round2_challenges")
    .insert(challengeToDb(challenge))
    .select()
    .single()

  if (error) {
    console.error("Error creating round2 challenge:", error)
    return null
  }

  return dbToChallenge(data)
}

export async function updateRound2Challenge(id: number, challenge: Partial<Omit<SQLChallenge, 'id'>>): Promise<SQLChallenge | null> {
  const supabase = await createClient()
  
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (challenge.difficulty !== undefined) updateData.difficulty = challenge.difficulty
  if (challenge.title !== undefined) updateData.title = challenge.title
  if (challenge.description !== undefined) updateData.description = challenge.description
  if (challenge.scenario !== undefined) updateData.scenario = challenge.scenario || null
  if (challenge.schema !== undefined) updateData.schema = challenge.schema || null
  if (challenge.baseTableData !== undefined) updateData.base_table_data = challenge.baseTableData
  if (challenge.testCases !== undefined) updateData.test_cases = challenge.testCases
  if (challenge.expectedKeywords !== undefined) updateData.expected_keywords = challenge.expectedKeywords
  if (challenge.totalPoints !== undefined) updateData.total_points = challenge.totalPoints
  if (challenge.timeLimit !== undefined) updateData.time_limit = challenge.timeLimit
  if (challenge.correctQuery !== undefined) updateData.correct_query = challenge.correctQuery || null

  const { data, error } = await supabase
    .from("round2_challenges")
    .update(updateData)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating round2 challenge:", error)
    return null
  }

  return dbToChallenge(data)
}

export async function deleteRound2Challenge(id: number): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("round2_challenges")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting round2 challenge:", error)
    return false
  }

  return true
}

// Convert database row to Player type
function rowToPlayer(row: {
  id: string
  name: string
  college?: string | null
  department?: string | null
  year_of_study?: string | null
  contact_number?: string | null
  email?: string | null
  score: number
  round1_score: number
  round2_score: number
  round1_completed: boolean
  round2_enabled: boolean
  round2_completed: boolean
  tab_switch_count: number
  is_disqualified: boolean
  round1_answers: Record<number, number> | null
  start_time: number | null
  r1_checkpoints?: object | null
  r2_checkpoints?: object | null
  start_time2?: number | null
  full_scrn_exit_count?: number | null
  tab_switch_count2?: number | null
  full_scrn_exit_count2?: number | null
  window_button_count?: number | null
  window_button_count2?: number | null
}): Player {
  return {
    id: row.id,
    name: row.name,
    score: row.score,
    round1Score: row.round1_score,
    round2Score: row.round2_score,
    round1Completed: row.round1_completed,
    round2Enabled: row.round2_enabled,
    round2Completed: row.round2_completed,
    tabSwitchCount: row.tab_switch_count,
    fullScrnExitCount: row.full_scrn_exit_count ?? 0,
    tabSwitchCount2: row.tab_switch_count2 ?? 0,
    fullScrnExitCount2: row.full_scrn_exit_count2 ?? 0,
    windowButtonCount: row.window_button_count ?? 0,
    windowButtonCount2: row.window_button_count2 ?? 0,
    isDisqualified: row.is_disqualified,
    round1Answers: row.round1_answers || {},
    startTime: row.start_time ?? undefined,
    r1Checkpoints: row.r1_checkpoints ?? undefined,
    r2Checkpoints: row.r2_checkpoints ?? undefined,
    startTime2: row.start_time2 ?? undefined,
    college: row.college ?? '',
    department: row.department ?? '',
    yearOfStudy: row.year_of_study ?? '',
    contactNumber: row.contact_number ?? '',
    email: row.email ?? '',
    teamCode: (row as any).team_code ?? undefined,
    playerSlot: (row as any).player_slot ?? 1,
  }
}

// Convert Player to database row format
function playerToRow(player: Player) {
  return {
    id: player.id,
    name: player.name,
    college: player.college || null,
    department: player.department || null,
    year_of_study: player.yearOfStudy || null,
    contact_number: player.contactNumber || null,
    email: player.email || null,
    score: player.score,
    round1_score: player.round1Score,
    round2_score: player.round2Score,
    round1_completed: player.round1Completed,
    round2_enabled: player.round2Enabled,
    round2_completed: player.round2Completed,
    tab_switch_count: player.tabSwitchCount,
    is_disqualified: player.isDisqualified,
    round1_answers: player.round1Answers,
    start_time: player.startTime ?? null,
    r1_checkpoints: player.r1Checkpoints ?? null,
    r2_checkpoints: player.r2Checkpoints ?? null,
    start_time2: player.startTime2 ?? null,
    full_scrn_exit_count: player.fullScrnExitCount ?? 0,
    tab_switch_count2: player.tabSwitchCount2 ?? 0,
    full_scrn_exit_count2: player.fullScrnExitCount2 ?? 0,
    window_button_count: player.windowButtonCount ?? 0,
    window_button_count2: player.windowButtonCount2 ?? 0,
    team_code: player.teamCode || null,
    player_slot: player.playerSlot || 1,
  }
}

export async function updatePlayerCheckpoints(
  playerId: string,
  data: {
    r1Checkpoints?: object | null
    r2Checkpoints?: object | null
    startTime?: number | null
    startTime2?: number | null
    round1Answers?: Record<number, number> | null
  }
): Promise<boolean> {
  try {
    const supabase = await createClient()
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (data.r1Checkpoints !== undefined) update.r1_checkpoints = data.r1Checkpoints
    if (data.r2Checkpoints !== undefined) update.r2_checkpoints = data.r2Checkpoints
    if (data.startTime !== undefined) update.start_time = data.startTime
    if (data.startTime2 !== undefined) update.start_time2 = data.startTime2
    if (data.round1Answers !== undefined) update.round1_answers = data.round1Answers

    const { error } = await supabase
      .from('players')
      .update(update)
      .eq('id', playerId)

    if (error) {
      console.error('Error updating player checkpoints:', error)
      return false
    }
    return true
  } catch (e) {
    console.error('updatePlayerCheckpoints error:', e)
    return false
  }
}

export async function fetchAllPlayers(): Promise<Player[]> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .order("score", { ascending: false })

    if (error) {
      console.error("Error fetching players:", error)
      return []
    }

    return (data || []).map(rowToPlayer)
  } catch (e) {
    console.error("fetchAllPlayers error:", e)
    return []
  }
}

export async function fetchPlayerById(id: string): Promise<Player | null> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching player:", error)
      return null
    }

    return rowToPlayer(data)
  } catch (e) {
    console.error("fetchPlayerById error:", e)
    return null
  }
}

export async function createPlayer(
  code: string,
  studentDetails?: {
    name?: string
    college?: string
    department?: string
    yearOfStudy?: string
    contactNumber?: string
    email?: string
    teamCode?: string
    playerSlot?: 1 | 2
  }
): Promise<Player | null> {
  const supabase = await createClient()
  const normalizedCode = code.toUpperCase().trim()

  const newPlayer: Player = {
    id: normalizedCode,
    name: studentDetails?.name || normalizedCode,
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
    isDisqualified: false,
    round1Answers: {},
    college: studentDetails?.college || '',
    department: studentDetails?.department || '',
    yearOfStudy: studentDetails?.yearOfStudy || '',
    contactNumber: studentDetails?.contactNumber || '',
    email: studentDetails?.email || '',
    teamCode: studentDetails?.teamCode,
    playerSlot: studentDetails?.playerSlot || 1,
  }

  const { data, error } = await supabase
    .from("players")
    .insert(playerToRow(newPlayer))
    .select()
    .single()

  if (error) {
    console.error("Error creating player:", error)
    return null
  }

  return rowToPlayer(data)
}

export async function updatePlayer(player: Player): Promise<Player | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("players")
    .update({
      ...playerToRow(player),
      updated_at: new Date().toISOString(),
    })
    .eq("id", player.id)
    .select()
    .single()

  if (error) {
    console.error("Error updating player:", error)
    return null
  }

  return rowToPlayer(data)
}

export async function deletePlayer(id: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("players")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting player:", error)
    return false
  }

  return true
}

export async function enableRound2ForPlayer(playerId: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("players")
    .update({ round2_enabled: true, updated_at: new Date().toISOString() })
    .eq("id", playerId)

  if (error) {
    console.error("Error enabling round 2:", error)
    return false
  }

  return true
}

export async function disableRound2ForPlayer(playerId: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("players")
    .update({ round2_enabled: false, updated_at: new Date().toISOString() })
    .eq("id", playerId)

  if (error) {
    console.error("Error disabling round 2:", error)
    return false
  }

  return true
}

export async function resetAllPlayers(): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("players")
    .update({
      score: 0,
      round1_score: 0,
      round2_score: 0,
      round1_completed: false,
      round2_enabled: false,
      round2_completed: false,
      tab_switch_count: 0,
      full_scrn_exit_count: 0,
      tab_switch_count2: 0,
      full_scrn_exit_count2: 0,
      is_disqualified: false,
      round1_answers: {},
      start_time: null,
      r1_checkpoints: null,
      r2_checkpoints: null,
      start_time2: null,
      updated_at: new Date().toISOString(),
    })
    .neq("id", "") // Update all rows

  if (error) {
    console.error("Error resetting players:", error)
    return false
  }

  return true
}

export async function getLeaderboard(): Promise<Player[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("is_disqualified", false)
    .order("score", { ascending: false })

  if (error) {
    console.error("Error fetching leaderboard:", error)
    return []
  }

  return (data || []).map(rowToPlayer)
}
