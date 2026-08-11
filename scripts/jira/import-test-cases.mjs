import fs from 'node:fs/promises';
import { Buffer } from 'node:buffer';
import path from 'node:path';
import process from 'node:process';
import ExcelJS from 'exceljs';
import dotenv from 'dotenv';
import { discoverTestCaseFiles } from './test-case-file-discovery.mjs';

const JIRA_PROJECT_ID = '10034';
const JIRA_ISSUE_TYPE_ID = '10192';
const FIELD_IDS = {
    testSteps: 'customfield_10281',
    expectedResult: 'customfield_10282',
    testData: 'customfield_10283',
    executionStatus: 'customfield_10284',
};
const NO_RUN_OPTION_ID = '10130';
const PRIORITY_IDS = {
    highest: '1',
    high: '2',
    medium: '3',
    low: '4',
    lowest: '5',
};
const DEFAULT_OUTPUT = 'test-results/jira-import-dry-run.json';
const DEFAULT_COMMIT_OUTPUT = 'test-results/jira-import-commit-result.json';
const COMMIT_CONFIRMATION = 'CREATE_EVR_JIRA_TESTS';
const JIRA_ISSUE_KEY_PATTERN = /^[A-Z][A-Z0-9]+-\d+$/;
const QALITY_TEST_LINK_TYPE_ID = '10071';

function printHelp() {
    process.stdout.write(`
Jira test-case importer (safe dry run by default)

Usage:
  npm run jira:import -- --all
  npm run jira:import -- --file resources/facility_test_cases.xlsx
  npm run jira:import -- --all --output test-results/my-preview.json
  JIRA_IMPORT_ENABLED=true npm run jira:import -- --all --commit --confirm ${COMMIT_CONFIRMATION}

Options:
  --all             Read every .xlsx workbook under resources/
  --file <path>     Read one workbook
  --output <path>   Write preview JSON to a custom local path
  --dry-run         Generate local payloads only (default)
  --commit          Search duplicates, create missing Jira tests, and save mappings
  --confirm <text>  Required with --commit; must equal ${COMMIT_CONFIRMATION}
  --help            Show this message
\n`);
}

function parseArguments(argv) {
    const options = {
        all: false,
        files: [],
        output: undefined,
        commit: false,
        confirmation: undefined,
    };

    for (let index = 0; index < argv.length; index += 1) {
        const argument = argv[index];
        if (argument === '--all') options.all = true;
        else if (argument === '--dry-run') options.commit = false;
        else if (argument === '--commit') options.commit = true;
        else if (argument === '--confirm') {
            const confirmation = argv[index + 1];
            if (!confirmation) throw new Error('--confirm requires a value.');
            options.confirmation = confirmation;
            index += 1;
        } else if (argument === '--file') {
            const file = argv[index + 1];
            if (!file) throw new Error('--file requires a path.');
            options.files.push(file);
            index += 1;
        } else if (argument === '--output') {
            const output = argv[index + 1];
            if (!output) throw new Error('--output requires a path.');
            options.output = output;
            index += 1;
        } else if (argument === '--help' || argument === '-h') {
            printHelp();
            process.exit(0);
        } else {
            throw new Error(`Unknown argument: ${argument}`);
        }
    }

    if (!options.all && options.files.length === 0) {
        throw new Error('Choose --all or provide at least one --file path.');
    }
    if (options.commit && options.confirmation !== COMMIT_CONFIRMATION) {
        throw new Error(`Commit mode requires --confirm ${COMMIT_CONFIRMATION}.`);
    }
    options.output ??= options.commit ? DEFAULT_COMMIT_OUTPUT : DEFAULT_OUTPUT;
    return options;
}

async function resolveWorkbookPaths(options) {
    const files = [...options.files];
    if (options.all) {
        const resourceFiles = await fs.readdir('resources');
        files.push(
            ...resourceFiles
                .filter((file) => file.toLowerCase().endsWith('.xlsx'))
                .map((file) => path.join('resources', file)),
        );
    }
    return [...new Set(files.map((file) => path.resolve(file)))].sort();
}

function cellText(row, columnNumber) {
    return row.getCell(columnNumber).text.trim();
}

