import sqlite3
import os

DB_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "codelens.db"
)

def get_db_connection() -> sqlite3.Connection:
    """Returns a connection to the SQLite database with Row factory enabled."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes the database schema if tables do not exist."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Resumes table (stores uploaded resume data and parsed JSON analyses)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS resumes (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        pages INTEGER NOT NULL,
        text TEXT NOT NULL,
        analysis_json TEXT NOT NULL
    )
    """)
    
    # Interviews table (tracks interview sessions)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS interviews (
        id TEXT PRIMARY KEY,
        role TEXT NOT NULL,
        current_question_index INTEGER NOT NULL,
        is_complete INTEGER NOT NULL,
        score INTEGER DEFAULT 0,
        questions_json TEXT
    )
    """)
    
    # Run database migration to add questions_json conditionally to existing tables
    try:
        cursor.execute("ALTER TABLE interviews ADD COLUMN questions_json TEXT")
    except sqlite3.OperationalError:
        # Column already exists
        pass
    
    # Interview messages table (tracks answers and AI feedback per question)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS interview_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        interview_id TEXT NOT NULL,
        question TEXT NOT NULL,
        answer TEXT,
        feedback TEXT,
        score INTEGER,
        FOREIGN KEY (interview_id) REFERENCES interviews (id) ON DELETE CASCADE
    )
    """)
    
    conn.commit()
    conn.close()
