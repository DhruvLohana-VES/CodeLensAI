import os
import uuid
import json
import time
import logging
import google.generativeai as genai
from typing import Optional

logger = logging.getLogger(__name__)

from app.schemas.interview_schemas import (
    InterviewStartResponse,
    AnswerSubmissionResponse,
)
from app.utils.db import get_db_connection
from app.utils.text_helpers import clean_json_response

QUESTION_POOLS = {
    "Frontend": [
        {
            "question": "Explain the difference between the Virtual DOM and the Real DOM in React. Why is the Virtual DOM faster?",
            "keywords": ["diff", "reconciliation", "memory", "batch", "render", "update", "patch"],
            "topic": "React rendering architecture"
        },
        {
            "question": "What is the CSS Box Model, and how does box-sizing: border-box affect layout calculations?",
            "keywords": ["margin", "padding", "border", "content", "width", "include", "box"],
            "topic": "CSS layouts"
        },
        {
            "question": "What are the core differences between Client-Side Rendering (CSR) and Server-Side Rendering (SSR) in Next.js?",
            "keywords": ["seo", "performance", "client", "server", "initial load", "hydration", "crawler"],
            "topic": "Web architecture"
        }
    ],
    "Backend": [
        {
            "question": "Explain how database connection pooling works and why it is important for server performance.",
            "keywords": ["reuse", "overhead", "connection", "limit", "pool", "active", "handshake"],
            "topic": "Database connectivity"
        },
        {
            "question": "What is the purpose of CORS (Cross-Origin Resource Sharing), and how does the browser handle preflight requests?",
            "keywords": ["origin", "headers", "options", "security", "browser", "preflight", "request"],
            "topic": "Security protocols"
        },
        {
            "question": "Explain the differences between SQL and NoSQL databases, and when you would choose NoSQL over SQL.",
            "keywords": ["schema", "relational", "scale", "document", "flexible", "acid", "structured"],
            "topic": "Database design"
        }
    ],
    "Full Stack": [
        {
            "question": "Explain how JSON Web Tokens (JWT) are used for stateless authentication and how to secure them.",
            "keywords": ["signature", "payload", "header", "stateless", "cookie", "storage", "security"],
            "topic": "Stateless Auth"
        },
        {
            "question": "What is REST, and how does it compare to GraphQL in terms of data fetching efficiency?",
            "keywords": ["endpoint", "overfetching", "underfetching", "query", "schema", "rest"],
            "topic": "API patterns"
        },
        {
            "question": "Explain how Redis is used for caching, and what cache eviction policies are commonly employed.",
            "keywords": ["memory", "lru", "ttl", "hit", "miss", "latency", "evict"],
            "topic": "Caching systems"
        }
    ]
}

