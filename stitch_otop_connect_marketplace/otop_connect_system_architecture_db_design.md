# OTOP Connect — Technical Architecture & Implementation Blueprint
**ระบบตลาดออนไลน์เพื่อส่งเสริมสินค้า OTOP และผลิตภัณฑ์ชุมชนของประเทศไทย**

---

## 1. System Architecture Overview

```
                                  +---------------------------------------+
                                  |         Clients / Devices             |
                                  |  (Desktop Browser, Tablet, Mobile)    |
                                  +---------------------------------------+
                                                     |
                                                     | HTTPS / REST API / JWT
                                                     v
                                  +---------------------------------------+
                                  |        Frontend (React SPA)           |
                                  |  - Tailwind CSS / Lucide Icons        |
                                  |  - Axios Client / React Context       |
                                  |  - Customer / Seller / Admin Views   |
                                  +---------------------------------------+
                                                     |
                                                     | RESTful JSON API
                                                     v
+---------------------------------------------------------------------------------------------------+
|                                     FastAPI Backend Engine                                        |
|  +------------------+  +-------------------+  +--------------------+  +------------------------+  |
|  |   Auth Middleware|  |  CORS & Security  |  |  Role-Based RBAC   |  | Request/Response Schema|  |
|  |  (JWT & Bcrypt)  |  |  (Input Sanitizer)|  | (Admin/Seller/Cust)|  |      (Pydantic v2)     |  |
|  +------------------+  +-------------------+  +--------------------+  +------------------------+  |
|                                                     |                                             |
|  +--------------------------------------------------+------------------------------------------+  |
|  |                               Routers & API Controllers                                     |  |
|  |  /api/auth   /api/products   /api/communities   /api/cart   /api/orders   /api/analytics     |  |
|  +--------------------------------------------------+------------------------------------------+  |
|                                                     |                                             |
|  +--------------------------------------------------+------------------------------------------+  |
|  |                                  Service & Business Logic                                    |  |
|  |  - Order & Stock Deduction (BR-08, BR-09)        - AI Behavior Logging (Views/Searches)      |  |
|  |  - Multi-seller Cart & Commission                - Slip Upload & Simulated Settlement        |  |
|  +--------------------------------------------------+------------------------------------------+  |
|                                                     |                                             |
|  +--------------------------------------------------+------------------------------------------+  |
|  |                              SQLAlchemy 2.0 ORM Layer                                        |  |
|  +--------------------------------------------------+------------------------------------------+  |
+---------------------------------------------------------------------------------------------------+
                                                     |
                                                     v
                                  +---------------------------------------+
                                  |           SQLite Database             |
                                  |             (otop.db)                 |
                                  |  WAL mode enabled, FK constraints on  |
                                  +---------------------------------------+
```

---

## 2. Database ER Diagram & Schema (SQLAlchemy Models)

### Entity Relationship
* `User (1) ---- (N) Order`
* `User (1) ---- (N) Review`
* `User (1) ---- (N) Address`
* `User (1) ---- (1) SellerProfile`
* `Community (1) ---- (N) SellerProfile`
* `Community (1) ---- (N) Product`
* `Category (1) ---- (N) Product`
* `Product (1) ---- (N) ProductImage`
* `Product (1) ---- (N) Review`
* `Product (1) ---- (N) CartItem`
* `Product (1) ---- (N) OrderItem`
* `Order (1) ---- (N) OrderItem`
* `Order (1) ---- (1) Payment`
* `User (1) ---- (N) UserBehaviorLog` (AI Data Foundation)

### Database DDL (SQLite)

