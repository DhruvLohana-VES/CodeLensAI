import os
import uuid
import json
import re
import time
import logging
from datetime import datetime
import google.generativeai as genai
from fastapi import UploadFile

logger = logging.getLogger(__name__)

from app.schemas.resume_schemas import ResumeUploadResponse, ResumeAnalysis, ResumeSection
from app.utils.pdf_extractor import PDFExtractionError, extract_text_from_pdf
from app.utils.db import get_db_connection
from app.utils.text_helpers import clean_json_response

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

class ResumeServiceError(Exception):
    """Base error for resume processing failures."""

class ResumeValidationError(ResumeServiceError):
    """Raised when the uploaded file metadata is invalid."""

class ResumeProcessingError(ResumeServiceError):
    """Raised when resume text extraction fails."""

class ResumeService:
    async def parse_resume(self, file: UploadFile) -> ResumeUploadResponse:
        filename = (file.filename or "").strip()
        if not filename:
            raise ResumeValidationError("Filename is required.")

        if file.content_type != "application/pdf":
            raise ResumeValidationError("Only PDF files are supported.")

        file_bytes = await file.read()
        if not file_bytes:
            raise ResumeValidationError("Uploaded file is empty.")

        if len(file_bytes) > MAX_FILE_SIZE_BYTES:
            raise ResumeValidationError("File exceeds the 10MB size limit.")

        try:
            result = extract_text_from_pdf(file_bytes)
        except PDFExtractionError as exc:
            raise ResumeProcessingError(str(exc)) from exc

        # Perform analysis (Gemini or rule-based fallback)
        analysis = self._analyze_text(result.text, filename)

        # Persist to SQLite database
        resume_id = uuid.uuid4().hex
        analysis_json = json.dumps(analysis.model_dump())
        
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO resumes (id, filename, pages, text, analysis_json) VALUES (?, ?, ?, ?, ?)",
                (resume_id, filename, result.pages, result.text, analysis_json)
            )
            conn.commit()
        except Exception as exc:
            conn.rollback()
            raise ResumeProcessingError(f"Database persistence failed: {exc}") from exc
        finally:
            conn.close()

        return ResumeUploadResponse(
            success=True,
            filename=filename,
            pages=result.pages,
            text=result.text,
            analysis=analysis
        )

    def get_latest_resume_analysis(self) -> ResumeAnalysis | None:
        """Retrieves the most recently uploaded resume analysis from the SQLite database."""
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            # Order by ROWID descending to get the last inserted record
            cursor.execute("SELECT analysis_json FROM resumes ORDER BY rowid DESC LIMIT 1")
            row = cursor.fetchone()
            if row:
                data = json.loads(row["analysis_json"])
                if "experience" not in data:
                    data["experience"] = {"title": "Experience", "items": []}
                return ResumeAnalysis(**data)
            return None
        finally:
            conn.close()

    def _analyze_text(self, text: str, filename: str) -> ResumeAnalysis:
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            logger.info("Calling Gemini for resume analysis")
            analysis_dict = self._call_gemini_analysis(text, api_key)
            if analysis_dict:
                try:
                    return ResumeAnalysis(**analysis_dict)
                except Exception as exc:
                    logger.warning(f"Falling back to rule-based logic: {exc}")
            else:
                logger.warning("Falling back to rule-based logic")
        else:
            logger.warning("Falling back to rule-based logic")

        return self._run_rule_based_analysis(text, filename)

    def _call_gemini_analysis(self, text: str, api_key: str) -> dict | None:
        try:
            logger.info("Using model: gemini-2.5-flash")
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-2.5-flash")
            
            today = datetime.now().strftime("%d %B %Y")
            prompt = (
                f"Current Date: {today}\n\n"
                "You are an experienced Software Engineering recruiter and career mentor. "
                "Analyze the following resume text and evaluate the candidate relative to students at the same stage of education.\n\n"
                "Guidelines:\n"
                "1. Use the current date when reasoning about timelines, experience, and years remaining until graduation.\n"
                "2. Do not assume the candidate is several years away from graduation if the graduation year is explicitly provided.\n"
                "3. Do not penalize candidates for being undergraduate students.\n"
                "4. Avoid generic strengths and weaknesses.\n"
                "5. Only mention strengths and weaknesses supported by evidence from the resume.\n"
                "6. Infer communication, teamwork, leadership, and problem-solving skills from hackathons, competitions, internships, and collaborative projects when appropriate.\n"
                "7. Consider achievements and project complexity when evaluating placement readiness.\n"
                "8. Avoid repetitive points.\n"
                "9. Be realistic and constructive.\n"
                "10. Compare the candidate against other Computer Engineering students of the same year.\n"
                "11. If no major weaknesses are evident, mention growth opportunities instead of inventing weaknesses.\n\n"
                "Output MUST be a JSON object containing exactly these fields without markdown wrappers:\n"
                "{\n"
                "  \"candidateName\": \"Full Name (default to first line if not clear)\",\n"
                "  \"role\": \"Target or matching title (e.g. Frontend Engineer, Backend Engineer, Software Engineer)\",\n"
                "  \"skills\": [\"Skill1\", \"Skill2\", ...],\n"
                "  \"projects\": {\"title\": \"Projects\", \"items\": [\"Project1: description\", ...]},\n"
                "  \"education\": {\"title\": \"Education\", \"items\": [\"Degree - Institution (Year)\", ...]},\n"
                "  \"experience\": {\"title\": \"Experience\", \"items\": [\"Experience1: details\", ...]},\n"
                "  \"achievements\": {\"title\": \"Achievements\", \"items\": [\"Achievement1\", ...]},\n"
                "  \"strengths\": [\"Strength1\", \"Strength2\", ...],\n"
                "  \"weaknesses\": [\"Weakness1\", \"Weakness2\", ...],\n"
                "  \"readinessScore\": 82\n"
                "}\n\n"
                f"Resume Text:\n{text}"
            )
            
            logger.info("Prompt sent to Gemini successfully.")
            logger.debug(f"Prompt preview: {prompt[:500]}")
            
            start_time = time.perf_counter()
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            duration = time.perf_counter() - start_time
            logger.info(f"Gemini resume analysis latency: {duration:.2f}s")
            
            output_text = response.text.strip()
            logger.info("Received Gemini response successfully.")
            logger.debug(f"Response preview: {output_text[:500]}")
            
            output_text = clean_json_response(output_text)
                
            return json.loads(output_text)
        except Exception as exc:
            logger.warning("Falling back to rule-based logic")
            logger.error(f"Gemini resume analysis failed: {exc}", exc_info=True)
            return None

    def _run_rule_based_analysis(self, text: str, filename: str) -> ResumeAnalysis:
        # Standardize non-ascii dashes/bullets that PyMuPDF might convert or flatten
        cleaned_text = text.replace(" ? ", " – ").replace(" ?  ", " – ")
        
        # If the text has no newlines or is flat, let's segment it logically
        if "\n" not in cleaned_text or len(cleaned_text.split("\n")) < 3:
            keywords = [
                "experience", "work experience", "professional experience", "positions of responsibility",
                "education", "skills", "projects", "achievements", "strengths", "weaknesses",
                "software engineering intern", "ml intern", "technical lead", "core team member"
            ]
            pattern = r'\s+(?=\b(?:' + '|'.join(keywords) + r')\b)'
            lines = [line.strip() for line in re.split(pattern, cleaned_text, flags=re.IGNORECASE) if line.strip()]
        else:
            lines = [line.strip() for line in cleaned_text.split("\n") if line.strip()]

        # 1. Candidate Name
        candidate_name = "Candidate"
        if lines:
            # Pick first line if it looks reasonable
            first_line = lines[0]
            if len(first_line) < 45 and "@" not in first_line and "/" not in first_line:
                candidate_name = first_line
                # Clean up any trailing role info
                for title in ["software engineer", "developer", "intern", "engineer", "ml engineer", "frontend engineer", "backend engineer"]:
                    if title in candidate_name.lower():
                        idx = candidate_name.lower().find(title)
                        candidate_name = candidate_name[:idx].strip()
            else:
                # Fallback to base filename without extension
                candidate_name = os.path.splitext(filename)[0].replace("_", " ").replace("-", " ").title()

        # 2. Skills Scanning
        predefined_skills = [
            "Python", "JavaScript", "TypeScript", "React", "Next.js", "Node.js", "Java", 
            "C++", "C#", "HTML", "CSS", "SQL", "PostgreSQL", "MongoDB", "Docker", "AWS", 
            "Git", "System Design", "Data Structures", "Algorithms", "Machine Learning"
        ]
        found_skills = []
        for skill in predefined_skills:
            # Boundary search
            pattern = rf"\b{re.escape(skill)}\b"
            if re.search(pattern, text, re.IGNORECASE):
                found_skills.append(skill)
        
        if not found_skills:
            found_skills = ["Software Engineering", "Problem Solving", "Git"]

        # 3. Role matching
        role = "Software Engineer"
        text_lower = text.lower()
        if "frontend" in text_lower or "front-end" in text_lower:
            role = "Frontend Engineer"
        elif "backend" in text_lower or "back-end" in text_lower:
            role = "Backend Engineer"
        elif "fullstack" in text_lower or "full-stack" in text_lower:
            role = "Full Stack Engineer"
        elif "machine learning" in text_lower or "data scientist" in text_lower:
            role = "ML Engineer"

        # 4. Projects extract
        projects = []
        for line in lines:
            if any(k in line.lower() for k in ["project", "build", "developed", "created", "designed"]):
                if len(line) > 30 and len(line) < 150:
                    projects.append(line)
            if len(projects) >= 3:
                break
        if not projects:
            projects = [
                "Developer Portfolio: built with React & Next.js",
                "Placement Tracker: full-stack dashboard for cohort management"
            ]

        # 5. Education
        education = []
        for line in lines:
            if any(k in line.lower() for k in ["vit", "university", "institute", "college", "b.tech", "degree", "education"]):
                if len(line) > 20 and len(line) < 120:
                    education.append(line)
            if len(education) >= 2:
                break
        if not education:
            education = ["B.Tech in Computer Science & Engineering"]

        # 6. Experience
        experience_items = []
        experience_sections = ["experience", "internship", "work experience", "professional experience", "positions of responsibility", "positions of responsibilities", "internships"]
        other_sections = ["education", "skills", "projects", "achievements", "certifications", "hobbies", "languages", "about me", "summary", "profile", "contact", "interests"]
        
        in_experience_section = False
        for line in lines:
            clean_line = line.strip().lower().rstrip(":")
            if any(s in clean_line for s in experience_sections):
                in_experience_section = True
                continue
            elif any(s in clean_line for s in other_sections):
                in_experience_section = False
                continue
                
            if in_experience_section:
                if len(line) > 10 and len(line) < 100:
                    if any(k in line.lower() for k in ["intern", "lead", "member", "engineer", "developer", "analyst", "coordinator", "head", "manager", "officer", "founder"]):
                        experience_items.append(line.strip())
                        
        if not experience_items:
            for line in lines:
                if len(line) > 10 and len(line) < 100:
                    if any(k in line.lower() for k in ["intern", "lead", "member", "engineer", "developer", "analyst", "coordinator", "head", "manager", "officer", "founder"]):
                        if any(sep in line for sep in ["–", "-", "|", "@", " at "]) or any(k in line.lower() for k in ["abc", "xyz", "ieee", "csi", "google", "microsoft", "meta", "amazon", "apple", "netflix"]):
                            experience_items.append(line.strip())
                            
        experience_items = experience_items[:3]
        if not experience_items:
            experience_items = [
                "Software Engineering Intern – ABC",
                "Technical Lead – IEEE"
            ]

        # 7. Achievements
        achievements = []
        for line in lines:
            if any(k in line.lower() for k in ["award", "rank", "won", "achievement", "first place", "scholarship"]):
                if len(line) > 25 and len(line) < 120:
                    achievements.append(line)
            if len(achievements) >= 2:
                break
        if not achievements:
            achievements = ["Led placement workshop for 100+ students"]

        # 8. Strengths / Weaknesses
        strengths = ["Clear communicator", "Practical project building skills"]
        if "React" in found_skills or "JavaScript" in found_skills:
            strengths.append("Strong frontend responsiveness mindset")
        else:
            strengths.append("Familiarity with core algorithms")

        weaknesses = []
        if "System Design" not in found_skills:
            weaknesses.append("Needs more depth in high-level distributed systems design")
        if "Docker" not in found_skills:
            weaknesses.append("Limited containerization and DevOps pipeline exposure")
        if len(weaknesses) < 2:
            weaknesses.append("Needs more automated test coverage experience")

        # 9. Readiness score
        readiness_score = 65 + len(found_skills) * 2
        readiness_score = min(readiness_score, 95)

        return ResumeAnalysis(
            candidateName=candidate_name,
            role=role,
            skills=found_skills,
            projects=ResumeSection(title="Projects", items=projects),
            education=ResumeSection(title="Education", items=education),
            experience=ResumeSection(title="Experience", items=experience_items),
            achievements=ResumeSection(title="Achievements", items=achievements),
            strengths=strengths,
            weaknesses=weaknesses,
            readinessScore=readiness_score
        )
