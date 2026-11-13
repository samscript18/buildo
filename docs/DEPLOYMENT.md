# Deployment

No deployment has been performed. There is no verified public demo URL.

## Runtime and providers

Deploy this one Next.js repository to a Node.js host with HTTPS, outbound TLS and request durations of at least 120 seconds for model finalization. MongoDB requires read/write/index privileges and a bounded connection pool. Atlas or a managed replica set is recommended operationally; the current Better Auth adapter also supports standalone MongoDB without transactions. Domain invariants use atomic compare-and-set updates and unique indexes rather than requiring multi-document transactions.

Set the exact names in `.env.example` in the host’s secret manager. Never prefix secrets with NEXT_PUBLIC_. `BETTER_AUTH_URL` must match the externally visible HTTPS origin; session-authenticated domain writes validate Origin. Register the intended admin normally, then run the explicit local admin bootstrap against the intended database. Build and execute indexes before opening traffic.

```bash
npm ci
npm run db:indexes
npm run build
npm start
```

The local CLI reads `.env.local`; hosted index provisioning should provide equivalent process variables (use `node --conditions=react-server --import tsx scripts/indexes.ts` when no local file exists). Do not expose MongoDB publicly. Ensure auth unique indexes have completed before registration traffic.

## Limits and storage

- Request JSON ≤1MB. Multipart model body ≤25MB +20KB; streamed bytes are bounded even without Content-Length. Configure reverse-proxy upload limits accordingly. Hosts with smaller body caps cannot use this import route without a separate reviewed signed-upload design.
- No long-running background work after a response. Each status request reconciles at most one job under a persisted lease. Studio polls every 15 seconds. Dashboard/manual refresh resumes persisted jobs after navigation or restart.
- API route duration is declared 120 seconds; verify host support. Provider queries time out after 20 seconds; each HTTPS model delivery after 30 seconds; model Cloudinary upload after 20 seconds. A finalization lease is 180 seconds. A host terminating a request leaves recoverable persisted state; wait for lease expiration before retry.
- Unknown paid creation is deliberately held. An operator must inspect the provider account and reconcile the actual task ID or confirm no creation before allowing a new paid attempt. Do not blindly reset unknown jobs. No automatic prompt-based task matching is implemented.
- Result URLs have limited lifetime. For unattended production usage, add an authenticated scheduled reconciler that invokes the same bounded reconciliation service; no scheduler is installed or claimed. Revisit expired output handling before leaving jobs unattended.
- `LUX3D_DOWNLOAD_HOSTS` is an exact operator-managed list. HTTPS download pins validated public IPv4 DNS addresses into the TLS request and rejects redirects, custom ports, credentials and private IPs. Do not add arbitrary user domains. Storage CNAMEs/IPv6-only delivery have not been validated.
- Cloudinary models are raw assets, with explicit public ID/resource type/secure URL. No image transformations on GLBs. Delivered bytes are hashed before ready status. Verify raw delivery account settings, CORS and browser loading with actual output; uploads alone do not prove browser compatibility.
- Never automatically delete uploaded assets. Publications/remixes retain references; private project deletion is soft. Upload failures after remote success can leave unreferenced storage objects. Audit hashes, task IDs and all references before any manual cleanup.
- Server-enforced scene/model budgets protect against obvious oversized input; they are not measured frame-rate guarantees. Test actual output on intended hardware.

## Release verification

Run formatting, lint, strict typecheck, isolated database tests, build and isolated browser journey. Then execute the actual live integration checklist, verify two real accounts and a genuine admin-configured event, test stale tabs/cross-user access and auth cookies over HTTPS, and record a demo video from the running project. Confirm localized UTC challenge boundaries. Keep test screenshots separate from submission media. Record the real URL and observed host limits here after deployment.

## Google OAuth

Optional server secrets: `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. Register `<BETTER_AUTH_URL>/api/auth/callback/google` on the Web application OAuth client in Google Cloud Console. Configure consent and testing users before attempting real sign-in; use the same browser origin as BETTER_AUTH_URL. Restart the server when changing these variables because the auth instance is cached. No live Google callback/session result has been recorded. Setup and isolated test limits are in README.md and VERIFICATION.md.

## Search metadata

Set SITE_URL to the final HTTPS application origin before build and runtime. Use a separate non-indexable origin for development/preview. Verify `/robots.txt`, `/sitemap.xml`, `/opengraph-image`, per-page canonical/Open Graph tags and private noindex headers after deployment. Dynamic sitemap queries need MongoDB; a database failure produces a server error instead of a misleading empty public-content sitemap. Search Console ownership verification and actual search indexing have not been performed. No analytics credentials are required.
