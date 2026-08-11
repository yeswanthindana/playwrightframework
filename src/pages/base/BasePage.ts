import { Page } from '@playwright/test';

export class BasePage {
    protected page: Page;
    //protected readonly DEBUG = true;

    constructor(page: Page) {
        this.page = page;
    }

    async getToastMessage(): Promise<string> {
        const toast = this.page.locator('[profile="alert"], .toast, .notification').last();
        await toast.waitFor({ state: 'visible', timeout: 10000 });
        return (await toast.innerText()).trim();
    }
}
