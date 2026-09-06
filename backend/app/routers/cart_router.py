from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session, joinedload

from ..database.database import get_db
from .. import models, schemas, auth
from ..utils.serializers import serialize_admin_cart_item

router = APIRouter(prefix="/api/cart", tags=["cart"])


def _cart_query(db: Session, user_id: int):
    return (
        db.query(models.CartItem)
        .options(joinedload(models.CartItem.product))
        .filter(models.CartItem.user_id == user_id)
    )


@router.get("/", response_model=List[schemas.CartItemOut])
def get_cart_items(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return _cart_query(db, current_user.id).all()


@router.get("/admin", response_model=List[schemas.AdminCartItemOut])
def list_all_carts(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not auth.is_admin(current_user):
        raise HTTPException(status_code=403, detail="Admin only")
    items = (
        db.query(models.CartItem)
        .options(joinedload(models.CartItem.product), joinedload(models.CartItem.user))
        .order_by(models.CartItem.id.desc())
        .all()
    )
    return [serialize_admin_cart_item(item) for item in items]


@router.post("/", response_model=schemas.CartItemOut, status_code=status.HTTP_201_CREATED)
def add_to_cart(item: schemas.CartItemCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.status != models.ProductStatusEnum.approved.value:
        raise HTTPException(status_code=400, detail="สินค้านี้ยังไม่พร้อมจำหน่าย")
    if product.stock <= 0:
        raise HTTPException(status_code=400, detail="สินค้าหมด")

    qty = max(1, item.quantity)
    cart_item = (
        db.query(models.CartItem)
        .filter(models.CartItem.user_id == current_user.id, models.CartItem.product_id == item.product_id)
        .first()
    )
    if cart_item:
        cart_item.quantity = min(cart_item.quantity + qty, product.stock)
    else:
        cart_item = models.CartItem(
            user_id=current_user.id,
            product_id=item.product_id,
            quantity=min(qty, product.stock),
        )
        db.add(cart_item)
    db.commit()
    return _cart_query(db, current_user.id).filter(models.CartItem.id == cart_item.id).first()


@router.put("/{item_id}", response_model=schemas.CartItemOut)
def update_cart_item(
    item_id: int,
    payload: schemas.CartItemUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    cart_item = (
        db.query(models.CartItem)
        .options(joinedload(models.CartItem.product))
        .filter(models.CartItem.id == item_id, models.CartItem.user_id == current_user.id)
        .first()
    )
    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    if payload.quantity <= 0:
        raise HTTPException(status_code=400, detail="จำนวนต้องมากกว่า 0")
    max_stock = cart_item.product.stock if cart_item.product else payload.quantity
    cart_item.quantity = min(payload.quantity, max_stock)
    db.commit()
    db.refresh(cart_item)
    return cart_item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_cart_item(item_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    cart_item = db.query(models.CartItem).filter(models.CartItem.id == item_id, models.CartItem.user_id == current_user.id).first()
    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    db.delete(cart_item)
    db.commit()
    return


@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
def clear_cart(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    db.query(models.CartItem).filter(models.CartItem.user_id == current_user.id).delete()
    db.commit()
    return
