# November 18 transfer-size failure: exact diagnosis and recovery

The user's screenshot showed support reference `439b1021-12ef-49b8-88b8-08279190025e` for “A white flower vase with beautiful flowers in it.” Its persisted history identifies job `6afdee4ee2029e789a12741e`, original provider task `8354990`, stage `upload` and repeated Cloudinary `HTTP_400`. The same task had already finished successfully at Lux3D. This is a newly diagnosed failure, not an inference about earlier unrelated incidents.

## Reproduction

An operator read the specific job/history, queried its existing provider task (status 3), downloaded its genuine GLB using the validated HTTPS path and invoked the then-current upload code. No generation-create request was made. Cloudinary rejected the upload with these observed values:

| Property                             | Observed   |
| ------------------------------------ | ---------- |
| Original GLB bytes                   | 16,403,964 |
| Account's reported maximum raw bytes | 10,485,760 |
| Cloudinary HTTP status               | 400        |
| Failure stage                        | upload     |

Buildo accepted a source up to 25 MiB but did not adapt it to the smaller account upload limit. Repeated delivery retries sent the same oversized file and could not succeed. This was missed by earlier recovery/checkpoint work: that work improved diagnosis and transient recovery but did not fix this size mismatch.

## Fix

`server/model-preparation.ts` validates the self-contained static source GLB and keeps small models byte-identical. Oversized models are fitted to the default observed 10 MiB raw upload budget by serially resizing embedded PNG/JPEG textures through bounded maximum dimensions (2048/1024/512). Existing formats, alpha, supported glTF material extensions, mesh geometry, indices, transforms and bounds are retained. This is texture downsampling, not a lossless image-resolution claim. No Draco/WebP/KTX decoder requirement or geometry simplification is introduced. Models that still cannot fit produce a specific actionable storage-limit error instead of uploading/retrying unchanged oversized bytes.

Original SHA-256/byte size, delivered size, configured cap, method and texture edge are recorded as `deliveryPreparation` in assets/checkpoints. Geometry and original provenance remain recorded; the larger source binary is not permanently archived in Cloudinary by this metadata.

`CLOUDINARY_MAX_RAW_BYTES` optionally sets the true account cap, defaulting to 10,485,760. No new environment variable is required. Setting it higher does not change Cloudinary's actual limit. Sharp is now a runtime dependency; glTF extension support is explicitly registered. Paid generation is preceded by validated configuration and Cloudinary credential preflight, cached for up to a minute per credential set. This catches bad credentials before spending; it does not guarantee future availability/capacity. Upload stream errors are captured. Safe error codes distinguish size/auth/quota failures and retryable timeouts, including Cloudinary HTTP 499. Transient failures display “Retrying delivery.” No automatic paid re-generation exists.

## Actual recovery

```bash
node --conditions=react-server --import tsx --env-file=.env.local scripts/reconcile-generation.ts adeolasam20@gmail.com 6afdee4ee2029e789a12741e --retry-delivery
```

The existing task recovered to **ready**, asset `6afdf28a6156b5211616c525`:

- Delivered model: **8,489,196 bytes**, textures reduced from 2048×2048 to 1024×1024.
- Original SHA-256: `bc17decff10a24fa33512ca2bea18aaf8301acd3550fd6622be6fed6f3caf0e2`.
- Delivered SHA-256: `9a97e3273744b3ccbc8e1bd22ea2adf8d2a4a5498a36349a756f48a8819c5b5b`.
- All mesh attribute arrays and index arrays compared exactly equal before/after; bounds/vertex count unchanged.
- All three textures retained their original alpha-channel presence; optional material support was preserved.
- Actual raw Cloudinary delivery and SHA-256 verification passed before ready was stored.
- **Zero new paid generations.** Existing real room layout/publication unchanged; user can now place the ready asset from their library.

## Browser and regression verification

```bash
npm test
npm run typecheck
npm run lint
npm run build
node --env-file=.env.local scripts/live-model-browser.mjs adeolasam20@gmail.com 6afdf28a6156b5211616c525
```

58 tests passed across 11 files. New meaningful regressions cover byte-identical small-model passthrough, oversize fitting, original-byte immutability, geometry/material extension/alpha preservation, unfit geometry and invalid configuration, safe account-size errors, HTTP 499 retries, redaction, throttling/server recovery, and rejection before paid creation when storage preflight fails. Strict TypeScript, lint and production build passed. Formatting and diff checks passed. The complete isolated browser regression also passed, including accounts/settings, editor/history/revisions/autosave, publication/remix, challenge/voting, guest previews, mobile layout and zero uncaught browser errors.

The actual recovered model browser check passed HTTP 200 `model/gltf-binary`, CORS `*`, numeric move/rotate/uniform resize, MongoDB save, exact reload restoration and zero uncaught browser errors. Its screenshot was visually inspected: the genuine flower arrangement and white vase render. The browser room/account/database were disposable test records; production scene changes were not fabricated. See [recovery report](evidence/vase-recovery.json), [browser report](evidence/vase-browser-verification.json), [scene comparison](evidence/vase-scene-comparison.json), [actual screenshot](evidence/vase-restored.png).

## Deployment and limits

User supplied `https://buildo-7rsf.onrender.com`. Before this release, public `/api/health` returned HTTP 200 `{status:"ok"}`. This proves service health only; the texture-preparation code must be deployed for future uploads. The recovered vase already lives in the shared database and is visible after refresh. Updated health output includes Render's public `RENDER_GIT_COMMIT` prefix as `release` for version verification. No provider-created new job on Render or 100% provider availability is claimed. Free-host limits, source/geometry budgets, account quotas and external outages can still prevent completion; explicit states/recovery remain necessary.

Official references checked: [Cloudinary raw upload allowances](https://cloudinary.com/pricing/compare-plans), [account usage allowances](https://cloudinary.com/documentation/developer_onboarding_faq_usage_limits), [Node upload API](https://cloudinary.com/documentation/node_image_and_video_upload), [glTF Transform extension registration](https://gltf-transform.dev/modules/core/classes/NodeIO), [Render git revision variable](https://render.com/docs/environment-variables). Implementation uses Sharp directly for serial PNG/JPEG preparation rather than the parallel textureCompress transform; no unsupported provider endpoint was invented.
