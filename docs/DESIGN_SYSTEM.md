# MediPick Master Design System Guide

MediPick employs a unified, accessible, high-contrast healthcare visual design system with shared tokens across **Customer Mobile App** and **Pharmacy Dispensary Web Portal**.

---

## 1. Visual Identity & Brand Palette

| Token Name | Hex Code | Visual Role |
| :--- | :--- | :--- |
| **`primary.teal`** | `#1D6F72` | Dominant brand primary: buttons, active menu states, header badges |
| **`primary.tealDark`** | `#144F51` | High contrast sidebar background & dark card headers |
| **`primary.tealLight`**| `#EAF4F4` | Soft active pills, table hover states (light mode) |
| **`accent.lime`** | `#C7E36B` | Vibrant accent: confirmation checks, key notifications, CTA highlights |
| **`accent.limeSoft`** | `#EDF4DE` | Soft pill background for positive status chips |
| **`secondary.plum`** | `#6B4473` | Regulatory alerts, POM prescription tags, dispute badges |
| **`dark.background`** | `#0B1313` | Core dark theme background for web dashboard |
| **`dark.surface`** | `#111D1E` | Elevated card and modal surface in dark theme |
| **`dark.border`** | `#1F3335` | Subtle divider and card outline |

---

## 2. Platform Adaptation: Mobile vs Web

### A. Mobile Customer UI (React Native / Expo)
* **Design Philosophy:** Touch-first, thumb-zone optimized, large tap targets (minimum 44x44px).
* **Components:** Native bottom navigation tabs, bottom sheet drawers, gesture cards, camera integration for prescriptions.
* **Token Consumption:** Imports `BrandColors` from `@medipick/ui/tokens` directly into NativeWind / React Native StyleSheet.

### B. Web Portal (Pharmacy UI - Next.js)
* **Design Philosophy:** Dense data display, high information density, keyboard navigation, dark mode first.
* **Components:** Collapsible sidebar (`<SidebarLayout>`), paginated tables (`<DataTable>`), KPI metrics (`<StatCard>`), modal dialogs (`<Modal>`), PDF & Excel exports.
* **Token Consumption:** Tailwind CSS v4 variables mapped directly to MediPick brand hex values.

---

## 3. Typography Scale (Plus Jakarta Sans)

* **Hero / Big Numbers:** `text-3xl` (30px) / `text-4xl` (36px), Bold (`700`)
* **Page Titles:** `text-xl` (20px) / `text-2xl` (24px), SemiBold (`600`)
* **Section Headers:** `text-base` (16px), SemiBold (`600`)
* **Body / Table Cells:** `text-sm` (14px), Regular (`400`)
* **Labels / Meta / Badges:** `text-xs` (12px), Medium (`500`) / SemiBold (`600`)
