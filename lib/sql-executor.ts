import { PGlite } from '@electric-sql/pglite'
import type { TestCase, TestCaseResult, TableData } from './game-store'

// Result type for executing a query and getting output
export interface QueryExecutionResult {
  columns: string[]
  rows: (string | number | null)[][]
  error?: string
}

// Singleton PGlite instance — WASM binary is compiled only once
let _db: PGlite | null = null
let _dbReady: Promise<PGlite> | null = null

async function getDb(): Promise<PGlite> {
  if (_dbReady) return _dbReady
  _dbReady = (async () => {
    const instance = new PGlite()
    await instance.waitReady
    _db = instance
    return instance
  })()
  return _dbReady
}

// Drop all user tables so the database is clean between test cases
async function resetDb(db: PGlite): Promise<void> {
  const result = await db.query<{ tablename: string }>(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`
  )
  for (const row of result.rows) {
    await db.exec(`DROP TABLE IF EXISTS "${row.tablename}" CASCADE`)
  }
}

// Create table DDL from TableData
function buildCreateTableSQL(table: TableData): string {
  const colDefs = table.columns.map(col => {
    let type = 'TEXT'
    switch (col.type.toUpperCase()) {
      case 'INT':
      case 'INTEGER':
        type = 'INTEGER'
        break
      case 'DECIMAL':
      case 'FLOAT':
      case 'DOUBLE':
      case 'NUMERIC':
        type = 'NUMERIC'
        break
      case 'DATE':
        type = 'DATE'
        break
      case 'BOOLEAN':
        type = 'BOOLEAN'
        break
      default:
        type = 'TEXT'
    }
    const pk = col.isPrimaryKey ? ' PRIMARY KEY' : ''
    return `"${col.name}" ${type}${pk}`
  })
  return `CREATE TABLE ${table.tableName} (${colDefs.join(', ')})`
}

// Build INSERT statements for table data
function buildInsertSQL(table: TableData): string[] {
  if (table.rows.length === 0) return []
  
  const statements: string[] = []
  const colNames = table.columns.map(c => `"${c.name}"`).join(', ')
  
  for (const row of table.rows) {
    const values = row.map(val => {
      if (val === null) return 'NULL'
      if (typeof val === 'number') return String(val)
      return `'${String(val).replace(/'/g, "''")}'`
    }).join(', ')
    statements.push(`INSERT INTO ${table.tableName} (${colNames}) VALUES (${values})`)
  }
  
  return statements
}

// Set up tables in the singleton DB for a given set of TableData
async function loadTables(db: PGlite, tableData: TableData[]): Promise<void> {
  await resetDb(db)
  for (const table of tableData) {
    await db.exec(buildCreateTableSQL(table))
    for (const stmt of buildInsertSQL(table)) {
      await db.exec(stmt)
    }
  }
}

// Execute a query against table data and return the result (columns + rows)
export async function executeQueryOnTableData(
  query: string,
  tableData: TableData[]
): Promise<QueryExecutionResult> {
  const db = await getDb()
  try {
    await loadTables(db, tableData)
    const queryResult = await db.query(query)
    const columns = queryResult.fields?.map(f => f.name) || []
    const rows: (string | number | null)[][] = queryResult.rows.map(row => {
      const rowObj = row as Record<string, unknown>
      return columns.map(colName => {
        const v = rowObj[colName]
        if (v === null || v === undefined) return null
        if (typeof v === 'number') return v
        return String(v)
      })
    })
    return { columns, rows }
  } catch (e) {
    return {
      columns: [],
      rows: [],
      error: e instanceof Error ? e.message : 'SQL execution error'
    }
  }
}

// Compare results with strict exact matching — both row order and column order must match
function compareResults(
  actual: (string | number | null)[][],
  expected: (string | number | null)[][]
): boolean {
  if (actual.length !== expected.length) return false

  const normalizeVal = (v: string | number | null): string =>
    v === null ? 'NULL' : String(v).trim().toLowerCase()

  for (let r = 0; r < actual.length; r++) {
    const actualRow = actual[r]
    const expectedRow = expected[r]
    if (actualRow.length !== expectedRow.length) return false
    for (let c = 0; c < actualRow.length; c++) {
      if (normalizeVal(actualRow[c]) !== normalizeVal(expectedRow[c])) return false
    }
  }
  return true
}

export async function runTestCasesWithEngine(
  userQuery: string,
  testCases: TestCase[],
  correctQuery?: string
): Promise<TestCaseResult[]> {
  const db = await getDb()
  const results: TestCaseResult[] = []
  
  for (const testCase of testCases) {
    try {
      // Load fresh tables for this test case
      await loadTables(db, testCase.tableData)

      // Helper: extract rows in exact column order using the fields metadata
      const extractRows = (
        fields: { name: string }[],
        rows: Record<string, unknown>[]
      ): (string | number | null)[][] => {
        const cols = fields.map(f => f.name)
        return rows.map(row => cols.map(col => {
          const v = row[col]
          if (v === null || v === undefined) return null
          if (typeof v === 'number') return v
          return String(v)
        }))
      }

      // Compute expected output by running correctQuery when provided
      let expectedOutput: (string | number | null)[][] = testCase.expectedOutput
      if (correctQuery) {
        try {
          const correctResult = await db.query(correctQuery)
          expectedOutput = extractRows(
            correctResult.fields ?? [],
            correctResult.rows as Record<string, unknown>[]
          )
        } catch {
          expectedOutput = testCase.expectedOutput
        }
      }

      // Execute user's query
      const queryResult = await db.query(userQuery)
      const actualRows = extractRows(
        queryResult.fields ?? [],
        queryResult.rows as Record<string, unknown>[]
      )
      
      const passed = compareResults(actualRows, expectedOutput)
      
      results.push({
        testCaseId: testCase.id,
        passed,
        actualOutput: actualRows,
        error: passed ? undefined : 'Output does not match expected result'
      })
    } catch (e) {
      results.push({
        testCaseId: testCase.id,
        passed: false,
        actualOutput: null,
        error: e instanceof Error ? e.message : 'SQL execution error'
      })
    }
  }
  
  return results
}