function normalizeHeader(value) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ');
}

function readWorksheetRows(worksheet, workbookPath) {
    const headerMap = new Map();
    worksheet.getRow(1).eachCell((cell, columnNumber) => {
        headerMap.set(normalizeHeader(cell.text), columnNumber);
    });

    const read = (row, name) => {
        const column = headerMap.get(normalizeHeader(name));
        return column ? cellText(row, column) : '';
    };
    const rows = [];

    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const testCaseId = read(row, 'Test Case ID');
        const title = read(row, 'Test Case Title');
        if (!testCaseId && !title) return;

        rows.push({
            workbook: path.basename(workbookPath),
            sheet: worksheet.name,
            rowNumber,
            testCaseId,
            feature: read(row, 'Feature'),
            title,
            objective: read(row, 'Scenario/Objective'),
            sourceStatus: read(row, 'Status'),
            executionDate: read(row, 'Execution Date'),
            endpoint: read(row, 'Endpoint'),
            method: read(row, 'Method'),
            testType: read(row, 'Test Type'),
            priority: read(row, 'Priority'),
            automationFeasible: read(row, 'Automation Feasible'),
            prerequisite: read(row, 'Pre-Requisite'),
            testSteps: read(row, 'Test Steps'),
            testData: read(row, 'Test Data') || read(row, 'Request Data'),
            expectedResult: read(row, 'Expected Result') || read(row, 'Expected Response'),
            expectedStatusCode: read(row, 'Expected Status Code'),
            reviewedBy: read(row, 'Reviewed By'),
            automationStatus: read(row, 'Automation Status'),
            remarks: read(row, 'Remarks'),
            linkableStory: read(row, 'Linkable Story'),
            sprintId: read(row, 'Sprint ID'),
            jiraKey: read(row, 'Jira Key').toUpperCase(),
            automationTestFile: read(row, 'Automation Test File'),
        });
    });
    return rows;
}

async function readWorkbook(workbookPath) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(workbookPath);
    return workbook.worksheets.flatMap((worksheet) => readWorksheetRows(worksheet, workbookPath));
}

function toAdf(sections) {
    const content = [];
    for (const [heading, value] of sections) {
        if (!value) continue;
        content.push({
            type: 'paragraph',
            content: [{ type: 'text', text: heading, marks: [{ type: 'strong' }] }],
        });
        for (const line of String(value).split(/\r?\n/)) {
            content.push({
                type: 'paragraph',
                content: [{ type: 'text', text: line || ' ' }],
            });
        }
    }
    return { type: 'doc', version: 1, content };
}

function toLabel(value) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 255);
}

function resolvePriority(value, warnings) {
    if (!value) {
        warnings.push('Priority is empty; defaulted to Medium.');
        return PRIORITY_IDS.medium;
    }
    const priorityId = PRIORITY_IDS[value.trim().toLowerCase()];
    if (!priorityId) {
        warnings.push(`Unknown priority "${value}"; defaulted to Medium.`);
        return PRIORITY_IDS.medium;
    }
    return priorityId;
}

function inferTestType(row) {
    if (row.testType) return row.testType;
    if (/api/i.test(row.workbook) || /api/i.test(row.feature)) return 'API';
    return 'UI';
}

