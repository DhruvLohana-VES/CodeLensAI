import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Configure basic logging level
log_level = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(level=getattr(logging, log_level, logging.INFO))
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Check Gemini API Key
if os.getenv("GEMINI_API_KEY"):
    logger.info("Gemini API key loaded successfully")
else:
    logger.warning("No Gemini API key found, using fallback mode")


from app.utils.db import init_db
from app.routes.resume import router as resume_router
from app.routes.interview import router as interview_router
from app.routes.code import router as code_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database schema
    init_db()
    yield

app = FastAPI(
    title="CodeLens AI Backend",
    version="0.2.0",
    lifespan=lifespan,
)

# CORS configuration supporting environment variable overrides
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
env_origins = os.getenv("ALLOWED_ORIGINS")
if env_origins:
    origins.extend([o.strip() for o in env_origins.split(",") if o.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", include_in_schema=False)
def root_redirect():
    """Redirect root to the OpenAPI docs for convenience."""
    return RedirectResponse(url="/docs")


@app.get("/health", tags=["System"])
def health_check():
    """Health check endpoint to verify backend status."""
    return {
        "status": "healthy",
        "version": app.version,
        "database": "connected",
        "gemini_api": "enabled" if os.getenv("GEMINI_API_KEY") else "disabled (fallback active)"
    }


app.include_router(resume_router, prefix="/api/v1")
app.include_router(interview_router, prefix="/api/v1")
app.include_router(code_router, prefix="/api/v1")

