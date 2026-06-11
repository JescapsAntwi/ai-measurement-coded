# Architecture Clarifications & Decisions
## Coded Application Services - Virtual Try-On & Measurement

---

## Q1: Basket Link Generator & WhatsApp Integration

**Where does it happen?**
- The basket link generator runs on the **merchant's Vercel frontend**.
- When customer clicks "Export Order", the frontend generates a shareable link (e.g., `vercel-store.com/orders/abc123xyz`)
- Customer manually copies this link and sends it to merchant via WhatsApp/Telegram

**What does WhatsApp/Telegram integration entail?**
- **For now: Just a copy button.** The link is self-contained and includes all order data in the URL or browser storage.
- Merchant clicks the link → sees full order summary (products, prices, customer measurements)
- **No automatic WhatsApp API calls needed yet.** Keep it simple: copy → paste → send.

**Why simplify?**
- Reduces backend complexity
- No need for WhatsApp Business API credentials yet
- Customer controls when/how to send
- Easy to add automated messaging later

---

## Q2: Prompt Templates - Where Do They Live?

**Storage location:**
- Store in **Django backend as config/constants** (not in frontend)
- Examples:
  ```python
  # Django: coded_app/prompts.py
  PROMPTS = {
      'clean_image': "Remove background from this clothing photo...",
      'try_on': "Drape this clothing realistically onto this model...",
      'detect_garment': "What type of clothing is in this image?..."
  }
  ```

**Why backend?**
- Merchants should not modify prompts
- Easy to A/B test different prompts without redeploying frontend
- Secure - no AI prompts exposed to frontend

---

## Q3: MediaPipe Widget - Where Will We Store It?

**Storage location:**
- **Host on npm/CDN** as a reusable package
- **Install in Vercel frontend** as a dependency
- Example:
  ```bash
  # In merchant's Vercel repo
  npm install mediapipe
  ```

**How it works:**
- Merchant's Vercel site imports the widget component
- Widget lives in merchant's frontend codebase
- When customer opens measurement scanner, widget runs on their phone's browser

**Why this approach?**
- Lightweight - no server dependency
- Fast - uses phone's GPU directly
- Decentralized - each merchant's site handles it

---

## Q4: Photo Upload - Need Backend Proxy for API Keys

**You're correct.** Current approach is risky.

**Better approach:**
1. **Frontend uploads photo to Django backend** (not directly to Google)
2. **Django backend stores the API key securely** (in environment variables)
3. **Django calls Google Gemini API** with the photo
4. **Django returns processed image URL** back to frontend

**Flow:**
```
Merchant → Uploads photo → Django Backend
Django → Uses stored Gemini API key → Calls Google AI
Google → Processes image → Returns result
Django → Stores result in storage (S3/local)
Django → Returns image URL to frontend
Frontend → Displays to merchant
```

**Why this way?**
- API keys never exposed to frontend
- Centralized control over AI calls
- Can track/log all AI usage
- Easier to rate-limit and manage costs

---

## Q5: Storing Original Images - Clarification

**Do we store the original image?**
- **No. Store only the processed image** (cleaned background version)
- Delete original immediately after processing

**About "Image Metadata Service" flow:**
- This is **just the backend doing the work**, not two separate steps
- Here's what actually happens:

```
1. Client uploads photo to Django backend
   ↓
2. Django receives photo (Image Metadata Service receives it)
   ↓
3. Django calls Google Gemini API with prompt + photo
   ↓
4. Google returns: cleaned image data
   ↓
5. Django stores: processed image URL + metadata (name, price, color, etc.)
   ↓
6. Django returns: image URL back to frontend
   ↓
7. Frontend displays result to merchant
```

**No original stored - just the processed version.**

---

## Q6: Order Status Lifecycle

**Current missing piece:** Yes, we need order tracking.

**Recommended lifecycle (simple):**

```
PENDING    → Merchant receives basket link via WhatsApp
             [Waiting for merchant to confirm]

CONFIRMED  → Merchant clicks link, confirms they can fulfill
             [Merchant enters production]

PAID       → Payment received via Hubtel or agreed offline
             [Ready to deliver/produce]

DELIVERED  → Order complete
             [Customer has received item]
```

**How it works:**
1. Customer exports order → link sent to merchant
2. Merchant opens link → sees status as "PENDING"
3. Merchant clicks "Confirm Order" → status = "CONFIRMED"
4. Merchant marks "Payment Received" → status = "PAID"
5. Merchant marks "Delivered" → status = "DELIVERED"

