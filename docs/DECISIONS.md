# Decisions

2026-11-13 studio/settings: attach TransformControls explicitly to the object group saved by the editor instead of its default wrapper. Numeric checks alone were insufficient evidence; add actual pointer drags and persisted-transform assertions. Built-in wall patterns are procedural application textures, not provider-generated content. The user separately authorized two real Lux3D requests for a complete bed and TV console/television; stable idempotency keys and one active generation preserve that limit. GrantPath's settings dock/profile-directory/two-column-panel design is the requested visual reference; Buildo implements only applicable functioning controls and labels missing account/email capabilities honestly. Reference and exact evidence: STUDIO_BEDROOM_EVIDENCE.md.

2026-11-13 appearance: offer Light/Dark/System with a device-default initial choice and browser-local persistence. Apply the resolved theme before paint. Theme affects interface and viewport backdrop only; it never changes room materials, lighting, scene JSON, revision or publication data. A permanent sidebar/header switch complements the Settings appearance controls. No new package is required.

2026-11-13 live Lux3D observation: the running task response contains null output slots. Filter those slots before GLB selection instead of treating a successful running-status response as a provider failure. Clear the previous safe error when status polling succeeds. Never resubmit the paid task for this parsing issue.

- One Next.js fullstack application; MongoDB stores scenes and domain data via Mongoose. Better Auth uses its official MongoDB adapter and secure library email/password flow. No mandatory email delivery, no password reset until a mail provider exists.
- Scene convention: meters, right-handed, Y up, Euler XYZ radians. Normalize each model to centered X/Z and floor Y=0 with longest dimension 1m; keep source bytes and metadata. Object scaling preserves proportions by default.
- Only self-contained GLB accepted initially. ZIP is never treated as a renderable URL. External references are rejected; genuine Lux3D exports can be repackaged externally and imported with task/source provenance.
- Warm neutral surfaces, orange accent, charcoal type are defaults.
- Voting: one vote per account per entry, no self-votes, withdraw during voting. Ties: earliest submission then stable ID. One immutable entry per account per challenge; no replacement initially.
- Challenge templates pin room dimensions and version; furniture arrangement remains editable. No seeded challenge or winners.
- Publications retain referenced assets. Private deletion is soft deletion. Remix grants access only to explicitly reusable published assets.
- Generation submission intent is durable before network calls. An uncertain create never automatically retries. Polling is bounded per request; browser/manual refresh drives reconciliation. No pretend background worker.
- SpatialGen/Viewer remain unverified; 3DGS is distinct from editable meshes.

## UI refinement (2026-11-13)

The user requested a more beautiful interface. Refined the warm paper palette with forest accents, stronger type hierarchy, a serif display accent, readable contrasting buttons, architectural line art, and calmer form/editor panels. The interactive landing preview has functional warm oak/sage/terracotta finish swatches. Procedural floor grain/baseboards improve the real room shell without adding invented generated furniture. New-project setup includes a live dimensional preview and an optional saved design brief; it never starts a paid generation automatically. All community content still comes from actual stored publications.

CSS design tokens live in src/app/globals.css. System/local font fallbacks keep builds independent of remote font downloads. Decorative motion respects reduced-motion preferences; viewport transformations remain direct Three.js controls. No AI-generated promotional imagery or fabricated community statistics were introduced.

## Runtime safeguards

Domain and essential auth indexes are awaited before serving database requests. Generation output hostnames are persisted for operator review; the trusted download allowlist may be set after task submission and delivery retried without another paid create. Scene budgets are conservative validation defaults, not benchmarks. Original model resources use URL-based reference counting and deferred disposal when no instances remain; per-instance tint materials are separately disposed. Unknown paid creation remains held for explicit operator reconciliation.

## Landing expansion and Google OAuth

Kept the existing warm visual direction following the user’s preference. Added locally bundled DM Sans (SIL Open Font License included in public/fonts), more readable controls and labels, a procedural furnished room illustration with an explicit blank-canvas toggle, room-category inspiration, workflow details, FAQs and a final invitation. The illustration is original local mesh geometry only on the landing preview; never a Lux3D generation, imported asset or community publication. Public projects and editor scenes do not acquire these illustration objects.

