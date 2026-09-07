# OTOP Connect
### ระบบตลาดออนไลน์เพื่อส่งเสริมสินค้า OTOP และผลิตภัณฑ์ชุมชนของประเทศไทย

---

## 1. ภาพรวมโครงการ

| รายการ | รายละเอียด |
|---|---|
| ชื่อโครงการ | OTOP Connect |
| ประเภท | เว็บแอปพลิเคชัน E-Commerce เพื่อชุมชน |
| บทบาทผู้พัฒนา | Senior Full-Stack Developer / System Analyst / UI-UX Designer |

## 2. แนวคิดของระบบ

- แพลตฟอร์ม E-Commerce ที่ช่วยให้ผู้ประกอบการและวิสาหกิจชุมชนนำสินค้า OTOP มาจำหน่ายออนไลน์
- ผู้บริโภคค้นหา ดูรายละเอียด สั่งซื้อ และรีวิวสินค้าได้
- เน้นจุดเด่นเรื่อง **"ชุมชน"** — สินค้าแต่ละชิ้นเชื่อมโยงกับผู้ผลิต ชุมชน จังหวัด และเรื่องราวของสินค้า
- ออกแบบโครงสร้างให้รองรับการต่อยอด AI/ML ในอนาคต (ระบบแนะนำสินค้า, วิเคราะห์ยอดขาย, วิเคราะห์พฤติกรรมลูกค้า)

## 3. เป้าหมาย

1. เพิ่มช่องทางการจำหน่ายสินค้า OTOP
2. สนับสนุนผู้ประกอบการและชุมชนท้องถิ่น
3. ทำให้ผู้บริโภคค้นหาและสั่งซื้อสินค้าได้สะดวก
4. นำเสนอเรื่องราวและภูมิปัญญาของชุมชน
5. มีระบบบริหารจัดการสำหรับผู้ดูแลและผู้ประกอบการ
6. สามารถนำข้อมูลไปวิเคราะห์ต่อในอนาคต

## 4. Technology Stack

### หลัก (ตามที่กำหนด)

| ชั้น | เทคโนโลยี |
|---|---|
| Frontend | React, HTML5, CSS3, JavaScript, Responsive Web Design |
| Backend | Python, FastAPI |
| Database | Neon PostgreSQL + SQLAlchemy ORM |
| Authentication | JWT Authentication, Password Hashing |
| API | RESTful API |

### 4.1 Library เสริมที่แนะนำให้ใช้ (พร้อมเหตุผล)

**Backend (FastAPI)**

| Library | เหตุผลที่ควรใช้ |
|---|---|
| **Pydantic v2** | มากับ FastAPI อยู่แล้ว ใช้ validate schema/request-response ได้เข้มงวดและเร็วกว่าการเช็คมือ |
| **passlib[bcrypt]** | มาตรฐานอุตสาหกรรมสำหรับ hash รหัสผ่าน ปลอดภัยกว่าการเขียน hash เอง |
| **python-jose** หรือ **PyJWT** | ใช้ generate/verify JWT token ตรงตาม requirement Authentication |
| **python-multipart** | จำเป็นสำหรับรับไฟล์อัปโหลด (รูปสินค้า, สลิปโอนเงิน) ผ่าน FastAPI |
| **Alembic** | จัดการ Database Migration เมื่อ schema เปลี่ยนแปลง ป้องกันข้อมูลเสียหายเวลาพัฒนาเป็น Phase |
| **Pillow** | ย่อ/crop/แปลงรูปสินค้าอัตโนมัติ ลดขนาดไฟล์ก่อนเก็บ ลด Storage และเพิ่มความเร็วโหลดหน้าเว็บ |
| **slowapi** | จำกัด Rate Limit ป้องกันการยิง API ถี่เกินไป (brute-force login, spam order) |
| **python-dotenv** | จัดการ Environment Variable (secret key, config) แยกจาก Code |

**Frontend (React)**

