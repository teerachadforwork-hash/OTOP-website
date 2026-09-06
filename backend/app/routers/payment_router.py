from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session, joinedload

from ..database.database import get_db
from .. import models, schemas, auth
from ..services.image_service import save_image

router = APIRouter(prefix="/api/payments", tags=["payments"])


@router.post("/", response_model=schemas.PaymentOut, status_code=status.HTTP_201_CREATED)
def create_payment(
    order_id: int = Form(...),
    amount: float = Form(...),
    payment_method: str = Form("promptpay"),
    slip: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    order = db.query(models.Order).filter(models.Order.id == order_id, models.Order.customer_id == current_user.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    method = (payment_method or "promptpay").lower()
    if method != "cod" and slip is None:
        raise HTTPException(status_code=400, detail="กรุณาแนบสลิปการโอนเงิน")

    if abs(float(amount) - float(order.grand_total)) > 1:
        raise HTTPException(status_code=400, detail="จำนวนเงินไม่ตรงกับยอดคำสั่งซื้อ")

    slip_url = None
    if slip is not None and slip.filename:
        slip_url = save_image(slip, "payments")

    if order.payment:
        payment = order.payment
        payment.amount = amount
        payment.payment_method = method
        if slip_url:
            payment.slip_url = slip_url
        payment.uploaded_at = datetime.now(timezone.utc)
        if method == "cod":
            payment.status = models.PaymentStatusEnum.pending.value
            order.order_status = models.OrderStatusEnum.preparing.value
        else:
            payment.status = models.PaymentStatusEnum.waiting_verification.value
            order.order_status = models.OrderStatusEnum.payment_verification.value
    else:
        status_value = (
            models.PaymentStatusEnum.pending.value
            if method == "cod"
            else models.PaymentStatusEnum.waiting_verification.value
        )
        payment = models.Payment(
            order_id=order_id,
            amount=amount,
            payment_method=method,
            slip_url=slip_url,
            status=status_value,
            uploaded_at=datetime.now(timezone.utc),
        )
        db.add(payment)
        order.order_status = (
            models.OrderStatusEnum.preparing.value
            if method == "cod"
            else models.OrderStatusEnum.payment_verification.value
        )
        order.payment_method = method

    db.commit()
    db.refresh(payment)
    return payment


@router.get("/order/{order_id}", response_model=schemas.PaymentOut)
def get_payment_by_order(order_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    order = db.query(models.Order).options(joinedload(models.Order.items), joinedload(models.Order.payment)).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Payment not found")
    is_owner = order.customer_id == current_user.id
    is_seller = current_user.role in (models.RoleEnum.seller.value, models.RoleEnum.admin.value) and (
        current_user.role == models.RoleEnum.admin.value or any(i.seller_id == current_user.id for i in order.items)
    )
    if not is_owner and not is_seller:
        raise HTTPException(status_code=404, detail="Payment not found")
    if not order.payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return order.payment


@router.get("/", response_model=List[schemas.PaymentOut])
def list_payments(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    query = db.query(models.Payment).join(models.Order)
    if current_user.role == models.RoleEnum.admin.value:
        payments = query.all()
    elif current_user.role == models.RoleEnum.seller.value:
        payments = query.join(models.OrderItem).filter(models.OrderItem.seller_id == current_user.id).distinct().all()
    else:
        payments = query.filter(models.Order.customer_id == current_user.id).all()
    return payments


@router.put("/{payment_id}/verify", response_model=schemas.PaymentOut)
def verify_payment(
    payment_id: int,
    payload: schemas.PaymentVerify,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if current_user.role not in (models.RoleEnum.seller.value, models.RoleEnum.admin.value):
        raise HTTPException(status_code=403, detail="Only sellers or admins can verify payments")

    payment = (
        db.query(models.Payment)
        .options(joinedload(models.Payment.order).joinedload(models.Order.items))
        .filter(models.Payment.id == payment_id)
        .first()
    )
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    if current_user.role == models.RoleEnum.seller.value:
        if not any(item.seller_id == current_user.id for item in payment.order.items):
            raise HTTPException(status_code=403, detail="ไม่มีสิทธิ์ตรวจสอบสลิปนี้")

    if payload.approved:
        payment.status = models.PaymentStatusEnum.paid.value
        payment.verified_at = datetime.now(timezone.utc)
        payment.order.order_status = models.OrderStatusEnum.preparing.value
    else:
        payment.status = models.PaymentStatusEnum.rejected.value
        payment.order.order_status = models.OrderStatusEnum.pending_payment.value

    db.commit()
    db.refresh(payment)
    return payment
