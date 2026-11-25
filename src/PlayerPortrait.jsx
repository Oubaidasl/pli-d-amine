import React, { useState } from 'react'
import { playerInitials } from './profiles.js'

export default function PlayerPortrait({ player, team, url }) {
  const [failedUrl, setFailedUrl] = useState(null)
  if (url && url !== failedUrl) {
    return (
      <img
        className="portrait"
        src={url}
        alt={`Portrait de ${player}`}
        loading="lazy"
        decoding="async"
        width="44"
        height="44"
        onError={() => setFailedUrl(url)}
      />
    )
  }
  return <span className="portrait portrait-initials" aria-hidden="true">{playerInitials(player || team)}</span>
}
