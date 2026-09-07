from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session, joinedload
from typing import List

from ..database.database import get_db
from .. import models, schemas, auth
from ..utils.serializers import serialize_order, clear_user_cart, invoice_number_for
from ..utils.invoice import build_invoice_html

router = APIRouter(prefix="/api/orders", tags=["orders"])

ALLOWED_STATUSES = {e.value for e in models.OrderStatusEnum}
CUSTOMER_ALLOWED_TRANSITIONS = {
    models.OrderStatusEnum.shipped.value: {models.OrderStatusEnum.completed.value},
    models.OrderStatusEnum.pending_payment.value: {models.OrderStatusEnum.cancelled.value},
}


def _order_query(db: Session):
    return db.query(models.Order).options(
        joinedload(models.Order.items).joinedload(models.OrderItem.product),
        joinedload(models.Order.payment),
        joinedload(models.Order.customer),
    )


def _can_view_order(user: models.User, order: models.Order) -> bool:
    if auth.is_admin(user):
        return True
    if order.customer_id == user.id:
        return True
    if auth.user_role(user) == models.RoleEnum.seller.value:
        return any(item.seller_id == user.id for item in order.items)
    return False


@router.get("/", response_model=List[schemas.OrderOut])
def list_orders(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    query = _order_query(db)
    if auth.is_admin(current_user):
        orders = query.order_by(models.Order.created_at.desc(), models.Order.id.desc()).all()
    elif auth.user_role(current_user) == models.RoleEnum.seller.value:
        orders = (
            query.join(models.OrderItem)
            .filter(models.OrderItem.seller_id == current_user.id)
            .distinct()
            .order_by(models.Order.created_at.desc())
            .all()
        )
    else:
        orders = (
            query.filter(models.Order.customer_id == current_user.id)
            .order_by(models.Order.created_at.desc())
            .all()
        )
    return [serialize_order(order) for order in orders]


@router.get("/{order_id}", response_model=schemas.OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    order = _order_query(db).filter(models.Order.id == order_id).first()
    if not order or not _can_view_order(current_user, order):
        raise HTTPException(status_code=404, detail="Order not found")
    return serialize_order(order)


@router.post("/", response_model=schemas.OrderOut, status_code=status.HTTP_201_CREATED)
def create_order(order_in: schemas.OrderCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    if auth.user_role(current_user) == models.RoleEnum.seller.value:
        raise HTTPException(status_code=403, detail="ผู้ขายไม่สามารถสั่งซื้อสินค้าได้")
    if not order_in.items:
        raise HTTPException(status_code=400, detail="กรุณาเลือกสินค้าอย่างน้อย 1 รายการ")

    quantities_by_product = {}
    for item in order_in.items:
        quantities_by_product[item.product_id] = quantities_by_product.get(item.product_id, 0) + item.quantity

    total_price = 0.0
    order_items = []
    for product_id, quantity in sorted(quantities_by_product.items()):
        product = (
            db.query(models.Product)
            .filter(models.Product.id == product_id)
            .with_for_update()
            .first()
        )
        if not product:
            raise HTTPException(status_code=404, detail=f"ไม่พบสินค้า {product_id}")
        if product.status != models.ProductStatusEnum.approved.value:
            raise HTTPException(status_code=400, detail=f"สินค้า {product.name} ยังไม่พร้อมจำหน่าย")
        if product.stock < quantity:
            raise HTTPException(status_code=400, detail=f"สินค้า {product.name} มีคงเหลือไม่พอ")
        subtotal = product.price * quantity
        total_price += subtotal
        order_items.append({
            "product": product,
            "quantity": quantity,
            "unit_price": product.price,
            "subtotal": subtotal,
        })

    discount = 0.0
    if order_in.coupon_code and order_in.coupon_code.strip().upper() == "OTOP10":
        discount = round(total_price * 0.1, 2)

    shipping_cost = order_in.shipping_cost
    if shipping_cost is None:
        shipping_cost = 0.0 if total_price >= 1000 else 50.0

    payment_method = (order_in.payment_method or "promptpay").lower()
    if payment_method == "cod":
        initial_status = models.OrderStatusEnum.preparing.value
    else:
        initial_status = models.OrderStatusEnum.pending_payment.value

    order = models.Order(
        customer_id=current_user.id,
        total_price=total_price,
        shipping_cost=shipping_cost,
        discount_amount=discount,
        grand_total=max(0.0, total_price - discount + shipping_cost),
        shipping_address=order_in.shipping_address,
        payment_method=payment_method,
        order_status=initial_status,
    )
    db.add(order)
    db.flush()

    for oi in order_items:
        db.add(models.OrderItem(
            order_id=order.id,
            product_id=oi["product"].id,
            seller_id=oi["product"].seller_id,
            unit_price=oi["unit_price"],
            quantity=oi["quantity"],
            subtotal=oi["subtotal"],
        ))
        oi["product"].stock -= oi["quantity"]
        if oi["product"].stock <= 0:
            oi["product"].status = models.ProductStatusEnum.out_of_stock.value

    if payment_method == "cod":
        db.add(models.Payment(
            order_id=order.id,
            amount=order.grand_total,
            payment_method="cod",
            status=models.PaymentStatusEnum.pending.value,
        ))

    clear_user_cart(db, current_user.id)
    db.commit()
    order = _order_query(db).filter(models.Order.id == order.id).first()
    if order and not order.invoice_number:
        order.invoice_number = invoice_number_for(order)
        db.commit()
        order = _order_query(db).filter(models.Order.id == order.id).first()
    return serialize_order(order)


@router.put("/{order_id}/status", response_model=schemas.OrderOut)
def update_order_status(
    order_id: int,
    payload: schemas.OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    order = _order_query(db).filter(models.Order.id == order_id).first()
    if not order or not _can_view_order(current_user, order):
        raise HTTPException(status_code=404, detail="Order not found")

    new_status = payload.order_status
    if new_status not in ALLOWED_STATUSES:
        raise HTTPException(status_code=400, detail="สถานะคำสั่งซื้อไม่ถูกต้อง")

    if order.order_status in [models.OrderStatusEnum.completed.value, models.OrderStatusEnum.cancelled.value]:
        raise HTTPException(status_code=400, detail="คำสั่งซื้อนี้สิ้นสุดแล้ว ไม่สามารถแก้ไขได้")

    role = auth.user_role(current_user)
    if role == models.RoleEnum.customer.value:
        allowed = CUSTOMER_ALLOWED_TRANSITIONS.get(order.order_status, set())
        if new_status not in allowed:
            raise HTTPException(status_code=400, detail="ลูกค้าไม่สามารถเปลี่ยนสถานะนี้ได้")
    elif role == models.RoleEnum.seller.value:
        if not any(item.seller_id == current_user.id for item in order.items):
            raise HTTPException(status_code=403, detail="ไม่มีสิทธิ์จัดการคำสั่งซื้อนี้")
        if new_status == models.OrderStatusEnum.completed.value:
            raise HTTPException(status_code=400, detail="ผู้ขายไม่สามารถยืนยันรับสินค้าแทนลูกค้าได้")
    elif role != models.RoleEnum.admin.value:
        raise HTTPException(status_code=403, detail="ไม่มีสิทธิ์จัดการคำสั่งซื้อ")

    if payload.tracking_number is not None:
        if role == models.RoleEnum.seller.value and order.tracking_number and order.tracking_number != payload.tracking_number:
            raise HTTPException(status_code=400, detail="ไม่สามารถแก้ไขเลขพัสดุหลังจากบันทึกแล้ว")
        if new_status == models.OrderStatusEnum.cancelled.value:
            raise HTTPException(status_code=400, detail="คำสั่งซื้อถูกยกเลิก ห้ามกรอกเลขพัสดุ")
        order.tracking_number = payload.tracking_number

    if (
        new_status == models.OrderStatusEnum.cancelled.value
        and order.order_status != models.OrderStatusEnum.cancelled.value
    ):
        for item in order.items:
            product = item.product
            if product:
                product.stock += item.quantity
                if product.status == models.ProductStatusEnum.out_of_stock.value and product.stock > 0:
                    product.status = models.ProductStatusEnum.approved.value

    order.order_status = new_status
    if payload.tracking_number and new_status == models.OrderStatusEnum.preparing.value:
        order.order_status = models.OrderStatusEnum.shipped.value

    db.commit()
    order = _order_query(db).filter(models.Order.id == order.id).first()
    return serialize_order(order)


@router.get("/{order_id}/invoice", response_model=schemas.OrderOut)
def get_order_invoice(order_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    order = _order_query(db).filter(models.Order.id == order_id).first()
    if not order or not _can_view_order(current_user, order):
        raise HTTPException(status_code=404, detail="ไม่พบใบกำกับสินค้า")
    if not order.invoice_number:
        order.invoice_number = invoice_number_for(order)
        db.commit()
        db.refresh(order)
    return serialize_order(order)


@router.get("/{order_id}/invoice.html")
def get_order_invoice_html(order_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    order = _order_query(db).filter(models.Order.id == order_id).first()
    if not order or not _can_view_order(current_user, order):
        raise HTTPException(status_code=404, detail="ไม่พบใบกำกับสินค้า")
    if not order.invoice_number:
        order.invoice_number = invoice_number_for(order)
        db.commit()
        db.refresh(order)
    html = build_invoice_html(order)
    filename = f"{invoice_number_for(order)}.html"
    return HTMLResponse(content=html, headers={"Content-Disposition": f'inline; filename="{filename}"'})
