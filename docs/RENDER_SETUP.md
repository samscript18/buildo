# Deploy Buildo to Render

Prepared November 17, 2026. No Render deployment or public HTTPS check has been performed. The default `render.yaml` provisions one free Node web service. Optional `render-paid.yaml` provisions a paid web service and scheduled recovery job; review Render's displayed charges before using it. MongoDB and Cloudinary remain external providers.

## 1. Connect the repository

Push the verified commits to GitHub. In Render, choose **New → Blueprint**, connect `samscript18/buildo`, select `main`, and use root `render.yaml`. For your free instance, deploy only `buildo`. If you already created it manually, keep that service and update its commands below; you do not need to create another Blueprint service. This application requires a Node **Web Service** because it uses authentication and server APIs.

The default Blueprint uses `plan: free` and disables automatic deployment. The optional paid Blueprint uses `1c-2g` instances; deploy both paid services after future releases so their recovery code stays in sync. `.node-version` pins the locally tested Node version, 26.4.0. Render provisioning of that version remains a deployment check.

## 2. Configure environment variables

Enter secrets directly into Render's Environment settings from your ignored `.env.local`. Keep your existing `BETTER_AUTH_SECRET` when using the existing database. Do not commit or paste secret values into reports.

| Web service variable    | Value/source                                                               |
| ----------------------- | -------------------------------------------------------------------------- |
| `MONGODB_URI`           | Existing MongoDB database connection string                                |
| `BETTER_AUTH_SECRET`    | Existing local secret, or `openssl rand -base64 32` for a new installation |
| `BETTER_AUTH_URL`       | Actual final HTTPS Render/custom-domain origin, no path                    |
| `SITE_URL`              | Same final HTTPS origin, used during build and runtime                     |
| `CLOUDINARY_CLOUD_NAME` | Existing Cloudinary account                                                |
| `CLOUDINARY_API_KEY`    | Existing server API key                                                    |
| `CLOUDINARY_API_SECRET` | Existing server API secret                                                 |
| `LUX3D_API_KEY`         | Existing Aholo credential                                                  |
| `LUX3D_DOWNLOAD_HOSTS`  | `qhsmodel.kujiale.com`, the observed genuine GLB host                      |
| `GOOGLE_CLIENT_ID`      | Add manually if enabling Google sign-in                                    |
| `GOOGLE_CLIENT_SECRET`  | Add manually if enabling Google sign-in                                    |

Only the optional paid Blueprint references the web service's MongoDB, Cloudinary and Lux3D variables from a recovery job; that job needs no authentication secret. Google variables are optional and omitted from the Blueprint prompts. Render supplies `PORT`; do not hardcode a local port.

Use the hostname Render actually assigns, not an assumed `buildo.onrender.com`. If it is assigned after initial creation, update both URL variables and deploy again before testing authentication or SEO. Change these values again when switching to a custom domain.

## 3. Allow database connections

For **each service**, open **Connect → Outbound** in Render and copy its outbound CIDR ranges. Add them under MongoDB Atlas **Network Access → IP Access List**. The MongoDB user must have read/write and index creation permission on the application database. Use the same database for the web service and worker. Atlas connectivity and index creation must succeed before opening traffic.

## 4. Check web-service commands

| Setting      | Exact value                                         |
| ------------ | --------------------------------------------------- |
| Build        | `npm ci --include=dev && npm run build`             |
| Pre-deploy   | Leave blank; unavailable on Free                    |
| Start        | `npm run db:indexes:hosted && npm run start:render` |
| Health check | `/api/health`                                       |

Free instances cannot use Render's pre-deploy command. Run the idempotent index command as part of **Start Command**, before launching Next.js. `&&` ensures a database/index failure stops startup instead of opening traffic. This command works with the existing scripts; no application-code upgrade is required. Do not put secrets in the command.

The start script binds `0.0.0.0` and honors Render's `PORT`. Dev dependencies are installed intentionally: the index and worker commands use `tsx`. The health endpoint returns 200 after database/index initialization, or a safe 503 without connection details. Models and covers live in Cloudinary; projects and recovery checkpoints live in MongoDB. No persistent disk is required.

## 5. Configure Google

In Google Cloud Console, open the OAuth **Web application** client. Add your exact HTTPS origin as an authorized JavaScript origin and add:

```text
https://YOUR-ACTUAL-HOST/api/auth/callback/google
```

as an authorized redirect URI. Keep localhost entries if you still develop locally. Configure consent-screen publishing/test-user access as appropriate for your Google project. Save Render's two Google secrets and redeploy. Test in regular Chrome, where Google permits interactive authentication.

