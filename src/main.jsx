import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { loadMatchWeeks } from './match-weeks.js'
import { calculateStandings } from './standings.js'
import PlayerPortrait from './PlayerPortrait.jsx'
import { demoPhotos, profileUrl } from './profiles.js'
import { teamLogoUrl } from './team-logos.js'
import './styles.css'

function ClubBadge({ club }) {
  const url = teamLogoUrl(club)
  return url ? <img className="club-logo" src={url} alt={`${club} logo`} loading="lazy" /> : null
}

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
                      <span className="team"><ClubBadge club={team.club} />{team.team}</span>
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
              <span className="match-team"><ClubBadge club={match.homeClub} />{match.home}</span>
              <strong>{match.pending ? 'À jouer' : `${match.homeGoals} – ${match.awayGoals}`}</strong>
              <span className="match-team"><ClubBadge club={match.awayClub} />{match.away}</span>
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
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [selectedEdition, setSelectedEdition] = useState(Math.max(0, data.weeks.length - 1))
  const { demoData, seasonComplete, roster, weeks } = data
  const hasIssues = weeks.some((week) => week.issues.length > 0)
  const teams = calculateStandings(roster, weeks).map((team) => ({
    ...team, portrait: profileUrl(team.player),
  }))
  const editionTeams = calculateStandings(roster, weeks.slice(0, selectedEdition + 1)).map((team) => ({
    ...team, portrait: profileUrl(team.player),
  }))
  const clubsByTeam = new Map(teams.map((team) => [team.team, team.club]))
  const weeksWithClubLogos = weeks.map((week) => ({
    ...week,
    matches: week.matches.map((match) => ({
      ...match, homeClub: clubsByTeam.get(match.home), awayClub: clubsByTeam.get(match.away),
    })),
  }))
  const hasPlayedMatches = teams.some((team) => team.played > 0)
  const totalMatches = teams.reduce((sum, team) => sum + team.played, 0) / 2
  const totalGoals = teams.reduce((sum, team) => sum + team.goalsFor, 0)
  const activeView = window.location.hash.slice(1) || 'matches'
  const view = activeView === 'teams' ? 'teams' : ['table', 'statistics', 'matches'].includes(activeView) ? activeView : 'matches'
  return (
    <>
      {demoData && <p className="notice demo">Données de démonstration — scores fictifs</p>}
      {view === 'table' && <section id="table" aria-labelledby="standings-heading">
        <div className="edition-switcher" aria-label="Choose standings edition">
          <button aria-label="Previous edition" onClick={() => setSelectedEdition((edition) => Math.max(0, edition - 1))} disabled={selectedEdition <= 0}>‹</button>
          <div className="edition-label">
            <span>Edition {weeks.length ? selectedEdition + 1 : 0} of {weeks.length}</span>
            <strong>{weeks[selectedEdition]?.label || 'No editions available'}</strong>
          </div>
          <button aria-label="Next edition" onClick={() => setSelectedEdition((edition) => Math.min(weeks.length - 1, edition + 1))} disabled={selectedEdition >= weeks.length - 1}>›</button>
        </div>
        <h2 id="standings-heading">{selectedEdition === weeks.length - 1 && seasonComplete && !hasIssues ? 'Final standings' : 'Standings'}</h2>
        {demoPhotos && hasPlayedMatches && teams.some((team) => team.portrait) && (
          <p className="club">Photos fictives de démonstration</p>
        )}
        {editionTeams.some((team) => team.played > 0)
          ? <StandingsTable teams={editionTeams} />
          : <p className="notice">Aucun résultat valide pour calculer le classement.</p>}
      </section>}
      {view === 'statistics' && <section id="statistics" aria-labelledby="statistics-heading">
        <h2 id="statistics-heading">Statistics</h2>
        <div className="stats-grid">
          <div className="stat-card"><span>Matches played</span><strong>{totalMatches}</strong></div>
          <div className="stat-card"><span>Goals scored</span><strong>{totalGoals}</strong></div>
          <div className="stat-card"><span>Wins recorded</span><strong>{teams.reduce((sum, team) => sum + team.wins, 0)}</strong></div>
          <div className="stat-card"><span>Draws recorded</span><strong>{teams.reduce((sum, team) => sum + team.draws, 0) / 2}</strong></div>
          <div className="stat-card"><span>Goals per match</span><strong>{totalMatches ? (totalGoals / totalMatches).toFixed(1) : '0.0'}</strong></div>
        </div>
      </section>}
      {view === 'teams' && <section id="teams" aria-labelledby="teams-heading">
        <h2 id="teams-heading">Teams / Players</h2>
        <div className="participants-grid">
          {teams.map((team) => <button className="participant-card" key={team.team} onClick={() => setSelectedTeam(team)} aria-label={`View ${team.player || team.team} profile`}>
          <PlayerPortrait player={team.player} team={team.team} url={team.portrait} />
          <ClubBadge club={team.club} />
          <div><strong>{team.team}</strong>{team.player && <span>{team.player}</span>}{team.club && <span>{team.club}</span>}</div>
            <span className="card-arrow" aria-hidden="true">›</span>
          </button>)}
        </div>
      </section>}
      {selectedTeam && <PlayerDetails team={selectedTeam} weeks={weeks} clubsByTeam={clubsByTeam} onClose={() => setSelectedTeam(null)} />}
      {view === 'matches' && <section id="matches" aria-labelledby="results-heading">
        <h2 id="results-heading">Résultats par journée</h2>
        {hasIssues && (
          <div className="notice">
            <p role="alert">Certains résultats n’ont pas pu être pris en compte. Consultez les messages par journée.</p>
            <button onClick={retry}>Réessayer</button>
          </div>
        )}
        {weeks.length
          ? weeksWithClubLogos.map((week) => <WeekResults key={week.id} week={week} />)
          : <p className="notice">Aucune journée publiée.</p>}
      </section>}
    </>
  )
}

