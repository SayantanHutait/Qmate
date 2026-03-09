import os
import sys

# Add the backend directory to sys.path to allow imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.database import engine, Base, SessionLocal
from models.user import User, UserRole
from utils.security import get_password_hash

def init_db():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created.")

def seed_users():
    db = SessionLocal()
    
    admin_email = "admin@college.edu"
    agent_email = "agent@college.edu"
    student_email = "student@college.edu"

    try:
        if not db.query(User).filter(User.email == admin_email).first():
            print(f"Creating admin user: {admin_email} (password: admin123)")
            admin = User(
                email=admin_email,
                hashed_password=get_password_hash("admin123"),
                full_name="System Admin",
                role=UserRole.ADMIN
            )
            db.add(admin)

        if not db.query(User).filter(User.email == agent_email).first():
            print(f"Creating agent user: {agent_email} (password: agent123)")
            agent = User(
                email=agent_email,
                hashed_password=get_password_hash("agent123"),
                full_name="Support Agent",
                role=UserRole.AGENT
            )
            db.add(agent)

        if not db.query(User).filter(User.email == student_email).first():
            print(f"Creating student user: {student_email} (password: student123)")
            student = User(
                email=student_email,
                hashed_password=get_password_hash("student123"),
                full_name="John Doe",
                role=UserRole.STUDENT
            )
            db.add(student)

        db.commit()
        print("Database seeding completed.")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
    seed_users()
