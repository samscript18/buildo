Current follow-up: the recurring vase upload rejection is diagnosed and fixed. Oversized GLBs now receive automatic texture preparation for Cloudinary’s actual raw-file limit; the original vase task recovered without another paid generation. [Exact cause, evidence and limits](docs/TRANSFER_SIZE_FIX_EVIDENCE.md) · [Render setup](docs/RENDER_SETUP.md). Public host: https://buildo-7rsf.onrender.com; deployment of the corrective release still needs verification.

# Buildo

Studio controls, wallpaper, the two authorized bedroom generations and the GrantPath settings reference are tracked in [docs/STUDIO_BEDROOM_EVIDENCE.md](docs/STUDIO_BEDROOM_EVIDENCE.md). Settings now has overview, profile, appearance, password/sessions and privacy pages. Studio wallpaper choices are under the room properties. Select an object before dragging Move/Rotate/Resize handles; Snap affects gizmo dragging, and Undo/Redo track scene changes.

For evidence checks after a build: `npm run test:live-model -- <email> <ready-asset-id> --controls` exercises actual gizmo pointer drags and verifies the saved transforms in disposable MongoDB. `node --env-file=.env.local scripts/bedroom-scene-browser.mjs <email> <owned-project-id>` renders a read-only snapshot of an actual saved room in an isolated private test account, checks parsed Cloudinary models and exact reload restoration, and captures light/dark screenshots. Neither test edits the original project or generates/publishes content. Reviewed evidence retained with the repository is in `docs/evidence/`, with SHA-256s in its manifest.

Appearance: use the moon/sun control in the header or workspace sidebar. Settings → Appearance offers Light, Dark and System, saved in the current browser. Theme changes do not modify saved room materials or lighting.

Live diagnostics (use your account email and existing IDs): `npm run test:preflight -- <email>`, `npm run generation:reconcile -- <email> <job-id>` to resume an existing job, or add `--inspect-output` to download/validate without uploading. These commands never create a generation. `npm run test:live-model -- <email> <asset-id>` renders an existing genuine Cloudinary asset in a disposable MongoDB test room and checks exact transform restoration; it leaves the real project unchanged and never publishes. Build first with `npm run build` and keep port 3102 available. Evidence goes to ignored `artifacts/live-model-browser/`.

Imagine it. Build it. Explore it.

A Next.js fullstack spatial design app built from the root AGENTS.md brief. Includes real account flows, procedural mesh rooms, a transform editor, MongoDB scenes, Lux3D job/import adapters, Cloudinary storage, immutable public snapshots, attributed remixing, and admin-created challenges with submissions and voting.

The live Lux3D → Cloudinary → browser → MongoDB integration gate has genuine model evidence, including the recovered vase, bed, bedside table and TV console. Separate automated tests use disposable MongoDB and explicitly labeled fixtures; those fixtures are not provider or community evidence. There is no production fixture mode or seeded community activity. See docs/INTEGRATION_VERIFICATION.md.

## Setup

Use Node.js 22.12+ (implemented and checked on Node 26.4.0) and npm.

```bash
npm ci
cp .env.example .env.local
```

Fill the ignored `.env.local` locally:

- `MONGODB_URI`: local MongoDB database or Atlas URI with read/write and index permissions. Do not point automated tests at it; tests create their own server/database.
- `BETTER_AUTH_SECRET`: generate using `openssl rand -hex 32`.
- `BETTER_AUTH_URL`: `http://localhost:3000` for local use, exact HTTPS app origin for production.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: server-side Cloudinary credentials.
- `LUX3D_API_KEY`: Aholo API key for object generation. Not needed for user-supplied Lux3D GLB import.
- `LUX3D_DOWNLOAD_HOSTS`: comma-separated exact trusted output storage hostnames, obtained from genuine provider output. It must be configured before a new paid submission. Future unrecognized output hosts are retained as `outputHost` for operator review and delivery retry. No wildcards, paths, IP addresses or invented hosts. Downloads reject redirects and private addresses.

```bash
npm run db:indexes
npm run dev
```

