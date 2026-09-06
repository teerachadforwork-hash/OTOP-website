from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from sqlalchemy.orm import Session

from ..database.database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/api/products", tags=["products"])


def _dump(model):
    return model.model_dump() if hasattr(model, "model_dump") else model.dict()


@router.get("/", response_model=List[schemas.ProductOut])
def read_products(
    skip: int = 0,
    limit: int = 100,
    seller_id: Optional[int] = None,
    include_pending: bool = False,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(auth.get_current_user_optional),
):
    query = db.query(models.Product)
    if seller_id is not None:
        query = query.filter(models.Product.seller_id == seller_id)
        is_owner = current_user and (current_user.id == seller_id or current_user.role == models.RoleEnum.admin.value)
        if not is_owner:
            query = query.filter(models.Product.status == models.ProductStatusEnum.approved.value)
    elif include_pending and current_user and current_user.role == models.RoleEnum.admin.value:
        pass
    else:
        query = query.filter(models.Product.status == models.ProductStatusEnum.approved.value)
    return query.order_by(models.Product.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/mine", response_model=List[schemas.ProductOut])
def read_my_products(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != models.RoleEnum.seller.value:
        raise HTTPException(status_code=403, detail="Only sellers can list store products")
    return (
        db.query(models.Product)
        .filter(models.Product.seller_id == current_user.id)
        .order_by(models.Product.created_at.desc())
        .all()
    )


@router.get("/{product_id}", response_model=schemas.ProductDetailOut)
def read_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("/", response_model=schemas.ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != models.RoleEnum.seller.value:
        raise HTTPException(status_code=403, detail="Only sellers can create products")
    if not db.query(models.Category).filter(models.Category.id == product.category_id).first():
        raise HTTPException(status_code=400, detail="หมวดหมู่สินค้าไม่ถูกต้อง")
    if not db.query(models.Community).filter(models.Community.id == product.community_id).first():
        raise HTTPException(status_code=400, detail="ไม่พบชุมชนที่เลือก")
    db_product = models.Product(**_dump(product), seller_id=current_user.id, status=models.ProductStatusEnum.pending.value)
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


@router.put("/{product_id}", response_model=schemas.ProductOut)
def update_product(
    product_id: int,
    product_update: schemas.ProductUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    if current_user.role == models.RoleEnum.admin.value:
        raise HTTPException(status_code=403, detail="ผู้ดูแลระบบปรับได้เฉพาะสถานะสินค้า ไม่สามารถแก้ไขข้อมูลสินค้าแทนผู้ขาย")
    if db_product.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this product")

    data = _dump(product_update)
    data = {k: v for k, v in data.items() if v is not None}
    data.pop("status", None)
    for key, value in data.items():
        setattr(db_product, key, value.value if hasattr(value, "value") else value)

    db.commit()
    db.refresh(db_product)
    return db_product


@router.put("/{product_id}/status", response_model=schemas.ProductOut)
def update_product_status(
    product_id: int,
    product_update: schemas.ProductUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if current_user.role != models.RoleEnum.admin.value:
        raise HTTPException(status_code=403, detail="Only admins can change product status")
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    if not product_update.status:
        raise HTTPException(status_code=400, detail="กรุณาระบุสถานะสินค้า")
    db_product.status = product_update.status.value
    db.commit()
    db.refresh(db_product)
    return db_product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    if current_user.role == models.RoleEnum.admin.value:
        raise HTTPException(status_code=403, detail="ผู้ดูแลระบบไม่สามารถลบสินค้าแทนผู้ขาย ใช้การปฏิเสธหรือปิดสถานะสินค้าแทน")
    if db_product.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this product")
    db.delete(db_product)
    db.commit()
    return None
