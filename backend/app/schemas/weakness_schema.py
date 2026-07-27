from pydantic import BaseModel, Field
from typing import List, Optional

class TopicDetails(BaseModel):
    topic: str = Field(..., description="The name of the placement topic")
    average_score: int = Field(..., description="Average score across attempts for this topic")
    highest_score: int = Field(..., description="Highest score achieved for this topic")
    lowest_score: int = Field(..., description="Lowest score achieved for this topic")
    attempts: int = Field(..., description="Total attempts/questions completed for this topic")
    recent_trend: str = Field(..., description="Trend description: Improving, Declining, Stable, or No Trend")
    last_score: Optional[int] = Field(None, description="Score of the most recent attempt")
    prev_score: Optional[int] = Field(None, description="Score of the second most recent attempt")
    improvement_percent: Optional[float] = Field(None, description="Improvement between the last two attempts")

class AnalysisMetadata(BaseModel):
    total_topics: int = Field(..., description="Total unique topics analyzed")
    total_questions: int = Field(..., description="Total graded questions analyzed")
    strongest_topic: Optional[str] = Field(None, description="Topic with the highest average score")
    weakest_topic: Optional[str] = Field(None, description="Topic with the lowest average score")
    analysis_timestamp: str = Field(..., description="ISO 8601 timestamp of analysis generation")

class WeaknessAnalysisResponse(BaseModel):
    success: bool = Field(..., description="Indicates if the request succeeded")
    overall_score: int = Field(..., description="Average overall score across all completed interviews")
    strong_topics: List[TopicDetails] = Field(default_factory=list, description="Topics categorized as Strong (avg score >= 80)")
    moderate_topics: List[TopicDetails] = Field(default_factory=list, description="Topics categorized as Moderate (avg score 60-79)")
    weak_topics: List[TopicDetails] = Field(default_factory=list, description="Topics categorized as Weak (avg score < 60)")
    recommendations: List[str] = Field(default_factory=list, description="AI-powered actionable recommendations for improvement")
    metadata: AnalysisMetadata = Field(..., description="Metadata metrics for integration with other modules")
