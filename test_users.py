import os
import sys

# Add backend directory to sys.path so we can import from config
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.models.database import Base
from backend.models.user import User, UserRole
from backend.utils.security import get_password_hash

# Use the sqlite database directly for a quick test
SQLALCHEMY_DATABASE_URL = "sqlite:///./backend/student_support.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def main():
    db = SessionLocal()
    try:
        # Check if an admin exists, if not create one
        admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
        if not admin:
            print("Creating test admin user...")
            admin = User(
                email="admin_test@example.com",
                hashed_password=get_password_hash("adminpass123"),
                full_name="Admin Test",
                role=UserRole.ADMIN
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            print(f"Created Admin ID: {admin.id}, Email: {admin.email}")
            
        print("\n--- Verifying Users ---")
        users = db.query(User).all()
        for u in users:
            print(f"ID: {u.id} | Email: {u.email} | Role: {u.role.value}")
            
    except Exception as e:
        print(f"Error during verification: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
