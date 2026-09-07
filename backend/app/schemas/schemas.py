from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from ..models.models import RoleEnum, OrderStatusEnum, PaymentStatusEnum, ProductStatusEnum

# Base Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone_number: Optional[str] = None
    avatar_url: Optional[str] = None

class ResetPasswordIn(BaseModel):
    email: EmailStr
    private_key: str
    new_password: str

class AdminResetPasswordIn(BaseModel):
    user_id: int
    new_password: str

class UserCreate(UserBase):
    password: str
    role: RoleEnum = RoleEnum.customer

class UserUpdate(BaseModel):
    full_name: str
    email: EmailStr
    password: Optional[str] = None
    phone_number: Optional[str] = None
    hint: Optional[str] = None

class AccountDeleteIn(BaseModel):
    password: str

class UserRoleUpdate(BaseModel):
    role: RoleEnum

class UserOut(UserBase):
    id: int
    role: RoleEnum
    is_active: bool = True
    created_at: Optional[datetime] = None
    private_key: Optional[str] = None
    hint: Optional[str] = None
    
    class Config:
        from_attributes = True

class AdminUserOut(BaseModel):
    id: int
    email: str
    full_name: str
    phone_number: Optional[str] = None
    avatar_url: Optional[str] = None
    role: str
    is_active: bool = True
    created_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None
    hint: Optional[str] = None

    class Config:
        from_attributes = True

class CommunityBase(BaseModel):
    name: str
    province: str
    district: str
    subdistrict: Optional[str] = None
    description: Optional[str] = None
    history: Optional[str] = None
    story: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None

class CommunityCreate(CommunityBase):
    banner_image: Optional[str] = None
    leader_name: Optional[str] = None
    established_year: Optional[int] = None

class CommunityUpdate(BaseModel):
    name: Optional[str] = None
    province: Optional[str] = None
    district: Optional[str] = None
    subdistrict: Optional[str] = None
    description: Optional[str] = None
    history: Optional[str] = None
    story: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    banner_image: Optional[str] = None
    leader_name: Optional[str] = None
    established_year: Optional[int] = None

class CommunityOut(CommunityBase):
    id: int
    banner_image: Optional[str] = None
    cover_image: Optional[str] = None
    leader_name: Optional[str] = None
    established_year: Optional[int] = None
    products_count: int = 0
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class CategoryBase(BaseModel):
    name: str
    icon_name: Optional[str] = None
    description: Optional[str] = None

class CategoryOut(CategoryBase):
    id: int
    
    class Config:
        from_attributes = True

class ProductBase(BaseModel):
    name: str
    description: str
    story: Optional[str] = None
    price: float = Field(..., gt=0)
    stock: int = Field(default=0, ge=0)
    province: str
    category_id: int
    community_id: int

class ProductCreate(ProductBase):
    hero_image: str

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    story: Optional[str] = None
    price: Optional[float] = Field(default=None, gt=0)
    stock: Optional[int] = Field(default=None, ge=0)
    province: Optional[str] = None
    category_id: Optional[int] = None
    community_id: Optional[int] = None
    hero_image: Optional[str] = None
    status: Optional[ProductStatusEnum] = None

class ProductOut(ProductBase):
    id: int
    seller_id: int
    hero_image: str
    rating_cache: float
    review_count: int
    status: ProductStatusEnum
    created_at: datetime
    updated_at: datetime
    seller: Optional[UserOut] = None
    community: Optional[CommunityOut] = None
    category: Optional[CategoryOut] = None
    
    class Config:
        from_attributes = True

class ProductDetailOut(ProductOut):
    seller: UserOut
    community: CommunityOut
    category: CategoryOut

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
class CartItemBase(BaseModel):
    product_id: int
    quantity: int = 1

class CartItemCreate(CartItemBase):
    pass

class CartProductOut(BaseModel):
    id: int
    name: str
    price: float
    stock: int
    hero_image: str
    seller_id: int
    status: Optional[str] = None

    class Config:
        from_attributes = True

class CartItemOut(CartItemBase):
    id: int
    user_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    product: Optional[CartProductOut] = None

    class Config:
        from_attributes = True


class AdminCartItemOut(CartItemOut):
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    user_role: Optional[str] = None
    user_phone: Optional[str] = None

class CartItemUpdate(BaseModel):
    quantity: int = Field(..., ge=0)

class OrderItemIn(BaseModel):
    product_id: int
    quantity: int = Field(..., ge=1)

