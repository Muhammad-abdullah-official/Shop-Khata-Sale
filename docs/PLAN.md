# Shop Management + Online Store — Detailed Plan

## 1. Overview
Single shop ke liye ek web application jisme do hisse hain:
- **Admin Panel** — owner + 2-3 employees ke liye (inventory, vendors, sales, employees, udhaar, orders).
- **Customer Store** — customers online order karte hain, payment choose karte hain.

Scale: ~100 active customers, max 1000 customers, 2-3 employees. (Bohat chhota scale — free tier easily cover karta hai.)

Priorities: **Cost (free), Reliability, Speed.**

---

## 2. Tech Stack & Why

| Layer | Choice | Reason |
|---|---|---|
| Frontend | Next.js 14 (App Router) + React | Fast, SEO, PWA support, single codebase for admin + store |
| Styling | TailwindCSS + shadcn/ui | Clean UI, fast to build, free |
| Database | Supabase (PostgreSQL) | Reliable enterprise DB, free tier 500MB |
| Auth | Supabase Auth | Built-in login for admin + customers, free, role-based |
| File storage | Supabase Storage | Payment screenshots, product images (1GB free) |
| Hosting | Vercel | Free, fast CDN, auto-deploy from GitHub |
| Version control | GitHub | Free |

**Total monthly cost: $0** at this scale.

---

## 3. User Roles
- **Owner (admin)** — full access, sab kuch.
- **Employee (staff)** — limited: orders, sales, inventory view/update. Salary/profit data hidden.
- **Customer** — store browse, order, apni order history + udhaar baqi.

Role Supabase Auth ke saath `profiles` table me store hoga.

---

## 4. Database Schema (Tables)

### `profiles`
- id (uuid, FK auth.users)
- full_name, phone, address
- role (owner | staff | customer)
- created_at

### `vendors` (companies jin se maal aata hai)
- id, name, contact_person, phone, address
- opening_balance, notes
- created_at

### `categories`
- id, name

### `products`
- id, name, category_id (FK)
- sku / barcode (optional)
- cost_price (kharid rate), sale_price (bik rate)
- stock_qty (current available)
- reorder_level (is se kam ho to alert)
- unit (pcs, kg, etc.)
- image_url
- is_published (customer ko dikhe ya nahi)
- created_at

### `purchases` (vendor se maal liya — stock IN)
- id, vendor_id (FK), date
- total_amount, paid_amount, status (paid | partial | unpaid)
- notes

### `purchase_items`
- id, purchase_id (FK), product_id (FK)
- qty, cost_price, subtotal
- (insert hone par product.stock_qty += qty)

### `orders` (customer orders + counter sales dono)
- id, customer_id (FK profiles, nullable for walk-in)
- order_type (online | counter)
- date
- total_amount
- payment_method (manual_transfer | cod | udhaar | card_gateway)
- payment_status (pending | paid | partial | udhaar)
- payment_proof_url (screenshot, nullable)
- order_status (pending | confirmed | delivered | cancelled)
- delivery_address
- notes

### `order_items`
- id, order_id (FK), product_id (FK)
- qty, sale_price, subtotal
- (order confirm hone par product.stock_qty -= qty)

### `ledger` (udhaar khaata — customers ka)
- id, customer_id (FK)
- order_id (FK, nullable)
- type (debit = udhaar diya | credit = payment aaya)
- amount, balance_after
- date, notes

### `employees`
- id, profile_id (FK, nullable), name, phone
- monthly_salary
- join_date, active

### `salary_payments`
- id, employee_id (FK), date
- amount_paid, month, notes

---

## 5. Modules & Features

### A. Admin Panel
1. **Dashboard** — aaj ki sales, total udhaar baqi, low-stock alerts, pending orders, salary baqi — ek nazar me.
2. **Vendors** — add/edit vendor, unke purchases ka record, kitna paid/baqi.
3. **Purchases (Stock IN)** — vendor se maal entry → stock auto update.
4. **Inventory** — product list, stock qty, low-stock highlight, reorder alert ("kitna naya mangwana").
5. **Products** — add/edit, price, image, publish toggle (store pe dikhana hai ya nahi).
6. **Orders** — online orders aate hain (pending), confirm/reject/deliver. Confirm pe stock minus + sale record + udhaar ledger update.
7. **Counter Sale** — dukaan pe direct bikri (quick entry).
8. **Customers** — list, har customer ki udhaar baqi, history.
9. **Udhaar Khaata** — kis customer ka kitna baqi, payment receive entry.
10. **Employees & Salary** — salary set, kitni di kitni baqi, payment entry.
11. **Reports** — sales, profit, udhaar summary (basic).

### B. Customer Store
1. **Signup / Login** — email + password (Supabase Auth).
2. **Profile** — naam, phone, address (multiple address support).
3. **Browse Products** — categories, search, available stock.
4. **Cart** — add/remove, qty.
5. **Checkout** — address choose, payment method choose:
   - Manual transfer + screenshot upload (free)
   - Cash on Delivery (free)
   - Udhaar — baad me pay (free, owner approve kare)
   - Card/Wallet auto-gateway (ready but OFF — fee wala, future)
6. **Order History** — apne orders, status track.
7. **My Udhaar** — apni baqi raqam dekhe.

---

## 6. Payment Design
- Har order me `payment_method` aur `payment_status`.
- **Free methods active:** manual_transfer (screenshot upload → owner verifies → "paid"), cod, udhaar.
- **card_gateway:** code structure ready, ek config flag se OFF. Jab owner gateway (JazzCash/Stripe) connect karna chahe + fee dene ko tayar ho, tab ON. Tab tak koi fee nahi.
- Udhaar orders → automatically `ledger` me debit entry → "Udhaar List" me show.
- Online paid orders → records/sales me save.

---

## 7. Pages / Routes (rough)
```
/                       → Customer store home
/products, /product/[id]
/cart, /checkout
/account (orders, udhaar, profile)
/login, /signup

/admin                  → Dashboard
/admin/vendors, /admin/purchases
/admin/inventory, /admin/products
/admin/orders, /admin/counter-sale
/admin/customers, /admin/udhaar
/admin/employees
/admin/reports
```

---

## 8. Build Phases
1. **Phase 1 — Setup:** Next.js project, Tailwind, Supabase connect, GitHub, deploy to Vercel (blank app live).
2. **Phase 2 — Database:** Saari tables + RLS (row-level security) policies banao.
3. **Phase 3 — Auth & Roles:** Login/signup, role-based routing.
4. **Phase 4 — Admin core:** Products, Inventory, Vendors, Purchases.
5. **Phase 5 — Customer store:** Browse, cart, checkout, orders.
6. **Phase 6 — Orders flow:** Admin order management, stock auto-update.
7. **Phase 7 — Udhaar + Employees:** Ledger, salary.
8. **Phase 8 — Dashboard + Reports + polish + PWA.**

---

## 9. Cost Summary
| Item | Cost |
|---|---|
| Hosting (Vercel) | Free |
| Database + Auth + Storage (Supabase) | Free |
| GitHub | Free |
| Domain (optional, later) | ~$10/year (optional) |
| Card payment gateway | Only if enabled later (per-transaction fee) |
| **Total monthly** | **$0** |

---

## 10. Reliability & Speed Notes
- Postgres (Supabase) = enterprise-grade, ACID, reliable.
- Vercel CDN = fast global delivery.
- Data cloud me → auto safe, no local-machine risk.
- Supabase free tier 1 hafte inactivity pe pause hoti hai — daily use wali shop pe issue nahi.
- Indexes on key columns for speed (chhota data anyway).
