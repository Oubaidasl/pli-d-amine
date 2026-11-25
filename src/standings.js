const compare = (a, b) => b.points - a.points || b.difference - a.difference || b.goalsFor - a.goalsFor

function recordMatch(team, goalsFor, goalsAgainst) {
  team.played++
  team.goalsFor += goalsFor
  team.goalsAgainst += goalsAgainst
  team.difference += goalsFor - goalsAgainst
  if (goalsFor > goalsAgainst) {
    team.wins++
    team.points += 3
  } else if (goalsFor === goalsAgainst) {
    team.draws++
    team.points++
  } else {
    team.losses++
  }
}

export function calculateStandings(roster, weeks) {
  const totals = new Map([...roster].map(([name, team]) => [name, {
    ...team, played: 0, wins: 0, draws: 0, losses: 0,
    points: 0, goalsFor: 0, goalsAgainst: 0, difference: 0,
  }]))
  for (const { matches } of weeks) {
    for (const { home, away, homeGoals, awayGoals, pending } of matches) {
      if (pending) continue
      recordMatch(totals.get(home), homeGoals, awayGoals)
      recordMatch(totals.get(away), awayGoals, homeGoals)
    }
  }

  const standings = [...totals.values()].sort(compare)
  let rank = 1
  return standings.map((team, index) => {
    const tiedWithPrevious = index > 0 && compare(standings[index - 1], team) === 0
    if (!tiedWithPrevious) rank = index + 1
    const tiedWithNext = index + 1 < standings.length && compare(team, standings[index + 1]) === 0
    return { ...team, rank, tied: tiedWithPrevious || tiedWithNext }
  })
}
