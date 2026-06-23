from fastapi import APIRouter, HTTPException

from app.schemas.code_schemas import (
    CodeExecutionRequest,
    CodeExecutionResponse,
    CodeFeedbackRequest,
    CodeFeedbackResponse,
)
from app.schemas.resume_schemas import ErrorResponse
from app.services.code_service import CodeService

router = APIRouter(prefix="/code", tags=["Code Workspace"])
service = CodeService()


@router.post(
    "/execute",
    summary="Execute code snippet",
    description="Executes a code snippet inside a sandboxed environment (using Piston API or local subprocess).",
    response_model=CodeExecutionResponse,
    responses={
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
)
async def execute_code(payload: CodeExecutionRequest) -> CodeExecutionResponse:
    try:
        return service.execute_code(payload.code, payload.language)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail={"success": False, "error": "execution_error", "details": str(exc)},
        ) from exc


@router.post(
    "/feedback",
    summary="Get code feedback",
    description="Provides complexity analysis, styling suggestions, and refactored code for a submission.",
    response_model=CodeFeedbackResponse,
    responses={
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
)
async def get_code_feedback(payload: CodeFeedbackRequest) -> CodeFeedbackResponse:
    try:
        return service.get_code_feedback(payload.code, payload.problem_name)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail={"success": False, "error": "feedback_error", "details": str(exc)},
        ) from exc
