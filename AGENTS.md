# Buildo — Codex Implementation Contract

## 1. Mission and authority
Build Buildo: an AI-powered spatial design application where people create, furnish, customize, explore, save, publish, remix, and compete with interactive 3D spaces.
Tagline: "Imagine it. Build it. Explore it."
This is a working fullstack product for the Manycore Aholo Global 3D AI Hackathon, not a static prototype.
Read this file completely. Inspect the repository and any existing instructions before changing code. Preserve user changes. If the repo is empty, scaffold safely. Work through the phases, verify continuously, and continue implementation without asking for approval between routine steps. Do not stop at a plan or scaffold.
User instructions override this brief. Record implementation defaults and unresolved provider capabilities rather than inventing them.

## 2. Fixed stack
- One Next.js fullstack repository, App Router, React, strict TypeScript.
- Tailwind CSS; accessible reusable components; restrained Framer Motion outside the 3D viewport.
- Route Handlers for the server API. Server-only modular services for business logic.
- MongoDB with Mongoose. Reuse database connections safely.
- Cloudinary for models, textures, reference images, screenshots, and covers.
- React Three Fiber, Three.js, and Drei for mesh-based 3D rendering and editing.
- Zustand for editor state; TanStack Query for server state.
- Aholo Lux3D for core generated objects. SpatialGen/Viewer only after actual compatibility validation.
- No separate NestJS/Express service. Do not replace MongoDB or Cloudinary.
Check current official documentation and package compatibility before installing; use a lockfile. Do not copy guessed endpoint names or obsolete SDK examples.
This is a code project executed locally in VSCode, not a Sites project.

## 3. Hackathon context and honest evidence
Official rules reference: https://www.aholo.ai/hackathon
Deadline: November 19, 2026, 12:00 noon Africa/Lagos (11:00 UTC).
Required: Lux3D must create core content or support a key workflow.
Weights: Manycore tools 30%, engagement 25%, innovation 20%, completeness 20%, reach 5%.
Final score: expert panel 70%, community panel 30%. Community panel is distinct from Buildo's in-app voting.
Required submission: PDF/PPT project report and working demo URL or video. Actual running-project footage is required; editing, voice-over, captions are allowed.
Bonus: source code and public X post with #Manycorehackathon. Never post externally without explicit authorization.
Prioritize a complete creation-to-challenge journey and meaningful Lux3D usage. Capture actual generation provenance, prompts, iteration screenshots, and limitations. Never fabricate generations, users, votes, successes, performance, or integration evidence.
Keep test fixtures isolated from public product data and identify any developer fixture mode honestly.

## 4. Product scope and priorities
P0 foundation: authentication, real Lux3D generation/import, asset library, usable 3D room editor, exploration, durable save/reopen.
P1 submission experience: public immutable design snapshots, gallery, one real admin-created challenge, submissions, voting/results, permitted remixing and attribution.
P2 after core verification: SpatialGen integration, supported material/color editing, richer templates and visual polish.
Long-term only: payments, subscriptions, asset marketplace, brand sponsorships, professional collaboration. Do not build these now.
Do not silently remove planned features: mark incomplete or blocked features in the requirements matrix.
Default hero demo: "Small Space, Big Ideas" — creators furnish the same starting room, explore it, and submit a version others can visit and vote on.
Procedural room shells are a valid application feature and may be used as editable starting rooms. They must not be presented as SpatialGen outputs.
Categories: bedroom, living room, office, restaurant, gaming room, custom indoor space.

