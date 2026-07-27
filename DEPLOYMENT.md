# Production Deployment Guide

This guide details instructions for deploying CodeLens AI to production hosting providers.

---

## 🌐 Frontend Deployment: Vercel

The React/Next.js frontend is fully optimized for deployment on Vercel.

### Step-by-Step Settings
1. Go to the [Vercel Dashboard](https://vercel.com) and click **Add New** > **Project**.
2. Import the `CodeLensAI` repository.
3. Configure the Root Directory to **`frontend`**.
4. Configure Build and Development Settings:
   - **Framework Preset**: `Next.js`
   - **Build Command**: `next build`
   - **Install Command**: `npm install`
5. Configure Environment Variables:
   - Add **`NEXT_PUBLIC_API_URL`**: Set this to the production URL of your backend (e.g. `https://codelens-backend.up.railway.app`). Do not add a trailing slash.
6. Click **Deploy**. Vercel will build the production static files and serve the application serverlessly.

---

## ⚡ Backend Deployment: Railway or Render

The FastAPI backend runs as a continuous Docker or Python service. It is recommended to deploy it on Render or Railway, utilizing a persistent disk volume to ensure the SQLite database (`codelens.db`) is not wiped during rebuilds.

### Option A: Railway (Recommended)
1. In the [Railway Console](https://railway.app), click **New Project** > **Deploy from GitHub**.
2. Select your repository.
3. In the project settings, set the root directory to **`backend`**.
4. Configure Environment Variables (variables matching the table below).
5. **Set up persistent storage**:
   - Go to the **Volumes** tab of your backend service.
   - Click **Add Volume** (size: 1GB or more).
   - Mount the volume path to: `/app/data` or update the database path to locate the database inside a persistent partition.
6. Set the **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}`.

### Option B: Render
1. In the [Render Dashboard](https://render.com), click **New** > **Web Service**.
2. Connect your GitHub repository.
3. Configure Service settings:
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python -m uvicorn app.main:app --host 0.0.0.0 --port 10000`
4. Set up Environment Variables.
5. In the **Advanced** tab:
   - Add a **Disk Volume** (Name: `db-volume`, Mount Path: `/app/data`).
   - Add an environment variable **`DATABASE_PATH`** = `/app/data/codelens.db` (and modify the database setup logic to verify paths if overriding, or default to standard root folder storage).

---

## 🔑 Production Environment Checklist

### Backend Env Vars
| Variable | Value | Description |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | `AIzaSy...` | Your production Google AI API key |
| `LOG_LEVEL` | `INFO` / `WARNING` | Minimize debug logs in production |
| `PORT` | `8000` / `10000` | Port injected by Render/Railway |
| `ALLOWED_ORIGINS` | `https://codelens-ai.vercel.app` | Comma-separated list of allowed frontend domains for CORS |

### Frontend Env Vars
| Variable | Value | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `https://your-backend-url.com` | Base API target URL |

---

## 🗄 Database Initialization in Production

On backend startup, the FastAPI server lifespan hook automatically runs the database migrations:
1. It creates `codelens.db` in the workspace root path (or database volume if specified).
2. It generates tables: `resumes`, `roadmaps`, `interviews`, and `interview_messages`.
3. It performs checks to migrate missing columns like `created_at` or `overall_score` on legacy records.

No manual schema execution or `sqlite3` setup is required on your servers.

---

## 🏁 Pre-Launch Checklist
- [ ] Backend health check responds `{"status": "healthy"}` at `/health`.
- [ ] CORS errors are not triggered in browser console when sending requests between frontend and backend.
- [ ] Gemini API key is loaded and not running in fallback mode on production servers.
- [ ] PDF resume uploads parse successfully and do not trigger payload size limitations (max size is capped at 10MB).
