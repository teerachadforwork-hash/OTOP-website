from sqlalchemy.orm import Session
from ..models import models
from ..schemas import schemas


def _role_value(role) -> str:
    if hasattr(role, "value"):
        role = role.value
    value = str(role or models.RoleEnum.customer.value).strip().lower()
    if value not in {e.value for e in models.RoleEnum}:
        return models.RoleEnum.customer.value
    return value


def serialize_admin_user(user: models.User) -> schemas.AdminUserOut:
    return schemas.AdminUserOut(
        id=user.id,
        email=user.email or "",
        full_name=user.full_name or "",
        phone_number=user.phone_number,
        avatar_url=user.avatar_url,
        role=_role_value(user.role),
        is_active=bool(user.is_active) if user.is_active is not None else True,
        created_at=user.created_at,
        deleted_at=getattr(user, "deleted_at", None),
    )


def serialize_admin_cart_item(item: models.CartItem) -> schemas.AdminCartItemOut:
    product = item.product
    user = item.user
    product_out = None
    if product:
        product_out = schemas.CartProductOut(
            id=product.id,
            name=product.name,
            price=product.price,
            stock=product.stock,
            hero_image=product.hero_image,
            seller_id=product.seller_id,
            status=getattr(product, "status", None),
        )
    return schemas.AdminCartItemOut(
        id=item.id,
        user_id=item.user_id,
        product_id=item.product_id,
        quantity=item.quantity,
        created_at=item.created_at,
        updated_at=item.updated_at,
        product=product_out,
        user_name=user.full_name if user else None,
        user_email=user.email if user else None,
        user_role=_role_value(user.role) if user else None,
        user_phone=user.phone_number if user else None,
    )


def invoice_number_for(order: models.Order) -> str:
    if getattr(order, "invoice_number", None):
        return order.invoice_number
    return f"OTOP-{int(order.id):06d}"


def serialize_community(community: models.Community, products_count: int = 0) -> schemas.CommunityOut:
    banner = community.banner_image
    return schemas.CommunityOut(
        id=community.id,
        name=community.name,
        province=community.province,
        district=community.district,
        subdistrict=community.subdistrict,
        description=community.description,
        history=community.history,
        story=community.story,
        contact_phone=community.contact_phone,
        contact_email=community.contact_email,
        banner_image=banner,
        cover_image=banner,
        leader_name=getattr(community, "leader_name", None),
        established_year=getattr(community, "established_year", None),
        products_count=products_count,
        created_at=community.created_at,
    )


def serialize_news(article: models.NewsArticle) -> schemas.NewsOut:
    comments = getattr(article, "comments", None)
    return schemas.NewsOut(
        id=article.id,
        title=article.title,
        excerpt=article.excerpt,
        content=article.content,
        cover_image=article.cover_image,
        category=article.category or "ประชาสัมพันธ์",
        is_published=bool(article.is_published),
        author_id=article.author_id,
        author_name=article.author.full_name if article.author else None,
        comment_count=len(comments) if comments is not None else 0,
        created_at=article.created_at,
        updated_at=article.updated_at,
    )


def serialize_news_comment(comment: models.NewsComment) -> schemas.NewsCommentOut:
    user = comment.user
    return schemas.NewsCommentOut(
        id=comment.id,
        news_id=comment.news_id,
        user_id=comment.user_id,
        user_name=user.full_name if user else None,
        user_role=_role_value(user.role) if user else None,
        content=comment.content,
        created_at=comment.created_at,
        updated_at=comment.updated_at,
    )


def serialize_order(order: models.Order) -> schemas.OrderOut:
    payment = order.payment
    items = []
    for item in order.items:
        product = item.product
        items.append(
            schemas.OrderItemOut(
                id=item.id,
                product_id=item.product_id,
                quantity=item.quantity,
                unit_price=item.unit_price,
                subtotal=item.subtotal,
                name=product.name if product else None,
                image_url=product.hero_image if product else None,
            )
        )
    return schemas.OrderOut(
        id=order.id,
        shipping_address=order.shipping_address,
        shipping_cost=order.shipping_cost or 0,
        total_price=order.total_price or 0,
        grand_total=order.grand_total or 0,
        order_status=str(order.order_status or ""),
        created_at=order.created_at,
        items=items,
        payment_method=getattr(order, "payment_method", None) or (payment.payment_method if payment else None),
        tracking_number=getattr(order, "tracking_number", None),
        discount_amount=getattr(order, "discount_amount", 0) or 0,
        slip_url=payment.slip_url if payment else None,
        payment_status=payment.status if payment else None,
        payment_id=payment.id if payment else None,
        invoice_number=invoice_number_for(order),
        customer_name=order.customer.full_name if order.customer else None,
        customer_email=order.customer.email if order.customer else None,
        customer_phone=order.customer.phone_number if order.customer else None,
    )


def serialize_review(review: models.Review) -> schemas.ReviewOut:
    return schemas.ReviewOut(
        id=review.id,
        product_id=review.product_id,
        customer_id=review.customer_id,
        order_id=review.order_id,
        rating=review.rating,
        comment=review.comment,
        created_at=review.created_at,
        user_name=review.customer.full_name if review.customer else None,
    )


def clear_user_cart(db: Session, user_id: int):
    db.query(models.CartItem).filter(models.CartItem.user_id == user_id).delete()
