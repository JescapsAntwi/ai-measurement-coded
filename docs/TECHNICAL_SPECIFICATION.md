# Coded Application Services: Virtual Try-On & Measurement Feature
## Technical Specification Document (Simple English)

---

## 1. What Is This Feature About?

This document explains how the **Virtual Try-On & Measurement Service** works. It is for merchants (tailors, boutique owners, market sellers) who want to:

- Show how their clothes look on different people without hiring models
- Let customers measure themselves from their phones
- Send order details with measurements to merchants via WhatsApp

The feature uses **free AI tools** and **browser technology** so merchants don't need expensive software or servers.

---

## 2. The Two Main Parts of This Feature

### Part A: Virtual Try-On Service
**What it does:** Takes a photo of a piece of clothing and shows it on a digital model.

**How it works:**
1. Merchant uploads a clean photo of clothing (shirt, dress, pants, etc.)
2. Merchant picks a "model style" (tall, medium, curvy, etc.) or uploads a specific person's photo
3. The AI wraps the clothing onto the model realistically
4. Merchant downloads the result and posts it on Instagram or WhatsApp

**Who uses it:** Store owners creating marketing posts

### Part B: Measurement Scanner Service
**What it does:** Uses a phone camera to measure a customer's body.

**How it works:**
1. Customer visits the merchant's store (on Vercel)
2. Customer clicks "Scan My Measurements"
3. Phone camera scans 33 body points (shoulders, arms, waist, legs, etc.)
4. Measurements are saved and added to the order
5. When customer sends the order via WhatsApp, measurements are included

**Who uses it:** Customers ordering tailored/bespoke clothing

---

## 3. What Technology Do We Need?

### Free & Open Source Tools Required

