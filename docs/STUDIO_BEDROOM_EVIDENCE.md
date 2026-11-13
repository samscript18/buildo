# Studio controls, bedroom furnishings and settings evidence

Date: 2026-11-13, Africa/Lagos. This record distinguishes implementation, isolated browser tests and actual provider outputs. The original private bedroom project is `6af77e405fc6d2fc20c801d2`. No public posting or publication is part of this task.

## Studio control investigation

The earlier live-model check proved numeric move/rotate/resize and save/reload. It did not prove physical gizmo dragging. Code inspection identified a genuine bug: Drei TransformControls attached to its default wrapper group, while the save callback read the inner group. The control is now explicitly attached to the same group whose transform is saved. Move/Rotate/Resize have pressed states and selection guidance; Snap explains 0.25m/15°/0.1 increments. Actual pointer-drag verification is tracked below, not inferred from numeric tests.

Automated procedure: `npm run test:live-model -- <account-email> 6af782945fc6d2fc20c801d4 --controls`. It uses the genuine existing Cloudinary model in an isolated temporary room, physically drags coloured handles, checks numeric transform changes, checks undo/redo restoration, tests snapped movement and camera reset after orbit. The original real bedroom is not edited by that harness. Results and screenshot paths will be appended after execution, including failures.

## Two authorized Lux3D furniture generations

The user explicitly chose two new provider-credit generations. No third generation is authorized. Both use G1, photorealistic, 50,000 requested faces, GLB output, private asset/reuse disabled. Creation intent and idempotency are persisted before paid calls; unknown/failed jobs are never automatically resubmitted.

- Bed prompt: “One complete contemporary double bed, warm oak wooden bedframe with low legs and rounded upholstered headboard, mattress fitted inside the frame, cream linen duvet and two soft pillows, cohesive realistic furniture assembly, isolated single furniture object, no room, no floor, no surrounding objects”. Actual job `6af78632d132a3820da8932e`, provider task `7242134`; completed, genuine Cloudinary asset and visible contents verified below.
- TV shelf prompt: “One contemporary low oak television console shelf with open storage compartments and short legs, a modern flat screen television standing securely centered on top, dark black screen, cohesive realistic furniture assembly, isolated single furniture object, no room, no wall, no surrounding objects”. Actual job `6af78af020c01fd7d492c465`, provider task `7248285`, ready Cloudinary asset `6af78eae5fc6d2fc20c801d6`. Stable request keys are defined in `scripts/bedroom-furnishings.ts`; the second submission waited for the previous active job to finish. A prompt is not evidence of model contents; actual TV model inspection follows.

Operator command: `node --conditions=react-server --import tsx --env-file=.env.local scripts/bedroom-furnishings.ts <account-email> 6af77e405fc6d2fc20c801d2 --submit-authorized`. This is narrowly defined for the two approved objects. Re-running resumes existing jobs by stable per-user keys. Do not reuse the command for a different project or account without separate authorization.

## Wallpaper implementation

Built-in original procedural wall finishes: woven linen, stripes, arches. No generated image or fake Lux3D output is used. Optional scene room fields are validated: wallpaper (`none|linen|stripes|arches`), wallpaperWall (`back|left|both`), wallpaperColor (hex colour). Existing scenes remain valid. Save/publish/remix preserve the fields through the existing immutable snapshot flow. The texture uses the selected wall paint as its base and a separately chosen accent; generated GPU textures are disposed when replaced. Custom image uploads are not implemented or claimed.

## Settings design reference and actual capabilities

Inspected the user's GrantPath local checkout and the connected GitHub file `samscript18/GrantPath/src/components/settings-frame.tsx`, blob SHA `8c149792b59e5b7b05b64b218199cf0ad2b0d13a`. Reference: https://github.com/samscript18/GrantPath/blob/main/src/components/settings-frame.tsx . Also inspected its settings overview, appearance and account page layouts. Reused the design approach—navigation dock, prominent creator profile, focused two-column working panels—adapted to Buildo. GrantPath's scholarship settings and backend were not copied.

