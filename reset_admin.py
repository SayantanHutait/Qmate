import os
import sys

sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend'))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.models.database import Base
from backend.models.user import User, UserRole
from backend.utils.security import get_password_hash

SQLALCHEMY_DATABASE_URL = 'sqlite:///./backend/student_support.db'
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={'check_same_thread': False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

db = SessionLocal()
try:
    admin = db.query(User).filter(User.email == 'admin@college.edu').first()
    if admin:
        print('Resetting password for admin@college.edu to adminpass123')
        admin.hashed_password = get_password_hash('adminpass123')
        db.commit()
    else:
        print('admin@college.edu not found')
except Exception as e:
    print(f'Error: {e}')
finally:
    db.close()
