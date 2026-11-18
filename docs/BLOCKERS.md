# Current blockers and remaining verification

Updated November 17, 2026. Earlier credential/transfer blockers have been resolved for the three authorized bedroom models. No required environment variable is currently missing locally for Lux3D, MongoDB, Cloudinary or configured Google sign-in. Keep all secrets in ignored `.env.local` or the deployment secret manager.

- **Render deployment:** Public host `https://buildo-7rsf.onrender.com` now returns HTTP 200 health. The latest corrective release still needs deployment/version verification. `render.yaml` and [RENDER_SETUP.md](RENDER_SETUP.md) provide the default free Node web service and optional paid minute-based recovery job, database access, environment and OAuth setup. Free-only mode has no scheduled worker. Need the actual Render service origins/outbound ranges and a deployment run. No Render credentials are needed merely to prepare this setup; no deployment is claimed.
- **Independent human participation:** the real remixable bedroom and open challenge now exist. No account allowlist is used. Another person can sign in, explore/remix and submit during the open window; votes are accepted only in the later voting window. Technical two-account browser checks passed in a disposable database, including real Cloudinary models/covers. Those test accounts/votes are not production engagement. No production test votes or fabricated winners were created.
- **Google callback:** the user reports regular Chrome sign-in. Automated Chrome was rejected by Google. Do not bypass that check or extract regular-browser sessions. Validate the exact HTTPS redirect and cookies after deployment in regular Chrome.
- **SpatialGen/Viewer:** no actual compatible output or composition evidence. Environment generation remains unavailable; rooms are honestly procedural editable geometry.
- **Performance/device coverage:** actual three-model browser rendering and restoration pass. Ordinary-laptop frame-time/memory measurements, broad touch/device coverage and explicit context-loss checks remain unverified. Software WebGL screenshots are not hardware benchmarks.
- **Submission handoff:** public demo URL, actual running-project footage and final PDF/PPT report still need completion. Retained actual screenshots and an outline exist. No external X post has been made.
- **Email account recovery:** email delivery is not configured; password recovery, Google-only password setup and email changes remain unavailable. Existing credential password changes and session revocation are tested.

## Transfer limitations

The original generic failure did not retain enough diagnostics to prove its exact historical cause. Confirmed earlier issues were nullable provider outputs while still generating and the missing observed GLB host in the download allowlist. Both were fixed. Increasing upload timeouts was a mitigation, not proof that a timeout caused the historical failure.

New recovery persists the stage, safe error code, support reference, bounded history, next retry time, lease token and uploaded-model checkpoint. Automatic retries never create another paid generation. Nonretryable failures or eight recovery failures pause for owner/operator attention. A five-minute lease prevents concurrent finalizers and recovers after process termination. Cloudinary upload followed by a process crash before checkpoint persistence can still leave an orphan; deterministic IDs and explicit reference audits protect cleanup. Expired provider output URLs may still require provider/operator help; do not automatically buy a replacement generation.

No missing-secret blocker remains for the completed bedroom. Future output hosts must be reviewed before changing `LUX3D_DOWNLOAD_HOSTS`; never allow arbitrary user-supplied download domains.

## November 18 update: exact vase failure resolved

Support reference `439b1021-12ef-49b8-88b8-08279190025e` maps to task 8354990. Cloudinary rejected the 16,403,964-byte GLB because this account's raw limit is 10,485,760 bytes. Automatic texture preparation recovered the original task to ready asset `6afdf28a6156b5211616c525` at 8,489,196 bytes; actual delivered bytes, browser rendering and save/reopen passed. This failure is precisely diagnosed; earlier unrelated failures are not. The deployed host now is known and health returned 200, but the corrective release must still be deployed/verified. See TRANSFER_SIZE_FIX_EVIDENCE.md and DEPLOYMENT.md. No new paid generation or room mutation occurred during recovery.
