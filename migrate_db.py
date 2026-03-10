import sqlite3
import os

db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend', 'student_support.db')

def add_university_id():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if column exists
        cursor.execute("PRAGMA table_info(users)")
        columns = [col[1] for col in cursor.fetchall()]
        if 'university_id' in columns:
            print("Column university_id already exists.")
            return

        print("Adding university_id column to users table...")
        # Since it's NOT NULL, we need a default value to satisfy existing rows
        cursor.execute("ALTER TABLE users ADD COLUMN university_id VARCHAR NOT NULL DEFAULT 'TEMP_UID'")
        
        # Now generate unique UIDs for existing users
        cursor.execute("SELECT id, email FROM users")
        users = cursor.fetchall()
        for u in users:
            uid = f"UID-{u[0]}-TEMP"
            cursor.execute("UPDATE users SET university_id = ? WHERE id = ?", (uid, u[0]))
            
        # Add index
        cursor.execute("CREATE UNIQUE INDEX ix_users_university_id ON users (university_id)")

        conn.commit()
        print("Database migration successful.")
    except Exception as e:
        print(f"Error migrating DB: {e}")
    finally:
        conn.close()

if __name__ == '__main__':
    add_university_id()
