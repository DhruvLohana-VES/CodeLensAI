from fastapi import APIRouter, HTTPException, Query
from app.schemas.interview_schemas import (
    InterviewHistoryResponse,
    InterviewDetailsResponse,
    PaginationMetadata,
    InterviewHistoryItem,
    InterviewDetailSession,
    InterviewDetailQuestionItem,
)
from app.services.interview_service import InterviewService
from app.schemas.resume_schemas import ErrorResponse

router = APIRouter(prefix="/interviews", tags=["Interviews History & Details"])
service = InterviewService()

@router.get(
    "/history",
    summary="Get interview session history",
    description="Returns a paginated list of all interview sessions, newest first.",
    response_model=InterviewHistoryResponse,
    responses={
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
)
async def get_history(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
) -> InterviewHistoryResponse:
    try:
        interviews, total = service.get_history(page, limit)
        history_items = [
            InterviewHistoryItem(
                id=item["id"],
                mode=item["mode"],
                overall_score=item["overall_score"],
                created_at=item["created_at"],
            )
            for item in interviews
        ]
        return InterviewHistoryResponse(
            success=True,
            interviews=history_items,
            pagination=PaginationMetadata(page=page, limit=limit, total=total)
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail={"success": False, "error": "history_error", "details": str(exc)},
        ) from exc

@router.get(
    "/{interview_id}",
    summary="Get interview session details",
    description="Returns full metadata and all questions/answers with evaluations for a specific interview session.",
    response_model=InterviewDetailsResponse,
    responses={
        404: {"model": ErrorResponse, "description": "Session not found"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
)
async def get_details(interview_id: str) -> InterviewDetailsResponse:
    try:
        details = service.get_details(interview_id)
        session = details["interview"]
        questions = details["questions"]
        
        return InterviewDetailsResponse(
            success=True,
            interview=InterviewDetailSession(
                id=session["id"],
                mode=session["mode"],
                overall_score=session["overall_score"],
                created_at=session["created_at"]
            ),
            questions=[
                InterviewDetailQuestionItem(
                    id=q["id"],
                    question=q["question"],
                    answer=q["answer"],
                    score=q["score"],
                    feedback=q["feedback"],
                    topic=q["topic"],
                    created_at=q["created_at"]
                )
                for q in questions
            ]
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=404,
            detail={"success": False, "error": "session_not_found", "details": str(exc)},
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail={"success": False, "error": "details_error", "details": str(exc)},
        ) from exc