| Library | เหตุผลที่ควรใช้ |
|---|---|
| **Axios** | จัดการ HTTP request/response, interceptor แนบ JWT token อัตโนมัติ สะดวกกว่า fetch แบบดิบ |
| **TanStack Query (React Query)** | จัดการ cache/loading/error state ของข้อมูลจาก API โดยอัตโนมัติ ลด boilerplate และแก้ปัญหา requirement ข้อ 10 (Error & Loading State) โดยตรง |
| **React Router** | จัดการ routing หลายหน้า (Customer/Seller/Admin) |
| **React Hook Form + Zod** | จัดการฟอร์ม (สมัครสมาชิก, เพิ่มสินค้า) พร้อม validate ฝั่ง client ก่อนส่ง API ลด error รอบ backend |
| **Tailwind CSS** | สร้าง UI แบบ Modern/Minimal/Responsive ได้เร็ว ตรงกับ requirement ข้อ UI/UX |
| **Recharts** | สร้างกราฟยอดขายใน Seller/Admin Dashboard (รองรับ React ธรรมชาติ) |
| **React Context / Zustand** | เก็บ state ผู้ใช้ที่ login, ตะกร้าสินค้า ระหว่างหน้า |
| **React Hot Toast** | แจ้งเตือนผู้ใช้แบบเข้าใจง่าย ตรงตาม requirement ข้อ 11 |

> หมายเหตุ: ทุก library ข้างต้นเป็น Open Source ที่ใช้กันแพร่หลาย เข้ากันได้กับ Stack หลักที่กำหนด และไม่กระทบต่อโครงสร้าง Database/API ที่ออกแบบไว้

## 5. ประเภทผู้ใช้งาน

### 5.1 Guest
- **ทำได้:** ดูสินค้า, ค้นหาสินค้า, ดูรายละเอียดสินค้า, ดูข้อมูลชุมชน, ดูร้านค้าชุมชน
- **ทำไม่ได้:** สั่งซื้อ, รีวิว, จัดการสินค้า

### 5.2 Customer
- สมัครสมาชิก / Login / Logout
- แก้ไข Profile, จัดการที่อยู่
- ค้นหาสินค้า, เพิ่มสินค้าในตะกร้า, สั่งซื้อสินค้า
- ดูประวัติ/สถานะคำสั่งซื้อ
- อัปโหลดหลักฐานการชำระเงิน
- รีวิวและให้คะแนนสินค้า

### 5.3 Seller / Community Enterprise
- Login, จัดการข้อมูลร้านค้า
- เพิ่ม/แก้ไข/ลบสินค้า, จัดการ Stock
- ดูคำสั่งซื้อของร้าน, เปลี่ยนสถานะคำสั่งซื้อ
- ดูยอดขาย, Dashboard ร้านค้า
- จัดการข้อมูลชุมชน
- ⚠️ **ต้องไม่สามารถเข้าถึงข้อมูลของ Seller รายอื่น**

### 5.4 Admin
- Login, ดู Dashboard ระบบ
- จัดการผู้ใช้งาน/Seller/สินค้า/หมวดหมู่/ชุมชน/คำสั่งซื้อ
- อนุมัติ/ปฏิเสธสินค้า, ตรวจสอบการชำระเงิน
- ดูยอดขาย/รายงาน, ระงับบัญชีผู้ใช้งาน

## 6. Home Page

**องค์ประกอบ:** Navigation Bar (Logo, Search Box, Login/Register, Cart), Hero Banner, หมวดหมู่สินค้า, สินค้าแนะนำ, สินค้าขายดี, ชุมชนแนะนำ, เรื่องราวชุมชน, จังหวัด/พื้นที่, Footer

- **Hero Text:** "สินค้าดีจากชุมชนไทย ส่งตรงจากผู้ผลิต"
- **CTA Button:** "เลือกซื้อสินค้า"
- **Design Style:** ทันสมัย สะอาด สะท้อนความเป็นสินค้าไทย

## 7. Product System

**ข้อมูลสินค้า:** Product ID, Product Name, Description, Price, Stock, Category, Community, Seller, Province, Product Image, Status, Created Date, Updated Date

**สถานะสินค้า:** Pending → Approved / Rejected → Active / Inactive / Out of Stock

## 8. Product Search

**ค้นหาจาก:** ชื่อสินค้า, คำอธิบาย, หมวดหมู่, จังหวัด, ชุมชน, ช่วงราคา, Rating

**Sorting:** ราคาต่ำ→สูง, ราคาสูง→ต่ำ, สินค้าใหม่, Rating สูง, สินค้าขายดี

