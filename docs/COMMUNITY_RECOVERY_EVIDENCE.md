# Transfer recovery and open community evidence

November 17, 2026. This record distinguishes real provider/storage content, isolated technical tests, real user-authorized community setup, and unverified deployment. No new paid generation was submitted in this follow-up.

## Transfer failure: what is established

The earlier generic error did not retain the exact failing stage or low-level code, so the precise historical cause cannot be proved retroactively. Earlier confirmed defects were nullable output slots while Lux3D was generating and the missing observed download hostname `qhsmodel.kujiale.com`. Both are fixed. Raising the upload timeout to 60 seconds improves tolerance but is not proof of a historical timeout.

New failures retain the stage (provider status, download, GLB validation, Cloudinary upload, delivery verification or asset persistence), safe code, time, retryability and support reference. Raw errors, secrets and signed provider URLs are not logged or returned. A bounded history and exponential backoff make later incidents diagnosable. Permanent/configuration failures and eight recovery failures pause automatic recovery; owner **Retry delivery** retries the existing task only.

The upload checkpoint is persisted before delivery verification. If delivery/persistence is interrupted, recovery verifies the already-stored Cloudinary model and finishes asset creation. A five-minute lease with token fencing prevents an expired finalizer from overwriting a new worker. The minute-based Render recovery CLI is prepared and the real CLI was tested locally with the studio closed; Render itself has not run.

## Verification results

| Check                                                                                                        | Actual result / scope                                                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm test`                                                                                                   | 49 tests passed across 9 files; isolated MongoDB. Includes checkpoint-only recovery, retained failures/backoff, paused configuration failures, safe client projections, stale-lease fencing and owner-confirmed remix rights |
| `npm run typecheck`                                                                                          | Passed                                                                                                                                                                                                                       |
| `npm run lint`                                                                                               | Passed before final documentation; final check recorded in VERIFICATION.md                                                                                                                                                   |
| `npm run build`                                                                                              | Production build passed including Node health route                                                                                                                                                                          |
| `npm run test:browser`                                                                                       | Complete isolated browser regression passed; auth, settings, actual transforms/save/reload, revisions, autosave, theme, capture, publish/remix, challenges/voting, public previews, mobile and no uncaught errors            |
| `node --env-file=.env.local scripts/community-live-check.mjs adeolasam20@gmail.com 6af77e405fc6d2fc20c801d2` | Passed with all three actual Cloudinary Lux3D models in a read-only copy of bedroom revision 39                                                                                                                              |
| Browser Retry delivery                                                                                       | Deliberately interrupted isolated job recovered from the real model checkpoint; no provider creation/key                                                                                                                     |
| CLI with studio closed                                                                                       | Expired isolated lease recovered to ready using actual delivered Cloudinary bytes and no Lux3D key                                                                                                                           |
| Capture/upload/delivery                                                                                      | Actual viewport PNG uploaded to Cloudinary; HTTP 200, PNG signature and SHA-256 recorded                                                                                                                                     |
| Snapshot and remix                                                                                           | Private draft edit left immutable publication unchanged; second isolated account denied private draft, explored full publication and remixed all three models with attribution                                               |
| Challenge/votes/results                                                                                      | Isolated pinned-room entry; rejected votes before opening; vote/withdraw accepted during voting; self-vote rejected; final tally and closed-window rejection passed                                                          |

The first extended browser run passed recovery and real cover delivery but timed out while screenshotting a second active software-WebGL viewport. The rerun released the first viewport and used a bounded longer screenshot allowance; the full journey then passed. This is a browser harness limitation, not evidence of ordinary-hardware performance. Both runs uploaded genuine test covers to Cloudinary; no storage deletion was attempted.

Retained report: [community-recovery-verification.json](evidence/community-recovery-verification.json). Actual cover SHA-256: `47f6ee25958818037e877f01912275a4acc311ac8825fc2ad183c09b6d3c0e46`. [Captured viewport](evidence/community-actual-bedroom-cover.png), [isolated second-account remix](evidence/community-isolated-remix.png), [isolated results](evidence/community-isolated-results.png). The final live-model rerun explicitly waited for all three models to render in the second account’s public view and remixed studio. The captured cover and rendered remix screenshot were visually inspected and shows the genuine bed, table and TV console. Test accounts, challenges and votes existed only in disposable MongoDB. Their screenshots cannot be described as real community activity.

## Real authorized publication and challenge

The user explicitly confirmed permission to publish all three generated models and allow other accounts to reuse them in remixes. The explicit operator command validates the registered owner's identity, owned genuine models and unchanged source scene, grants the explicit admin role for challenge setup, enables asset reuse through the permission service, creates a pinned challenge project, publishes the actual room with its captured cover and submits the owner's first entry. It does not create accounts or votes. It reuses existing setup records on rerun; no new paid model generation occurs.

```bash
node --env-file=.env.local --conditions=react-server --import tsx scripts/setup-community.ts adeolasam20@gmail.com 6af77e405fc6d2fc20c801d2 --publish-and-allow-remix --bootstrap-admin
```

Completed real records:

- Original private bedroom: `6af77e405fc6d2fc20c801d2`, revision **39**, scene unchanged.
- Challenge: `6afc1474d89aa309674af843`, **Small Space, Big Ideas**.
- Separate pinned entry project: `6afc1476d89aa309674af844`.
- Remixable publication: `6afc147ad89aa309674af845`.
- First real owner submission: `6afc147cd89aa309674af846`.
- Genuine model tasks retained: `7232531`, `7242134`, `7248285`.
- Submissions close **November 18, 2026, 18:00 Africa/Lagos (17:00 UTC)**.
- Voting then opens and closes **November 19, 2026, 10:00 Africa/Lagos (09:00 UTC)**.
- Open to **any authenticated Buildo account**. No account/email allowlist.
- **Zero test accounts or votes created in the real database.** Independent human participation remains pending; no winner is claimed.

[Real setup record](evidence/real-community-setup.json) includes IDs, storage URL and timestamps. No secrets or sessions are retained. Public views show a limited preview; full room, remix, entry list and participation require sign-in, per the requested product policy.

Open locally:

- [Published bedroom](http://localhost:3000/designs/6afc147ad89aa309674af845)
- [Open challenge](http://localhost:3000/challenges/6afc1474d89aa309674af843)

## Remaining limits

No Render deployment or HTTPS OAuth result is claimed. See [RENDER_SETUP.md](RENDER_SETUP.md) for exact setup and release checks. SpatialGen/Viewer compatibility, ordinary-hardware profiling, independent human participation, demo footage and final report remain outstanding. Provider output expiration can still require operator help if transfer never reached Cloudinary; automatic recovery never purchases a replacement generation.
