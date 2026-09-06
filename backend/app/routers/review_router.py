from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List

from ..database.database import get_db
from ..models import models
from ..schemas import schemas
from ..auth import auth
from ..utils.serializers import serialize_review

router = APIRouter(tags=["reviews"])


@router.post("/", response_model=schemas.ReviewOut, status_code=status.HTTP_201_CREATED)
def create_review(
    review_in: schemas.ReviewCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    order = (
        db.query(models.Order)
        .options(joinedload(models.Order.items))
        .filter(models.Order.id == review_in.order_id, models.Order.customer_id == current_user.id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="ไม่พบคำสั่งซื้อ")
    if order.order_status != models.OrderStatusEnum.completed.value:
        raise HTTPException(status_code=400, detail="สามารถรีวิวได้เฉพาะคำสั่งซื้อที่สำเร็จแล้วเท่านั้น")

    in_order = any(item.product_id == review_in.product_id for item in order.items)
    if not in_order:
        raise HTTPException(status_code=400, detail="สินค้านี้ไม่อยู่ในคำสั่งซื้อที่เลือก")

    existing = db.query(models.Review).filter(
        models.Review.order_id == review_in.order_id,
        models.Review.customer_id == current_user.id,
        models.Review.product_id == review_in.product_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="คุณรีวิวสินค้านี้ในคำสั่งซื้อแล้ว")

    review = models.Review(
        product_id=review_in.product_id,
        customer_id=current_user.id,
        order_id=review_in.order_id,
        rating=review_in.rating,
        comment=review_in.comment,
    )
    db.add(review)
    db.flush()

    product = db.query(models.Product).filter(models.Product.id == review_in.product_id).first()
    if product:
        avg = db.query(func.avg(models.Review.rating)).filter(models.Review.product_id == product.id).scalar()
        count = db.query(func.count(models.Review.id)).filter(models.Review.product_id == product.id).scalar()
        product.review_count = int(count or 0)
        product.rating_cache = float(avg or review_in.rating)

    db.commit()
    review = (
        db.query(models.Review)
        .options(joinedload(models.Review.customer))
        .filter(models.Review.id == review.id)
        .first()
    )
    return serialize_review(review)


@router.get("/product/{product_id}", response_model=List[schemas.ReviewOut])
def get_product_reviews(product_id: int, db: Session = Depends(get_db)):
    reviews = (
        db.query(models.Review)
        .options(joinedload(models.Review.customer))
        .filter(models.Review.product_id == product_id)
        .order_by(models.Review.created_at.desc())
        .all()
    )
    return [serialize_review(review) for review in reviews]


@router.get("/user/{user_id}", response_model=List[schemas.ReviewOut])
def get_user_reviews(user_id: int, db: Session = Depends(get_db)):
    reviews = (
        db.query(models.Review)
        .options(joinedload(models.Review.customer))
        .filter(models.Review.customer_id == user_id)
        .order_by(models.Review.created_at.desc())
        .all()
    )
    return [serialize_review(review) for review in reviews]
