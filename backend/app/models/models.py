from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float, Text
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
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    phone_number = Column(String(20))
    role = Column(String, default=RoleEnum.customer.value)
    avatar_url = Column(Text)
    is_active = Column(Boolean, default=True)
    deleted_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    products = relationship("Product", back_populates="seller")
    orders = relationship("Order", back_populates="customer")
    reviews = relationship("Review", back_populates="customer")

class Community(Base):
    __tablename__ = "communities"
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


class UserBehaviorLog(Base):
    __tablename__ = "user_behavior_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer)
    session_id = Column(String(100))
    event_type = Column(String(50), nullable=False)
    product_id = Column(Integer)
    query_text = Column(Text)
    metadata_json = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
