# API contracts

All domain endpoints use JSON except multipart asset import. Authenticated identity comes exclusively from Better Auth session cookies. Writes require matching Origin. Errors: `{error:{code,message,requestId,fields?}}`. Success is JSON; dates ISO, IDs strings. Lists use bounded page/limit. Scene schema in src/lib/scene.ts. 1MB JSON body maximum. All private identifiers are ownership checked.

Settings: authenticated `GET /api/settings` returns own id/name/role/email/createdAt, at most ten provider names and twenty unexpired session start/expiry dates. It never returns session tokens, password hashes, provider tokens, IP addresses or user agents. Profile updates use Better Auth `POST /api/auth/update-user` with name validation (1–80 characters). Existing credential accounts use `POST /api/auth/change-password` with currentPassword/newPassword/revokeOtherSessions; the server enforces the same composition policy as registration. `POST /api/auth/revoke-other-sessions` uses the current session and cannot revoke another account's sessions. Email changes and password setup for Google-only accounts remain unavailable without configured email recovery.

Room scene additions are optional and backward compatible: `wallpaper: none|linen|stripes|arches`, `wallpaperWall: back|left|both`, `wallpaperColor: #rrggbb`. They are part of the validated project scene, revision checks and immutable publication snapshots. Unknown patterns and non-hex colours are rejected.

| Method/path                              | Body/behavior                                                                                |
| ---------------------------------------- | -------------------------------------------------------------------------------------------- |
| GET/POST /api/auth/[...all]              | Better Auth email signup/signin/session/signout                                              |
| GET/POST /api/projects                   | Own list / {title,category,brief?,scene,challengeId?}                                        |
| GET/PATCH/DELETE /api/projects/:id       | Own project / {revision,title?,scene} CAS / soft delete                                      |
| GET/POST /api/assets                     | Own assets / multipart file,name,taskId,sourceUrl,prompt,allowReuse,rightsConfirmed          |
| GET/POST /api/generations                | Own jobs / {projectId,prompt,requestKey,style,allowReuse?}                                   |
| GET /api/generations/:id                 | Own status, bounded provider reconciliation; no new create                                   |
| POST /api/projects/:id/publish           | {description,allowRemix,revision,cover?}; immutable snapshot                                 |
| GET /api/designs                         | Public snapshots                                                                             |
| GET /api/designs/:id                     | Public scene and safe referenced assets                                                      |
| POST /api/designs/:id/remix              | Allowed owned copy preserving root attribution                                               |
| GET/POST /api/challenges                 | Public list / admin {title,theme,rules,room,opensAt,submissionsCloseAt,votingCloseAt,status} |
| GET/PATCH /api/challenges/:id            | Public detail / admin draft configuration; template/windows frozen on activation             |
| GET/POST /api/challenges/:id/submissions | Public ranked entries / {publicationId}; one immutable entry per user                        |
| POST/DELETE /api/challenges/:id/votes    | {submissionId}; voting window, no self-votes                                                 |
| GET /api/creators/:id                    | Safe display name and public publications                                                    |
| GET /api/config                          | Capability booleans only; no credential values                                               |

Conflict response 409 REVISION_CONFLICT never overwrites newer data. Forbidden/not-found assets rejected during save/publish/remix. Durable unique indexes enforce request keys, submissions and votes. Public counts are actual database counts, never fixtures.

Google OAuth uses `POST /api/auth/sign-in/social` with `{provider:"google",callbackURL:"/dashboard",errorCallbackURL:"/login?error=google"}` through the Better Auth client. Callback: `/api/auth/callback/google`. Better Auth owns state and token exchange. `/api/config` includes the safe boolean `googleAuth`; no client secret or credential values are exposed.

`GET /api/dashboard` is authenticated and owner-scoped. Returns actual counts of nondeleted private projects, ready owned assets, immutable publications, active and attention-required generation jobs; the most recently edited nondeleted project; and up to five generation jobs prioritized by active/attention state and update time. It does not submit or reconcile paid jobs. Private job responses exclude provider credentials and signed URLs.

`GET /api/projects` additionally accepts `search` (literal title substring, max 80 characters), `category` (known category), and `sort` (`recent`, `oldest`, `title`). Returns `{items,total,hasNext}` using the same ownership and soft-deletion filter for list and total. Dashboard pages request six projects; existing clients retain the default bounded pagination. Unsupported filters return validation errors.

## Community preview/member boundary (current product policy)

The original public-full-view contract is superseded by this user-requested access split. Both URL sets stay shareable; cookie sessions determine preview vs full content server-side. Responses use `preview: true|false` and `Cache-Control: private, no-store` with `Vary: Cookie`.

- Anonymous `GET /api/designs` and `GET /api/challenges`: first three summaries only, regardless of requested page. No full-list pagination; `hasNext:false`. Design summaries use explicit fields and descriptions up to 160 characters. Challenge summaries omit rules, starting-room/template details and entries.
- Anonymous `GET /api/designs/:id`: cover, creator, category/title and short description only. No scene JSON, asset IDs/model delivery URLs, private project reference or transforms. `assets:[]`.
- Anonymous `GET /api/challenges/:id`: active challenge title, short theme, phase and schedule only. Drafts stay private. Full rules, pinned room, entries and voting require sign-in.
- `GET /api/challenges/:id/submissions`: authentication required for reads as well as writes (401 for guests).
- Signed-in members: full paginated lists, immutable published scenes with renderable referenced assets, allowed remix, full active-challenge brief/template/entries. Voting/submission permissions and windows are unchanged. An account never grants access to someone else’s private drafts.
- Creator previews list at most three safe publication summaries for guests; signed-in creator profiles show up to 24 recent publications.
- Auth entry links use `next` with a safe internal-path allowlist. Email signup/signin and Google OAuth return to the chosen space/challenge. External/protocol-relative or unrecognized destinations fall back to `/dashboard`. Confirmation passwords remain client-only.

## Recovery and permission additions (November 17)

- `POST /api/assets/:id/allow-remix`: authenticated owner-only, matching Origin, strict `{rightsConfirmed:true}`; ready asset required; enables `allowReuse` and returns `{id,allowReuse:true}`. Cross-user requests return 404. Permission is additive; existing publications/remixes are not invalidated. Rate limit 20/minute per account.
- `POST /api/generations/:id/retry-transfer`: authenticated owner-only, matching Origin, no request body; confirmed provider task required, recoverable state and no active lease. Resets delivery recovery limits, then reconciles that same task. Rate limit 6/minute. Never creates a paid task. Unavailable/busy returns 409.
- Generation responses include safe `stage`, `failure` (code/stage/retryable/time/reference), bounded `failureHistory`, `nextPollAt` and retry counters when present. They omit upload checkpoints, lease tokens/expiry, request hash and active-slot bookkeeping. No signed provider output URLs. Dashboard uses its existing explicit safe field projection.
- `GET /api/health`: unauthenticated database/index readiness; 200 `{status:"ok"}` or safe 503 `{status:"unavailable"}`. No secrets or database details.
- Scheduled `npm run jobs:reconcile` is a server CLI, not a public API. At most ten due jobs per run; five-minute leases; exponential recovery backoff capped at fifteen minutes; eight failures or permanent errors pause automatic recovery.