#### A. Frontend Framework
- **Next.js** (React framework)
  - Free to use
  - Hosts on Vercel (merchant's own account)
  - Handles the user interface
  
#### B. Body Scanning Technology
- **MediaPipe** (by Google)
  - Free open-source library
  - Detects 33 body landmarks from phone camera
  - Works in browser, no app needed
  - Uses phone's own processing power (GPU)
  - No data sent to Google servers during scanning

#### C. AI Image Processing
- **Google Gemini 2.5 Flash (Nano Banana)** 
  - Free tier available
  - Removes backgrounds from clothing photos
  - Adds clothes to model photos
  - Generates marketing images
  - API calls are free within limits

#### D. Database & Backend
- **Supabase** (Open source PostgreSQL)
  - Free tier sufficient for startups
  - Stores merchant data (20 images max per merchant)
  - Stores customer measurements
  - Stores order history
  - Real-time API to feed inventory to Vercel sites

#### E. Payment Processing
- **Hubtel** (Ghana-specific)
  - Handles MoMo and card payments
  - Manages monthly subscriptions (GHS 75/month)
  - Syncs payment status to backend

#### F. Communication Channels
- **WhatsApp API** (via Twilio or similar, free tier available)
  - Sends order summaries to merchant
  - Customer can export basket link
- **Telegram API** (completely free)
  - Alternative sharing channel

---

## 4. System Architecture (Simple Breakdown)

### Layer 1: What the Customer Sees (Frontend)
```
Merchant's Vercel Website
├── Product Gallery (AI-cleaned images)
├── Virtual Try-On Tool
│   ├── Upload clothing photo
│   ├── Select model style
│   └── Download result
├── Measurement Scanner
│   ├── Camera access
│   ├── Body scanning
│   └── Save measurements
└── Shopping Basket & Checkout
    ├── Add items
    ├── Generate basket link
    └── Send via WhatsApp
```

### Layer 2: What Happens on the Phone (Client Processing)
```
Phone (No app download needed)
├── MediaPipe runs in browser
│   ├── Accesses phone camera
│   ├── Detects 33 body landmarks
│   └── Calculates measurements
└── Sends to backend for storage
    └── Measurements stay in customer's private order
```

### Layer 3: The Powered Brain (Backend)
```
Coded Backend (Supabase)
├── Merchant Accounts
│   ├── Subscription status
│   ├── 20 AI-cleaned images
│   └── API keys
├── Customer Data
│   ├── Measurements (secure)
│   ├── Order history
│   └── Basket contents
└── API Service
    ├── Feeds images to Vercel
    ├── Stores measurements
    └── Checks payment status
```

### Layer 4: The AI Brain (Google AI)
```
Google Gemini 2.5 Flash
├── Image Cleaning
│   ├── Remove background
│   ├── Add studio background
│   └── Enhance product photo
└── Try-On Processing
    ├── Drape clothing on model
    ├── Adjust fit
    └── Generate marketing image
```

---

## 5. Step-by-Step: How It Works

### Scenario A: Merchant Creates a Marketing Image Using Virtual Try-On

**Step 1: Merchant prepares**
- Logs into Vercel website
- Selects a product from inventory (AI-cleaned image)
- Chooses model style (e.g., "Tall Lean Model")

**Step 2: AI processes**
- Google Gemini AI receives:
  - Product photo
  - Model reference photo
  - Prompt template: "Drape this [clothing] realistically onto this [model] for e-commerce marketing"
- AI generates: Photo showing clothing on model

**Step 3: Merchant exports**
- Downloads high-resolution image
- Posts on Instagram
- Includes in marketing carousel

**Cost:** Free (within Google's free tier limits)

---

### Scenario B: Customer Measures Themselves for a Tailored Order

**Step 1: Customer prepares**
- Visits merchant's Vercel store
- Clicks "Get Measurements for Tailored Order"
- Grants camera permission (browser asks once)

**Step 2: Scanning happens**
- Phone camera turns on
- MediaPipe detects: shoulders, arms, waist, hips, legs, inseam, etc. (33 points total)
- Takes 10-15 seconds
- No data leaves phone yet

**Step 3: Measurements sent**
- Customer confirms measurements look correct
- Measurements sent to Supabase (encrypted)
- Stored in customer's secure order record

**Step 4: Order checkout**
- Customer adds items to basket
- Clicks "Export Order"
- Basket link generated with measurements included
- Customer copies link and sends to merchant via WhatsApp

**Step 5: Merchant receives order**
- Merchant gets WhatsApp message with:
  - Product names & prices
  - Product photos (AI-cleaned)
  - Customer's measurements (all 33 points)
  - Order total
- Merchant fulfills using measurements

**Cost to customer:** Free (no app, no SMS charges)

---

## 6. Data Storage & Privacy

### What We Store (Permanently in Supabase)
- Merchant account info
- 20 AI-cleaned product images per merchant
- Customer measurements (for order fulfillment)
- Order history
- Subscription status

### What We DON'T Store (Deleted Immediately)
- Generated marketing graphics (merchant downloads them)
- API keys (stored in merchant's browser only)
- Raw camera video (never uploaded)
- Try-on attempt photos (only final result kept if merchant saves it)

### Security
- Supabase uses encryption at rest
- API gates all data access by subscription status
- If merchant doesn't pay, inventory hidden and dashboard locked
- Measurements stored securely, only visible in order context

---

## 7. Costs Breakdown

### For Coded (The Platform Owner)
- **Supabase:** ~$0-50/month (free tier handles hundreds of merchants)
- **Google Gemini API:** Free (up to 15 requests/minute, Nano Banana tier)
- **Hosting:** $0 (merchants host on their own Vercel)
- **Total:** Near-zero compute cost per merchant

### For Merchants (Monthly Subscription)
- **Starter Plan:** GHS 75/month
- Includes: 20 AI-cleaned images, try-on studio, measurement scanner, API access

### Revenue Model
- Monthly subscription fee (GHS 75 per merchant)
- Revenue security: If subscription not paid, API feed stops (inventory hidden)

---

## 8. Technical Requirements to Build This

### Frontend Requirements (Next.js on Vercel)
```
Must-Have Components:
1. Product gallery display
2. Virtual try-on interface
   - Image upload form
   - Model selector dropdown
   - Result preview & download
3. Measurement scanner interface
   - MediaPipe integration
   - Camera permission handler
   - Results display
4. Shopping basket
   - Add/remove items
   - Basket link generator
5. WhatsApp/Telegram export

Must-Have Libraries (Free/Open Source):
- next.js (React framework)
- mediapipe (body scanning)
- @react-three/fiber (optional, for 3D model visualization)
- zustand or context-api (state management)
- axios or fetch (API calls)
```

### Backend Requirements (Supabase)
```
Must-Have Database Tables:
1. merchants
   - id, email, subscription_status, api_key, vercel_url
2. products (max 20 per merchant)
   - id, merchant_id, name, price, image_url, stock_status
3. customers
   - id, merchant_id, email, phone
4. measurements
   - id, customer_id, landmark_data (JSON), order_id
5. orders
   - id, customer_id, products, total, measurements_id, created_at
6. subscriptions
   - id, merchant_id, status, renewal_date, payment_method

Must-Have APIs:
- GET /products/:merchant_id (fetch inventory)
- POST /measurements (store scanned data)
- POST /orders (create order with measurements)
- GET /subscription-status (check if merchant paid)
- POST /basket-link (generate shareable link)
```

### AI Integration Requirements (Google Gemini API)
```
Prompt Templates Needed:
1. Image Cleaning Prompt
   "Remove background from this clothing photo. Replace with clean white studio background. 
    Keep only the garment. Output should look professional e-commerce ready."

2. Virtual Try-On Prompt
   "Take this clothing item and drape it realistically onto this model photo. 
    Adjust fit and proportions. Output high-quality marketing image."

3. Garment Detection Prompt
   "What type of clothing is in this image? Extract: category, color, pattern, size hints."
```

### Measurement Data Structure
```json
{
  "measurements": {
    "landmarks": [
      {"label": "left_shoulder", "x": 0.45, "y": 0.20, "z": 0.05},
      {"label": "right_shoulder", "x": 0.55, "y": 0.20, "z": 0.05},
      // ... 31 more landmarks
    ],
    "derived_measurements": {
      "shoulder_width_cm": 42,
      "chest_cm": 95,
      "waist_cm": 85,
      "hip_cm": 100,
      "inseam_cm": 78
    },
    "scan_timestamp": "2026-06-04T10:30:00Z"
  }
}
```

---

## 9. Step-by-Step Implementation Timeline (1 Month Accelerated)

### Week 1: Foundation & Virtual Try-On Core
- [ ] Set up Supabase database schema (all tables)
- [ ] Create merchant authentication (login/signup)
- [ ] Build basic Next.js frontend structure
- [ ] Integrate Google Gemini API
- [ ] Build image upload interface
- [ ] Build model selector component
- [ ] Create prompt templates for try-on

### Week 2: Virtual Try-On Completion & Measurement Start
- [ ] Build try-on result viewer & downloader
- [ ] Test virtual try-on end-to-end
- [ ] Integrate MediaPipe library
- [ ] Build camera interface
- [ ] Implement landmark detection (33 points)
- [ ] Create measurements display UI

### Week 3: Measurement Completion & Shopping Integration
- [ ] Store measurements in database
- [ ] Build shopping basket UI
- [ ] Set up API routes for inventory feed
- [ ] Create basket link generator
- [ ] Integrate WhatsApp API basic setup
- [ ] Integrate Telegram API basic setup

### Week 4: Payment, Security & Launch
- [ ] Integrate Hubtel payments
- [ ] Build subscription gatekeeper (access control)
- [ ] Implement API access controls
- [ ] Test revenue security (paid/unpaid states)
- [ ] End-to-end testing of all features
- [ ] Performance optimization
- [ ] Security audit
- [ ] Launch beta with 5-10 merchants

---

## 10. Success Metrics

### For Merchants
- **Time to create marketing image:** < 2 minutes
- **Accuracy of measurements:** Within 2-5cm margin
- **Subscription retention:** > 80% monthly
- **Orders via measurement link:** Track % of checkout traffic

### For Coded
- **API uptime:** > 99.5%
- **Image processing speed:** < 30 seconds per image
- **Customer acquisition cost:** < GHS 50
- **Monthly revenue:** (Merchants × GHS 75)

---

## 11. Open Source & Free Resources Used

| Resource | Purpose | License | Cost |
|----------|---------|---------|------|
| Next.js | Frontend framework | MIT | Free |
| React | UI library | MIT | Free |
| MediaPipe | Body scanning | Apache 2.0 | Free |
| Supabase | Database & API | Open Source | Free tier / $25/mo |
| Google Gemini | Image AI | Proprietary API | Free tier (15 req/min) |
| Vercel | Hosting | Proprietary | Free tier / $20/mo per merchant |
| TailwindCSS | Styling | MIT | Free |
| Axios | HTTP client | MIT | Free |
| Zustand | State management | MIT | Free |

---

## 12. FAQ (Frequently Asked Questions)

**Q: Do customers need to download an app?**
A: No. Everything runs in the phone's web browser. No app download needed.

**Q: Is this secure for storing measurements?**
A: Yes. Measurements are encrypted in Supabase and only accessible via API authentication.

**Q: What happens if the merchant doesn't pay?**
A: Subscription gateway cuts off API access. Inventory hides from their Vercel site. Dashboard access freezes.

**Q: How many images can a merchant store?**
A: 20 images maximum. This keeps storage costs low and encourages merchants to update their inventory regularly.

**Q: Can customers share their measurements with friends?**
A: Yes. The basket link includes measurements, so they can send it via WhatsApp to friends or the merchant.

**Q: What if Google Gemini API changes pricing?**
A: This is a business risk. Coded monitors API costs. Alternative: Build open-source image processing pipeline locally.

---

## 13. Known Limitations & Risks

1. **MediaPipe Accuracy:** Body scanning may have ±5cm margin of error. Not suitable for extreme custom fits. Good enough for standard tailoring.

2. **Try-On AI Limitations:** AI may not perfect all garment types (very flowing dresses, structured jackets). Human review recommended.

3. **Image Cleanup Dependence:** Feature quality depends entirely on Google's AI quality. No backup if Google degrades service.

4. **20-Image Limit:** Merchants with large catalogs will hit limit. May need pricing tier upgrade later.

5. **Internet Dependency:** All features require internet connection. Works poorly on 2G networks.

---

## 14. Next Steps

1. **Week 1:** Share this document with development team
2. **Week 1-2:** Set up development environment (Supabase project, Google API key, Next.js repo)
3. **Week 2:** Begin Phase 1 implementation
4. **Ongoing:** Weekly progress reviews with stakeholders

---

**Document Version:** 1.0  
**Last Updated:** June 4, 2026  
**Prepared For:** Coded Application Services Development Team
