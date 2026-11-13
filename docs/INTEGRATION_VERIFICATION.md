# Integration verification

## Additional real bedroom assets and actual toolbar verification

The user authorized two more Lux3D generations: bed/frame/mattress/bedding task `7242134` (ready asset `6af78a6c5fc6d2fc20c801d5`, 7,900,320 bytes) and TV console/television task `7248285` (ready asset `6af78eae5fc6d2fc20c801d6`, 6,274,632 bytes). Both original GLBs are in Cloudinary with verified delivered hashes. Exactly those two additional generations were submitted; delivery retries never created more paid tasks. Prompts, source bounds, hashes, transfer observations and actual inspected contents are recorded in STUDIO_BEDROOM_EVIDENCE.md.

Actual gizmo pointer drags now verify Move/Rotate/Resize, database saves, undo/redo, snapped movement and camera reset. The investigation fixed a real wrapper-versus-inner-transform persistence error and a model-loading attachment lifecycle error. Wallpaper, all three genuine models and the user's complete saved scene at revision 39 were rendered in light/dark, visually inspected and restored exactly after hard reload in a read-only test copy. Retained screenshots and JSON evidence are under docs/evidence/. This is genuine provider/storage/asset evidence with an explicitly isolated scene/account; the original user room is never overwritten by browser tests. It does not establish realistic furnished-room performance on ordinary hardware, real production challenge participation or deployment verification.

## Status

**Core asset pipeline verified in a controlled isolated room.** The one real generation completed, its genuine GLB is stored in Cloudinary with a verified delivery hash, and the actual model rendered and retained exact transforms through MongoDB save/reload. The browser scene/account/database were disposable test records; the asset and provider/storage delivery were genuine. The user's original bedroom was left unchanged and still needs its manual placement/save check. This does not verify deployment, a real configured challenge or SpatialGen.

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

## Actual bedroom generation, 2026-11-13

The user reports being signed into Buildo in regular Chrome and submitted the single authorized generation from their own studio. Ownership-checked MongoDB inspection confirmed project `6af77e405fc6d2fc20c801d2` and durable job `6af77e815fc6d2fc20c801d3`, created at `2026-11-13T21:17:53.500Z`. Actual Lux3D task ID: `7232531`. Prompt: “A contemporary oak bedside table with rounded corners and one drawer, isolated single furniture object”. No second generation was submitted.

The authenticated documented task-query endpoint returned HTTP 200, envelope `c: "0"`, task ID `7232531`, status `1` (running), and `outputs: [null, null]`. This exposed an adapter error: empty output slots during generation were rejected as malformed, producing the screenshot's misleading delivery message. The adapter now filters empty slots, retains actual output objects, and clears stale errors after a successful poll. Two focused regression cases cover that observed response and populated output preservation.

A subsequent real query returned status `3` (success) with a ZIP on `tx-qhfpm-1258830046.cos.ap-shanghai.myqcloud.com` and a direct GLB on `qhsmodel.kujiale.com`. Only the authenticated result's exact GLB hostname was added to the ignored local `LUX3D_DOWNLOAD_HOSTS` configuration. The ZIP is not used as a model URL. Signed output URLs are excluded from evidence. Transfer is being checked using the original owned job, without another generation request.

The first transfer attempt failed without creating a new provider task. A bounded fresh download and inspection succeeded: GLB 6,789,860 bytes, 25,520 vertices, 12,582,912 texture pixels; source bounds X ±0.25m, Y ±0.23301132023334503m, Z ±0.18764230608940125m. Normalization scale is 2, floor offset Y 0.23301132023334503. The inspector emitted an optional `KHR_materials_specular` warning; original bytes are preserved. Reconciliation of the same owned job succeeded using `npm run generation:reconcile -- <account-email> 6af77e815fc6d2fc20c801d3`. It uploads but cannot submit a generation. The local operator command also exposed and fixed Mongoose's named-export incompatibility in native Node; application model imports now use the default export.

