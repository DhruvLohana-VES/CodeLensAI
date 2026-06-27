from fastapi import APIRouter, HTTPException
from app.schemas.analytics_schemas import AnalyticsResponse, PerformanceTrendItem
from app.services.analytics_service import AnalyticsService
from app.schemas.resume_schemas import ErrorResponse

router = APIRouter(tags=["Analytics"])
service = AnalyticsService()

@router.get(
    "/analytics",
    summary="Get analytics dashboard data",
    description="Returns aggregate scores, session counts, strong/weak topics, best/weakest topics, and score progression trends.",
    response_model=AnalyticsResponse,
    responses={
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
)
async def get_analytics() -> AnalyticsResponse:
    try:
        data = service.get_analytics()
        
        performance_trend = [
            PerformanceTrendItem(
                interview=item["interview"],
                score=item["score"]
            )
            for item in data["performance_trend"]
        ]
        
        return AnalyticsResponse(
            success=True,
            average_score=data["average_score"],
            total_sessions=data["total_sessions"],
            best_topic=data["best_topic"],
            weakest_topic=data["weakest_topic"],
            strong_topics=data["strong_topics"],
            weak_topics=data["weak_topics"],
            performance_trend=performance_trend,
            topic_scores=data["topic_scores"]
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail={"success": False, "error": "analytics_error", "details": str(exc)},
        ) from exc