class OrderItemOut(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: float
    subtotal: float
    name: Optional[str] = None
    image_url: Optional[str] = None

    class Config:
        from_attributes = True

class OrderBase(BaseModel):
    shipping_address: str
    shipping_cost: float = 50.0

class OrderCreate(BaseModel):
    shipping_address: str
    shipping_cost: Optional[float] = None
    payment_method: str = "promptpay"
    coupon_code: Optional[str] = None
    items: List[OrderItemIn]

class OrderStatusUpdate(BaseModel):
    order_status: str
    tracking_number: Optional[str] = None

class OrderOut(OrderBase):
    id: int
    total_price: float
    grand_total: float
    order_status: str
    created_at: Optional[datetime] = None
    items: List[OrderItemOut]
    payment_method: Optional[str] = None
    tracking_number: Optional[str] = None
    discount_amount: Optional[float] = 0
    slip_url: Optional[str] = None
    payment_status: Optional[str] = None
    payment_id: Optional[int] = None
    invoice_number: Optional[str] = None
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None

    class Config:
        from_attributes = True

class NewsBase(BaseModel):
    title: str
    excerpt: Optional[str] = None
    content: str
    cover_image: Optional[str] = None
    category: Optional[str] = "ประชาสัมพันธ์"
    is_published: bool = True

class NewsCreate(NewsBase):
    pass

class NewsUpdate(BaseModel):
    title: Optional[str] = None
    excerpt: Optional[str] = None
    content: Optional[str] = None
    cover_image: Optional[str] = None
    category: Optional[str] = None
    is_published: Optional[bool] = None

class NewsOut(NewsBase):
    id: int
    author_id: Optional[int] = None
    author_name: Optional[str] = None
    comment_count: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class NewsCommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000)

class NewsCommentOut(BaseModel):
    id: int
    news_id: int
    user_id: int
    user_name: Optional[str] = None
    user_role: Optional[str] = None
    content: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PaymentOut(BaseModel):
    id: int
    order_id: int
    amount: float
    payment_method: str
    slip_url: Optional[str] = None
    status: str
    uploaded_at: Optional[datetime] = None
    verified_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PaymentVerify(BaseModel):
    approved: bool

class ReviewCreate(BaseModel):
    order_id: int
    product_id: int
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

class ReviewOut(BaseModel):
    id: int
    product_id: int
    customer_id: int
    order_id: int
    rating: int
    comment: Optional[str] = None
    created_at: datetime
    user_name: Optional[str] = None

    class Config:
        from_attributes = True

class SalesSummaryOut(BaseModel):
    total_orders: int
    total_revenue: float
    avg_order_value: float

class TopProductOut(BaseModel):
    product_id: int
    name: str
    sold: int

class UserGrowthOut(BaseModel):
    date: datetime
    count: int

class DashboardSummaryOut(BaseModel):
    sales_summary: SalesSummaryOut
    top_products: List[TopProductOut]
    user_growth: List[UserGrowthOut]

    class Config:
        from_attributes = True

# --- Social Features Schemas ---

class GroupChatCreate(BaseModel):
    name: str

class GroupChatOut(BaseModel):
    id: int
    name: str
    owner_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class GroupChatUpdate(BaseModel):
    name: str

class GroupChatMemberAdd(BaseModel):
    email: str

class GroupChatMemberOut(BaseModel):
    user_id: int
    user_name: Optional[str] = None
    user_avatar: Optional[str] = None
    role: str
    joined_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class GroupChatMessageCreate(BaseModel):
    content: Optional[str] = None
    image_url: Optional[str] = None

class GroupChatMessageOut(BaseModel):
    id: int
    group_id: int
    sender_id: int
    content: Optional[str] = None
    image_url: Optional[str] = None
    created_at: datetime
    sender_name: Optional[str] = None
    sender_avatar: Optional[str] = None
    sender_role: Optional[str] = None
    
    class Config:
        from_attributes = True

class PrivateChatRoomCreate(BaseModel):
    user2_id: int

class PrivateChatRoomOut(BaseModel):
    id: int
    user1_id: int
    user2_id: int
    created_at: datetime
    other_user_name: Optional[str] = None
    other_user_avatar: Optional[str] = None
    
    class Config:
        from_attributes = True

class PrivateChatMessageCreate(BaseModel):
    content: Optional[str] = None
    image_url: Optional[str] = None

class PrivateChatMessageOut(BaseModel):
    id: int
    room_id: int
    sender_id: int
    content: Optional[str] = None
    image_url: Optional[str] = None
    created_at: datetime
    sender_name: Optional[str] = None
    sender_avatar: Optional[str] = None
    sender_role: Optional[str] = None
    
    class Config:
        from_attributes = True

class PostCreate(BaseModel):
    content: str
    image_url: Optional[str] = None

class PostUpdate(BaseModel):
    content: Optional[str] = None
    image_url: Optional[str] = None

class PostOut(BaseModel):
    id: int
    author_id: int
    content: str
    image_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    author_name: Optional[str] = None
    author_avatar: Optional[str] = None
    author_role: Optional[str] = None
    comments_count: int = 0
    likes_count: int = 0
    is_liked: bool = False
    
    class Config:
        from_attributes = True

class PostCommentCreate(BaseModel):
    content: str
    parent_comment_id: Optional[int] = None

class PostCommentOut(BaseModel):
    id: int
    post_id: int
    author_id: int
    parent_comment_id: Optional[int] = None
    content: str
    created_at: datetime
    author_name: Optional[str] = None
    author_avatar: Optional[str] = None
    replies: List["PostCommentOut"] = []
    
    class Config:
        from_attributes = True

PostCommentOut.model_rebuild()
