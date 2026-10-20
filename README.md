# Public Market of Manticao - Rental Management System

An automated, role-governed rental lifecycle management platform for the **Public Market of Manticao (Misamis Oriental)**.

Preserves the authoritative **Vue.js 3 + Node.js Express + Supabase PostgreSQL** architecture from the system blueprint, fully replacing the legacy Spring Boot runtime with a modular Node.js API and 25-step operational workflow state machine.

---

## Authoritative System Architecture

| Layer | Implementation Technology |
|---|---|
| **Web Frontend** | Vue.js 3, Vite, PrimeVue / Sakai design system, Leaflet interactive visual stall mapping |
| **Backend API** | Node.js + Express.js RESTful JSON API (`server/src/`), modular architecture |
| **Database** | Supabase PostgreSQL with normalized schema, constraints, indexes, triggers, and Row Level Security (RLS) |
| **Authentication & RBAC** | Supabase Auth + Server-side JWT RBAC governing all 10 principal actors |
| **File Storage** | Supabase Storage for private document uploads (LOI, valid IDs, PDFs) |
| **Document Generation** | 3-Year Contract of Lease PDF, Municipal Occupancy Permit with QR code & SHA-256 integrity hash, MORESCO-1 utility clearance, Official Receipts |
| **Background Processing** | `node-cron` workers handling monthly recurring billing on the 1st of each month and daily delinquency scans (30-, 60-, and 90-day demand notices) |
| **API Style** | RESTful JSON API (`/api/...`) |

---

## 10 Principal Roles & Responsibilities

1. **APPLICANT:** Prospective vendor onboarding, LOI and ID submission, payment instruction access.
2. **VENDOR:** Active stall occupant, lease and permit downloads, billing statements and payment history.
3. **MARKET_SUPERVISOR:** Interactive stall management and visual mapping, LOI review and endorsement, 3-year contract preparation, and authorized operational archiving.
4. **MAYOR:** Executive review and approval of LOIs, review of 90-day arrears, exclusive authority for lease revocations.
5. **TREASURER:** Initial fee validation, walk-in payment recording, digital Official Receipt issuance, BPLO business permit fee recording, field collection remittance reconciliation.
6. **COLLECTOR:** Field micro-collections (daily ₱100 payments against specific bills) and Treasury remittance.
7. **COLLECTOR_INSPECTOR:** Field collections and physical stall inspections (verifying physical setup and actual goods vs declared business line).
8. **BPLO / BPLO_STAFF:** Business line review, fee assessment forwarded to Treasury, business permit release only after confirmed Treasury payment.
9. **ENDORSING_OFFICE:** Configurable intermediate office review and auditable endorsement step.
10. **ADMIN:** User credentials, rental rate formulas, system settings, audit logs, and maintenance.

---

## Getting Started

### 1. Prerequisites
- Node.js 18+ or 20+
- npm 9+
- Supabase account & project

### 2. Environment Setup
Copy the example environment file:
```bash
cp .env.example .env
```
Configure your `.env` variables:
```env
PORT=5000
VITE_BACKEND_URL=http://localhost:5000/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-32-char-jwt-secret
```

### 3. Database Migration & Seeding
Apply the SQL migrations located in `supabase/migrations/`:
```bash
# 1. Base Complete Schema:
supabase/migrations/20261020_complete_manticao_migration.sql

# 2. BPLO, Endorsing Office, and MORESCO Integration:
supabase/migrations/20261021_bplo_endorsing_moresco_update.sql

# 3. Initial Seeds:
supabase/seed.sql
```
Data dictionary reference: `docs/DATA_DICTIONARY.md`.  
Migration audit reference: `docs/MIGRATION_REPORT.md`.

### 4. Running the Application

#### Start the Node.js Express Backend API
```bash
npm run server
# Server listening on http://localhost:5000
# Health check: http://localhost:5000/api/health
```

#### Start the Vue.js Frontend (in parallel)
```bash
npm run dev
# Vite dev server running at http://localhost:5173
```

#### Build for Production
```bash
npm run build
```

---

## Automated Acceptance Test Suite

Run the full 17-deliverable test suite specified in Section 16 of the master blueprint:
```bash
npm run test:server
```

### 17 Verified Deliverables:
1. **Authentication and role permissions:** All 10 roles configured with strict privilege boundaries.
2. **Application submission and document upload:** LOI and valid government ID document upload and reference generation.
3. **Stall reservation & concurrency protection:** Atomic `PENDING` reservation blocking overlapping applications.
4. **Supervisor and Mayor approvals:** Two-tier review workflow with recorded decisions and timestamps.
5. **Initial fee calculation:** Stall Rights Fee + mandatory 2-month advance rental; non-enforcement of automatic 25% penalty.
6. **Official receipt generation:** Unique OR number, date, cashier identity, and SHA-256 integrity hash.
7. **3-year Contract of Lease execution:** Fixed 3-year term calculation and execution status recording.
8. **Occupancy permit & QR verification:** Deterministic cryptographic SHA-256 hash, QR verification data URL, and MORESCO-1 utility electrical clearance certificate.
9. **Physical inspection and vendor activation checks:** Stall status `OCCUPIED_PENDING_VERIFICATION`, physical inspection, BPLO fee assessment, Treasury payment, BPLO permit release, and 4-point prerequisite check before promoting to `ACTIVE_VENDOR`.
10. **Monthly billing & advance allocation:** 1st-of-month scheduled billing, uniqueness on `(contract_id, billing_period)`, 2-month advance credit amortization.
11. **Partial payments & field collections:** Daily ₱100 micro-payments recorded against specific bills with balance reduction.
12. **Treasury remittance reconciliation:** Reconciles collected funds without double counting municipal revenue.
13. **30-, 60-, and 90-day delinquency notices:** Automated demand notice progression and 2-month grace period integration.
14. **Mayor-authorized revocation:** Exclusive Mayoral authority required to revoke lease; operational record archived while preserving legal/financial history.
15. **Reports and metrics calculations:** Real database aggregations for occupancy rate, expected vs collected revenue, and arrears.
16. **Unauthorized access & RLS policies:** Cross-role boundary enforcement and separation of duties.
17. **Background-job retries & duplicate prevention:** Durable worker idempotency preventing duplicate charges or notifications.
