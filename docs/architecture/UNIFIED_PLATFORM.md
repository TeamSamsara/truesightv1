# Unified TrueSight Platform

## Objective

Consolidate TrueSight V1 and ProspectSystem into one application while preserving both systems' existing functionality and data. TrueSight V1 is the host application. ProspectSystem's Firebase project remains the authoritative source for its existing scouting records during the integration.

This is an incremental migration. The standalone ProspectSystem application and its Firebase data must not be retired or modified until parity, access control, and data integrity have been verified.

## Domain boundaries

### Player intelligence (existing TrueSight domain)
- Player profiles and identity
- Match and timeline history
- Performance statistics and analytics
- Historical data pipeline and generated datasets

### Scouting and recruitment (ProspectSystem domain)
- Prospect records and scouting reports
- Champion-pool and combine evaluation history
- Combine events and participant pools
- Combine lobbies and assignments
- Interview availability, scheduling, and outcomes
- Lobby-code workflow

### Shared platform capabilities (target state)
- Application shell and routing
- User identity and session lifecycle
- Authorization and permission checks
- Audit trail
- Notifications and operational services
- Cross-domain player/prospect relationships

## Data ownership during migration

| Data | Current authoritative system | Migration rule |
|---|---|---|
| Player intelligence, match history, statistics | TrueSight Firebase / data pipeline | Keep in place |
| Prospects and scouting reports | ProspectSystem Firebase | Preserve in place |
| Combines and combine lobbies | ProspectSystem Firebase | Preserve in place |
| Interviews | ProspectSystem Firebase | Preserve in place |
| Users, roles, sessions and audit records | Each system's current auth/data model | Do not merge until identity and permission mappings are audited |

The ProspectSystem collections confirmed in its repository include `prospects`, `combines`, `combineLobbies`, and `interviews`. This list is not an exhaustive database inventory; production Firestore must be inspected before any migration.

## Firebase strategy

Use a named Firebase app instance for ProspectSystem's existing project, separate from TrueSight's default Firebase app. This allows both projects to be addressed from the TrueSight codebase without silently changing the existing TrueSight Firebase configuration.

The initial adapter is deliberately read-only. It must require an authenticated ProspectSystem Firebase user before reading protected collections. TrueSight authentication does not imply authentication or authorization in the ProspectSystem project.

Do not:
- copy prospect documents into TrueSight automatically;
- write to or delete from either project as part of initial integration;
- weaken Firestore security rules to make the integration work;
- assume that user UIDs or roles are shared between projects;
- retire ProspectSystem's standalone deployment.

A later identity milestone must choose and implement a deliberate strategy: identity migration, trusted server-side access with verified authorization, or an explicitly supported transitional dual-auth flow.

## Application integration strategy

1. Keep TrueSight's router, application shell, feature boundaries, and player-intelligence services.
2. Introduce a scouting domain boundary under `src/features/staff/scouting`.
3. Move ProspectSystem domain logic behind TrueSight-owned service adapters. Avoid importing its DOM, router, or authentication implementation wholesale.
4. Preserve ProspectSystem's domain models and legacy normalization behavior during the port.
5. Link a prospect to a TrueSight player profile using an explicit stable identifier mapping. Names and Riot IDs alone are not reliable primary keys.
6. Keep the relationship optional: a prospect may exist without a TrueSight intelligence profile.

## Migration sequence

### Milestone 0 — Baseline and safeguards
- Inventory routes, modules, Firebase projects, collections, rules, auth and permissions.
- Create an integration branch.
- Preserve both repositories and production datasets.

### Milestone 1 — Platform bridge
- Add named Firebase app configuration and a read-only ProspectSystem data adapter.
- Verify authentication boundaries and access behavior.
- Establish automated checks and a migration test matrix.

### Milestone 2 — Scouting workflows
- Port prospects and evaluations.
- Port combines, lobby assignment and interview workflows.
- Compare each workflow with the standalone application.

### Milestone 3 — Shared identity and authorization
- Implement one deliberate identity/session strategy.
- Map old roles and permissions to the unified permission model.
- Verify server-side/Firestore enforcement, not just UI visibility.

### Milestone 4 — Player intelligence relationships
- Add explicit prospect-to-player identity links.
- Surface TrueSight intelligence from prospect workflows without duplicating source records.

### Milestone 5 — Validation and retirement
- Run regression, security, and data-integrity tests.
- Reconcile record counts and representative document samples.
- Retire the standalone app only after an explicit cutover and rollback plan.

## Acceptance criteria

- Existing TrueSight player intelligence and data pipeline continue to work.
- All pre-existing ProspectSystem records remain intact and accessible to authorized users.
- Prospect, combine, lobby, and interview workflows have functional parity.
- No permission is broadened by the merge.
- A prospect can be linked to a player profile without relying on a mutable display name.
- Both original applications remain recoverable until cutover is approved.
