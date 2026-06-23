from fastapi import APIRouter, HTTPException, UploadFile, File

from app.schemas.resume_schemas import ErrorResponse, ResumeUploadResponse, LatestResumeResponse
from app.services.resume_service import (
    ResumeProcessingError,
    ResumeService,
    ResumeValidationError,
)

router = APIRouter(tags=["Resume"])
service = ResumeService()


@router.post(
    "/resume/upload",
    summary="Upload a resume PDF",
    description="Upload a PDF resume and extract its text content.",
    response_model=ResumeUploadResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid request"},
        413: {"model": ErrorResponse, "description": "File too large"},
        415: {"model": ErrorResponse, "description": "Unsupported media type"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
)
async def upload_resume(file: UploadFile = File(...)) -> ResumeUploadResponse:
    try:
        return await service.parse_resume(file)
    except ResumeValidationError as exc:
        message = str(exc)
        if "10MB" in message or "size" in message.lower():
            raise HTTPException(
                status_code=413,
                detail={"success": False, "error": "file_too_large", "details": message},
            ) from exc
        if "pdf" in message.lower() or "content" in message.lower():
            raise HTTPException(
                status_code=415,
                detail={
                    "success": False,
                    "error": "unsupported_media_type",
                    "details": message,
                },
            ) from exc
        raise HTTPException(
            status_code=400,
            detail={"success": False, "error": "invalid_request", "details": message},
        ) from exc
    except ResumeProcessingError as exc:
        raise HTTPException(
            status_code=400,
            detail={"success": False, "error": "invalid_pdf", "details": str(exc)},
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": "server_error",
                "details": f"Unexpected error during resume upload: {str(exc)}",
            },
        ) from exc


@router.get(
    "/resume/latest",
    summary="Get the latest resume analysis",
    description="Fetch the structured analysis of the most recently uploaded resume.",
    response_model=LatestResumeResponse,
    responses={
        404: {"model": ErrorResponse, "description": "No resume found"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
)
async def get_latest_resume() -> LatestResumeResponse:
    try:
        analysis = service.get_latest_resume_analysis()
        if not analysis:
            raise HTTPException(
                status_code=404,
                detail={"success": False, "error": "not_found", "details": "No resume uploaded yet."}
            )
        return LatestResumeResponse(
            success=True,
            analysis=analysis
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail={"success": False, "error": "server_error", "details": str(exc)}
        )

