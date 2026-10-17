# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- Presentation tier decision: Keep the React UI thin and contract-driven: route-level components should read from the shared API client, render meaningful loading/empty/error states, and avoid direct fetches or business rules.
- Logic tier decision: Put validation, domain behavior, and response shaping in Express routes/services so the API enforces contract rules, converts invalid IDs into intentional 4xx responses, and keeps the DB schema focused on persistence.
- Data tier decision: Use Mongoose schemas to enforce required fields, object references, default arrays, and seed data that matches the school fitness domain without overloading the UI or API with persistence logic.
- Activity tracking approach: Store a user reference, team reference, activity type, minutes, and computed points plus occurredAt; reject missing or malformed IDs with a deliberate 4xx so a cast error never leaks as a 500.
- Team management approach: Require a team name and mascot, default members to an empty array, and keep each team member linked as a user reference so listings expose an accurate member list.
- Leaderboard approach: Aggregate points by team, sort descending, and assign a 1-based rank to each team entry so the ranking remains deterministic and easy to render in the UI.
- Workout suggestions approach: Match a user by email, infer focus from the user goal or recent activity pattern, and return a reason field that explains the recommendation while still respecting the seeded workout catalog.

## Test plan

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`
  - This fails while the Mongoose models do not enforce required fields like `name`, `email`, `fitnessGoal`, `mascot`, `team`, and `type`; it tells us to fix schema validation before the API or frontend can safely depend on the data layer.
- API command: `npm run test:api --prefix octofit-tracker/backend`
  - This fails while the app returns `501` or empty payloads for invalid activity/team inputs and leaderboard/workout endpoints; it confirms the logic tier is still unimplemented and that routes must validate input and compute payloads correctly.
- Frontend command: `npm test --prefix octofit-tracker/frontend`
  - This fails while the app still renders placeholder content and does not expose the accessible loading, empty, and alert states expected by the contract; it confirms the UI must use the shared API client and real route data.
- Backend build command: `npm run build --prefix octofit-tracker/backend`
  - This is a compile gate for TypeScript and route/service correctness; build issues should be fixed after the data and API contracts are valid.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`
  - This is a final compile gate for the React app; it should only be run after the API contract behavior and UI states are aligned with the shared client and routing contract.
