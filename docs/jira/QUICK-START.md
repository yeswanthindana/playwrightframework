# Excel to Jira to Playwright — Simple Quick Start

This is the beginner-friendly workflow for creating Jira QAlity Tests from Excel, linking them to Stories, and sending Playwright results back to Jira.

```text
Draft Excel → Manual review → Dry run → Commit import
     → Jira key saved to Excel/JSON → Story linked
     → Test Case ID added to Playwright → Execute → Jira updated
```

The main rule is simple:

> Use a permanent Test Case ID such as `TC-LOC-001` in Excel and Playwright. Do not hard-code the Jira key in normal test code.

## 1. Prepare private configuration

Create your local environment file once:

```bash
cp config/environments/qa.env.example config/environments/qa.env
```

Enter credentials in `config/environments/qa.env`:

```dotenv
JIRA_BASE_URL=https://aether.atlassian.net
JIRA_EMAIL=your-atlassian-email@aether.com
JIRA_API_TOKEN=your-api-token

JIRA_ENABLED=false
JIRA_IMPORT_ENABLED=false
JIRA_LINK_STORIES_ENABLED=false
JIRA_STORY_LINK_TYPE_ID=10071
JIRA_ASSIGN_SPRINTS_ENABLED=false
```

The real `qa.env` is ignored by Git. Never store credentials in `.env.example` files.

| Switch | Purpose |
|---|---|
| `JIRA_IMPORT_ENABLED` | Allows creation/discovery of Jira QAlity Tests |
| `JIRA_LINK_STORIES_ENABLED` | Allows QAlity Tests to be linked to Excel Stories |
| `JIRA_ASSIGN_SPRINTS_ENABLED` | Allows resolved QAlity Tests to be assigned to numeric Excel Sprint IDs |
| `JIRA_ENABLED` | Allows Playwright results to update Jira |

## 2. Draft the Excel test case

Open the appropriate workbook, for example `resources/facility_test_cases.xlsx`, and add a row:

| Column | Example |
|---|---|
| Test Case ID | `TC-LOC-005` |
| Feature | `Facilities` |
| Test Case Title | `Search for a facility` |
| Scenario/Objective | `Verify an existing facility can be found` |
| Priority | `High` |
| Pre-Requisite | `An active facility exists` |
| Test Steps | `Open Facilities; enter a name; click Search` |
| Test Data | `Unique facility name` |
| Expected Result | `Matching facility appears` |
| Reviewed By | Your name |
| Linkable Story | `EVR-1135` |
| Sprint ID | Leave empty until the numeric Jira Sprint ID is known |
| Jira Key | Leave empty |
| Automation Test File | May be left empty when the Test Case ID already exists in a `.spec.ts` file |

Rules:

- Test Case ID must be unique and permanent.
- Leave Jira Key empty for a new test; do not invent one.
- Linkable Story must contain a real Story key.
- Multiple Stories may be comma-separated: `EVR-1135, EVR-1200`.
- Sprint ID is optional, but when provided it must be a positive number such as `418`.
- Multiple unique Test Case IDs may share the same `.spec.ts` file.
- Save and close Excel before running the importer.

The importer and `jira:sync-map` scan `tests/**/*.spec.ts`. When they find the Excel Test Case ID in a spec file, they automatically write that file path into the corresponding `Automation Test File` cell. For example:

```text
TC-LOC-005 ─┐
TC-LOC-006 ─┼─→ tests/ui/facilities/searchFacility.spec.ts
TC-LOC-007 ─┘
```

This is valid because the IDs are unique even though the file is shared. If the same Test Case ID appears in two different spec files, synchronization stops and reports the ambiguity.

## 3. Review the row manually

Confirm that the title is clear, steps are understandable, expected results are measurable, priority is valid, Story key is correct, and no password/token appears in test data.

Dry run checks structure. A person must still verify business correctness.

## 4. Dry-run one workbook

Start with only the new module workbook:

