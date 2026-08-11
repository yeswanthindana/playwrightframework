# Jira Bulk Test Case Import

The Excel-to-Jira importer is a two-stage tool. Dry run is the default and makes no Jira calls. Commit mode is deliberately locked behind three controls and creates only missing tests.

## Step 1: Draft test cases in an Excel template

Use an existing workbook under `resources/` as the template. Give every row a permanent, unique Test Case ID, for example `TC-EVENT-001`.

Complete these columns as clearly as possible:

- `Test Case ID` — required and unique;
- `Test Case Title` — required;
- `Scenario/Objective`;
- `Pre-Requisite`;
- `Test Steps`;
- `Test Data` or `Request Data`;
- `Expected Result` or `Expected Response`;
- `Priority`;
- `Automation Test File` when automation exists;
- `Jira Key` — leave empty for a new test case.

Do not invent a Jira key. Commit mode fills it after Jira returns the real key.

## Step 2: Review the spreadsheet manually

Before running a command, a reviewer should confirm:

- the Test Case ID is unique and will not be renamed later;
- the title describes one clear behavior;
- steps are understandable to another engineer;
- test data is safe and contains no passwords or tokens;
- the expected result is measurable;
- the priority is Highest, High, Medium, Low, or Lowest;
- the automation file points to the correct test, if one exists.

## Step 3: Dry run and correct the report

## Preview every workbook

```bash
npm run jira:import -- --all --dry-run
```

The preview is written to:

```text
test-results/jira-import-dry-run.json
```

## Preview one workbook

```bash
npm run jira:import -- \
  --file resources/facility_test_cases.xlsx \
  --dry-run
```

Use this first when developing a new module because it limits the report to one workbook.

Use a custom output file when comparing previews:

```bash
npm run jira:import -- \
  --file resources/api_facility_test_cases.xlsx \
  --output test-results/api-facility-jira-preview.json
```

Open `test-results/jira-import-dry-run.json` and inspect `summary` and `testCases`:

- `validation.valid: false` means the row has an error and must be corrected;
- `validation.errors` explains blocking problems, such as a missing ID/title or duplicate ID;
- `validation.warnings` identifies incomplete optional data;
- `jiraCreatePayload` shows exactly what would be sent later;
- `jiraWritesPerformed: false` proves this run did not create Jira issues.

The importer treats Test Case ID and Test Case Title as required. Other missing fields currently produce warnings and are omitted from the Jira payload. Therefore, dry run validates the supported structure, but manual review is still required for test quality.

After one workbook is clean, validate every workbook:

```bash
npm run jira:import -- --all --dry-run
```

## Safety behavior

- `--dry-run` is optional because it is the default.
- Commit requires `--commit`, the exact confirmation phrase, and `JIRA_IMPORT_ENABLED=true`.
- Credentials are read only in commit mode from `config/environments/<TEST_ENV>.env` or shell variables.
- Invalid input stops before Jira is contacted.
- Existing Excel Jira keys are kept. Empty keys are searched by the unique automation label before creation.
- Multiple matches stop the import; zero matches are created in batches of at most 50.
- Output remains under the Git-ignored `test-results/` folder by default.

## Step 4: Commit after reviewing the preview

In your ignored local environment file, temporarily set:

```dotenv
JIRA_IMPORT_ENABLED=true
```

Then run the explicit commit command:

```bash
TEST_ENV=qa npm run jira:import -- --all --commit --confirm CREATE_EVR_JIRA_TESTS
```

Commit mode writes returned or reused Jira keys into each workbook by `Test Case ID`, updates `resources/jira-test-case-map.json`, and records an audit result in `test-results/jira-import-commit-result.json`. Set `JIRA_IMPORT_ENABLED=false` again after use.

### Optionally link each Jira test to its Story

Enter the Story key in the Excel `Linkable Story` column:

```text
Test Case ID:   TC-LOC-001
Linkable Story: EVR-1135
Jira Key:       EVR-1146
```

Multiple Stories may be comma-separated:

```text
EVR-1135, EVR-1200
```

The dry run validates the Jira-key format and includes the Story keys in each test case's preview. It still performs no Jira calls.

Story linking is independently disabled by default. To enable it for the approved commit run, set these values in the ignored local environment file:

```dotenv
JIRA_IMPORT_ENABLED=true
JIRA_LINK_STORIES_ENABLED=true
JIRA_STORY_LINK_TYPE_ID=10071
```

Link type `10071` is the configured `QAlity Test` relationship. The importer creates this direction:

```text
QAlity Test EVR-1146 tests Story EVR-1135
Story EVR-1135 is tested by QAlity Test EVR-1146
```

Before creating tests, commit mode verifies the link type and every populated Story key. After resolving the Jira test key, it checks existing issue links and creates only a missing relationship. Empty `Linkable Story` cells are ignored. Link actions are recorded under `linkOperations` in `test-results/jira-import-commit-result.json`.

After the manual run, turn both write switches off again:

```dotenv
JIRA_IMPORT_ENABLED=false
JIRA_LINK_STORIES_ENABLED=false
```

For every Excel row, commit mode does the following:

1. Keeps an already populated Excel Jira key.
2. If the key is empty, searches Jira using `automation-id-<test-case-id>`.
3. Reuses the Jira key when exactly one matching issue exists.
4. Stops for manual investigation when multiple issues match.
5. Creates a new QAlity Test when no match exists.
6. Writes the returned Jira key into the Excel `Jira Key` column.
7. Writes the same relationship into `resources/jira-test-case-map.json`.

Example result:

```text
Before: TC-EVENT-001 | Jira Key: empty
After:  TC-EVENT-001 | Jira Key: EVR-1234
JSON:   "TC-EVENT-001" -> "EVR-1234"
```

## Step 5: Link the Playwright test

Add the Test Case ID to the Playwright test title:

```ts
test('Create an event @Events @TC-EVENT-001', async ({ page }) => {
    // test steps
});
```

Do not add `EVR-1234` to the test. The stable Test Case ID is enough. The Jira reporter reads `resources/jira-test-case-map.json` when Playwright starts and resolves:

```text
Playwright title @TC-EVENT-001
              ↓
jira-test-case-map.json
              ↓
Jira issue EVR-1234
```

The `Automation Test File` Excel column is documentation and traceability. The reporter's actual runtime lookup is based on the Test Case ID in the Playwright title and the Jira key in the JSON map.

If the Test Case ID is absent from the title, or its JSON entry has `jiraKey: null`, the reporter skips Jira and logs `no Jira key found`.

## Step 6: Execute and update Jira

Leave result synchronization off for normal local runs:

```bash
TEST_ENV=qa npx playwright test tests/ui/events/createEvent.spec.ts
```

Enable it for a deliberate Jira-updating run:

```bash
TEST_ENV=qa JIRA_ENABLED=true npx playwright test tests/ui/events/createEvent.spec.ts
```

During that run, no Excel parsing or Jira-key import occurs. The already-generated JSON file is loaded automatically by `JiraReporter`. After the test ends, the reporter updates the mapped Jira issue with execution status and configured evidence.

You need a manual change only once for a new automated test: add its Test Case ID to the test title. You do not manually copy the Jira key into the test code after a successful commit import.

## Validation and mapping

The importer requires a Test Case ID and title. Missing optional Excel data is reported as a warning and the corresponding Jira field is omitted rather than fabricated.

Each valid row is mapped to project `EVR` (`10034`) and issue type `QAlity Test` (`10192`). Execution Status is initialized to `No Run` using option `10130`. Priorities use Jira IDs 1–5, with missing or unknown values defaulting to Medium and producing a warning.

Because no Automation Test Case ID field exists, the preview generates a unique label and duplicate-search JQL, for example:

```text
automation-id-tc-loc-001
project = EVR AND labels = "automation-id-tc-loc-001"
```

The generated JSON contains:

- summary counts and validation results;
- source workbook, sheet, and row for every test case;
- warnings and errors;
- duplicate lookup label and JQL;
- individual Jira create payloads;
- a Jira bulk-create preview containing valid payloads only;
- an explicit `jiraWritesPerformed: false` marker.

Review every payload before enabling commit mode. Commit mode creates real Jira issues and cannot be treated as a preview.

## Excel and automation mapping

Commit mode stores approved Jira keys automatically. For manually created Jira tests, put the key in the `Jira Key` column and run:

```bash
npm run jira:sync-map
```

The synchronizer matches rows by `Test Case ID`, never by row number. It maintains these Excel columns:

- `Jira Key`;
- `Automation Test File`.

It also regenerates the version-controlled `resources/jira-test-case-map.json`. Playwright tests continue to expose stable IDs such as `TC-LOC-001`; `JiraReporter` resolves the corresponding `EVR-####` key from this JSON file at runtime.

Currently, `TC-LOC-001` maps to the existing `EVR-1146`. Test cases without a Jira issue retain `jiraKey: null` and are skipped by Jira result synchronization.
