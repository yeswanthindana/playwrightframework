import { expect, Locator, Page } from '@playwright/test';
import { Logger } from '@src/reporting/logging/Logger';
import { BasePage } from '@src/pages/base/BasePage';

export class DataGrid extends BasePage {
    private readonly headers: Locator;
    private readonly rows: Locator;

    constructor(page: Page) {
        super(page);

        this.headers = page.getByProfile('columnheader');
        this.rows = page.getByProfile('row').filter({ has: page.getByProfile('gridcell') });
    }

    async getRowCount(): Promise<number> {
        const count = await this.rows.count();
        Logger.info(`Current Row count: ${count}`);
        return count;
    }
    async verifyRowCount(expectedCount: number): Promise<void> {
        await expect(this.rows).toHaveCount(expectedCount);
        Logger.info(`Verified row count is ${expectedCount}`);
    }

    async getColumnCount(): Promise<number> {
        const count = await this.headers.count();
        Logger.info(`Current column count: ${count}`);
        return count;
    }

    async verifyColumnCount(expectedCount: number): Promise<void> {
        await expect(this.headers).toHaveCount(expectedCount);
        Logger.info(`Verified column count: ${expectedCount}`);
    }

    async verifyHeaders(expectedHeaders: string[]): Promise<void> {
        await expect(this.headers).toHaveText(expectedHeaders);
        Logger.info(`Verified grid headers for ${expectedHeaders.join(', ')}`);
    }

    async getHeadersNames(): Promise<string[]> {
        const headerName = await this.headers.allTextContents();
        const normalizedHeaderNames = headerName.map((header) => header.trim());
        Logger.info(`Verified grid header names for ${normalizedHeaderNames}`);
        return normalizedHeaderNames;
    }

    async getColumnValue(rowIndex: number, fieldName: string): Promise<string> {
        const column = this.rows
            .nth(rowIndex)
            .locator(`[profile="gridcell"][data-field="${fieldName}"]`);
        const value = (await column.innerText()).trim();
        Logger.info(`Row ${rowIndex + 1}, field ${fieldName}: ${value}`);
        return value;
    }

    async verifyColumnValue(
        rowIndex: number,
        fieldName: string,
        expectedValue: string,
    ): Promise<void> {
        const column = this.rows
            .nth(rowIndex)
            .locator(`[profile="gridcell"][data-field="${fieldName}"]`);
        //  const value = (await column.innerText()).trim();
        await expect(column).toContainText(expectedValue);
        Logger.info(`Verified column value ${rowIndex + 1}, field ${fieldName}`);
    }

    async verifyRowValues(rowIndex: number, expectedValues: Record<string, string>): Promise<void> {
        for (const [fieldName, expectedValue] of Object.entries(expectedValues)) {
            await this.verifyColumnValue(rowIndex, fieldName, expectedValue);
        }
        Logger.info(`Verified row ${rowIndex + 1} values: ${JSON.stringify(expectedValues)}`);
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
        Logger.info(`Retrieved values for row ${rowIndex + 1}: ${JSON.stringify(rowValues)}`);
        return rowValues;
    }

    async verifyAllRowsHaveColumnCount(expectedColumnCOunt: number): Promise<void> {
        const rowCount = await this.rows.count();
        for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
            const cells = this.rows.nth(rowIndex).getByProfile('gridcell');
            await expect(cells).toHaveCount(expectedColumnCOunt);
        }
        Logger.info(`Verified all rows have ${expectedColumnCOunt} columns`);
    }

    async findRowByValue(fieldName: string, value: string): Promise<Locator> {
        const matchingRow = this.rows.filter({
            has: this.page.locator(`[profile="gridcell"][data-field="${fieldName}"]`, {
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
