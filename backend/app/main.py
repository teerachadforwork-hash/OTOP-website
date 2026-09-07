import os
from sqlalchemy import text
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .database.database import engine, SessionLocal
from .models import models
from .routers import auth_router, product_router, community_router, category_router, cart_router, order_router, payment_router, dashboard_router, review_router, news_router
from .utils.news_seed import seed_default_news

models.Base.metadata.create_all(bind=engine)


def _add_check_constraint_statement(table_name: str, constraint_name: str, expression: str) -> str:
    return f"""
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = '{constraint_name}'
    ) THEN
        ALTER TABLE {table_name}
        ADD CONSTRAINT {constraint_name}
        CHECK ({expression}) NOT VALID;
    END IF;
END
$$;
"""


def ensure_postgres_schema():
    statements = [
        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100)",
        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'promptpay'",
        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount FLOAT DEFAULT 0",
        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(40)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20)",
        "ALTER TABLE communities ADD COLUMN IF NOT EXISTS leader_name VARCHAR(150)",
        "ALTER TABLE communities ADD COLUMN IF NOT EXISTS established_year INTEGER",
        "ALTER TABLE communities ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()",
        """
        CREATE TABLE IF NOT EXISTS news_comments (
            id SERIAL PRIMARY KEY,
            news_id INTEGER NOT NULL REFERENCES news_articles(id),
            user_id INTEGER NOT NULL REFERENCES users(id),
            content TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
        """,
        "UPDATE products SET stock = 0 WHERE stock < 0",
        "UPDATE products SET review_count = 0 WHERE review_count < 0",
        "UPDATE products SET rating_cache = 0 WHERE rating_cache < 0",
        "UPDATE products SET rating_cache = 5 WHERE rating_cache > 5",
        """
        DELETE FROM cart_items newer
        USING cart_items older
        WHERE newer.ctid > older.ctid
          AND newer.user_id = older.user_id
          AND newer.product_id = older.product_id
        """,
        """
        DELETE FROM reviews newer
        USING reviews older
        WHERE newer.ctid > older.ctid
          AND newer.order_id = older.order_id
          AND newer.customer_id = older.customer_id
          AND newer.product_id = older.product_id
        """,
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_cart_items_user_product ON cart_items (user_id, product_id)",
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_reviews_order_customer_product ON reviews (order_id, customer_id, product_id)",
        "CREATE INDEX IF NOT EXISTS ix_communities_location ON communities (province, district, subdistrict)",
        "CREATE INDEX IF NOT EXISTS ix_products_public_catalog ON products (status, province, category_id, community_id)",
        "CREATE INDEX IF NOT EXISTS ix_products_seller_status ON products (seller_id, status)",
        "CREATE INDEX IF NOT EXISTS ix_orders_customer_created ON orders (customer_id, created_at)",
        "CREATE INDEX IF NOT EXISTS ix_orders_status_created ON orders (order_status, created_at)",
        "CREATE INDEX IF NOT EXISTS ix_order_items_seller_order ON order_items (seller_id, order_id)",
        "CREATE INDEX IF NOT EXISTS ix_order_items_product_order ON order_items (product_id, order_id)",
        "CREATE INDEX IF NOT EXISTS ix_payments_status_uploaded ON payments (status, uploaded_at)",
        "CREATE INDEX IF NOT EXISTS ix_reviews_product_created ON reviews (product_id, created_at)",
        "CREATE INDEX IF NOT EXISTS ix_reviews_customer_created ON reviews (customer_id, created_at)",
        "CREATE INDEX IF NOT EXISTS ix_cart_items_user_updated ON cart_items (user_id, updated_at)",
        "CREATE INDEX IF NOT EXISTS ix_news_published_created ON news_articles (is_published, created_at)",
        "CREATE INDEX IF NOT EXISTS ix_news_comments_article_created ON news_comments (news_id, created_at)",
        "CREATE INDEX IF NOT EXISTS ix_news_comments_user_created ON news_comments (user_id, created_at)",
        "CREATE INDEX IF NOT EXISTS ix_behavior_user_created ON user_behavior_logs (user_id, created_at)",
        "CREATE INDEX IF NOT EXISTS ix_behavior_event_created ON user_behavior_logs (event_type, created_at)",
        "CREATE INDEX IF NOT EXISTS ix_behavior_product_created ON user_behavior_logs (product_id, created_at)",
        _add_check_constraint_statement("users", "ck_users_role", "role IN ('admin', 'seller', 'customer')"),
        _add_check_constraint_statement("products", "ck_products_price_positive", "price > 0"),
        _add_check_constraint_statement("products", "ck_products_stock_nonnegative", "stock >= 0"),
        _add_check_constraint_statement("products", "ck_products_rating_range", "rating_cache >= 0 AND rating_cache <= 5"),
        _add_check_constraint_statement("products", "ck_products_review_count_nonnegative", "review_count >= 0"),
        _add_check_constraint_statement(
            "products",
            "ck_products_status",
            "status IN ('pending', 'approved', 'rejected', 'inactive', 'out_of_stock')",
        ),
        _add_check_constraint_statement("orders", "ck_orders_total_price_nonnegative", "total_price >= 0"),
        _add_check_constraint_statement("orders", "ck_orders_shipping_cost_nonnegative", "shipping_cost >= 0"),
        _add_check_constraint_statement("orders", "ck_orders_discount_amount_nonnegative", "discount_amount >= 0"),
        _add_check_constraint_statement("orders", "ck_orders_grand_total_nonnegative", "grand_total >= 0"),
        _add_check_constraint_statement(
            "orders",
            "ck_orders_status",
            "order_status IN ('pending_payment', 'payment_verification', 'preparing', 'shipped', 'completed', 'cancelled')",
        ),
        _add_check_constraint_statement("order_items", "ck_order_items_unit_price_nonnegative", "unit_price >= 0"),
        _add_check_constraint_statement("order_items", "ck_order_items_quantity_positive", "quantity > 0"),
        _add_check_constraint_statement("order_items", "ck_order_items_subtotal_nonnegative", "subtotal >= 0"),
        _add_check_constraint_statement("payments", "ck_payments_amount_nonnegative", "amount >= 0"),
        _add_check_constraint_statement(
            "payments",
            "ck_payments_status",
            "status IN ('pending', 'waiting_verification', 'paid', 'rejected')",
        ),
        _add_check_constraint_statement("reviews", "ck_reviews_rating_range", "rating >= 1 AND rating <= 5"),
        _add_check_constraint_statement("cart_items", "ck_cart_items_quantity_positive", "quantity > 0"),
        _add_check_constraint_statement("news_comments", "ck_news_comments_content_not_blank", "length(trim(content)) > 0"),
    ]

    with engine.begin() as conn:
        for stmt in statements:
            conn.execute(text(stmt))