function buildPreview(row) {
    const errors = [];
    const warnings = [];
    if (!row.testCaseId) errors.push('Test Case ID is required.');
    if (!row.title) errors.push('Test Case Title is required.');
    if (!row.objective) warnings.push('Scenario/Objective is empty.');
    if (!row.testSteps) warnings.push('Test Steps is empty; field omitted.');
    if (!row.expectedResult) warnings.push('Expected Result is empty; field omitted.');
    if (!row.testData) warnings.push('Test Data is empty; field omitted.');
    const linkableStories = row.linkableStory
        .split(',')
        .map((key) => key.trim().toUpperCase())
        .filter(Boolean);
    for (const storyKey of linkableStories) {
        if (!JIRA_ISSUE_KEY_PATTERN.test(storyKey)) {
            errors.push(`Invalid Linkable Story Jira key: ${storyKey}`);
        }
    }
    const sprintId = row.sprintId.trim();
    if (sprintId && (!/^\d+$/.test(sprintId) || Number(sprintId) < 1)) {
        errors.push(`Invalid Sprint ID: ${sprintId}. Use a positive numeric Jira Sprint ID.`);
    }

    const testType = inferTestType(row);
    const sourceIdLabel = toLabel(`automation-id-${row.testCaseId}`);
    const fields = {
        project: { id: JIRA_PROJECT_ID },
        issuetype: { id: JIRA_ISSUE_TYPE_ID },
        summary: `[${row.testCaseId}] ${row.title}`.slice(0, 255),
        description: toAdf([
            ['Objective', row.objective],
            ['Source Test Case ID', row.testCaseId],
            ['Feature', row.feature],
            ['Test Type', testType],
            ['Pre-Requisite', row.prerequisite],
            ['Endpoint', row.endpoint],
            ['Method', row.method],
            ['Expected Status Code', row.expectedStatusCode],
            ['Automation Feasible', row.automationFeasible],
            ['Automation Status', row.automationStatus],
            ['Reviewed By', row.reviewedBy],
            ['Remarks', row.remarks],
        ]),
        priority: { id: resolvePriority(row.priority, warnings) },
        [FIELD_IDS.executionStatus]: [{ id: NO_RUN_OPTION_ID }],
        labels: [
            'automation',
            'playwright',
            toLabel(row.feature || 'unclassified'),
            toLabel(testType),
            sourceIdLabel,
        ].filter(Boolean),
    };

    if (row.testSteps) fields[FIELD_IDS.testSteps] = toAdf([['Test Steps', row.testSteps]]);
    if (row.expectedResult) {
        fields[FIELD_IDS.expectedResult] = toAdf([
            ['Expected Result', row.expectedResult],
            ['Expected Status Code', row.expectedStatusCode],
        ]);
    }
    if (row.testData) fields[FIELD_IDS.testData] = toAdf([['Test Data', row.testData]]);

    return {
        source: {
            workbook: row.workbook,
            sheet: row.sheet,
            rowNumber: row.rowNumber,
            testCaseId: row.testCaseId,
            previousExecutionStatus: row.sourceStatus || null,
            previousExecutionDate: row.executionDate || null,
            existingJiraKey: row.jiraKey || null,
            automationTestFile: row.automationTestFile || null,
            linkableStories,
            sprintId: sprintId || null,
        },
        duplicateLookup: {
            label: sourceIdLabel,
            jql: `project = EVR AND labels = "${sourceIdLabel}"`,
        },
        validation: { valid: errors.length === 0, errors, warnings },
        jiraCreatePayload: { fields },
    };
}

