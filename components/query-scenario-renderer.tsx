'use client'

import { Table2, Code2, GitFork, Info } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────

type Section =
  | { kind: 'table';    header: string; rows: string[][] }
  | { kind: 'sql';      header: string; content: string; isFaulty: boolean }
  | { kind: 'schedule'; header: string; steps: string[] }
  | { kind: 'info';     header: string; lines: string[] }

// ── SQL keyword highlighter ────────────────────────────────────────────────

const SQL_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'HAVING',
  'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN', 'JOIN',
  'INSERT INTO', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE',
  'CREATE TRIGGER', 'CREATE TABLE', 'CREATE INDEX', 'CREATE',
  'ALTER TABLE', 'ALTER', 'DROP TABLE', 'DROP',
  'FOR EACH ROW', 'AFTER', 'BEFORE',
  'BEGIN', 'END', 'COMMIT', 'ROLLBACK', 'SAVEPOINT',
  'IS NOT NULL', 'IS NULL', 'NOT NULL', 'NOT IN', 'NOT EXISTS',
  'NOT', 'AND', 'OR', 'IN', 'BETWEEN', 'LIKE', 'IS', 'AS', 'ON',
  'DISTINCT', 'AVG', 'SUM', 'COUNT', 'MIN', 'MAX',
  'NULL', 'TRUE', 'FALSE', 'NEW', 'OLD',
  'SET', 'INTO', 'VALUES', 'UNIQUE',
  'PRIMARY KEY', 'FOREIGN KEY', 'REFERENCES', 'DEFAULT', 'CHECK',
  'IF', 'EXISTS', 'TRIGGER', 'TABLE', 'INDEX',
]

function highlightSql(raw: string): string {
  let s = raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  const sorted = [...SQL_KEYWORDS].sort((a, b) => b.length - a.length)
  for (const kw of sorted) {
    const esc = kw.replace(/\s+/g, '\\s+')
    s = s.replace(new RegExp(`(?<![\\w])${esc}(?![\\w])`, 'gi'), m =>
      `<span class="sql-kw">${m}</span>`,
    )
  }
  s = s.replace(/'([^']*)'/g, `<span class="sql-str">'$1'</span>`)
  s = s.replace(/--[^\n]*/g, m => `<span class="sql-cmt">${m}</span>`)
  s = s.replace(/\b(\d+)\b/g, `<span class="sql-num">$1</span>`)
  return s
}

// ── Normalise raw string from DB ───────────────────────────────────────────
// Supabase may store literal \n (two chars) if the SQL insert used standard
// single-quotes without E-escaping.  Convert those to real newlines first.

function normalise(raw: string): string {
  return raw.replace(/\\n/g, '\n')
}

// ── Helpers ────────────────────────────────────────────────────────────────

const SQL_START = /^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|BEGIN|END|TRIGGER|COMMIT|ROLLBACK)\b/i

function isHeader(line: string): boolean {
  const t = line.trim()
  return t.endsWith(':') && !t.includes('|')
}

function classifyBody(
  header: string,
  body: string[],
): 'table' | 'sql' | 'schedule' | 'info' {
  const h = header.toLowerCase()
  const hasPipes = body.some(l => l.includes('|'))
  const looksSql  = body.some(l => SQL_START.test(l))
  const isSched   = h.includes('schedule') || h.includes('concurrent')

  if (hasPipes)  return 'table'
  if (looksSql || h.includes('query') || h.includes('trigger')) return 'sql'
  if (isSched)   return 'schedule'
  return 'info'
}

// ── Line-by-line parser ────────────────────────────────────────────────────
// Flushes a new section every time:
//   • a blank line appears (after content)
//   • a header line appears (line ending with ':' and no '|')
// This correctly handles:
//   • free-form narrative prose before tables
//   • nested sub-table headers (e.g. "Inventory:" then "Wallet:" in Q4)
//   • bullet-point lists, FD lists, etc.

