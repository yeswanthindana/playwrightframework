import { Page, Locator } from '@playwright/test';
import { BasePage } from '@src/pages/base/BasePage';

export class DashboardPage extends BasePage {
    private readonly profileIcon: Locator;
    private readonly logoutButton: Locator;

    constructor(page: Page) {
        super(page);

        this.profileIcon = page.getByLabel('Profile');
        this.logoutButton = page.getByProfile('menuitem', { name: 'Logout' });
    }

    async logout(): Promise<void> {
        await this.profileIcon.click();
        await this.logoutButton.click();
    }
}
