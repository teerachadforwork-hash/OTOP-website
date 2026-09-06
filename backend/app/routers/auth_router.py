from datetime import datetime, timezone
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session, joinedload
from datetime import timedelta
from typing import List
from pydantic import BaseModel

from ..database.database import get_db
from ..models import models
from ..schemas import schemas
from ..auth import auth
from ..services.image_service import save_image
from ..utils.serializers import serialize_admin_user

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register", response_model=schemas.UserOut)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    role = user.role.value if hasattr(user.role, "value") else user.role
    if role == models.RoleEnum.admin.value:
        raise HTTPException(status_code=403, detail="ไม่สามารถสมัครเป็นผู้ดูแลระบบได้")
    new_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        phone_number=user.phone_number,
        avatar_url=user.avatar_url,
        role=role,
        is_active=True,
        created_at=datetime.now(timezone.utc),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="บัญชีนี้ถูกระงับการใช้งาน")
    
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email, "role": user.role}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.UserOut)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@router.put("/profile", response_model=schemas.UserOut)
def update_profile(user_update: schemas.UserUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Check if changing email and if new email is already taken
    if user_update.email != current_user.email:
        db_user = db.query(models.User).filter(models.User.email == user_update.email).first()
        if db_user:
            raise HTTPException(status_code=400, detail="อีเมลนี้ถูกใช้งานโดยบัญชีอื่นแล้ว (Email already taken)")
    
    current_user.email = user_update.email
    current_user.full_name = user_update.full_name
    if user_update.phone_number is not None:
        current_user.phone_number = user_update.phone_number
    
    if user_update.password:
        current_user.hashed_password = auth.get_password_hash(user_update.password)
        
    db.commit()
    db.refresh(current_user)
    return current_user


ALLOWED_AVATAR_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_AVATAR_BYTES = 5 * 1024 * 1024


@router.put("/profile/avatar", response_model=schemas.UserOut)
def update_profile_avatar(
    avatar: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    content_type = (avatar.content_type or "").lower()
    if content_type not in ALLOWED_AVATAR_TYPES:
        raise HTTPException(status_code=400, detail="รองรับเฉพาะไฟล์รูป JPG, PNG, WEBP หรือ GIF")
    avatar.file.seek(0, 2)
    size = avatar.file.tell()
    avatar.file.seek(0)
    if size > MAX_AVATAR_BYTES:
        raise HTTPException(status_code=400, detail="ไฟล์ใหญ่เกินไป (สูงสุด 5MB)")
    current_user.avatar_url = save_image(avatar, "avatars")
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/users", response_model=List[schemas.AdminUserOut])
def list_users(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not auth.is_admin(current_user):
        raise HTTPException(status_code=403, detail="Admin only")
    users = db.query(models.User).order_by(models.User.id.desc()).all()
    return [serialize_admin_user(user) for user in users]


class UserActiveUpdate(BaseModel):
    is_active: bool


@router.put("/users/{user_id}/active", response_model=schemas.AdminUserOut)
def set_user_active(
    user_id: int,
    payload: UserActiveUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if not auth.is_admin(current_user):
        raise HTTPException(status_code=403, detail="Admin only")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if auth.is_admin(user):
        raise HTTPException(status_code=400, detail="ไม่สามารถระงับบัญชีผู้ดูแลระบบได้")
    user.is_active = payload.is_active
    db.commit()
    db.refresh(user)
    return user


class UserRoleUpdateBody(BaseModel):
    role: str


@router.put("/users/{user_id}/role", response_model=schemas.AdminUserOut)
def set_user_role(
    user_id: int,
    payload: UserRoleUpdateBody,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if not auth.is_admin(current_user):
        raise HTTPException(status_code=403, detail="Admin only")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="ไม่สามารถเปลี่ยนสิทธิ์ของตนเองได้")
    if auth.is_admin(user):
        raise HTTPException(status_code=400, detail="ไม่สามารถเปลี่ยนสิทธิ์บัญชีผู้ดูแลระบบได้")
    role = payload.role
    if role == models.RoleEnum.admin.value:
        raise HTTPException(status_code=400, detail="ไม่สามารถตั้งสิทธิ์ผู้ดูแลระบบจากหน้านี้ได้")
    if role not in {models.RoleEnum.customer.value, models.RoleEnum.seller.value}:
        raise HTTPException(status_code=400, detail="สิทธิ์ไม่ถูกต้อง")
    user.role = role
    db.commit()
    db.refresh(user)
    return user


def _restore_stock_for_order(order: models.Order):
    for item in order.items:
        product = item.product
        if product:
            product.stock += item.quantity
            if product.status == models.ProductStatusEnum.out_of_stock.value and product.stock > 0:
                product.status = models.ProductStatusEnum.approved.value


def _close_account(db: Session, user: models.User):
    # 1. Delete cart items
    db.query(models.CartItem).filter(models.CartItem.user_id == user.id).delete()
    
    # 2. Delete reviews by this user
    db.query(models.Review).filter(models.Review.customer_id == user.id).delete()
    
    # 3. Delete orders made by this user (including payments and order items)
    orders = db.query(models.Order).filter(models.Order.customer_id == user.id).all()
    for order in orders:
        db.query(models.Payment).filter(models.Payment.order_id == order.id).delete()
        db.query(models.OrderItem).filter(models.OrderItem.order_id == order.id).delete()
        db.delete(order)
        
    # 4. Delete products sold by this user (including reviews, order items, and cart items for these products)
    products = db.query(models.Product).filter(models.Product.seller_id == user.id).all()
    for product in products:
        db.query(models.Review).filter(models.Review.product_id == product.id).delete()
        db.query(models.OrderItem).filter(models.OrderItem.product_id == product.id).delete()
        db.query(models.CartItem).filter(models.CartItem.product_id == product.id).delete()
        db.delete(product)

    # 5. Delete any remaining order items where the user is the seller
    db.query(models.OrderItem).filter(models.OrderItem.seller_id == user.id).delete()

    # 6. Delete news articles authored by the user
    db.query(models.NewsArticle).filter(models.NewsArticle.author_id == user.id).delete()

    # 7. Delete behavior logs
    db.query(models.UserBehaviorLog).filter(models.UserBehaviorLog.user_id == user.id).delete()

    # Finally, hard delete the user
    db.delete(user)


@router.delete("/account")
def delete_own_account(
    payload: schemas.AccountDeleteIn,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if current_user.role == models.RoleEnum.admin.value:
        raise HTTPException(status_code=400, detail="ผู้ดูแลระบบไม่สามารถยกเลิกบัญชีผ่านหน้านี้ได้")
    if not auth.verify_password(payload.password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="รหัสผ่านไม่ถูกต้อง")
    _close_account(db, current_user)
    db.commit()
    return {"success": True, "message": "ยกเลิกบัญชีเรียบร้อยแล้ว"}


@router.delete("/users/{user_id}")
def admin_delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if not auth.is_admin(current_user):
        raise HTTPException(status_code=403, detail="Admin only")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if auth.is_admin(user):
        raise HTTPException(status_code=400, detail="ไม่สามารถยกเลิกบัญชีผู้ดูแลระบบได้")
    _close_account(db, user)
    db.commit()
    return {"success": True, "message": "ยกเลิกบัญชีเรียบร้อยแล้ว"}
