import { Locator, Page } from '@playwright/test';
import { BasePage } from '@src/pages/base/BasePage';
import { Common } from '@src/pages/components/Common';

export class TriggerRulesPage extends BasePage {
    private readonly triggerRules: Locator;
    private readonly setupMenu: Locator;
    private readonly addTriggerRule: Locator;
    private readonly common: Common;

    constructor(page: Page) {
        super(page);
        this.common = new Common(page);
        this.setupMenu = page.getByText('Setup', { exact: true });
        this.triggerRules = page.getByText('Event Definitions', { exact: true });
        this.addTriggerRule = page.locator('[aria-label="Add Event Definition"]');
    }

    async navigateToTriggerRules(): Promise<void> {
        await this.setupMenu.click();
        await this.triggerRules.click();
    }

    async clickOnAddTriggerRule(): Promise<void> {
        await this.common.clickAddButton('Event Definition');
    }
}