function markDuplicateSourceIds(previews) {
    const counts = new Map();
    for (const preview of previews) {
        const id = preview.source.testCaseId.toUpperCase();
        if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    for (const preview of previews) {
        const id = preview.source.testCaseId.toUpperCase();
        if (id && counts.get(id) > 1) {
            preview.validation.valid = false;
            preview.validation.errors.push(`Duplicate Test Case ID found in input: ${id}`);
        }
    }
}

function findColumn(worksheet, heading) {
    const expected = normalizeHeader(heading);
    let result;
    worksheet.getRow(1).eachCell((cell, columnNumber) => {
        if (normalizeHeader(cell.text) === expected) result = columnNumber;
    });
    return result;
}

function ensureColumn(worksheet, heading) {
    const existing = findColumn(worksheet, heading);
    if (existing) return existing;
    const columnNumber = worksheet.columnCount + 1;
    worksheet.getCell(1, columnNumber).value = heading;
    worksheet.getColumn(columnNumber).width = heading === 'Automation Test File' ? 52 : 16;
    return columnNumber;
}

function loadCommitConfiguration() {
    const environment = process.env.TEST_ENV || 'qa';
    dotenv.config({
        path: path.resolve('config/environments', `${environment}.env`),
        quiet: true,
    });
    if (process.env.JIRA_IMPORT_ENABLED?.trim().toLowerCase() !== 'true') {
        throw new Error('Commit mode is disabled. Set JIRA_IMPORT_ENABLED=true locally.');
    }
    const required = ['JIRA_BASE_URL', 'JIRA_EMAIL', 'JIRA_API_TOKEN'];
    const missing = required.filter((name) => !process.env[name]?.trim());
    if (missing.length) throw new Error(`Missing Jira configuration: ${missing.join(', ')}`);
    return {
        baseUrl: process.env.JIRA_BASE_URL.replace(/\/$/, ''),
        authorization: `Basic ${Buffer.from(
            `${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`,
        ).toString('base64')}`,
        linkStoriesEnabled: process.env.JIRA_LINK_STORIES_ENABLED?.trim().toLowerCase() === 'true',
        storyLinkTypeId: process.env.JIRA_STORY_LINK_TYPE_ID?.trim() || QALITY_TEST_LINK_TYPE_ID,
        assignSprintsEnabled:
            process.env.JIRA_ASSIGN_SPRINTS_ENABLED?.trim().toLowerCase() === 'true',
    };
}

async function jiraRequest(configuration, resource, init = {}) {
    const response = await globalThis.fetch(`${configuration.baseUrl}${resource}`, {
        ...init,
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: configuration.authorization,
            ...init.headers,
        },
    });
    const text = await response.text();
    let body;
    try {
        body = text ? JSON.parse(text) : {};
    } catch {
        body = { message: text.slice(0, 1000) };
    }
    if (!response.ok) {
        throw new Error(
            `Jira API ${response.status} ${response.statusText}: ${JSON.stringify(body).slice(0, 2000)}`,
        );
    }
    return body;
}

async function findIssuesByLabel(configuration, jql) {
    const result = await jiraRequest(configuration, '/rest/api/3/search/jql', {
        method: 'POST',
        body: JSON.stringify({ jql, fields: ['key', 'summary'], maxResults: 2 }),
    });
    return Array.isArray(result.issues) ? result.issues : [];
}

async function getIssueLinks(configuration, issueKey) {
    const issue = await jiraRequest(
        configuration,
        `/rest/api/3/issue/${encodeURIComponent(issueKey)}?fields=issuelinks`,
    );
    return Array.isArray(issue.fields?.issuelinks) ? issue.fields.issuelinks : [];
}

function hasIssueLink(issueLinks, linkedIssueKey, linkTypeId) {
    return issueLinks.some(
        (link) =>
            String(link.type?.id) === String(linkTypeId) &&
            [link.inwardIssue?.key, link.outwardIssue?.key]
                .filter(Boolean)
                .some((key) => key.toUpperCase() === linkedIssueKey),
    );
}

async function validateLinkableStories(configuration, previews) {
    if (!configuration.linkStoriesEnabled) return;
    const linkType = await jiraRequest(
        configuration,
        `/rest/api/3/issueLinkType/${encodeURIComponent(configuration.storyLinkTypeId)}`,
    );
    if (linkType.name !== 'QAlity Test') {
        throw new Error(
            `Jira link type ${configuration.storyLinkTypeId} is "${linkType.name}", expected "QAlity Test".`,
        );
    }
    const storyKeys = [...new Set(previews.flatMap((preview) => preview.source.linkableStories))];
    for (const storyKey of storyKeys) {
        await jiraRequest(
            configuration,
            `/rest/api/3/issue/${encodeURIComponent(storyKey)}?fields=key`,
        );
    }
}

async function linkTestsToStories(configuration, previews, resolvedKeys) {
    const linkOperations = [];
    if (!configuration.linkStoriesEnabled) return linkOperations;

    for (const preview of previews) {
        const testCaseId = preview.source.testCaseId.toUpperCase();
        const testIssueKey = resolvedKeys.get(testCaseId);
        if (!testIssueKey) continue;

        let issueLinks = await getIssueLinks(configuration, testIssueKey);
        for (const storyKey of preview.source.linkableStories) {
            if (hasIssueLink(issueLinks, storyKey, configuration.storyLinkTypeId)) {
                linkOperations.push({
                    testCaseId,
                    testIssueKey,
                    storyKey,
                    action: 'link-already-exists',
                });
                continue;
            }

            await jiraRequest(configuration, '/rest/api/3/issueLink', {
                method: 'POST',
                body: JSON.stringify({
                    type: { id: configuration.storyLinkTypeId },
                    outwardIssue: { key: testIssueKey },
                    inwardIssue: { key: storyKey },
                }),
            });
            linkOperations.push({
                testCaseId,
                testIssueKey,
                storyKey,
                action: 'linked',
            });
            issueLinks = [
                ...issueLinks,
                {
                    type: { id: configuration.storyLinkTypeId },
                    inwardIssue: { key: storyKey },
                },
            ];
        }
    }
    return linkOperations;
}

async function validateSprints(configuration, previews) {
    const sprintDetails = new Map();
    if (!configuration.assignSprintsEnabled) return sprintDetails;

    const sprintIds = [
        ...new Set(previews.map((preview) => preview.source.sprintId).filter(Boolean)),
    ];
    for (const sprintId of sprintIds) {
        const sprint = await jiraRequest(
            configuration,
            `/rest/agile/1.0/sprint/${encodeURIComponent(sprintId)}`,
        );
        if (sprint.state?.toLowerCase() === 'closed') {
            throw new Error(
                `Sprint ${sprintId} (${sprint.name}) is closed and cannot receive tests.`,
            );
        }
        sprintDetails.set(String(sprintId), {
            id: sprint.id,
            name: sprint.name,
            state: sprint.state,
            originBoardId: sprint.originBoardId,
        });
    }
    return sprintDetails;
}

async function assignTestsToSprints(configuration, previews, resolvedKeys, sprintDetails) {
    const sprintOperations = [];
    if (!configuration.assignSprintsEnabled) return sprintOperations;

    const issueKeysBySprint = new Map();
    for (const preview of previews) {
        const sprintId = preview.source.sprintId;
        if (!sprintId) continue;
        const testCaseId = preview.source.testCaseId.toUpperCase();
        const issueKey = resolvedKeys.get(testCaseId);
        if (!issueKey) continue;
        const issueKeys = issueKeysBySprint.get(sprintId) ?? [];
        if (!issueKeys.includes(issueKey)) issueKeys.push(issueKey);
        issueKeysBySprint.set(sprintId, issueKeys);
    }

    for (const [sprintId, issueKeys] of issueKeysBySprint) {
        for (const issueBatch of batches(issueKeys, 50)) {
            await jiraRequest(
                configuration,
                `/rest/agile/1.0/sprint/${encodeURIComponent(sprintId)}/issue`,
                {
                    method: 'POST',
                    body: JSON.stringify({ issues: issueBatch }),
                },
            );
            const sprint = sprintDetails.get(sprintId);
            sprintOperations.push({
                sprintId: Number(sprintId),
                sprintName: sprint?.name ?? null,
                sprintState: sprint?.state ?? null,
                issueKeys: issueBatch,
                action: 'assigned',
            });
        }
    }
    return sprintOperations;
}

function batches(values, size) {
    const result = [];
    for (let index = 0; index < values.length; index += size) {
        result.push(values.slice(index, index + size));
    }
    return result;
}

async function readExistingMapping() {
    try {
        return JSON.parse(
            await fs.readFile(path.resolve('resources/jira-test-case-map.json'), 'utf8'),
        );
    } catch (error) {
        if (error?.code === 'ENOENT') return {};
        throw error;
    }
}

async function persistMappings(workbookPaths, resolvedKeys, discoveredTestFiles) {
    const existingMapping = await readExistingMapping();
    const nextMapping = { ...existingMapping };

    for (const workbookPath of workbookPaths) {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(workbookPath);
        for (const worksheet of workbook.worksheets) {
            const idColumn = findColumn(worksheet, 'Test Case ID');
            if (!idColumn) continue;
            const jiraColumn = ensureColumn(worksheet, 'Jira Key');
            const testFileColumn = ensureColumn(worksheet, 'Automation Test File');
            const sprintColumn = ensureColumn(worksheet, 'Sprint ID');
            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return;
                const id = cellText(row, idColumn).toUpperCase();
                if (!id) return;
                const jiraKey = resolvedKeys.get(id) || cellText(row, jiraColumn) || null;
                const testFile =
                    discoveredTestFiles.get(id) ||
                    cellText(row, testFileColumn) ||
                    nextMapping[id]?.testFile ||
                    null;
                const sprintId = cellText(row, sprintColumn) || nextMapping[id]?.sprintId || null;
                row.getCell(jiraColumn).value = jiraKey;
                row.getCell(testFileColumn).value = testFile;
                nextMapping[id] = {
                    jiraKey,
                    testFile,
                    sprintId,
                    workbook: path.relative(process.cwd(), workbookPath),
                    sheet: worksheet.name,
                };
            });
        }
        await workbook.xlsx.writeFile(workbookPath);
    }

    const sorted = Object.fromEntries(
        Object.entries(nextMapping).sort(([left], [right]) => left.localeCompare(right)),
    );
    await fs.writeFile(
        path.resolve('resources/jira-test-case-map.json'),
        `${JSON.stringify(sorted, null, 2)}\n`,
        'utf8',
    );
}

