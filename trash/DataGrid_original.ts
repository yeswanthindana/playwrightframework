import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../src/pages/base/BasePage';
import { Logger } from '../src/utils/Logger';

export class DataGrid extends BasePage {
    private readonly headers: Locator;
    private readonly rows: Locator;

    constructor(page: Page) {
        super(page);

        this.headers = page.getByProfile('columnheader');
        this.rows = page.getByProfile('row').filter({ has: page.getByProfile('gridcell') });
    }

    async verifyRowCount(expectedCount: number): Promise<void> {
        await expect(this.rows).toHaveCount(expectedCount);
        Logger.info(`Verified row count: ${expectedCount}`);
    }

    async getRowCount(): Promise<number> {
        const count = await this.rows.count();
        Logger.info(`Current row count: ${count}`);
        return count;
    }

    async verifyColumnCount(expectedCount: number): Promise<void> {
        await expect(this.headers).toHaveCount(expectedCount);
        Logger.info(`Verified column count: ${expectedCount}`);
    }

    async getColumnCount(): Promise<number> {
        const count = await this.headers.count();
        Logger.info(`Current column count: ${count}`);
        return count;
    }

    async verifyHeaders(expectedHeaders: string[]): Promise<void> {
        await expect(this.headers).toHaveText(expectedHeaders);
        Logger.info(`Verified grid headers: ${expectedHeaders.join(', ')}`);
    }

    async getHeaderNames(): Promise<string[]> {
        const headerNames = await this.headers.allTextContents();
        const normalizedHeaders = headerNames.map((header) => header.trim());
        Logger.info(`Grid headers: ${normalizedHeaders.join(', ')}`);
        return normalizedHeaders;
    }

    async verifyCellValue(
        rowIndex: number,
        fieldName: string,
        expectedValue: string,
    ): Promise<void> {
        const cell = this.rows
            .nth(rowIndex)
            .locator(`[profile="gridcell"][data-field="${fieldName}"]`);
        await expect(cell).toContainText(expectedValue);
        Logger.info(`Verified row ${rowIndex + 1}, field ${fieldName}: ${expectedValue}`);
    }

    async getCellValue(rowIndex: number, fieldName: string): Promise<string> {
        const cell = this.rows
            .nth(rowIndex)
            .locator(`[profile="gridcell"][data-field="${fieldName}"]`);
        const value = (await cell.innerText()).trim();
        Logger.info(`Row ${rowIndex + 1}, field ${fieldName}: ${value}`);
        return value;
    }
    //-------------------

    async verifyRowValues(rowIndex: number, expectedValues: Record<string, string>): Promise<void> {
        for (const [fieldName, expectedValue] of Object.entries(expectedValues)) {
            await this.verifyCellValue(rowIndex, fieldName, expectedValue);
        }
        Logger.info(`Verified all values in row ${rowIndex + 1}`);
    }

    async getRowValues(rowIndex: number): Promise<Record<string, string>> {
        const row = this.rows.nth(rowIndex);
        const cells = row.getByProfile('gridcell');
        const count = await cells.count();
        const rowValues: Record<string, string> = {};

        for (let index = 0; index < count; index++) {
            const cell = cells.nth(index);
            const fieldName = await cell.getAttribute('data-field');
            if (fieldName) {
                rowValues[fieldName] = (await cell.innerText()).trim();
            }
        }
        Logger.info(`Row ${rowIndex + 1} values: ${JSON.stringify(rowValues)}`);
        return rowValues;
    }

    async verifyAllRowsHaveColumnCount(expectedColumnCount: number): Promise<void> {
        const rowCount = await this.rows.count();
        for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
            const cells = this.rows.nth(rowIndex).getByProfile('gridcell');
            await expect(cells).toHaveCount(expectedColumnCount);
        }
        Logger.info(`Verified every row contains ${expectedColumnCount} columns`);
    }

    async verifySerialNumbers(): Promise<void> {
        const rowCount = await this.rows.count();
        for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
            const serialNumberCell = this.rows.nth(rowIndex).locator('[data-field="sno"]');
            await expect(serialNumberCell).toHaveText(String(rowIndex + 1));
        }
        Logger.info('Verified serial numbers for all visible rows');
    }

    async findRowByValue(fieldName: string, value: string): Promise<Locator> {
        const matchingRow = this.rows.filter({
            has: this.page.locator(`[profile="gridcell"][data-field="${fieldName}"]`).filter({
                hasText: value,
            }),
        });
        await expect(matchingRow).toHaveCount(1);
        Logger.info(`Found row where ${fieldName} contains: ${value}`);
        return matchingRow;
    }

    async verifyRowByField(
        searchField: string,
        searchValue: string,
        expectedValues: Record<string, string>,
    ): Promise<void> {
        const row = await this.findRowByValue(searchField, searchValue);
        for (const [fieldName, expectedValue] of Object.entries(expectedValues)) {
            const cell = row.locator(`[profile="gridcell"][data-field="${fieldName}"]`);
            await expect(cell).toContainText(expectedValue);
        }
        Logger.info(`Verified row identified by ${searchField}: ${searchValue}`);
    }

    async verifyActionsForRow(rowIndex: number, expectedActions: string[]): Promise<void> {
        const actionCell = this.rows.nth(rowIndex).locator('[data-field="actions"]');
        for (const action of expectedActions) {
            await expect(actionCell.locator(`[aria-label="${action}"]`)).toBeVisible();
        }
        Logger.info(`Verified actions for row ${rowIndex + 1}: ${expectedActions.join(', ')}`);
    }

    async clickRowAction(rowIndex: number, action: 'View' | 'Edit' | 'Delete'): Promise<void> {
        const actionButton = this.rows
            .nth(rowIndex)
            .locator('[data-field="actions"]')
            .locator(`[aria-label="${action}"]`);
        await expect(actionButton).toBeVisible();
        await actionButton.click();
        Logger.info(`Clicked ${action} action on row ${rowIndex + 1}`);
    }
}

/*

Header validation

Your table currently has these seven headers: S.No, Name, Detection Type, Stream, Region, Severity, and Actions.

await dataGrid.verifyHeaders([
    'S.No',
    'Name',
    'Detection Type',
    'Stream',
    'Region',
    'Severity',
    'Actions',
]);


Validate row and column counts
await dataGrid.verifyRowCount(10);
await dataGrid.verifyColumnCount(7);
await dataGrid.verifyAllRowsHaveColumnCount(7);



Validate one complete row by index
await dataGrid.verifyRowValues(0, {
    sno: '1',
    name: 'Trucks In Material Yard',
    event_start_detection_object_name: 'Truck',
    stream: 'Material Yard Monitoring',
    roi_name: 'Truck Material Loading And Tarpaulin Handling',
    severity: 'Low',
});

Validate a row using a unique value

This is safer than relying on row index:

await dataGrid.verifyRowByField(
    'name',
    'Trucks In Material Yard',
    {
        event_start_detection_object_name: 'Truck',
        stream: 'Material Yard Monitoring',
        roi_name: 'Truck Material Loading And Tarpaulin Handling',
        severity: 'Low',
    },
);

Validate action icons
await dataGrid.verifyActionsForRow(0, [
    'View',
    'Edit',
    'Delete',
]);

Click an action button
await dataGrid.clickRowAction(0, 'Edit');

*/
