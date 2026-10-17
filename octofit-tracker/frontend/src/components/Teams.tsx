import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Team = { name: string; mascot?: string; members?: Array<string | { name?: string }> };

export default function Teams() {
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let active = true;
    getJson<{ teams: Team[] }>('/api/teams')
      .then(({ teams: loadedTeams }) => {
        if (active) setTeams(loadedTeams);
      })
      .catch(() => {
        if (active) setHasError(true);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Teams</h2>
        <p>Manage teams and members.</p>
        {hasError ? (
          <p role="alert">Unable to load teams. Please try again.</p>
        ) : teams === null ? (
          <p role="status">Loading teams...</p>
        ) : teams.length === 0 ? (
          <p role="status">No teams yet.</p>
        ) : (
          <ul className="list-group list-group-flush">
            {teams.map((team, index) => (
              <li className="list-group-item px-0" key={`${team.name}-${index}`}>
                <strong>{team.name}</strong>
                {team.mascot ? ` · Mascot: ${team.mascot}` : ''}
                {team.members?.length ? ` · Members: ${team.members.map((member) => typeof member === 'string' ? member : member.name ?? 'Member').join(', ')}` : ''}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
