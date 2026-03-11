from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel

from models.database import get_db
from models.user import User, UserRole
from models.schemas import UserCreate, UserResponse, Token
from utils.security import verify_password, get_password_hash, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from utils.dependencies import get_current_active_user, get_current_admin_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    new_user = User(
        university_id=user.university_id,
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        role=user.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    username_or_uid = form_data.username
    
    if "@" in username_or_uid:
        # Email login implies Admin
        user = db.query(User).filter(User.email == username_or_uid).first()
        if user and user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Agents and Students must login with UID",
                headers={"WWW-Authenticate": "Bearer"},
            )
    else:
        # UID login implies Agent or Student
        user = db.query(User).filter(User.university_id == username_or_uid).first()
        if user and user.role == UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Admins must login with email",
                headers={"WWW-Authenticate": "Bearer"},
            )

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role.value, "id": user.id}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user
