import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { parseStandings } from './standings.js'
import './styles.css'

const asset = import.meta.env.BASE_URL + 'assets/' + encodeURIComponent('Pli d Amine.xlsx')
const columns = [
  ['played', 'MJ', 'Matchs joués'], ['wins', 'V', 'Victoires'],
  ['draws', 'N', 'Matchs nuls'], ['losses', 'D', 'Défaites'],
  ['points', 'Pts', 'Points'], ['goalsFor', 'BP', 'Buts pour'],
  ['goalsAgainst', 'BC', 'Buts contre'], ['difference', 'Diff', 'Différence de buts'],
]

async function loadStandings(signal) {
  let buffer
  try {
    const response = await fetch(asset, { signal, cache: 'no-cache' })
    if (!response.ok) throw new Error()
    buffer = await response.arrayBuffer()
  } catch {
    throw new Error('Impossible de charger le classement. Vérifiez que le fichier Pli d Amine.xlsx est disponible dans le dossier assets.')
  }
  return parseStandings(buffer)
}

function StandingsTable({ players }) {
  return (
    <>
      <p className="mobile-hint">Faites défiler le tableau pour voir toutes les statistiques.</p>
      <div className="table-scroll" role="region" aria-label="Classement du tournoi" tabIndex={0}>
        <table>
          <thead>
            <tr>
              <th scope="col">Rang</th>
              <th scope="col">Équipe / Joueur</th>
              {columns.map(([key, label, title]) => (
                <th key={key} scope="col" aria-label={title} title={title} className={key}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {players.map((player, index) => (
              <tr key={player.line}>
                <td><span className={index === 0 ? 'rank first' : 'rank'}>{index + 1}</span></td>
                <th scope="row">
                  <span className="team">{player.team}</span>
                  <span className="person">{player.firstName} {player.lastName}</span>
                  <span className="club">{player.club}</span>
                </th>
                {columns.map(([key]) => (
                  <td key={key} className={key}>
                    {key === 'difference' && player[key] > 0 ? '+' + player[key] : player[key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function App() {
  const [players, setPlayers] = useState(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    loadStandings(controller.signal)
      .then((result) => { if (!controller.signal.aborted) setPlayers(result) })
      .catch((failure) => { if (!controller.signal.aborted) setError(failure.message) })
    return () => controller.abort()
  }, [attempt])

  return (
    <main>
      <header className="intro">
        <p className="tournament"><span aria-hidden="true" /> Tournoi eFootball</p>
        <h1>Classement</h1>
        <p className="tournament-name">Pli d’Amine</p>
      </header>
      {error ? (
        <section className="notice">
          <p role="alert">{error}</p>
          <button onClick={() => { setError(''); setAttempt((count) => count + 1) }}>Réessayer</button>
        </section>
      ) : players ? (
        <StandingsTable players={players} />
      ) : (
        <p role="status" className="notice">Chargement du classement…</p>
      )}
    </main>
  )
}

createRoot(document.getElementById('root')).render(<App />)
