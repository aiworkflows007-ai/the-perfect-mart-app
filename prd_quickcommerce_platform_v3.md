# Product Requirements Document (PRD)
## Multi-Category Quick-Commerce Platform
### Grocery + Cosmetics + Granite + General Items — Blinkit-Style Ordering & Delivery

**Version:** 3.0 (Final — for Claude Code implementation)
**Date:** July 2026
**Audience:** Claude Code (primary implementer), project owner (non-coder, "vibe coder" workflow)

> **How to read this document (note for Claude Code):** The owner of this project is not a developer. All build decisions, error handling, and deployment steps must be self-verifying wherever possible (see §15, Loop Engineering). Never assume the owner will debug manually. Prefer boring, well-documented, framework-native solutions over clever custom code.

---

## 1. Product Summary

A quick-commerce platform for a single mart selling four categories — **groceries, cosmetics, granite/stone products, and general merchandise** — modeled on the Blinkit experience (browse → cart → checkout → live-tracked delivery).

**One backend, one database, four ordering/management surfaces:**

| # | Surface | Technology | Distribution |
|---|---------|-----------|--------------|
| 1 | **Customer App** | Native Android (Kotlin + Jetpack Compose) | **Google Play Store** |
| 2 | **Delivery Partner App** | PWA wrapped into APK (Bubblewrap/TWA) | Direct download from company website — **not** on Play Store (v1) |
| 3 | **Admin App** | PWA wrapped into APK (Bubblewrap/TWA) | Direct download from company website — **not** on Play Store (v1) |
| 4 | **WhatsApp Ordering** | Official **Meta WhatsApp Business Cloud API** (credentials provided by owner when required) | Customers message the business number |

Plus one management surface:

| 5 | **Google Sheets catalog sync** | Google Sheets API + Apps Script webhook | Owner edits products in a Google Sheet; changes flow into the live database |

**Architecture principle ("one app, three perspectives"):** These are not separate systems. There is exactly one backend and one database. The Customer app, Delivery app, Admin app, and WhatsApp bot are different *views* of the same data. An order placed on WhatsApp appears instantly in the Admin app and can be assigned to a rider in the Delivery app.

**Out of scope for v1:** multi-vendor marketplace, iOS apps, free-form AI/NLP ordering on WhatsApp, granite custom-fabrication configurator.

---

## 2. Goals & Non-Goals

### Goals
1. Ship all four surfaces on **one shared backend (Medusa.js)** with zero duplicated product/order data.
2. Support 4 product categories under **one unified product model** — adding a 5th category later must require no schema rewrite.
3. Let the owner manage the catalog through **Google Sheets** (primary day-to-day tool) and **CSV import** (bulk initial load), with validation so a bad edit can never corrupt live inventory.
4. **Single-platform hosting on Railway** (~$20/month target at launch) — backend, database, and both PWAs in one dashboard, one bill.
5. **No single point of failure for ordering:** if WhatsApp, Maps, or notifications go down, app checkout still works — and vice versa.
6. Long-term scalability: one dark store today → multiple stores later without a rewrite.

### Non-Goals (v1)
- Multi-vendor / marketplace mode
- iOS
- Play Store distribution for Delivery and Admin apps (deliberate: instant updates without store review)
- Free-form natural-language WhatsApp ordering (v2+ upgrade path; v1 uses structured list-message flows)
- Two-way Google Sheets sync (v1 is **Sheet → Database** one-way; see §10 for rationale and v2 path)

---

## 3. Users & Personas

| Persona | Surface(s) | Core needs |
|---|---|---|
| **Shopper** | Customer App or WhatsApp | Fast browsing/search across mixed categories, clear delivery ETA, reliable stock info, easy reorder, UPI/card/COD payment, order tracking |
| **Delivery Partner (rider)** | Delivery PWA/APK | Simple order queue, accept/reject, turn-by-turn navigation, one-tap status updates, earnings summary. Works on low-end Android + patchy network |
| **Mart Owner / Admin** | Admin PWA/APK + Google Sheet | Edit products in a spreadsheet (their comfort zone), live order feed across all sources, rider assignment, stock alerts, sales reports, WhatsApp catalog management |

