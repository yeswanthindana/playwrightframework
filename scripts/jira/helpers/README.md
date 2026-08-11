# Jira Helper and Command Reference

This folder is the single starting point for reusable Jira commands. It brings together the read-only curl diagnostics and points to the framework's existing import and mapping utilities.

## Safety and credentials

- `jira-reference.sh` performs GET requests only. It cannot create, edit, link, transition, comment on, or delete Jira issues.
- It reads `config/environments/qa.env` when `TEST_ENV` is not specified.
- Real environment files are Git-ignored. Never put an API token in this folder, a command argument, documentation, or an `.env.example` file.
- If credentials are absent, the helper asks for the email and invisibly prompts for the token.

## One-time setup

```bash
cp config/environments/qa.env.example config/environments/qa.env
chmod +x scripts/jira/helpers/jira-reference.sh
```

Add the real values only to the ignored `config/environments/qa.env`:

```dotenv
JIRA_BASE_URL=https://aether.atlassian.net
JIRA_EMAIL=your-email@aether.com
JIRA_API_TOKEN=your-secret-token
```

## Read-only Jira reference commands

Run from the repository root:

| Need | Command |
|---|---|
| Verify authentication | `./scripts/jira/helpers/jira-reference.sh auth` |
| Get account ID and member details | `./scripts/jira/helpers/jira-reference.sh myself` |
| Get every Jira field ID | `./scripts/jira/helpers/jira-reference.sh fields` |
| Get only test-related fields | `./scripts/jira/helpers/jira-reference.sh test-fields` |
| Get allowed values for a test issue | `./scripts/jira/helpers/jira-reference.sh editmeta EVR-1146` |
| Get link-type IDs such as QAlity Test | `./scripts/jira/helpers/jira-reference.sh link-types` |
| Get EVR project information | `./scripts/jira/helpers/jira-reference.sh project EVR` |
| Find EVR Scrum boards | `./scripts/jira/helpers/jira-reference.sh boards EVR` |
| Get sprints from board 35 | `./scripts/jira/helpers/jira-reference.sh sprints 35` |
| Inspect integration fields on an issue | `./scripts/jira/helpers/jira-reference.sh issue EVR-1146` |

Use a different environment file:

```bash
TEST_ENV=dev ./scripts/jira/helpers/jira-reference.sh auth
```

Or provide an explicit file:

```bash
JIRA_ENV_FILE=/safe/private/path/jira.env \
  ./scripts/jira/helpers/jira-reference.sh sprints 35
```

## Excel-to-Jira utilities

These tools already live one directory above this helper folder:

| Tool | Purpose | Jira writes? |
|---|---|---|
| `scripts/jira/test-case-file-discovery.mjs` | Finds the spec file containing each Test Case ID | No |
| `scripts/jira/sync-test-case-mapping.mjs` | Synchronizes Excel Jira keys and the JSON mapping | No Jira writes; local files can change |
| `scripts/jira/import-test-cases.mjs` | Validates Excel and optionally creates/links/assigns Jira tests | Dry run: no; commit: yes |

Safe dry run for one workbook:

```bash
TEST_ENV=qa npm run jira:import -- \
  --file resources/facility_test_cases.xlsx \
  --dry-run
```

Safe dry run for all workbooks:

```bash
TEST_ENV=qa npm run jira:import -- --all --dry-run
```

Open the generated report with `jq`; do not try to execute the JSON filename:

```bash
jq . test-results/jira-import-dry-run.json
```

Commit mode intentionally remains documented in the detailed Jira guide because it creates Jira issues and requires explicit safety switches and confirmation.

## Execution-result commands

Run a linked Playwright test without Jira updates:

```bash
TEST_ENV=qa JIRA_ENABLED=false \
  npx playwright test tests/api/facilities/facilityNegative.spec.ts \
  --project=API --grep 'TC-LOC-API-009'
```

Run it with Jira result synchronization enabled:

```bash
TEST_ENV=qa JIRA_ENABLED=true \
  npx playwright test tests/api/facilities/facilityNegative.spec.ts \
  --project=API --grep 'TC-LOC-API-009'
```

The second command can update Jira status, environment, Executed By, the execution-summary comment, logs, and configured attachments.

## Detailed documentation

- [`docs/jira/QUICK-START.md`](../../../docs/jira/QUICK-START.md) — beginner workflow
- [`docs/jira/README.md`](../../../docs/jira/README.md) — complete implementation guide
- [`docs/jira/IMPLEMENTATION-BLUEPRINT.md`](../../../docs/jira/IMPLEMENTATION-BLUEPRINT.md) — code-by-code reusable architecture
- [`docs/jira-bulk-test-case-import.md`](../../../docs/jira-bulk-test-case-import.md) — bulk import details
- [`docs/jira-test-case-integration.md`](../../../docs/jira-test-case-integration.md) — execution integration details
- [`config/jira.env.example`](../../../config/jira.env.example) — safe variable template

## Common failures

| Problem | Meaning or action |
|---|---|
| HTTP 401 | Email/token is invalid, expired, or belongs to a different Atlassian account |
| HTTP 403 | Account is authenticated but lacks Jira/project permission |
| No boards returned | Use the known board directly: `sprints 35`, and verify Jira Software permission |
| `jq: command not found` | Install `jq`; the helper requires it for readable output |
| JSON gives `Permission denied` | Use `jq . file.json`, `less file.json`, or `cat file.json` |
| Field update fails | Run `editmeta ISSUE_KEY` and verify field type plus allowed values |
