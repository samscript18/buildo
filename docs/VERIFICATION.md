# Verification record

## Studio toolbar, bedroom and settings follow-up

See STUDIO_BEDROOM_EVIDENCE.md for actual pointer-drag values, saved-transform comparisons, camera reset, wallpaper save/reload, the two authorized Lux3D job IDs and GrantPath reference. Final production build, strict TypeScript, lint, 43 unit/integration tests and the expanded full isolated browser journey passed. Browser checks include display-name persistence, password change/revert, weak-password API rejection, other-session revocation followed by HTTP 401 in that session, token-free settings summaries, mobile settings routes and shared navigation. A TransformControls persistence bug and attachment-before-model-ready issue were fixed; session-read 429 errors and mobile-header overflow found by the expanded regression were corrected and rechecked. Reviewed screenshots and a hash manifest are retained in docs/evidence/.

Date: 2026-11-13. Initial repository contained only AGENTS.md; no application was overwritten. Root brief preserved. No credentials were printed or written into source. Automated tests use disposable databases; the separate authorized live check uses the user's real project and provider task as recorded below.

## Dark appearance and live-response correction

Production build, lint, strict TypeScript and all 42 tests passed. Two new Lux3D adapter regression tests cover observed null output slots during generation and preservation of populated outputs. The isolated Chrome journey passed with theme switching, preference persistence after reload, OS light/dark changes in System mode, Settings selection state, visible mobile switch/no overflow, and unchanged saved scene JSON and revision. Existing auth/editor/save/conflict/publish/remix/challenge/privacy checks passed without uncaught browser errors. Dark landing, dashboard, studio and mobile Settings screenshots were visually inspected under ignored `artifacts/browser/*dark*.png`; test furniture is explicitly a local fixture, not Lux3D evidence. Final screenshot review corrected light backgrounds on dashboard asset cards and the mobile menu.

Live evidence is separate: real task `7232531` completed; a 6,789,860-byte GLB was downloaded using the validated allowlist, and passed actual GLB inspection. Original bounds: X ±0.25m, Y ±0.23301132023334503m, Z ±0.18764230608940125m; 25,520 vertices and 12,582,912 texture pixels. One optional `KHR_materials_specular` warning was observed by the bounds inspector; original bytes were preserved. Actual Cloudinary raw upload and delivered SHA-256 passed. The separate `test:live-model` harness then rendered that genuine model from Cloudinary (HTTP 200, model/gltf-binary, CORS `*`), moved/rotated/resized it, saved it in a disposable MongoDB scene and restored exact scene JSON after reload. Real wood textures, upright orientation and floor placement were visually inspected in the actual screenshots. The user's original bedroom was not modified; this is genuine provider/storage/model evidence with an explicitly isolated test scene. Details and artifacts: INTEGRATION_VERIFICATION.md.

## Automated

- `npm run typecheck`: passed (strict TypeScript).
- `npm run lint`: passed with no errors or warnings after fixes.
- `npm run format:check`: passed.
- `npm test`: 20 tests passed across 4 files. Disposable `mongodb-memory-server`; no user database URI is read by the test setup. Test data never enters public application storage.
- `npm run build`: Next.js 16.4.6 production build passed with all declared public/private routes.
- Dependency installation after the compatible minimatch security override reported 0 known vulnerabilities. The override is scoped to the lint toolchain’s typescript-estree dependency.

Coverage includes bounded/finite scene validation, unique instance IDs, exact UTC boundaries, undo/redo and saved-version behavior, GLB parsing/source preservation, cross-user project/asset denial, atomic revisions and exact scene round-trip, immutable snapshots/private deletion, asset-aware remix/root attribution, non-admin denial, unique submissions/votes and self-vote/closed-window rejection, paid request idempotency/uncertain creation, interrupted intent recovery, finalizer leases, transfer failure recovery, aggregate scene cost, Origin rejection, streamed request limits and unsafe transfer addresses.

## Browser

`npm run test:browser` uses a temporary MongoDB server/database, temporary accounts, local generated mesh bytes, and a test-only network interception. It does **not** upload to Cloudinary, call Lux3D, or use a real user database. Test assets/publications/challenges are labeled TEST ONLY; the process/database are torn down. There is no product fixture mode.

Verified against the built application with headless Chrome:

