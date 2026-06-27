import os
import sys
import unittest
import tempfile
import json
import sqlite3

# Adjust paths
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import app.utils.db
# Override the database path to a temp file for safety
temp_db_fd, temp_db_path = tempfile.mkstemp()
app.utils.db.DB_PATH = temp_db_path

from app.utils.db import init_db, get_db_connection
from app.services.interview_service import InterviewService
from app.services.analytics_service import AnalyticsService

class TestHistoryAnalytics(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        cls.interview_service = InterviewService()
        cls.analytics_service = AnalyticsService()

    @classmethod
    def tearDownClass(cls):
        os.close(temp_db_fd)
        try:
            os.remove(temp_db_path)
        except OSError:
            pass

    def test_e2e_interview_and_analytics(self):
        # 1. Verify history starts empty
        history, total = self.interview_service.get_history(page=1, limit=5)
        self.assertEqual(total, 0)
        self.assertEqual(len(history), 0)

        # 2. Start session 1 (Frontend role)
        start_res_1 = self.interview_service.start_interview("Frontend")
        self.assertEqual(start_res_1.role, "Frontend")
        self.assertEqual(start_res_1.question_index, 0)
        self.assertEqual(start_res_1.total_questions, 3)
        self.assertFalse(start_res_1.is_complete)
        session_id_1 = start_res_1.session_id

        # 3. Submit first answer (score 80)
        # Override _grade_answer for deterministic testing
        self.interview_service._grade_answer = lambda q, a, kw: (80, "Good job on React rendering.")
        sub_res_1_1 = self.interview_service.submit_answer(session_id_1, "Virtual DOM reconciles changes in memory...")
        self.assertEqual(sub_res_1_1.score, 80)
        self.assertEqual(sub_res_1_1.question_index, 1)
        self.assertFalse(sub_res_1_1.is_complete)

        # 4. Check that incomplete interview is NOT included in analytics
        analytics = self.analytics_service.get_analytics()
        self.assertEqual(analytics["total_sessions"], 0)
        self.assertEqual(analytics["average_score"], 0)

        # 5. Complete session 1 (scores: 80, 90, 70 -> overall average: 80)
        self.interview_service._grade_answer = lambda q, a, kw: (90, "Excellent Box Model explanation.")
        sub_res_1_2 = self.interview_service.submit_answer(session_id_1, "Box model includes content, padding, border...")
        
        self.interview_service._grade_answer = lambda q, a, kw: (70, "Good comparison of CSR/SSR.")
        sub_res_1_3 = self.interview_service.submit_answer(session_id_1, "CSR loads empty container, SSR renders HTML on server...")
        self.assertTrue(sub_res_1_3.is_complete)
        self.assertEqual(sub_res_1_3.overall_score, 80)

        # 6. Start session 2 (Backend role) and complete it (scores: 60, 50, 70 -> overall average: 60)
        start_res_2 = self.interview_service.start_interview("Backend")
        session_id_2 = start_res_2.session_id

        self.interview_service._grade_answer = lambda q, a, kw: (60, "Connection pool reuse limits handshake overhead.")
        self.interview_service.submit_answer(session_id_2, "Connection pool is a cache.")

        self.interview_service._grade_answer = lambda q, a, kw: (50, "CORS stops cross origin calls unless permitted.")
        self.interview_service.submit_answer(session_id_2, "CORS is for headers.")

        self.interview_service._grade_answer = lambda q, a, kw: (70, "SQL has schemas, NoSQL is flexible.")
        sub_res_2_3 = self.interview_service.submit_answer(session_id_2, "SQL vs NoSQL description.")
        self.assertTrue(sub_res_2_3.is_complete)
        self.assertEqual(sub_res_2_3.overall_score, 60)

        # 7. Start session 3 (Full Stack role) but leave it INCOMPLETE
        start_res_3 = self.interview_service.start_interview("Full Stack")
        session_id_3 = start_res_3.session_id
        
        # Submit one answer (score 95)
        self.interview_service._grade_answer = lambda q, a, kw: (95, "stateless authentication with JWT signature is clean.")
        self.interview_service.submit_answer(session_id_3, "JWT are encoded payloads signed by server.")

        # 8. Check History (should show 3 sessions in history: completed and incomplete)
        history, total = self.interview_service.get_history(page=1, limit=10)
        self.assertEqual(total, 3)
        self.assertEqual(len(history), 3)
        # Newest first
        self.assertEqual(history[0]["id"], session_id_3)  # Incomplete Full Stack
        self.assertEqual(history[1]["id"], session_id_2)  # Completed Backend
        self.assertEqual(history[2]["id"], session_id_1)  # Completed Frontend

        # Test pagination (limit=1)
        history_p1, total = self.interview_service.get_history(page=1, limit=1)
        self.assertEqual(total, 3)
        self.assertEqual(len(history_p1), 1)
        self.assertEqual(history_p1[0]["id"], session_id_3)

        history_p2, total = self.interview_service.get_history(page=2, limit=1)
        self.assertEqual(total, 3)
        self.assertEqual(len(history_p2), 1)
        self.assertEqual(history_p2[0]["id"], session_id_2)

        # 9. Check Details of session 1
        details = self.interview_service.get_details(session_id_1)
        self.assertEqual(details["interview"]["id"], session_id_1)
        self.assertEqual(details["interview"]["mode"], "Frontend")
        self.assertEqual(details["interview"]["overall_score"], 80)
        self.assertEqual(len(details["questions"]), 3)
        self.assertEqual(details["questions"][0]["score"], 80)
        self.assertEqual(details["questions"][1]["score"], 90)
        self.assertEqual(details["questions"][2]["score"], 70)
        self.assertEqual(details["questions"][0]["topic"], "React rendering architecture")

        # 10. Check Analytics Calculations (MUST exclude incomplete session 3!)
        # Only sessions 1 (80) and 2 (60) are completed.
        # Average score: (80 + 60) / 2 = 70.
        # Total completed sessions: 2.
        # Topics completed:
        # React rendering architecture (80)
        # CSS layouts (90)
        # Web architecture (70)
        # Database connectivity (60)
        # Security protocols (50)
        # Database design (70)
        # Note: Stateless Auth from session 3 is EXCLUDED!
        analytics = self.analytics_service.get_analytics()
        
        self.assertEqual(analytics["total_sessions"], 2)
        self.assertEqual(analytics["average_score"], 70)
        
        # Verify topics
        topic_scores = analytics["topic_scores"]
        self.assertNotIn("Stateless Auth", topic_scores)  # Excluded since session 3 is incomplete!
        self.assertEqual(topic_scores["React rendering architecture"], 80)
        self.assertEqual(topic_scores["CSS layouts"], 90)
        self.assertEqual(topic_scores["Security protocols"], 50)
        
        # Strong topics (>= 70): React rendering (80), CSS layouts (90), Web architecture (70), Database design (70)
        # Weak topics (< 70): Database connectivity (60), Security protocols (50)
        self.assertIn("CSS layouts", analytics["strong_topics"])
        self.assertIn("Security protocols", analytics["weak_topics"])
        
        # Best and weakest
        self.assertEqual(analytics["best_topic"], "CSS layouts")  # 90
        self.assertEqual(analytics["weakest_topic"], "Security protocols")  # 50

        # Trend (sessions 1 and 2 completed chronologically)
        trend = analytics["performance_trend"]
        self.assertEqual(len(trend), 2)
        self.assertEqual(trend[0]["interview"], 1)
        self.assertEqual(trend[0]["score"], 80)
        self.assertEqual(trend[1]["interview"], 2)
        self.assertEqual(trend[1]["score"], 60)

        print("\nAll integration test cases passed successfully.")

if __name__ == "__main__":
    unittest.main()
