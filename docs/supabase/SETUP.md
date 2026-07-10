# Supabase Setup — Shop Manager

App ab **poori tarah Supabase pe** chalti hai. Chalane ke liye ye 5 steps karo.

---

## 1. Project banao
1. [supabase.com](https://supabase.com) → free account → **New project**
2. Region: **Singapore** ya **Mumbai** (Pakistan ke qareeb = kam latency)
3. Database password note kar lo

## 2. Schema chalao
Dashboard → **SQL Editor** → **New query** → `schema.sql` ka poora content paste → **Run**

Ye banata hai: 10 tables, enums, indexes, **RLS policies**, signup trigger, atomic RPC helpers, storage buckets, realtime.

## 3. Seed data (optional, demo ke liye)
SQL Editor → `seed.sql` paste → **Run**
(demo products, vendors, walk-in customers, employees)

## 4. Email confirmation band karo (demo ke liye)
Dashboard → **Authentication → Providers → Email** → **"Confirm email"** ko **OFF** karo.

> Warna har naye account ko email confirm karna parega. Production me isse ON rakhna chahiye.

## 5. Credentials daalo
Dashboard → **Project Settings → API** se do values lo aur
`src/environments/environment.ts` me daalo:

```ts
export const environment = {
  production: false,
  supabaseUrl: 'https://xxxxxxxx.supabase.co',   // Project URL
  supabaseAnonKey: 'eyJhbGciOi...',              // anon public key
};
```

> ⚠️ Sirf **anon public** key. **`service_role` key kabhi frontend me nahi** — wo sab RLS bypass kar deti hai.
> anon key public hone ke liye hi banti hai; uski hifazat **RLS policies** karti hain.

---

## 6. Owner account banao
1. App chalao (`ng serve`) → `/register` pe apna account banao
2. Phir SQL Editor me:
```sql
update public.profiles set role = 'owner' where email = 'tumhara@email.com';
```
3. Logout → dobara login → ab tum **owner** ho, pura admin panel khulega.

## 7. Staff account
Owner → **Employees → Add Employee** → email + password bhi daalo.
Ye seedha ek **staff login** bana deta hai (role `staff` metadata se set hota hai).
Staff sirf **Orders** aur **apni Activity** dekh sakta hai.

---

## Security model (RLS — database level pe)

| Table | Customer | Staff | Owner |
|---|---|---|---|
| products | published read | read | full |
| orders | sirf apne | sab (update) | full |
| customers | sirf apna row | read | full |
| ledger (udhaar) | sirf apna | read/write | full |
| vendors, employees | ❌ | ❌ | full |
| activity, notifications | ❌ | read | full |

Ye **UI pe nahi, database pe** enforce hota hai — koi API se bhi ghalat data nahi nikaal sakta.

## Kya free hai
| Cheez | Free tier | Aap ki zaroorat |
|---|---|---|
| Database | 500 MB | 1000 customers = kuch MB |
| Storage (images/screenshots) | 1 GB | kaafi |
| Realtime | 200 connections · 2M msg/month | 2-3 staff |
| Auth users | unlimited (MAU limits bohat oopar) | 1000 customers |
| **Monthly cost** | **$0** | ✅ |

> Free project 1 hafte **inactivity** pe pause hota hai. Rozana chalne wali shop pe kabhi nahi hoga.

## Deploy (free)
`ng build` → `dist/shop-management/browser` folder ko **Vercel / Netlify / Cloudflare Pages** pe daal do. Free.