Buildo routes: `/settings`, `/settings/profile`, `/settings/appearance`, `/settings/account`, `/settings/privacy`. Real actions use Better Auth: update display name, change existing email/password account password using current password and policy checklist, revoke other sessions. Google-only accounts show a Google security link and an honest unavailable-password-setup explanation. Safe server settings summary exposes provider names and session dates, never tokens, password hashes or OAuth secrets. Email changes/recovery, account deletion, data export and notification delivery remain unavailable; no decorative controls promise those actions.

Official sources consulted: https://better-auth.com/docs/concepts/users-accounts and https://better-auth.com/docs/concepts/session-management . The installed Drei TransformControls implementation was inspected to verify its `object` attachment behaviour.

## Verification status

- Final production build passed.
- 43 focused tests passed, including backward-compatible wallpaper validation.
- Strengthened real-model pointer-drag/save/reload checks passed. The final full isolated Chrome product journey passed, including settings security actions, community navigation, publishing/remix/challenges and mobile overflow, with no uncaught browser errors.
- Screenshots and machine-readable reports live in ignored `artifacts/`; durable findings belong in this document and INTEGRATION_VERIFICATION.md. Secrets and signed URLs are excluded.

### Observed control results with the genuine bed

At `2026-11-13T22:21:49.683Z` (23:21 Africa/Lagos), the genuine generated bed passed the strengthened browser check. Actual pointer drags changed Move X from 0 to approximately 0.572m; Rotate X from 0° to approximately -65.156° (floor-aware lifting kept the rotated model above the floor); Resize X from 1 to approximately 1.527. Resize axis handles permit per-axis scaling; numeric scale inputs remain proportion-linked. Every drag was saved to MongoDB and compared to the visible inputs. Undo returned all transforms exactly to their pre-drag values; Redo restored the changed values. With Snap enabled, the movement ended at X=0.5m, a 0.25m increment. After an orbit drag, Reset view restored a screenshot with zero average pixel difference from the starting camera. This is physical pointer interaction evidence, not a simulated store mutation.

The same run selected arches on the back wall, saved X=1.1m, Y rotation=30°, linked scale 0.8, and restored the entire scene JSON exactly after reload. The browser confirmed parsed GLB readiness and direct Cloudinary delivery, HTTP 200, `model/gltf-binary`, CORS `*`. No uncaught page errors remained. Artifacts: `artifacts/live-model-browser/6af78a6c5fc6d2fc20c801d5/verification.json`, `controls-verification.json`, `controls-move.png`, `controls-rotate.png`, `controls-resize.png`, `controls-move-snap.png`, and `genuine-table-restored.png` (legacy filename; this run contains the genuine bed, identified by task/asset in its report).

An earlier check caught a model-loading lifecycle issue: controls could attach before the parsed object group existed. They now render only after the actual group is mounted and attach directly to that target. A separate earlier harness checked only a room frame before model parsing; the harness now explicitly waits for parsed asset readiness. Those failures were not presented as successful runs.

### Bed provider/storage result and original-room placement

Task `7242134` completed. Ready asset: `6af78a6c5fc6d2fc20c801d5`; original self-contained GLB 7,900,320 bytes, SHA-256 `f6343af2a7a1ce7d65569334ab23de0afaf8f7fc2fdfff7c486738fc86084fc2`. Observed 30,244 vertices and 12,582,912 texture pixels. Bounds X ±1.0499999523162842m, Y ±0.6970292329788208m, Z ±0.909996747970581m; normalization scale 0.47619049781574513, floor offset Y 0.6970292329788208. An optional specular-extension warning was observed by the inspector; original bytes were preserved. An initial transfer failed; bounded delivery retry of the same task succeeded. The upload timeout was increased from 20 to 60 seconds to allow genuine model transfers, still within the existing 180-second lease. No new generation was submitted for that retry.

The rendered actual output visibly contains the wooden bedframe, upholstered headboard, mattress, pillows and bedding. It is one combined generated furniture object, not independently editable pillows/mattress parts. The user requested addition to their actual bedroom; the local operator command added the ready bed and linen wall finish with CAS revision protection, skipping duplicate assets and preserving the user's existing table transforms, room dimensions and lighting. The first placement reached revision 28. A read-only copy of that actual two-model scene rendered and restored successfully in a disposable test database; see `artifacts/bedroom-scene/6af77e405fc6d2fc20c801d2/verification.json` and bedroom light/dark screenshots. Final composition awaits the TV asset.

