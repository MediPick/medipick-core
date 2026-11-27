# MediPick System Architecture

MediPick is a microservice platform designed to provide safe, audited, on-demand pharmacy dispensing across Sri Lanka.

---

## 1. System Context Diagram

```mermaid
graph TD
    subgraph Shared Common Layer [medipick-common]
        BACKEND_CORE["backend/ (medipick_core)<br/>DB Models, Alembic, RBAC, Storage"]
        FRONTEND_UI["frontend/ (@medipick/ui)<br/>Tokens, DataTable, Badges, Modals, Exports"]
        CONTRACTS["contracts/<br/>OpenAPI Specifications & TypeScript Types"]
    end

    subgraph Client Portals
        CUI["medipick-customer-ui<br/>(React Native / Expo Mobile)"]
        PUI["medipick-pharmacy-ui<br/>(Next.js Web Dashboard)"]
    end

    subgraph Backend Microservices
        CB["medipick-customer-backend<br/>(FastAPI / Port 8000)"]
        PB["medipick-pharmacy-backend<br/>(FastAPI / Port 8002)"]
        VS["medipick-vision-service<br/>(YOLOv8 AI / Port 8001)"]
    end

    subgraph Infrastructure [medipick-iac]
        PG[(PostgreSQL 15)]
        MINIO[(MinIO / S3 Storage)]
        DOCKER[Docker Compose / Cloud Run]
    end

    %% Dependencies
    CB -->|pip install| BACKEND_CORE
    PB -->|pip install| BACKEND_CORE

    PUI -->|npm install| FRONTEND_UI
    CUI -->|imports tokens| FRONTEND_UI

    CB --> PG
    PB --> PG
    CB --> MINIO
    PB --> MINIO
    CB -->|HTTP validate| VS
```

---

## 2. Repository Roster & Responsibilities

1. **`medipick-common`**:
   * **`backend/`**: Unified SQLAlchemy models, Alembic migrations, RBAC definitions, PayHere payment helpers, MinIO storage.
   * **`frontend/`**: Shared UI design tokens, web dashboard components (DataTables, Badges, Modals, Export), and utility formatters.
   * **`contracts/`**: Centralized OpenAPI schema and TypeScript interfaces.
   * **`docs/`**: Master documentation covering RBAC, metrics, design system, and auth lifecycles.
2. **`medipick-customer-backend`**: Customer OTP auth, drug catalog, cart, prescription uploads, PayHere integration.
3. **`medipick-pharmacy-backend`**: Staff auth, multi-branch isolation, prescription quote acceptance, inventory, analytics.
4. **`medipick-vision-service`**: YOLOv8 deep learning service for prescription NMRA seal detection and Laplacian sharpness scoring.
5. **`medipick-customer-ui`**: Mobile-first customer experience built with Expo and NativeWind.
6. **`medipick-pharmacy-ui`**: Next.js desktop dispensary command center.
7. **`medipick-iac`**: Infrastructure-as-code: Docker Compose, Terraform GCP Cloud Run, and networking.
