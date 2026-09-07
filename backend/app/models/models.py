from sqlalchemy import Boolean, CheckConstraint, Column, DateTime, Float, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from ..database.database import Base

class RoleEnum(str, enum.Enum):
    admin = "admin"
    seller = "seller"
    customer = "customer"

class OrderStatusEnum(str, enum.Enum):
    pending_payment = "pending_payment"
    payment_verification = "payment_verification"
    preparing = "preparing"
    shipped = "shipped"
    completed = "completed"
    cancelled = "cancelled"

class PaymentStatusEnum(str, enum.Enum):
    pending = "pending"
    waiting_verification = "waiting_verification"
    paid = "paid"
    rejected = "rejected"

class ProductStatusEnum(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    inactive = "inactive"
    out_of_stock = "out_of_stock"

class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("role IN ('admin', 'seller', 'customer')", name="ck_users_role"),
    )
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    phone_number = Column(String(20))
    role = Column(String(50), default=RoleEnum.customer.value)
    avatar_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    deleted_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
    reset_token = Column(String(100), nullable=True, index=True)
    reset_token_expires = Column(DateTime(timezone=True), nullable=True)

    products = relationship("Product", back_populates="seller")
    orders = relationship("Order", back_populates="customer")
    reviews = relationship("Review", back_populates="customer")

class Community(Base):
    __tablename__ = "communities"
    __table_args__ = (
        Index("ix_communities_location", "province", "district", "subdistrict"),
    )
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    province = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False)
    subdistrict = Column(String(100))
    description = Column(Text)
    history = Column(Text)
    story = Column(Text)
    banner_image = Column(Text)
    contact_phone = Column(String(50))
    contact_email = Column(String(100))
    leader_name = Column(String(150))
    established_year = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    products = relationship("Product", back_populates="community")

class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    icon_name = Column(String(50))
    description = Column(Text)

    products = relationship("Product", back_populates="category")

class Product(Base):
    __tablename__ = "products"
    __table_args__ = (
        CheckConstraint("price > 0", name="ck_products_price_positive"),
        CheckConstraint("stock >= 0", name="ck_products_stock_nonnegative"),
        CheckConstraint("rating_cache >= 0 AND rating_cache <= 5", name="ck_products_rating_range"),
        CheckConstraint("review_count >= 0", name="ck_products_review_count_nonnegative"),
        CheckConstraint(
            "status IN ('pending', 'approved', 'rejected', 'inactive', 'out_of_stock')",
            name="ck_products_status",
        ),
        Index("ix_products_public_catalog", "status", "province", "category_id", "community_id"),
        Index("ix_products_seller_status", "seller_id", "status"),
    )
    id = Column(Integer, primary_key=True, index=True)
    seller_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    community_id = Column(Integer, ForeignKey("communities.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    name = Column(String(250), nullable=False)
    description = Column(Text, nullable=False)
    story = Column(Text)
    price = Column(Float, nullable=False)
    stock = Column(Integer, nullable=False, default=0)
    province = Column(String(100), nullable=False)
    hero_image = Column(Text, nullable=False)
    rating_cache = Column(Float, default=5.0)
    review_count = Column(Integer, default=0)
    status = Column(String, default=ProductStatusEnum.approved.value)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    seller = relationship("User", back_populates="products")
    community = relationship("Community", back_populates="products")
    category = relationship("Category", back_populates="products")
    reviews = relationship("Review", back_populates="product")
    order_items = relationship("OrderItem", back_populates="product")

class Order(Base):
    __tablename__ = "orders"
    __table_args__ = (
        CheckConstraint("total_price >= 0", name="ck_orders_total_price_nonnegative"),
        CheckConstraint("shipping_cost >= 0", name="ck_orders_shipping_cost_nonnegative"),
        CheckConstraint("discount_amount >= 0", name="ck_orders_discount_amount_nonnegative"),
        CheckConstraint("grand_total >= 0", name="ck_orders_grand_total_nonnegative"),
        CheckConstraint(
            "order_status IN ('pending_payment', 'payment_verification', 'preparing', 'shipped', 'completed', 'cancelled')",
            name="ck_orders_status",
        ),
        Index("ix_orders_customer_created", "customer_id", "created_at"),
        Index("ix_orders_status_created", "order_status", "created_at"),
    )
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    total_price = Column(Float, nullable=False)
    shipping_cost = Column(Float, nullable=False, default=50.0)
    grand_total = Column(Float, nullable=False)
    shipping_address = Column(Text, nullable=False)
    order_status = Column(String, default=OrderStatusEnum.pending_payment.value)
    payment_method = Column(String(50), default="promptpay")
    tracking_number = Column(String(100))
    discount_amount = Column(Float, default=0.0)
    invoice_number = Column(String(40))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    customer = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order")
    payment = relationship("Payment", back_populates="order", uselist=False)

class OrderItem(Base):
    __tablename__ = "order_items"
    __table_args__ = (
        CheckConstraint("unit_price >= 0", name="ck_order_items_unit_price_nonnegative"),
        CheckConstraint("quantity > 0", name="ck_order_items_quantity_positive"),
        CheckConstraint("subtotal >= 0", name="ck_order_items_subtotal_nonnegative"),
        Index("ix_order_items_seller_order", "seller_id", "order_id"),
        Index("ix_order_items_product_order", "product_id", "order_id"),
    )
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    seller_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    unit_price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False)
    subtotal = Column(Float, nullable=False)

    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")

class Payment(Base):
    __tablename__ = "payments"
    __table_args__ = (
        CheckConstraint("amount >= 0", name="ck_payments_amount_nonnegative"),
        CheckConstraint(
            "status IN ('pending', 'waiting_verification', 'paid', 'rejected')",
            name="ck_payments_status",
        ),
        Index("ix_payments_status_uploaded", "status", "uploaded_at"),
    )
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), unique=True, nullable=False)
    amount = Column(Float, nullable=False)
    payment_method = Column(String(50), default="bank_transfer")
    slip_url = Column(Text)
    status = Column(String, default=PaymentStatusEnum.pending.value)
    uploaded_at = Column(DateTime(timezone=True))
    verified_at = Column(DateTime(timezone=True))

    order = relationship("Order", back_populates="payment")