---

## 4. Tech Stack (Final)

| Layer | Choice | Rationale |
|---|---|---|
| **Commerce backend** | **Medusa.js** (Node.js/TypeScript, open source) | Production-grade framework with products, categories, multi-warehouse inventory, cart, checkout, orders, payments, and an admin dashboard **already built**. Claude Code extends/configures instead of writing an e-commerce engine from scratch — massively reduces build effort, tokens, and bug surface. 22k+ GitHub stars, actively maintained. |
| **Database** | PostgreSQL (Railway managed) | Medusa's native DB. Real ACID transactions for money/stock. |
| **Cache / jobs** | Redis (Railway managed) | Medusa's event bus + job queue; WhatsApp conversation state; cart sessions. |
| **Customer App** | Kotlin + Jetpack Compose, MVVM | Native performance for live tracking/maps; current Google-recommended toolkit. |
| **Delivery & Admin apps** | React/Next.js PWAs → **Bubblewrap (TWA)** → signed APK | One web codebase each; APK is a wrapper around the live site, so updates ship instantly on web deploy with no store review. Requires `assetlinks.json` (§11). |
| **WhatsApp ordering** | **Official Meta WhatsApp Business Cloud API** | Owner will supply Meta app credentials/tokens when the build reaches this phase. NOT WasenderAPI/Baileys/any QR-scan unofficial API — ban risk is unacceptable for a business taking payments. Build behind a thin provider-adapter so the provider could be swapped without a rewrite. |
| **Google Sheets sync** | Google Sheets API + Apps Script `onEdit` trigger → backend webhook | Reuses the CSV-import validation pipeline (§10). |
| **Payments** | Razorpay or Cashfree (**confirm country first** — open question §16) | UPI, cards, wallets, COD. Per-transaction fee (~2%), no monthly fee. |
| **Maps** | Google Maps SDK + Directions API | Rider navigation + customer-facing live tracking + ETA. |
| **Push notifications** | Firebase Cloud Messaging (FCM) | Order status updates on the Customer app; new-order alerts on Delivery app. |
| **Hosting** | **Railway (everything)** — backend, Postgres, Redis, both PWAs | Single platform, single bill (~$15–25/month at launch usage). Always-on server (required for webhooks/Medusa workers — rules out serverless-only hosts). Owner decision: simplicity over multi-platform optimization. |
| **CI/CD** | GitHub → Railway auto-deploy (backend + PWAs); GitHub Actions → Play Store track (Customer app) | Two release pipelines because distribution differs. |

### Cost summary (for the owner's planning)
- **One-time:** $25 Google Play developer account; ~$10–15/year domain.
- **Monthly at launch:** Railway ~$15–25 (usage-based, $20 credit included in Pro plan); WhatsApp Cloud API ~$0–5 (customer-initiated conversations are free for 24h — most order traffic is free); Maps usually within free credit. Payment gateway is per-transaction (~2%), not a monthly bill.
- **Free during build/testing phase** (Railway trial credit), paid from real launch.

---

## 5. System Architecture

```
 [Customer App]   [Delivery PWA/APK]   [Admin PWA/APK]   [WhatsApp Cloud API]   [Google Sheet]
   (Play Store)     (Railway-hosted      (Railway-hosted    (Meta webhook)        (Apps Script
       |              website)             website)              |                  webhook)
       |                 |                    |                  |                     |
       +--------+--------+--------------------+------------------+---------------------+
                |
        ┌───────▼────────────────────────────────────────────────┐
        │              MEDUSA BACKEND  (Railway)                 │
        │                                                        │
        │  Core Medusa modules:        Custom modules:           │
        │   • Products/Categories       • whatsapp-service       │
        │   • Inventory (multi-store)   • sheets-sync            │
        │   • Cart/Checkout             • rider-service          │
        │   • Orders                    • delivery-assignment    │
        │   • Payments (Razorpay/       • notifications (FCM)    │
        │     Cashfree plugin)                                   │
        └───────┬───────────────────────────────┬────────────────┘
                │                               │
        PostgreSQL (Railway)             Redis (Railway)
                │
    External: Payment Gateway • Google Maps API • FCM • Meta Graph API
```

