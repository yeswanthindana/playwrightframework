import { test } from '@src/fixtures/index';
import { AllureUtil } from '@src/reporting/allure/AllureUtil';
import { TriggerRulesPage } from '@src/pages/setup/trigger-rules/TriggerRulesPage';

test('Create a Event Definition @TriggerRules', async ({ page }) => {
    await AllureUtil.setTestDetails({
        epic: 'Setup',
        feature: 'Event Definitions',
        story: 'Create Event Definition',
        severity: 'critical',
        owner: 'Yeswanth',
        tags: ['Regression'],
        parentSuite: 'SentinelX',
        suite: 'Setup Module',
        subSuite: 'Event Definitions'
    });

    const triggerRulesPage = new TriggerRulesPage(page);

    await page.goto('/dashboard');
    await triggerRulesPage.navigateToTriggerRules();
});