Actual asset ID `6af782945fc6d2fc20c801d4`, format `glb`, Cloudinary resource type `raw`, bytes `6789860`, SHA-256 `fc6045b31b9ee165000f13ae086db22cf7c1241b5532cee45a4c5e5308bdd9af`. The server downloaded Cloudinary's delivered bytes and verified that hash before the job became `ready`. No model conversion or fake replacement was used. The real user's room has not been modified by the operator command.

### Genuine-model browser result

Command: `npm run test:live-model -- <account-email> 6af782945fc6d2fc20c801d4`, after `npm run build`. The harness ownership-checks the actual ready asset in the configured database, then reads it without changing production records. It runs the real application on port 3102 with a disposable MongoDB database/account/private project and a private copy of that genuine asset's metadata. Provider and upload credentials are disabled in that test server; no generated-model response is intercepted, no new generation is created, and nothing is published.

Observed at `2026-11-13T21:42:30.707Z` (22:42 Africa/Lagos): Cloudinary browser response HTTP 200, `Content-Type: model/gltf-binary`, `Access-Control-Allow-Origin: *`. The genuine oak table and embedded wood textures are visibly rendered upright with legs on the room floor. The original model is about 0.5m on its longest axis; the application's recorded normalization makes that axis 1m before per-instance scaling. Numeric inputs moved X to 1.1m, rotated Y to 30° (`0.5235987755982988` radians), and uniformly resized to `[0.8, 0.8, 0.8]`. Save reached revision 2; after a hard page reload the complete scene JSON matched exactly. No uncaught browser errors or model-unavailable notice occurred.

Actual screenshots were visually inspected: `artifacts/live-model-browser/genuine-table-preview.png` and `genuine-table-restored.png`. Machine-readable result: `artifacts/live-model-browser/verification.json`. These ignored local artifacts contain the genuine model in an explicitly TEST ONLY room. The initial harness timeout was an overly exact Category selector; correcting the accessible selector completed the check, without changing application behaviour or repeating a provider generation.

## Implemented adapter contract (documentation evidence only)

`POST https://api.aholo.ai/global/lux3d/v1/generate/text-to-3d/task/create`, raw API key in Authorization, JSON prompt/style/version G1/faceCount 50000/outputFormat [glb]. Successful envelope has string `c=0` and numeric task ID in `d`. Poll `GET .../task/get?taskid=ID`. Provider state in `d.status`: 0 initialized, 1 running, 3 succeeded, 4 failed, 6 cancelled. Query success is not job completion. GLB result is selected from `d.outputs[].content`, not a ZIP or NOT_REQUESTED placeholder. Result URLs expire after two hours according to the docs. No provider cancellation endpoint is assumed.

The app persists intent, hashes request content, guards per-user request keys and concurrent active jobs, and holds uncertain creation without another paid call. Polling leases protect finalization. Transfers persist `transferring` before download/upload. A retry re-queries the task for a current URL; it does not create a new task. No undocumented prompt-to-task reconciliation is claimed.

Cloudinary upload uses `resource_type: raw`, generated `.glb` public ID, no transformation and `overwrite: false`. Raw public IDs keep the extension. The server checks delivered bytes against the original SHA-256 before creating a ready asset. Preserve `resourceType`, `publicId`, `secureUrl`, `format`, bytes, original hash, source/task/prompt and normalization. Browser CORS/texture correctness still need actual verification.

GLB validation checks magic/version/length, embedded resources, accessors, mesh/texture costs and finite world bounds. Standard static GLB only. Normalization metadata centers X/Z and places the model floor at Y=0, with a one-meter longest axis. Original bytes are retained unchanged. Meters/Y-up/Euler XYZ are application defaults, not provider guarantees.

## Evidence categories

- Automated: see `docs/VERIFICATION.md`; isolated local mesh parsing, editor history, exact database scene round-trip and domain invariants. Fixtures are explicitly local test data.
- Browser: temporary database and local intercepted mesh, never genuine Lux3D/Cloudinary evidence. Screenshots are marked by fixture names and stored under ignored artifacts.
- Live provider/storage/model browser: actual user-submitted task completed; genuine GLB uploaded, hash/CORS/textures/rendering verified; exact transforms saved/reopened using a disposable MongoDB scene. Original user bedroom placement/save remains a manual check.
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
