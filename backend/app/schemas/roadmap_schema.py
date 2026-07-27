from pydantic import BaseModel, Field
from typing import List

class WeeklyPlan(BaseModel):
    week: int = Field(..., description="The week number (1-based)")
    title: str = Field(..., description="A descriptive title for this week's study plan")
    difficulty: str = Field(..., description="Difficulty level of the week (Easy, Medium, Hard)")
    estimated_hours: int = Field(..., description="Estimated hours to complete this week's tasks")
    topics: List[str] = Field(..., description="List of topics covered in the week")
    learning_objectives: List[str] = Field(..., description="Clear learning objectives for the week")
    practice_tasks: List[str] = Field(..., description="Actionable study and coding exercises")
    mock_goal: str = Field(..., description="Actionable mock interview target for this week")
    completed: bool = Field(False, description="Completion status of this week (for frontend interaction)")

class RoadmapResponse(BaseModel):
    success: bool = Field(True, description="Indicates if the request succeeded")
    duration_weeks: int = Field(4, description="The duration of the roadmap in weeks")
    overall_goal: str = Field(..., description="The primary goal of this preparation plan")
    estimated_hours: int = Field(..., description="Total estimated preparation hours across all weeks")
    priority_topics: List[str] = Field(..., description="List of prioritized topics to focus on, weakest first")
    weekly_plan: List[WeeklyPlan] = Field(..., description="A week-by-week study plan")
    success_metrics: List[str] = Field(..., description="Key metrics or checklist items indicating success")
    generated_at: str = Field(..., description="ISO 8601 timestamp of roadmap generation")
