from typing import Optional
from pydantic import BaseModel, Field

class InterviewStartRequest(BaseModel):
    role: str = Field(..., description="Role category (e.g. Frontend, Backend, Full Stack)")

class InterviewStartResponse(BaseModel):
    session_id: str = Field(..., description="Unique interview session identifier")
    role: str = Field(..., description="Role name")
    question: str = Field(..., description="The interview question")
    question_index: int = Field(..., description="0-indexed current question position")
    total_questions: int = Field(..., description="Total questions in this session")
    is_complete: bool = Field(..., description="Indicates if session is finished")

class AnswerSubmissionRequest(BaseModel):
    session_id: str = Field(..., description="Session identifier")
    answer: str = Field(..., description="User's typed response to the current question")

class AnswerSubmissionResponse(BaseModel):
    feedback: str = Field(..., description="Constructive feedback for the submitted answer")
    score: int = Field(..., description="Score for the answer (0-100)")
    next_question: Optional[str] = Field(None, description="The next question, if any")
    question_index: int = Field(..., description="Index of the next question")
    is_complete: bool = Field(..., description="True if this was the final question")
    overall_score: Optional[int] = Field(None, description="Aggregate score on completion")