function PlayerDetails({ team, weeks, clubsByTeam, onClose }) {
  const matches = weeks.flatMap((week) => week.matches
    .filter((match) => match.home === team.team || match.away === team.team)
    .map((match) => {
      const isHome = match.home === team.team
      const opponent = isHome ? match.away : match.home
      const ownGoals = isHome ? match.homeGoals : match.awayGoals
      const opponentGoals = isHome ? match.awayGoals : match.homeGoals
      const outcome = match.pending ? 'pending' : ownGoals > opponentGoals ? 'win' : ownGoals < opponentGoals ? 'loss' : 'draw'
      return { ...match, weekLabel: week.label, opponent, opponentClub: clubsByTeam.get(opponent), ownGoals, opponentGoals, outcome }
    }))

  return <div className="player-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section className="player-dialog" role="dialog" aria-modal="true" aria-labelledby="player-dialog-title">
      <button className="player-close" aria-label="Close player details" onClick={onClose}>×</button>
        <div className="player-profile">
        <PlayerPortrait player={team.player} team={team.team} url={team.portrait} />
        <ClubBadge club={team.club} />
        <div>
          <p className="club">Player profile</p>
          <h2 id="player-dialog-title">{team.player || team.team}</h2>
          <p>{team.team}{team.club ? ` · ${team.club}` : ''}</p>
        </div>
      </div>
      <h3>Season stats</h3>
      <div className="player-stats">
        {[
          ['Rank', team.rank], ['Played', team.played], ['Wins', team.wins], ['Draws', team.draws],
          ['Losses', team.losses], ['Points', team.points], ['Goals for', team.goalsFor],
          ['Goals against', team.goalsAgainst], ['Goal difference', team.difference > 0 ? `+${team.difference}` : team.difference],
        ].map(([label, value]) => <div className="player-stat" key={label}><span>{label}</span><strong>{value}</strong></div>)}
      </div>
      <h3>Matches</h3>
      {matches.length ? <ul className="player-match-list">
        {matches.map((match) => <li className={`player-match ${match.outcome}`} key={`${match.id}-${match.weekLabel}`}>
          <span className="player-match-week">{match.weekLabel}</span>
          <span className="player-match-opponent"><ClubBadge club={match.opponentClub} />vs {match.opponent}</span>
          <strong>{match.pending ? 'Pending' : `${match.ownGoals} – ${match.opponentGoals}`}</strong>
          <span className="player-match-outcome">{match.outcome === 'pending' ? 'Upcoming' : match.outcome}</span>
        </li>)}
      </ul> : <p className="notice">No matches recorded yet.</p>}
    </section>
  </div>
}

function App() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('pli-theme') || 'light')
  const [currentView, setCurrentView] = useState(window.location.hash.slice(1) || 'matches')
  const pageTitle = ({ matches: 'Matches', table: 'Table', statistics: 'Statistics', teams: 'Teams/Players' })[currentView] || 'Matches'
  const navItems = [
    ['matches', 'Matches'], ['table', 'Table'], ['statistics', 'Statistics'], ['teams', 'Teams/Players'],
  ]
  const closeSidebar = () => setSidebarOpen(false)

  useEffect(() => {
    const syncView = () => setCurrentView(window.location.hash.slice(1) || 'matches')
    window.addEventListener('hashchange', syncView)
    return () => window.removeEventListener('hashchange', syncView)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('pli-theme', theme)
  }, [theme])

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
    <>
      <header className="site-header">
        <div className="header-inner">
          <button className="menu-button" aria-label="Open sidebar" aria-expanded={sidebarOpen} onClick={() => setSidebarOpen(!sidebarOpen)}>
            <span /><span /><span />
          </button>
          <a className="brand" href="#top">Pli-d-Amine</a>
          <nav className="top-nav" aria-label="Main navigation">
            {navItems.map(([id, label]) => <a key={id} className={currentView === id ? 'active' : ''} href={`#${id}`}>{label}</a>)}
          </nav>
          <button className="theme-toggle" onClick={() => setTheme((current) => current === 'light' ? 'dark' : 'light')} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`} aria-pressed={theme === 'dark'}>
            <span aria-hidden="true">{theme === 'light' ? '☾' : '☀'}</span>
            <span className="theme-toggle-label">{theme === 'light' ? 'Dark mode' : 'Light mode'}</span>
          </button>
        </div>
      </header>
      {sidebarOpen && <button className="sidebar-backdrop" aria-label="Close sidebar" onClick={closeSidebar} />}
      <aside className={`sidebar${sidebarOpen ? ' is-open' : ''}`} aria-label="Sidebar navigation" aria-hidden={!sidebarOpen}>
        <div className="sidebar-heading"><span>Navigation</span><button aria-label="Close sidebar" onClick={closeSidebar}>×</button></div>
        {navItems.map(([id, label]) => <a key={id} className={currentView === id ? 'active' : ''} href={`#${id}`} onClick={closeSidebar}>{label}</a>)}
      </aside>
      <main id="top">
      <header className="intro">
        <p className="tournament"><span aria-hidden="true" /> Tournoi eFootball</p>
        <h1>{pageTitle}</h1>
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
    </>
  )
}

createRoot(document.getElementById('root')).render(<App />)
