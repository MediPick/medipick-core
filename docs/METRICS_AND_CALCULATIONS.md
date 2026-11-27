# MediPick Master Business Metrics & Calculation Engine Specification

> **Aesthetic, Mathematical & Data Integrity Standard**  
> All statistics, KPI scores, SLA timers, waiting times, geometric distances, financial calculations, and system identifier formats across MediPick are derived strictly from production source code constants, database schemas, and mathematical formulations.  
> There are **zero hardcoded numbers, mock arrays, or speculative values**.
> 
> **Scope Tags Legend:**
> * **`[CUSTOMER]`**: Mobile App end-user calculations (distance, nearby ranking, AI clarity, quotes countdown, review submission, counter PIN).
> * **`[PHARMACY]`**: Dispensary Web Portal calculations (review SLA, urgent triage, prep time, on-time rate, quote acceptance, revenue, payouts, inventory alerts).
> * **`[SHARED]`**: Cross-stack contracts, FSM state machines, database models, and statutory timers.

---

## 1. End-to-End Operational Lifecycle & Metrics Flow

MediPick processes medical orders through a strict 9-phase operational pipeline. Every calculation and metric anchors directly to a specific phase of this lifecycle:

```text
[Phase 1: Discovery & Geolocation] 
   └── Haversine distance, delivery radius filtering (d ≤ delivery_radius_km), proximity ranking
         │
[Phase 2: Prescription Ingestion & Vision AI]
   └── 25MP DoS guard, Laplacian clarity (σ² ≥ 60/100), YOLOv11 seal detection (conf ≥ 0.50)
         │
[Phase 3: Order Initialization & ID Generation]
   └── Cryptographic Order Number (#MP123456), UUIDv4 primary keys, state: SUBMITTED
         │
[Phase 4: Quotation Formulation & Pricing]
   └── Line totals (qty × unit_price), subtotal, delivery fee, quote valid countdown (60m/30m)
         │
[Phase 5: Operational Triage & Statutory SLAs]
   └── Review SLA (15m deadline), Urgent flag (≤ 5m left), Prep time target (≤ 20m), On-time (≥ 95%)
         │
[Phase 6: Payment & Counter Handover]
   └── Online Gateway vs. Counter Cash, 6-digit OTP generation, constant-time HMAC verification
         │
[Phase 7: Patient Satisfaction & Ratings Engine]
   └── Atomic rating increment (rating_total + score, rating_count + 1), 4-tier dimension breakdown
         │
[Phase 8: Financial Settlement & Revenue Flow]
   └── GMV, Net Revenue (amount - refund), Gateway Escrow, Pharmacy Counter Cash
         │
[Phase 9: Inventory Depletion & Stock Steppers]
   └── Atomic decrement, Low stock alerts (qty ≤ threshold), Out of stock pause, Steppers (-5,-1,+1,+5)
```

---

## 2. System Identifier Generation Schemes & Formatting Standards `[SHARED]`

Every user-facing and internal identifier in MediPick follows a deterministic, collision-resistant generation algorithm implemented in the core platform:

| Identifier Type | Standard Format | Generation Logic / Algorithm | Primary Purpose & Context |
| :--- | :---: | :--- | :--- |
| **Order Number** | `#MP123456` | `f"#MP{secrets.randbelow(900000) + 100000}"` | Customer-facing order code on SMS, invoices, and physical slips. |
| **Counter Pickup PIN** | `123456` | `"".join(secrets.choice(string.digits) for _ in range(6))` | 6-digit one-time collection OTP for physical dispensary handover. |
| **Payment Intent** | `pi_mock_<hex24>` | `f"pi_mock_{uuid.uuid4().hex[:24]}"` | Stripe-compatible gateway transaction token. |
| **Gateway Secret** | `<intent>_secret_<tok16>` | `f"{intent_id}_secret_{secrets.token_urlsafe(16)}"` | Client-side SDK payment authorization secret. |
| **Internal Entity IDs** | RFC 4122 UUIDv4 | `uuid.uuid4()` | 128-bit collision-free database primary keys (`orders.id`, etc.). |
| **NMRA License** | `NMRA-YYYY-XXXX` | Formatted statutory registration (e.g. `NMRA-2023-1107`) | Verified dispensary pharmacy branch license. |
| **SLMC License** | `SLMC-XXXXX` | Sri Lanka Medical/Pharmacy Council registration (e.g. `SLMC-78901`) | Licensed Pharmacist dispensing accreditation. |
| **Phone Number** | `+947XXXXXXXX` | Canonical E.164 international formatting | SMS OTP delivery and critical voice consultation. |

### 2.1 The Order Number Generation Algorithm (`order_service.py:329`)
The human-readable Order Number uses the official brand namespace `#MP` and is cryptographically guaranteed non-guessable:

```python
@staticmethod
async def _new_order_number(db: AsyncSession) -> str:
    for _ in range(10):
        # Generates uniform integer in [100000, 999999] (900,000 discrete candidate space)
        candidate = f"#MP{secrets.randbelow(900000) + 100000}"
        taken = await db.execute(select(Order.id).where(Order.order_number == candidate))
        if taken.first() is None:
            return candidate
    raise MediPickException("ORDER_NUMBER_EXHAUSTED", 500, "Couldn't allocate an order number. Please retry.")
```