class InterviewService:
    def start_interview(self, role_input: str) -> InterviewStartResponse:
        # Match nearest pool role
        role = "Full Stack"
        if "front" in role_input.lower():
            role = "Frontend"
        elif "back" in role_input.lower():
            role = "Backend"

        session_id = uuid.uuid4().hex

        # Generate questions using Gemini if API key is present
        api_key = os.getenv("GEMINI_API_KEY")
        questions = []
        if api_key:
            logger.info("Calling Gemini for question generation")
            try:
                logger.info("Using model: gemini-2.5-flash")
                genai.configure(api_key=api_key)
                model = genai.GenerativeModel("gemini-2.5-flash")
                prompt = (
                    f"You are a Senior Technical Recruiter. Generate exactly 3 diverse, challenging technical interview questions for a {role} role. "
                    "Return them as a JSON list of objects containing 'question' and 'topic' fields, for example: "
                    "[{\"question\": \"Question 1\", \"topic\": \"Topic 1\"}, {\"question\": \"Question 2\", \"topic\": \"Topic 2\"}, {\"question\": \"Question 3\", \"topic\": \"Topic 3\"}]. "
                    "Do not include any markdown formatting, wrappers, or backticks; output only the raw JSON array."
                )
                logger.info("Prompt sent to Gemini successfully.")
                logger.debug(f"Prompt preview: {prompt[:500]}")
                
                start_time = time.perf_counter()
                response = model.generate_content(
                    prompt,
                    generation_config={"response_mime_type": "application/json"}
                )
                duration = time.perf_counter() - start_time
                logger.info(f"Gemini question generation latency: {duration:.2f}s")
                
                output_text = response.text.strip()
                logger.info("Received Gemini response successfully.")
                logger.debug(f"Response preview: {output_text[:500]}")
                
                output_text = clean_json_response(output_text)
                
                parsed_qs = json.loads(output_text)
                if isinstance(parsed_qs, list) and len(parsed_qs) > 0:
                    for item in parsed_qs:
                        if isinstance(item, dict) and "question" in item:
                            questions.append({
                                "question": item["question"],
                                "topic": item.get("topic", "General"),
                                "keywords": item.get("keywords", [])
                            })
                        elif isinstance(item, str):
                            questions.append({
                                "question": item,
                                "topic": "General",
                                "keywords": []
                            })
                else:
                    logger.warning("Falling back to rule-based logic")
            except Exception as exc:
                logger.warning("Falling back to rule-based logic")
                logger.error(f"Gemini interview question generation failed: {exc}", exc_info=True)
        else:
            logger.warning("Falling back to rule-based logic")

        # Fallback to predefined pools if not loaded by Gemini
        if not questions:
            questions = [
                {
                    "question": q["question"],
                    "topic": q.get("topic", "General"),
                    "keywords": q.get("keywords", [])
                }
                for q in QUESTION_POOLS[role]
            ]

        first_question = questions[0]["question"]
        questions_json = json.dumps(questions)

        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO interviews (id, role, current_question_index, is_complete, score, questions_json, interview_mode, overall_score) VALUES (?, ?, 0, 0, 0, ?, ?, 0)",
                (session_id, role, questions_json, role)
            )
            conn.commit()
        except Exception as exc:
            conn.rollback()
            raise RuntimeError(f"Could not start interview session: {exc}")
        finally:
            conn.close()

        return InterviewStartResponse(
            session_id=session_id,
            role=role,
            question=first_question,
            question_index=0,
            total_questions=len(questions),
            is_complete=False
        )

    def submit_answer(self, session_id: str, answer: str) -> AnswerSubmissionResponse:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT role, current_question_index, is_complete, questions_json FROM interviews WHERE id = ?", (session_id,))
            session = cursor.fetchone()

            if not session:
                raise ValueError("Interview session not found.")

            if session["is_complete"] == 1:
                raise ValueError("Interview session is already complete.")

            role = session["role"]
            q_index = session["current_question_index"]
            
            # Load questions from database json or fallback to predefined
            questions_json = session["questions_json"]
            if questions_json:
                try:
                    questions = json.loads(questions_json)
                except Exception:
                    questions = [q["question"] for q in QUESTION_POOLS[role]]
            else:
                questions = [q["question"] for q in QUESTION_POOLS[role]]

            question_data = questions[q_index]
            if isinstance(question_data, dict):
                question_text = question_data["question"]
                topic = question_data.get("topic", "General")
                keywords = question_data.get("keywords", [])
            else:
                question_text = question_data
                topic = "General"
                keywords = []
                # Fallback to look up in QUESTION_POOLS if matching
                if q_index < len(QUESTION_POOLS[role]):
                    topic = QUESTION_POOLS[role][q_index].get("topic", "General")
                    keywords = QUESTION_POOLS[role][q_index].get("keywords", [])

            # Grade response
            score, feedback = self._grade_answer(question_text, answer, keywords)

            # Store message with topic
            cursor.execute(
                "INSERT INTO interview_messages (interview_id, question, answer, feedback, score, topic) VALUES (?, ?, ?, ?, ?, ?)",
                (session_id, question_text, answer, feedback, score, topic)
            )

            # Advance session state
            next_q_index = q_index + 1
            is_complete = next_q_index >= len(questions)
            overall_score = None

            if is_complete:
                # Calculate average score
                cursor.execute("SELECT AVG(score) as avg_score FROM interview_messages WHERE interview_id = ?", (session_id,))
                overall_score = int(cursor.fetchone()["avg_score"])
                cursor.execute(
                    "UPDATE interviews SET current_question_index = ?, is_complete = 1, score = ?, overall_score = ? WHERE id = ?",
                    (next_q_index, overall_score, overall_score, session_id)
                )
            else:
                cursor.execute(
                    "UPDATE interviews SET current_question_index = ? WHERE id = ?",
                    (next_q_index, session_id)
                )
            conn.commit()

            if not is_complete:
                next_q_data = questions[next_q_index]
                next_question = next_q_data["question"] if isinstance(next_q_data, dict) else next_q_data
            else:
                next_question = None

            return AnswerSubmissionResponse(
                feedback=feedback,
                score=score,
                next_question=next_question,
                question_index=next_q_index,
                is_complete=is_complete,
                overall_score=overall_score
            )
        except Exception as exc:
            conn.rollback()
            raise exc
        finally:
            conn.close()

    def _grade_answer(self, question: str, answer: str, keywords: list[str]) -> tuple[int, str]:
        # Gemini option
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            logger.info("Calling Gemini for answer grading")
            res = self._call_gemini_grading(question, answer, api_key)
            if res:
                return res.get("score", 70), res.get("feedback", "Good explanation.")
            else:
                logger.warning("Falling back to rule-based logic")
        else:
            logger.warning("Falling back to rule-based logic")

        return self._run_rule_based_grading(answer, keywords)

    def _call_gemini_grading(self, question: str, answer: str, api_key: str) -> dict | None:
        try:
            logger.info("Using model: gemini-2.5-flash")
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-2.5-flash")
            
            prompt = (
                "You are a Senior Technical Recruiter. Grade the candidate's answer for the following question. "
                "Score must be between 0 and 100. Provide clear constructive feedback highlighting what they got right and what was missing. "
                "Output MUST be a JSON object containing exactly these fields without markdown wrappers: "
                "{\n"
                "  \"score\": 85,\n"
                "  \"feedback\": \"Your explanation of X is excellent, but you missed detail Y...\"\n"
                "}\n\n"
                f"Question:\n{question}\n\n"
                f"Candidate Answer:\n{answer}"
            )
            
            logger.info("Prompt sent to Gemini successfully.")
            logger.debug(f"Prompt preview: {prompt[:500]}")
            
            start_time = time.perf_counter()
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            duration = time.perf_counter() - start_time
            logger.info(f"Gemini grading latency: {duration:.2f}s")
            
            output_text = response.text.strip()
            logger.info("Received Gemini response successfully.")
            logger.debug(f"Response preview: {output_text[:500]}")
            
            output_text = clean_json_response(output_text)
                
            return json.loads(output_text)
        except Exception as exc:
            logger.warning("Falling back to rule-based logic")
            logger.error(f"Gemini answer grading failed: {exc}", exc_info=True)
            return None

    def _run_rule_based_grading(self, answer: str, keywords: list[str]) -> tuple[int, str]:
        cleaned_ans = answer.strip()
        
        if len(cleaned_ans) < 20:
            return 30, (
                "Your answer is too short. Try to elaborate on technical concepts, "
                "mention architectural trade-offs, and give concrete examples."
            )
            
        found_keywords = [kw for kw in keywords if kw.lower() in cleaned_ans.lower()] if keywords else []
        density = len(found_keywords) / len(keywords) if keywords else 0

        # Baseline calculation
        score = int(40 + (density * 50) + min(len(cleaned_ans) / 15, 10))
        score = min(score, 100)

        # Feedback generation
        positives = []
        improvements = []

        if found_keywords:
            positives.append(f"You correctly referenced key concepts like: {', '.join(found_keywords[:3])}.")
        else:
            improvements.append("Your response lacks specific vocabulary. Try to use key industry terms.")

        if len(cleaned_ans) > 200:
            positives.append("You provided a detailed, well-structured response.")
        else:
            improvements.append("Consider explaining the underlying mechanics in more detail to show depth.")

        if not positives:
            positives.append("Your response is on the right track.")
        if not improvements:
            improvements.append("Keep up the good level of detail!")

        feedback = (
            f"**Strengths**: {' '.join(positives)}\n\n"
            f"**Areas for Improvement**: {' '.join(improvements)}"
        )

        return score, feedback

    def get_history(self, page: int = 1, limit: int = 10) -> tuple[list[dict], int]:
        offset = (page - 1) * limit
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            
            # Count total
            cursor.execute("SELECT COUNT(*) as total FROM interviews")
            total = cursor.fetchone()["total"]
            
            # Query paginated rows ordered by created_at DESC, rowid DESC
            cursor.execute(
                """
                SELECT id, role, score, interview_mode, overall_score, created_at
                FROM interviews
                ORDER BY created_at DESC, rowid DESC
                LIMIT ? OFFSET ?
                """,
                (limit, offset)
            )
            rows = cursor.fetchall()
            interviews = []
            for row in rows:
                mode = row["interview_mode"] or row["role"] or "Full Stack"
                overall_score = row["overall_score"] if row["overall_score"] is not None else row["score"]
                interviews.append({
                    "id": row["id"],
                    "mode": mode,
                    "overall_score": overall_score,
                    "created_at": row["created_at"]
                })
            return interviews, total
        finally:
            conn.close()

    def get_details(self, interview_id: str) -> dict:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT id, role, score, interview_mode, overall_score, created_at
                FROM interviews
                WHERE id = ?
                """,
                (interview_id,)
            )
            session_row = cursor.fetchone()
            if not session_row:
                raise ValueError("Interview session not found.")
            
            mode = session_row["interview_mode"] or session_row["role"] or "Full Stack"
            overall_score = session_row["overall_score"] if session_row["overall_score"] is not None else session_row["score"]
            
            interview_metadata = {
                "id": session_row["id"],
                "mode": mode,
                "overall_score": overall_score,
                "created_at": session_row["created_at"]
            }
            
            # Get all questions
            cursor.execute(
                """
                SELECT id, question, answer, feedback, score, topic, created_at
                FROM interview_messages
                WHERE interview_id = ?
                ORDER BY id ASC
                """,
                (interview_id,)
            )
            message_rows = cursor.fetchall()
            
            questions = []
            for row in message_rows:
                questions.append({
                    "id": row["id"],
                    "question": row["question"],
                    "answer": row["answer"],
                    "feedback": row["feedback"],
                    "score": row["score"],
                    "topic": row["topic"] or "General",
                    "created_at": row["created_at"]
                })
            
            return {
                "interview": interview_metadata,
                "questions": questions
            }
        finally:
            conn.close()
