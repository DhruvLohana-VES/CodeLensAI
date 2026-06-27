from typing import Optional, List
from pydantic import BaseModel, Field

class PerformanceTrendItem(BaseModel):
    interview: int = Field(..., description="Chronological index of the completed interview session")
    score: int = Field(..., description="Overall score achieved")

class AnalyticsResponse(BaseModel):
    success: bool = Field(..., description="Indicates if request succeeded")
    average_score: int = Field(..., description="Average score across all completed interviews")
    total_sessions: int = Field(..., description="Total count of completed interviews")
    best_topic: Optional[str] = Field(None, description="Topic with the highest average score")
    weakest_topic: Optional[str] = Field(None, description="Topic with the lowest average score")
    strong_topics: List[str] = Field(default_factory=list, description="List of topics with average score >= 70")
    weak_topics: List[str] = Field(default_factory=list, description="List of topics with average score < 70")
    performance_trend: List[PerformanceTrendItem] = Field(default_factory=list, description="Chronological list of overall scores")
    topic_scores: dict[str, int] = Field(default_factory=dict, description="Dictionary mapping topics to their average score")
