# Blockers

Initial inspection: no .env.local and no user-supplied Lux3D asset.

Update 2026-11-13: local credentials are configured and passed preflight. The user submitted the one authorized generation in regular Chrome; task `7232531` completed and its genuine GLB is now stored in Cloudinary as ready asset `6af782945fc6d2fc20c801d4`. Delivered bytes match the source SHA-256. The actual GLB host `qhsmodel.kujiale.com` is configured locally in `LUX3D_DOWNLOAD_HOSTS`. No credential variable is currently missing for this path. Genuine Cloudinary browser delivery, textures, orientation, numeric transforms and exact MongoDB save/reload passed in a disposable test room. The user's original bedroom still needs the object placed and saved manually; it was not modified by that harness.

The real-account browser check paused before creating a project or submitting a generation: Google rejected the automated Chrome browser as unsupported. Use the normal Chrome/Safari application at `http://localhost:3000/login` for manual Google consent and callback verification. Do not bypass Google's browser checks or transfer browser sessions. The user has authorized one bedside-table generation only; no automatic resubmission is permitted.

- MongoDB: MONGODB_URI configured; connectivity verified. Real-account scene persistence still needs live verification.
- Authentication: BETTER_AUTH_SECRET and BETTER_AUTH_URL configured; real Google callback requires the normal-browser check above.
- Cloudinary: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET configured; actual 6,789,860-byte raw GLB upload and delivered hash verified.
- Lux3D: LUX3D_API_KEY configured; task `7232531` completed. Do not resubmit it.
- LUX3D_DOWNLOAD_HOSTS: exact observed GLB hostname configured; continue validating future output hosts rather than guessing or allowing arbitrary downloads.
- SpatialGen: no actual output or compatibility evidence; environment generation stays unavailable.
- No deployment target/domain or running-project footage. Final submission report must wait for actual screenshots and verified workflow.

Set secrets only in ignored .env.local. Never send them in chat. Continue independent implementation while these are unavailable.

## Current independent work

The fullstack code path, editor/community/challenge UI, isolated database tests, production build and isolated browser journey are implemented. See REQUIREMENTS_MATRIX.md and VERIFICATION.md. This does not remove the live blockers above. No real challenge, user activity, votes, provider generation, storage upload or deployment has been fabricated.

After an authenticated generation returns, the private generation job records `outputHost`. Review that exact provider storage hostname before adding it to `LUX3D_DOWNLOAD_HOSTS`, then refresh the transfer. Never add an arbitrary user-supplied host. Unknown paid creation requires operator reconciliation with the provider account; no automatic paid resubmission exists.

Google OAuth is implemented but real consent/callback verification requires `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, a configured Google consent screen and an exact authorized redirect URI: `<BETTER_AUTH_URL>/api/auth/callback/google`. Configure secrets locally and restart. The isolated test uses explicit dummy credentials solely to verify authorization URL and state construction, never a real Google identity or token exchange.

The original public full-view flow is intentionally superseded by the user-requested preview/member split: interactive room viewing and complete challenge details/entries now require an account. Public share URLs expose a limited preview before authentication. This is an implemented product-policy change, not a provider blocker.
