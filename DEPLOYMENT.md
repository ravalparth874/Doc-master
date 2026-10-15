# Deployment guide

DOC Master ships as **one service**: FastAPI serves `/api/*` and the pre-rendered React
frontend from the same process, so there is no second server to configure.

You can also split it across two providers, which is what most people end up doing:
the static frontend on **Vercel** and the API on **Render**.

Pick one of the options below.

- [Vercel + Render (split hosting)](#1-vercel--render-split-hosting)
- [Render (all in one)](#2-render)
- [Railway](#3-railway)
- [VPS with Nginx and HTTPS](#4-vps-nginx--certbot)
- [Environment variables](#environment-variables)
- [Upload size limits](#upload-size-limits)
- [After deploying](#after-deploying)

---

## 1. Vercel + Render (split hosting)

Two projects, one repository. The frontend is static, so Vercel's free plan is
enough; the API needs a Python runtime, so Render's free plan works for documents up to
about 10 MB (use `starter` for bigger files).

### 1.1 Push the API to Render first

The frontend needs the API URL at build time, so deploy the backend before the frontend.

1. Push the repository to GitHub.
2. In Render choose **New → Blueprint** and select the repository. Render reads
   `render.yaml` and builds `Dockerfile.backend`, an API only image.
3. Fill in the environment variables Render marked as `sync: false`:
   - `ALLOWED_ORIGINS` - leave empty for now, you will add the Vercel domain in step 1.3.
   - `ALLOWED_ORIGIN_REGEX` - optional, see below.
   - `SITE_URL` - the Render URL of the API, for example
     `https://doc-master-api.onrender.com`. Only used for analytics defaults here.
   - `ANALYTICS_ID` - leave empty to collect nothing.
4. Deploy. The first build takes about two minutes. When the deploy is green:
   ```bash
   curl https://doc-master-api.onrender.com/api/health
   # {"status":"ok","service":"DOC Master","version":"1.0.0"}
   ```

### 1.2 Deploy the frontend to Vercel

1. In Vercel choose **Add New → Project** and import the same repository.
2. Set **Root Directory** to `frontend`. This is the important step: the
   `vercel.json` in that folder is what configures the build, the SPA rewrites and
   the cache headers.
3. Add these environment variables (Settings → Environment Variables):
   | Variable | Value |
   | --- | --- |
   | `VITE_API_URL` | `https://doc-master-api.onrender.com` (no trailing slash) |
   | `VITE_SITE_URL` | `https://your-domain.com` (or the `*.vercel.app` URL at first) |
   | `VITE_ANALYTICS_ID` | empty, `G-XXXXXXXXXX` or your Plausible domain |
4. Deploy. The build runs `npm run build`, which type-checks, builds the bundle and
   pre-renders all 12 routes to static HTML.
5. Verify: `https://your-project.vercel.app/merge-pdf` shows real content in
   **View Source**, and the canonical tag contains your Vercel domain.

### 1.3 Point the API at the Vercel origin Any deploy (even a manual
one) applies it immediately.

| Situation | Value |
| --- | --- |
| Only the production Vercel URL calls the API | `ALLOWED_ORIGINS=https://your-domain.com` |
| You also deploy Vercel previews (every push gets a new URL) | `ALLOWED_ORIGIN_REGEX=https://your-project.*\.vercel\.app` |
| You do not care who calls the public API | `ALLOWED_ORIGINS=*` |

Without this step the browser blocks the upload with a CORS error in the console and
the tool never runs.

Test the result by opening the frontend and processing a file.

> **Free tier cold starts.** Render's free plan sleeps after about 15 minutes of
> inactivity, and the first request after that can take 30 to 60 seconds while the
> container boots. The upload will simply look slow. Use the `starter` plan, or a
> scheduled ping such as UptimeRobot against `/api/health`, to avoid it.

### 1.4 Add your own domain

1. Vercel: **Settings → Domains**, add `your-domain.com` and `www`. Point an `A` record
   at `76.76.21.21`, or a `CNAME` at `cname.vercel-dns.com`.
2. Render: **Settings → Domains**, add `api.your-domain.com` (only if you want a
   shorter API URL, then update `VITE_API_URL` and redeploy the frontend).

### How the split deployment behaves

| Concern | Where it is handled |
| --- | --- |
| Uploads go to `VITE_API_URL` | `frontend/src/api.ts` |
| Canonical URLs and social tags | `VITE_SITE_URL`, baked in at build time |
| `sitemap.xml` and `robots.txt` | generated from `routes.json` with the build origin |
| Analytics | injected by `frontend/src/lib/analytics.ts` from `VITE_ANALYTICS_ID` |
| SPA routing | `frontend/vercel.json` rewrites |
| Long-lived asset caching | `vercel.json` headers (`immutable` for `/assets`) |
| Security headers | `vercel.json` headers (nosniff, DENY, Referrer-Policy) |
| File processing, rate limits, CORS | Render |

---

## 2. Render (all in one)

`render.yaml` in the repository root is a Render Blueprint, so Render can do everything
for you.

**Automatic (Blueprint):**

1. Push the repository to GitHub.
2. In Render choose **New → Blueprint**, then select the repository. Render reads
   `render.yaml` and detects the Docker service.
3. Fill in the environment variables Render marked as `sync: false`:
   - `SITE_URL` - `https://your-domain.com`
   - `ALLOWED_ORIGINS` - `https://your-domain.com`
   - `ANALYTICS_ID` - leave empty if you do not want analytics.
4. Click **Apply**. The first build takes about four minutes (Node build, then Python
   runtime image).
5. When the deploy is green, open **Settings → Domains** and add your custom domain.
   Render provisions TLS automatically.

**Manual:**

1. **New → Web Service → Connect a repository**.
2. Environment: **Docker**, Dockerfile path `./Dockerfile` (the image that builds the
   frontend and serves it too; use `./Dockerfile.backend` for an API only service).
3. Health check path: `/api/health`.
4. Plan: `starter` for larger uploads. The free plan has 512 MB RAM and is fine for
   documents up to about 10 MB.

---

## 3. Railway

1. Install the CLI: `npm i -g @railway/cli`, then `railway login`.
2. From the repository root:
   ```bash
   railway init
   railway up
   ```
   Railway detects the `Dockerfile` and builds it automatically.
3. Add variables in the Railway dashboard (**Variables** tab), or locally:
   ```bash
   railway variables set \
     SITE_URL=https://your-domain.com \
     ALLOWED_ORIGINS=https://your-domain.com \
     MAX_FILE_MB=25
   ```
4. In **Settings → Networking**, click **Generate Domain**. HTTPS is automatic.
5. Railway health checks use the exposed port and the `Dockerfile` `HEALTHCHECK`, which
   calls `/api/health`.

---

## 4. VPS, Nginx and HTTPS (Certbot)

Works on any Ubuntu/Debian server: Hetzner, DigitalOcean, Linode, Lightsail.

### 4.1 Install Docker

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker "$USER" && newgrp docker
```

### 4.2 Get the code and run the container

```bash
git clone https://github.com/your-name/doc-master.git
cd doc-master

cat > .env <<'EOF'
PORT=8000
MAX_FILE_MB=25
MAX_TOTAL_MB=120
MAX_FILES=20
SITE_URL=https://your-domain.com
ALLOWED_ORIGINS=https://your-domain.com
RATE_LIMIT=20/minute
EOF

docker compose up -d --build
docker compose ps          # should show "healthy"
```

### 4.3 Nginx reverse proxy

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com;

    # Large uploads: keep this at or above MAX_TOTAL_MB.
    client_max_body_size 150m;
    client_body_timeout 300s;
    client_body_buffering on;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 5;
    gzip_min_length 800;
    gzip_types
        text/plain
        text/css
        text/javascript
        application/javascript
        application/json
        application/manifest+json
        image/svg+xml;

    # Hashed build assets can be cached forever.
    location /assets/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_valid 200 1y;
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 300s;
        proxy_request_buffering off;
    }
}
```

### 4.4 HTTPS with Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com \
    --redirect --agree-tos -m you@example.com --staging
# Remove --staging once the staging certificate validated successfully.
sudo certbot renew --dry-run
```

Certbot rewrites the Nginx config to redirect HTTP to HTTPS. The app then adds
`Strict-Transport-Security` because it sees `X-Forwarded-Proto: https`.

### 4.5 Keep it running

```bash
# automatic restarts are already handled by the restart policy in docker-compose.yml
sudo systemctl enable --now docker
```

---

## Environment variables

### Backend (Render)

| Variable | Required | Notes |
| --- | --- | --- |
| `SITE_URL` | no | Real origin of the site. Drives analytics defaults and, in single-service mode, canonical URLs. |
| `ALLOWED_ORIGINS` | **yes** | The frontend origin, or `*`. See [1.3](#13-point-the-api-at-the-vercel-origin). |
| `ALLOWED_ORIGIN_REGEX` | no | Regex for Vercel preview domains, e.g. `https://doc-master.*\.vercel\.app`. |
| `MAX_FILE_MB` | no | Default `25`. Raise it only if you also raise `MAX_TOTAL_MB` and the proxy limits. |
| `MAX_TOTAL_MB` | no | Default `120`. |
| `MAX_FILES` | no | Default `20`. |
| `RATE_LIMIT` | no | Default `20/minute`. Use `60/minute` or more on a shared server. |
| `ANALYTICS_ID` | no | `G-XXXXXXXXXX` for GA4, `your-domain.com` for Plausible, empty for none. |

### Frontend (Vercel, build time)

| Variable | Required | Notes |
| --- | --- | --- |
| `VITE_API_URL` | **yes** for split hosting | Full API origin, no trailing slash: `https://doc-master-api.onrender.com`. Leave empty for single-service mode. |
| `VITE_SITE_URL` | **yes** for split hosting | Public origin, used for canonical URLs, Open Graph tags and the sitemap. |
| `VITE_ANALYTICS_ID` | no | `G-XXXXXXXXXX` or your Plausible domain. Empty means no analytics. |

`backend/.env` and `frontend/.env` are read automatically for local development. Copy
the two `.env.example` files to get started.

---

## Upload size limits

The smallest limit wins, so raise them in this order:

1. `MAX_FILE_MB` and `MAX_TOTAL_MB` in your environment.
2. `client_max_body_size` in Nginx (set it to at least `MAX_TOTAL_MB`, plus margin).
3. The host limit. Some providers cap requests regardless of your own settings:

| Host | Default upload cap | How to raise it |
| --- | --- | --- |
| Render (free) | 100 MB request | Not configurable |
| Render (starter and up) | No extra cap | - |
| Railway | No extra cap | - |
| Vercel (frontend only, no uploads) | n/a | Uploads bypass Vercel and go straight to the API |
| Cloudflare proxy | **100 MB** free plan | DNS-only (grey cloud) for large uploads, or Business plan |
| Nginx | `client_max_body_size 1m` | Set it explicitly as shown above |
| Vercel / Netlify functions (not used here) | 4.5 MB | Not applicable, the API is not on a serverless function |

Practical note: `MAX_TOTAL_MB=120` with `MAX_FILE_MB=25` means merge jobs of up to 20
files work comfortably. Each worker holds the request in memory, so set
`MAX_TOTAL_MB` to roughly half the RAM you give the container.

---

## After deploying

1. `curl https://your-api-host/api/health` should return
   `{"status":"ok","service":"DOC Master","version":"1.0.0"}`.
2. Open the frontend, pick **Merge PDF** and upload two files. If the browser console
   shows a CORS error, `ALLOWED_ORIGINS` does not match the frontend origin.
3. `https://your-site/robots.txt` exists and the sitemap URL uses your domain.
4. Fetch a tool page (`https://your-site/merge-pdf`) and check that **View Source**
   shows the full text and your domain in the canonical tag.
5. Run the checklist in [SEO_CHECKLIST.md](SEO_CHECKLIST.md).