class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (
        UniqueConstraint("order_id", "customer_id", "product_id", name="uq_reviews_order_customer_product"),
        CheckConstraint("rating >= 1 AND rating <= 5", name="ck_reviews_rating_range"),
        Index("ix_reviews_product_created", "product_id", "created_at"),
        Index("ix_reviews_customer_created", "customer_id", "created_at"),
    )
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    rating = Column(Integer, nullable=False)
    comment = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    product = relationship("Product", back_populates="reviews")
    customer = relationship("User", back_populates="reviews")

class CartItem(Base):
    __tablename__ = "cart_items"
    __table_args__ = (
        UniqueConstraint("user_id", "product_id", name="uq_cart_items_user_product"),
        CheckConstraint("quantity > 0", name="ck_cart_items_quantity_positive"),
        Index("ix_cart_items_user_updated", "user_id", "updated_at"),
    )
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    user = relationship("User", backref="cart_items")
    product = relationship("Product", backref="cart_items")

class NewsArticle(Base):
    __tablename__ = "news_articles"
    __table_args__ = (
        Index("ix_news_published_created", "is_published", "created_at"),
    )
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(250), nullable=False)
    excerpt = Column(Text)
    content = Column(Text, nullable=False)
    cover_image = Column(Text)
    category = Column(String(80), default="ประชาสัมพันธ์")
    is_published = Column(Boolean, default=True)
    author_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    author = relationship("User")
    comments = relationship("NewsComment", back_populates="article", cascade="all, delete-orphan")


class NewsComment(Base):
    __tablename__ = "news_comments"
    __table_args__ = (
        CheckConstraint("length(trim(content)) > 0", name="ck_news_comments_content_not_blank"),
        Index("ix_news_comments_article_created", "news_id", "created_at"),
        Index("ix_news_comments_user_created", "user_id", "created_at"),
    )
    id = Column(Integer, primary_key=True, index=True)
    news_id = Column(Integer, ForeignKey("news_articles.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    article = relationship("NewsArticle", back_populates="comments")
    user = relationship("User")


class UserBehaviorLog(Base):
    __tablename__ = "user_behavior_logs"
    __table_args__ = (
        Index("ix_behavior_user_created", "user_id", "created_at"),
        Index("ix_behavior_event_created", "event_type", "created_at"),
        Index("ix_behavior_product_created", "product_id", "created_at"),
    )
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer)
    session_id = Column(String(100))
    event_type = Column(String(50), nullable=False)
    product_id = Column(Integer)
    query_text = Column(Text)
    metadata_json = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

# --- New Models for Social Features ---

class GroupChat(Base):
    __tablename__ = "group_chats"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    owner = relationship("User", foreign_keys=[owner_id])
    members = relationship("GroupChatMember", back_populates="group", cascade="all, delete-orphan")
    messages = relationship("GroupChatMessage", back_populates="group", cascade="all, delete-orphan")

class GroupChatMember(Base):
    __tablename__ = "group_chat_members"
    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("group_chats.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())

    group = relationship("GroupChat", back_populates="members")
    user = relationship("User")

class GroupChatMessage(Base):
    __tablename__ = "group_chat_messages"
    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("group_chats.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text)
    image_url = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    group = relationship("GroupChat", back_populates="messages")
    sender = relationship("User")

class PrivateChatRoom(Base):
    __tablename__ = "private_chat_rooms"
    id = Column(Integer, primary_key=True, index=True)
    user1_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user2_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user1 = relationship("User", foreign_keys=[user1_id])
    user2 = relationship("User", foreign_keys=[user2_id])
    messages = relationship("PrivateChatMessage", back_populates="room", cascade="all, delete-orphan")

class PrivateChatMessage(Base):
    __tablename__ = "private_chat_messages"
    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("private_chat_rooms.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text)
    image_url = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    room = relationship("PrivateChatRoom", back_populates="messages")
    sender = relationship("User")

class Post(Base):
    __tablename__ = "posts"
    id = Column(Integer, primary_key=True, index=True)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    image_url = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    author = relationship("User")
    comments = relationship("PostComment", back_populates="post", cascade="all, delete-orphan")

class PostComment(Base):
    __tablename__ = "post_comments"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    parent_comment_id = Column(
        Integer,
        ForeignKey("post_comments.id"),
        nullable=True
    )
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    post = relationship("Post", back_populates="comments")
    author = relationship("User")

    parent = relationship(
        "PostComment",
        remote_side=[id],
        back_populates="replies"
    )

    replies = relationship(
        "PostComment",
        back_populates="parent",
        cascade="all, delete-orphan"
    )
# --- New Models for Auth/OTP ---

class OTPCode(Base):
    __tablename__ = "otp_codes"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    phone_number = Column(String(20), nullable=False)
    code = Column(String(10), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used = Column(Boolean, default=False)
    attempts = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")
