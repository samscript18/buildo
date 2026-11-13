# API contracts

All domain endpoints use JSON except multipart asset import. Authenticated identity comes exclusively from Better Auth session cookies. Writes require matching Origin. Errors: `{error:{code,message,requestId,fields?}}`. Success is JSON; dates ISO, IDs strings. Lists use bounded page/limit. Scene schema in src/lib/scene.ts. 1MB JSON body maximum. All private identifiers are ownership checked.

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
