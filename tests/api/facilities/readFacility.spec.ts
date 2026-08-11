import { expect, test } from '@src/fixtures/index';
import { AllureUtil } from '@src/reporting/allure/AllureUtil';
import { Logger } from '@src/reporting/logging/Logger';
import { validFacility } from '@src/test-data/facilities/facilities.json';

test('Read Facility via API @TC-LOC-API-002', async ({ facilityApiClient, facilityRepository }) => {
    await AllureUtil.setTestDetails({
        epic: 'Facilities Management',
        feature: 'API Workflows',
        story: 'Read Facility via API',
        severity: 'critical',
        owner: 'Priyank',
        tags: ['API', 'Regression'],
        testCaseId: 'TC-LOC-API-002',
        parentSuite: 'SentinelX',
        suite: 'Facility Module',
        subSuite: 'Read Facility via API'
    });

    const facilityName = `API-READ-${Date.now()}`;
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
            'Test: Validate the facility can be read by ID and name',
            async () => {
                if (facilityId === undefined) {
                    throw new Error('Facility ID is unavailable');
                }
                const apiFacility = await facilityApiClient.getFacilityById(facilityId);
                expect(apiFacility).toMatchObject({
                    id: facilityId,
                    name: facilityName,
                    addressLineOne: validFacility.facilityAddressLineOne,
                    addressLineTwo: validFacility.facilityAddressLineTwo,
                    city: validFacility.city,
                    state: validFacility.state,
                    country: validFacility.country,
                    pinCode: validFacility.pinCode,
                    timeregion: '-06:00 GMT',
                });

                const apiFacilityByName = await facilityApiClient.getFacilityByName(facilityName);
                expect(apiFacilityByName.id).toBe(facilityId);
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
