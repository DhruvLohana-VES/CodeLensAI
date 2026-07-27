import os
import time
import json
import logging
import hashlib
from datetime import datetime
from typing import List, Dict, Any, Optional
import google.generativeai as genai

from app.utils.db import get_db_connection
from app.utils.text_helpers import clean_json_response
from app.services.weakness_service import WeaknessService
from app.schemas.roadmap_schema import RoadmapResponse, WeeklyPlan

logger = logging.getLogger(__name__)

class RoadmapService:
    def __init__(self):
        self.weakness_service = WeaknessService()

    def _get_weakness_fingerprint(self) -> str:
        """
        Computes a deterministic hash of the weakness statistics to serve as the cache fingerprint.
        Avoids duplicate database aggregation or Gemini calls.
        """
        try:
            overall_score, topic_stats = self.weakness_service.aggregate_topic_data()
            if not topic_stats:
                return "empty"
            # Deterministic serialization by sorting keys
            serialized = json.dumps(
                {"overall_score": overall_score, "topic_stats": topic_stats},
                sort_keys=True
            )
            return hashlib.sha256(serialized.encode("utf-8")).hexdigest()
        except Exception as e:
            logger.error(f"Failed to compute weakness fingerprint: {e}")
            return "error"

    def get_or_generate_roadmap(self, regenerate: bool = False) -> RoadmapResponse:
        """
        Retrieves cached roadmap if valid, otherwise generates a new one.
        """
        start_time = time.perf_counter()
        logger.info("Roadmap generation started")

        fingerprint = self._get_weakness_fingerprint()

        # Try to retrieve from database cache if not forced to regenerate
        if not regenerate and fingerprint != "empty" and fingerprint != "error":
            cached = self._get_cached_roadmap(fingerprint)
            if cached:
                execution_time = time.perf_counter() - start_time
                logger.info(f"Roadmap cache hit. Execution time: {execution_time:.3f}s")
                return cached

        # Otherwise, generate a new roadmap
        # Load weakness analysis to obtain classification and metadata
        try:
            # We call weakness service's aggregate + classify directly to avoid full analysis Gemini calls
            overall_score, topic_stats = self.weakness_service.aggregate_topic_data()
            strong, moderate, weak = self.weakness_service.classify_topics(topic_stats)
            logger.info("Weakness analysis loaded")
        except Exception as e:
            logger.error(f"Failed to load weakness statistics: {e}")
            overall_score = 0
            strong, moderate, weak = [], [], []

        # Call Gemini (with fallback)
        roadmap_dict = self._generate_ai_roadmap(strong, moderate, weak, overall_score)

        # Cache the result in DB
        if fingerprint != "empty" and fingerprint != "error":
            self._save_cached_roadmap(fingerprint, roadmap_dict)

        execution_time = time.perf_counter() - start_time
        logger.info(f"Execution time: {execution_time:.3f}s")

        return RoadmapResponse(**roadmap_dict)

    def _get_cached_roadmap(self, fingerprint: str) -> Optional[RoadmapResponse]:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT roadmap_json FROM roadmaps WHERE id = 'latest' AND weakness_fingerprint = ?",
                (fingerprint,)
            )
            row = cursor.fetchone()
            if row:
                data = json.loads(row["roadmap_json"])
                return RoadmapResponse(**data)
        except Exception as e:
            logger.error(f"Error reading cached roadmap: {e}")
        finally:
            conn.close()
        return None

    def _save_cached_roadmap(self, fingerprint: str, roadmap_dict: Dict[str, Any]):
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT OR REPLACE INTO roadmaps (id, roadmap_json, weakness_fingerprint, created_at) VALUES ('latest', ?, ?, CURRENT_TIMESTAMP)",
                (json.dumps(roadmap_dict), fingerprint)
            )
            conn.commit()
        except Exception as e:
            logger.error(f"Error saving cached roadmap: {e}")
        finally:
            conn.close()

    def _generate_ai_roadmap(
        self,
        strong: List[Dict[str, Any]],
        moderate: List[Dict[str, Any]],
        weak: List[Dict[str, Any]],
        overall_score: int
    ) -> Dict[str, Any]:
        """
        Invokes Gemini to build the personalized placement prep roadmap.
        If unavailable or invalid, falls back to deterministic rules.
        """
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            logger.warning("No Gemini API key found. Fallback triggered")
            return self._fallback_roadmap(weak, moderate, strong, overall_score)

        try:
            logger.info("Gemini request started")
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-2.5-flash")

            # Summarize stats for prompt context
            weak_summary = [
                {"topic": t["topic"], "average_score": t["average_score"], "attempts": t["attempts"]}
                for t in weak
            ]
            moderate_summary = [
                {"topic": t["topic"], "average_score": t["average_score"], "attempts": t["attempts"]}
                for t in moderate
            ]
            strong_summary = [
                {"topic": t["topic"], "average_score": t["average_score"], "attempts": t["attempts"]}
                for t in strong
            ]

            prompt = (
                "You are an expert technical career and placement coach. Generate a personalized 4-week placement preparation roadmap for a candidate based on these statistics:\n\n"
                f"Overall Score: {overall_score}%\n"
                f"Weak Topics: {json.dumps(weak_summary, indent=2)}\n"
                f"Moderate Topics: {json.dumps(moderate_summary, indent=2)}\n"
                f"Strong Topics: {json.dumps(strong_summary, indent=2)}\n\n"
                "Please generate a practical, highly actionable 4-week placement preparation plan. "
                "The roadmap must conform to this JSON schema:\n"
                "{\n"
                "  \"duration_weeks\": 4,\n"
                "  \"overall_goal\": \"A clear, personalized placement goal based on current weakness areas\",\n"
                "  \"estimated_hours\": 48,\n"
                "  \"priority_topics\": [\"sorted priority topics to focus on, weakest first\"],\n"
                "  \"weekly_plan\": [\n"
                "    {\n"
                "      \"week\": 1,\n"
                "      \"title\": \"A descriptive title for week 1\",\n"
                "      \"difficulty\": \"Easy|Medium|Hard\",\n"
                "      \"estimated_hours\": 12,\n"
                "      \"topics\": [\"topics covered\"],\n"
                "      \"learning_objectives\": [\"objective 1\", \"objective 2\"],\n"
                "      \"practice_tasks\": [\"practice task 1\", \"practice task 2\"],\n"
                "      \"mock_goal\": \"Mock Interview goal for this week\",\n"
                "      \"completed\": false\n"
                "    }\n"
                "  ],\n"
                "  \"success_metrics\": [\"metric 1\", \"metric 2\"],\n"
                "  \"generated_at\": \"ISO timestamp\"\n"
                "}\n\n"
                "Instructions:\n"
                "- Set default duration to 4 weeks.\n"
                "- Prioritize weakest topics first. Build from fundamentals to advanced concepts.\n"
                "- Include concrete mock interview checkpoints in weekly plans.\n"
                "- Balance study load across weeks (estimated hours should be realistic, e.g. 10-15 per week, totaling around 40-50).\n"
                "- Avoid generic motivational text or preamble; output only raw, valid JSON conforming to the schema.\n"
                "- Ensure every week has unique topics and practice tasks."
            )

            start_gemini = time.perf_counter()
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            duration = time.perf_counter() - start_gemini
            logger.info(f"Gemini completed in {duration:.2f}s")

            cleaned_text = clean_json_response(response.text.strip())
            roadmap_dict = json.loads(cleaned_text)

            # Validate basic JSON keys
            required_keys = ["duration_weeks", "overall_goal", "estimated_hours", "priority_topics", "weekly_plan", "success_metrics"]
            if not all(k in roadmap_dict for k in required_keys):
                raise ValueError("Invalid AI output: missing required schema keys")

            # Force completed = False on all weekly plans
            for week in roadmap_dict.get("weekly_plan", []):
                week["completed"] = False

            roadmap_dict["success"] = True
            roadmap_dict["generated_at"] = datetime.utcnow().isoformat() + "Z"
            return roadmap_dict

        except Exception as exc:
            logger.error(f"Gemini roadmap generation failed: {exc}. Fallback triggered")
            return self._fallback_roadmap(weak, moderate, strong, overall_score)

    def _fallback_roadmap(
        self,
        weak: List[Dict[str, Any]],
        moderate: List[Dict[str, Any]],
        strong: List[Dict[str, Any]],
        overall_score: int
    ) -> Dict[str, Any]:
        """
        A rule-based fallback roadmap generator when Gemini is offline or fails.
        """
        logger.info("Fallback triggered")
        priority_topics = [t["topic"] for t in weak] + [t["topic"] for t in moderate] + [t["topic"] for t in strong]

        # Case 1: Empty database / no history
        if not priority_topics:
            return {
                "success": True,
                "duration_weeks": 4,
                "overall_goal": "Build foundation across core placement topics",
                "estimated_hours": 48,
                "priority_topics": ["Data Structures & Algorithms", "System Design", "Operating Systems", "Computer Networks"],
                "weekly_plan": [
                    {
                        "week": 1,
                        "title": "Master Data Structures & Algorithms",
                        "difficulty": "Medium",
                        "estimated_hours": 12,
                        "topics": ["Arrays", "Linked Lists", "Trees", "Sorting & Searching"],
                        "learning_objectives": ["Understand basic linear data structures", "Analyze time and space complexity"],
                        "practice_tasks": ["Solve 10 Easy-Medium problems on Arrays and Linked Lists", "Implement Bubble and Quick Sort from scratch"],
                        "mock_goal": "Score above 70% in basic DSA mock interview",
                        "completed": False
                    },
                    {
                        "week": 2,
                        "title": "System Design Fundamentals",
                        "difficulty": "Hard",
                        "estimated_hours": 12,
                        "topics": ["System Design Basics", "Scalability", "Load Balancers", "Caching"],
                        "learning_objectives": ["Understand client-server architecture", "Identify single points of failure"],
                        "practice_tasks": ["Design a URL shortener", "Read about Redis caching patterns"],
                        "mock_goal": "Complete a high-level design walkthrough for a chat application",
                        "completed": False
                    },
                    {
                        "week": 3,
                        "title": "Operating Systems & Databases",
                        "difficulty": "Medium",
                        "estimated_hours": 12,
                        "topics": ["Processes & Threads", "Memory Management", "SQL vs NoSQL", "Database Indexing"],
                        "learning_objectives": ["Explain concurrency and thread safety", "Write optimized SQL queries with indexing"],
                        "practice_tasks": ["Practice 20 MCQs on OS scheduling", "Design a schema and write indices for an e-commerce database"],
                        "mock_goal": "Explain SQL joins and indexing in under 5 minutes",
                        "completed": False
                    },
                    {
                        "week": 4,
                        "title": "Computer Networks & Mock Practice",
                        "difficulty": "Medium",
                        "estimated_hours": 12,
                        "topics": ["TCP/IP Model", "HTTP/HTTPS Protocol", "DNS Lookup", "Full Mock Interview"],
                        "learning_objectives": ["Trace a request from browser to server", "Handle behavioral and technical questions calmly"],
                        "practice_tasks": ["Explain TCP 3-way handshake", "Perform 1 complete full-loop mock interview"],
                        "mock_goal": "Achieve an overall score above 80% on a full placement mock",
                        "completed": False
                    }
                ],
                "success_metrics": [
                    "Understand fundamental concepts of OS, DBMS, Networks, and DSA",
                    "Successfully pass mock interview checks with 75%+",
                    "Build confidence in describing high-level system designs"
                ],
                "generated_at": datetime.utcnow().isoformat() + "Z"
            }

        # Case 2: Only one topic (e.g. Python)
        if len(priority_topics) == 1:
            t = priority_topics[0]
            return {
                "success": True,
                "duration_weeks": 4,
                "overall_goal": f"Master {t} from fundamentals to advanced concepts",
                "estimated_hours": 44,
                "priority_topics": [t],
                "weekly_plan": [
                    {
                        "week": 1,
                        "title": f"Fundamentals of {t}",
                        "difficulty": "Easy",
                        "estimated_hours": 10,
                        "topics": [f"{t} Syntax", f"{t} Core Concepts"],
                        "learning_objectives": [f"Understand basic syntax and structure of {t}", "Implement elementary logic patterns"],
                        "practice_tasks": [f"Write 5 basic programs in {t}", f"Review official documentation for {t} fundamentals"],
                        "mock_goal": f"Score above 80% on {t} basic quizzes",
                        "completed": False
                    },
                    {
                        "week": 2,
                        "title": f"Intermediate {t} & Libraries",
                        "difficulty": "Medium",
                        "estimated_hours": 11,
                        "topics": [f"Object-Oriented Programming in {t}", "Error Handling", "Built-in Libraries"],
                        "learning_objectives": ["Apply OOP principles", "Handle exceptions gracefully"],
                        "practice_tasks": [f"Create a small OOP-based project using {t}", "Write unit tests for error handling"],
                        "mock_goal": f"Solve intermediate coding challenges in {t}",
                        "completed": False
                    },
                    {
                        "week": 3,
                        "title": f"Advanced {t} Concepts",
                        "difficulty": "Hard",
                        "estimated_hours": 12,
                        "topics": [f"Advanced features of {t}", "Concurrency & Memory Management"],
                        "learning_objectives": ["Explain advanced memory allocation and performance optimization", "Write concurrent code if supported"],
                        "practice_tasks": [f"Optimize memory usage of a large dataset operations in {t}", "Analyze code complexity and rewrite slow code segments"],
                        "mock_goal": f"Score above 75% on advanced technical interview questions for {t}",
                        "completed": False
                    },
                    {
                        "week": 4,
                        "title": f"Mock Interviews & Edge Cases for {t}",
                        "difficulty": "Hard",
                        "estimated_hours": 11,
                        "topics": [f"Interview-style puzzles in {t}", "Common traps and edge cases"],
                        "learning_objectives": [f"Explain complex design decisions in {t}", f"Solve competitive coding tasks quickly"],
                        "practice_tasks": ["Complete 3 timed coding tests on coding platforms", "Review previous mock interview mistakes"],
                        "mock_goal": f"Pass full-loop mock interview with 80%+",
                        "completed": False
                    }
                ],
                "success_metrics": [
                    f"Confidently write clean, idiomatic {t} code",
                    f"Explain intermediate and advanced mechanisms of {t}",
                    "Successfully pass mock interview evaluations"
                ],
                "generated_at": datetime.utcnow().isoformat() + "Z"
            }

        # Case 3: Many topics (>= 2)
        num_topics = len(priority_topics)
        weekly_topics = [[], [], [], []]
        if num_topics == 2:
            weekly_topics[0] = [priority_topics[0]]
            weekly_topics[1] = [priority_topics[0]]
            weekly_topics[2] = [priority_topics[1]]
            weekly_topics[3] = [priority_topics[1]]
        elif num_topics == 3:
            weekly_topics[0] = [priority_topics[0]]
            weekly_topics[1] = [priority_topics[1]]
            weekly_topics[2] = [priority_topics[2]]
            weekly_topics[3] = [priority_topics[0], priority_topics[1]]  # Revision
        else:
            for idx, item in enumerate(priority_topics):
                w_idx = min(idx, 3)
                weekly_topics[w_idx].append(item)

        weekly_plan = []
        for w in range(1, 5):
            w_topics = weekly_topics[w - 1]
            topics_str = ", ".join(w_topics)
            difficulty = "Medium"
            if w == 1:
                difficulty = "Medium" if any(t in [tk["topic"] for tk in weak] for t in w_topics) else "Easy"
            elif w == 2:
                difficulty = "Medium"
            else:
                difficulty = "Hard"

            weekly_plan.append({
                "week": w,
                "title": f"Focus on {topics_str}" if w < 4 else f"Advanced Practice & Revision of {topics_str}",
                "difficulty": difficulty,
                "estimated_hours": 12,
                "topics": w_topics,
                "learning_objectives": [f"Master core interview questions on {t}" for t in w_topics],
                "practice_tasks": [f"Solve 5 questions and write standard algorithms for {t}" for t in w_topics],
                "mock_goal": f"Score above 70% on mock sessions containing {w_topics[0]}",
                "completed": False
            })

        return {
            "success": True,
            "duration_weeks": 4,
            "overall_goal": f"Strengthen fundamentals in {priority_topics[0]} and optimize prep in {', '.join(priority_topics[1:3])}",
            "estimated_hours": 48,
            "priority_topics": priority_topics,
            "weekly_plan": weekly_plan,
            "success_metrics": [
                f"Improve performance in weak topic {priority_topics[0]}",
                f"Acquire interview readiness in {', '.join(priority_topics[:min(3, num_topics)])}",
                "Consistently clear mock interviews with increasing scores"
            ],
            "generated_at": datetime.utcnow().isoformat() + "Z"
        }
