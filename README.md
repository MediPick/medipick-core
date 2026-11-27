# MediPick Common (`medipick-common`)

**MediPick Common** is the central, unified shared architecture repository for the MediPick healthcare platform. It provides shared backend databases, security, and models, alongside a complete frontend UI design system, master documentation, and API contracts.

---

## 📁 Repository Structure

```text
medipick-common/
├── backend/                  # Python 3.11 shared backend package
│   ├── medipick_core/        # SQLAlchemy models (39 tables across 23 files), Alembic, RBAC, JWT, Storage
│   ├── alembic/              # Database migration versions
│   └── pyproject.toml        # pip package configuration
│
├── frontend/                 # TypeScript & React shared design system (@medipick/ui)
│   ├── src/tokens/           # Brand colors (#1D6F72, #C7E36B), typography, spacing
│   ├── src/components/       # DataTable, StatusBadge, StatCard, Modal, CustomSelect
│   ├── src/navigation/       # SidebarLayout, UserProfileBadge, NotificationBanner
│   ├── src/utils/            # Currency (LKR), Date (Asia/Colombo), PDF/Excel export
│   └── src/auth/             # Token storage & AuthGuard
│
├── contracts/                # Centralized API contracts
│   ├── openapi.json          # Unified OpenAPI 3.1 schema
│   └── types.ts              # Canonical TypeScript domain types
│
└── docs/                     # Master Platform Documentation
    ├── ROLES_AND_RBAC.md     # Roles: Customer, Pharmacy Staff, Pharmacist, Pharmacy Admin
    ├── METRICS_AND_CALCULATIONS.md # FSM rules, financial formulas, stock health
    ├── DESIGN_SYSTEM.md      # Mobile (Expo) vs Web (Next.js) design tokens
    ├── AUTH_AND_LIFECYCLE.md # OTP & JWT auth flows and revocation
    └── ARCHITECTURE.md       # Microservice topology and consumption guide
```

---

## 🚀 How Services Consume `medipick-common`

### 1. In Backend Microservices (`customer-backend`, `pharmacy-backend`)
In `requirements.txt`:
```bash
-e ../medipick-common/backend
```
In Python:
```python
from medipick_core.database import get_db
from medipick_core.models.user import User, UserRole
from medipick_core.rbac import require_role
from medipick_core.schemas.common import SuccessResponse
```

### 2. In Frontend Portals (`pharmacy-ui`)
In `package.json`:
```json
"dependencies": {
  "@medipick/ui": "file:../medipick-common/frontend"
}
```
In React / Next.js:
```tsx
import { DataTable, StatusBadge, StatCard, Modal } from '@medipick/ui';
import { formatLKR, formatDate } from '@medipick/ui/utils';
import { BrandColors } from '@medipick/ui/tokens';
```

### 3. In Mobile Customer App (`customer-ui`)
```ts
import { BrandColors } from '@medipick/ui/tokens';
import { normalizeSriLankanPhone } from '@medipick/ui/utils';
```

---

## 🛡️ License
Proprietary — MediPick Team. All Rights Reserved.
