# Demo walkthrough

This guide describes implemented controls. Credentials now pass read-only connection checks, but the complete live journey still needs a genuine Lux3D asset and normal-browser sign-in verification. Do not record test fixtures as submission content.

## Current private bedroom check

Use a regular Chrome or Safari window at `http://localhost:3000/login`, then choose Google sign-in. Google rejected the automated test browser; its session is separate from your regular browser. No paid generation has been submitted by the runner.

Create a private project named “Bedroom — live integration check” in the bedroom category. Submit exactly one generation with the approved prompt: “A contemporary oak bedside table with rounded corners and one drawer, isolated single furniture object”. Choose photorealistic style. Do not submit again if the result is delayed or uncertain. If transfer is blocked, review the existing job's observed provider hostname, configure only that trusted hostname in `LUX3D_DOWNLOAD_HOSTS`, restart the app, and resume the same job.

Once the asset is ready, add it, inspect textures and orientation, move it, rotate it, and resize it. Save, refresh, and compare the exact transforms. Keep the project private during this check. Record actual outcomes in INTEGRATION_VERIFICATION.md; preflight success alone does not complete the gate.

## Complete product journey

1. Follow README setup. Visit `/register`, create an account, and open `/projects/new`.
2. Name and categorize a room, optionally save your starting idea, and inspect the live preview. Choose dimensions or create it from a live challenge’s starting-room button. The shell is explicitly procedural.
3. In the studio, open the import panel and provide a genuine self-contained Lux3D GLB, original task/source/prompt and rights declaration. Or use the generation form after configuring the Aholo key. A queued/generating state is not a completed asset.
4. Wait until the model has been transferred and is available in the asset library. Select it to place it in the room. Click it to select; use Move/Rotate/Resize gizmos or numeric properties. Numeric scale keeps proportions linked. Optional snapping uses 0.25m, 15 degrees and 0.1 scale steps.
5. Duplicate/delete with buttons; undo/redo with buttons or Ctrl/Cmd+Z and Shift+Ctrl/Cmd+Z. Ctrl/Cmd+D duplicates, Delete removes, Escape deselects. Shortcuts ignore text fields. Ctrl/Cmd+S saves outside text fields.
6. Change floor/wall tint, room dimensions and lighting. Keep pinned challenge dimensions. Autosave runs after a pause; use Save explicitly as needed. Read the saved status, hard refresh and verify transforms. Stale saves present an error with Download edits and Reload latest actions; they do not overwrite the newer revision.
7. Preview hides editing controls. Drag to orbit, scroll/pinch to zoom, right drag to pan. Walkthrough uses WASD/arrow keys, with no collision detection. Reset view restores the starting camera.
8. Share/Publish opens the snapshot form. Capture the viewport, review its cover, add a description, and choose permitted remixing. Reusable permissions are required for every asset. Publish then open the permanent design URL; copy its share link.
9. Register/sign in as another account. Open the public link, explore, then remix if allowed. The copied project preserves original/root attribution and references reusable assets.
10. Bootstrap the real administrator via README, create “Small Space, Big Ideas” with actual rules and UTC windows, then activate it. Each participant starts from its pinned template, publishes a snapshot, and submits the design ID before the deadline. One fixed entry per account; no replacement currently.
11. During voting, a different account can vote once per entry or withdraw. Self-votes are rejected. After closing, totals are final and ties sort by earlier submission, then stable ID. Buildo voting is distinct from the hackathon’s community panel.

## Evidence location

- Live gate checklist: INTEGRATION_VERIFICATION.md.
- Automated commands/outcomes: VERIFICATION.md.
- Optional isolated browser harness: `npm run build && npm run test:browser`. It uses local TEST ONLY fixture content and disposable MongoDB; it never proves provider integration.
- Actual submission screenshots/video: not captured yet; collect only after the live gate succeeds.

## Public preview → member exploration

Open `/explore` or `/challenges` in a signed-out browser to see the capped preview and sign-in invitation. A shared design URL shows a cover/short summary; its room viewer is not loaded. A challenge URL shows its title/theme/dates, with full rules and entries behind sign-in. Follow the sign-in link (or create an account): after authentication the same URL opens with the workspace sidebar and full content. Verify by requesting the guest API directly: there must be no scene/model delivery data, and challenge entries must return 401. Test fixtures can check this boundary but do not prove live provider delivery.