```bash
TEST_ENV=qa npm run jira:import -- \
  --file resources/facility_test_cases.xlsx \
  --dry-run
```

Dry run:

- reads and validates Excel;
- prepares the Jira payload;
- validates Test Case IDs and Linkable Story formats;
- does not contact Jira;
- does not create issues or links;
- does not write Jira keys into Excel.

The report is saved at `test-results/jira-import-dry-run.json`.

### Correctly open a JSON report

Do not type the filename alone. That asks Bash to execute JSON and causes `Permission denied`.

Use:

```bash
jq . test-results/jira-import-dry-run.json
```

Other choices:

```bash
cat test-results/jira-import-dry-run.json
less test-results/jira-import-dry-run.json
code test-results/jira-import-dry-run.json
```

Press `q` to exit `less`.

Show only the summary:

```bash
jq '.summary' test-results/jira-import-dry-run.json
```

Show blocking errors:

```bash
jq '.testCases[] | select(.validation.valid == false) | {
  source: .source,
  errors: .validation.errors
}' test-results/jira-import-dry-run.json
```

Show warnings:

```bash
jq '.testCases[] | select(.validation.warnings | length > 0) | {
  testCaseId: .source.testCaseId,
  warnings: .validation.warnings
}' test-results/jira-import-dry-run.json
```

Correct Excel until `invalidRows` is `0`. Review warnings even when they are not blocking.

## 5. Dry-run every workbook

After the single file is clean:

```bash
TEST_ENV=qa npm run jira:import -- --all --dry-run
```

This also detects duplicate Test Case IDs across selected workbooks.

## 6. Enable the approved import

In your ignored `qa.env`, temporarily set:

```dotenv
JIRA_IMPORT_ENABLED=true
JIRA_LINK_STORIES_ENABLED=true
JIRA_STORY_LINK_TYPE_ID=10071
JIRA_ASSIGN_SPRINTS_ENABLED=true
JIRA_ENABLED=false
```

Link type `10071` means:

```text
QAlity Test EVR-1146 tests Story EVR-1135
Story EVR-1135 is tested by QAlity Test EVR-1146
```

## 7. Perform the real import manually

Import one workbook:

```bash
TEST_ENV=qa npm run jira:import -- \
  --file resources/facility_test_cases.xlsx \
  --commit \
  --confirm CREATE_EVR_JIRA_TESTS
```

Or import all workbooks:

```bash
TEST_ENV=qa npm run jira:import -- \
  --all \
  --commit \
  --confirm CREATE_EVR_JIRA_TESTS
```

For each row, commit mode:

1. Keeps an existing Excel Jira key.
2. Otherwise searches Jira by the unique automation label.
3. Reuses exactly one matching QAlity Test.
4. Creates a QAlity Test when no match exists.
5. Stops if multiple matches exist.
6. Writes the resolved Jira key into Excel.
7. Writes the mapping into `resources/jira-test-case-map.json`.
8. Verifies populated Linkable Stories.
9. Skips an identical existing link.
10. Creates a missing QAlity Test-to-Story link.
11. Verifies each populated Sprint is accessible and not closed.
12. Groups resolved Jira tests by Sprint ID and assigns them in batches.

Example:

```text
Before: TC-LOC-005 → Jira Key empty → Story EVR-1135
After:  TC-LOC-005 → EVR-1234 → tests EVR-1135
```

## 8. Review the commit report

Open it correctly:

```bash
jq . test-results/jira-import-commit-result.json
```

Useful views:

```bash
jq '.summary' test-results/jira-import-commit-result.json
jq '.operations' test-results/jira-import-commit-result.json
jq '.linkOperations' test-results/jira-import-commit-result.json
jq '.sprintOperations' test-results/jira-import-commit-result.json
```

Confirm:

```json
{
  "mode": "commit",
  "completed": true,
  "jiraWritesPerformed": true
}
```

`operations` shows created/reused test keys. `linkOperations` shows `linked` or `link-already-exists`.
`sprintOperations` shows the Sprint name, state, ID, and assigned Jira test keys.

