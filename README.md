# DOC Master

**All your PDF tools in one place. Free, fast and private.**

DOC Master is a privacy-first online PDF toolkit for students, job seekers and small
businesses. Every document is processed **in memory only**: nothing is written to disk,
nothing is stored, and files disappear the moment you download the result.

![DOC Master home page](docs/screenshots/home.png)
![DOC Master merge tool](docs/screenshots/merge-pdf.png)
![DOC Master compress tool](docs/screenshots/compress-pdf.png)

> Replace the files above with real screenshots of `docs/screenshots/`. Drop any PNG or
> JPG named `home.png`, `merge-pdf.png` and `compress-pdf.png` into that folder.

---

## Features

| Tool | Route | What it does |
| --- | --- | --- |
| **Merge PDF** | `/merge-pdf` | Join multiple PDFs and reorder them with drag and drop or arrow buttons |
| **Split PDF** | `/split-pdf` | Keep a page range as a new PDF, or export every page into a ZIP |
| **Compress PDF** | `/compress-pdf` | Low / Medium / High levels plus **compress under 100 KB, 200 KB, 500 KB, 1 MB** presets |
| **Images to PDF** | `/images-to-pdf` | Combine JPG and PNG images into one PDF, with reordering and A4/Letter pages |
| **PDF to Images** | `/pdf-to-images` | Export every page as JPG or PNG, delivered in a ZIP |
| **Rotate PDF** | `/rotate-pdf` | Rotate all pages or a selection such as `1,3-5` by 90, 180 or 270 degrees |
| **Protect PDF** | `/protect-pdf` | Add an AES-256 password, or remove one you know |

Plus:

- **No signup, no watermark, no file limits.**
- **Files are never stored** - uploads are read into RAM, processed and released.
- **Mobile first** with a layout that works on a phone.
- **Dark mode** that follows the system and remembers your choice.
- **English, Hindi and Gujarati** with a language switcher.
- **Installable PWA** with an offline app shell.
- **SEO ready**: pre-rendered HTML, per-page metadata, JSON-LD, `sitemap.xml`, `robots.txt`.
- **Single service deployment**: FastAPI serves the API *and* the built frontend.

> **About the translations:** all interface text (navigation, buttons, form labels,
> option names, status and error messages, and the "Why DOC Master" cards) is fully
> translated into Hindi and Gujarati in `frontend/src/i18n/locales/`. The long-form
> explainer content on tool pages (how-to steps, benefits and the 300+ word FAQ blocks)
> stays in English on purpose: it is the copy that targets Google search, and keeping a
> single English canonical body avoids duplicate-content issues between language
> versions.

---

## Tech stack

- **Backend:** Python 3.11+, FastAPI, Uvicorn, pypdf, PyMuPDF, img2pdf, Pillow,
  python-multipart, slowapi, cryptography
- **Frontend:** React 18, Vite 6, TypeScript (strict), Tailwind CSS v4 (`@tailwindcss/vite`),
  React Router 6, i18next / react-i18next, react-helmet-async
- **Tooling:** pytest, Ruff, ESLint 9, Prettier, GitHub Actions

---

## Project structure

```
doc-master/
├── backend/
│   ├── app/
│   │   ├── main.py                 # app, middleware, error handlers, SPA serving
│   │   ├── config.py               # env-driven settings
│   │   ├── exceptions.py           # friendly error type
│   │   ├── rate_limit.py           # slowapi limiter
│   │   ├── routers/                # one module per tool + health + contact
│   │   └── services/
│   │       ├── pdf_service.py      # all PDF/image processing (in memory)
│   │       ├── uploads.py          # in-memory multipart parsing
│   │       └── validation.py       # magic bytes, sizes, page ranges
│   ├── tests/                      # pytest: merge, split, compress, tools
│   ├── requirements.txt
│   └── pyproject.toml              # ruff + pytest configuration
├── frontend/
│   ├── public/                     # favicons, manifest, service worker, robots, sitemap
│   ├── scripts/                    # sitemap generator + pre-renderer
│   ├── src/
│   │   ├── api.ts                  # typed API client with upload progress
│   │   ├── components/             # Layout, Header, Footer, Dropzone, FileList, ...
│   │   ├── hooks/                  # useFileList (add / remove / reorder)
│   │   ├── i18n/                   # en, hi, gu translations
│   │   ├── lib/                    # seo helpers, routes, theme, config
│   │   ├── pages/                  # Home, 7 tools, About, Privacy, Terms, Contact, 404
│   │   ├── router/                 # clientRoutes (lazy) + ssrRoutes (pre-render)
│   │   ├── App.tsx
│   │   ├── main.tsx                # browser entry
│   │   └── prerender.tsx           # build time HTML renderer
│   ├── routes.json                 # single source of truth for public routes
│   └── vite.config.ts
├── scripts/generate_icons.py       # regenerates every icon and the OG image
├── .github/workflows/ci.yml
├── Dockerfile                      # multi-stage: Node build -> Python runtime
├── docker-compose.yml
├── render.yaml
├── DEPLOYMENT.md
└── SEO_CHECKLIST.md
```

