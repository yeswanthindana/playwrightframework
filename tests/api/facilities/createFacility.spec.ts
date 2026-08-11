import { expect, test } from '@src/fixtures/index';
import { AllureUtil } from '@src/reporting/allure/AllureUtil';
import { Logger } from '@src/reporting/logging/Logger';
import { validFacility } from '@src/test-data/facilities/facilities.json';

const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '_').split('.')[0];

test('Create Facility via API @TC-LOC-API-001', async ({ facilityApiClient, facilityRepository }) => {
    await AllureUtil.setTestDetails({
        epic: 'Facilities Management',
        feature: 'API Workflows',
        story: 'Create Facility via API',
        severity: 'critical',
        owner: 'Yeswanth',
        tags: ['API', 'Regression'],
        testCaseId: 'TC-LOC-API-001',
        parentSuite: 'SentinelX',
        suite: 'Facility Module',
        subSuite: 'Create Facility via API'
    });

    const facilityName = `Bombay-${timestamp}`;
    const facilityData = { ...validFacility, facilityName };
    let facilityId: number | undefined;

    try {
        await AllureUtil.actionStep(
            'Prerequisite: Create the facility via API',
            async () => {
                const created = await facilityApiClient.createFacility(facilityData);
                expect(created.id).toBeDefined();
                facilityId = created.id;
                Logger.info(`Facility created via API successfully. ID: ${facilityId}`);
            },
        );

        await AllureUtil.actionStep(
            'Test: Validate the created facility in the database',
            async () => {
                if (facilityId === undefined) {
                    throw new Error('Facility ID is unavailable');
                }
                Logger.info(`Validating facility with ID ${facilityId} in the database`);
                const dbFacility = await facilityRepository.getFacilityById(facilityId);
                expect(dbFacility).toMatchObject({
                    id: facilityId,
                    name: facilityName,
                    addressLineOne: facilityData.facilityAddressLineOne,
                    addressLineTwo: facilityData.facilityAddressLineTwo,
                    city: facilityData.city,
                    state: facilityData.state,
                    country: facilityData.country,
                    pincode: facilityData.pinCode,
                    timeregion: '-06:00 GMT',
                    isActive: true,
                });
                Logger.info('Successfully validated facility in the database.');
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
