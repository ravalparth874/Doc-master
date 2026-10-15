# Deployment guide

DOC Master ships as **one service**: FastAPI serves `/api/*` and the pre-rendered React
frontend from the same process, so there is no second server to configure.

Pick one of the three options below.

- [Render](#1-render)
- [Railway](#2-railway)
- [VPS with Nginx and HTTPS](#3-vps-nginx--certbot)
- [Environment variables](#environment-variables)
- [Upload size limits](#upload-size-limits)
- [After deploying](#after-deploying)

---

## 1. Render

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
2. Environment: **Docker**, Dockerfile path `./Dockerfile`.
3. Health check path: `/api/health`.
4. Plan: `starter` for larger uploads. The free plan has 512 MB RAM and is fine for
   documents up to about 10 MB.

---

## 2. Railway

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

## 3. VPS, Nginx and HTTPS (Certbot)

Works on any Ubuntu/Debian server: Hetzner, DigitalOcean, Linode, Lightsail.

### 3.1 Install Docker

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker "$USER" && newgrp docker
```

### 3.2 Get the code and run the container

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

### 3.3 Nginx reverse proxy

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

### 3.4 HTTPS with Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com \
    --redirect --agree-tos -m you@example.com --staging
# Remove --staging once the staging certificate validated successfully.
sudo certbot renew --dry-run
```

Certbot rewrites the Nginx config to redirect HTTP to HTTPS. The app then adds
`Strict-Transport-Security` because it sees `X-Forwarded-Proto: https`.

### 3.5 Keep it running

```bash
# automatic restarts are already handled by the restart policy in docker-compose.yml
sudo systemctl enable --now docker
```

---

## Environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `SITE_URL` | **yes** | Real origin, no trailing slash. Drives canonical URLs, `sitemap.xml` and analytics. |
| `ALLOWED_ORIGINS` | **yes** | Same origin as `SITE_URL`. Only needed when the API is on another domain. |
| `MAX_FILE_MB` | no | Default `25`. Raise it only if you also raise `MAX_TOTAL_MB` and the proxy limits. |
| `MAX_TOTAL_MB` | no | Default `120`. |
| `MAX_FILES` | no | Default `20`. |
| `RATE_LIMIT` | no | Default `20/minute`. Use `60/minute` or more on a shared server. |
| `ANALYTICS_ID` | no | `G-XXXXXXXXXX` for GA4, `your-domain.com` for Plausible, empty for none. |
| `PORT` | no | Default `8000`. Render and Railway set their own. |

`backend/.env` is read automatically for local development.

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
| Cloudflare proxy | **100 MB** free plan | DNS-only (grey cloud) for large uploads, or Business plan |
| Nginx | `client_max_body_size 1m` | Set it explicitly as shown above |
| Vercel / Netlify (static only) | 4.5 MB functions | Not applicable, DOC Master does not run there |

Practical note: `MAX_TOTAL_MB=120` with `MAX_FILE_MB=25` means merge jobs of up to 20
files work comfortably. Each worker holds the request in memory, so set
`MAX_TOTAL_MB` to roughly half the RAM you give the container.

---

## After deploying

1. `curl https://your-domain.com/api/health` should return
   `{"status":"ok","service":"DOC Master","version":"1.0.0"}`.
2. Open `https://your-domain.com/robots.txt` and confirm the sitemap URL uses your domain.
3. Fetch a tool page (`https://your-domain.com/merge-pdf`) and check that the
   `View Source` output contains the full text and your domain in the canonical tag.
4. Run the checklist in [SEO_CHECKLIST.md](SEO_CHECKLIST.md).