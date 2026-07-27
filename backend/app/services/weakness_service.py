import os
import time
import json
import logging
from datetime import datetime
from typing import List, Dict, Any, Tuple, Optional
import google.generativeai as genai

from app.utils.db import get_db_connection
from app.utils.text_helpers import clean_json_response
from app.schemas.weakness_schema import TopicDetails, AnalysisMetadata, WeaknessAnalysisResponse

logger = logging.getLogger(__name__)

# Configurable constants for topic classification
STRONG_THRESHOLD = 80
MODERATE_THRESHOLD = 60

class WeaknessService:
    def get_weakness_analysis(self) -> WeaknessAnalysisResponse:
        """
        Orchestrates Weakness Detection: fetches aggregated topic data, classifies
        topics into Strong/Moderate/Weak, generates AI-powered recommendations,
        and constructs the metadata.
        """
        start_time = time.perf_counter()
        logger.info("Starting Weakness Detection analysis")

        # 1. Aggregate and group topic statistics
        overall_score, topic_stats = self.aggregate_topic_data()
        
        # 2. Classify topics into Strong, Moderate, and Weak lists
        strong_topics, moderate_topics, weak_topics = self.classify_topics(topic_stats)
        
        # Determine strongest and weakest topics
        strongest_topic = None
        weakest_topic = None
        
        if topic_stats:
            sorted_by_score = sorted(topic_stats.values(), key=lambda x: x["average_score"])
            weakest_topic = sorted_by_score[0]["topic"]
            strongest_topic = sorted_by_score[-1]["topic"]

        # 3. Generate AI recommendations (with fallback)
        recommendations = self.generate_ai_recommendations(
            strong=strong_topics,
            moderate=moderate_topics,
            weak=weak_topics,
            strongest_topic=strongest_topic,
            weakest_topic=weakest_topic,
            overall_score=overall_score
        )

        total_questions = sum(t["attempts"] for t in topic_stats.values())
        analysis_timestamp = datetime.utcnow().isoformat() + "Z"

        metadata = AnalysisMetadata(
            total_topics=len(topic_stats),
            total_questions=total_questions,
            strongest_topic=strongest_topic,
            weakest_topic=weakest_topic,
            analysis_timestamp=analysis_timestamp
        )

        execution_time = time.perf_counter() - start_time
        logger.info(
            f"Finished Weakness Detection in {execution_time:.3f}s. "
            f"Processed {len(topic_stats)} topics across {total_questions} questions."
        )

        return WeaknessAnalysisResponse(
            success=True,
            overall_score=overall_score,
            strong_topics=[TopicDetails(**t) for t in strong_topics],
            moderate_topics=[TopicDetails(**t) for t in moderate_topics],
            weak_topics=[TopicDetails(**t) for t in weak_topics],
            recommendations=recommendations,
            metadata=metadata
        )

    def aggregate_topic_data(self) -> Tuple[int, Dict[str, Dict[str, Any]]]:
        """
        Retrieves all valid interview message data from completed interviews, groups them,
        and computes statistics chronologically for each topic to avoid N+1 query patterns.
        """
        conn = get_db_connection()
        topic_stats = {}
        overall_score = 0
        
        try:
            cursor = conn.cursor()

            # Retrieve overall score average from completed sessions
            cursor.execute(
                "SELECT AVG(COALESCE(overall_score, score)) as avg_score "
                "FROM interviews "
                "WHERE is_complete = 1"
            )
            overall_row = cursor.fetchone()
            overall_score = round(overall_row["avg_score"] or 0)

            # Retrieve all questions from completed interviews
            cursor.execute(
                """
                SELECT m.topic, m.score, m.created_at, m.id
                FROM interview_messages m
                JOIN interviews i ON m.interview_id = i.id
                WHERE i.is_complete = 1 
                  AND m.score IS NOT NULL
                ORDER BY m.created_at ASC, m.id ASC
                """
            )
            rows = cursor.fetchall()
            logger.info(f"Retrieved {len(rows)} interview questions for topic aggregation.")

            # Group questions by topic
            topic_groups = {}
            for row in rows:
                topic_name = (row["topic"] or "").strip()
                # Clean up/validate topic name
                if not topic_name:
                    topic_name = "General"
                
                score = row["score"]
                # Validate score range
                if score < 0 or score > 100:
                    logger.warning(f"Clamping out of bounds score {score} for topic {topic_name}")
                    score = max(0, min(100, score))
                
                if topic_name not in topic_groups:
                    topic_groups[topic_name] = []
                topic_groups[topic_name].append(score)

            # Compute stats per topic
            for topic, scores in topic_groups.items():
                attempts = len(scores)
                avg_score = round(sum(scores) / attempts)
                highest = max(scores)
                lowest = min(scores)
                
                last_score = scores[-1] if attempts >= 1 else None
                prev_score = scores[-2] if attempts >= 2 else None
                
                if prev_score is not None:
                    improvement = float(last_score - prev_score)
                    if improvement > 0:
                        trend = "Improving"
                    elif improvement < 0:
                        trend = "Declining"
                    else:
                        trend = "Stable"
                else:
                    improvement = None
                    trend = "Stable" if attempts == 1 else "No Trend"

                topic_stats[topic] = {
                    "topic": topic,
                    "average_score": avg_score,
                    "highest_score": highest,
                    "lowest_score": lowest,
                    "attempts": attempts,
                    "recent_trend": trend,
                    "last_score": last_score,
                    "prev_score": prev_score,
                    "improvement_percent": improvement
                }

        except Exception as exc:
            logger.error(f"Failed aggregating topic stats from database: {exc}", exc_info=True)
            # Re-raise to let router handle or fallback
            raise exc
        finally:
            conn.close()

        return overall_score, topic_stats

    def classify_topics(self, topic_stats: Dict[str, Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Classifies topic stats dictionary into Strong, Moderate, and Weak lists
        based on configurable threshold constants.
        """
        strong = []
        moderate = []
        weak = []

        for topic_name, stats in topic_stats.items():
            avg_score = stats["average_score"]
            if avg_score >= STRONG_THRESHOLD:
                strong.append(stats)
            elif avg_score >= MODERATE_THRESHOLD:
                moderate.append(stats)
            else:
                weak.append(stats)

        # Sort each list by average score descending for consistent rendering
        strong.sort(key=lambda x: x["average_score"], reverse=True)
        moderate.sort(key=lambda x: x["average_score"], reverse=True)
        weak.sort(key=lambda x: x["average_score"], reverse=True)

        logger.info(
            f"Classified topics: {len(strong)} Strong, "
            f"{len(moderate)} Moderate, {len(weak)} Weak."
        )
        return strong, moderate, weak

    def generate_ai_recommendations(
        self,
        strong: List[Dict[str, Any]],
        moderate: List[Dict[str, Any]],
        weak: List[Dict[str, Any]],
        strongest_topic: Optional[str],
        weakest_topic: Optional[str],
        overall_score: int
    ) -> List[str]:
        """
        Sends summarized topic statistics to the Gemini LLM to generate placement prep advice.
        If no API key exists or the LLM call fails, falls back to a local rules engine.
        """
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            logger.warning("No Gemini API key found. Using fallback rules engine for recommendations.")
            return self._fallback_recommendations(moderate, weak)

        try:
            logger.info("Invoking Gemini to generate weakness recommendations")
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-2.5-flash")

            # Build summarized stats payload to avoid sending raw interview answers
            summary_stats = []
            for item in weak + moderate:
                summary_stats.append({
                    "topic": item["topic"],
                    "average_score": item["average_score"],
                    "attempts": item["attempts"],
                    "recent_trend": item["recent_trend"]
                })

            prompt = (
                "You are an expert technical career and placement coach. Review the following summarized topic statistics for a candidate:\n\n"
                f"Overall Score: {overall_score}%\n"
                f"Strongest Topic: {strongest_topic or 'N/A'}\n"
                f"Weakest Topic: {weakest_topic or 'N/A'}\n"
                f"Summarized Topic Data: {json.dumps(summary_stats, indent=2)}\n\n"
                "Please generate exactly 3-5 concise, highly actionable, placement-oriented recommendations. "
                "For weak and moderate areas, ensure your recommendations cover:\n"
                "- Weakness explanation & missing concepts to study.\n"
                "- Interview expectations for that topic.\n"
                "- Recommended study order & practice advice.\n\n"
                "Output MUST be a JSON list of strings, for example:\n"
                "[\n"
                "  \"Recommendation 1...\",\n"
                "  \"Recommendation 2...\"\n"
                "]\n\n"
                "Do not include any markdown formatting, wrappers, or backticks; output only the raw JSON array."
            )

            start_gemini = time.perf_counter()
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            duration = time.perf_counter() - start_gemini
            logger.info(f"Gemini recommendations generated in {duration:.2f}s")

            cleaned_text = clean_json_response(response.text.strip())
            recommendations = json.loads(cleaned_text)
            
            if isinstance(recommendations, list) and len(recommendations) > 0:
                return [str(r) for r in recommendations]
            
            logger.warning("Gemini did not return a valid list. Falling back to local rules engine.")
            return self._fallback_recommendations(moderate, weak)

        except Exception as exc:
            logger.error(f"Gemini call failed during recommendation generation: {exc}", exc_info=True)
            return self._fallback_recommendations(moderate, weak)

    def _fallback_recommendations(self, moderate: List[Dict[str, Any]], weak: List[Dict[str, Any]]) -> List[str]:
        """
        A rule-based fallback recommendation generator used when the Gemini API is offline/unavailable.
        """
        logger.info("Generating fallback recommendations based on topic scores.")
        recommendations = []

        if not weak and not moderate:
            return [
                "Great job! You don't have any moderate or weak topics yet. Complete more mock interviews to challenge yourself and build placement data.",
                "To prepare further, try practicing advanced topics or increase the difficulty level of your coding questions."
            ]

        # Prioritize weak topics
        for item in weak[:2]:
            topic = item["topic"]
            score = item["average_score"]
            attempts = item["attempts"]
            recommendations.append(
                f"Prioritize rebuilding fundamentals in **{topic}** (Avg: {score}% over {attempts} attempts). "
                f"Focus on key concepts, study standard interview expectations, and practice basic exercises before trying complex scenarios."
            )

        # Handle moderate topics
        for item in moderate[:2]:
            topic = item["topic"]
            score = item["average_score"]
            attempts = item["attempts"]
            recommendations.append(
                f"Bridge the gap in **{topic}** (Avg: {score}% over {attempts} attempts). "
                f"You have a solid base, but you need to practice edge-case questions, read up on advanced architectures, and optimize your solution times."
            )

        # Add general mock recommendation if list is short
        if len(recommendations) < 3:
            recommendations.append(
                "Maintain a consistent mock interview loop. Use detailed answer feedback to review exact definitions and improve explanations."
            )

        return recommendations