Key rule: **the WhatsApp service and Sheets sync are just modules calling the same Catalog/Orders services.** A WhatsApp order is a normal Order row with `source='whatsapp'`. A Sheet edit is a normal product update passing normal validation. No parallel data models, ever.

---

## 6. Data Model

Medusa provides Products, Variants, Categories, Inventory, Carts, Orders, Customers, Payments out of the box. Custom additions:

```
Product (Medusa core, extended via metadata)
  - metadata.attributes (JSONB): category-specific fields validated against the
    category's attribute schema:
      granite   → { finish, thickness_mm, slab_size, unit: "sqft" }
      cosmetics → { shade, expiry_date, volume_ml }
      grocery   → { weight, unit, veg_flag, expiry_date }
  - metadata.sheet_row_id: links product to its Google Sheet row for sync

Order (Medusa core, extended)
  - metadata.source: 'app' | 'whatsapp' | 'admin_manual'
  - metadata.assigned_rider_id

DeliveryPartner (custom table)
  - id, name, phone, vehicle_type ('bike' | 'van'), kyc_status,
    kyc_documents[], current_location (lat/lng), is_online, rating

RiderAssignment (custom table)
  - order_id, rider_id, status ('offered'|'accepted'|'rejected'|'picked_up'|
    'delivered'), offered_at, accepted_at, picked_up_at, delivered_at,
    proof_of_delivery (photo URL or OTP-confirmed flag)

WhatsAppSession (custom table)
  - phone_number (PK), current_state ('browsing'|'cart'|'awaiting_address'|
    'awaiting_payment'|'agent_handover'), cart_snapshot (JSONB),
    linked_customer_id (nullable — unifies history with app account by phone),
    last_interaction_at

SheetsSyncLog (custom table)
  - id, triggered_at, rows_processed, rows_accepted, rows_rejected,
    rejection_details (JSONB), status
```

**Design rules:**
1. Category-specific data lives in JSONB `attributes` — never separate tables per category.
2. `unit` matters: granite sells by **sqft**, groceries by kg/piece, cosmetics by piece/ml. Cart math must respect units.
3. **Vehicle-aware assignment:** granite items are flagged heavy/fragile; orders containing them are only offered to riders with `vehicle_type='van'`. This is the resolution of the granite-logistics risk — do not skip it.

---

## 7. Customer App (Native Android) — Functional Requirements

1. **Onboarding:** phone number + OTP login (Medusa customer record keyed by phone — enables WhatsApp history unification).
2. **Home:** delivery ETA banner ("Delivery in ~X min"), category tiles (Grocery / Cosmetics / Granite / All Items), promotional banners, "Order again" row.
3. **Browse & search:** category → subcategory drill-down; search with typo tolerance; filters (price, brand, in-stock) plus **category-aware filters** (granite: finish/thickness; cosmetics: shade/type).
4. **Product detail:** image gallery, price/MRP/discount, stock status, dynamic attributes table (renders whatever is in `metadata.attributes`), related products.
5. **Cart:** quantity edit, **live stock re-validation on every open**, promo code, delivery fee + ETA shown before checkout. Out-of-stock-while-in-cart → clear inline message, never a crash or silent removal.
6. **Checkout:** address book with map-pin add, payment selection (UPI/card/wallet/COD per gateway config), order summary, place order.
7. **Order tracking:** status timeline (placed → confirmed → packed → out for delivery → delivered), live rider location on map, ETA countdown, call-rider button.
8. **Order history & one-tap reorder.**
9. **Push notifications** (FCM) on every status change.
10. **Ratings:** product + delivery rating post-delivery.

