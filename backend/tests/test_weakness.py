import os
import sys
import unittest
import tempfile
import sqlite3

# Adjust paths to import backend app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import app.utils.db
# Override the database path to a temp file for safety
temp_db_fd, temp_db_path = tempfile.mkstemp()
app.utils.db.DB_PATH = temp_db_path

from app.utils.db import init_db, get_db_connection
from app.services.interview_service import InterviewService
from app.services.weakness_service import WeaknessService, STRONG_THRESHOLD, MODERATE_THRESHOLD

class TestWeaknessService(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        cls.interview_service = InterviewService()
        cls.weakness_service = WeaknessService()

    @classmethod
    def tearDownClass(cls):
        os.close(temp_db_fd)
        try:
            os.remove(temp_db_path)
        except OSError:
            pass

    def setUp(self):
        # Clear database records between tests
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM interview_messages")
        cursor.execute("DELETE FROM interviews")
        conn.commit()
        conn.close()

    def test_empty_database(self):
        # Run weakness analysis when database has no records
        res = self.weakness_service.get_weakness_analysis()
        self.assertTrue(res.success)
        self.assertEqual(res.overall_score, 0)
        self.assertEqual(len(res.strong_topics), 0)
        self.assertEqual(len(res.moderate_topics), 0)
        self.assertEqual(len(res.weak_topics), 0)
        self.assertEqual(res.metadata.total_topics, 0)
        self.assertEqual(res.metadata.total_questions, 0)
        self.assertIsNone(res.metadata.strongest_topic)
        self.assertIsNone(res.metadata.weakest_topic)
        self.assertTrue(len(res.recommendations) > 0)
        self.assertIn("mock interview", res.recommendations[0])

    def test_statistics_and_trends(self):
        # Insert completed interviews and questions to verify score math & trends
        conn = get_db_connection()
        cursor = conn.cursor()

        # Session 1: completed, score 80
        cursor.execute(
            "INSERT INTO interviews (id, role, current_question_index, is_complete, score, overall_score) VALUES (?, ?, ?, ?, ?, ?)",
            ("session_1", "Frontend", 3, 1, 80, 80)
        )
        # Topics attempts:
        # React: score 90 (first)
        # CSS: score 70 (first)
        cursor.execute(
            "INSERT INTO interview_messages (interview_id, question, answer, feedback, score, topic) VALUES (?, ?, ?, ?, ?, ?)",
            ("session_1", "Q1", "A1", "F1", 90, "React")
        )
        cursor.execute(
            "INSERT INTO interview_messages (interview_id, question, answer, feedback, score, topic) VALUES (?, ?, ?, ?, ?, ?)",
            ("session_1", "Q2", "A2", "F2", 70, "CSS")
        )

        # Session 2: completed, score 75
        cursor.execute(
            "INSERT INTO interviews (id, role, current_question_index, is_complete, score, overall_score) VALUES (?, ?, ?, ?, ?, ?)",
            ("session_2", "Frontend", 3, 1, 75, 75)
        )
        # React: score 95 (second attempt -> Improving)
        # CSS: score 60 (second attempt -> Declining)
        # DB: score 50 (first attempt -> Stable)
        cursor.execute(
            "INSERT INTO interview_messages (interview_id, question, answer, feedback, score, topic) VALUES (?, ?, ?, ?, ?, ?)",
            ("session_2", "Q3", "A3", "F3", 95, "React")
        )
        cursor.execute(
            "INSERT INTO interview_messages (interview_id, question, answer, feedback, score, topic) VALUES (?, ?, ?, ?, ?, ?)",
            ("session_2", "Q4", "A4", "F4", 60, "CSS")
        )
        cursor.execute(
            "INSERT INTO interview_messages (interview_id, question, answer, feedback, score, topic) VALUES (?, ?, ?, ?, ?, ?)",
            ("session_2", "Q5", "A5", "F5", 50, "DB")
        )

        # Session 3: incomplete (should NOT be included in metrics)
        cursor.execute(
            "INSERT INTO interviews (id, role, current_question_index, is_complete, score, overall_score) VALUES (?, ?, ?, ?, ?, ?)",
            ("session_3", "Backend", 1, 0, 0, 0)
        )
        cursor.execute(
            "INSERT INTO interview_messages (interview_id, question, answer, feedback, score, topic) VALUES (?, ?, ?, ?, ?, ?)",
            ("session_3", "Q6", "A6", "F6", 100, "React")
        )
        
        conn.commit()
        conn.close()

        # Run Analysis
        res = self.weakness_service.get_weakness_analysis()
        self.assertTrue(res.success)
        # overall_score average: round((80 + 75) / 2) = 78
        self.assertEqual(res.overall_score, 78)
        
        # Total valid questions: 2 in session_1 + 3 in session_2 = 5
        self.assertEqual(res.metadata.total_questions, 5)
        self.assertEqual(res.metadata.total_topics, 3) # React, CSS, DB

        # Check React topic details (Strong: avg 93 >= 80)
        react_details = next((t for t in res.strong_topics if t.topic == "React"), None)
        self.assertIsNotNone(react_details)
        self.assertEqual(react_details.average_score, 92) # round((90+95)/2)
        self.assertEqual(react_details.highest_score, 95)
        self.assertEqual(react_details.lowest_score, 90)
        self.assertEqual(react_details.attempts, 2)
        self.assertEqual(react_details.recent_trend, "Improving")
        self.assertEqual(react_details.last_score, 95)
        self.assertEqual(react_details.prev_score, 90)
        self.assertEqual(react_details.improvement_percent, 5.0)

        # Check CSS topic details (Moderate: avg 65 >= 60)
        css_details = next((t for t in res.moderate_topics if t.topic == "CSS"), None)
        self.assertIsNotNone(css_details)
        self.assertEqual(css_details.average_score, 65) # round((70+60)/2)
        self.assertEqual(css_details.recent_trend, "Declining")
        self.assertEqual(css_details.last_score, 60)
        self.assertEqual(css_details.prev_score, 70)
        self.assertEqual(css_details.improvement_percent, -10.0)

        # Check DB topic details (Weak: avg 50 < 60)
        db_details = next((t for t in res.weak_topics if t.topic == "DB"), None)
        self.assertIsNotNone(db_details)
        self.assertEqual(db_details.average_score, 50)
        self.assertEqual(db_details.attempts, 1)
        self.assertEqual(db_details.recent_trend, "Stable")

        # Metadata strongest and weakest
        self.assertEqual(res.metadata.strongest_topic, "React")
        self.assertEqual(res.metadata.weakest_topic, "DB")

        # Recommendations contain details
        self.assertTrue(len(res.recommendations) > 0)
        # Check rule fallback contents
        self.assertTrue(any("DB" in r for r in res.recommendations))
        self.assertTrue(any("CSS" in r for r in res.recommendations))

    def test_invalid_records_handling(self):
        # Test how service handles out of bounds scores or empty topics
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            "INSERT INTO interviews (id, role, current_question_index, is_complete, score, overall_score) VALUES (?, ?, ?, ?, ?, ?)",
            ("session_v", "Backend", 2, 1, 50, 50)
        )
        # Invalid score 150 (should be clamped to 100)
        cursor.execute(
            "INSERT INTO interview_messages (interview_id, question, answer, feedback, score, topic) VALUES (?, ?, ?, ?, ?, ?)",
            ("session_v", "Q1", "A1", "F1", 150, "Docker")
        )
        # Empty topic name (should default to "General")
        cursor.execute(
            "INSERT INTO interview_messages (interview_id, question, answer, feedback, score, topic) VALUES (?, ?, ?, ?, ?, ?)",
            ("session_v", "Q2", "A2", "F2", 65, "")
        )
        # Null topic name (should be skipped or default to General, here we default empty to General, let's see null topic)
        cursor.execute(
            "INSERT INTO interview_messages (interview_id, question, answer, feedback, score, topic) VALUES (?, ?, ?, ?, ?, ?)",
            ("session_v", "Q3", "A3", "F3", 40, None)
        )
        
        conn.commit()
        conn.close()

        res = self.weakness_service.get_weakness_analysis()
        self.assertTrue(res.success)
        
        # Valid topics should be Docker (score 100 clamped) and General (grouping empty and null topics)
        self.assertEqual(res.metadata.total_topics, 2)
        
        docker_details = next((t for t in res.strong_topics if t.topic == "Docker"), None)
        self.assertIsNotNone(docker_details)
        self.assertEqual(docker_details.average_score, 100) # Clamped from 150

        general_details = next((t for t in res.weak_topics if t.topic == "General"), None)
        self.assertIsNotNone(general_details)
        self.assertEqual(general_details.average_score, 52)
