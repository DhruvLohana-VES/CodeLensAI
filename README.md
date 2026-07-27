# CodeLens AI: AI-Powered Placement & Resume Intelligence Platform

CodeLens AI is a production-level placement readiness and mock interview evaluation platform. It helps students, career services, and recruiters calibrate technical talent through structured resume intelligence, adaptive AI coding challenges, sandboxed execution, and interactive interview feedback.

## 📋 Table of Contents
- [Problem Statement](#-problem-statement)
- [Solution](#-solution)
- [Key Features](#-key-features)
- [Architecture & Flow](#-architecture--flow)
- [Technology Stack](#-technology-stack)
- [Project Folder Structure](#-project-folder-structure)
- [Getting Started & Running Locally](#-getting-started--running-locally)
- [Environment Variables](#-environment-variables)
- [API Route Overview](#-api-route-overview)
- [Deployment Guide](#-deployment-guide)
- [Future Enhancements](#-future-enhancements)
- [License](#-license)

---

## 🔍 Problem Statement
Students preparing for engineering placements often face a "feedback vacuum." They submit resumes without knowing if they meet recruiting keywords, study generic curriculums that don't match their gaps, and walk into coding interviews without prior practice in structured technical communication. Recruiters and career services lack rapid, dynamic signals to evaluate cohort placement readiness.

## 💡 Solution
CodeLens AI solves this by building an end-to-end evaluation pipeline:
1. **Resume Parsing & Intelligence**: Extracts text, segments experiences, grades achievements, and generates a candidate readiness score.
2. **Technical Gaps Mapping**: Evaluates candidates through mock questions and automatically categorizes topics into Strong, Moderate, and Weak areas.
3. **Adaptive Roadmaps**: Tailors a 4-week study curriculum focused on repairing critical skill gaps.
4. **Sandboxed Coding Workspace**: Provides a secure editor where users can compile Python/JavaScript code and receive structural design feedback from AI.

---

## ✨ Key Features
- **Dynamic Placement Dashboard**: Tracks readiness indicators, recent mocks, and weekly study plan progress concurrently with fault-tolerant fetching.
- **Resume Extraction**: Uploads PDF resumes and extracts profile metadata, tech stacks, and readiness ratings.
- **AI Interview Engine**: Conducts interactive, multi-turn mock technical interviews with structured question pools.
- **Auto-Grading & Evaluations**: Scores responses dynamically and provides comprehensive explanations on complex topics.
- **Weakness Detection**: Identifies technical gaps across projects and logs category averages.
- **Interactive Coding Canvas**: Integrated sandbox to write, run, and optimize algorithms.
- **PDF Export**: Print-ready, optimized stylesheets to export Weakness Reports and weekly Study Roadmaps.
- **Responsive Layout**: Dark-theme visual aesthetics optimized for Mobile, Tablet, Laptop, and Desktop.

---

## 🏗 Architecture & Flow
```
[Frontend - Next.js]
        ↓  (Concurrent Fetch via Promise.allSettled)
[Backend - FastAPI]
        ↓
  +-----+-------------------+---------------------+
  |                         |                     |
[Resume Engine]    [Interview Engine]   [Evaluation Engine]
  |                         |                     |
  v                         v                     v
[Gemini LLM SDK]    [SQLite Database]    [Sandboxed Code Exec]
```
For deep architecture specifications, see [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## 🛠 Technology Stack
### Frontend
- **Framework**: Next.js 16 (React 19, TypeScript)
- **Styling**: Tailwind CSS v4, Lucide Icons, Glassmorphism design tokens
- **Build Tool**: Webpack / Next Compiler

### Backend
- **Core**: FastAPI (Python 3.11+)
- **Parser**: PyMuPDF (fitz) for resume PDF text extraction
- **Database**: SQLite (SQLAlchemy & sqlite3 with transaction management)
- **AI Integration**: Google Generative AI SDK (`gemini-2.5-flash` model for structured JSON generation and fallback rules)
- **Runtime**: Uvicorn ASGI server

---

## 📂 Project Folder Structure
```
CodeLensAI/
├── backend/
│   ├── app/
│   │   ├── routes/          # REST Endpoint handlers (resume, interviews, analytics, etc)
│   │   ├── schemas/         # Pydantic models for validation
│   │   ├── services/        # Business logic & LLM prompt orchestration
│   │   └── utils/           # DB connections, PDF parser, and text helpers
│   ├── tests/               # Python unit tests (unittest discover)
│   ├── requirements.txt     # Backend python dependencies
│   └── start.cmd            # Windows backend local runner script
├── frontend/
│   ├── app/                 # Next.js app router structure
│   ├── components/          # Reusable UI widgets (Timeline, Cards, Skeletons, Layouts)
│   ├── constants/           # Mock fallbacks and navigation definitions
│   ├── hooks/               # Custom React hooks (toast alerts, file handlers)
│   ├── services/            # Client-side API fetchers
│   └── package.json         # Frontend configuration
├── ARCHITECTURE.md          # System architecture design documentation
├── DEPLOYMENT.md            # Step-by-step deployment instructions
└── OPERATING.md             # Development environment launch guide
```

---

## 🚀 Getting Started & Running Locally

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- Gemini API Key (Generate one via Google AI Studio)

### Step 1: Clone and Set Up Backend
```bash
cd backend
python -m venv venv
# On Windows (cmd):
venv\Scripts\activate.bat
# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file in the `backend` folder:
```env
GEMINI_API_KEY=your_gemini_api_key_here
LOG_LEVEL=INFO
PORT=8000
```

Start the backend:
```bash
python -m uvicorn app.main:app --port 8000 --reload
```

### Step 2: Set Up Frontend
```bash
cd ../frontend
npm install
```

Create a `.env` file in the `frontend` folder:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Start the frontend server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application dashboard.

---

## 🔑 Environment Variables

### Backend
| Variable | Description | Default | Required |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | Google Generative AI access key | None | Yes (Fallback mode active if missing) |
| `LOG_LEVEL` | Logging verbosity (DEBUG/INFO/WARNING) | `INFO` | No |
| `PORT` | FastAPI local binding port | `8000` | No |

### Frontend
| Variable | Description | Default | Required |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Base endpoint path for backend routing | `http://localhost:8000` | Yes |

---

## ⚡ API Route Overview
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/resume/upload` | Uploads PDF resume and parses structured analysis |
| `GET` | `/api/v1/resume/latest` | Fetches parsed resume metrics for the latest candidate |
| `POST` | `/api/v1/interview/start` | Creates a new mock session for a specific track (Frontend/Backend) |
| `POST` | `/api/v1/interview/submit` | Submits answers and generates score grading feedback |
| `GET` | `/api/v1/interviews/history` | Fetches paginated past interview mock scores |
| `GET` | `/api/v1/analytics` | Calculates overall preparation scores and topic-wise metrics |
| `GET` | `/api/v1/weakness-analysis` | Fetches strong, moderate, and weak technical topics mapping |
| `GET` | `/api/v1/roadmap` | Generates a weekly 4-week study curriculum |

---

## 🛠 Deployment Guide
For complete cloud deployment checklists (Vercel, Railway, Render, SQLite setup), refer to [DEPLOYMENT.md](./DEPLOYMENT.md).

---

## 🔮 Future Enhancements
- **Multi-lingual Resume Parsing**: Support for CVs written in non-English layouts.
- **OAuth Login**: Support for student portal credentials and cohort segregation.
- **Custom Question Templates**: Ability for placement officers to upload custom technical question banks.

---

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
