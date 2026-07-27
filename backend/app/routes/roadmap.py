from fastapi import APIRouter, HTTPException
from app.schemas.roadmap_schema import RoadmapResponse
from app.services.roadmap_service import RoadmapService
from app.schemas.resume_schemas import ErrorResponse

router = APIRouter(tags=["Roadmap Generator"])
service = RoadmapService()

@router.get(
    "/roadmap",
    summary="Get personalized study roadmap",
    description=(
        "Retrieves a personalized preparation roadmap. Consumes the Weakness Detection output "
        "and organizes a 4-week structured plan. Caches results based on the weakness fingerprint."
    ),
    response_model=RoadmapResponse,
    responses={
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
)
async def get_roadmap() -> RoadmapResponse:
    try:
        return service.get_or_generate_roadmap(regenerate=False)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": "roadmap_generation_error",
                "details": f"Failed to get study roadmap: {str(exc)}",
            },
        ) from exc

@router.post(
    "/roadmap/regenerate",
    summary="Regenerate personalized study roadmap",
    description="Forces regeneration of the study roadmap, bypassing the cached results.",
    response_model=RoadmapResponse,
    responses={
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
)
async def regenerate_roadmap() -> RoadmapResponse:
    try:
        return service.get_or_generate_roadmap(regenerate=True)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": "roadmap_regeneration_error",
                "details": f"Failed to regenerate study roadmap: {str(exc)}",
            },
        ) from exc