> 💡 **จุดที่สามารถใช้ API ภายนอกได้:** สำหรับ dropdown ค้นหาตามจังหวัด/อำเภอ/ตำบล แนะนำดึงข้อมูลจาก **API ข้อมูลเขตปกครองของไทย** (เช่นชุดข้อมูล `thailand-provinces-districts-subdistricts` แบบ open dataset) แทนการพิมพ์ข้อมูลจังหวัดเองในโค้ด เพื่อความถูกต้องและครบถ้วน

## 9. Product Detail

แสดง: รูปภาพสินค้า, ชื่อสินค้า, ราคา, Rating, จำนวน Stock, รายละเอียด, จำนวนสินค้า, ปุ่ม Add to Cart, ข้อมูลผู้ผลิต, ข้อมูลชุมชน, จังหวัด, เรื่องราวสินค้า, รีวิว

- ส่วน **"ผลิตโดยชุมชน"** ต้องแสดงข้อมูล Seller และ Community อย่างชัดเจน

## 10. Community System

**ข้อมูลชุมชน:** Community ID, Community Name, Province, District, Description, History, Story, Image, Contact, Seller

**หน้า Community Profile** แสดง: เรื่องราวชุมชน, ภูมิปัญญาท้องถิ่น, ผู้ผลิต, สินค้าของชุมชน, จังหวัด, รูปภาพ

## 11. Shopping Cart

- เพิ่ม/ลบสินค้า, เพิ่ม/ลดจำนวน
- ตรวจสอบ Stock, คำนวณราคาสินค้าและยอดรวม
- ⚠️ **ห้ามให้จำนวนสินค้าที่สั่งเกิน Stock**

## 12. Order System

**ข้อมูล Order:** Order ID, Customer, Order Items, Total Price, Shipping Cost, Grand Total, Shipping Address, Payment Status, Order Status, Created Date

**Order Status:** Pending Payment → Payment Verification → Preparing → Shipped → Completed / Cancelled

⚠️ เมื่อ Order สำเร็จ ต้องตัด Stock ของสินค้า

> 💡 **จุดที่สามารถใช้ API ภายนอกได้ (ในอนาคต):** การคำนวณ Shipping Cost สามารถต่อกับ **API ขนส่งของไทย** เช่น Thailand Post, Kerry Express, Flash Express เพื่อคำนวณค่าส่งตามน้ำหนัก/ระยะทางจริง — ใน MVP นี้ให้ใช้ค่าจัดส่งแบบกำหนดค่าคงที่หรือคำนวณแบบง่ายไปก่อน

## 13. Payment (MVP — ระบบจำลอง)

**รองรับ:** Bank Transfer Simulation, Upload Payment Slip, Payment Status

**สถานะ:** Pending → Waiting Verification → Paid / Rejected

- Admin หรือ Seller ตรวจสอบหลักฐานการชำระเงินได้

> 💡 **จุดที่สามารถใช้ API ภายนอกได้ (Future):** เมื่อจะเปลี่ยนจากระบบจำลองเป็นของจริง แนะนำ Payment Gateway ที่รองรับไทย เช่น **Omise**, **2C2P**, หรือ **PromptPay QR Payment API** เนื่องจากรองรับการชำระผ่านธนาคารไทยและ QR Code โดยตรง โครงสร้าง Database ตาราง `payments` ที่ออกแบบไว้ควรเผื่อ field เช่น `transaction_ref`, `gateway_name` ไว้รองรับการเชื่อมต่อในอนาคต

## 14. Review System

- รีวิวได้เมื่อ Order ของสินค้านั้นมีสถานะ **Completed** เท่านั้น
- **ข้อมูล:** Rating (1–5), Comment, Product, Customer, Created Date
- ⚠️ ผู้ที่ไม่ได้ซื้อสินค้าจะรีวิวไม่ได้

## 15. Seller Dashboard

แสดง: จำนวนสินค้า, จำนวน Order, ยอดขายวันนี้/เดือนนี้/ทั้งหมด, สินค้าขายดี, Order ล่าสุด, Stock ใกล้หมด, กราฟยอดขายรายวัน/รายเดือน

## 16. Admin Dashboard

