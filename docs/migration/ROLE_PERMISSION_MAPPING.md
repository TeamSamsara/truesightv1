# Scouting Access Model

## Decision

Keep the Scouting platform's access model deliberately simple:

1. **Owner** — TrueSight `type=admin`. Full platform and scouting administration.
2. **Staff** — TrueSight `type=staff`. Everyone involved in management or coaching gets the same Scouting Suite access, regardless of their staff title.
3. **No scouting access** — TrueSight `type=player`. Players do not access the internal scouting platform.
4. **Developer** — TrueSight `type=dev` retains the existing development bypass; this is not a normal production role.

There are no separate scouting permissions for coach, scout, manager, or general manager. Those labels can continue to describe people's responsibilities elsewhere in TrueSight, but they do not change what they can do inside Scouting.

## Legacy ProspectSystem mapping

| ProspectSystem role | Unified TrueSight identity | Scouting access |
|---|---|---|
| `admin` | `type=admin` | Owner; full access |
| `manager` | `type=staff` | Same staff access |
| `coach` | `type=staff` | Same staff access |
| `scout` | `type=staff` | Same staff access |
| `player` | `type=player` | No access |

The legacy staff roles intentionally converge on one staff access level. This is a deliberate simplification based on the expected users of the unified platform, not an attempt to reproduce every historical permission distinction.

## What staff can do

Staff can use the operational scouting workflows without role-specific restrictions:

- View, create, and update prospect profiles and scouting evaluations.
- Review combine history and scoring.
- Create and manage combines and their lobbies.
- Review and manage interview availability and scheduling.
- Use the scouting and player-finder workflows as they are integrated.

## What remains owner-only

Owner access is reserved for platform-level administration:

- Manage platform users and their access.
- Change platform-wide configuration and integrations.
- Manage sensitive administrative settings.
- Perform any explicitly owner-only destructive or security-sensitive operation.

Routine scouting work should not require owner approval. Staff should be able to do their jobs without navigating artificial role boundaries.

## Implementation in this integration

- TrueSight's existing `admin` user type already has full permission access and is treated as the Scouting Owner.
- Every existing TrueSight staff role now inherits `ACCESS_SCOUTING_SUITE` from `STAFF_BASE`, so manager and general-manager roles are not accidentally excluded.
- The existing staff role labels remain intact for other TrueSight domains; this change does not collapse the whole platform's role system.
- The ProspectSystem Firebase dataset remains the source of truth during this migration. This access mapping does not itself migrate accounts or bypass the second Firebase project's authentication/security rules.

## Account migration requirements

1. Reconcile ProspectSystem users to TrueSight accounts using an authorized export and verified email/UID matching. Do not assume UIDs match across Firebase projects.
2. Map legacy `admin` users to TrueSight admins only after confirming who should hold Owner access.
3. Map legacy `manager`, `coach`, and `scout` users to TrueSight staff accounts.
4. Exclude legacy player accounts from the internal scouting platform.
5. Test owner, staff, and player access cases before removing the temporary second sign-in step.

## Security boundary

This is the application's intended access model. Client-side navigation and permission checks are not a substitute for Firestore/server-side authorization. The deployed ProspectSystem and TrueSight Firestore rules must be reviewed and updated to enforce the same boundary before enabling write workflows or moving production traffic.
