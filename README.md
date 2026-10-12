# Document Control System

Full-stack **Technical Office Document Control** platform for engineering and construction projects.

Manage projects, contracts, document submissions, revisions, consultant reviews, notifications, and audit trails — with a role-based web UI and a clean ASP.NET Core API.

---

## Repository layout

```
Document-Controll-API-/
├── DC.API/                 # ASP.NET Core 9 Web API (presentation)
├── DC.BLL/                 # Business logic, services, DTOs
├── DC.DAL/                 # Entities, EF Core, migrations, seeder
├── DC.API.slnx             # .NET solution
├── frontend/               # React + TypeScript + Vite SPA
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env.example
└── README.md
```

| Layer | Stack |
|-------|--------|
| **Backend** | .NET 9 · ASP.NET Core Web API · EF Core · SQL Server · JWT · MailKit |
| **Frontend** | React 19 · TypeScript · Vite · Tailwind CSS · TanStack Query · Zustand · React Router |

---

## Why this project exists

In construction and engineering offices, document control is often chaotic:

- Drawings, IR, method statements, and reports move through email threads  
- Revisions get lost or duplicated  
- Consultants lack a clear review queue  
- Managers have weak auditability  

This system replaces that with a **structured, role-based, auditable workflow** shared by Super Admins, Technical Office Engineers, and Consultants.

---

## Features

### Backend
| Area | Capability |
|------|------------|
| **Architecture** | Three-tier: `DC.API` → `DC.BLL` → `DC.DAL` |
| **Auth** | JWT login, lockout, role-based authorization |
| **Organization** | Departments, projects, contracts, contractors |
| **Assignments** | Assign engineers & consultants to contracts |
| **Documents** | Submit + file upload, multi-version, auto-numbering |
| **Reviews** | Consultant ratings **A / B / C / D** with status transitions |
| **Notifications** | In-app + email (MailKit / SMTP) |
| **Audit** | Action logs for compliance |
| **Coding rules** | Configurable document number parts (Super Admin) |

### Frontend
| Area | Capability |
|------|------------|
| **UI** | Modern SPA with Tailwind CSS and Framer Motion |
| **Auth** | Login, protected routes, JWT stored securely |
| **State** | Zustand + TanStack Query for server state |
| **Forms** | React Hook Form + Zod validation |
| **Uploads** | Drag-and-drop document upload (react-dropzone) |
| **UX** | Toasts (Sonner), virtualized lists, responsive layout |

---

## Roles

| Role | Constant | Typical access |
|------|----------|----------------|
| **Super Admin** | `SUPER_ADMIN` | Full system, users, master data, coding order |
| **Technical Office Engineer** | `Technical ENGINEER` | Submit documents, revisions, assigned contracts |
| **Consultant** | `CONSULTANT` | Review pending documents on assigned contracts |

---

## Default seed credentials (Development only)

When the API runs in **Development**, it migrates the database and seeds sample data.

| Field | Value |
|-------|--------|
| **Username** | `admin1` |
| **Password** | `password123` |
| **Role** | Super Admin |
| **Email** | `admin1@dc.com` |

Other seeded accounts (same password unless overridden):

| Username | Role |
|----------|------|
| `admin1` … `admin3` | Super Admin |
| `eng01` … `eng12` | Technical Office Engineer |
| `cons01` … `cons10` | Consultant |

```bash
# Optional: override seed password
# Windows PowerShell
$env:DC_SEED_PASSWORD = "YourStrongPassword"

# Linux / macOS
export DC_SEED_PASSWORD="YourStrongPassword"
```

> **Security:** Seed users are for local development only. Never use them in production. Rotate JWT keys, SMTP secrets, and connection strings before any real deployment.

---

## Prerequisites

