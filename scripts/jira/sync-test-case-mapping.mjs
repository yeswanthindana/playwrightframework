import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import ExcelJS from 'exceljs';
import { discoverTestCaseFiles } from './test-case-file-discovery.mjs';

const RESOURCES_DIRECTORY = path.resolve('resources');
const MAPPING_FILE = path.join(RESOURCES_DIRECTORY, 'jira-test-case-map.json');

const TEST_FILE_BY_ID = {
    'TC-LOC-001': 'tests/ui/facilities/createFacility.spec.ts',
    'TC-LOC-002': 'tests/ui/facilities/editFacility.spec.ts',
    'TC-LOC-003': 'tests/ui/facilities/editFacility.spec.ts',
    'TC-LOC-004': 'tests/ui/facilities/deleteFacility.spec.ts',
    'TC-LOC-API-001': 'tests/api/facilities/createFacility.spec.ts',
    'TC-LOC-API-002': 'tests/api/facilities/readFacility.spec.ts',
    'TC-LOC-API-003': 'tests/api/facilities/updateFacility.spec.ts',
    'TC-LOC-API-004': 'tests/api/facilities/deleteFacility.spec.ts',
    'TC-LOC-API-005': 'tests/api/facilities/facilityNegative.spec.ts',
    'TC-LOC-API-006': 'tests/api/facilities/facilityNegative.spec.ts',
    'TC-LOC-API-007': 'tests/api/facilities/facilityNegative.spec.ts',
    'TC-LOC-API-008': 'tests/api/facilities/facilityNegative.spec.ts',
    'TC-LOC-API-009': 'tests/api/facilities/facilityNegative.spec.ts',
};

const KNOWN_JIRA_KEYS = {
    'TC-LOC-001': 'EVR-1146',
};

function findColumn(worksheet, heading) {
    const expected = heading.trim().toLowerCase();
    let result;
    worksheet.getRow(1).eachCell((cell, columnNumber) => {
        if (cell.text.trim().toLowerCase() === expected) result = columnNumber;
    });
    return result;
}

function ensureColumn(worksheet, heading) {
    const existing = findColumn(worksheet, heading);
    if (existing) return existing;

    const columnNumber = worksheet.columnCount + 1;
    const headerCell = worksheet.getCell(1, columnNumber);
    const previousHeader = worksheet.getCell(1, Math.max(1, columnNumber - 1));
    headerCell.value = heading;
    headerCell.style = { ...previousHeader.style };
    worksheet.getColumn(columnNumber).width = heading === 'Automation Test File' ? 52 : 16;
    return columnNumber;
}

async function readExistingMapping() {
    try {
        return JSON.parse(await fs.readFile(MAPPING_FILE, 'utf8'));
    } catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
            return {};
        }
        throw error;
    }
}

async function synchronizeWorkbook(
    workbookPath,
    existingMapping,
    nextMapping,
    discoveredTestFiles,
) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(workbookPath);

    for (const worksheet of workbook.worksheets) {
        const testCaseIdColumn = findColumn(worksheet, 'Test Case ID');
        if (!testCaseIdColumn) continue;

        const jiraKeyColumn = ensureColumn(worksheet, 'Jira Key');
        const testFileColumn = ensureColumn(worksheet, 'Automation Test File');
        const sprintIdColumn = ensureColumn(worksheet, 'Sprint ID');

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;
            const testCaseId = row.getCell(testCaseIdColumn).text.trim().toUpperCase();
            if (!testCaseId) return;

            const existingEntry = existingMapping[testCaseId] ?? {};
            const jiraKey =
                row.getCell(jiraKeyColumn).text.trim().toUpperCase() ||
                existingEntry.jiraKey ||
                KNOWN_JIRA_KEYS[testCaseId] ||
                null;
            const testFile =
                discoveredTestFiles.get(testCaseId) ||
                row.getCell(testFileColumn).text.trim() ||
                existingEntry.testFile ||
                TEST_FILE_BY_ID[testCaseId] ||
                null;
            const sprintId =
                row.getCell(sprintIdColumn).text.trim() || existingEntry.sprintId || null;

            row.getCell(jiraKeyColumn).value = jiraKey;
            row.getCell(testFileColumn).value = testFile;
            nextMapping[testCaseId] = {
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

async function main() {
    const existingMapping = await readExistingMapping();
    const discoveredTestFiles = await discoverTestCaseFiles();
    const nextMapping = {};
    const resourceFiles = await fs.readdir(RESOURCES_DIRECTORY);
    const workbookPaths = resourceFiles
        .filter((file) => file.toLowerCase().endsWith('.xlsx'))
        .map((file) => path.join(RESOURCES_DIRECTORY, file))
        .sort();

    for (const workbookPath of workbookPaths) {
        await synchronizeWorkbook(workbookPath, existingMapping, nextMapping, discoveredTestFiles);
    }

    const sortedMapping = Object.fromEntries(
        Object.entries(nextMapping).sort(([left], [right]) => left.localeCompare(right)),
    );
    await fs.writeFile(MAPPING_FILE, `${JSON.stringify(sortedMapping, null, 2)}\n`, 'utf8');

    process.stdout.write(
        `Synchronized ${Object.keys(sortedMapping).length} test-case mapping(s).\n` +
            `Mapping file: ${path.relative(process.cwd(), MAPPING_FILE)}\n`,
    );
}

main().catch((error) => {
    process.stderr.write(
        `Unable to synchronize Jira test-case mappings: ` +
            `${error instanceof Error ? error.message : error}\n`,
    );
    process.exitCode = 1;
});