- Procedural room actually renders; public gallery initially empty.
- Registration creates a real session in the disposable database.
- Project creation with a live room-dimensions preview and local fixture placement; numeric move, rotation and linked scaling; manual save and exact hard-refresh restore.
- Debounced autosave persists a dimension edit without clicking Save, and hard reload restores it.
- Stale revision gives recoverable conflict and reload action without overwriting newer data.
- Preview captures an actual viewport PNG; published snapshot loads in a public viewer. Cloudinary cover upload is deliberately omitted because it is not configured.
- Second account cannot read the private draft; public exploration and permitted remix preserve lineage.
- Admin role assigned only within isolated test database; real API creates pinned challenge; submission, second-account vote and withdrawal work.
- Mobile landing at 390px has no horizontal overflow. Desktop/mobile screenshots were visually inspected.
- No uncaught browser errors after replacing transient DOM portals inside the 3D loading path.

Screenshots (ignored local artifacts):

- `artifacts/browser/landing-desktop.png`
- `artifacts/browser/landing-mobile.png`
- `artifacts/browser/studio-test-fixture.png`
- `artifacts/browser/new-project-desktop.png` (visually inspected)

These are development evidence, not proof of Lux3D integration, real community activity, deployment, or normal-laptop performance.

## Resolved verification failures

Concurrent dependency installs initially conflicted; interrupted dependency directory was moved aside and a sequential install completed. The sandbox denied MongoDB local listening and a Tailwind/Turbopack worker port; tests/build succeeded after permitted execution and a clean build cache. An overly exact heading selector was corrected from the observed accessible name. The browser exposed a transient model-loading DOM cleanup error; replacing in-canvas HTML loading portals with mesh fallbacks fixed it. Screenshots now wait for a rendered frame.

## Still required

Real Lux3D job/import → Cloudinary → browser texture/bounds/orientation checks → MongoDB save/reopen; two real configured accounts and production challenge; actual gizmo drag/touch walkthrough/context-loss checks; realistic furnished-room device measurements; deployed HTTPS cookie/CORS/host-duration checks; actual footage and final report. See BLOCKERS.md and INTEGRATION_VERIFICATION.md.

## Landing expansion / OAuth checks

The current browser harness also checks the room-study/blank-canvas toggle, finish swatches and expandable FAQ. Google authorization initiation is checked using dummy credentials against the local Better Auth endpoint: Google host, client ID, callback URI, state and code response type. No Google account or token exchange is simulated as a real success. It also checks safe callback-error UI and a disabled Google button when capability configuration is absent. Actual Google consent and callback remain unverified until a genuine client is configured.

Latest result: formatting, strict typecheck, lint, production build and all 20 automated tests passed after the landing/OAuth changes. The expanded isolated Chrome journey passed, including FAQ/preview interactions, dummy-client Google OAuth initiation, unavailable-provider fallback, signup, transforms, manual save/reopen, stale conflicts, autosave, publishing, remix, submissions/voting and 390px mobile overflow checks. Desktop landing/login and mobile landing screenshots were visually inspected. No uncaught browser errors were observed. Real Google token exchange remains unverified.

## Password visibility / SEO

Added five focused SEO tests (25 automated tests total): canonical-origin normalization, local/HTTP noindex defaults, explicit noindex on public deployments, rejection of credential-bearing/non-HTTP origins, and safe JSON-LD escaping. The browser harness checks password reveal/conceal on both account forms without losing the value, canonical/OG/Twitter/structured-data output, social-image bytes, noindex headers, public snapshot metadata, missing-public-record status and sitemap privacy. A global loading boundary initially produced a soft 404 for missing public records; loading boundaries now live on private/auth routes so public existence checks can finish before a response starts.

SITE_URL must be set to the intended production HTTPS origin before build. Search Console, deployed social previews and real search indexing are not verified by local tests.

Final password/SEO result: production build, strict TypeScript, lint, formatting and 25 automated tests passed. The full isolated browser journey passed, including reveal/hide with preserved values on login/register, canonical/social/JSON-LD output, generated PNG delivery, private noindex headers, public publication metadata, invalid-public-ID HTTP 404 and sitemap exclusion of private/auth routes. One software-WebGL startup exceeded the former five-second test allowance; rendered-frame assertions now allow thirty seconds without masking browser errors. A separate database-disabled server also confirmed HTTP 404 for an invalid public-design ID.

Registration checklist verification includes four password-policy unit cases (empty state, length/composition boundaries, mismatch, exact whitespace handling). The isolated browser harness checks initial 0/6, 5/6 before confirmation, mismatch submission blocking, matched 6/6, independent eye controls, and successful signup. A direct weak-password signup request must return 400 without creating an account. Confirmation is never sent in the Better Auth request.

