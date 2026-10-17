import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let active = true;
    getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard')
      .then(({ leaderboard }) => {
        if (active) setEntries(leaderboard);
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
        <h2 className="h4">Leaderboard</h2>
        <p>Compare team point totals.</p>
        {hasError ? (
          <p role="alert">Unable to load leaderboard. Please try again.</p>
        ) : entries === null ? (
          <p role="status">Loading leaderboard...</p>
        ) : entries.length === 0 ? (
          <p role="status">No leaderboard scores yet.</p>
        ) : (
          <ol className="list-group list-group-numbered list-group-flush">
            {entries.map((entry) => (
              <li className="list-group-item d-flex justify-content-between px-0" key={entry.teamName}>
                <span>{entry.teamName} <span className="visually-hidden">rank {entry.rank}</span></span>
                <strong>{entry.totalPoints} points</strong>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
