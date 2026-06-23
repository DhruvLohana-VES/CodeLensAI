**Operating Guide**

This document explains how to run and operate the project folders (backend and frontend).

**Backend**:
- **Location**: [backend](backend)
- **Purpose**: FastAPI server that exposes resume upload and extraction endpoints.
- **Activate virtualenv (PowerShell)**: `.\venv\Scripts\Activate.ps1`
- **Activate virtualenv (cmd)**: `.\venv\Scripts\activate.bat`
- **Install dependencies**:
```
python -m pip install -r requirements.txt
```
- **Run (development)**:
```
# Option A — activate the backend venv, change into the backend folder, then run uvicorn
Set-Location "C:\Users\Dhruv Lohana\Desktop\CodeLensAI\backend"
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload

# Option B — use the provided helper to open frontend and backend dev servers
Set-Location "C:\Users\Dhruv Lohana\Desktop\CodeLensAI"
.\run-dev.ps1
```
- **Docs / OpenAPI**: http://127.0.0.1:8000/docs and http://127.0.0.1:8000/openapi.json
- **Main endpoint**: `POST /api/v1/resume/upload` — multipart form with `file` field (PDF only).
- **Example curl**:
```
curl -X POST "http://127.0.0.1:8000/api/v1/resume/upload" \
  -F "file=@/full/path/to/resume.pdf" \
  -H "Accept: application/json"
```
- **Notes / troubleshooting**:
  - Ensure `PyMuPDF` (package name `PyMuPDF`, import as `fitz`) is installed (it's listed in `requirements.txt`).
  - If `uvicorn` is "No module named uvicorn", use the venv python to install dependencies or run with `python -m uvicorn`.
  - If the frontend runs on a different origin (e.g., `localhost:3000`), CORS middleware has been added to `app/main.py` to allow local dev at `http://localhost:3000`.
  - Visiting `GET /` now redirects to the OpenAPI docs at `/docs`.

**Frontend**:
- **Location**: [frontend](frontend)
- **Purpose**: Next.js app (React) with dashboard and resume UI.
- **Install**:
```
npm install
```
- **Run (dev)**:
```
npm run dev
```
- **Build / Start**:
```
npm run build
npm run start
```
- **Notes**:
  - Default Next dev port: `3000`.
  - Frontend calls the backend at `/api/v1/...`. Confirm `frontend` code (services) points to the correct backend URL when running locally.

**Project structure (high level)**:
- `backend/` — FastAPI app, see `app/` for routes, services, schemas, and utils (PDF extractor).
- `frontend/` — Next.js app, UI components under `app/` and `components/`; client-side services in `services/`.

**Quick checklist**:
- Activate backend venv → install deps → run uvicorn on port 8000.
- Start frontend dev server → open http://localhost:3000 and confirm UI calls backend on port 8000.

If you want, I can:
- add a simple `GET /` health route or redirect to `/docs` in `backend/app/main.py`;
- add CORS middleware configured for the frontend origin;
- add a small Postman/Insomnia collection or sample requests file.