Visit http://localhost:3000, register an account, create a project, and import a genuine self-contained Lux3D GLB or submit a generation. See [the demo walkthrough](docs/DEMO_WALKTHROUGH.md) for the evidence checklist. Missing configuration does not prevent build or the public landing page; unavailable workflows explain their status without exposing secrets.

## Administrator bootstrap

Register the intended account first. Run locally with access to the correct database:

```bash
npm run admin:grant -- your-registered-email@example.com
```

Then visit `/admin/challenges`, create an actual brief and schedule, and activate it. No public API or registration field grants administrator rights. Once activated, template and schedule are frozen. The default room is 5 × 4 × 2.8 meters.

## Checks

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm run test:browser
```

Database tests start a disposable `mongodb-memory-server` and may download its MongoDB binary the first time. Browser checks require a production build, a free port 3100, and Chrome at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`; set `BUILDO_CHROME_PATH` to another Chromium executable when needed. The browser harness creates temporary accounts, a **TEST ONLY local mesh**, and temporary publications/challenges in its disposable database. It intercepts the fixture model request locally and calls no providers. It tears down its server/database afterward. Screenshots under ignored `artifacts/browser/` are test evidence, not Lux3D submission evidence.

For production locally:

```bash
npm run build
npm start
```

## Architecture

- `src/app`: App Router pages and thin route handlers.
- `src/server`: Better Auth, cached Mongoose connection, indexed models, domain services, exact-schema Lux3D adapter, bounded/pinned HTTPS transfers and Cloudinary uploads.
- `src/lib/scene.ts`: strict Zod scene contract; meters, Y-up, right-handed, Euler XYZ radians.
- `src/features/editor`: Zustand history, lazy React Three Fiber viewport, transform gizmos, numeric properties, autosave and conflict recovery.
- `src/components`: account/workspace/community/challenge UI; TanStack Query server state.
- `tests`: schema, history, static GLB, and isolated database invariants.

Next.js route handlers are the only backend; no Express/Nest service. Domain data uses Mongoose. Better Auth uses its official native MongoDB adapter. Tailwind 4, Three/Fiber 9, React 19 and restrained Framer Motion are installed with a lockfile.

## Known limits

- Genuine generation, observed output hostnames, Cloudinary browser delivery/textures and exact scene save/reopen are verified with the evidence distinctions in docs/INTEGRATION_VERIFICATION.md. Imported provenance is user-attested; it is not provider-verified when no API key is available.
- Only static, uncompressed, self-contained GLB 2.0 meshes are accepted. No automatic ZIP extraction, external textures, rigged assets or required glTF extensions. No substitute models are presented as generations.
- Jobs reconcile through bounded status requests. The studio polls while open; dashboard has refresh actions. No always-running worker is assumed. Uncertain paid creation is held for operator review and never automatically resubmitted.
- Scene budgets are validation defaults, not measured performance claims: 80 instances, 1.5 million total vertices, 100MB unique source bytes, 48 megapixels unique textures; each source file ≤25MB, textures ≤4096px and 24 megapixels total. Stored models default to the observed 10 MiB Cloudinary raw cap; oversized sources receive texture preparation. Real laptop furnished-room performance is unmeasured.
- Public walkthrough provides free movement without collision detection, with orbit/pinch as the touch alternative. Standard PBR tinting does not retexture arbitrary models.
- Capture renders one frame without keeping `preserveDrawingBuffer` enabled. Actual Cloudinary viewport-cover upload and delivered PNG are verified; see docs/COMMUNITY_RECOVERY_EVIDENCE.md.
- Email verification and password recovery delivery are not configured. No collaboration, payments, subscriptions, marketplace, invented winners, SpatialGen/Viewer compatibility claim, deployed URL or final submission report.
- See the [requirements matrix](docs/REQUIREMENTS_MATRIX.md), [blockers](docs/BLOCKERS.md), [integration evidence](docs/INTEGRATION_VERIFICATION.md), and [deployment instructions](docs/DEPLOYMENT.md) for current verification status and remaining work.

## Google sign-in (optional)

Create a **Web application** OAuth client in Google Cloud Console and configure the consent screen (add test users while the app is in testing). Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in ignored `.env.local` or your host’s secret manager; restart the server afterward. Both values are server-only. The Google button enables when account configuration and both Google credentials are present. Email/password stays available.

