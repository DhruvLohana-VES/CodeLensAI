from typing import Optional, List

from pydantic import BaseModel, Field


class ResumeSection(BaseModel):
    title: str = Field(..., description="Section title")
    items: List[str] = Field(..., description="List of section bullet points")


class ResumeAnalysis(BaseModel):
    candidateName: str = Field(..., description="Full name of the candidate")
    role: str = Field(..., description="Target or parsed role designation")
    skills: List[str] = Field(..., description="List of technical and soft skills identified")
    projects: ResumeSection = Field(..., description="Projects details")
    education: ResumeSection = Field(..., description="Academic qualifications details")
    experience: ResumeSection = Field(
        default_factory=lambda: ResumeSection(title="Experience", items=[]),
        description="Professional experience details"
    )
    achievements: ResumeSection = Field(..., description="List of highlights/achievements")
    strengths: List[str] = Field(..., description="Candidate strengths")
    weaknesses: List[str] = Field(..., description="Areas of improvement")
    readinessScore: int = Field(..., description="Placement readiness score between 0 and 100")


class ResumeUploadResponse(BaseModel):
    """Response payload for successful resume upload and text extraction."""

    success: bool = Field(
        ..., description="Indicates whether the upload and extraction succeeded."
    )
    filename: str = Field(
        ..., min_length=1, description="Original filename of the uploaded PDF."
    )
    pages: int = Field(
        ..., ge=1, description="Number of pages detected in the PDF."
    )
    text: str = Field(
        ..., min_length=1, description="Extracted text content from the PDF."
    )
    analysis: Optional[ResumeAnalysis] = Field(
        None, description="Detailed structured resume analysis payload"
    )


class LatestResumeResponse(BaseModel):
    """Response payload for retrieving the latest resume analysis."""

    success: bool = Field(
        ..., description="Indicates whether the retrieval succeeded."
    )
    analysis: ResumeAnalysis = Field(
        ..., description="Detailed structured resume analysis payload"
    )


class ErrorResponse(BaseModel):
    """Response payload for failed operations."""

    success: bool = Field(
        ..., description="Indicates whether the request succeeded."
    )
    error: str = Field(
        ..., min_length=1, description="Short error code or message."
    )
    details: Optional[str] = Field(
        None, description="Optional error details for debugging or display."
    )

