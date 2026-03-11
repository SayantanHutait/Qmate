import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.database import SessionLocal
from models.user import User

db = SessionLocal()

admin = db.query(User).filter(User.email == "admin@college.edu").first()
if admin:
    admin.university_id = "ADMIN001"

agent = db.query(User).filter(User.email == "agent@college.edu").first()
if agent:
    agent.university_id = "AGENT001"

student = db.query(User).filter(User.email == "student@college.edu").first()
if student:
    student.university_id = "STU001"

db.commit()
print("UIDs updated successfully.")
db.close()