async function writeReport(outputPath, report) {
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

async function commitImport(previews, workbookPaths, outputPath, discoveredTestFiles) {
    const invalid = previews.filter((preview) => !preview.validation.valid);
    if (invalid.length) {
        throw new Error(`Commit stopped before contacting Jira: ${invalid.length} invalid row(s).`);
    }
    const configuration = loadCommitConfiguration();
    const resolvedKeys = new Map();
    const operations = [];
    let linkOperations = [];
    let sprintOperations = [];
    const missing = [];

    await validateLinkableStories(configuration, previews);
    const sprintDetails = await validateSprints(configuration, previews);

    for (const preview of previews) {
        const id = preview.source.testCaseId.toUpperCase();
        if (preview.source.existingJiraKey) {
            resolvedKeys.set(id, preview.source.existingJiraKey);
            operations.push({
                testCaseId: id,
                action: 'kept-excel-key',
                jiraKey: preview.source.existingJiraKey,
            });
            continue;
        }
        const matches = await findIssuesByLabel(configuration, preview.duplicateLookup.jql);
        if (matches.length > 1) {
            throw new Error(
                `Commit stopped: label ${preview.duplicateLookup.label} matched multiple Jira issues.`,
            );
        }
        if (matches.length === 1) {
            resolvedKeys.set(id, matches[0].key);
            operations.push({
                testCaseId: id,
                action: 'reused-jira-match',
                jiraKey: matches[0].key,
            });
        } else {
            missing.push(preview);
        }
    }

    let jiraWritesPerformed = false;
    try {
        for (const batch of batches(missing, 50)) {
            jiraWritesPerformed = true;
            const result = await jiraRequest(configuration, '/rest/api/3/issue/bulk', {
                method: 'POST',
                body: JSON.stringify({ issueUpdates: batch.map((item) => item.jiraCreatePayload) }),
            });
            if (
                result.errors?.length ||
                !Array.isArray(result.issues) ||
                result.issues.length !== batch.length
            ) {
                throw new Error(
                    `Unexpected Jira bulk-create response: ${JSON.stringify(result).slice(0, 2000)}`,
                );
            }
            result.issues.forEach((issue, index) => {
                const id = batch[index].source.testCaseId.toUpperCase();
                resolvedKeys.set(id, issue.key);
                operations.push({ testCaseId: id, action: 'created', jiraKey: issue.key });
            });
        }
        await persistMappings(workbookPaths, resolvedKeys, discoveredTestFiles);
        linkOperations = await linkTestsToStories(configuration, previews, resolvedKeys);
        if (linkOperations.some((item) => item.action === 'linked')) {
            jiraWritesPerformed = true;
        }
        sprintOperations = await assignTestsToSprints(
            configuration,
            previews,
            resolvedKeys,
            sprintDetails,
        );
        if (sprintOperations.length > 0) jiraWritesPerformed = true;
    } catch (error) {
        await writeReport(outputPath, {
            mode: 'commit',
            generatedAt: new Date().toISOString(),
            jiraWritesPerformed,
            completed: false,
            operations,
            linkOperations,
            sprintOperations,
            error: error instanceof Error ? error.message : String(error),
        });
        throw error;
    }

    const report = {
        mode: 'commit',
        generatedAt: new Date().toISOString(),
        jiraWritesPerformed,
        completed: true,
        summary: {
            totalRows: previews.length,
            created: operations.filter((item) => item.action === 'created').length,
            reused: operations.filter((item) => item.action === 'reused-jira-match').length,
            existingExcelKeys: operations.filter((item) => item.action === 'kept-excel-key').length,
            storyLinksCreated: linkOperations.filter((item) => item.action === 'linked').length,
            storyLinksAlreadyPresent: linkOperations.filter(
                (item) => item.action === 'link-already-exists',
            ).length,
            sprintAssignments: sprintOperations.reduce(
                (count, item) => count + item.issueKeys.length,
                0,
            ),
        },
        operations,
        linkOperations,
        sprintOperations,
    };
    await writeReport(outputPath, report);
    return report;
}

async function main() {
    const options = parseArguments(process.argv.slice(2));
    const workbookPaths = await resolveWorkbookPaths(options);
    if (workbookPaths.length === 0) throw new Error('No Excel workbooks were found.');

    const rows = (
        await Promise.all(workbookPaths.map((workbookPath) => readWorkbook(workbookPath)))
    ).flat();
    const discoveredTestFiles = await discoverTestCaseFiles();
    for (const row of rows) {
        row.automationTestFile =
            discoveredTestFiles.get(row.testCaseId.toUpperCase()) || row.automationTestFile;
    }
    const previews = rows.map(buildPreview);
    markDuplicateSourceIds(previews);

    const outputPath = path.resolve(options.output);
    if (options.commit) {
        const report = await commitImport(previews, workbookPaths, outputPath, discoveredTestFiles);
        process.stdout.write(
            `Jira import completed: ${report.summary.created} created, ` +
                `${report.summary.reused} reused, ` +
                `${report.summary.storyLinksCreated} story link(s) created.\n` +
                `${report.summary.sprintAssignments} Sprint assignment(s) completed.\n` +
                `Result: ${path.relative(process.cwd(), outputPath)}\n`,
        );
        return;
    }

    const valid = previews.filter((preview) => preview.validation.valid).length;
    const report = {
        mode: 'dry-run',
        generatedAt: new Date().toISOString(),
        jiraWritesPerformed: false,
        configuration: {
            projectId: JIRA_PROJECT_ID,
            projectKey: 'EVR',
            issueTypeId: JIRA_ISSUE_TYPE_ID,
            issueTypeName: 'QAlity Test',
            initialExecutionStatus: { id: NO_RUN_OPTION_ID, value: 'No Run' },
            storyLinkType: {
                id: QALITY_TEST_LINK_TYPE_ID,
                name: 'QAlity Test',
                direction: 'QAlity Test tests Linkable Story',
            },
            sprintAssignment: {
                sourceColumn: 'Sprint ID',
                enabledOnlyWhen: 'JIRA_ASSIGN_SPRINTS_ENABLED=true',
            },
        },
        summary: {
            workbooks: workbookPaths.map((file) => path.relative(process.cwd(), file)),
            totalRows: previews.length,
            validRows: valid,
            invalidRows: previews.length - valid,
            warningCount: previews.reduce(
                (count, preview) => count + preview.validation.warnings.length,
                0,
            ),
        },
        bulkCreatePreview: {
            issueUpdates: previews
                .filter((preview) => preview.validation.valid)
                .map((preview) => preview.jiraCreatePayload),
        },
        testCases: previews,
    };

    await writeReport(outputPath, report);

    process.stdout.write(
        [
            'Jira import dry run completed. No Jira API calls were made.',
            `Workbooks: ${report.summary.workbooks.length}`,
            `Rows: ${report.summary.totalRows}`,
            `Valid: ${report.summary.validRows}`,
            `Invalid: ${report.summary.invalidRows}`,
            `Warnings: ${report.summary.warningCount}`,
            `Preview: ${path.relative(process.cwd(), outputPath)}`,
            '',
        ].join('\n'),
    );

    if (report.summary.invalidRows > 0) process.exitCode = 2;
}

main().catch((error) => {
    process.stderr.write(`Jira import failed: ${error instanceof Error ? error.message : error}\n`);
    process.exitCode = 1;
});