**Non-functional:** cold start < 2s on mid-range devices; usable on 3G (cache last catalog, queue actions offline); crash-free sessions > 99.5%.

---

## 8. Delivery Partner App (PWA → APK) — Functional Requirements

1. **Onboarding:** phone OTP + KYC upload (ID, vehicle type/photo); pending/approved status clearly shown; riders can't receive orders until approved in Admin.
2. **Online/offline toggle.**
3. **Order queue:** incoming offer with items summary, distance, earnings; accept/reject with **60s timeout → auto-offer to next eligible rider**. Granite orders only offered to van riders (§6).
4. **Navigation:** store → customer, deep-link into Google Maps turn-by-turn.
5. **Status updates:** single-tap Picked Up → Out for Delivery → Delivered; proof of delivery = photo upload **or** customer-OTP confirmation.
6. **Earnings:** per-order, daily/weekly totals, payout history.
7. **Support/emergency button.**

**PWA-specific requirements & known limitation:**
- Passes Lighthouse installable-PWA criteria; correct `manifest.json`; `assetlinks.json` served at `/.well-known/` (§11).
- **Background GPS is weaker in PWAs than native apps.** v1 design: rider keeps the app foregrounded during active delivery; location updates every 15–30s via Geolocation API while visible. This is documented and accepted; if post-launch tracking quality is insufficient, this one app can be rebuilt native without touching anything else. Flag this trade-off in the final README for the owner.

---

## 9. Admin App (PWA → APK) — Functional Requirements

Built on/around **Medusa's existing admin dashboard** (customize, don't rebuild):

1. **Catalog:** product CRUD, stock, pricing/discounts, category & attribute-schema management, image upload.
2. **CSV import:** upload → column-mapping UI → preview → validate → commit. Per-row error report (bad rows rejected with reasons; good rows imported). Used for the initial catalog load from the owner's existing CSV.
3. **Google Sheets panel:** connect sheet, view sync log (SheetsSyncLog), see rejected rows and why, manual "sync now" button.
4. **Orders:** live feed across ALL sources with `source` badge (app/WhatsApp/manual); status control; manual rider assignment override; refund/cancel.
5. **Riders:** KYC review/approve, live map of online riders, performance stats.
6. **WhatsApp:** toggle products in/out of the WhatsApp catalog; view WhatsApp conversations needing human handover; reply as agent; `!resume` to return control to the bot.
7. **Reports:** sales by category/source, top products, low-stock alerts.

---

## 10. Google Sheets Catalog Sync — Functional Requirements

**v1 direction: ONE-WAY, Sheet → Database.** (Two-way sync invites edit conflicts and race conditions; defer to v2 with explicit conflict rules. App-side stock changes — e.g., stock decrements from orders — are visible in Admin, not written back to the Sheet in v1. State this clearly to the owner in the README.)

1. **Sheet structure:** one row per product; columns = sku, name, category, price, mrp, stock, unit, plus category-specific attribute columns. Claude Code generates the template sheet **from the owner's actual CSV headers** once uploaded.
2. **Trigger:** Apps Script `onEdit` (debounced ~30s) POSTs changed rows to a **signed webhook** on the backend. Plus a 15-minute scheduled full-diff poll as a safety net for missed triggers.
3. **Validation:** every incoming row passes the **same validation pipeline as CSV import** (price is a positive number, category exists, required attributes present, unit valid for category). Invalid rows are rejected and logged to SheetsSyncLog — a typo in the Sheet must never corrupt live inventory or set a price to zero.
4. **Feedback loop:** rejected rows get highlighted in the Sheet (Apps Script writes a red note in an "errors" column) so the owner sees mistakes *in the Sheet itself*, without opening the Admin app.
5. **Security:** webhook authenticated with a shared secret; reject unsigned requests.

---

## 11. WhatsApp Ordering System — Functional Requirements

**Platform:** Official Meta WhatsApp Business Cloud API. Owner supplies: Meta Business verification, WhatsApp Business phone number, permanent access token, webhook verify token — **when Phase 5 begins** (§15). Build starts with Meta's test number so this is not a blocker.