## 5. First integration gate — prove this before expanding
Verify current Aholo docs:
- https://labs.aholo.ai/api-docs/en/intro
- https://labs.aholo.ai/api-docs/en/skills/lux3d
- https://lux3d.aholo.ai/docs
- https://cloudinary.com/documentation/upload_parameters
Implement and demonstrate:
1. Submit one real Lux3D generation with supplied credentials, or import a genuine user-supplied Lux3D output with recorded provenance if API credentials are unavailable.
2. Persist the provider job and poll its documented state.
3. Obtain the actual model, normalize only as needed, and upload the usable asset to Cloudinary.
4. Load it from Cloudinary into a simple room; verify browser access, textures, model format, orientation, bounds, and scale.
5. Move, rotate, and resize; save to MongoDB; hard refresh/reopen and verify the layout persists.
Prefer self-contained GLB with embedded textures. If files have external textures, package/resolve them correctly. A stored ZIP is not a renderable model URL.
Record evidence in docs/INTEGRATION_VERIFICATION.md: source, observed formats, commands/checks, real results, and unverified assumptions.
Do not claim world generation or Viewer interoperability based on marketing copy. 3DGS environments are not ordinary editable meshes. Validate composition, camera behavior, coordinate systems, load/save restoration, and browser performance against actual outputs.
If SpatialGen is incompatible, retain a transparent procedural-shell path and document the limitation. Continue with independent work when credentials block a live check.

## 6. Routes and user experience
Public routes: /, /explore, /designs/[id], /challenges, /challenges/[id], /creators/[id].
Authenticated routes: /dashboard, /projects/new, /studio/[id], /assets, /settings.
Admin-only challenge management route: /admin/challenges.
Include login/register routes appropriate to the chosen auth library.
Landing: bold typographic hero, interactive or real rendered room preview, Create a Space / Explore Designs / Join a Challenge, clear real product examples.
Do not seed invented community activity. Empty galleries should explain how to publish the first design.
Dashboard: own projects, generation progress, recent assets, create/resume actions.
New project: category, title, room dimensions/template, prompt. Expose environment generation only when supported and configured.
Studio: center viewport; left asset library and generation form; right selected-object properties; top Save, Preview, Share/Publish. Collapse panels on smaller screens.
Visual default: warm light surfaces, charcoal typography, vivid orange accent, spacious layouts and prominent 3D content. Keep design tokens easy to revise; this is an implementation default, not a user-approved brand.
Use polished loading, empty, error, offline/retry, unsupported WebGL, and missing-configuration states. All buttons must perform their advertised action or explain their availability.
Do not expose credentials or implementation diagnostics in normal product flows.

## 7. Editor behavior
- Orbit camera for editing; selection by click; visible selection feedback.
- Translate, rotate, scale controls with numeric inputs, optional grid snapping, and floor-aware placement.
- Disable orbit controls while dragging transform handles.
- Duplicate, delete, undo/redo; keyboard shortcuts must ignore text fields.
- Object bounds and pivot handling must make placement predictable. Preserve imported proportions by default.
- Define scene units as meters and a canonical coordinate convention; normalize asset transforms without losing the original source.
- Adjustable procedural room dimensions, wall/floor appearance, lighting presets.
- Supported color/material edits only; do not promise arbitrary retexturing.
- Preview hides gizmos. Offer orbit inspection and desktop walkthrough with clear controls, touch-friendly alternatives, and a reset-camera action.
- No claim of collision-safe navigation unless implemented and tested.
- Dirty indicator, debounced autosave, manual save, last-saved status, recoverable save errors.
- Revision checks prevent stale tabs overwriting newer saves. Clearly resolve conflicts.
- Generate cover screenshots with reliable render capture; avoid retaining a costly graphics buffer continuously without reason.
- Lazy-load the client-only viewport, handle context loss, bound geometry/texture costs, dispose resources, and avoid reloading the same asset unnecessarily.
- Test a realistic furnished room on ordinary laptop hardware; record observed limits rather than invented targets.

## 8. Server architecture and contracts
Suggested modules: auth, users, projects, scenes, assets, generations, publications, challenges, votes.
Suggested structure: src/app, src/components, src/features, src/server, src/lib, src/types.
Thin Route Handlers -> validated inputs -> authorization -> service -> database/provider adapter.
Validate request bodies and scene JSON with Zod; serialize database IDs/dates explicitly.
Use consistent JSON errors with stable code, safe message, optional field errors, request ID.
API groups:
- /api/projects: create/list; /[id]: read/update/delete with ownership checks and revisions.
- /api/assets: own library; validated Lux3D import path.
- /api/generations: submit/status/list; provider cancellation only when documented.
- /api/projects/[id]/publish: immutable snapshot and public record.
- /api/designs: published gallery; /[id]: public snapshot; /[id]/remix: permission-checked copy.
- /api/challenges: public list/details; admin create/edit; /[id]/submissions and voting endpoints.
Choose exact methods and schemas in docs/API_CONTRACTS.md before wiring clients. Do not implement unprotected admin endpoints.

