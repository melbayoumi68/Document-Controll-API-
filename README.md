# Document Control System — Backend API

ASP.NET Core 9 Web API for **Technical Office Document Control**.  
Manage engineering project documents end-to-end: projects, contracts, submissions, revisions, consultant reviews, notifications, and audit trails.

---

## Why this project exists

In construction and engineering offices, document control is critical:

- Drawings, inspection requests, method statements, and reports must be submitted in order  
- Every revision must be tracked  
- Consultants must review and rate documents (approve / revise / reject)  
- Engineers need a clear workflow instead of email chaos  
- Management needs auditability and accountability  

This API was built to replace fragmented email-based document exchange with a **structured, role-based, auditable backend** that a frontend (web or mobile) can consume.

### What was implemented

| Area | What you get |
|------|----------------|
| **Architecture** | Clean three-tier: `DC.API` → `DC.BLL` → `DC.DAL` |
| **Auth** | JWT login, lockout after failed attempts, role-based authorization |
| **Organization** | Departments, projects, contracts, contractors |
| **Assignments** | Assign Technical Office Engineers and Consultants to contracts |
| **Documents** | Submit documents with files, auto-numbering, multi-version support |
| **Reviews** | Consultant ratings A / B / C / D with status transitions |
| **Notifications** | In-app notifications + email (MailKit / SMTP) |
| **Audit** | Action logs for security and compliance |
| **Coding rules** | Configurable document number parts and order (Super Admin) |

---

## Solution structure

```
backend/
├── DC.API.slnx                 # Solution file
├── DC.API/                     # Presentation layer
│   ├── Controllers/            # HTTP endpoints
│   ├── Program.cs              # DI, JWT, middleware, migrate + seed
│   └── appsettings.json
├── DC.BLL/                     # Business layer
│   ├── Services/               # Business logic
│   ├── Interfaces/             # Service contracts
│   ├── Dtos/                   # Request/response models
│   └── Security/               # CurrentUser helpers (claims)
└── DC.DAL/                     # Data layer
    ├── Models/                 # Entities
    ├── Data/                   # AppDbContext, DbSeeder
    ├── Configurations/         # EF Fluent API
    └── Migrations/             # EF Core migrations
```

**Dependency flow:** Controllers → Services → `AppDbContext` → SQL Server  

Services contain business rules. Controllers handle HTTP only. The DAL owns entities, EF configuration, and migrations.

---

## Tech stack

| Technology | Version / notes |
|------------|-----------------|
| .NET | 9.0 |
| ASP.NET Core Web API | Controllers + minimal hosting |
| Entity Framework Core | 9.x + SQL Server provider |
| Authentication | JWT Bearer |
| Email | MailKit (SMTP) |
| API docs | OpenAPI + Swagger UI (Development) |
| Database | Microsoft SQL Server |

---

## Roles

| Role | Constant | Typical permissions |
|------|----------|---------------------|
| **Super Admin** | `SUPER_ADMIN` | Full system access, master data, users, coding order |
| **Technical Office Engineer** | `Technical ENGINEER` | Submit documents, upload revisions, view assigned contracts |
| **Consultant** | `CONSULTANT` | Review pending documents on assigned contracts |

---

## Default seed credentials (Development only)

When the API runs in **Development**, it applies migrations and seeds sample data.

| Field | Value |
|-------|--------|
| **Username** | `admin1` |
| **Password** | `password123` |
| **Role** | Super Admin |
| **Email** | `admin1@dc.com` |

Other seeded accounts (same password `password123` unless overridden):

| Username pattern | Role |
|------------------|------|
| `admin1` … `admin3` | Super Admin |
| `eng01` … `eng12` | Technical Office Engineer |
| `cons01` … `cons10` | Consultant |

Override the seed password with environment variable:

```bash
# Windows PowerShell
$env:DC_SEED_PASSWORD = "YourStrongPassword"

# Linux / macOS
export DC_SEED_PASSWORD="YourStrongPassword"
```

> **Security note:** Seed users and default passwords are for local development only. Do not use them in production. Change JWT keys, SMTP secrets, and connection strings before any real deployment.

---

## Getting started

### Prerequisites

- .NET 9 SDK  
- SQL Server (LocalDB, Express, or full instance)  
- Optional: SMTP credentials for real email tests  

### 1. Clone and open

```bash
git clone <your-repo-url>
cd backend
```