1. **Catalog:** products flagged WhatsApp-visible sync from Medusa to a Meta Commerce Catalog (or are presented via List Messages if catalog approval is pending). Single source of truth — no manual duplication.
2. **Structured ordering flow (v1 — no free-text NLP):**
   - Customer messages the number → welcome + category List Message
   - Category → product list → add via reply buttons → running cart summary
   - "View cart" → confirm → address (reuse saved address if phone matches an existing customer) → payment link (gateway-generated) or COD confirm → order placed with `source='whatsapp'`
3. **Status notifications:** confirmed / out-for-delivery / delivered messages, same events that drive FCM pushes. **Use pre-approved utility templates** for anything outside the 24-hour customer-service window (Meta requirement — design template content early, approval takes time).
4. **Human handover:** keyword or agent action pauses the bot (`current_state='agent_handover'`); admin replies from the Admin app; `!resume` reactivates the bot.
5. **Webhook security:** verify Meta's signature (`X-Hub-Signature-256`) on every payload; reject invalid.
6. **Cost note:** customer-initiated conversations are free to reply to for 24h — the ordering flow itself costs ~nothing. Only out-of-window template messages are billed (fractions of a cent to a few cents each).

---

## 12. Deployment, Distribution & Links

**Hosting: everything on Railway** — Medusa backend service, PostgreSQL, Redis, Delivery PWA, Admin PWA. One dashboard, one bill.

**Domain decision (owner to confirm — recommendation below):**

| Option | Structure | Trade-offs |
|---|---|---|
| **Three links (RECOMMENDED)** | `shop.yourmart.com` (customer web/ordering links) • `rider.yourmart.com` (Delivery PWA) • `admin.yourmart.com` (Admin PWA) | Cleaner separation; each PWA gets its own manifest + `assetlinks.json`, which makes Bubblewrap/TWA setup straightforward; easy to reason about |
| One link | `yourmart.com` with role-based routing after login | Fewer domains, but login/routing branches by role and TWA asset-link verification gets fiddly |

**Bubblewrap/TWA requirements (both wrapped apps):**
- `assetlinks.json` at `https://<subdomain>/.well-known/assetlinks.json` with the APK signing-key SHA-256 fingerprint — without this the "app" opens with a visible browser bar.
- Keystore generated once, stored safely (document for the owner: losing it means users must uninstall/reinstall for updates to the wrapper itself — though web-content updates never need a new APK).
- Signed APKs downloadable from the website with simple install instructions (enable "install from unknown sources").