แสดง: จำนวน Users/Sellers/Communities/Products/Orders, ยอดขายรวม, สินค้าขายดี, ชุมชนที่มียอดขายสูง, Order ล่าสุด

**กราฟ:** ยอดขายรายวัน, ยอดขายรายเดือน, จำนวน Order, จำนวนผู้ใช้งาน, สินค้าขายดี

## 17. Database Design (Neon PostgreSQL + SQLAlchemy)

**ตารางหลัก:** `users`, `communities`, `categories`, `products`, `product_images`, `cart`, `cart_items`, `orders`, `order_items`, `payments`, `reviews`, `addresses`

**Relationship:**
- User 1:N Orders
- User 1:N Reviews
- User 1:N Addresses
- Community 1:N Products
- Community 1:N Sellers
- Category 1:N Products
- Product 1:N Reviews
- Product 1:N OrderItems
- Order 1:N OrderItems
- Order 1:1 Payment

## 18. Security Requirements

- Password Hashing, JWT Authentication, Role-Based Access Control
- Input Validation, API Authorization
- ป้องกัน Seller เข้าถึงข้อมูล Seller อื่น
- ป้องกัน Customer เข้าถึง Order ของคนอื่น
- Validate File Upload (จำกัดชนิด/ขนาดรูปภาพ)
- ป้องกัน SQL Injection และ XSS
- ตรวจสอบข้อมูลจาก Backend ทุกครั้ง

## 19. UI/UX Requirements

- **Style:** Modern, Minimal, Clean, Thai Local/Community feeling, ใช้งานง่าย, Responsive, Mobile First
- ความรู้สึกเป็น **"ตลาดออนไลน์ของชุมชนไทย"** มากกว่าเว็บ E-Commerce ทั่วไป
- ใช้ Card สำหรับสินค้า, แสดงรูปสินค้าอย่างโดดเด่น
- มีพื้นที่สำหรับ Storytelling ของชุมชน

## 20. Navigation

| Customer | Seller | Admin |
|---|---|---|
| Home | Dashboard | Dashboard |
| Products | Products | Users |
| Categories | Orders | Sellers |
| Communities | Community | Products |
| Cart | Sales | Categories |
| Orders | Profile | Communities |
| Profile | | Orders |
| | | Payments |
| | | Reports |
| | | Settings |

## 21. API Structure (REST)

```
POST   /api/auth/register
POST   /api/auth/login

GET    /api/products
GET    /api/products/{id}
POST   /api/products
PUT    /api/products/{id}
DELETE /api/products/{id}

GET    /api/categories
POST   /api/categories

GET    /api/communities
GET    /api/communities/{id}
POST   /api/communities

GET    /api/cart
POST   /api/cart/items
PUT    /api/cart/items/{id}
DELETE /api/cart/items/{id}

POST   /api/orders
GET    /api/orders
GET    /api/orders/{id}

POST   /api/payments
POST   /api/payments/{id}/verify

POST   /api/reviews
GET    /api/products/{id}/reviews

GET    /api/admin/dashboard
GET    /api/seller/dashboard
```

## 22. File Structure

```
frontend/
  src/
    components/
    pages/
    layouts/
    services/
    hooks/
    contexts/
    assets/

backend/
  app/
    main.py
    models/
    schemas/
    routers/
    services/
    database/
    auth/
    utils/

database/
  Neon PostgreSQL (configured through backend/.env DATABASE_URL)

uploads/
  products/
  communities/
  payments/
```

## 23. Data Seed (สำหรับ Demo)

- 1 Admin
- 3 Sellers
- 10 Customers
- 5 Communities
- 5 Categories
- 30 Products
- ตัวอย่าง Orders
- ตัวอย่าง Reviews

**ตัวอย่างหมวดหมู่:** อาหาร, เครื่องดื่ม, ผ้าและเครื่องแต่งกาย, หัตถกรรม, สมุนไพร, ของใช้, ของฝาก

## 24. Business Rules

