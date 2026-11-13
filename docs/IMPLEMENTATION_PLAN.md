# Implementation plan

Read the full root AGENTS.md on 2026-11-13. Initial repository contained only that brief, with no Git repository, credentials, or assets. Preserve the brief.

1. Establish strict Next.js App Router, current compatible React/Fiber, MongoDB/Mongoose, Better Auth, Cloudinary, validation and tests.
2. Implement the integration gate: documented Lux3D adapter, persisted job intent, safe transfer, genuine GLB import with provenance, Cloudinary raw delivery, editor transforms and revisioned scene persistence. Live verification requires credentials and real output; do not let that block independent implementation.
3. Implement accounts, project dashboard, library, room editor, history, autosave, preview and conflict recovery.
4. Implement immutable publication, public exploration and asset-permission-aware attributed remix.
5. Implement server-controlled admin challenges, pinned templates, submission windows, unique votes, no self-votes and deterministic rankings.
6. Inspect SpatialGen compatibility only against actual output. Keep procedural mesh room as the honest default.
7. Run lint, typecheck, focused tests and production build; browser-check available workflows. Record evidence and remaining gaps in all handoff documents.

No seeded community data, no fabricated provider output, no paid automatic retry, no external publishing.

## Execution status

Independent implementation phases 0–4 and the available phase-6 local verification are implemented. Phase 1 has a complete code path but remains **live-blocked**, not proven. Phase 5 remains blocked by absent real SpatialGen/Viewer output. The user’s subsequent UI refinement was applied across landing/setup/workspace/editor/community surfaces. Exact remaining checks and dependencies are tracked in REQUIREMENTS_MATRIX.md, BLOCKERS.md and VERIFICATION.md; the project is not declared complete.
