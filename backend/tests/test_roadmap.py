import os
import sys
import unittest
import tempfile
import json
from unittest.mock import patch, MagicMock

# Adjust paths to import backend app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import app.utils.db
# Override the database path to a temp file for safety
temp_db_fd, temp_db_path = tempfile.mkstemp()
app.utils.db.DB_PATH = temp_db_path

from app.utils.db import init_db, get_db_connection
from app.services.roadmap_service import RoadmapService

class TestRoadmapService(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        init_db()
        cls.roadmap_service = RoadmapService()

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
        cursor.execute("DELETE FROM roadmaps")
        cursor.execute("DELETE FROM interview_messages")
        cursor.execute("DELETE FROM interviews")
        conn.commit()
        conn.close()

    def test_empty_database_roadmap(self):
        # When no interview history exists, should return deterministic fallback roadmap
        res = self.roadmap_service.get_or_generate_roadmap()
        self.assertTrue(res.success)
        self.assertEqual(res.duration_weeks, 4)
        self.assertTrue(len(res.priority_topics) > 0)
        self.assertEqual(len(res.weekly_plan), 4)
        self.assertTrue("Algorithms" in res.overall_goal or "foundation" in res.overall_goal.lower())

    def test_only_one_topic_roadmap(self):
        # Insert completed interview and one question to verify focus on one topic
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO interviews (id, role, current_question_index, is_complete, score, overall_score) VALUES (?, ?, ?, ?, ?, ?)",
            ("session_1", "Python Developer", 1, 1, 90, 90)
        )
        cursor.execute(
            "INSERT INTO interview_messages (interview_id, question, answer, feedback, score, topic) VALUES (?, ?, ?, ?, ?, ?)",
            ("session_1", "Q1", "A1", "F1", 90, "Python")
        )
        conn.commit()
        conn.close()

        res = self.roadmap_service.get_or_generate_roadmap()
        self.assertTrue(res.success)
        self.assertEqual(res.duration_weeks, 4)
        self.assertEqual(res.priority_topics, ["Python"])
        for plan in res.weekly_plan:
            self.assertTrue(any("Python" in t for t in plan.topics))

    def test_many_topics_roadmap(self):
        # Insert completed interviews and multiple questions
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO interviews (id, role, current_question_index, is_complete, score, overall_score) VALUES (?, ?, ?, ?, ?, ?)",
            ("session_1", "Fullstack", 2, 1, 70, 70)
        )
        cursor.execute(
            "INSERT INTO interview_messages (interview_id, question, answer, feedback, score, topic) VALUES (?, ?, ?, ?, ?, ?)",
            ("session_1", "Q1", "A1", "F1", 50, "React") # Weak
        )
        cursor.execute(
            "INSERT INTO interview_messages (interview_id, question, answer, feedback, score, topic) VALUES (?, ?, ?, ?, ?, ?)",
            ("session_1", "Q2", "A2", "F2", 85, "Python") # Strong
        )
        cursor.execute(
            "INSERT INTO interview_messages (interview_id, question, answer, feedback, score, topic) VALUES (?, ?, ?, ?, ?, ?)",
            ("session_1", "Q3", "A3", "F3", 65, "Databases") # Moderate
        )
        conn.commit()
        conn.close()

        res = self.roadmap_service.get_or_generate_roadmap()
        self.assertTrue(res.success)
        self.assertEqual(res.duration_weeks, 4)
        # Should prioritize weakest topic React, then Databases, then Python
        self.assertEqual(res.priority_topics, ["React", "Databases", "Python"])
        self.assertEqual(len(res.weekly_plan), 4)

    @patch("google.generativeai.GenerativeModel")
    @patch.dict(os.environ, {"GEMINI_API_KEY": "fake_key"})
    def test_gemini_generation_success(self, mock_gen_model):
        # Set up a completed interview session so we have data
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO interviews (id, role, current_question_index, is_complete, score, overall_score) VALUES (?, ?, ?, ?, ?, ?)",
            ("session_1", "Fullstack", 1, 1, 80, 80)
        )
        cursor.execute(
            "INSERT INTO interview_messages (interview_id, question, answer, feedback, score, topic) VALUES (?, ?, ?, ?, ?, ?)",
            ("session_1", "Q1", "A1", "F1", 40, "Docker")
        )
        conn.commit()
        conn.close()

        # Mock the model output
        mock_model_instance = MagicMock()
        mock_gen_model.return_value = mock_model_instance
        
        mock_response = MagicMock()
        mock_response.text = json.dumps({
            "duration_weeks": 4,
            "overall_goal": "Master Docker Containers",
            "estimated_hours": 40,
            "priority_topics": ["Docker"],
            "weekly_plan": [
                {
                    "week": 1,
                    "title": "Docker Basics",
                    "difficulty": "Easy",
                    "estimated_hours": 10,
                    "topics": ["Docker"],
                    "learning_objectives": ["Understand containers"],
                    "practice_tasks": ["Run a container"],
                    "mock_goal": "Mock practice Docker",
                    "completed": False
                },
                {
                    "week": 2,
                    "title": "Docker Compose",
                    "difficulty": "Medium",
                    "estimated_hours": 10,
                    "topics": ["Docker Compose"],
                    "learning_objectives": ["Compose files"],
                    "practice_tasks": ["Compose up"],
                    "mock_goal": "Mock compose practice",
                    "completed": False
                },
                {
                    "week": 3,
                    "title": "Docker Volumes",
                    "difficulty": "Medium",
                    "estimated_hours": 10,
                    "topics": ["Volumes"],
                    "learning_objectives": ["Data volumes"],
                    "practice_tasks": ["Mount a volume"],
                    "mock_goal": "Mock volume practice",
                    "completed": False
                },
                {
                    "week": 4,
                    "title": "Docker Security",
                    "difficulty": "Hard",
                    "estimated_hours": 10,
                    "topics": ["Security"],
                    "learning_objectives": ["Secure containers"],
                    "practice_tasks": ["Run as non-root"],
                    "mock_goal": "Docker final mock",
                    "completed": False
                }
            ],
            "success_metrics": ["Understand Docker thoroughly"]
        })
        mock_model_instance.generate_content.return_value = mock_response

        res = self.roadmap_service.get_or_generate_roadmap()
        self.assertTrue(res.success)
        self.assertEqual(res.overall_goal, "Master Docker Containers")
        self.assertEqual(res.estimated_hours, 40)
        self.assertEqual(res.priority_topics, ["Docker"])
        self.assertEqual(res.weekly_plan[0].title, "Docker Basics")

    @patch("google.generativeai.GenerativeModel")
    @patch.dict(os.environ, {"GEMINI_API_KEY": "fake_key"})
    def test_gemini_invalid_json_fallback(self, mock_gen_model):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO interviews (id, role, current_question_index, is_complete, score, overall_score) VALUES (?, ?, ?, ?, ?, ?)",
            ("session_1", "Fullstack", 1, 1, 80, 80)
        )
        cursor.execute(
            "INSERT INTO interview_messages (interview_id, question, answer, feedback, score, topic) VALUES (?, ?, ?, ?, ?, ?)",
            ("session_1", "Q1", "A1", "F1", 40, "Docker")
        )
        conn.commit()
        conn.close()

        # Mock invalid Gemini output
        mock_model_instance = MagicMock()
        mock_gen_model.return_value = mock_model_instance
        
        mock_response = MagicMock()
        mock_response.text = "NOT VALID JSON"
        mock_model_instance.generate_content.return_value = mock_response

        # Should fall back to deterministic roadmap gracefully without crashing
        res = self.roadmap_service.get_or_generate_roadmap()
        self.assertTrue(res.success)
        self.assertEqual(res.duration_weeks, 4)
        self.assertEqual(res.priority_topics, ["Docker"])

    def test_cached_roadmap(self):
        # 1. Setup completed interview
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO interviews (id, role, current_question_index, is_complete, score, overall_score) VALUES (?, ?, ?, ?, ?, ?)",
            ("session_1", "Fullstack", 1, 1, 80, 80)
        )
        cursor.execute(
            "INSERT INTO interview_messages (interview_id, question, answer, feedback, score, topic) VALUES (?, ?, ?, ?, ?, ?)",
            ("session_1", "Q1", "A1", "F1", 40, "Kubernetes")
        )
        conn.commit()
        conn.close()

        # Generate roadmap once
        res1 = self.roadmap_service.get_or_generate_roadmap(regenerate=False)
        self.assertTrue(res1.success)

        # 2. Modify database cache record directly to verify cache hit returns the modified mock object
        conn = get_db_connection()
        cursor = conn.cursor()
        # Find fingerprint
        cursor.execute("SELECT weakness_fingerprint FROM roadmaps WHERE id = 'latest'")
        fingerprint = cursor.fetchone()[0]
        
        modified_roadmap = {
            "success": True,
            "duration_weeks": 4,
            "overall_goal": "MODIFIED_CACHED_GOAL",
            "estimated_hours": 99,
            "priority_topics": ["Kubernetes"],
            "weekly_plan": [
                {
                    "week": 1,
                    "title": "Modified Title",
                    "difficulty": "Easy",
                    "estimated_hours": 10,
                    "topics": ["Kubernetes"],
                    "learning_objectives": ["Mock"],
                    "practice_tasks": ["Mock"],
                    "mock_goal": "Mock",
                    "completed": False
                }
            ] * 4,
            "success_metrics": ["Mock metric"],
            "generated_at": "timestamp"
        }
        cursor.execute(
            "UPDATE roadmaps SET roadmap_json = ? WHERE id = 'latest'",
            (json.dumps(modified_roadmap),)
        )
        conn.commit()
        conn.close()

        # Call again without regenerate - should hit modified cache
        res2 = self.roadmap_service.get_or_generate_roadmap(regenerate=False)
        self.assertEqual(res2.overall_goal, "MODIFIED_CACHED_GOAL")
        self.assertEqual(res2.estimated_hours, 99)

        # Call with regenerate - should bypass cache and recreate (returning original goal, not MODIFIED_CACHED_GOAL)
        res3 = self.roadmap_service.get_or_generate_roadmap(regenerate=True)
        self.assertNotEqual(res3.overall_goal, "MODIFIED_CACHED_GOAL")
        self.assertEqual(res3.priority_topics, ["Kubernetes"])
