import { expect, test } from '@src/fixtures/index';
import {
    Facilities,
    createFacilityThroughUi,
    createUniqueFacilityData,
    facilityHeaders,
    openFacilitiesPage,
} from '@src/pages/setup/facilities/FacilityPage';
import { AllureUtil } from '@src/reporting/allure/AllureUtil';
import { Common } from '@src/pages/components/Common';
import { Toast } from '@src/pages/components/Toast';
import { Logger } from '@src/reporting/logging/Logger';
import { deleteFacility, validFacility } from '@src/test-data/facilities/facilities.json';
import { DataGrid } from '@src/pages/components/DataGrid';

test.describe('Delete Facility tests', () => {
    test.describe.configure({ mode: 'parallel' });

    test('Delete an existing facility @Facility @TC-LOC-004', async ({
        page,
        facilityApiClient,
        facilityRepository,
    }, testInfo) => {
        Logger.info('--- START TEST: Delete an existing facility ---');
        await AllureUtil.setTestDetails({
            epic: 'Facilities Management',
            feature: 'UI Workflows',
            story: 'Delete Facility',
            severity: 'critical',
            owner: 'Priyank',
            tags: ['Regression', 'UI'],
            description: 'Verify facility delete confirmation modal and state update to inactive in DB.',
            testCaseId: 'TC-LOC-004',
            parentSuite: 'SentinelX',
            suite: 'Facility Module',
            subSuite: 'Delete Facility'
        });

        const facilityData = createUniqueFacilityData(
            validFacility,
            testInfo.workerIndex,
            'delete',
        );
        const facilitiesPage = new Facilities(page);
        const common = new Common(page);
        const datagrid = new DataGrid(page);
        const toast = new Toast(page);

        let facilityId: number | undefined;

        try {
            await AllureUtil.step(page, 'Prerequisite: Create the facility required by this test', async () => {
                Logger.info(`Creating required facility through UI: ${facilityData.facilityName}`);
                const created = await createFacilityThroughUi(
                    page,
                    facilityApiClient,
                    facilityData,
                );
                facilityId = created.id;
                Logger.info(`Required facility created successfully. ID: ${facilityId}`);
            });

            await AllureUtil.step(page, 'Search for the facility', async () => {
                await openFacilitiesPage(page, facilitiesPage);
                Logger.info(`Searching for facility to delete: ${facilityData.facilityName}`);
                await common.enterSearchText(facilityData.facilityName);
            });

            await AllureUtil.step(page, 'Open the delete confirmation', async () => {
                await common.clickDeleteIcon();
            });

            await AllureUtil.step(page, 'Confirm the deletion', async () => {
                await common.clickDeleteButton();
            });

            await AllureUtil.step(page, 'Validate the deletion toast', async () => {
                await toast.verifyToastMessage(deleteFacility.verifyToastMessage);
            });

            await AllureUtil.step(page, 'Verify facility is no longer found in grid search', async () => {
                await common.enterSearchText(facilityData.facilityName);
                await datagrid.verifyHeaders(facilityHeaders);
                await common.verifyNoResultsFound();
            });

            await AllureUtil.step(
                page,
                'Validate the facility is inactive in the database',
                async () => {
                    if (facilityId === undefined) {
                        throw new Error('Facility ID is unavailable');
                    }
                    Logger.info(
                        `Validating facility with ID ${facilityId} is inactive in database`,
                    );
                    const dbFacility = await facilityRepository.getFacilityById(facilityId);
                    expect(dbFacility.isActive).toBe(false);
                    Logger.info(`Successfully verified facility ID ${facilityId} is now inactive.`);
                },
            );
        } finally {
            await AllureUtil.step(page, 'Postrequisite: Deactivate the created facility', async () => {
                if (facilityId === undefined) {
                    Logger.warn('Postrequisite skipped because Facility ID is unavailable.');
                    return;
                }
                Logger.info(`Postrequisite: Deactivating facility ID ${facilityId}`);
                await facilityRepository.deactivateFacility(facilityId);
                Logger.info(`Postrequisite completed for facility ID ${facilityId}`);
            });
            Logger.info('--- END TEST: Delete an existing facility ---');
        }
    });
});