* **Prefix Breakdown**:
  * `#`: Universal accounting & order hashtag delimiter. Ensures user recognizability in SMS and printed bag slips.
  * `MP`: **MediPick Platform Namespace** identifier (distinguishes MediPick orders from external ERP numbers).
  * `100000` to `999999`: 6-digit cryptographically secure pseudorandom number (`secrets` module).
* **Collision Resolution**: Evaluates uniqueness in the database with up to 10 retry queries before raising an exhaustion exception.

### 2.2 Counter Collection PIN Security (`pickup_code`)
To guarantee that scheduled and prescription medications are only handed to the verified patient:
1. **Generation (`order_fsm.py:84`)**:
   $$\text{pickup\_code} = \text{generate\_otp}() \implies \text{6-digit uniform decimal string, e.g. } "492015"$$
2. **State Gate**:
   `pickup_code` is strictly `NULL` in the customer API response until the order transitions to `OrderState.READY_FOR_PICKUP`.
3. **Cryptographic Verification (`pharmacy_order_service.py:576`)**:
   Verification against dispensary terminal input uses constant-time comparison to prevent timing side-channel attacks:
   ```python
   if not order.pickup_code or not hmac.compare_digest(order.pickup_code.strip(), code.strip()):
       raise MediPickException("INVALID_PICKUP_CODE", 400, "The 6-digit pickup code is incorrect.")
   ```
4. **Brute-Force Lockout (`config.py:16`)**:
   5 consecutive failed PIN entries locks counter pickup for **15 minutes** (`LOGIN_LOCK_MINUTES: 15`).

---

## 3. Phase 1: Pre-Order Discovery & Geolocation Engine `[CUSTOMER]`

### 3.1 Haversine Great-Circle Distance
Calculates spherical distance between patient $(\text{lat}_1, \text{lon}_1)$ and dispensary $(\text{lat}_2, \text{lon}_2)$ (`_haversine_km` in `pharmacy_service.py`):

