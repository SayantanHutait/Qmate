import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.database import SessionLocal
from models.user import User

db = SessionLocal()
users = db.query(User).all()
for u in users:
    print(f"ID: {u.id}, Email: {u.email}, UID: {u.university_id}, Role: {u.role}")

db.close()