Open `DC.API.slnx` in Visual Studio 2022 / VS Code, or use the CLI.

### 2. Connection string

Edit `DC.API/appsettings.json` (or User Secrets / environment variables):

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=.;Database=DCAPI;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```

Adjust `Server` for your machine (e.g. `localhost`, `localhost\\SQLEXPRESS`).

### 3. JWT and email (Development)

Configured under `Jwt`, `Security`, and `Email` sections in `appsettings.json`.  
Prefer **User Secrets** or environment variables for secrets; do not commit production credentials.

### 4. Run

```bash
dotnet restore
dotnet build
dotnet run --project DC.API
```

On startup (Development):

1. `Database.Migrate()` applies pending EF migrations  
2. `DbSeeder` loads departments, types, sample projects/contracts/users if the DB is empty  

### 5. Swagger

In Development, open the Swagger UI path printed in the console (typically based on `launchSettings.json`), e.g.:

```text
https://localhost:<port>/swagger
```

Use **POST `/api/Auth/login`** with:

```json
{
  "usernameOrEmail": "admin",
  "password": "password123"
}
```

Copy the `accessToken` and authorize Swagger with:

```text
Bearer <accessToken>
```

---

## Main API areas

| Controller | Responsibility |
|------------|----------------|
| `Auth` | Login, change password |
| `User` | User CRUD (admin) |
| `Projects` | Project lifecycle |
| `Contracts` | Contracts under projects; “my contracts” |
| `ContractAssignments` | Assign/remove engineers & consultants |
| `Contractors` | Contractor master data |
| `Department` | Departments |
| `DocumentType` / `DocumentCategory` | Classification master data |
| `DocumentCodingOrder` | Order of document number parts |
| `Document` | Submit, list, filter, update documents |
| `DocumentVersion` | Versions + file download |
| `ConsultantReviews` | Submit ratings A–D |
| `Notifications` | User notifications |
| `AuditLogs` | Security / activity log (Super Admin) |

Exact routes follow the `[Route]` attributes on each controller (e.g. `api/Document`, `api/Auth/login`).

---

## Document workflow (high level)

```text
Engineer (assigned to contract)
    │
    ├─ Submit document + file  →  Status: PendingReview
    │                              Version: 01
    │                              Email / notifications to stakeholders
    │
Consultant (assigned to contract)
    │
    ├─ Rating A  →  Approved
    ├─ Rating B  →  Approved with comments
    ├─ Rating C  →  Requires revision  →  Engineer uploads new version
    └─ Rating D  →  Rejected (new document required, not a new version)

Overdue open documents can be auto-rejected based on DueDate rules in the service layer.
```

Document numbers are built from configurable coding parts (project code, type abbreviation, contractor, category, serial, revision) ordered by Super Admin settings.

---

## Architecture notes (three-tier)

- **DC.API:** HTTP, JWT middleware, exception mapping, Swagger, startup migrate/seed  
- **DC.BLL:** Validation, workflows, email templates, password helpers, DTOs  
- **DC.DAL:** Entities, Fluent configurations, `AppDbContext`, migrations, seeder  

This keeps controllers thin and business rules testable in the BLL without coupling them to HTTP details.

---

## Configuration checklist before production

- [ ] Strong unique `Jwt:Key` (32+ characters), Issuer, Audience  
- [ ] SQL connection via secure configuration (not committed secrets)  
- [ ] SMTP credentials via secrets store; disable email or use a real provider  
- [ ] Replace plain-text / temporary password handling with production-grade hashing if not already enabled in your branch  
- [ ] Restrict CORS to your real frontend origin  
- [ ] Disable automatic seed of demo users outside Development  
- [ ] Review file upload limits and allowed extensions  

---

## Project importance (summary)

| Stakeholder | Benefit |
|-------------|---------|
| **Technical Office** | One place to submit and track documents and revisions |
| **Consultants** | Clear queue queue with structured ratings |
| **Project management** | Traceability: who submitted, who reviewed, when |
| **IT / developers** | Standard .NET API, clear layers, Swagger for integration |
| **Compliance** | Audit logs and role separation |

---

## License / usage

Private academic or internal project unless otherwise specified by the repository owner.

---

## Quick login reference

```text
Username : admin1
Password : password123
Role     : SUPER_ADMIN
```

After login, explore Projects → Contracts → Assignments → Documents → Reviews via Swagger or your frontend.
