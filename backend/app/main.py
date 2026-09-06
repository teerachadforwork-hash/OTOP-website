import os
from sqlalchemy import inspect, text
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .database.database import engine, SessionLocal
from .models import models
from .routers import auth_router, product_router, community_router, category_router, cart_router, order_router, payment_router, dashboard_router, review_router, news_router
from .utils.news_seed import seed_default_news

models.Base.metadata.create_all(bind=engine)

def ensure_sqlite_columns():
    inspector = inspect(engine)
    statements = []
    table_names = inspector.get_table_names()
    if "orders" in table_names:
        cols = {c["name"] for c in inspector.get_columns("orders")}
        if "tracking_number" not in cols:
            statements.append("ALTER TABLE orders ADD COLUMN tracking_number VARCHAR(100)")
        if "payment_method" not in cols:
            statements.append("ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50) DEFAULT 'promptpay'")
        if "discount_amount" not in cols:
            statements.append("ALTER TABLE orders ADD COLUMN discount_amount FLOAT DEFAULT 0")
        if "invoice_number" not in cols:
            statements.append("ALTER TABLE orders ADD COLUMN invoice_number VARCHAR(40)")
    if "users" in table_names:
        user_cols = {c["name"] for c in inspector.get_columns("users")}
        if "avatar_url" not in user_cols:
            statements.append("ALTER TABLE users ADD COLUMN avatar_url TEXT")
        if "deleted_at" not in user_cols:
            statements.append("ALTER TABLE users ADD COLUMN deleted_at DATETIME")
        if "created_at" not in user_cols:
            statements.append("ALTER TABLE users ADD COLUMN created_at DATETIME")
        if "is_active" not in user_cols:
            statements.append("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1")
        if "phone_number" not in user_cols:
            statements.append("ALTER TABLE users ADD COLUMN phone_number VARCHAR(20)")
    if "communities" in table_names:
        comm_cols = {c["name"] for c in inspector.get_columns("communities")}
        if "leader_name" not in comm_cols:
            statements.append("ALTER TABLE communities ADD COLUMN leader_name VARCHAR(150)")
        if "established_year" not in comm_cols:
            statements.append("ALTER TABLE communities ADD COLUMN established_year INTEGER")
        if "updated_at" not in comm_cols:
            statements.append("ALTER TABLE communities ADD COLUMN updated_at DATETIME")
    if statements:
        with engine.begin() as conn:
            for stmt in statements:
                conn.execute(text(stmt))

ensure_sqlite_columns()

app = FastAPI(title="OTOP Connect API", version="1.0.0")

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
]

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
