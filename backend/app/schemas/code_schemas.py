from typing import Optional
from pydantic import BaseModel, Field

class CodeExecutionRequest(BaseModel):
    code: str = Field(..., description="The source code to execute")
    language: str = Field("python", description="Language of the code (e.g. python, javascript)")

class CodeExecutionResponse(BaseModel):
    success: bool = Field(..., description="True if code executed without exceptions")
    output: str = Field(..., description="Standard output from execution")
    error: str = Field(..., description="Standard error/exceptions from execution")

class CodeFeedbackRequest(BaseModel):
    code: str = Field(..., description="Source code to analyze")
    problem_name: str = Field(..., description="The name of the coding problem")

class CodeFeedbackResponse(BaseModel):
    feedback: str = Field(..., description="Detailed AI review and suggestions")
    timeComplexity: str = Field(..., description="Calculated Big-O Time Complexity")
    spaceComplexity: str = Field(..., description="Calculated Big-O Space Complexity")
    refactoredCode: Optional[str] = Field(None, description="An optimized or cleaner version of the code")