## 9. Data model and invariants
User: auth identity, display name, avatar, server-controlled role.
Project: ownerId, title, category, scene, schemaVersion, revision, status, timestamps.
Scene: environment descriptor, room dimensions, lighting, camera, and objects.
SceneObject: stable instanceId, assetId, position, quaternion/rotation convention, scale, supported material overrides. Validate finite numbers and bounded payload size.
Asset: ownerId, source/provenance, prompt, provider taskId, model format, Cloudinary publicId/resourceType/secureUrl, bounds, normalization metadata, preview, lifecycle status.
GenerationJob: ownerId, projectId, provider, providerTaskId, request key/hash, state, attempts, safe error, timestamps, lease/reconciliation fields as needed.
Publication: ownerId, projectId, immutable scene snapshot/version, cover, description, category, allowRemix, original/root attribution, publishedAt.
Challenge: title, theme, rules, immutable starting template/version, submission/voting windows, status, deterministic tie rule.
Submission: challengeId, ownerId, immutable publication snapshot, template provenance, submittedAt.
Vote: challengeId, submissionId, voterId, createdAt.
Use database indexes for ownership queries, public lists, provider task IDs, unique request keys, one submission per user per challenge, and one vote per voter per submission.
Default voting policy: one vote per account per entry, no self-votes, ability to withdraw during the voting period, server-enforced windows. Document this as a product default.
Default challenge phases: draft -> open -> voting -> closed. Resolve timing server-side in UTC, show localized times.
Reject entry mutation after submission; allow replacement only before deadline under a defined rule. Pin starting-room version for fair-comparison challenges.
Published designs do not change when the private draft changes. Republish creates a new snapshot with an explicit update action.
Remix only when allowed; create an owned copy and preserve attribution. Publication/remix permission must include the assets being reused.
Maintain references so deleting a private project does not break existing publications or permitted remixes. Do not delete shared assets blindly.
Awards/results must use closed voting totals and deterministic tie handling; never prefill winners.

## 10. Aholo jobs and Cloudinary
Provider keys remain server-side. Use official current schemas and status values behind adapters.
Persist submission intent before remote calls. Guard duplicate clicks and retries with per-user idempotency.
Handle timeouts with uncertain remote creation carefully: reconcile using documented capabilities instead of automatically charging for another generation.
No long-running background work assumed to survive after a Next.js request. Use persisted jobs, bounded status reconciliation, polling/backoff, and a documented deployment-compatible worker/scheduler if needed.
Persist intermediate state so refresh/restart can resume. Prevent simultaneous finalizers with atomic updates/leases.
States should distinguish queued, generating, transferring, ready, failed, and timed-out/unknown as appropriate. Do not report success until the model is stored and usable.
Never automatically resubmit paid generations after a failure. Allow explicit user retry with clear implications.
Limit requests, concurrent generations, prompt/input size, transfer size, and polling frequency using durable server-side enforcement.
Cloudinary SDK calls use verified settings for 3D/raw asset delivery. Preserve resourceType, publicId, format, secure URL, and byte size; do not assume every asset is an image.
Keep transformations off stored raw models. Test delivered bytes and browser rendering. Never expose an API secret in signed uploads.
Restrict server downloads to validated provider/storage URLs and guard against SSRF, redirects to private networks, huge downloads, ZIP traversal, and decompression bombs.
Use generated filenames and check actual file signatures/content, not only extensions.
Clean up orphaned transfers carefully; never remove assets referenced by published snapshots.
Store scene configuration in MongoDB, not only localStorage or Cloudinary.

