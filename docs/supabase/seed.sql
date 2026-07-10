-- =============================================================
--  Shop Manager — seed data (run AFTER schema.sql)
--  Run in: Supabase Dashboard → SQL Editor
-- =============================================================

-- ---------- PRODUCTS ----------
insert into public.products (name, category, cost_price, sale_price, stock_qty, reorder_level, unit, min_order, max_order, step, is_published) values
  ('Sugar (loose)',       'Grocery',       130,  145, 60, 20, 'kg',   0.5, 20, 0.5, true),
  ('Cooking Oil 1L',      'Grocery',       480,  540, 12, 15, 'pcs',  1,   12, 1,   true),
  ('Basmati Rice (loose)','Grocery',       230,  258, 25, 10, 'kg',   0.5, 25, 0.5, true),
  ('Tea Pack 950g',       'Beverages',    1100, 1250,  8, 12, 'pcs',  1,    6, 1,   true),
  ('Wheat Flour (loose)', 'Grocery',       130,  142, 40, 15, 'kg',   1,   40, 1,   true),
  ('Soap Bar',            'Personal Care',  95,  120,  5, 25, 'pcs',  1,   10, 1,   false),
  ('Milk Pack 1L',        'Dairy',         190,  210, 30, 20, 'pcs',  1,   12, 1,   true),
  ('Salt 800g',           'Grocery',        40,   55, 70, 20, 'pcs',  1,   10, 1,   true);

-- ---------- VENDORS ----------
insert into public.vendors (name, contact_person, phone, address, total_purchased, total_paid) values
  ('Al-Karam Traders',     'Bilal Ahmed',   '0300-1234567', 'Jodia Bazar, Karachi', 285000, 220000),
  ('National Foods Dist.', 'Usman Ali',     '0321-9876543', 'SITE Area, Karachi',   142000, 142000),
  ('Fresh Dairy Supply',   'Kamran Sheikh', '0333-5551212', 'Landhi, Karachi',       98000,  74000),
  ('Metro Wholesale',      'Faisal Khan',   '0345-4443322', 'North Nazimabad',      410000, 360000);

-- ---------- WALK-IN CUSTOMERS (no login) ----------
insert into public.customers (name, phone, address, joined_date, udhaar_balance, total_orders) values
  ('Bilal Hussain', '0333-6667778', 'Nazimabad No.4, Karachi', '2025-09-20', 7500, 22),
  ('Fatima Noor',   '0345-9990001', 'Clifton Block 2, Karachi', '2026-03-10', 1200,  5),
  ('Zeeshan Iqbal', '0301-2223334', 'Malir Cantt, Karachi',     '2026-02-05',    0, 11);

-- ---------- EMPLOYEES ----------
insert into public.employees (name, phone, monthly_salary, paid_this_month, join_date) values
  ('Imran Shah',  '0300-7778889', 45000, 30000, '2025-06-01'),
  ('Waqas Ahmed', '0321-4445556', 38000, 38000, '2025-10-12'),
  ('Hamza Tariq', '0333-1231234', 35000, 20000, '2026-04-01');


-- =============================================================
--  MAKE YOURSELF THE OWNER
--  1. Register in the app (or Dashboard → Authentication → Add user)
--  2. Then run this with your email:
-- =============================================================
-- update public.profiles set role = 'owner' where email = 'owner@shop.pk';

-- Promote an employee to staff (they must have signed up first):
-- update public.profiles set role = 'staff' where email = 'staff@shop.pk';