```sql
PRAGMA foreign_keys = ON;

-- 1. Users
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(20),
    role VARCHAR(20) DEFAULT 'customer' CHECK(role IN ('admin', 'seller', 'customer')),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Communities
CREATE TABLE communities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(200) NOT NULL,
    province VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    subdistrict VARCHAR(100),
    description TEXT,
    history TEXT,
    story TEXT,
    banner_image TEXT,
    contact_phone VARCHAR(50),
    contact_email VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Categories
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    icon_name VARCHAR(50),
    description TEXT
);

-- 4. Products
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    seller_id INTEGER NOT NULL,
    community_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    name VARCHAR(250) NOT NULL,
    description TEXT NOT NULL,
    story TEXT,
    price DECIMAL(10,2) NOT NULL CHECK(price >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK(stock >= 0),
    province VARCHAR(100) NOT NULL,
    hero_image TEXT NOT NULL,
    rating_cache DECIMAL(3,2) DEFAULT 5.0,
    review_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'approved' CHECK(status IN ('pending', 'approved', 'rejected', 'inactive', 'out_of_stock')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES users(id),
    FOREIGN KEY (community_id) REFERENCES communities(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- 5. Orders & Order Items
CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    shipping_cost DECIMAL(10,2) NOT NULL DEFAULT 50.0,
    grand_total DECIMAL(10,2) NOT NULL,
    shipping_address TEXT NOT NULL,
    order_status VARCHAR(30) DEFAULT 'pending_payment' CHECK(order_status IN ('pending_payment', 'payment_verification', 'preparing', 'shipped', 'completed', 'cancelled')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id)
);

CREATE TABLE order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    seller_id INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL CHECK(quantity > 0),
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (seller_id) REFERENCES users(id)
);

-- 6. Payments
CREATE TABLE payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'bank_transfer',
    slip_url TEXT,
    status VARCHAR(30) DEFAULT 'pending' CHECK(status IN ('pending', 'waiting_verification', 'paid', 'rejected')),
    uploaded_at DATETIME,
    verified_at DATETIME,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- 7. Reviews
CREATE TABLE reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    order_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (customer_id) REFERENCES users(id),
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- 8. Future AI Event Store
CREATE TABLE user_behavior_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    session_id VARCHAR(100),
    event_type VARCHAR(50) NOT NULL, -- view_product, search, add_to_cart, purchase
    product_id INTEGER,
    query_text TEXT,
    metadata_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 3. REST API Specification

| Endpoint | Method | Role | Description |
|---|---|---|---|
| `/api/auth/register` | `POST` | Public | Register customer / seller |
| `/api/auth/login` | `POST` | Public | Authenticate & return JWT token |
| `/api/auth/me` | `GET` | User | Get current profile |
| `/api/products` | `GET` | Public | Filter products by name, province, category, sort |
| `/api/products/{id}` | `GET` | Public | Get product detail with seller & community story |
| `/api/products` | `POST` | Seller/Admin | Create product (auto-pending or approved) |
| `/api/products/{id}` | `PUT` | Seller/Admin | Update product stock, pricing, content |
| `/api/communities` | `GET` | Public | List all communities & provincial heritage |
| `/api/communities/{id}` | `GET` | Public | Community profile + its products & artisans |
| `/api/cart` | `GET/POST` | Customer | Manage shopping cart items |
| `/api/orders` | `POST` | Customer | Checkout, validate stock & reserve |
| `/api/orders/{id}/slip`| `POST` | Customer | Upload simulated payment transfer slip |
| `/api/orders/{id}/status`| `PUT` | Admin/Seller | Update order workflow status |
| `/api/reviews` | `POST` | Customer | Review verified purchased items |
| `/api/admin/dashboard` | `GET` | Admin | Aggregate sales, orders, community stats |
| `/api/seller/dashboard`| `GET` | Seller | Seller revenue, store order queue, low stock |
| `/api/ai/recommendations`| `GET` | Public | Future-ready content/collaborative filtering |

---

## 4. Business Rules Compliance Matrix
* **BR-01**: Checkout requires authenticated JWT; guest redirected to login.
* **BR-02 & BR-03**: Quantities validated against `stock` in DB transactions; rejects order if `qty > stock`.
* **BR-04**: Review API verifies `order.customer_id == user.id AND order.status == 'completed'`.
* **BR-05**: Multi-tenancy enforcement; Seller queries filtered by `seller_id = current_user.id`.
* **BR-06 & BR-07**: Admin can approve/reject products and override order states.
* **BR-08 & BR-09**: Atomic stock decrement upon order confirmation, automatic replenishment upon cancellation.