## 9. Verify Excel, JSON, and Jira

Reopen Excel and confirm:

| Test Case ID | Linkable Story | Jira Key |
|---|---|---|
| `TC-LOC-005` | `EVR-1135` | `EVR-1234` |

Check `resources/jira-test-case-map.json`:

```json
{
  "TC-LOC-005": {
    "jiraKey": "EVR-1234",
    "testFile": "tests/ui/facilities/searchFacility.spec.ts",
    "sprintId": "418",
    "workbook": "resources/facility_test_cases.xlsx",
    "sheet": "Facilities"
  }
}
```

Open the QAlity Test and verify its fields. Open the Story and verify it displays `is tested by EVR-1234`.

After successful commit import, `jira:sync-map` is not required. Use it only after manually changing Jira keys in Excel:

```bash
npm run jira:sync-map
```

## 10. Disable import again

Return these switches to false:

```dotenv
JIRA_IMPORT_ENABLED=false
JIRA_LINK_STORIES_ENABLED=false
JIRA_ASSIGN_SPRINTS_ENABLED=false
```

## 11. Add the Test Case ID to Playwright

Use only the stable Test Case ID in the title:

```ts
test('Search for a facility @Facility @TC-LOC-005', async ({ page }) => {
    // test implementation
});
```

Do not manually add `EVR-1234` to normal test code. Runtime lookup is automatic:

```text
Playwright title @TC-LOC-005
        ↓
jira-test-case-map.json
        ↓
Jira issue EVR-1234
```

The Automation Test File column is for traceability. The Test Case ID in the Playwright title activates the mapping.

## 12. Run Playwright safely with Jira off

```bash
TEST_ENV=qa JIRA_ENABLED=false \
npx playwright test tests/ui/facilities/searchFacility.spec.ts \
--grep "TC-LOC-005"
```

The test runs and local reports are generated, but Jira remains unchanged.

## 13. Run once with Jira on

After local verification:

```bash
TEST_ENV=qa JIRA_ENABLED=true \
npx playwright test tests/ui/facilities/searchFacility.spec.ts \
--grep "TC-LOC-005"
```

The reporter automatically resolves the Jira key, updates Execution Status, Executed By, and Environment, adds an execution comment, and uploads configured evidence.

Playwright does not read Excel during execution. It reads the generated JSON map.

## 14. Verify execution evidence

Open the mapped QAlity Test and confirm:

- Execution Status is Passed, Failed, or No Run;
- Executed By contains the authenticated Jira account;
- Environment is `qa`;
- the execution comment is present;
- the test log is attached;
- configured screenshot or video evidence is attached.

## 15. Finish with safe defaults

```dotenv
JIRA_ENABLED=false
JIRA_IMPORT_ENABLED=false
JIRA_LINK_STORIES_ENABLED=false
JIRA_STORY_LINK_TYPE_ID=10071
JIRA_ASSIGN_SPRINTS_ENABLED=false
```

## Quick command reference

```bash
# Dry-run one workbook
TEST_ENV=qa npm run jira:import -- --file resources/facility_test_cases.xlsx --dry-run

# Read dry-run summary
jq '.summary' test-results/jira-import-dry-run.json

# Dry-run all workbooks
TEST_ENV=qa npm run jira:import -- --all --dry-run

# Real approved import
TEST_ENV=qa npm run jira:import -- --all --commit --confirm CREATE_EVR_JIRA_TESTS

# Read commit results
jq '.summary' test-results/jira-import-commit-result.json
jq '.linkOperations' test-results/jira-import-commit-result.json

# Run a linked test without Jira updates
TEST_ENV=qa JIRA_ENABLED=false npx playwright test path/to/test.spec.ts --grep "TC-ID"

# Run a linked test and update Jira
TEST_ENV=qa JIRA_ENABLED=true npx playwright test path/to/test.spec.ts --grep "TC-ID"
```

For architecture, field configuration, troubleshooting, and security details, use the advanced [Jira integration guide](README.md).