$$\Delta\phi = \operatorname{radians}(\text{lat}_2 - \text{lat}_1), \quad \Delta\lambda = \operatorname{radians}(\text{lon}_2 - \text{lon}_1)$$
$$a = \sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\operatorname{radians}(\text{lat}_1)) \cdot \cos(\operatorname{radians}(\text{lat}_2)) \cdot \sin^2\left(\frac{\Delta\lambda}{2}\right)$$
$$d = 2 \cdot R \cdot \arcsin(\sqrt{a}) \quad \text{where } R = 6,371.0\text{ km (Earth's mean radius)}$$

### 3.2 Delivery Radius & Store Open Gate
$$\text{Eligible Dispensary} \iff \text{pharmacy.is\_open} = \text{True} \land d \le \text{pharmacy.delivery\_radius\_km}$$
* `delivery_radius_km`: Configured per branch (default: $5.0\text{ to } 10.0\text{ km}$). Out-of-radius branches are excluded from instant dispatch.
* UI Display: $f"{d:.1f}\text{ km}"$ (e.g. `2.4 km`). If coordinates are unassigned or GPS denied, displays `"-"`.

---

## 4. Phase 2: Prescription Ingestion & Computer Vision AI Quality Gate `[CUSTOMER]`

Executed prior to pharmacist clinical triage (`medipick-vision-service` and `ai_check_service.py`):

### 4.1 Decompression Bomb DoS Guard
$$\text{Max Allowed Pixels} = 25,000,000 \quad (25\text{ Megapixels})$$
Uploads exceeding 25MP are aborted with `IMAGE_TOO_LARGE` prior to neural decoding.

### 4.2 Normalized Laplacian Image Clarity Score ($\sigma^2$)
Measures high-frequency edge sharpness to detect motion blur, glare, or defocus:

$$\nabla^2 I = \frac{\partial^2 I}{\partial x^2} + \frac{\partial^2 I}{\partial y^2}, \quad \sigma^2 = \operatorname{Var}(\nabla^2 I)$$
$$\text{Clarity Score} = \min\left(100.0, \max\left(0.0, \frac{\ln(1.0 + \sigma^2) - \ln(1.0 + \sigma^2_{\min})}{\ln(1.0 + \sigma^2_{\max}) - \ln(1.0 + \sigma^2_{\min})} \times 100.0\right)\right)$$
* $\sigma^2_{\min} = 20.0$ (severe blur threshold)
* $\sigma^2_{\max} = 600.0$ (crystal-clear edge variance)

### 4.3 Gate Pass Condition
$$\text{AI Pre-Check Passed} \iff \text{Clarity Score} \ge 60.0 \land \text{Doctor Seal Confidence} \ge 0.50 \text{ (YOLOv11)}$$
* Prescriptions scoring $< 60$ or lacking a verified doctor seal prompt immediate edge recapture before submitting to the pharmacy.

---

## 5. Phase 4: Quotation Formulation & Pricing Engine `[SHARED]`

When a pharmacist reviews a valid prescription and builds a formal quote:

### 5.1 Pricing Formulation
* **Line Item Total**:
  $$\text{ItemTotal}_i = \text{quantity}_i \times \text{unit\_price}_i$$
* **Medication Subtotal**:
  $$\text{Subtotal} = \sum_{i=1}^n \text{ItemTotal}_i$$
* **Grand Total Quoted**:
  $$\text{Total Amount} = \text{Subtotal} + \text{Delivery Fee} + \text{Service Fee} - \text{Discounts}$$
  * For counter pickup orders: $\text{Delivery Fee} = \text{LKR } 0.00$.

### 5.2 Quote Validity Timer
* **Dispensary Default (`QUOTE_VALID_MINUTES`)**: **60 minutes** (`pharmacy-backend/app/config.py:18`).
* **Customer Baseline (`QUOTE_VALID_MINUTES`)**: **30 minutes** (`customer-backend/app/config.py:32`).
* **Custom Configuration**: Pharmacists can adjust validity window up to **24 hours** (`1440m`) for specialized compounds.
* **Expiration Transition**: If customer does not confirm within validity window:
  $$\text{State Transition} \implies \text{OrderState.CANCELLED} \quad (\text{QuoteStatus.EXPIRED})$$

---

## 6. Phase 5: Operational Triage & Statutory SLAs `[PHARMACY]`

```text
[Customer Rx Upload]
        │
        ▼
[1. Quotes & Review] ── (SLA: ≤ 15m review; Urgent triage if ≤ 5m; Quote valid 30-60m) ──► [Expired / Declined]
        │
  (Customer Confirms & Pays)
        │
        ▼
[2. To Pack & Label] ── (Target: ≤ 20m prep; Delay alert if > 20m)
        │
  (Pharmacist Marks Ready)
        │
        ▼
[3. Ready for Pickup] ── (Hold: 48h; Optional +24h extension; 5-attempt PIN lockout 15m) ──► [Uncollected / Cancelled]
        │
  (6-Digit PIN Verified)
        │
        ▼
[4. Completed] ───────── (Dispensary audit log preserved for 5 years)
```

### 6.1 Statutory SLAs & Real Code Constants

| Constant Name | Value in Code | Source File & Location | Operational Mechanism |
| :--- | :---: | :--- | :--- |
| **`ORDER_PHARMACY_REVIEW_SLA_MINUTES`** | **15 minutes** | `customer-backend/app/config.py:31` | Clinical triage deadline: $T_{\text{deadline}} = T_{\text{order\_created}} + 15\text{m}$. |
| **`URGENT_SLA_MINUTES`** | **5 minutes** | `pharmacy-backend/app/config.py:21` | When remaining review time $\le 5\text{m}$ or overdue, flags `isUrgent = True` and pulses amber/red. |
| **`QUOTE_VALID_MINUTES` (Pharmacy)** | **60 minutes** | `pharmacy-backend/app/config.py:18` | Default quote validity window issued by pharmacist. |
| **`QUOTE_VALID_MINUTES` (Customer)** | **30 minutes** | `customer-backend/app/config.py:32` | Customer application quote timeout baseline. |
| **`PICKUP_WINDOW_HOURS`** | **48 hours** | `pharmacy-backend/app/config.py:19` | Maximum shelf hold time: $T_{\text{pickup\_deadline}} = T_{\text{ready\_at}} + 48\text{h}$. |
| **`PICKUP_EXTENSION_HOURS`** | **24 hours** | `pharmacy-backend/app/config.py:20` | Paid orders extend hold time $+24\text{h}$ on 1 tap: $\max(T_{\text{deadline}}, \text{now}) + 24\text{h}$. |
| **`LOGIN_LOCK_MINUTES`** | **15 minutes** | `pharmacy-backend/app/config.py:16` | 5 failed counter PIN attempts locks collection terminal for $15\text{m}$. |
| **`OTP_EXPIRE_MINUTES`** | **5 minutes** | `pharmacy-backend/app/config.py:17` | SMS OTP codes expire strictly after 5 minutes. |

### 6.2 Key Dispensary Performance Indicators (KPIs)
* **Average Quote Turnaround Time**:
  $$\overline{T}_{\text{quote}} = \frac{1}{K} \sum_{k=1}^K \frac{(T_{\text{quote\_created}, k} - T_{\text{order\_created}, k})}{60} \quad [\text{Target: } \le 4.5\text{ mins}]$$
* **Bench Dispensing Prep Time**:
  $$\overline{T}_{\text{prep}} = \frac{1}{M} \sum_{m=1}^M \frac{(T_{\text{ready\_at}, m} - T_{\text{order\_created}, m})}{60} \quad [\text{Target: } \le 20.0\text{ mins}]$$
* **On-Time Fulfillment Rate**:
  $$\text{On-Time Rate} = \left( \frac{\sum [T_{\text{prep}} \le 20.0\text{ mins}]}{M} \right) \times 100\% \quad [\text{Target: } \ge 95.0\%]$$
* **Quote Acceptance Rate**:
  $$\text{Acceptance Rate} = \left( \frac{N_{\text{ACCEPTED}}}{N_{\text{ACCEPTED}} + N_{\text{DECLINED}} + N_{\text{EXPIRED}}} \right) \times 100\% \quad [\text{Target: } \ge 80.0\%]$$

### 6.3 Dispensary Order Composition (3-Way Split) & OTC Attach Rate
The platform distinguishes three clinical and legal order types (`order_type` enum):
1. **Prescription-Only (`OrderType.PRESCRIPTION`)**:
   $$N_{\text{Rx}} = \sum_{j=1}^J [r_j.\text{order\_type} == \text{OrderType.PRESCRIPTION}]$$
2. **Over-The-Counter Catalog (`OrderType.OTC`)**:
   $$N_{\text{OTC}} = \sum_{j=1}^J [r_j.\text{order\_type} == \text{OrderType.OTC}]$$
3. **Mixed Rx + OTC Basket (`OrderType.MIXED`)**:
   $$N_{\text{Mixed}} = \sum_{j=1}^J [r_j.\text{order\_type} == \text{OrderType.MIXED}]$$

* **Dispensary Orders Dispensed Metric**:
  $$N_{\text{Total}} = N_{\text{Rx}} + N_{\text{OTC}} + N_{\text{Mixed}}$$
* **OTC Attach Rate (Cross-Sell Conversion)**:
  Measures the percentage of prescription-seeking patients who also purchased high-margin over-the-counter wellness products:
  $$\text{Attach Rate} = \begin{cases}
    \operatorname{round}\left( \frac{N_{\text{Mixed}}}{N_{\text{Rx}} + N_{\text{Mixed}}} \times 100\%, 1 \right) & \text{if } (N_{\text{Rx}} + N_{\text{Mixed}}) > 0 \\
    0.0\% & \text{if } (N_{\text{Rx}} + N_{\text{Mixed}}) = 0
  \end{cases}$$
* **Headline Metric Ribbon Display**:
  $$\text{Label} = N_{\text{Total}} \quad \left(N_{\text{Rx}}\text{ Rx} \cdot N_{\text{OTC}}\text{ OTC} \cdot N_{\text{Mixed}}\text{ Mixed}\right) \quad [\text{Badge: } \text{Attach Rate}\text{ Attach}]$$
  *(If $N_{\text{Mixed}} = 0$, collapses cleanly to $N_{\text{Total}} \ (N_{\text{Rx}}\text{ Rx} \cdot N_{\text{OTC}}\text{ OTC})$ without the attach badge)*

---

## 7. Phase 7: Patient Satisfaction & Atomic Rating Engine `[SHARED]`

### 7.1 Atomic Concurrency Protection
Ratings are accumulated atomically in PostgreSQL to eliminate lost updates under high concurrency (`order_service.py`):
```sql
UPDATE pharmacies
SET rating_total = rating_total + :overall_rating,
    rating_count = rating_count + 1
WHERE id = :pharmacy_id;
```

### 7.2 Storefront & Multi-Tier Dimension Formulas
* **Storefront Average Rating**:
  $$\text{AverageRating} = \begin{cases} \operatorname{round}\left(\frac{\text{rating\_total}}{\text{rating\_count}}, 1\right) & \text{if } \text{rating\_count} > 0 \\ 0.0 & \text{if } \text{rating\_count} = 0 \end{cases}$$
* **UI Star Fill Formula**:
  $$\text{Filled Stars} = \min(5, \max(0, \operatorname{round}(\text{AverageRating})))$$
* **Category Breakdown in Dispensary Portal (`engagement_service.py`)**:
  $$\overline{R}_{\text{overall}} = \operatorname{round}\left( \frac{1}{N} \sum_{i=1}^N \text{overall\_rating}_i, 1 \right), \quad \overline{R}_{\text{service}} = \operatorname{round}\left( \frac{1}{N} \sum_{i=1}^N \text{service}_i, 1 \right)$$
  $$\overline{R}_{\text{availability}} = \operatorname{round}\left( \frac{1}{N} \sum_{i=1}^N \text{availability}_i, 1 \right), \quad \overline{R}_{\text{pickup}} = \operatorname{round}\left( \frac{1}{N} \sum_{i=1}^N \text{pickup}_i, 1 \right)$$

---

## 8. Phase 8: Financial Settlement, Escrow & Revenue Flow `[PHARMACY]`

### 8.1 Net Revenue
$$\text{Net Revenue} = \sum_{j=1}^J \max\left(0.0, \text{orders.total\_amount}_j - \text{orders.refund\_amount}_j\right)$$
* **Eligibility Filter (`revenue_order_filter`)**:
  $$\text{orders.state} \in \{\text{PREPARING}, \text{READY\_FOR\_PICKUP}, \text{COMPLETED}\}$$
  Cancelled, declined, or uncollected orders are strictly excluded ($0.00$).

### 8.2 Gross Merchandise Value (GMV)
$$\text{GMV} = \sum_{j=1}^J \max(\text{orders.total\_mrp}_j, \text{orders.total\_amount}_j)$$

### 8.3 Online Payouts vs. Counter Cash
* **Online Gateway Orders (`payment_method = 'ONLINE_GATEWAY'`)**:
  Held in platform escrow until order reaches `READY_FOR_PICKUP` or `COMPLETED`. Settled periodically to dispensary bank account.
* **Counter Cash Orders (`payment_method = 'COUNTER_CASH'`)**:
  Collected physically at counter time when customer enters dispensary and provides the 6-digit PIN.

### 8.4 True Line-Item Revenue Attribution (Rx vs. OTC vs. Mixed Orders)
When customers order mixed baskets (e.g. prescription antibiotics + OTC baby formula), revenue is attributed with line-item precision so OTC items inside mixed orders are never misclassified as prescription revenue (`stats_service.py`).

1. **Line-Item Proportional Share**:
   For each line item $i$ in eligible order $j$:
   * Item Line Gross: $g_{ji} = \text{unit\_price}_{ji} \times \text{quantity}_{ji}$
   * Order Items Gross: $G_j = \sum_{i} g_{ji}$
   * Order Realized Net: $R_j = \max(0.0, \text{total\_amount}_j - \text{refund\_amount}_j)$
   * Item Proportional Revenue Share:
     $$s_{ji} = \begin{cases} g_{ji} \times \left(\frac{R_j}{G_j}\right) & \text{if } G_j > 0 \\ 0.0 & \text{if } G_j = 0 \end{cases}$$

2. **Clinical Classification**:
   $$\text{IsRx}(i) = \begin{cases} 
     \text{True} & \text{if } \text{order\_type}_j = \text{PRESCRIPTION} \\
     \text{False} & \text{if } \text{order\_type}_j = \text{OTC} \\
     \text{True} & \text{if } \text{order\_type}_j = \text{MIXED} \land (\text{requires\_prescription} \lor \text{original\_prescribed} \ne \text{'CUSTOMER\_CART'}) \\
     \text{False} & \text{if } \text{order\_type}_j = \text{MIXED} \land (\neg \text{requires\_prescription} \land \text{original\_prescribed} \in \{\text{None}, \text{'CUSTOMER\_CART'}\})
   \end{cases}$$

3. **Dispensary Aggregates**:
   * **Prescription Revenue**:
     $$\text{Rx Revenue} = \operatorname{round}\left(\sum_{j, i \mid \text{IsRx}(i)} s_{ji}, 2\right)$$
   * **OTC & Wellness Revenue**:
     $$\text{OTC Revenue} = \operatorname{round}\left(\text{Net Revenue} - \text{Rx Revenue}, 2\right)$$
   * **Category Breakdown Attribution**:
     $$\text{Category Revenue}(C) = \sum_{j, i \mid \text{Category}(i) = C} s_{ji}$$
   * **Conservation Invariant**:
     $$\text{Rx Revenue} + \text{OTC Revenue} \equiv \text{Net Revenue} \quad (100\% \text{ zero rounding drift})$$

4. **Interval Bucket Attribution (Dispensary Trajectory Wave)**:
   For every discrete chart point (interval $b$):
   * $\text{Rx Value}_b = \sum_{j \in b, i \mid \text{IsRx}(i)} s_{ji}$
   * $\text{OTC Value}_b = \sum_{j \in b, i \mid \neg\text{IsRx}(i)} s_{ji}$
   * $\text{Mixed Orders Count}_b = \sum_{j \in b} [r_j.\text{order\_type} == \text{OrderType.MIXED}]$
   * Tooltip dynamically displays exact interval Rx/OTC monetary values and a contextual badge when mixed orders occurred: `[N Mixed Basket(s)]`.

5. **Interactive Column Slicing & Bi-Directional Chart Synchronization**:
   * **Full-Height Hit Slices**: Replaces microscopic 3.5px click circles with full-height transparent SVG hit columns spanning $y=15\dots 255$, ensuring 100% reliable click and hover triggers across the entire vertical interval band.
   * **Dual Crosshair & Dedicated Beacon**: Active node renders with a luminous dual-layer vertical guide line (`strokeWidth 1.8px` with `strokeWidth 6px` ambient aura) and a 3-tier beacon dot (`r=12px` pulse halo, `r=7px` accent ring, and `r=4.5px` core).
   * **Zero-Interval Clamping**: For zero-revenue intervals ($0$ LKR), the tooltip floats comfortably at `top: 40%`, anchored cleanly above the baseline without colliding with tick lines or axis labels.
   * **Cross-Chart State Sync**: Selecting an interval in Capsule Bars seamlessly updates the active crosshair and tooltip in the Trajectory Wave curve, and vice-versa.

### 8.5 Therapeutic Category Distribution & Dynamic Donut Geometry
To avoid UI clutter while guaranteeing that newly added medicine categories (`MedicineCategory`) are always captured:
1. **Dynamic Backend Aggregation (`stats_service.py`)**:
   * Categories with realized revenue $> 0.0$ are ranked descending by amount.
   * If total active categories $K > 7$, the top 6 are preserved individually, and all remaining categories ($7 \dots K$) are aggregated into `"Other Categories"`.
   * Ensures $100\%$ conservation of categorized revenue regardless of how many catalog categories are added over time.

2. **SVG Donut Geometry & Slicing**:
   * **Canvas & Dimensions**: ViewBox $230 \times 230\text{px}$, Stroke Width $26\text{px}$, Radius $R = 80\text{px}$.
   * **Circumference**: $C = 2 \pi R \quad (R = 80\text{px}, C \approx 502.65\text{px})$
   * **Slice Dash Array**:
     $$\text{strokeDash} = \left(\frac{\text{percent}_k}{100}\right) \times C - \text{gap} \quad (\text{gap} = 3\text{px if } K > 1, \text{ else } 0)$$
   * **Segment Starting Offset**:
     $$\text{strokeOffset} = -\sum_{j < k} \left(\frac{\text{percent}_j}{100}\right) \times C$$
   * **Interactive Center Hole**:
     * **Idle State**: Displays $\text{TOTAL REVENUE}$ (`d.gross`) and Top Category badge (`#1 Chronic`).
     * **Hover State**: Dynamically reflects Category Name, Percentage ($24\text{px}$ font), and exact LKR monetary contribution.
   * **Streamlined Card Layout**: Redundant card footers (`Dynamic catalog attribution | [✓ Live]`) removed to eliminate vertical dead space.

### 8.6 Discrete Transaction Interval Bars & Baseline Geometry
For discrete interval analysis (`StatsView.tsx` Capsule Bars):
1. **Time Horizon Aggregation**:
   * **This Month**: Aggregated into 7-day operational cohorts: $W_1 (1\dots7), W_2 (8\dots14), W_3 (15\dots21), W_4 (22\dots28), W_5 (29\dots31)$.
   * **This Year**: Aggregated into 12 calendar month points ($M_1 \dots M_{12}$).
   * **Today / Last 7 Days**: Native hourly or day-by-day buckets.

2. **Grounded Baseline Rail Axis & Column Slot Geometry**:
   * **Continuous Baseline Rail**: A horizontal axis rail ($2\text{px}$, `bg-slate-200/80` / `bg-slate-700/60`) provides an anchored floor for all intervals.
   * **Clean Minimalist Bars**: Individual bars stand directly on the baseline rail without enclosing background boxes or bounding rectangles (`extra square` eliminated).
   * **Zero-Mock Wave Trajectory**: The Trajectory Wave Curve maps directly to true zero-baseline telemetry ($0$ revenue rests at the floor, real line-item values for Rx and OTC without synthetic multipliers or hardcoded percentages).
   * **Positive Revenue Bars**:
     $$\text{Bar Height} = \max\left(18, \operatorname{round}\left(\frac{\text{value}}{\max(\text{values}, 1)} \times 112\right)\right)\text{px}$$
     Styled with medical-grade emerald-to-teal gradients (`#10B981` $\to$ `#1D6F72`) and top cap illumination accents.
   * **Zero-Revenue Intervals ($0$ LKR)**:
     * Rest cleanly on the baseline rail as a sleek $4\text{px} \times 1.5\text{px}$ resting pill (or $6\text{px} \times 2\text{px}$ in `#0D9488` when selected).
     * Eliminates floating ball distortion and completely hides redundant `0` text over flat days unless explicitly hovered.

3. **Contextual Growth Badge Semantics**:
   $$\text{Badge Style} = \begin{cases}
     \text{Deep Teal } (\#1D6F72) & \text{if Peak interval} \implies \text{"★ Peak"} \\
     \text{Emerald Green } (\#059669) & \text{if } \text{diff} > 0 \implies \text{"+X.X\%"} \\
     \text{Rose Red } (\#E11D48) & \text{if } \text{diff} < 0 \implies \text{"-X.X\%"} \\
     \text{Slate Gray } (\#64748B) & \text{if In Progress / Today} \implies \text{"In Progress"}
   \end{cases}$$
   Eliminates false-positive green badge styling on severe revenue contractions and provides clear operational cues.

---

## 9. Phase 9: Inventory Depletion, Safety Thresholds & Stepper Logic `[PHARMACY]`

### 9.1 Atomic Depletion on Dispensation
When order is fulfilled, inventory decreases atomically:
$$\text{new\_quantity} = \max(0, \text{current\_quantity} - \text{dispensed\_quantity})$$

### 9.2 Stock Status Tier Classification
$$\text{Stock Status} = \begin{cases} \text{Out of Stock (Paused)} & \text{if } \text{quantity} = 0 \\ \text{Low Stock Alert} & \text{if } 0 < \text{quantity} \le \text{min\_alert\_threshold} \quad [\text{default: } 10 \text{ or } 20] \\ \text{Good Stock (Live)} & \text{if } \text{quantity} > \text{min\_alert\_threshold} \end{cases}$$
* Items hitting $0$ automatically toggle `is_available = False` to prevent unfulfillable customer orders.

### 9.3 Rapid Stepper Adjustments
The dispensary stock menu provides instant atomic adjustment steppers:
$$\Delta \in \{-5, -1, +1, +5\}$$
$$\text{Updated Stock} = \max(0, \text{current\_quantity} + \Delta)$$

---

## 10. Regulatory Compliance, Statutory License Expiry & Anti-Spam Verification Lifecycle `[SHARED]`

MediPick enforces statutory compliance under the National Medicines Regulatory Authority (NMRA) Act No. 5 of 2015 (Sec. 54) and international healthcare verification standards. To prevent document spam, fraudulent back-dating, and certificate flooding while maintaining continuous operational audit trails, the following mathematical rules and state gates govern license renewals and dispensary visuals.

---

### 10.1 Statutory License Expiry & Renewal Window ($\Delta t_{\text{window}}$)
Every certified retail pharmacy holds an official NMRA premises license with a statutory expiration date $T_{\text{expiry}}$.
$$\text{Days Remaining to Expiry } (D_{\text{rem}}) = \lfloor (T_{\text{expiry}} - T_{\text{now}}) \text{ in days} \rfloor$$

To prevent premature administrative queue flooding while ensuring pharmacies have ample time to renew before operational suspension:
$$\text{Renewal Window Threshold } (\Delta t_{\text{window}}) = 90 \text{ calendar days} \quad (\approx 3 \text{ months})$$

The submission gate status is determined by:
$$\text{Renewal Gate State} = \begin{cases} 
\text{LOCKED\_ACTIVE} & \text{if } D_{\text{rem}} > \Delta t_{\text{window}} \text{ and } S_{\text{license}} = \text{VERIFIED} \\
\text{RENEWAL\_OPEN} & \text{if } 0 \le D_{\text{rem}} \le \Delta t_{\text{window}} \\
\text{EXPIRED\_GRACE} & \text{if } -\Delta t_{\text{grace}} \le D_{\text{rem}} < 0 \quad [\Delta t_{\text{grace}} = 14\text{d}] \\
\text{SUSPENDED} & \text{if } D_{\text{rem}} < -\Delta t_{\text{grace}} \quad [\text{Store Paused from Customer Search}]
\end{cases}$$

* **`LOCKED_ACTIVE`**: The current license is valid and verified. Submission of renewals is locked to prevent administrative spam. The UI displays:  
  $$\text{"License Verified · Renewal opens } 90\text{ days before expiry ("} + (T_{\text{expiry}} - 90\text{d}) + \text{")"}$$
* **`RENEWAL_OPEN`**: Renewal window is active. Pharmacy is prompted to submit their renewed NMRA license with the newly certified expiry date.
* **`SUSPENDED`**: Failure to renew within the grace period automatically sets `pharmacy.status = RESTRICTED_DEMO` and `is_open = False`, removing the dispensary from customer prescription routing until certified.

---

### 10.2 Single In-Flight Submission Rule (Anti-Spam Concurrency Lock)
To prevent repeated document re-uploads while a compliance officer is inspecting a submission:
$$\text{Max Pending Submissions Per Pharmacy} = 1$$

$$\text{Can Submit Renewal} = (\text{Renewal Gate State} \in \{\text{RENEWAL\_OPEN}, \text{EXPIRED\_GRACE}, \text{REJECTED}\}) \land (\text{Pending Document Count} = 0)$$

If a renewal document has status `status = PENDING_REVIEW`:
* The upload trigger is locked with state: `⏳ Renewal Under MediPick Compliance Review`.
* Re-submission is prohibited until an authorized compliance auditor transitions the state to either `VERIFIED` or `REJECTED`.

---

### 10.3 Forward Expiry Date Validation Bounds ($\mathcal{D}_{\text{new}}$)
When submitting a renewal certificate, the pharmacy must provide the newly certified statutory expiration date $T_{\text{new\_expiry}}$ printed on the official NMRA certificate. The backend and frontend enforce strict boundary validation:

$$\text{Validation Constraints:}$$
1. **Strict Future Bound**:
   $$T_{\text{new\_expiry}} > T_{\text{today}}$$
   *(Rejects past dates, expired certificates, and retro-dated proofs).*
2. **Forward Progression Bound**:
   $$T_{\text{new\_expiry}} > T_{\text{current\_expiry}}$$
   *(A renewal must advance the license expiration beyond the currently verified term; back-sliding or equal dates are rejected).*
3. **NMRA Statutory Cycle Cap** ($\Delta t_{\text{max\_term}}$):
   NMRA premises licenses operate on an annual statutory cycle (maximum 2-year multi-year grant):
   $$T_{\text{today}} + 180\text{ days} \le T_{\text{new\_expiry}} \le T_{\text{today}} + 730\text{ days} \quad [6\text{ months} \le \text{Term} \le 2\text{ years}]$$
   *(Rejects erroneous selections such as 10-year or invalid year inputs).*

---

### 10.4 Atomic Approval Transition & Audit Log
Upon approval by a MediPick Compliance Administrator (`POST /compliance/documents/{id}/review` with `decision = APPROVE`):
1. **Document State Transition**:
   $$\text{document.status} \leftarrow \text{VERIFIED}$$
2. **Pharmacy License Master Expiration Update**:
   $$T_{\text{current\_expiry}} \leftarrow T_{\text{new\_expiry}}$$
3. **Audit Trail Event**:
   An immutable audit record is appended to `pharmacy_audit_logs` with:
   $$\text{event} = \text{"license.renewal\_approved"}, \quad \text{actor} = \text{admin\_user\_id}, \quad \text{prev\_expiry} = T_{\text{old}}, \quad \text{new\_expiry} = T_{\text{new}}$$
4. **Gate Reset**:
   The renewal gate immediately locks back to `LOCKED_ACTIVE` until the new $T_{\text{expiry}} - 90\text{ days}$ threshold is reached.

---

### 10.5 Dispensary Visual Compliance & Anti-Spam Policy
In compliance with pharmacy verification standards, dispensary premise photos are structured into **3 fixed compliance slots**:
1. `storefront`: Main Entrance & Street Facade ($16:9$ Landscape)
2. `counter`: Dispensing Counter & Service Area ($4:3$ Standard)
3. `storage`: Cold Chain & Medicine Storage ($4:3$ Standard)

* **Dual-State Pipeline**: Uploaded drafts remain in `PENDING` status. Patient apps display only `APPROVED` photos.
* **30-Day Consistency Cooldown**:
  $$\text{Cooldown Remaining } (D_{\text{cool}}) = \max\left(0, 30 - \lfloor (T_{\text{now}} - T_{\text{approval}}) \text{ in days} \rfloor\right)$$
  $$\text{Can Update Visual Slot} = (D_{\text{cool}} = 0) \lor (\text{Status} \in \{\text{EMPTY}, \text{REJECTED}\})$$
* **File Constraints**: Max $5\text{ MB}$, MIME types: `image/jpeg`, `image/png`, `image/webp`. Enforced via silent file-picker filter and client/server validation toast.

---

### 10.6 Document-Specific Expiry Date Requirements & Statutory Periodicity Table
Just like credit card verification requires a card number and card expiration date (`MM/YY`), medical compliance documents require statutory dates for cryptographic and regulatory auditability:

| Document Type Code | Official Document Name | Mandatory Date Input | Statutory Renewal Periodicity | Pre-Expiry Alert Trigger |
| :--- | :--- | :---: | :---: | :---: |
| `nmra_license` | **NMRA Retail Pharmacy Premises License** | **Expiration Date** | **Annual (1 Year)** | 90 days before expiry |
| `pharmacist_slmc` | **Pharmacist SLMC Practicing Certificate** | **Expiration Date** | **Annual (1 Year)** | 60 days before expiry |
| `business_registration`| **Business Registration (BR / Form 1)** | **Registration Date** | **Permanent** (Annual tax filing) | N/A (Static corporate entity) |
| `bank_passbook` | **Bank Passbook / Settlement Statement** | **Statement Date** | **Recent (Last 90 Days)** | Flags if statement $> 90\text{d}$ old |

---

## 11. Dispensary Operating Hours & Statutory Poya / Public Holiday Engine `[PHARMACY]`

Sri Lankan pharmacy law and patient service guarantees require explicit scheduling taking into account weekly operating schedules and statutory national Poya/public holidays (`SettingsView.tsx` & `pharmacy_service.py`):

### 11.1 Weekly Operating Schedules
Each dispensary branch defines weekly operating hours for all 7 calendar days:
$$\text{Schedule}_d = \{ \text{isOpen}: \text{bool}, \ t_{\text{open}}: \text{"HH:MM"}, \ t_{\text{close}}: \text{"HH:MM"} \} \quad \forall d \in \{\text{Mon}\dots\text{Sun}\}$$
* **Emergency 24/7 Overnight Flag**: If a dispensary operates continuously, $t_{\text{open}} = \text{"00:00"}$ and $t_{\text{close}} = \text{"23:59"}$, exempt from standard closing cutoff.

### 11.2 Poya & Public Holiday Override Rules
Statutory Poya holidays (full moon days under the Holidays Act No. 29 of 1971) and national public holidays take precedence over the weekly schedule:
$$\text{Holiday Rule} = \begin{cases}
  \text{CLOSED} & \implies \text{Dispensary marked closed for the statutory holiday} \\
  \text{HALF\_DAY} & \implies \text{Closes early (e.g. 14:00 cutoff) for religious observance} \\
  \text{REGULAR} & \implies \text{Normal weekly schedule maintained}
\end{cases}$$

### 11.3 Real-Time Store Availability Gate
$$\text{Dispensary Visible & Open} \iff \text{pharmacy.is\_open} \land \text{WithinOperatingHours}(T_{\text{now}}) \land \neg\text{HolidayClosed}(T_{\text{now}})$$
If a branch is outside active operating hours or in a closed holiday state, it is labeled `"Closed · Opens at HH:MM"` in customer search and prescription routing is paused.

---

## 12. Order State Machine Transitions & Cancellation Refund Guarantee `[SHARED]`

All prescription and OTC orders transition through the deterministic Finite State Machine (`order_fsm.py`):

```text
[DRAFT / SUBMITTED] ──► [WAITING_PHARMACY_CONFIRMATION] ──► [WAITING_CUSTOMER_CONFIRMATION]
        │                                                                   │
        ▼ (Free 100% Refund Cancel)                                         ▼ (Customer Confirms & Pays)
   [CANCELLED]                                                        [PREPARING]
                                                                            │
                                                                            ▼ (Marked Ready)
                                                                  [READY_FOR_PICKUP]
                                                                            │
                                                                            ▼ (6-Digit PIN Verified)
                                                                       [COMPLETED]
```

### 12.1 100% Automatic Refund Guarantee (`FREE_CANCEL_STATES`)
A customer can cancel their order with an **immediate 100% automatic refund** at zero penalty as long as the dispensary has not commenced physical dispensing:
$$\text{Free Cancel States} = \{\text{DRAFT}, \text{SUBMITTED}, \text{WAITING\_PHARMACY\_CONFIRMATION}, \text{WAITING\_CUSTOMER\_CONFIRMATION}\}$$
Once an order transitions to `OrderState.PREPARING` (dispensary pharmacist unseals medicine stock and generates prescription labels), cancellation is locked to protect pharmaceutical integrity.

---

## 13. Summary Audit & Verification Reference

| Property | Rule / Statutory Target | Code File Reference |
| :--- | :--- | :--- |
| **Order Number** | Cryptographic `#MP{100000..999999}` | `customer-backend/app/services/order_service.py:331` |
| **Counter PIN** | 6-Digit constant-time HMAC OTP | `pharmacy-backend/app/services/pharmacy_order_service.py:576` |
| **Quote Validity** | Default 60m (Pharm), 30m (Cust) | `pharmacy-backend/app/config.py:18` |
| **Review SLA** | 15 mins (urgent warning if $\le 5\text{m}$) | `customer-backend/app/config.py:31` |
| **Prep Target** | $\le 20.0$ mins bench time | `pharmacy-backend/app/services/stats_service.py:27` |
| **On-Time Target** | $\ge 95.0\%$ fulfillment | `pharmacy-backend/app/services/stats_service.py:28` |
| **Acceptance Target** | $\ge 80.0\%$ quote conversion | `pharmacy-backend/app/services/stats_service.py:29` |
| **License Renewal Window** | Opens 90 days before expiry ($D_{\text{rem}} \le 90\text{d}$) | `medipick-common/docs/METRICS_AND_CALCULATIONS.md:10.1` |
| **License Expiry Bounds** | $T_{\text{current}} < T_{\text{new}} \le T_{\text{today}} + 730\text{d}$ | `medipick-common/docs/METRICS_AND_CALCULATIONS.md:10.3` |
| **Visual Cooldown** | 30-day anti-spam lock on approval | `pharmacy-backend/app/services/pharmacy_service.py:488` |
| **Audit Log Retain** | Statutory 5-Year NMRA compliance | `medipick-common/docs/METRICS_AND_CALCULATIONS.md` |