Register this authorized redirect URI for local development:

```text
http://localhost:3000/api/auth/callback/google
```

For production, register `https://YOUR_DOMAIN/api/auth/callback/google` and set `BETTER_AUTH_URL=https://YOUR_DOMAIN`. Use the same origin in the browser; `localhost` and `127.0.0.1` are different OAuth origins. Google credentials must belong to that registered Web application. Better Auth handles state, authorization code exchange, Google identity validation and the MongoDB session. Successful sign-in returns to `/dashboard`; unsuccessful handoff returns to `/login` with a safe retry message. No Google Drive/Gmail scopes are requested by this integration.

Source: [Better Auth Google provider documentation](https://better-auth.com/docs/authentication/google). An isolated test verifies authorization URL creation with dummy credentials; real Google consent/callback/session creation still requires your actual registered client and account. Do not treat that isolated test as live Google OAuth evidence.

## SEO and password controls

All account password fields include an accessible eye button to reveal/hide the current value without submitting the form. The shared `PasswordInput` preserves native validation and password-manager autocomplete.

Set `SITE_URL` to your final public HTTPS origin (e.g. `https://your-domain.example`) **before building**. It falls back to `BETTER_AUTH_URL`, then localhost. Canonical URLs, Open Graph/Twitter previews and WebSite structured data use this origin. Keep production and preview environments configured separately: localhost and HTTP origins default to noindex; use your production domain only on the production deployment.

- Public landing, gallery and challenges have dedicated titles/descriptions/canonicals.
- Published designs use their stored title/description/cover for metadata. Only active challenges and creators with published work are eligible for public metadata; missing IDs return 404 and unavailable data is noindex.
- `/opengraph-image` generates a branded PNG social preview; `/icon.svg` supplies the app icon.
- `/sitemap.xml` contains public pages, up to 20,000 recent publications, 5,000 active challenges and their published creators. No private projects or auth pages. Local/non-HTTPS environments return an empty sitemap. Expand to partitioned sitemaps when these limits become relevant.
- `/robots.txt` advertises the public sitemap on HTTPS deployments and blocks API crawling. Private/auth pages use both noindex metadata and `X-Robots-Tag`; they remain crawlable so search engines can see noindex. Authentication remains the access-control boundary.

After deployment, verify the canonical domain, actual social previews and public content, then submit `/sitemap.xml` in Google Search Console. No search ranking/indexing result or rich result appearance is guaranteed. No analytics trackers, fabricated reviews or ratings were added.

Email registration requires a matching confirmation and a 10–128-character password with lowercase, uppercase, a number and a symbol. The six live checklist items update as you type. Password composition is also enforced server-side on new email signups. Existing account sign-in remains compatible with previously registered passwords; Google sign-in does not use the checklist.

The dashboard is a structured workspace overview with dedicated navigation, actual account totals, a latest-project resume action, server-side project search/category/sort and pagination, recent assets and generation activity. Refresh status reconciles existing jobs only; it never creates another paid generation. The room artwork is a schematic of the stored room, not a rendered thumbnail or a provider output. Each panel includes its own loading/empty/error handling.

Private workspace screens share one navigation shell: sidebar branding, overview/projects/assets/create links, account settings and sign-out. The studio uses a compact desktop rail; mobile uses shortcuts and a full expandable menu. The public top header/footer remain on landing/community and login/register pages. Asset/account tabs were removed to avoid duplicate navigation. Existing server authorization still protects private reads and writes.

## Explore and Challenges: public previews, full member experience

Visitors see up to three preview cards plus short descriptions, covers and basic challenge dates. Opening a shared design/challenge while signed out shows a sign-in invitation. Scene JSON, model delivery metadata, complete challenge rules, starting-room details and entries are not sent to anonymous visitors. Challenge-entry API reads require authentication.

After signing in, the same URLs open inside the workspace sidebar with full paginated collections, interactive designs, permitted remixing, full challenge briefs and entries. Sign-in/signup links retain a safe internal destination; Google uses the same destination. Private project ownership and voting/submission windows still apply. The public metadata/sitemap describe preview URLs; no full protected content is placed into structured data. This user-requested policy supersedes earlier documentation describing unrestricted public interactive views.