## 11. Authentication and access
Use a maintained auth solution with a MongoDB-compatible implementation; inspect current official documentation and document the choice.
Provide a real usable account flow. Prefer email/password without mandatory email delivery for the hackathon unless an existing auth setup is present; use secure library-supported password hashing and secure sessions.
Owner-check every private read/write; derive identity and roles from sessions, never client fields.
Protect writes against CSRF according to the session/auth design. Rate-limit login, generation, voting, publishing, and uploads.
Public views expose only published snapshots and safe creator details.
Admin bootstrap must be explicit and server-controlled; never let public registration choose admin.
Validate asset permissions, not merely project ownership, on save/publish/remix.
Keep secrets out of git, logs, screenshots, reports, and browser bundles. Provide .env.example with names only.
Render user text safely. Use pagination and bounded server queries.

## 12. Implementation phases
Phase 0: inspect repo, scaffold if needed, choose compatible packages, create documentation and environment template.
Phase 1: prove the real asset -> Cloudinary -> editor -> MongoDB save/reopen integration gate.
Phase 2: complete authentication, durable generation jobs, asset library, project dashboard, editor, undo/redo, autosave/revision handling, preview.
Phase 3: publish snapshots, public gallery/viewer, cover capture, share links, permission-aware remix.
Phase 4: admin-created challenge, pinned starting room, submissions, window enforcement, voting, ranking/results.
Phase 5: validate SpatialGen if available; add supported environment integration without destabilizing the mesh path.
Phase 6: responsive polish, accessibility, performance, failure recovery, security checks, deployment instructions, evidence and submission handoff.
Do not pause after each phase. If blocked, record exact dependency and continue independent scope. Do not call a provider-backed phase verified without live evidence.

## 13. Verification
Use focused meaningful unit/integration tests for authorization, scene validation, revisions, idempotency, job recovery, publish snapshot immutability, asset references, remix permissions, challenge windows, and duplicate/self-votes.
Use a test database and explicitly isolated fixtures. Never delete real user data during tests.
Browser-check the core journey: register/login -> create -> real asset -> transform -> save -> refresh -> preview -> publish -> view as another user -> remix -> submit -> vote.
Check unauthorized cross-user project/asset access, stale saves, provider failure, transfer failure, unavailable model, missing secrets, and unsupported WebGL.
Run formatting/lint, strict typecheck, appropriate tests, and production build. Record exact commands and outcomes.
Test fixtures can verify behavior but do not prove live integration. Distinguish automated, browser, live-provider, and deployment evidence.
If live calls require credentials, list the exact missing variable names and continue locally; never request secrets in chat or put them in documentation.

## 14. Required handoff documentation
Maintain:
- README.md: setup, scripts, architecture, known limitations.
- .env.example: verified variable names and safe placeholders.
- docs/IMPLEMENTATION_PLAN.md
- docs/REQUIREMENTS_MATRIX.md: feature, status, code location, verification evidence/blocker.
- docs/DECISIONS.md: defaults and tradeoffs.
- docs/BLOCKERS.md: precise missing dependencies and next action.
- docs/API_CONTRACTS.md
- docs/INTEGRATION_VERIFICATION.md
- docs/DEPLOYMENT.md: provider setup, host limits, job processing, CORS/browser delivery, environment, real deployment verification.
- docs/DEMO_WALKTHROUGH.md: simple human-readable steps showing actual features and locating evidence.
- docs/SUBMISSION_NOTES.md: actual implemented features, Aholo usage, original work/third-party assets, report outline, real screenshots and remaining gaps.
Do not generate a report claiming unbuilt features. Keep the report outline ready; final PDF/PPT should use actual completed-project screenshots.
At handoff, state completed behavior, checks and results, exact blockers, and next commands. Do not call the project complete when key workflows remain unverified.

## 15. Definition of done
A real user can generate or import a genuine Lux3D object, arrange a usable room, save/reopen the exact layout, explore, publish, and share it. Another user can explore, remix with permission, and participate in a real configured challenge. Access controls and time windows hold. No invented community data or concealed fixture mode. Core checks pass. Provider/deployment limitations are explicitly documented. Submission material describes actual functionality.

