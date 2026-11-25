import filenames from 'virtual:player-portraits'
import settings from './profile-settings.json'

const extension = /\.(png|jpe?g|webp)$/i
const normalize = (value) => value.normalize('NFC').trim().replace(/\s+/gu, ' ').toLowerCase()
const photos = new Set(filenames.filter((file) => extension.test(file)))
const byName = new Map()

for (const file of photos) {
  const name = normalize(file.replace(extension, ''))
  if (!byName.has(name)) byName.set(name, [])
  byName.get(name).push(file)
}

const overrides = new Map(Object.entries(settings.filesByPlayer).map(([name, file]) => [normalize(name), file]))

export const demoPhotos = settings.demoPhotos

export function profileUrl(player) {
  const name = normalize(player || '')
  let file = overrides.get(name)
  if (!photos.has(file)) {
    const candidates = byName.get(name)
    if (candidates?.length !== 1) return null
    file = candidates[0]
  }
  return import.meta.env.BASE_URL + 'assets/profiles/' + encodeURIComponent(file)
}

export function playerInitials(name) {
  const words = name.trim().split(/\s+/u)
  return [words[0], ...(words.length > 1 ? [words.at(-1)] : [])]
    .map((word) => Array.from(word)[0] || '')
    .join('')
    .toUpperCase()
}
