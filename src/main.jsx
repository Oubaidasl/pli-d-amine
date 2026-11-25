import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { loadMatchWeeks } from './match-weeks.js'
import { calculateStandings } from './standings.js'
import PlayerPortrait from './PlayerPortrait.jsx'
import { demoPhotos, profileUrl } from './profiles.js'
import './styles.css'

const columns = [
  ['played', 'MJ', 'Matchs joués'], ['wins', 'V', 'Victoires'],
  ['draws', 'N', 'Matchs nuls'], ['losses', 'D', 'Défaites'],
  ['points', 'Pts', 'Points'], ['goalsFor', 'BP', 'Buts pour'],
  ['goalsAgainst', 'BC', 'Buts contre'], ['difference', 'Diff', 'Différence de buts'],
]

function StandingsTable({ teams }) {
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
            {teams.map((team) => (
              <tr key={team.team}>
                <td><span className={team.rank === 1 && !team.tied ? 'rank first' : 'rank'}>{team.rank}</span></td>
                <th scope="row">
                  <div className="player-identity">
                    <PlayerPortrait player={team.player} team={team.team} url={team.portrait} />
                    <div className="player-details">
                      <span className="team">{team.team}</span>
                      {team.player && <span className="person">{team.player}</span>}
                      {team.club && <span className="club">{team.club}</span>}
                      {team.tied && <span className="club">Égalité non départagée</span>}
                    </div>
                  </div>
                </th>
                {columns.map(([key]) => (
                  <td key={key} className={key}>
                    {key === 'difference' && team[key] > 0 ? '+' + team[key] : team[key]}
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

function WeekResults({ week }) {
  const complete = week.complete && week.matches.length > 0 &&
    !week.issues.length && week.matches.every((match) => !match.pending)

  return (
    <section className="notice week">
      <h3>{week.label}</h3>
      <p className="club">{complete ? 'Journée terminée' : 'Journée incomplète'}</p>
      {week.matches.length > 0 ? (
        <ul className="matches">
          {week.matches.map((match) => (
            <li key={match.id}>
              <span>{match.home}</span>
              <strong>{match.pending ? 'À jouer' : `${match.homeGoals} – ${match.awayGoals}`}</strong>
              <span>{match.away}</span>
            </li>
          ))}
        </ul>
      ) : <p>Aucun match valide pour cette journée.</p>}
      {week.issues.length > 0 && (
        <ul className="week-issues">
          {week.issues.map((issue) => <li key={issue}>{issue}</li>)}
        </ul>
      )}
    </section>
  )
}

function League({ data, retry }) {
  const { demoData, seasonComplete, roster, weeks } = data
  const hasIssues = weeks.some((week) => week.issues.length > 0)
  const teams = calculateStandings(roster, weeks).map((team) => ({
    ...team, portrait: profileUrl(team.player),
  }))
  const hasPlayedMatches = teams.some((team) => team.played > 0)
  return (
    <>
      {demoData && <p className="notice demo">Données de démonstration — scores fictifs</p>}
      <section aria-labelledby="standings-heading">
        <h2 id="standings-heading">{seasonComplete && !hasIssues ? 'Classement final' : 'Classement provisoire'}</h2>
        {demoPhotos && hasPlayedMatches && teams.some((team) => team.portrait) && (
          <p className="club">Photos fictives de démonstration</p>
        )}
        {hasPlayedMatches
          ? <StandingsTable teams={teams} />
          : <p className="notice">Aucun résultat valide pour calculer le classement.</p>}
      </section>
      <section aria-labelledby="results-heading">
        <h2 id="results-heading">Résultats par journée</h2>
        {hasIssues && (
          <div className="notice">
            <p role="alert">Certains résultats n’ont pas pu être pris en compte. Consultez les messages par journée.</p>
            <button onClick={retry}>Réessayer</button>
          </div>
        )}
        {weeks.length
          ? weeks.map((week) => <WeekResults key={week.id} week={week} />)
          : <p className="notice">Aucune journée publiée.</p>}
      </section>
    </>
  )
}

function App() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  const retry = () => {
    setData(null)
    setError('')
    setAttempt((count) => count + 1)
  }

  useEffect(() => {
    const controller = new AbortController()
    loadMatchWeeks(controller.signal)
      .then((result) => { if (!controller.signal.aborted) setData(result) })
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
          <button onClick={retry}>Réessayer</button>
        </section>
      ) : data ? (
        <League data={data} retry={retry} />
      ) : (
        <p role="status" className="notice">Chargement des journées et du classement…</p>
      )}
    </main>
  )
}

createRoot(document.getElementById('root')).render(<App />)