function parseScenario(raw: string): Section[] {
  const text    = normalise(raw)
  const lines   = text.split('\n')
  const sections: Section[] = []

  let curHeader = ''
  let curBody: string[] = []

  function flush() {
    const body = curBody.filter(l => l.trim() !== '')
    if (!body.length && !curHeader) { curHeader = ''; curBody = []; return }

    if (!body.length) {
      // Header with no body — emit as a standalone info label
      sections.push({ kind: 'info', header: '', lines: [curHeader.replace(/:$/, '')] })
      curHeader = ''; curBody = []; return
    }

    const kind = classifyBody(curHeader, body)
    const h    = curHeader

    if (kind === 'table') {
      const rows = body.map(l => l.split('|').map(c => c.trim()))
      sections.push({ kind: 'table', header: h, rows })
    } else if (kind === 'sql') {
      const isFaulty = h.toLowerCase().includes('fault') || h.toLowerCase().includes('wrong')
      sections.push({ kind: 'sql', header: h, content: body.join('\n'), isFaulty })
    } else if (kind === 'schedule') {
      sections.push({ kind: 'schedule', header: h, steps: body })
    } else {
      sections.push({ kind: 'info', header: h, lines: body })
    }

    curHeader = ''; curBody = []
  }

  for (const line of lines) {
    const trimmed = line.trim()

    if (trimmed === '') {
      if (curBody.length > 0 || curHeader) flush()
      continue
    }

    if (isHeader(trimmed)) {
      // New section header — flush whatever we have first
      if (curBody.length > 0 || curHeader) flush()
      curHeader = trimmed
      continue
    }

    curBody.push(line)
  }

  if (curBody.length > 0 || curHeader) flush()
  return sections
}

// ── Sub-components ─────────────────────────────────────────────────────────

