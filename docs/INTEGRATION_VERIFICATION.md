# Integration verification

## Status

**Live integration gate blocked and unverified.** No `.env.local`, provider credentials, genuine Lux3D export, or deployed URL existed at initial inspection. No paid generation, Cloudinary upload or real-output rendering has occurred. Do not use automated fixture evidence as provider proof.

2026-11-13 update: `node --env-file=.env.local scripts/live-preflight.mjs <account-email>` passed live MongoDB ping and existing-account lookup, Cloudinary authenticated ping, and an authenticated read-only Lux3D task-list request. No secrets or signed URLs are printed. Required credentials are configured; `LUX3D_DOWNLOAD_HOSTS` remains unset pending an observed provider output hostname. The real-account test paused at Google sign-in because Google rejected the automated browser. No project or paid generation was created by that runner. Continue manually in normal Chrome/Safari; a successful provider preflight does not prove OAuth callback, model generation, delivery, or scene restoration.

## Official sources inspected on 2026-11-13

- https://labs.aholo.ai/api-docs/en/intro
- https://labs.aholo.ai/api-docs/en/skills/lux3d
- https://labs.aholo.ai/api-docs/en/api-reference
- https://labs.aholo.ai/api-docs/en/openapi.en.json (English international schema; the legacy `openapi.json` advertises a different regional server)
- https://lux3d.aholo.ai/docs redirected to `https://3d.aholo.ai/docs`, unavailable to the research tool. Not treated as verified.
- https://cloudinary.com/documentation/upload_parameters
- https://better-auth.com/docs/installation, /docs/adapters/mongo, /docs/integrations/next, /docs/authentication/email-password
- https://nextjs.org/docs/app/getting-started/installation
- https://r3f.docs.pmnd.rs/getting-started/installation
- https://gltf-transform.dev/modules/core/classes/NodeIO and /modules/functions/functions/getBounds

## Implemented adapter contract (documentation evidence only)

`POST https://api.aholo.ai/global/lux3d/v1/generate/text-to-3d/task/create`, raw API key in Authorization, JSON prompt/style/version G1/faceCount 50000/outputFormat [glb]. Successful envelope has string `c=0` and numeric task ID in `d`. Poll `GET .../task/get?taskid=ID`. Provider state in `d.status`: 0 initialized, 1 running, 3 succeeded, 4 failed, 6 cancelled. Query success is not job completion. GLB result is selected from `d.outputs[].content`, not a ZIP or NOT_REQUESTED placeholder. Result URLs expire after two hours according to the docs. No provider cancellation endpoint is assumed.

The app persists intent, hashes request content, guards per-user request keys and concurrent active jobs, and holds uncertain creation without another paid call. Polling leases protect finalization. Transfers persist `transferring` before download/upload. A retry re-queries the task for a current URL; it does not create a new task. No undocumented prompt-to-task reconciliation is claimed.

Cloudinary upload uses `resource_type: raw`, generated `.glb` public ID, no transformation and `overwrite: false`. Raw public IDs keep the extension. The server checks delivered bytes against the original SHA-256 before creating a ready asset. Preserve `resourceType`, `publicId`, `secureUrl`, `format`, bytes, original hash, source/task/prompt and normalization. Browser CORS/texture correctness still need actual verification.

GLB validation checks magic/version/length, embedded resources, accessors, mesh/texture costs and finite world bounds. Standard static GLB only. Normalization metadata centers X/Z and places the model floor at Y=0, with a one-meter longest axis. Original bytes are retained unchanged. Meters/Y-up/Euler XYZ are application defaults, not provider guarantees.

## Evidence categories

- Automated: see `docs/VERIFICATION.md`; isolated local mesh parsing, editor history, exact database scene round-trip and domain invariants. Fixtures are explicitly local test data.
- Browser: temporary database and local intercepted mesh, never genuine Lux3D/Cloudinary evidence. Screenshots are marked by fixture names and stored under ignored artifacts.
- Live provider: read-only authentication preflight passed; generation/upload/rendering gate not run.
- Deployment: not run.
- Furnished-room performance: not measured. Software-rendered browser smoke checks are not ordinary-laptop performance evidence.

## Required live procedure

1. Configure ignored `.env.local`; run indexes and app. Record tool versions and a nonsecret task/source identifier.
2. Generate one object with a supplied key, or import an actual user-exported GLB with source URL, task ID, prompt and rights declaration. User-attested provenance is identified as such.
3. For generation, record actual documented task states, original output format and exact trusted output hostname. Never paste signed result URLs or keys into evidence.
4. Record Cloudinary upload metadata without secrets; verify delivered SHA-256, GLB response bytes/content-type and browser CORS headers.
5. Inspect model textures, orientation, source bounds and canonical scale visually in the actual browser. Record anomalies; never assume doc support proves output compatibility.
6. Place, rotate and uniformly resize the asset. Save, record revision and scene JSON, hard refresh and compare exact position/rotation/scale.
7. Capture actual screenshots, preview and publish a snapshot; another real account explores and remixes with asset permission. Enter the actual admin-configured challenge and vote within its windows.
8. Add real furnished-room hardware/browser/object/triangle/texture observations. Validate context-loss recovery and unavailable-asset behavior.
9. Replace blocked statuses only after these results exist. SpatialGen/Viewer remains separate until actual 3DGS composition, camera and restoration checks succeed.
