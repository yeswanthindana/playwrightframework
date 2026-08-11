import { expect, test } from '@src/fixtures/index';
import { AllureUtil } from '@src/reporting/allure/AllureUtil';
import { Logger } from '@src/reporting/logging/Logger';
import { validFacility } from '@src/test-data/facilities/facilities.json';

test('Delete Facility via API @TC-LOC-API-004', async ({ facilityApiClient, facilityRepository }) => {
    await AllureUtil.setTestDetails({
        epic: 'Facilities Management',
        feature: 'API Workflows',
        story: 'Delete Facility via API',
        severity: 'critical',
        owner: 'Priyank',
        tags: ['API', 'Regression'],
        testCaseId: 'TC-LOC-API-004',
        parentSuite: 'SentinelX',
        suite: 'Facility Module',
        subSuite: 'Delete Facility via API'
    });

    const facilityName = `API-DELETE-${Date.now()}`;
    const facilityData = { ...validFacility, facilityName };
    let facilityId: number | undefined;

    try {
        await AllureUtil.actionStep(
            'Prerequisite: Create the facility via API',
            async () => {
                const created = await facilityApiClient.createFacility(facilityData);
                facilityId = created.id;
                Logger.info(`Facility created via API successfully. ID: ${facilityId}`);
            },
        );

        await AllureUtil.actionStep(
            'Test: Delete the facility via API',
            async () => {
                if (facilityId === undefined) {
                    throw new Error('Facility ID is unavailable');
                }
                await facilityApiClient.deleteFacility(facilityId);
                Logger.info(`Facility deleted via API successfully. ID: ${facilityId}`);
            },
        );

        await AllureUtil.actionStep(
            'Test: Validate the facility is inactive in the database',
            async () => {
                if (facilityId === undefined) {
                    throw new Error('Facility ID is unavailable');
                }
                Logger.info(`Validating facility with ID ${facilityId} is inactive in the database`);
                const dbFacility = await facilityRepository.getFacilityById(facilityId);
                expect(dbFacility.isActive).toBe(false);
            },
        );
    } finally {
        await AllureUtil.actionStep(
            'Postrequisite: Deactivate the created facility',
            async () => {
                if (facilityId === undefined) {
                    Logger.warn('Postrequisite skipped because Facility ID is unavailable.');
                    return;
                }
                Logger.info(`Postrequisite: Deactivating facility ID ${facilityId}`);
                await facilityRepository.deactivateFacility(facilityId);
                Logger.info(`Postrequisite completed for facility ID ${facilityId}`);
            },
        );
    }
});
