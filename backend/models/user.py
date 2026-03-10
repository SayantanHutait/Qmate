from sqlalchemy import Boolean, Column, Integer, String, Enum
from .database import Base
import enum

class UserRole(str, enum.Enum):
    STUDENT = "student"
    AGENT = "agent"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    university_id = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.STUDENT, nullable=False)
    is_active = Column(Boolean, default=True)
    full_name = Column(String, nullable=True)