**Storage:**
- Store in Django database: `orders` table with `status` column
- API endpoint: `PATCH /orders/{order_id}/status/`

**Simplest option:** Just track PENDING → PAID (two states). Upgrade later.

---

## Q7: Order History - What Is This?

**Order History is:**
- A **log of all orders** that have been placed through a merchant's store
- Stores: Customer name, order date, products, measurements, status
- Merchant views it in their admin dashboard

**Example:**
```
Order #001 | Jane Doe | June 1, 2026 | 2x Shirts | Status: PAID
Order #002 | John Smith | June 2, 2026 | 1x Dress | Status: PENDING
Order #003 | Mary Lee | June 3, 2026 | 3x Pants | Status: DELIVERED
```

**Where stored:**
- In Django database: `Order` model
- Accessed via: `GET /merchants/{merchant_id}/orders/`

---

## Q8: Subscription Gatekeeper - What Exactly Is It?

**It's a simple authorization check:**

When a customer tries to access a merchant's store:
```
1. Request comes in: "Load merchant_id=123"
2. Gatekeeper checks: "Is merchant_id=123 paid?"
3. If YES → Serve inventory images, allow measurements
4. If NO → Hide inventory, lock dashboard, show "subscription expired"
```

**Not a separate service - just a middleware/middleware function in Django:**

```python
# Django middleware or decorator
def check_subscription(request, merchant_id):
    merchant = Merchant.objects.get(id=merchant_id)
    if not merchant.subscription_active:
        return JsonResponse({'error': 'Subscription expired'}, status=403)
    return None  # Allow request to proceed
```

**Where it lives:**
- Built into Django backend as a decorator or middleware
- Attached to every API endpoint that needs it

---

## Q9: Supabase vs. Django - Recommendation

**Pros of Supabase:**
- ✅ Real-time API updates (fast)
- ✅ Built-in authentication (easy)
- ✅ Managed hosting (no ops needed)

**Cons of Supabase:**
- ❌ New tool - learning curve
- ❌ Migration risk - hard to move off later
- ❌ Tight 1-month deadline

**Our recommendation:**
**Stick with Django backend** for these reasons:

1. **You already have Django running** - no setup needed
2. **Team knows Django** - faster implementation
3. **1-month timeline** - too tight to learn Supabase
4. **Migration later** - if needed, Django data is easier to migrate than Supabase

**Architecture stays same:**
- Frontend: Next.js on Vercel (merchant's account)
- **Backend: Django** (your existing Django app - add new endpoints)
- Database: **PostgreSQL** (what Django uses)
- API: Django REST Framework (you already have it)

**New Django endpoints to add:**
```python
POST   /api/merchants/        # Register merchant
GET    /api/merchants/{id}/   # Get merchant info
POST   /api/products/         # Upload + process photo
GET    /api/products/         # List products
POST   /api/measurements/     # Store measurements
POST   /api/orders/           # Create order
GET    /api/orders/           # List orders
PATCH  /api/orders/{id}/      # Update order status
```

**No need to learn Supabase. Build on what works.**

---

## Summary of Changes to Architecture

| Component | Original Plan | New Decision |
|-----------|---------------|--------------|
| Backend | Supabase | **Django (existing)** |
| Database | PostgreSQL (Supabase) | **PostgreSQL (Django ORM)** |
| API Keys | Frontend stored | **Django backend (secure)** |
| Photo Upload | Direct to Google | **Via Django proxy** |
| Prompt Templates | Scattered | **Django config/constants** |
| MediaPipe | Unknown | **npm package in Vercel** |
| WhatsApp Integration | API calls | **Simple copy/paste link** |
| Order Status | Not defined | **PENDING → CONFIRMED → PAID → DELIVERED** |
| Subscription Check | Supabase service | **Django middleware/decorator** |

---

## Next Steps

1. **Add new Django endpoints** (above list)
2. **Create PostgreSQL tables** for orders, measurements, order_status
3. **Build Next.js components** for try-on, measurement scanner, basket
4. **Integrate MediaPipe** in Vercel frontend
5. **Secure API keys** in Django environment variables
6. **Test end-to-end** with 1 beta merchant

---

**Document Version:** 1.1  
**Date:** June 6, 2026  
**Status:** Ready for Development Sprint
