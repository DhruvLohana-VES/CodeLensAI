from fastapi import APIRouter, HTTPException
from app.schemas.weakness_schema import WeaknessAnalysisResponse
from app.services.weakness_service import WeaknessService
from app.schemas.resume_schemas import ErrorResponse

router = APIRouter(tags=["Weakness Detection"])
service = WeaknessService()

@router.get(
    "/weakness-analysis",
    summary="Get user weakness detection analysis",
    description=(
        "Retrieves a performance audit across all technical interview categories. "
        "Aggregates history, calculates scoring metrics (average, min, max, attempt trends), "
        "classifies categories, and generates AI improvement recommendations."
    ),
    response_model=WeaknessAnalysisResponse,
    responses={
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
)
async def get_weakness_analysis() -> WeaknessAnalysisResponse:
    try:
        return service.get_weakness_analysis()
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": "weakness_analysis_error",
                "details": f"Failed to compute weakness metrics: {str(exc)}",
            },
        ) from exc