Registration checklist result: production build, formatting, lint, strict typecheck, 29 automated tests and the expanded isolated browser journey passed. Initial/mismatch/matched checklist states, both independent eye controls and direct API weak-password rejection were verified. The full registration screenshot at artifacts/browser/register-checklist.png was visually inspected against the supplied reference. No actual user data or credentials were used by these tests.

## Dashboard redesign

31 automated tests pass, including new account-isolated dashboard totals/activity and owner/category-scoped literal search, total counts and pagination. Browser checks passed for a real empty dashboard in the disposable database, populated counts/latest-project resume, project-name search, no-results recovery, category filtering, sorting and 390px dashboard overflow. Desktop/empty/mobile screenshots are in artifacts/browser/dashboard-desktop.png, dashboard-empty.png and dashboard-mobile.png and were visually inspected. All content in these screenshots is explicitly TEST ONLY and created in the isolated database. The complete existing registration/editor/save/publish/remix/challenge journey also passed with no uncaught browser errors.

The dashboard uses a real loading placeholder until the overview resolves, rather than presenting missing data as an empty workspace. Each data panel retains independent retry/error state. No community numbers, generation output or progress percentages were invented.

Shared workspace-shell checks cover private-route classification, public route preservation, one main landmark, absence of the public header on workspace routes, active-sidebar state on assets/settings/create/admin, mobile menu navigation, mobile studio overflow and a compact desktop studio rail. Sign-out is checked from the workspace and followed by a denied private API request. Existing end-to-end fixture safeguards apply.

Final shared-shell result: production build, formatting, lint, strict typecheck, 33 automated tests and the expanded isolated browser journey passed. Workspace routes have no public header; assets/settings/create/admin show the correct active navigation. Mobile account-menu routing, studio overflow, a compact desktop rail and workspace sign-out/401 private access were verified. Public navigation remains visible on public pages. Screenshots of workspace assets, mobile settings and desktop studio were visually inspected under artifacts/browser/workspace-*.png. No uncaught browser errors were observed.

Community access verification now covers preview caps that cannot be bypassed with pagination, safe field projections without scenes/model URLs/private draft references, full published scenes for signed-in viewers, omitted anonymous challenge rules/template, authentication-required entry reads, draft invisibility and safe internal auth return paths. The browser harness additionally checks member workspace navigation, guest preview/CTA behavior and a guest signing in directly back to the chosen full design.

Final preview/member result: production build, strict TypeScript, lint, formatting and 40 automated tests passed. The full isolated browser journey passed, including member Explore/Challenges sidebar/active state, guest scene/model/rules/template omission, 401 guest entry access, noninteractive public design preview, preserved sign-in destination and successful return to the full selected design. Desktop member gallery and public design/challenge preview screenshots were visually inspected in artifacts/browser/workspace-explore.png, public-design-preview.png and public-challenge-preview.png. Existing editor, publishing, remix, voting, mobile overflow and sign-out checks passed with no uncaught browser errors.

## November 17: recovery and open community release

Final follow-up tests: `npm test` **49 passed / 9 files**, including owner-only remix permission confirmation, retained safe provider HTTP status, interrupted transfer checkpoints/backoff and lease fencing. `npm run lint`, `npm run typecheck` and `npm run format:check` passed. The complete `npm run test:browser` regression passed in disposable MongoDB with no uncaught browser errors. Production build passed; a later sandboxed Turbopack compile stalled and was interrupted, then rerun with the host build permission.

The genuine-model `scripts/community-live-check.mjs` additionally passed actual Cloudinary GLB checkpoint recovery through owner Retry delivery and the real reconciliation CLI with the studio closed. Real PNG capture/upload/delivery, snapshot immutability, two-account full viewing/remix and pinned challenge/vote/withdraw/window/results checks passed. Those participants and votes are isolated test records. Exact commands, failures/retries, retained screenshots and reports are in COMMUNITY_RECOVERY_EVIDENCE.md.

The real owner separately authorized publication and asset reuse. Setup created the real remixable bedroom, a real open challenge and first owner submission, without modifying the original revision-39 bedroom or creating accounts/votes. Local GET checks returned the expected limited guest previews, `phase:open`, `allowRemix:true`, and health `status:ok`. No Render or public HTTPS result is claimed. RENDER_SETUP.md supplies exact deployment and verification steps.
