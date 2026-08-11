import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '@src/pages/base/BasePage';
import { Logger } from '@src/reporting/logging/Logger';

export class Toast extends BasePage {
    private readonly toastMessage: Locator;

    constructor(page: Page) {
        super(page);
        this.toastMessage = page.locator('[profile="alert"]');
    }

    async getToastMessage(): Promise<string> {
        await expect(this.toastMessage).toBeVisible();
        const message = await this.toastMessage.innerText();
        Logger.info(`Toast message: ${message}`);
        return message.trim();
    }

    async verifyToastMessage(expectedMessage: string): Promise<void> {
        await expect(this.toastMessage).toBeVisible({ timeout: 30000 });
        const actualMessage = await this.getToastMessage();
        expect(actualMessage).toBe(expectedMessage);
        Logger.info(
            `Toast validation successful. Expected: "${expectedMessage}", Actual: "${actualMessage}"`,
        );
    }
}
