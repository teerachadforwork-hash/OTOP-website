import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from ..database.database import get_db
from .. import models, auth
from ..schemas import schemas
from sqlalchemy.orm import Session

router = APIRouter()

@router.get("/admin/summary", response_model=schemas.DashboardSummaryOut)
def admin_summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if current_user.role != models.RoleEnum.admin.value:
        raise HTTPException(status_code=403, detail="Admin only")
    # Sales summary
    sales = db.query(
        func.count(models.Order.id).label("total_orders"),
        func.sum(models.Order.grand_total).label("total_revenue"),
        func.avg(models.Order.grand_total).label("avg_order_value")
    ).one()
    total_orders = sales.total_orders or 0
    total_revenue = float(sales.total_revenue or 0)
    avg_order_value = float(sales.avg_order_value or 0)
    sales_summary = schemas.SalesSummaryOut(
        total_orders=total_orders,
        total_revenue=total_revenue,
        avg_order_value=avg_order_value,
    )
    # Top products
    top_products_query = (
        db.query(models.Product.id, models.Product.name, func.sum(models.OrderItem.quantity).label("sold"))
        .join(models.OrderItem, models.OrderItem.product_id == models.Product.id)
        .group_by(models.Product.id)
        .order_by(func.sum(models.OrderItem.quantity).desc())
        .limit(5)
        .all()
    )
    top_products = [schemas.TopProductOut(product_id=pid, name=name, sold=sold) for pid, name, sold in top_products_query]
    # User growth (last 30 days)
    from datetime import datetime, timedelta
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    growth = (
        db.query(func.date(models.User.created_at).label("date"), func.count(models.User.id).label("count"))
        .filter(models.User.created_at >= thirty_days_ago)
        .group_by(func.date(models.User.created_at))
        .order_by(func.date(models.User.created_at))
        .all()
    )
    user_growth = [schemas.UserGrowthOut(date=date, count=count) for date, count in growth]
    return schemas.DashboardSummaryOut(
        sales_summary=sales_summary,
        top_products=top_products,
        user_growth=user_growth,
    )

@router.get("/seller/{seller_id}/summary", response_model=schemas.DashboardSummaryOut)
def seller_summary(
    seller_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if current_user.role == models.RoleEnum.seller.value and current_user.id != seller_id:
        raise HTTPException(status_code=403, detail="Cannot view another seller dashboard")
    if current_user.role not in (models.RoleEnum.seller.value, models.RoleEnum.admin.value):
        raise HTTPException(status_code=403, detail="Seller or admin only")
    # Sales summary for seller
    sales = (
        db.query(
            func.count(models.Order.id).label("total_orders"),
            func.sum(models.Order.grand_total).label("total_revenue"),
            func.avg(models.Order.grand_total).label("avg_order_value"),
        )
        .join(models.OrderItem, models.OrderItem.order_id == models.Order.id)
        .join(models.Product, models.Product.id == models.OrderItem.product_id)
        .filter(models.Product.seller_id == seller_id)
        .one()
    )
    total_orders = sales.total_orders or 0
    total_revenue = float(sales.total_revenue or 0)
    avg_order_value = float(sales.avg_order_value or 0)
    sales_summary = schemas.SalesSummaryOut(
        total_orders=total_orders,
        total_revenue=total_revenue,
        avg_order_value=avg_order_value,
    )
    # Top products for seller
    top_products_query = (
        db.query(models.Product.id, models.Product.name, func.sum(models.OrderItem.quantity).label("sold"))
        .join(models.OrderItem, models.OrderItem.product_id == models.Product.id)
        .filter(models.Product.seller_id == seller_id)
        .group_by(models.Product.id)
        .order_by(func.sum(models.OrderItem.quantity).desc())
        .limit(5)
        .all()
    )
    top_products = [schemas.TopProductOut(product_id=pid, name=name, sold=sold) for pid, name, sold in top_products_query]
    # User growth (same as admin, could be filtered by seller customers if needed)
    from datetime import datetime, timedelta
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    growth = (
        db.query(func.date(models.User.created_at).label("date"), func.count(models.User.id).label("count"))
        .filter(models.User.created_at >= thirty_days_ago)
        .group_by(func.date(models.User.created_at))
        .order_by(func.date(models.User.created_at))
        .all()
    )
    user_growth = [schemas.UserGrowthOut(date=date, count=count) for date, count in growth]
    return schemas.DashboardSummaryOut(
        sales_summary=sales_summary,
        top_products=top_products,
        user_growth=user_growth,
    )
