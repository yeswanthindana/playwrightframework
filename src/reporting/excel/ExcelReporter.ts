import { Reporter, TestCase, TestResult } from '@playwright/test/reporter';
import excelJs from 'exceljs';
import * as path from 'path';
import * as fs from 'fs';
import { Logger } from '@src/reporting/logging/Logger';

class ExcelReporter implements Reporter {
    // Promise chain lock to prevent concurrent file read/write operations
    private writeLock = Promise.resolve();

    async onTestEnd(test: TestCase, result: TestResult) {
        // Find Test Case ID from annotations or title matching TC-LOC-XXX
        let testCaseId = test.annotations.find(
            (ann) => ann.type === 'tms' || ann.type === 'test_case'
        )?.description;

        if (!testCaseId) {
            const match = test.title.match(/TC-LOC-API-\d+|TC-LOC-\d+/i);
            if (match) {
                testCaseId = match[0].toUpperCase();
            }
        }

        if (!testCaseId) {
            return;
        }

        const parts = testCaseId.split('-');
        let moduleName = 'facility';
        let isApi = false;

        if (parts.length >= 3) {
            isApi = parts.includes('API');
            const moduleCode = parts[1]?.toUpperCase();
            if (moduleCode === 'LOC') moduleName = 'facility';
            else if (moduleCode === 'ROLE') moduleName = 'profile';
            else if (moduleCode === 'COMPUTENODE') moduleName = 'computeNode';
            else if (moduleCode === 'EVENT') moduleName = 'event';
            else if (moduleCode) moduleName = moduleCode.toLowerCase();
        }

        const fileName = isApi ? `api_${moduleName}_test_cases.xlsx` : `${moduleName}_test_cases.xlsx`;
        const excelFilePath = path.join(process.cwd(), 'resources', fileName);

        // Queue the read-write operation on the promise chain lock
        this.writeLock = this.writeLock.then(async () => {
            Logger.info(`ExcelReporter: Updating test case ${testCaseId} with status ${result.status}`);

            if (!fs.existsSync(excelFilePath)) {
                Logger.error(`ExcelReporter: Excel file not found at ${excelFilePath}`);
                return;
            }

            try {
                const workbook = new excelJs.Workbook();
                await workbook.xlsx.readFile(excelFilePath);
                const worksheet = workbook.getWorksheet(1);
                if (!worksheet) {
                    Logger.error('ExcelReporter: Worksheet not found in the workbook.');
                    return;
                }

                let updated = false;
                const now = new Date();

                worksheet.eachRow((row, rowNumber) => {
                    const cellValue = row.getCell(1).value?.toString().trim();
                    if (cellValue === testCaseId) {
                        // Column 5 is Status, Column 6 is Execution Date
                        row.getCell(5).value = result.status === 'passed' ? 'Passed' : 'Failed';
                        const parts = new Intl.DateTimeFormat('en-GB', {
                            timeZone: 'Asia/Kolkata',
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: false,
                        }).formatToParts(now);

                        const get = (type: string) => parts.find(p => p.type === type)?.value;

                        const istTimestamp = `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`;

                        row.getCell(6).value = istTimestamp;
                        updated = true;
                        Logger.info(`ExcelReporter: Updated row ${rowNumber} for ${testCaseId}`);
                    }
                });

                if (updated) {
                    await workbook.xlsx.writeFile(excelFilePath);
                } else {
                    Logger.warn(`ExcelReporter: Test Case ID ${testCaseId} not found in Excel sheet.`);
                }
            } catch (error) {
                Logger.error(`ExcelReporter: Error writing test result to Excel: ${error}`);
            }
        });

        // Wait for the current write lock to complete
        await this.writeLock;
    }
}

export default ExcelReporter;
