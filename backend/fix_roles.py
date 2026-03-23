import sys, os
from models.database import SessionLocal
from models.user import User, UserRole

db = SessionLocal()

admin = db.query(User).filter_by(university_id="ADMIN001").first()
if admin:
    admin.role = UserRole.ADMIN
    db.commit()

agent = db.query(User).filter_by(university_id="AGENT001").first()
if agent:
    agent.role = UserRole.AGENT
    db.commit()

print("Roles fixed!")
for u in db.query(User).all():
    print(u.university_id, u.email, u.role.name)
