const logos = new Map([
  ['argentina', 'Argintina.jpg'],
  ['argentine', 'Argintina.jpg'],
  ['argintina', 'Argintina.jpg'],
  ['arsenal', 'Arsonal.jpg'],
  ['fc arsenal', 'Arsonal.jpg'],
  ['barcelona', 'Barca.jpg'],
  ['fc barcelona', 'Barca.jpg'],
  ['barca', 'Barca.jpg'],
  ['borussia dortmund', 'Dortmund.jpg'],
  ['dortmund', 'Dortmund.jpg'],
  ['ac milan', 'Milan.jpg'],
  ['milan', 'Milan.jpg'],
  ['inter miami', 'Inter Miami.jpg'],
  ['al ain', 'Al Ainn.jpg'],
  ['al ainn', 'Al Ainn.jpg'],
  ['thun rw', 'Thun RW.jpg'],
  ['palestine', 'Palestine.jpg'],
  ['فلسطين', 'Palestine.jpg'],
  ['paris saint germain', 'PSG.jpg'],
  ['psg', 'PSG.jpg'],
])

const normalize = (value) => String(value || '').normalize('NFC').trim().replace(/\s+/gu, ' ').toLowerCase()

export function teamLogoUrl(club) {
  const file = logos.get(normalize(club))
  return file ? `${import.meta.env.BASE_URL}assets/teams/${encodeURIComponent(file)}` : null
}