ensure_postgres_schema()

app = FastAPI(title="OTOP Connect API", version="1.0.0")

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",

    "https://otop-website-ji1y-1553kfqn3-boy-8ebe.vercel.app",
    "https://otop-website-ji1y-ocx7k11gz-boy-8ebe.vercel.app",
    "https://otop-website-ji1y-git-main-boy-8ebe.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"(http://(localhost|127\.0\.0\.1):\d+|https://otop-website-ji1y-[a-z0-9-]+-boy-8ebe\.vercel\.app)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"(http://(localhost|127\.0\.0\.1):\d+|https://otop-website-ji1y-[a-z0-9-]+-boy-8ebe\.vercel\.app)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
upload_dir = os.path.join(BACKEND_DIR, "uploads")
os.makedirs(os.path.join(upload_dir, "products"), exist_ok=True)
os.makedirs(os.path.join(upload_dir, "communities"), exist_ok=True)
os.makedirs(os.path.join(upload_dir, "payments"), exist_ok=True)
os.makedirs(os.path.join(upload_dir, "avatars"), exist_ok=True)
os.makedirs(os.path.join(upload_dir, "news"), exist_ok=True)

app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")

# Register routers
app.include_router(auth_router.router)
app.include_router(product_router.router)
app.include_router(community_router.router)
app.include_router(category_router.router)
app.include_router(order_router.router)
app.include_router(cart_router.router)
app.include_router(payment_router.router)
app.include_router(dashboard_router.router, prefix="/api/dashboard")
app.include_router(review_router.router, prefix="/api/reviews")
app.include_router(news_router.router)

def _seed_news_if_needed():
    db = SessionLocal()
    try:
        seed_default_news(db)
    finally:
        db.close()

_seed_news_if_needed()

@app.get("/")
def root():
    return {"message": "Welcome to OTOP Connect API", "status": "online"}
