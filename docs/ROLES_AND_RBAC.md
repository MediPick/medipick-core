# MediPick Roles & RBAC Matrix

> **Canonical Sources of Truth:** [`medipick-common/backend/medipick_core/rbac.py`](../backend/medipick_core/rbac.py) and [`medipick-pharmacy-ui/src/types/pharmacy.ts`](../../medipick-pharmacy-ui/src/types/pharmacy.ts).

This document outlines the real, built-in roles across the active **Customer Mobile Application** and **Pharmacy Dispensary Operations**.

---

## 1. System Role Tiers

```mermaid
graph TD
    subgraph Customer Mobile Tier
        CU["Customer (Mobile End User)"]
    end

    subgraph Dispensary Staff Tier (7 Canonical Roles)
        OC["Owner / Chief Pharmacist (SLMC Required)"]
        PO["Pharmacy Owner (Active Business Owner)"]
        INV["Investor (Read-Only Financials)"]
        DM["Designated Manager / Pharmacist (SLMC Required)"]
        SP["Staff Pharmacist (SLMC Required)"]
        DA["Dispensary Assistant (Packer / Inventory)"]
        DC["Dispensary Cashier (Pickup PIN & Payments)"]

        OC --> DM
        PO --> DM
        DM --> SP
        DM --> DA
        DM --> DC
    end
```

---

## 2. Customer Role

| Role | Auth Mechanism | Primary Capabilities |
| :--- | :--- | :--- |
| **`Customer`** (`CUSTOMER`) | Sri Lankan Mobile Phone SMS OTP (`+94...`) | Search open pharmacies, browse OTC drugs, upload prescriptions, view live clarity scores, accept pharmacist quotes, track order stages, pay via PayHere, rate experience. |

---

## 3. The 7 Built-In Pharmacy Staff Roles

| Role (`staff_role`) | SLMC # Required? | `is_owner` | `is_designated_manager` | Description |
| :--- | :---: | :---: | :---: | :--- |
| **`Owner / Chief Pharmacist`** | **Yes** | **Yes** | No | Solo or managing pharmacy owner who is also a licensed SLMC pharmacist. Full clinical, inventory, financial, and staff authority. |
| **`Pharmacy Owner`** | No | **Yes** | No | Active non-pharmacist business owner. Manages business settings, multi-branch governance, financials, staff, and inventory additions (no clinical Rx verification). |
| **`Investor`** | No | No | No | Silent financial stakeholder. Read-only access to gross revenue, payouts, and financial analytics. Blocked from inventory, staff, and prescription data. |
| **`Designated Manager / Pharmacist`** | **Yes** | No | **Yes** | Branch operational lead and statutory Pharmacist-in-Charge (NMRA Section 120). Manages staff shifts, stock intake, customer dispute claims, and clinical Rx verification. |
| **`Staff Pharmacist`** | **Yes** | No | No | Certified dispensing pharmacist. Reviews prescriptions, sends pricing quotes, conducts patient clinical chat consultations, and manages stock adjustments. |
| **`Dispensary Assistant`** | No | No | No | Pharmacy technician and packer. Picking and packing orders, batch number entry, expiry monitoring, and stock threshold alerts. |
| **`Dispensary Cashier`** | No | No | No | Counter POS and pickup custody. Verifies the customer's 6-digit pickup PIN, collects cash/card payments, and marks orders as dispensed. |

---

## 4. The 6 Canonical Permission Flags

In MediPick, permissions are **never customized per individual checkbox**—they are strictly derived from the staff member's built-in role:

```python
PERMISSION_KEYS = (
    "canReviewRx",          # Review prescriptions, approve/reject, request re-upload
    "canApproveQuotes",      # Send price quotes and apply discounts
    "canManageInventory",   # Adjust stock levels, add items, set alert thresholds
    "canViewFinancials",    # View revenue charts, GMV, and bank settlement payouts
    "canManageStaff",       # Invite staff, edit roster, assign shifts, manage store profile
    "canProcessRefunds",    # Process order refunds and resolve patient disputes
)
```

### Complete Permissions Matrix

| Built-In Staff Role | `canReviewRx` | `canApproveQuotes` | `canManageInventory` | `canViewFinancials` | `canManageStaff` | `canProcessRefunds` |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **`Owner / Chief Pharmacist`** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **`Pharmacy Owner`** | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **`Investor`** | ❌ | ❌ | ❌ | ✅ *(Read-Only)* | ❌ | ❌ |
| **`Designated Manager / Pharmacist`** | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **`Staff Pharmacist`** | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| **`Dispensary Assistant`** | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **`Dispensary Cashier`** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 5. Core Regulatory & Custody Rules (NMRA / SLMC)

1. **Pharmacist Clinical Custody (NMRA Act No. 5 of 2015):**
   * Only roles with verified **SLMC registration numbers** (`Owner / Chief Pharmacist`, `Designated Manager / Pharmacist`, `Staff Pharmacist`) hold `canReviewRx` and `canApproveQuotes`. Non-pharmacist owners and staff are strictly blocked from prescription approvals.
2. **Minimum Custody & Ownership Invariant:**
   * Every registered pharmacy branch must maintain at least **one active custody pharmacist** (`Owner / Chief Pharmacist` or `Designated Manager / Pharmacist`) and at least **one active owner**. Deactivations or role changes that violate this are blocked with `409 PHARMACIST_CUSTODY_REQUIRED` or `409 LAST_OWNER`.
3. **Multi-Branch Governance:**
   * Only `is_owner` roles (`Owner / Chief Pharmacist` and `Pharmacy Owner`) can register new branch outlets, switch between branches, view aggregated corporate payouts, and update company bank accounts.
   * All other staff are strictly scoped to their assigned retail branch.
4. **Counter Cashier Custody:**
   * Releasing orders at the pharmacy counter requires entering the customer's secret 6-digit **Pickup PIN**, verified by `Dispensary Cashier`, `Staff Pharmacist`, `Designated Manager`, or `Owner`.