| รหัส | กติกา |
|---|---|
| BR-01 | ลูกค้าต้อง Login ก่อนสั่งซื้อ |
| BR-02 | สินค้าหมด Stock ไม่สามารถสั่งซื้อ |
| BR-03 | จำนวนที่สั่งต้องไม่เกิน Stock |
| BR-04 | Customer รีวิวได้เฉพาะสินค้าที่ซื้อและ Order สำเร็จ |
| BR-05 | Seller จัดการเฉพาะสินค้าและ Order ของร้านตนเอง |
| BR-06 | Admin จัดการข้อมูลทั้งหมด |
| BR-07 | สินค้าใหม่ต้องผ่านการอนุมัติจาก Admin ก่อนเผยแพร่ (หากกำหนดระบบอนุมัติ) |
| BR-08 | เมื่อ Order สำเร็จให้ตัด Stock |
| BR-09 | เมื่อ Order ถูกยกเลิกตามเงื่อนไข ให้คืน Stock |

## 25. Future AI Extension

**ฟีเจอร์ที่พัฒนาเพิ่มเติมได้ในอนาคต:**
1. Product Recommendation
2. Personalized Recommendation
3. Frequently Bought Together
4. Sales Forecasting
5. Customer Segmentation
6. Product Demand Prediction
7. Chatbot แนะนำสินค้า
8. วิเคราะห์ Sentiment จาก Review

**ระยะแรก:** ไม่ต้อง Implement AI จริง แต่ต้องออกแบบโครงสร้างข้อมูลให้เก็บพฤติกรรมได้ เช่น Product View, Search, Add to Cart, Purchase, Review, Click, Wishlist

## 26. Development Strategy (แบ่งเป็น Phase)

| Phase | เนื้อหา |
|---|---|
| Phase 1 | Project Setup, Database, Authentication, User Management |
| Phase 2 | Product, Category, Search, Product Detail |
| Phase 3 | Cart, Order, Payment Simulation |
| Phase 4 | Seller Dashboard, Admin Dashboard |
| Phase 5 | Community System, Community Story |
| Phase 6 | Review, Reports, Analytics |
| Phase 7 | เตรียมโครงสร้าง AI Recommendation |

## 27. Important Development Rules

1. ห้ามสร้างระบบที่ไม่มี Database
2. ใช้ Neon PostgreSQL เป็น Database หลัก
3. Backend ต้อง Validate ข้อมูลทุกครั้ง
4. Frontend ห้ามเป็นแค่ Mockup ต้องเชื่อม API จริง
5. ต้องสร้าง CRUD ให้ครบตาม Requirement
6. ต้องมี Authentication และ Authorization
7. ต้องใช้ Role-Based Access Control
8. ต้องเขียน Code ให้สามารถ Maintain และ Extend ได้
9. ต้องแยก Frontend และ Backend อย่างชัดเจน
10. ต้องจัดการ Error และ Loading State
11. ต้องแสดงข้อความแจ้งเตือนที่เข้าใจง่าย
12. ต้องรองรับ Responsive Design

## 28. สิ่งที่ต้องส่งมอบ

1. System Architecture
2. Database ER Diagram
3. Database Schema
4. API Specification
5. Project Folder Structure
6. Frontend
7. Backend
8. Neon PostgreSQL Database
9. Seed Data
10. Authentication
11. Customer Interface
12. Seller Dashboard
13. Admin Dashboard
14. README
15. วิธีติดตั้งและ Run Project

## 29. ลำดับการทำงาน (Step-by-Step)

> ⚠️ อย่าสร้างทุกอย่างในครั้งเดียว — ทุกครั้งที่สร้าง Code ต้องอธิบายว่าไฟล์นั้นมีหน้าที่อะไร และระบุ path ให้ชัดเจน หากมีหลายไฟล์ให้สร้างทีละส่วนและตรวจสอบความสัมพันธ์ระหว่างไฟล์ก่อนดำเนินการต่อ

1. วิเคราะห์ Requirement และสรุป System Architecture
2. ออกแบบ ER Diagram และ Database Schema
3. สร้าง Backend และ Database
4. สร้าง Authentication
5. สร้าง Product API
6. สร้าง Frontend
7. เชื่อม Frontend กับ Backend
8. สร้าง Cart และ Order
9. สร้าง Seller Dashboard
10. สร้าง Admin Dashboard
11. สร้าง Community System
12. ทดสอบระบบ

---

**เป้าหมายสุดท้าย:** ระบบ OTOP Connect ที่สามารถ Run ได้จริง ไม่ใช่เพียง UI Prototype
