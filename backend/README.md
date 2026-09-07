# Stockroom backend

Spring Boot REST API for the Stockroom inventory management application.

## Responsibilities

- JWT authentication and role-based authorization
- Items, categories, suppliers, users, and stock movements
- Request approval workflow
- Dashboard and reporting queries
- Operational exports, PostgreSQL backup, and protected reset
- Flyway-managed PostgreSQL schema

## Requirements

- Java 17
- Docker for Testcontainers-based migration tests
- PostgreSQL 16 for local application execution
- PostgreSQL 16 client tools (`pg_dump` and `pg_restore`) when using full database backup/restore

The Maven Wrapper is included.

## Local execution

From the repository root, start PostgreSQL:

```bash
docker compose up -d database
```

Then start the API from the `backend` directory:

```bash
cd backend

DB_PASSWORD='inventory_password' \
JWT_SECRET='local-development-secret-with-32-characters' \
DEV_ADMIN_USERNAME='admin.local' \
DEV_ADMIN_PASSWORD='local-admin-password' \
DEV_ADMIN_NAME='Local Administrator' \
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

The API is available at `http://localhost:8080/api/v1`.

The `DEV_ADMIN_*` bootstrap is limited to the `dev` profile. Username and password must be supplied together, the password must contain at least 12 characters, and an existing username is never overwritten.

## Tests

```bash
./mvnw test
```

```bash
./mvnw package
```

`PostgreSqlMigrationTests` uses Testcontainers to apply the full Flyway history to a disposable PostgreSQL instance. Docker must be available for the complete test suite.

## Configuration

The accepted variables are documented in `.env.example`. Spring Boot reads the environment; it does not load `.env.example` automatically.

Required outside tests:

- `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`
- `JWT_SECRET` with at least 32 characters

Relevant optional values:

- `JWT_EXPIRATION_MS`
- `APP_CORS_ALLOWED_ORIGINS`
- `SERVER_PORT`, `SERVER_ADDRESS`, `SERVER_FORWARD_HEADERS_STRATEGY`
- `LOGIN_RATE_LIMIT_*`
- `DEV_ADMIN_*` when the `dev` profile is active
- `DEV_HIBERNATE_SQL_LOG_LEVEL` and `DEV_HIBERNATE_BIND_LOG_LEVEL` when the `dev` profile is active

Production configuration has no default password or JWT secret.

### Full PostgreSQL backup

The raw `.backup` export is restricted to the super administrator and requires the current account password again before `pg_dump` is started. Successful exports are recorded in `auditoria_administrativa`. The operational JSON export remains separate and omits password hashes.

Use PostgreSQL 16 `pg_dump`/`pg_restore` client tools with this PostgreSQL 16 project. The server running the backend must have `pg_dump` available on `PATH` for the raw backup feature. Treat generated `.backup` files as sensitive because they contain the complete database, including user password hashes and operational data.

### Hibernate diagnostics in development

The `dev` profile keeps Hibernate SQL and JDBC bind logging at `ERROR` by default. For temporary SQL diagnostics, set `DEV_HIBERNATE_SQL_LOG_LEVEL=DEBUG`. Enable `DEV_HIBERNATE_BIND_LOG_LEVEL=TRACE` only when parameter values are specifically needed: bind logs can contain sensitive application data, so keep this opt-in temporary and review the output before sharing it. These variables are referenced only by the `dev` profile and do not change production logging levels.

## Source layout

```text
src/main/java/com/nexusstock/almoxarifado/
├── config/       Runtime and security configuration
├── controller/   Versioned REST endpoints
├── dto/          Request, response, and mapping boundaries
├── entity/       JPA entities
├── repository/   Persistence interfaces
├── security/     JWT and login rate limiting
└── service/      Business rules and transactions

src/main/resources/
├── db/migration/ Flyway history
└── application*  Environment-specific configuration
```

The Java package keeps the established internal namespace; the product name used in the interface and documentation is Stockroom.

## API overview

All application endpoints are under `/api/v1`.

| Area | Base path |
| --- | --- |
| Authentication | `/auth` |
| Items and categories | `/itens`, `/categorias` |
| Inventory movements | `/movimentacoes` |
| Requests | `/solicitacoes` |
| Suppliers | `/fornecedores` |
| Users and profiles | `/usuarios`, `/perfis` |
| Dashboard and reports | `/dashboard`, `/relatorios` |
| Administration | `/configuracoes` |

The internal resource names remain in Portuguese for compatibility with the established domain model. The web interface presents the workflow in English.

## Database changes

Add schema changes as new versioned migrations. Do not edit a migration that has already been applied to a persistent environment, because Flyway validates its checksum.
