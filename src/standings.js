import { read, utils } from 'xlsx'

const identity = { lastName: 'Nom', firstName: 'Prénom', team: "Nom d'équipe", club: 'Équipe de base' }
const stats = {
  played: 'Nombre de matchs', wins: 'W', draws: 'D', losses: 'L',
  points: 'PTS', goalsFor: 'GOALS', goalsAgainst: 'TMARKA FIH', difference: '(+-)',
}
const clean = (value) => String(value ?? '').trim()
const normalize = (value) => clean(value).normalize('NFC').replaceAll('’', "'").replace(/\s+/g, ' ').toLowerCase()

export function parseStandings(buffer) {
  let workbook
  try {
    const bytes = new Uint8Array(buffer)
    if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) throw new Error()
    workbook = read(bytes, { type: 'array', sheets: 0 })
  } catch {
    throw new Error('Le fichier est illisible. Vérifiez qu’il s’agit d’un classeur Excel .xlsx valide.')
  }
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  if (!sheet?.['!ref']) throw new Error('La première feuille du classeur est vide.')

  const [headers = [], ...rows] = utils.sheet_to_json(sheet, { header: 1, raw: true, defval: null })
  const columns = Object.fromEntries(
    Object.entries({ ...identity, ...stats }).map(([key, label]) => {
      const indexes = headers.flatMap((header, index) => normalize(header) === normalize(label) ? [index] : [])
      if (indexes.length !== 1) {
        throw new Error('La colonne « ' + label + ' » doit apparaître une seule fois dans la première feuille.')
      }
      return [key, indexes[0]]
    }),
  )
  const firstRow = utils.decode_range(sheet['!ref']).s.r + 1
  const players = rows.flatMap((row, index) => {
    if (row.every((value) => !clean(value))) return []
    const line = firstRow + index + 1
    const player = { line }
    for (const [key, label] of Object.entries(identity)) {
      const value = clean(row[columns[key]])
      if (!value) throw new Error('Ligne ' + line + ' · Renseignez la colonne « ' + label + ' ».')
      player[key] = value
    }
    for (const [key, label] of Object.entries(stats)) {
      const value = clean(row[columns[key]])
      const number = Number(value)
      if (!/^[+-]?\d+$/.test(value) || !Number.isSafeInteger(number) || (key !== 'difference' && number < 0)) {
        throw new Error('Ligne ' + line + ' · Vérifiez la valeur de la colonne « ' + label + ' ».')
      }
      player[key] = number
    }
    return [player]
  })
  if (!players.length) throw new Error('La première feuille ne contient aucun joueur.')
  return players.sort((a, b) => b.points - a.points || b.difference - a.difference || b.goalsFor - a.goalsFor)
}
