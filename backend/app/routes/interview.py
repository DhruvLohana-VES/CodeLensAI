from fastapi import APIRouter, HTTPException

from app.schemas.interview_schemas import (
    InterviewStartRequest,
    InterviewStartResponse,
    AnswerSubmissionRequest,
    AnswerSubmissionResponse,
)
from app.schemas.resume_schemas import ErrorResponse
from app.services.interview_service import InterviewService

router = APIRouter(prefix="/interview", tags=["Interview"])
service = InterviewService()


@router.post(
    "/start",
    summary="Start a new interview session",
    description="Initiates an interactive AI placement mock interview for a specific role category.",
    response_model=InterviewStartResponse,
    responses={
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
)
async def start_interview(payload: InterviewStartRequest) -> InterviewStartResponse:
    try:
        return service.start_interview(payload.role)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail={"success": False, "error": "start_error", "details": str(exc)},
        ) from exc


@router.post(
    "/submit",
    summary="Submit an answer",
    description="Submits the candidate's answer for grading, receives feedback, and gets the next question.",
    response_model=AnswerSubmissionResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid session or payload"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
)
async def submit_answer(payload: AnswerSubmissionRequest) -> AnswerSubmissionResponse:
    try:
        return service.submit_answer(payload.session_id, payload.answer)
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail={"success": False, "error": "invalid_request", "details": str(exc)},
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail={"success": False, "error": "submit_error", "details": str(exc)},
        ) from exc
