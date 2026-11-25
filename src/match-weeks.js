import { parseRoster, parseWeek } from './workbooks.js'

const assetUrl = (file) => import.meta.env.BASE_URL + 'assets/results/' + encodeURIComponent(file)

async function readAsset(file, signal, format) {
  const response = await fetch(assetUrl(file), { signal, cache: 'no-cache' })
  if (!response.ok) throw new Error(`Réponse HTTP ${response.status}.`)
  return format === 'json' ? response.json() : response.arrayBuffer()
}

export function validateManifest(manifest) {
  if (!manifest || typeof manifest.demoData !== 'boolean' || typeof manifest.seasonComplete !== 'boolean' ||
      !Array.isArray(manifest.weeks)) {
    throw new Error('Le fichier match-weeks.json doit définir demoData, seasonComplete et la liste weeks.')
  }
  const ids = new Set()
  const files = new Set()
  for (const [index, week] of manifest.weeks.entries()) {
    if (!week || typeof week.id !== 'string' || !/^GW[1-9][0-9]*$/.test(week.id) ||
        typeof week.label !== 'string' || !week.label.trim() ||
        typeof week.file !== 'string' || !/^[A-Za-z0-9 _-]+\.xlsx$/i.test(week.file) ||
        typeof week.complete !== 'boolean' || ids.has(week.id) || files.has(week.file.toLowerCase())) {
      throw new Error(`Entrée ${index + 1} invalide ou en double dans match-weeks.json.`)
    }
    ids.add(week.id)
    files.add(week.file.toLowerCase())
  }
  if (manifest.seasonComplete && (!manifest.weeks.length || manifest.weeks.some((week) => !week.complete))) {
    throw new Error('Toutes les journées doivent être terminées pour clôturer la saison.')
  }
  return manifest
}

export async function loadMatchWeeks(signal) {
  let data
  try {
    data = await readAsset('match-weeks.json', signal, 'json')
  } catch {
    throw new Error('Impossible de charger ou de lire le fichier match-weeks.json.')
  }
  const { demoData, seasonComplete, weeks } = validateManifest(data)
  let roster
  try {
    roster = parseRoster(await readAsset('GW_Template.xlsx', signal))
  } catch (error) {
    throw new Error(`Impossible de charger les équipes depuis GW_Template.xlsx. ${error.message}`)
  }
  const results = await Promise.all(weeks.map(async (week) => {
    try {
      return parseWeek(await readAsset(week.file, signal), week, roster)
    } catch (error) {
      return { ...week, matches: [], issues: [`${week.id} · ${week.file} — ${error.message}`] }
    }
  }))
  return { demoData, seasonComplete, roster, weeks: results }
}