Google OAuth uses Better Auth’s documented socialProviders.google and client signIn.social flow. Configure GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET server-side; the public config route exposes only an availability boolean. No custom token exchange, extra Google service scopes or public role selection. Missing configuration disables Google while preserving email authentication. Registered callback origin must match BETTER_AUTH_URL. Live OAuth requires the operator’s Google client/consent screen configuration.

## Password visibility and SEO

Shared accessible PasswordInput provides a type=button eye control with changing Show/Hide label, aria-controls and aria-pressed. Revealing never changes the input value, validation or autocomplete. Current login/register fields both use it.

SEO uses current Next.js metadata APIs: server-owned home wrapper, per-public-page metadata and canonical URLs, public-record-only dynamic metadata, branded OG image, icon, robots and sitemap. SITE_URL is the canonical public origin (fallback BETTER_AUTH_URL). Non-HTTPS/local origins default noindex. Private/auth routes have noindex metadata and X-Robots-Tag; robots.txt does not disallow them because that would prevent crawlers reading noindex. API crawling is disallowed. Missing public IDs return 404; provider/database errors yield noindex rather than claiming valid content. Structured data describes the WebSite only, without fabricated ratings or search capabilities. Sitemap queries are bounded below the 50,000 URL limit; partitioning remains future work if content exceeds bounds.

## Registration checklist

Following the supplied UI reference, registration now requires confirmation and shows six live checks: 10–128 characters, lowercase, uppercase, number, symbol and exact match. Each password field has independent reveal/conceal state. Confirmation is client-only and is not sent to the provider or stored. Better Auth’s documented before hook enforces the same five password composition rules on email signup so direct API requests cannot bypass them; existing account sign-in and Google OAuth are unchanged. Whitespace is not treated as a symbol and values are never silently trimmed. The UI shows a live passed-count, six-segment progress indicator, individual check states and instructional footer.

## Dashboard redesign

The workspace overview now separates navigation, create/resume, project discovery, recent assets and generation activity. Counts are real server counts across the signed-in account, not current-page array lengths. Search/category/sort are server-side with bounded input and escaped literal search. Project artwork is a schematic room plan based on the saved scene, not a fabricated rendered screenshot. The creation journey and challenge invitation are guidance, not invented activity or seeded challenge results.

The dashboard summary polls read-only stored state every 30 seconds while visible. Refresh generation status explicitly reconciles only existing queued/generating/transferring or transfer-failed jobs, never submits a new generation. Uncertain paid submissions remain review-only. Each independent panel has a real loading/empty/error state; publication totals describe snapshots, not unique projects. Current implementation keeps the asset library and settings as existing routes while the dashboard has a dedicated responsive sidebar.

## Shared workspace navigation

Removed the public top navigation and footer from dashboard, asset library, account settings, project creation, studio and administration. A single shared sidebar supplies branding, workspace/discovery links, active-route states, account navigation and sign-out. Mobile has compact workspace shortcuts and an expandable menu with all routes and sign-out. Studio uses a narrow desktop rail to preserve viewport space. Asset/settings tab duplication was removed. Landing, public designs/gallery/challenges/creator profiles and authentication pages retain public navigation.

The frame checks the real session before mounting private workspace contents and clears server-state cache on successful sign-out. Existing service authorization and noindex metadata remain in place; this UI shell does not replace access controls. Route classification matches path boundaries rather than prefixes like `/dashboard-other`.

## Public previews and member community

Per the user’s latest request, Explore/Challenges now use the shared workspace shell when signed in, along with design and creator detail pages. Anonymous users retain public navigation, three-card previews and short descriptions. Full interactive scenes, model delivery metadata, challenge rules/template and entries are served only after a session check; this is a response-field/projection policy, not a visual blur. Guest lists cannot page around the preview cap. Public SEO describes the same limited preview rather than exposing full content through metadata.

There are no duplicate public/member publication records or separate challenge copies. The same share URL becomes a full workspace view after authentication. Destination-preserving sign-in/register/OAuth uses an internal-route allowlist; client queries are keyed by viewer and caches cleared on sign-in/sign-out. Uncertain provider jobs, ownership checks, immutable snapshots, remix permissions and voting windows remain unchanged. Previously shared public Cloudinary delivery URLs are not retroactively revoked by this UI/API access policy.
