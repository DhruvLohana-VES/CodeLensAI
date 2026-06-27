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
    try:
        # Disable foreign keys before beginning the transaction
        conn.execute("PRAGMA foreign_keys = OFF")
        
        cursor = conn.cursor()
        
        # Start transaction explicitly
        cursor.execute("BEGIN TRANSACTION")
        
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
            questions_json TEXT,
            user_id TEXT,
            interview_mode TEXT,
            overall_score INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """)
        
        # Run table migration for interviews if created_at is missing
        cursor.execute("PRAGMA table_info(interviews)")
        interviews_columns = [row[1] for row in cursor.fetchall()]
        if "created_at" not in interviews_columns:
            # Rename existing table
            cursor.execute("ALTER TABLE interviews RENAME TO interviews_old")
            
            # Recreate with proper created_at column default
            cursor.execute("""
            CREATE TABLE interviews (
                id TEXT PRIMARY KEY,
                role TEXT NOT NULL,
                current_question_index INTEGER NOT NULL,
                is_complete INTEGER NOT NULL,
                score INTEGER DEFAULT 0,
                questions_json TEXT,
                user_id TEXT,
                interview_mode TEXT,
                overall_score INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
            """)
            
            # Identify columns that exist in interviews_old to copy them
            cursor.execute("PRAGMA table_info(interviews_old)")
            old_cols = [row[1] for row in cursor.fetchall()]
            new_allowed_cols = {
                "id", "role", "current_question_index", "is_complete", "score", 
                "questions_json", "user_id", "interview_mode", "overall_score"
            }
            cols_to_copy = [c for c in old_cols if c in new_allowed_cols]
            cols_str = ", ".join(cols_to_copy)
            
            # Copy data, providing CURRENT_TIMESTAMP for the new created_at column
            cursor.execute(f"""
            INSERT INTO interviews ({cols_str}, created_at)
            SELECT {cols_str}, CURRENT_TIMESTAMP FROM interviews_old
            """)
            
            # Drop old table
            cursor.execute("DROP TABLE interviews_old")
        
        # Interview messages table (tracks answers and AI feedback per question)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS interview_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            interview_id TEXT NOT NULL,
            question TEXT NOT NULL,
            answer TEXT,
            feedback TEXT,
            score INTEGER,
            topic TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (interview_id) REFERENCES interviews (id) ON DELETE CASCADE
        )
        """)
        
        # Run table migration for interview_messages if created_at is missing
        cursor.execute("PRAGMA table_info(interview_messages)")
        messages_columns = [row[1] for row in cursor.fetchall()]
        if "created_at" not in messages_columns:
            # Rename existing table
            cursor.execute("ALTER TABLE interview_messages RENAME TO interview_messages_old")
            
            # Recreate with proper created_at column default
            cursor.execute("""
            CREATE TABLE interview_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                interview_id TEXT NOT NULL,
                question TEXT NOT NULL,
                answer TEXT,
                feedback TEXT,
                score INTEGER,
                topic TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (interview_id) REFERENCES interviews (id) ON DELETE CASCADE
            )
            """)
            
            # Identify columns that exist in interview_messages_old to copy them
            cursor.execute("PRAGMA table_info(interview_messages_old)")
            old_cols = [row[1] for row in cursor.fetchall()]
            new_allowed_cols = {
                "id", "interview_id", "question", "answer", "feedback", "score", "topic"
            }
            cols_to_copy = [c for c in old_cols if c in new_allowed_cols]
            cols_str = ", ".join(cols_to_copy)
            
            # Copy data, providing CURRENT_TIMESTAMP for the new created_at column
            cursor.execute(f"""
            INSERT INTO interview_messages ({cols_str}, created_at)
            SELECT {cols_str}, CURRENT_TIMESTAMP FROM interview_messages_old
            """)
            
            # Drop old table
            cursor.execute("DROP TABLE interview_messages_old")
            
        # Run other database migrations conditionally to existing tables (in case they are missing, e.g. for user_id/interview_mode/overall_score)
        try:
            cursor.execute("ALTER TABLE interviews ADD COLUMN questions_json TEXT")
        except sqlite3.OperationalError:
            pass

        try:
            cursor.execute("ALTER TABLE interviews ADD COLUMN user_id TEXT")
        except sqlite3.OperationalError:
            pass

        try:
            cursor.execute("ALTER TABLE interviews ADD COLUMN interview_mode TEXT")
        except sqlite3.OperationalError:
            pass

        try:
            cursor.execute("ALTER TABLE interviews ADD COLUMN overall_score INTEGER DEFAULT 0")
        except sqlite3.OperationalError:
            pass

        try:
            cursor.execute("ALTER TABLE interview_messages ADD COLUMN topic TEXT")
        except sqlite3.OperationalError:
            pass

        # Backfill legacy database records
        try:
            cursor.execute("UPDATE interviews SET interview_mode = role WHERE interview_mode IS NULL")
        except Exception:
            pass

        try:
            cursor.execute("UPDATE interviews SET overall_score = score WHERE overall_score IS NULL OR overall_score = 0")
        except Exception:
            pass
            
        # Commit transaction
        conn.commit()
        
    except Exception as e:
        conn.rollback()
        raise RuntimeError(f"Database initialization/migration failed: {e}") from e
    finally:
        # Re-enable foreign keys
        try:
            conn.execute("PRAGMA foreign_keys = ON")
        except Exception:
            pass
        conn.close()