function TableSection({ header, rows }: { header: string; rows: string[][] }) {
  if (!rows.length) return null
  const [headerRow, ...dataRows] = rows
  const name = header.replace(/:$/, '')
  return (
    <div className="space-y-1">
      {name && (
        <div className="flex items-center gap-1.5">
          <Table2 className="w-3 h-3 text-neon-orange shrink-0" />
          <span className="text-[10px] font-bold text-neon-orange uppercase tracking-widest">
            {name}
          </span>
        </div>
      )}
      <div className="rounded-md overflow-hidden border border-neon-orange/25">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-neon-orange/15">
                {headerRow.map((cell, ci) => (
                  <th
                    key={ci}
                    className="px-3 py-1.5 text-left font-bold text-neon-orange/90 border-b border-neon-orange/20 border-r border-neon-orange/10 last:border-r-0 whitespace-nowrap"
                  >
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataRows.map((row, ri) => (
                <tr key={ri} className={ri % 2 === 0 ? 'bg-background/40' : 'bg-muted/20'}>
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className="px-3 py-1.5 text-foreground/80 border-b border-border/20 border-r border-border/10 last:border-r-0 font-mono text-[11px]"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function SqlSection({
  header,
  content,
  isFaulty,
}: {
  header: string
  content: string
  isFaulty: boolean
}) {
  const label = header ? header.replace(/:$/, '') : 'SQL Query'
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <Code2 className={`w-3 h-3 shrink-0 ${isFaulty ? 'text-destructive' : 'text-violet-400'}`} />
        <span className={`text-[10px] font-bold uppercase tracking-widest ${isFaulty ? 'text-destructive' : 'text-violet-400'}`}>
          {label}
        </span>
        {isFaulty && (
          <span className="text-[9px] font-bold text-destructive bg-destructive/15 border border-destructive/30 rounded px-1.5 py-0.5">
            FAULTY
          </span>
        )}
      </div>
      <div className={`rounded-md border ${isFaulty ? 'border-destructive/35 bg-destructive/6' : 'border-violet-500/30 bg-[#0e0b1e]'}`}>
        <style>{`.sql-kw{color:#a78bfa;font-weight:600}.sql-str{color:#34d399}.sql-cmt{color:#6b7280;font-style:italic}.sql-num{color:#fb923c}`}</style>
        <pre
          className="px-4 py-3 text-[12px] font-mono leading-6 text-slate-200 overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: highlightSql(content) }}
        />
      </div>
    </div>
  )
}

function ScheduleSection({ header, steps }: { header: string; steps: string[] }) {
  const label = header ? header.replace(/:$/, '') : 'Schedule'
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <GitFork className="w-3 h-3 text-sky-400 shrink-0" />
        <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">{label}</span>
      </div>
      <div className="rounded-md border border-sky-500/25 bg-sky-500/5 px-3 py-2.5 space-y-1">
        {steps.map((step, i) => {
          const isWaiting = step.toUpperCase().includes('WAITING')
          const isT1 = /\bT1\b/.test(step)
          const isT2 = /\bT2\b/.test(step)
          return (
            <div key={i} className="flex items-start gap-2.5 font-mono text-[11px]">
              <span className="text-sky-500/50 shrink-0 w-4 text-right">{i + 1}</span>
              <span className={isWaiting ? 'text-yellow-400' : isT1 ? 'text-violet-300' : isT2 ? 'text-sky-300' : 'text-foreground/75'}>
                {step}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function InfoSection({ header, lines }: { header: string; lines: string[] }) {
  const name = header ? header.replace(/:$/, '') : ''
  return (
    <div className="space-y-1">
      {name && (
        <p className="text-[10px] font-semibold text-primary/70 uppercase tracking-wider">{name}</p>
      )}
      <div className="space-y-1">
        {lines.map((line, i) => {
          const t = line.trim()
          if (!t) return null

          // Bullet point (• or -)
          if (t.startsWith('•') || (t.startsWith('-') && !t.startsWith('--'))) {
            return (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className="text-primary/60 shrink-0 mt-px">•</span>
                <span className="text-foreground/75 leading-relaxed">{t.replace(/^[•\-]\s*/, '')}</span>
              </div>
            )
          }

          // label: value  (colon within first ~35 chars, not a URL-like thing)
          const ci = t.indexOf(':')
          if (ci > 0 && ci < 35 && ci < t.length - 1 && !t.slice(0, ci).includes(' ')) {
            const lbl = t.slice(0, ci).trim()
            const val = t.slice(ci + 1).trim()
            return (
              <div key={i} className="flex items-start gap-2 text-xs">
                <Info className="w-3 h-3 text-primary/50 shrink-0 mt-0.5" />
                <span>
                  <span className="text-primary/75 font-semibold">{lbl}: </span>
                  <span className="text-foreground/70">{val}</span>
                </span>
              </div>
            )
          }

          // Prose paragraph
          return (
            <p key={i} className="text-xs text-foreground/70 leading-relaxed">
              {t}
            </p>
          )
        })}
      </div>
    </div>
  )
}

// ── Root export ────────────────────────────────────────────────────────────

export function QueryScenarioRenderer({
  scenario,
  label = 'Scenario',
}: {
  scenario: string
  label?: string
}) {
  const sections = parseScenario(scenario)

  return (
    <div className="rounded-xl border border-neon-orange/30 bg-neon-orange/5 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-neon-orange/10 border-b border-neon-orange/20">
        <div className="w-2 h-2 rounded-full bg-neon-orange shrink-0" />
        <p className="text-[10px] font-bold text-neon-orange uppercase tracking-widest">
          {label}
        </p>
      </div>
      <div className="p-3 space-y-4">
        {sections.map((sec, i) => {
          if (sec.kind === 'table')    return <TableSection    key={i} header={sec.header} rows={sec.rows} />
          if (sec.kind === 'sql')      return <SqlSection      key={i} header={sec.header} content={sec.content} isFaulty={sec.isFaulty} />
          if (sec.kind === 'schedule') return <ScheduleSection key={i} header={sec.header} steps={sec.steps} />
          return                              <InfoSection     key={i} header={sec.header} lines={sec.lines} />
        })}
      </div>
    </div>
  )
}
