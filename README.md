# Stockroom Inventory Management

Stockroom is a full-stack inventory management application for tracking items, suppliers, stock movements, requests, and operational reports. It focuses on clear business workflows, access control, data integrity, and a reproducible local setup.

All names and contact details bundled with the repository are fictional demonstration data.

## What it includes

- Item catalog with categories, suppliers, locations, minimum stock, and expiration dates
- Stock receipts and issues with an auditable movement history
- Request and approval workflow with role-based permissions
- Dashboard alerts for low stock, missing stock, and expiration risk
- Supplier and user management
- Filtered reports and Excel export
- Operational JSON export, PostgreSQL backup, and protected data reset
- JWT authentication, rate limiting, input validation, and centralized API errors

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Zustand, Axios |
| Backend | Java 17, Spring Boot 4, Spring Security, Spring Data JPA |
| Database | PostgreSQL 16, Flyway |
| Verification | JUnit, Testcontainers, Vitest, ESLint, TypeScript |

## Architecture

The application is organized as a modular monolith with independently runnable frontend and backend modules:

```text
React client
    │  REST + JWT
    ▼
Spring Boot API
    │  controllers → services → repositories
    ▼
PostgreSQL
    ▲
Flyway migrations
```

This keeps the application boundaries explicit while remaining appropriate for a single deployable backend.

## Repository layout

```text
.
├── backend/      Spring Boot API, migrations, and backend tests
├── frontend/     React application and frontend tests
├── compose.yaml  Local PostgreSQL service
└── verify.sh     Full-project verification
```

Module-specific details are available in [backend/README.md](backend/README.md) and [frontend/README.md](frontend/README.md).

## Run locally

### Prerequisites

- Java 17
- Node.js 22 (the repository includes `.nvmrc`)
- Docker with Docker Compose
- PostgreSQL 16 client tools (`pg_dump`/`pg_restore`) only if you use the full database backup/restore feature

The Maven Wrapper is included, so a global Maven installation is not required.

### 1. Start PostgreSQL

From the repository root:

```bash
docker compose up -d database
```

The Compose service creates the local `inventory_db` database with the development credentials defined in `compose.yaml`.

### 2. Start the API

```bash
cd backend

DB_PASSWORD='inventory_password' \
JWT_SECRET='local-development-secret-with-32-characters' \
DEV_ADMIN_USERNAME='admin.local' \
DEV_ADMIN_PASSWORD='local-admin-password' \
DEV_ADMIN_NAME='Local Administrator' \
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

Flyway applies the database migrations automatically. The optional `DEV_ADMIN_*` variables create the first local super administrator only when that username does not already exist. The project contains no reusable default login credentials.

For a first run, use a fresh local database so Flyway can build the schema from the repository migrations.

### 3. Start the web application

In another terminal:

```bash
cd frontend
npm ci
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The Vite development server proxies `/api` to the API at `http://localhost:8080`.

To stop the database:

```bash
docker compose down
```

Add `--volumes` only when you also want to delete the local development data.

## Verify the project

With Docker running, execute from the repository root:

```bash
./verify.sh
```

The script:

1. compiles, tests, and packages the backend;
2. validates all Flyway migrations against a disposable PostgreSQL container;
3. installs the exact frontend dependency tree from `package-lock.json`;
4. runs the dependency audit, lint, unit tests, type check, and production build.

The verification process does not access the local Compose database.

## Configuration

- `backend/.env.example` documents API environment variables. Spring Boot does not load that file automatically.
- `frontend/.env.example` documents the build-time API URL.
- `application-dev.yml` contains local development defaults; production still requires explicit secrets.
- Values exposed through Vite variables are public client configuration and must not contain secrets.

A fresh database contains only the schema and reference data created by the migrations. Operational inventory and supplier data can then be added through the application.

## Design and implementation notes

- Versioned Flyway migrations form the database history and are validated in PostgreSQL rather than only against an in-memory substitute.
- The development administrator is opt-in; no reusable password is committed.
- Requests are approved or rejected separately from direct stock operations.
- Operational reset preserves users and profiles and records the administrative action.
- Spreadsheet generation is isolated behind a lazy-loaded exporter to keep the initial bundle smaller.

## Scope

The repository demonstrates the complete local application workflow. The supplier registry follows a Brazilian operational context, including CPF/CNPJ, CEP/ViaCEP, state codes, and BRL currency. The public interface and documentation are in English, while those country-specific fields remain part of the domain model.

## License

Released under the [MIT License](LICENSE).
