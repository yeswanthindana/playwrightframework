import { expect, test } from '@src/fixtures/index';
import {
    Facilities,
    openFacilitiesPage,
    populateFacilityForm,
} from '@src/pages/setup/facilities/FacilityPage';
import { AllureUtil } from '@src/reporting/allure/AllureUtil';
import { Common } from '@src/pages/components/Common';
import { Toast } from '@src/pages/components/Toast';
import { Logger } from '@src/reporting/logging/Logger';
import { validFacility } from '@src/test-data/facilities/facilities.json';

test.describe('Facilities UI Negative Validations', () => {
    test('Empty Form Fields Validation', async ({ page }) => {
        Logger.info('--- START TEST: Empty Form Fields Validation ---');
        await AllureUtil.setTestDetails({
            epic: 'Facilities Management',
            feature: 'UI Negative Validations',
            story: 'Empty Form Fields Validation',
            severity: 'normal',
            owner: 'Priyank',
            tags: ['UI', 'Negative'],
            parentSuite: 'SentinelX',
            suite: 'Facility Module',
            subSuite: 'Negative Validations'
        });

        const facilitiesPage = new Facilities(page);
        const common = new Common(page);

        await AllureUtil.step(page, 'Open dashboard and navigate to Facilities', async () => {
            await openFacilitiesPage(page, facilitiesPage);
        });

        await AllureUtil.step(page, 'Open the Add Facility dialog', async () => {
            await facilitiesPage.clickOnAddFacility();
        });

        await AllureUtil.step(page, 'Click Save without filling fields', async () => {
            await common.clickSaveButton();
        });

        await AllureUtil.step(page, 'Verify validation message is visible', async () => {
            await expect(page.getByProfile('dialog', { name: 'Add Facility' })).toBeVisible();

            const nameError = page.locator('p:has-text("required"), .Mui-error');
            await expect(nameError.first()).toBeVisible();
            const errorText = await nameError.first().innerText();
            Logger.info(`Found form validation error: ${errorText}`);
        });

        await AllureUtil.step(page, 'Postrequisite: Close the dialog', async () => {
            await common.clickCancelButton();
        });
        Logger.info('--- END TEST: Empty Form Fields Validation ---');
    });

    test('Duplicate Name Toast Notification', async ({ page }) => {
        Logger.info('--- START TEST: Duplicate Name Toast Notification ---');
        await AllureUtil.setTestDetails({
            epic: 'Facilities Management',
            feature: 'UI Negative Validations',
            story: 'Duplicate Name Toast Notification',
            severity: 'normal',
            owner: 'Priyank',
            tags: ['UI', 'Negative'],
            parentSuite: 'SentinelX',
            suite: 'Facility Module',
            subSuite: 'Negative Validations'
        });

        const facilitiesPage = new Facilities(page);
        const common = new Common(page);
        const toast = new Toast(page);

        const duplicateFacilityData = {
            ...validFacility,
            facilityName: 'Aether Technologies',
        };

        await AllureUtil.step(page, 'Open dashboard and navigate to Facilities', async () => {
            await openFacilitiesPage(page, facilitiesPage);
        });

        await AllureUtil.step(page, 'Open the Add Facility dialog', async () => {
            await facilitiesPage.clickOnAddFacility();
        });

        await AllureUtil.step(page, 'Populate form with duplicate facility data', async () => {
            await populateFacilityForm(facilitiesPage, duplicateFacilityData);
        });

        await AllureUtil.step(page, 'Populate the timeregion', async () => {
            await facilitiesPage.selectTimeregionWhenAdding();
        });

        await AllureUtil.step(page, 'Click Save button', async () => {
            await common.clickSaveButton();
        });

        await AllureUtil.step(page, 'Verify duplicate error toast message', async () => {
            await toast.verifyToastMessage('Facility name already exists');
        });

        await AllureUtil.step(page, 'Postrequisite: Close the dialog', async () => {
            await common.clickCancelButton();
        });
        Logger.info('--- END TEST: Duplicate Name Toast Notification ---');
    });
});
