import { expect, Locator, Page } from '@playwright/test';
import { Logger } from '@src/reporting/logging/Logger';
import { BasePage } from '@src/pages/base/BasePage';

export class PaginationComponent extends BasePage {
    private readonly rowsPerPageDropdown: Locator;
    private readonly rowsPerPageValue: Locator;
    private readonly displayedRows: Locator;
    private readonly previousButton: Locator;
    private readonly nextButton: Locator;

    constructor(page: Page) {
        super(page);

        this.rowsPerPageDropdown = page.locator('[profile="combobox"]');
        this.rowsPerPageValue = page.locator('[profile="combobox"]');
        this.displayedRows = page.locator('.MuiTablePagination-displayedRows');
        this.previousButton = page.getByLabel('Go to previous page');
        this.nextButton = page.getByLabel('Go to next page');
    }

    async validateDisplayedRows(expected: string): Promise<void> {
        await expect(this.displayedRows).toHaveText(expected);
        Logger.info(`Validated displayed rows: ${expected}`);
    }

    async validateRowsPerPage(expected: string): Promise<void> {
        await expect(this.rowsPerPageValue).toHaveText(expected);
        Logger.info(`Validated rows per page: ${expected}`);
    }

    async clickNext(): Promise<void> {
        await this.nextButton.click();
        Logger.info('Clicked Next Page');
    }

    async clickPrevious(): Promise<void> {
        await this.previousButton.click();
        Logger.info('Clicked Previous Page');
    }

    async validateNextButtonEnabled(enabled: boolean): Promise<void> {
        if (enabled) {
            await expect(this.nextButton).toBeEnabled();
        } else {
            await expect(this.nextButton).toBeDisabled();
        }
        Logger.info('Clicked Next Button Enabled');
    }

    async validatePreviousButtonEnabled(enabled: boolean): Promise<void> {
        if (enabled) {
            await expect(this.previousButton).toBeEnabled();
        } else {
            await expect(this.previousButton).toBeDisabled();
        }
        Logger.info('Clicked Previous Button Enabled');
    }

    async selectRowsPerPage(value: string): Promise<void> {
        await this.rowsPerPageDropdown.click();
        await this.page.getByProfile('option', { name: value }).click();
        Logger.info(`Selected Rows Per Page: ${value}`);
    }
}