- [.NET 9 SDK](https://dotnet.microsoft.com/download)
- SQL Server (LocalDB, Express, or full instance)
- [Node.js 20+](https://nodejs.org/) (for the frontend)
- Optional: SMTP credentials for real email tests

---

## Getting started

### 1. Clone

```bash
git clone https://github.com/melbayoumi68/Document-Controll-API-.git
cd Document-Controll-API-
```

### 2. Backend

**Connection string** — edit `DC.API/appsettings.json` (or User Secrets):

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=.;Database=DCAPI;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```

**Run the API:**

```bash
dotnet restore
dotnet build
dotnet run --project DC.API
```

On startup (Development):

1. EF migrations are applied  
2. Sample departments, types, projects, contracts, and users are seeded if the DB is empty  

Swagger UI (typical):

```text
https://localhost:<port>/swagger
```

Login via **POST `/api/Auth/login`**:

```json
{
  "usernameOrEmail": "admin1",
  "password": "password123"
}
```

Authorize Swagger with: `Bearer <accessToken>`

### 3. Frontend

```bash
cd frontend
cp .env.example .env   # if needed
npm install
npm run dev
```

Vite defaults to a proxy toward the API (`/api` → backend, see `vite.config.ts`).  
Point `VITE_API_BASE_URL` in `.env` if your API port differs:

```env
# Default: use Vite proxy
VITE_API_BASE_URL=/api

# Or call the API directly
# VITE_API_BASE_URL=http://localhost:5187/api
```

Open the URL printed by Vite (usually `http://localhost:5173`).

**Recommended order:** start the **backend first**, then the **frontend**.

---

## Document workflow

```text
Engineer (assigned to contract)
    │
    ├─ Submit document + file  →  Status: PendingReview
    │                              Version: 01
    │                              Notifications + email
    │
Consultant (assigned to contract)
    │
    ├─ Rating A  →  Approved
    ├─ Rating B  →  Approved with comments
    ├─ Rating C  →  Requires revision  →  Engineer uploads new version
    └─ Rating D  →  Rejected (new document required)

Overdue open documents can be auto-rejected based on DueDate rules.
```

Document numbers are built from configurable coding parts (project code, type, contractor, category, serial, revision) ordered by Super Admin settings.

---

## Main API areas

| Controller | Responsibility |
|------------|----------------|
| `Auth` | Login, change password |
| `User` | User CRUD (admin) |
| `Projects` | Project lifecycle |
| `Contracts` | Contracts; “my contracts” |
| `ContractAssignments` | Assign/remove engineers & consultants |
| `Contractors` | Contractor master data |
| `Department` | Departments |
| `DocumentType` / `DocumentCategory` | Classification |
| `DocumentCodingOrder` | Number part order |
| `Document` | Submit, list, filter, update |
| `DocumentVersion` | Versions + file download |
| `ConsultantReviews` | Ratings A–D |
| `Notifications` | User notifications |
| `AuditLogs` | Activity log (Super Admin) |

---

## Architecture notes

### Backend (three-tier)

- **DC.API** — HTTP, JWT, middleware, Swagger, migrate + seed  
- **DC.BLL** — Validation, workflows, email templates, DTOs  
- **DC.DAL** — Entities, Fluent configs, `AppDbContext`, migrations  

Controllers stay thin; business rules live in services.

### Frontend

- React SPA talking to the API over REST + JWT  
- Server state: TanStack Query  
- Client/UI state: Zustand  
- Routing: React Router with role-aware protected pages  

---

## Production checklist

- [ ] Strong unique `Jwt:Key` (32+ chars), Issuer, Audience  
- [ ] SQL connection via secrets (not committed)  
- [ ] SMTP via secrets store  
- [ ] CORS limited to your real frontend origin  
- [ ] Disable demo seed outside Development  
- [ ] Review file upload limits and allowed extensions  
- [ ] Build frontend with production API URL (`VITE_API_BASE_URL`)  
- [ ] HTTPS everywhere  

---

## Project value

| Stakeholder | Benefit |
|-------------|---------|
| **Technical Office** | One place to submit and track documents & revisions |
| **Consultants** | Clear review queue with structured ratings |
| **Project management** | Traceability: who submitted, who reviewed, when |
| **Developers** | Clear full-stack structure, Swagger + modern React |
| **Compliance** | Audit logs and role separation |

---

## Quick login reference

```text
Username : admin1
Password : password123
Role     : SUPER_ADMIN
```

1. Start the API  
2. Start the frontend (`npm run dev` in `frontend/`)  
3. Sign in and explore Projects → Contracts → Assignments → Documents → Reviews  

---

## License / usage

Private academic or internal project unless otherwise specified by the repository owner.
