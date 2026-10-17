import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Workout = { title: string; focus?: string; minutes?: number; difficulty?: string; reason?: string };

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<Workout[] | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let active = true;
    const userEmail = encodeURIComponent('mona@example.com');
    getJson<{ suggestions: Workout[] }>(`/api/workouts/suggestions/${userEmail}`)
      .then(({ suggestions: loadedSuggestions }) => {
        if (active) setSuggestions(loadedSuggestions);
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
        <h2 className="h4">Workout suggestions</h2>
        <p>Recommend workouts from activity patterns.</p>
        {hasError ? (
          <p role="alert">Unable to load workout suggestions. Please try again.</p>
        ) : suggestions === null ? (
          <p role="status">Loading workout suggestions...</p>
        ) : suggestions.length === 0 ? (
          <p role="status">No workout suggestions yet.</p>
        ) : (
          <ul className="list-group list-group-flush">
            {suggestions.map((workout, index) => (
              <li className="list-group-item px-0" key={`${workout.title}-${index}`}>
                <strong>{workout.title}</strong>
                {workout.focus ? ` · ${workout.focus}` : ''}
                {workout.minutes ? ` · ${workout.minutes} minutes` : ''}
                {workout.difficulty ? ` · ${workout.difficulty}` : ''}
                {workout.reason ? <p className="mb-0 mt-1">{workout.reason}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
