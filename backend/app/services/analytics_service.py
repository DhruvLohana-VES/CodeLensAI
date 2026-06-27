import logging
from app.utils.db import get_db_connection

logger = logging.getLogger(__name__)

class AnalyticsService:
    def get_analytics(self) -> dict:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            
            # 1. Total Completed Sessions
            cursor.execute("SELECT COUNT(*) as total FROM interviews WHERE is_complete = 1")
            total_sessions = cursor.fetchone()["total"]
            
            if total_sessions == 0:
                return {
                    "average_score": 0,
                    "total_sessions": 0,
                    "best_topic": None,
                    "weakest_topic": None,
                    "strong_topics": [],
                    "weak_topics": [],
                    "performance_trend": [],
                    "topic_scores": {}
                }
            
            # 2. Average Score of all Completed Sessions
            cursor.execute("SELECT AVG(COALESCE(overall_score, score)) as avg_score FROM interviews WHERE is_complete = 1")
            average_score = round(cursor.fetchone()["avg_score"] or 0)
            
            # 3. Topic scores (for completed sessions only)
            cursor.execute(
                """
                SELECT m.topic, AVG(m.score) as avg_score
                FROM interview_messages m
                JOIN interviews i ON m.interview_id = i.id
                WHERE i.is_complete = 1 AND m.topic IS NOT NULL AND m.topic != '' AND m.score IS NOT NULL
                GROUP BY m.topic
                """
            )
            topic_rows = cursor.fetchall()
            
            topic_scores = {}
            strong_topics = []
            weak_topics = []
            best_topic = None
            weakest_topic = None
            
            if topic_rows:
                # Convert to dict and find best/weakest
                sorted_topics = []
                for row in topic_rows:
                    topic = row["topic"]
                    avg_score = round(row["avg_score"])
                    topic_scores[topic] = avg_score
                    sorted_topics.append((topic, avg_score))
                    
                    if avg_score >= 70:
                        strong_topics.append(topic)
                    else:
                        weak_topics.append(topic)
                
                # Sort to find best/weakest
                sorted_topics.sort(key=lambda x: x[1])
                weakest_topic = sorted_topics[0][0]
                best_topic = sorted_topics[-1][0]
                
            # 4. Performance Trend
            cursor.execute(
                """
                SELECT COALESCE(overall_score, score) as score_val, created_at
                FROM interviews
                WHERE is_complete = 1
                ORDER BY created_at ASC, rowid ASC
                """
            )
            trend_rows = cursor.fetchall()
            performance_trend = []
            for idx, row in enumerate(trend_rows, start=1):
                performance_trend.append({
                    "interview": idx,
                    "score": row["score_val"]
                })
                
            return {
                "average_score": average_score,
                "total_sessions": total_sessions,
                "best_topic": best_topic,
                "weakest_topic": weakest_topic,
                "strong_topics": strong_topics,
                "weak_topics": weak_topics,
                "performance_trend": performance_trend,
                "topic_scores": topic_scores
            }
        except Exception as exc:
            logger.error(f"Error computing analytics metrics: {exc}", exc_info=True)
            raise exc
        finally:
            conn.close()
