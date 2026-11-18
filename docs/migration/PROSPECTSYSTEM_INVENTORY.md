# ProspectSystem Integration Inventory

This inventory is based on repository source inspection. It is not a substitute for a live Firestore export, security-rules review, or workflow acceptance testing.

## Application surface

- Browser application entry: `public/js/app.js`
- History API router: `public/js/router.js`
- Authentication and session lifecycle: `public/js/auth/`
- Prospect domain: `public/js/prospect/`
- Combine domain: `public/js/combine/`
- Interview domain: `public/js/interview/`
- Lobby workflow: `public/js/lobby/`
- Views: `public/js/views/`
- HTTP server / Riot tournament-stub proxy: `server.js`

## Confirmed Firestore collections

| Collection | Observed use |
|---|---|
| `prospects` | Prospect profile documents; document IDs are used as prospect identifiers |
| `combines` | Combine event metadata and participant IDs |
| `combineLobbies` | Generated lobby records, team slots and prospect assignments |
| `interviews` | Interview records keyed by prospect ID |

Additional collections are used by the authentication, user, session and audit repositories and must be inventoried from their repository implementations and the deployed database.

## Important model behavior to preserve

- Prospect normalization supports legacy champion-pool field names and older scouting-report fields.
- Prospect combine-log entries preserve legacy free-text opponent data while supporting an opponent prospect ID.
- Interview documents are keyed by prospect ID and normalize missing availability, scheduled slot and status fields.
- Combine lobby assignments refer to ProspectSystem prospect document IDs.
- Existing prospect IDs must remain stable during the initial integration.

## Firebase environments

ProspectSystem currently selects between separate staging and production Firebase configurations based on hostname. The integration must make environment selection explicit and must not accidentally connect a staging application to production data or vice versa.

## Authentication and authorization

ProspectSystem has its own Firebase Auth instance, user profiles, role resolution, permission checks, session records, heartbeat/inactivity handling, and route guards.

TrueSight has a separate Firebase Auth instance and its own user/role/permission model. A successful TrueSight login is not proof of authorization to read ProspectSystem Firestore.

Before protected data is displayed in the unified app, choose and test the cross-project identity strategy. Do not bypass Firestore rules or treat client-side route guards as data security.

## Migration cautions

- Do not bulk-copy collections as part of the application merge.
- Do not change document IDs without a mapping and rollback plan.
- Do not remove legacy normalization paths until existing records have been sampled and validated.
- Do not assume the repository's visible collection references describe every deployed collection.
- Do not treat the existing Riot proxy as safe to deploy without a secrets and network-security review. Credentials must be supplied through server-side environment configuration, never committed in source.