## 6. Generation recovery on Free and optional paid cron

Render cron jobs do not have a free instance. The default free Blueprint does not create one. Keep the studio open while generating: its status polling reconciles the existing job and transfers the model. After a restart or closing the page, reopen the studio and refresh the job status. There is **no unattended completion guarantee** with only the free web service. Alternatively run the local recovery command below with your configured `.env.local`.

Free web services spin down after 15 minutes without inbound traffic and can take about a minute to wake. Scenes/checkpoints remain in MongoDB and uploaded models remain in Cloudinary, but unfinished provider output URLs may expire before the next recovery attempt. Free memory/CPU capacity for model transfer is deployment-unverified.

For scheduled recovery, use the optional **paid** `render-paid.yaml` or add a paid cron service separately. The following instructions apply only when that recovery service is configured:

The recovery service uses schedule `* * * * *` (every minute, UTC), build `npm ci --include=dev`, and start `npm run jobs:reconcile`. Each run processes at most ten due jobs serially, respects backoff and persisted leases, and exits. It can query an existing confirmed provider task and finish its delivery; it cannot submit a generation.

A persisted Cloudinary checkpoint skips re-downloading/re-uploading and verifies the stored model. Transient errors use exponential backoff, capped at 15 minutes; eight failures pause automatic recovery. The owner can use **Retry delivery** after fixing the cause. Configuration/format errors pause immediately. Uncertain paid submissions remain operator-reviewed and are never automatically recreated.

Render permits one active run per cron job and delays a scheduled run while one is active. **Trigger Run** cancels an active run, so use it only when no run is active. Check Runs logs for safe job IDs/states. A killed process leaves a five-minute lease and retained checkpoint for the next eligible run.

## 7. Verify the deployed app

1. Open `https://YOUR-ACTUAL-HOST/api/health`; expect HTTP 200 and `status: "ok"`.
2. Register/sign in and test Google in regular Chrome. Verify HTTPS session cookies and owner-only project access.
3. Open the existing bedroom. Check all three genuine models, move/save/reopen, preview and wallpaper. Confirm Cloudinary requests succeed in the browser with correct textures.
4. Publish with a captured cover, open the share link as a guest and then as another signed-in account, and remix. Confirm attribution and that private edits leave the published snapshot unchanged.
5. Open the configured challenge. Any signed-in account can start and submit during its submission window. Voting opens afterward; self-votes are rejected. Do not change real event windows merely to test results; automated isolated tests cover those transitions.
6. For a new **explicitly authorized** generation on Free, keep the studio open and confirm the existing job reaches ready. If using the optional paid cron, also close the studio after submission and confirm the worker completes it. Do not generate again just to retry delivery. Existing-model/checkpoint checks require no new generation credits.
7. Check `/robots.txt`, `/sitemap.xml`, `/opengraph-image`, canonical URLs and private noindex pages using the actual origin.
8. Record the public URL, observed worker runs and actual browser results in `docs/DEPLOYMENT.md`. Until then deployment remains unverified.

## Local commands

```bash
npm ci
cp .env.example .env.local
# Populate .env.local locally; never overwrite an already configured file.
npm run db:indexes
npm run dev
```

For an existing checkout with configured secrets, skip the copy step. To run one recovery pass locally:

```bash
node --env-file=.env.local --conditions=react-server --import tsx scripts/reconcile-generations.ts
```

Official references checked: [Free service limits](https://render.com/docs/free), [pre-deploy availability](https://render.com/docs/deploys#pre-deploy-command), [Next.js on Render](https://render.com/docs/deploy-nextjs-app), [Blueprint specification](https://render.com/docs/blueprint-spec), [cron jobs](https://render.com/docs/cronjobs), [outbound IP ranges](https://render.com/docs/outbound-ip-addresses), [Node version selection](https://render.com/docs/node-version).

## November 18 storage fix for the current deployment

Your host is `https://buildo-7rsf.onrender.com`. Set `SITE_URL` and `BETTER_AUTH_URL` to that origin on Render, retaining localhost values only in local development. Deploy the latest pushed fix. No additional secret or paid instance is required for automatic texture preparation: its default raw upload cap matches the observed 10 MiB Cloudinary limit. Do not increase it to 25 MiB unless Cloudinary actually allows that upload size. A recovered model already in the shared database is available after refreshing even before deployment; **future uploads require the updated release**.

After deployment, `/api/health` returns `release` containing the first twelve characters of the deployed git commit. Compare it with the intended GitHub commit. Check the recovered vase in Assets and add it to the studio; Buildo does not automatically alter an existing saved room when a job becomes ready.