The second authorized request is confirmed: job `6af78af020c01fd7d492c465`, provider task `7248285` (TV console and television). No third request is authorized or submitted.

### Settings security/action checks

The isolated browser run verified profile-name save and reload, then restored the test name. It created a second legitimate session for the same test account, revoked other sessions through the UI, and observed HTTP 401 on that other session's private API request. It changed the test password and changed it back, verified the password visibility control, and confirmed a direct weak-password request receives HTTP 400. Settings summary contains credential provider names and session dates but no token fields. All settings routes were checked at 390px without page overflow. Screenshots: `artifacts/browser/settings-directory.png` and `settings-privacy-mobile.png`, visually inspected.

The expanded run exposed HTTP 429 on `/api/auth/get-session` during rapid navigation, causing client navigation to appear anonymous despite a valid server session. A documented Better Auth custom rule now allows a bounded 120 session reads/minute; login/write limits remain unchanged at their existing stricter settings. Source: https://better-auth.com/docs/concepts/rate-limit . The full regression passed after the fix. The public mobile header's redundant sign-out control is hidden on small screens; workspace access and workspace-menu sign-out remain available.

## Committed evidence

The TV console also passed its individual direct-Cloudinary render, numeric transforms, wallpaper and exact save/reload check with no uncaught page errors. Its default front-angle screenshot visibly shows the television and the console's storage openings: [TV console](evidence/tv-console-restored.png), [verification report](evidence/tv-verification.json). The complete-room screenshot shows the console from the angle chosen in the user's saved layout; no furniture was reoriented merely to improve evidence.

Reviewed real screenshots and the genuine-bed JSON report are copied into `docs/evidence/`, so evidence is retained with the source rather than only in ignored local artifacts. `docs/evidence/manifest.json` identifies each file, its originating actual test artifact, byte length and SHA-256. No screenshots are mockups. Settings accounts and browser-scene records are clearly TEST ONLY; the generated models and Cloudinary delivery are real.

### Complete saved-bedroom check

Both new generations completed, were uploaded as original GLBs, and passed delivered SHA-256 verification before being marked ready. The TV-console GLB is 6,274,632 bytes, SHA-256 `9fbc7960ff2d6202554e7a478722228b79dc7b33aacc4d2509395488f72a6e50`, bounds X ±0.800000011920929m, Y ±0.6170018911361694m, Z ±0.18622060120105743m, normalization scale 0.6249999906867744. The rendered actual object contains a wooden TV console and a television together. A TV screen/video playback feature is not implemented or claimed.

The final ownership-checked project read captured revision 39, including the user's latest 6m × 6m × 3m room, evening lighting and their edited positions, rotations and scales for all three objects. The user had already placed/repositioned the ready TV and bed; the idempotent placement command therefore reported “No ready furnishing is missing; project unchanged.” It did not override those edits. The side table's existing transforms were preserved throughout.

Command: `node --env-file=.env.local scripts/bedroom-scene-browser.mjs <account-email> 6af77e405fc6d2fc20c801d2`. At `2026-11-13T22:35:22.107Z` (23:35 Africa/Lagos), the complete actual saved scene was copied read-only into a disposable test database/account with remapped private asset references. All three actual Cloudinary GLBs were parsed and rendered; linen wallpaper appeared on the back wall. Light/dark screenshots were captured with finite transitions completed, visually inspected, and the entire copied scene restored exactly after hard reload with no uncaught page errors. No production writes, new generations or publications occur in this harness.

Retained evidence: [light bedroom](evidence/bedroom-light.png), [dark bedroom](evidence/bedroom-dark.png), [actual scene and model verification](evidence/bedroom-verification.json), [bed pointer/save/reload report](evidence/bed-verification.json), [settings overview](evidence/settings-overview.png), [mobile privacy settings](evidence/settings-privacy-mobile.png). Room/account names in screenshots explicitly identify the disposable test copy; models, materials and the copied original layout are genuine.
