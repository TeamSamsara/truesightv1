# Identity and Permission Mapping (Proposal)

This document compares the repository-defined roles. It is a proposal for the migration design, not an active runtime mapping. Do not use it to grant access until the platform owner approves the mapping and the deployed Firestore rules enforce it.

## Role concepts

ProspectSystem defines `admin`, `manager`, `coach`, `scout`, and `player`.

TrueSight defines top-level user types `admin`, `staff`, `player`, and `dev`, with staff roles `head_coach`, `coach`, `general_manager`, `manager`, and `scout`.

## Candidate role equivalences

| ProspectSystem role | Candidate TrueSight identity | Confidence | Notes |
|---|---|---:|---|
| `admin` | `type=admin` | High | Both systems grant platform-wide administration. |
| `manager` | `type=staff, role=general_manager` | Medium | Closest organizational equivalent, but permissions are not currently equivalent. |
| `coach` | `type=staff, role=coach` | High | Both are coaching roles. |
| `scout` | `type=staff, role=scout` | High | Direct role equivalent. |
| `player` | `type=player` | Medium | ProspectSystem currently excludes this role from active platform access; TrueSight has a separate player portal concept. |

## Permission comparison

### ProspectSystem permissions

- Admin: full CRUD/manage access across prospects, combines, interviews, lobbies, users and administration.
- Manager: full CRUD/manage access across prospects, combines, interviews and lobbies; read access to users; no admin access.
- Coach: read/write prospects, combines, interviews and lobbies.
- Scout: read/write prospects; read-only combines, interviews and lobbies.
- Player: no active platform permissions.

### TrueSight permissions today

TrueSight currently has route-level scouting access (`NAVIGATE_SCOUTING` / `VIEW_SCOUTING`) but its detailed prospect/combine/interview/lobby action permissions are still deferred. The current staff role capability declarations also do not grant the Scouting Suite to General Manager or Manager.

Therefore, the role names alone are not sufficient to preserve the existing access model.

## Required permission domains

The unified platform should add explicit action permissions for:

- Prospects: view, create, edit, delete
- Combines: view, create, edit, delete
- Combine lobbies: view, create, edit, delete, assign players, generate lobby codes
- Interviews: view, create/schedule, edit, delete
- Scouting administration: manage configuration and audit history

Route access and business-operation authorization must remain separate. Hiding a button or blocking a route is not a substitute for Firestore/server-side authorization.

## Migration requirements

1. Export or inspect the actual ProspectSystem user profiles and Firebase Auth users through an authorized administrative process.
2. Build a UID/email reconciliation report; do not assume that two projects use the same UIDs.
3. Approve the candidate role equivalences above or provide corrections.
4. Map each legacy permission to a TrueSight action permission.
5. Test positive and negative access cases for every role.
6. Keep the ProspectSystem project and user records intact until cutover and rollback are approved.

## Unresolved decisions

- Should ProspectSystem managers become TrueSight General Managers, or should scouting managers be a distinct staff role?
- Should Head Coaches receive the same scouting management permissions as ProspectSystem Managers, or retain coach-level permissions?
- Should players ever authenticate to the scouting domain, or remain outside the scouting platform?
- Should the unified app support a temporary dual-auth transition, or should accounts be migrated to TrueSight Firebase before the scouting module is opened to users?