**Customer app:** Google Play Console (organization account recommended; note D-U-N-S number lead time), internal testing → closed testing (Play's 12-tester/14-day requirement for new personal accounts — plan the timeline) → production.

---

## 13. Non-Functional Requirements

1. **Transactions:** every money/stock-affecting operation is atomic — no state where a customer is charged but stock isn't decremented, regardless of order source.
2. **Idempotency:** payment webhooks and order-creation are safe to retry (network retries must never create duplicate orders/charges).
3. **Graceful degradation:** WhatsApp down → app checkout unaffected. Maps down → orders still placeable, tracking shows "location unavailable." FCM down → orders proceed, notifications queue and retry.
4. **Stateless API behind Railway's load balancing;** sessions/conversation state in Redis, not process memory.
5. **Observability:** structured logs, Sentry error tracking, `/health` endpoint, Railway alerting. "No faults long-term" = catching faults early.
6. **Security:** OTP rate-limiting; JWT + refresh tokens; role-based access (admin/rider/customer roles are hard-separated — a rider token can never call admin endpoints); payment tokenization only (never store card data); signed webhooks for Meta, gateway, and Sheets; secrets in Railway env vars, never in code.
7. **Backups:** Railway Postgres daily backups enabled; document the restore procedure in the README; test one restore before launch.
8. **API versioning:** `/api/v1/…` — installed Customer apps update gradually via Play Store; old versions must keep working.

---

## 14. Reference Repositories (boilerplate strategy)

**Primary foundation (build ON this):**
- `medusajs/medusa` — the commerce backend. Start from `create-medusa-app`. Most of §6–§9's core commerce logic already exists here.

**Pattern references (read, don't fork):**
- `adithyadilum/wa-demo-shop-bot` — official Cloud API + stateful cart + list messages + human-handover pattern; closest match to §11's flow.
- `DaggieBlanqx/whatsapp-ecommerce-bot` — Meta webhook setup checklist (app creation, verify token, subscription).
- `GoogleChromeLabs/bubblewrap` — the official PWA→APK tool; standardize on it.
- Medusa's official Next.js storefront starter — base for the PWAs' data-fetching patterns.

**Explicitly rejected:** WasenderAPI / Baileys / Evolution API / any QR-code-connected WhatsApp integration (ban risk on a revenue-critical number); "Blinkit clone" tutorial repos as a codebase foundation (portfolio-grade, not production-grade — reference for UI ideas only).

---

## 15. Build Phases — Loop Engineering

**Method (this is a requirement, not a suggestion):** work in small verified loops — *plan → implement one slice → run it → verify against the acceptance criteria → only then continue.* Every phase below has concrete acceptance criteria. Claude Code must demonstrate each criterion (run the test, show the output) before starting the next phase. If a criterion fails, fix it within the phase — never carry known breakage forward. The owner cannot debug code; green checks are the only shared language.

### Phase 0 — Environment & skeleton
Set up Medusa via `create-medusa-app`, Postgres + Redis on Railway, GitHub repo, auto-deploy.
✅ **Accept when:** backend deploys on Railway; `/health` returns 200; Medusa admin dashboard loads; seed product visible via API.

### Phase 1 — Data model & catalog core
Extend Medusa: category attribute schemas, product `metadata.attributes` validation, units, vehicle-type flag for heavy items.
✅ **Accept when:** can create one product of each category (granite with sqft/thickness, cosmetics with shade/expiry, grocery with weight) via API and each validates correctly; invalid attributes are rejected with clear errors.

### Phase 2 — CSV import
Admin CSV upload → mapping → preview → validated commit → per-row error report. **Requires the owner's CSV file — request it at the start of this phase.**
✅ **Accept when:** owner's real CSV imports; row counts reconcile (accepted + rejected = total); rejected rows show human-readable reasons; re-import updates rather than duplicates (SKU-keyed upsert).

### Phase 3 — Google Sheets sync
Template sheet generated from real CSV headers; Apps Script trigger; signed webhook; validation reuse; error highlighting in-sheet; 15-min safety poll.
✅ **Accept when:** editing a price in the Sheet updates the product in Medusa within ~1 minute; entering an invalid price gets the row highlighted with an error note and does NOT change the database; SheetsSyncLog records both events.

### Phase 4 — Customer App core
Kotlin/Compose app: OTP auth, browse/search, product detail with dynamic attributes, cart with live stock validation, checkout (COD first — gateway lands in Phase 6), order history.
✅ **Accept when:** end-to-end COD order placed from a physical Android device against the Railway backend; out-of-stock-in-cart shows the graceful message; order appears in Medusa admin with `source='app'`.

### Phase 5 — WhatsApp ordering
Custom Medusa module + Meta webhook (start on Meta's test number; **request owner's production credentials at the end of this phase**). Structured flow per §11, session state in Redis/DB, human handover, signature verification.
✅ **Accept when:** full test-number conversation — browse → cart → address → COD confirm — creates a Medusa order with `source='whatsapp'`; status change fires a WhatsApp message; handover pauses the bot and `!resume` restores it; unsigned webhook requests are rejected (show the 401).

### Phase 6 — Payments
Razorpay/Cashfree Medusa plugin (owner confirms gateway/country first); payment links for WhatsApp orders; idempotent webhooks.
✅ **Accept when:** sandbox payment completes for an app order AND a WhatsApp payment link; replaying the same gateway webhook twice does not double-process (show the log); failed payment leaves no phantom order.

### Phase 7 — Delivery Partner PWA + rider logic
Rider onboarding/KYC, online toggle, offer queue with 60s timeout & reassignment, vehicle-aware granite routing, status updates, proof of delivery, earnings. Wrap with Bubblewrap.
✅ **Accept when:** an order flows placed → offered → accepted → picked up → delivered with customer-visible status at each step; a granite order is never offered to a bike rider (show the test); the APK installs and opens full-screen with no browser bar (assetlinks verified).

### Phase 8 — Admin PWA
Order feed with source badges, rider management, WhatsApp handover UI, reports, Sheets sync panel. Wrap with Bubblewrap.
✅ **Accept when:** one order from each source (app, WhatsApp, manual) appears in the live feed correctly badged; manual rider reassignment works; low-stock alert fires when stock crosses threshold.

### Phase 9 — Notifications & tracking
FCM push on status changes; live rider location relay to Customer app map; WhatsApp status templates submitted for Meta approval.
✅ **Accept when:** status change triggers push on a real device within seconds; rider movement updates the customer's map; degradation test passes (kill FCM key → order flow still completes).

### Phase 10 — Hardening & launch prep
Load test (simulate ~100 concurrent orders), backup-restore drill, Sentry wired, security pass (role isolation, rate limits, webhook signatures), Play Store listing + closed-testing track, APK download page, owner-facing README (how to edit the Sheet, read the order feed, approve riders, what each monthly bill line means).
✅ **Accept when:** load test holds with zero dropped/duplicated orders; a deliberately broken row in the Sheet, a replayed payment webhook, and a rider-timeout reassignment all behave per spec in one final end-to-end demo; restore drill documented with proof.

---

## 16. Open Questions (owner to answer — Claude Code must ask at the flagged phase, not guess)

1. **Country / payment gateway** (needed by Phase 6): Razorpay vs Cashfree vs other; COD enabled?
2. **CSV file** (needed at Phase 2 start): upload the real product CSV.
3. **Meta credentials** (needed at Phase 5 end): verified Business, WhatsApp number, tokens. **Start Meta Business verification NOW, in parallel — approval can take days and is the most common launch blocker.**
4. **Domain name + one-link vs three-link** decision (needed by Phase 7; recommendation: three subdomains, §12).
5. **Single store confirmed for launch?** (Model is multi-store-ready either way.)
6. **Play Console account type:** organization (needs D-U-N-S number — weeks of lead time; start now) vs personal (needs 12-tester/14-day closed test).

---

## 17. Success Metrics

- Order placement success rate > 99% (excluding legitimate stock-outs), tracked per source
- Customer app crash-free sessions > 99.5%
- Median delivery time vs promised ETA
- Sheet-edit → live-database latency < 2 minutes; sync rejection rate trending down
- Rider offer-acceptance time; reassignment rate
- Checkout abandonment, app vs WhatsApp separately
- Zero duplicate charges / phantom orders (hard requirement, monitored via payment reconciliation)

---

## Appendix — Standing instructions for Claude Code

1. **Foundation first:** Phases 0–3 before any UI. All four surfaces depend on a stable API.
2. **Extend Medusa; don't rebuild what it ships.** Custom code only for: WhatsApp module, Sheets sync, rider/delivery logic, category attribute validation.
3. **JSONB attributes pattern (§6) is load-bearing** — it's what makes four categories (and future ones) live in one model.
4. **WhatsApp orders are normal orders** with `source='whatsapp'`. No parallel models.
5. **Never bypass validation** — Sheet, CSV, API, and WhatsApp inputs all pass the same pipeline.
6. **Every phase ends with its acceptance criteria demonstrated**, not asserted. Show the passing test/output.
7. **Ask, don't guess**, at each §16 flag point.
8. The owner is a non-coder: all runbooks, error messages, and the final README must be written for a smart non-technical reader.
