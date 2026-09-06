# OTOP Connect Test Guide

## Commands

Open the backend API:

```powershell
cd backend
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Open the frontend:

```powershell
cd frontend
npm run dev
```

Seed demo data:

```powershell
cd backend
python scripts/seed_data.py
```

Check frontend build:

```powershell
cd frontend
npm run build
```

## Local URLs

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Backend docs: http://localhost:8000/docs
- Admin back office: http://localhost:5173/admin-dashboard
- Seller hub: http://localhost:5173/seller-dashboard

## Demo Accounts

| Role | Email | Password | Main route |
| --- | --- | --- | --- |
| Admin | admin@otop.th | admin123 | /admin-dashboard |
| Seller | seller@otop.th | seller123 | /seller-dashboard |
| Seller | seller2@otop.th | seller123 | /seller-dashboard |
| Buyer | customer@otop.th | customer123 | /products |
| Buyer | customer2@otop.th | customer123 | /orders |

## Role Rules To Test

- Admin can view members, filter roles, suspend users, cancel non-admin accounts, update buyer/seller roles, manage orders, approve or reject pending products, and manage communities, news, and categories.
- Admin must not access Seller Dashboard and must not create, edit, or delete products through product APIs.
- Seller can create products. New seller products must start as `pending`.
- Buyer can browse products, create orders, submit payment evidence, view invoices, and review completed orders.

## Business Workflow Checklist

1. Log in as seller and create a new product.
2. Confirm the new product is pending and does not appear as a public approved product yet.
3. Log in as admin and open `/admin-dashboard`.
4. Confirm the member overview shows admin, seller, buyer, active, and inactive counts.
5. Open the member tab, search by email or phone, change a buyer to seller, suspend and unsuspend a non-admin account.
6. Open the product approval queue and approve or reject the seller product.
7. Log in as buyer, add an approved product to cart, create an order, and confirm it appears in `/orders`.
8. Log in as admin and update order status through the back office.
9. Check the site on a phone-size viewport and confirm admin tables, filters, and buttons do not overflow.
