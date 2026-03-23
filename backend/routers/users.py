from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from models.database import get_db
from models.user import User, UserRole
import os
from fastapi import UploadFile, File
from models.user import StudentDocument
from models.schemas import UserCreate, UserResponse
from utils.security import get_password_hash
from utils.dependencies import get_current_admin_user

router = APIRouter(prefix="/api/users", tags=["Users"])

@router.get("", response_model=List[UserResponse])
def get_all_users(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Get a list of all users. Admin access required.
    """
    users = db.query(User).all()
    return users

@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Create a new user (Student or Agent). Admin access required.
    """
    db_user = db.query(User).filter(User.email == user_data.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        university_id=user_data.university_id,
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        role=user_data.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Delete a user by ID. Admin access required.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return None

@router.post("/upload-documents-bulk")
async def upload_documents_bulk(
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """
    Bulk upload personalized student documents.
    Filename MUST start with the university_id followed by an underscore or dot
    e.g., STU123_bonafide.pdf
    """
    os.makedirs("uploads/student_docs", exist_ok=True)
    results = {"success": 0, "failed": 0, "errors": []}

    for file in files:
        try:
            # Extract university_id from filename, assuming format "STU123_anything.pdf"
            parts = file.filename.split("_")
            if len(parts) < 2:
                parts = file.filename.split("-")
                if len(parts) < 2:
                    parts = file.filename.split(".")
            
            if len(parts) < 1:
                results["failed"] += 1
                results["errors"].append(f"{file.filename}: Invalid format. Need ID prefix like STU123_...")
                continue
                
            university_id = parts[0].upper()
            
            # Infer doc type from filename flexibly using prefixes
            raw_type = parts[1].split('.')[0].lower()
            if raw_type.startswith("bonafide"):
                doc_type = "bonafide"
            elif raw_type.startswith("transcript"):
                doc_type = "transcript"
            elif raw_type.startswith("fee"):
                doc_type = "fee"
            elif raw_type.startswith("id"):
                doc_type = "id"
            else:
                doc_type = "document" # Fallback generic name

            content = await file.read()
            safe_filename = file.filename.replace(" ", "_").lower()
            file_path = os.path.join("uploads", "student_docs", safe_filename)
            
            with open(file_path, "wb") as f:
                f.write(content)
                
            # Upsert DB record
            existing = db.query(StudentDocument).filter_by(university_id=university_id, doc_type=doc_type).first()
            if existing:
                existing.filename = safe_filename
            else:
                new_doc = StudentDocument(
                    university_id=university_id,
                    doc_type=doc_type,
                    filename=safe_filename
                )
                db.add(new_doc)
            
            db.commit()
            results["success"] += 1
            
        except Exception as e:
            results["failed"] += 1
            results["errors"].append(f"{file.filename}: {str(e)}")

    return results
