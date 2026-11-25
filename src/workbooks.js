import { read, utils } from 'xlsx'

const matchHeaders = ['match_id', 'home_team', 'home_goals', 'away_goals', 'away_team']
const text = (value) => String(value ?? '').trim()
const blank = (value) => text(value) === ''

function openWorkbook(buffer) {
  try {
    const bytes = new Uint8Array(buffer)
    if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) throw new Error()
    return read(bytes, { type: 'array' })
  } catch {
    throw new Error('Le classeur .xlsx est illisible.')
  }
}

function readTable(workbook, name, headerRow, headers) {
  const sheet = workbook.Sheets[name]
  if (!sheet?.['!ref']) throw new Error(`Feuille « ${name} » absente ou vide.`)
  const range = utils.decode_range(sheet['!ref'])
  range.s.r = headerRow - 1
  range.s.c = 0
  const [labels = [], ...rows] = utils.sheet_to_json(sheet, {
    range, header: 1, raw: true, defval: null, blankrows: true,
  })
  const indexes = headers.map((header) => {
    const index = labels.findIndex((label) => text(label) === header)
    if (index < 0 || labels.findLastIndex((label) => text(label) === header) !== index) {
      throw new Error(`Ligne ${headerRow} — La colonne « ${header} » doit apparaître une seule fois.`)
    }
    return index
  })
  return rows.map((row, index) => ({
    line: headerRow + index + 1,
    values: indexes.map((column) => row[column]),
  }))
}

export function parseRoster(buffer) {
  const rows = readTable(openWorkbook(buffer), 'Teams', 1, ['tournament_team', 'player_name', 'club'])
  const roster = new Map()
  for (const { line, values } of rows) {
    if (values.every(blank)) continue
    const [team, player, club] = values.map(text)
    if (!team || roster.has(team)) throw new Error(`Feuille Teams, ligne ${line} — Nom d’équipe manquant ou en double.`)
    roster.set(team, { team, player, club })
  }
  if (!roster.size) throw new Error('La feuille Teams ne contient aucune équipe.')
  return roster
}

export function parseWeek(buffer, week, roster) {
  const workbook = openWorkbook(buffer)
  if (text(workbook.Sheets.Matchweek?.B2?.v) !== week.id) {
    throw new Error(`Feuille Matchweek, ligne 2 (B2) — Identifiant attendu « ${week.id} ».`)
  }
  const rows = readTable(workbook, 'Matchweek', 5, matchHeaders)
  const fixtures = new Map()
  const matches = []
  const issues = []
  const prefix = `${week.id} · ${week.file}`
  for (const { line, values: [rawId, rawHome, homeGoals, awayGoals, rawAway] } of rows) {
    if ([rawHome, homeGoals, awayGoals, rawAway].every(blank)) continue
    const [id, home, away] = [rawId, rawHome, rawAway].map(text)
    if (!id) {
      issues.push(`${prefix}, ligne ${line} — Identifiant de match manquant.`)
      continue
    }
    const fixture = { id, line, home, away, homeGoals, awayGoals }
    if (!fixtures.has(id)) fixtures.set(id, [])
    fixtures.get(id).push(fixture)
  }

  for (const group of fixtures.values()) {
    const [match] = group
    const { id, line, home, away, homeGoals, awayGoals } = match
    const pending = blank(homeGoals) && blank(awayGoals)
    const location = `${prefix}, ligne ${line}`
    if (group.length > 1) {
      const conflicting = group.some((copy) =>
        copy.home !== home || copy.away !== away ||
        text(copy.homeGoals) !== text(homeGoals) || text(copy.awayGoals) !== text(awayGoals))
      const lines = group.map((copy) => copy.line).join(', ')
      issues.push(`${prefix}, lignes ${lines} — Identifiant ${id} en double${conflicting ? ', résultats contradictoires' : ''}.`)
    } else if (!roster.has(home) || !roster.has(away)) {
      issues.push(`${location} — Équipe manquante ou inconnue du tournoi.`)
    } else if (home === away) {
      issues.push(`${location} — Une équipe ne peut pas jouer contre elle-même.`)
    } else if (!pending && (blank(homeGoals) || blank(awayGoals))) {
      issues.push(`${location} — Score incomplet.`)
    } else if (!pending && ![homeGoals, awayGoals].every((goals) => Number.isSafeInteger(goals) && goals >= 0)) {
      issues.push(`${location} — Les buts doivent être des nombres entiers positifs ou nuls.`)
    } else {
      matches.push({ ...match, pending })
    }
  }
  if (week.complete && (matches.length === 0 || matches.some((match) => match.pending) || issues.length)) {
    issues.push(`${prefix} — Journée déclarée terminée avec des résultats manquants ou invalides.`)
  }
  return { ...week, matches, issues }
}
