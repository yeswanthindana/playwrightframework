import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '@src/pages/base/BasePage';
import { Logger } from '@src/reporting/logging/Logger';

export class Sidebar extends BasePage {
    private readonly toggleButton: Locator;
    private readonly menuItems: Locator;

    constructor(page: Page) {
        super(page);
        this.toggleButton = page.getByProfile('button', { name: 'Toggle navigation' });
        this.menuItems = page.locator('span');
    }

    async clickToggleButton(): Promise<void> {
        await expect(this.toggleButton).toBeVisible();
        await this.toggleButton.click();
        Logger.info('Clicked on Toggle button');
    }

    async navigateToMenuItem(menuItem: string): Promise<void> {
        const menuItemLocator = this.menuItems.filter({ hasText: menuItem });
        const isVisible = await menuItemLocator.isVisible().catch(() => false);
        if (!isVisible) {
            const toggleVisible = await this.toggleButton.isVisible().catch(() => false);
            if (toggleVisible) {
                Logger.info('Sidebar is collapsed, clicking toggle button to expand');
                await this.clickToggleButton();
            }
        }
        await expect(menuItemLocator).toBeVisible();
        await menuItemLocator.click();
        Logger.info(`Navigated to menu item: ${menuItem}`);
    }
}