---

## Local setup

You need **Python 3.11+** and **Node.js 20+**.

### 1. Backend

```bash
cd backend

python -m venv .venv
# macOS / Linux
source .venv/bin/activate
# Windows PowerShell
.venv\Scripts\Activate.ps1

pip install -r requirements-dev.txt
cp .env.example .env      # Windows: copy .env.example .env
```

Start the API on <http://127.0.0.1:8000>:

```bash
python -m app.main
# or, with auto reload:
uvicorn app.main:app --reload --port 8000
```

Check it:

```bash
curl http://127.0.0.1:8000/api/health
```

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>. Vite proxies `/api` to the backend on port 8000, so
everything works exactly as it does in production.

---

## Scripts

### Backend

| Command | Description |
| --- | --- |
| `python -m app.main` | Run the API (and serve `frontend/dist` when it exists) |
| `uvicorn app.main:app --reload` | Run with auto reload |
| `pytest` | Run the test suite |
| `ruff check .` | Lint |
| `ruff format .` | Format |

### Frontend

| Command | Description |
| --- | --- |
| `npm run dev` | Dev server on port 5173 |
| `npm run build` | Type-check, build, build the SSR bundle and pre-render every route |
| `npm run preview` | Serve `dist` locally |
| `npm run typecheck` | `tsc --noEmit` for the app and the config |
| `npm run lint` | ESLint |
| `npm run format` | Prettier write |
| `npm run generate:assets` | Rebuild `robots.txt` and `sitemap.xml` from `routes.json` |

### Icons

```bash
python scripts/generate_icons.py
```

Regenerates `favicon.svg` companions, `favicon.ico`, `favicon-16x16.png`,
`favicon-32x32.png`, `apple-touch-icon.png`, the Android icons and `og-image.png`.

---

## How the privacy promise is kept

- Uploads are read with a custom in-memory multipart parser
  (`backend/app/services/uploads.py`) instead of Starlette's `UploadFile`, which spools
  anything above 1 MB to a temporary file on disk.
- Every PDF operation works on `bytes` objects and returns `bytes`
  (`backend/app/services/pdf_service.py`).
- No file names or file contents are ever written to the logs.
- ZIP archives are assembled in `BytesIO`, never written to disk.
- The static frontend is read from disk only for *application* files, never for uploads.

---

## Environment variables

See `.env.example` for the full list.

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `8000` | Port uvicorn binds to |
| `MAX_FILE_MB` | `25` | Maximum size of a single upload |
| `MAX_TOTAL_MB` | `120` | Maximum size of one request |
| `MAX_FILES` | `20` | Maximum number of files per request |
| `ALLOWED_ORIGINS` | `http://localhost:5173` | CORS origins, comma separated |
| `SITE_URL` | `https://docmaster.example` | Canonical origin, sitemap, analytics |
| `ANALYTICS_ID` | *(empty)* | `G-...` for GA4, or your domain for Plausible |
| `RATE_LIMIT` | `20/minute` | slowapi limit for API routes |
| `RATE_LIMIT_DISABLED` | `false` | Turn the limiter off (useful in tests) |
| `FRONTEND_DIST` | `frontend/dist` | Where the built frontend lives |

### Frontend (build time, baked into the bundle)

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | *(empty)* | Full origin of the API when it is hosted separately |
| `VITE_SITE_URL` | *(empty)* | Public origin for canonical URLs, sitemap and analytics |
| `VITE_ANALYTICS_ID` | *(empty)* | `G-...` for GA4, or your domain for Plausible |

`SITE_URL` is applied at **serve time** in single-service mode: pre-rendered HTML
contains a placeholder origin and the backend swaps it for your real domain. When the
frontend is on a separate host, set `VITE_SITE_URL` at build time instead.

---

## Deployment

```bash
docker compose up --build
# open http://localhost:8000
```

Or deploy the two halves separately, which is what most people do:

- **Frontend → Vercel** (static, free). Set the project **Root Directory** to
  `frontend`, then add `VITE_API_URL` and `VITE_SITE_URL` as environment variables.
- **Backend → Render** using `Dockerfile.backend`, with `ALLOWED_ORIGINS` pointing at
  the Vercel domain.

Step-by-step instructions, including the exact variable values and the CORS step that
people usually miss, are in [DEPLOYMENT.md](DEPLOYMENT.md). The SEO launch checklist is
in [SEO_CHECKLIST.md](SEO_CHECKLIST.md).

---

## Accessibility and quality

- Semantic HTML with one `<h1>` per page, real `<main>`, `<nav>` and `<footer>`.
- Full keyboard support, visible focus rings and ARIA labels on every control.
- Colour contrast meets WCAG AA in light and dark mode.
- `prefers-reduced-motion` is respected.
- TypeScript strict mode, ESLint and Prettier, Ruff for Python, type hints and docstrings
  throughout the backend.

---

## License

MIT. Use it, fork it, host it for your own community.