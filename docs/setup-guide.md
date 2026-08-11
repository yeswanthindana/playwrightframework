# 📍 SentinelX Facilities Test Automation: Implementation Guide

This guide is designed to explain in plain English (layman-friendly terms) how our Facility module test automation works. We will walk through the exact folder structures, files, and step-by-step logic that handles Facility creation, reading, updating, and deletion (CRUD).

---

## 🧱 Codebase Components (What does what?)

To understand the tests, let's look at the key building blocks in our modular design:

```text
                  ┌─────────────────────────────────────────┐
                  │          Model (Data Contract)          │
                  │   Defines exact structure for:          │
                  │   - API payloads (api/)                 │
                  │   - DB Row tables (database/)           │
                  │   - UI Web forms (ui/)                  │
                  └────────────────────┬────────────────────┘
                                       │
          ┌─────────────────────────────┼─────────────────────────────┐
          ▼                             ▼                             ▼
 ┌───────────────────┐        ┌───────────────────┐        ┌───────────────────┐
 │ Page Object (POM) │        │    API Client     │        │  DB Repository    │
 │ representation of │        │ handles REST HTTP │        │ queries Postgres  │
 │ UI screens/fields │        │ requests/responses│        │ storage layer     │
 └───────────────────┘        └───────────────────┘        └───────────────────┘
```

### 1. 📐 Domain Models (`src/models/`)
A model is like a blueprint. It tells the framework exactly what fields and types represent a Facility.
- **`src/models/api/FacilityApiModel.ts`**: blueprints for JSON data sent to/from the API endpoints.
- **`src/models/database/FacilityDbModel.ts`**: blueprints matching the columns inside PostgreSQL tables.
- **`src/models/ui/FacilityUiModel.ts`**: blueprints representing inputs typed by a member on web forms.

### 2. 🔌 Fixtures (`src/fixtures/`)
Playwright fixtures act like automatic installers. In your test, you simply write `async ({ facilityApiClient, facilityRepository }) => { ... }`. Behind the scenes, Playwright initializes the Postgres pool, sets up request context, configures browser states, and injects them ready for use.
- **`baseFixture.ts`**: starts core browser and DB instances.
- **`apiFixture.ts`**: sets up general API client.
- **`facilitiesFixture.ts`**: sets up facility-specific clients and repositories.

### 3. 🖥️ Page Objects (`src/pages/`)
Translates browser web pages into readable code.
- **`src/pages/facilities/FacilitiesPage.ts`**: maps fields on the Facilities page (name input, city textbox, timeregion dropdown, etc.).
- **`src/pages/components/`**: houses modular reusable widgets.
  - **`Common.ts`**: shared actions like clicking standard "Save", "Add", or action icons (edit/delete/view) with optional row-scope constraints.
  - **`Sidebar.ts`**: navigation menus.
  - **`Toast.ts`**: toast notification banners.

### 4. 🌐 API Clients (`src/api/clients/`)
Allows communicating directly with backend servers without launching a browser.
- **`BaseApiClient.ts`**: base HTTP wrapper managing methods (GET, POST, PATCH, DELETE) and printing structured traffic logs.
- **`FacilityApiClient.ts`**: specific client handling CRUD endpoints (e.g. `createFacility`, `updateFacility`).

### 5. 🗄️ Database Repositories (`src/database/repositories/`)
Queries physical database tables to check the final "Source of Truth".
- **`FacilityRepository.ts`**: runs direct SQL queries to confirm records are added, edited, or deleted (soft deactivated).

---

## 🔬 Comparison of Test Suites

We have three distinct types of tests under `tests/` designed to validate the system on multiple levels.

---

### 1. 🌐 API Test Suite (`tests/api/facilities/`)
Directly verifies the speed, schema, validation, and database updates of backend REST APIs.
- **`createFacility.spec.ts`**: Sends a POST request, asserts that `id` is returned, and queries the database to match columns.
- **`readFacility.spec.ts`**: Fetches a facility by ID and name, matching payload fields.
- **`updateFacility.spec.ts`**: Sends a PATCH request updating properties and verifies changes inside PostgreSQL.
- **`deleteFacility.spec.ts`**: Sends a DELETE request and verifies that the database table marks `is_active = false`.
- **`facilityNegative.spec.ts`**: Validates API error handling (e.g. creating duplicates, invalid inputs, or requesting non-existent IDs).

---

### 🎭 2. UI Test Suite (`tests/ui/facilities/`)
Focuses on validation of member interface elements, error messages, and forms.
- **`facilities.spec.ts`**: Adds, views, and deletes facilities using browser actions.
- **`facilitiesNegative.spec.ts`**: Asserts inline validation warnings (like `"Name is required"`) and duplicate error toast messages.

---

### ⛓️ 3. E2E Integration Suite (`tests/e2e/facilityUiApiDb.spec.ts`)
A complete "Hybrid Test" showing the entire lifecycle integration. It validates the member interface, backend API responses, and database updates in a single run:

```text
[1. UI Form Action] ➔ [2. Success Alert Check] ➔ [3. API Query Verification] ➔ [4. SQL Database Check]
```

1. **Add Facility**: Playwright logs in, opens Facilities UI, populates the form with unique dynamic data, and clicks save. It verifies that the toast displays `"Facility created successfully"`. It then triggers `facilityApiClient` to verify the JSON output, and `facilityRepository` to query Postgres and confirm the row is active.
2. **View Facility**: Filters the list for the created name, clicks the "View" icon, and verifies the read-only details form fields.
3. **Edit Facility**: Clicks the "Edit" icon, modifies values, saves, and queries the database to confirm updates are saved.
4. **Delete Facility**: Clicks the "Delete" icon, confirms deletion, verifies the toast message, and queries PostgreSQL to verify the record is deactivated (`is_active = false`).

---

## 🛠️ Local Verification & Development Checklist

To run and verify your changes:

1. **Verify TypeScript compilation:**
   ```bash
   npm run typecheck
   ```
2. **Run all tests:**
   ```bash
   npx playwright test
   ```
3. **Run specific suites:**
   ```bash
   npx playwright test tests/api/
   npx playwright test tests/ui/
   npx playwright test tests/e2e/
   ```
