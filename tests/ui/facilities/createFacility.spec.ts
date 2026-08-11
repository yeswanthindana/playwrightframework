import { expect, test } from '@src/fixtures/index';
import {
    createFacilityThroughUi,
    createUniqueFacilityData,
} from '@src/pages/setup/facilities/FacilityPage';
import { AllureUtil } from '@src/reporting/allure/AllureUtil';
import { Logger } from '@src/reporting/logging/Logger';
import { validFacility } from '@src/test-data/facilities/facilities.json';

test.describe('Create Facility tests', () => {
    test.describe.configure({ mode: 'parallel' });

    test('Add a new facility @Facility @TC-LOC-001', async ({
        page,
        facilityApiClient,
        facilityRepository,
    }, testInfo) => {
        Logger.info('--- START TEST: Add a new facility ---');
        await AllureUtil.setTestDetails({
            epic: 'Facilities Management',
            feature: 'UI Workflows',
            story: 'Add Facility',
            severity: 'critical',
            owner: 'Priyank',
            tags: ['Regression', 'UI'],
            testCaseId: 'TC-LOC-001',
            parentSuite: 'SentinelX',
            suite: 'Facility Module',
            subSuite: 'Create Facility',
        });

        const facilityData = createUniqueFacilityData(validFacility, testInfo.workerIndex, 'add');

        let facilityId: number | undefined;

        try {
            await AllureUtil.step(
                page,
                'Prerequisite: Create a facility through the UI',
                async () => {
                    Logger.info(`Creating facility through UI: ${facilityData.facilityName}`);
                    const created = await createFacilityThroughUi(
                        page,
                        facilityApiClient,
                        facilityData,
                    );
                    facilityId = created.id;
                    Logger.info(`Facility created through UI successfully. ID: ${facilityId}`);
                },
            );

            await AllureUtil.step(page, 'Validate the facility through the API', async () => {
                Logger.info(
                    `Validating facility through API by name: ${facilityData.facilityName}`,
                );
                const apiFacility = await facilityApiClient.getFacilityByName(
                    facilityData.facilityName,
                );
                expect(apiFacility).toMatchObject({
                    name: facilityData.facilityName,
                    addressLineOne: facilityData.facilityAddressLineOne,
                    addressLineTwo: facilityData.facilityAddressLineTwo,
                    city: facilityData.city,
                    state: facilityData.state,
                    country: facilityData.country,
                    pinCode: facilityData.pinCode,
                    timeregion: '-06:00 GMT',
                });
                Logger.info('Successfully validated facility through API.');
            });

            await AllureUtil.step(page, 'Validate the facility in the database', async () => {
                if (facilityId === undefined) {
                    throw new Error('Facility ID is unavailable');
                }
                Logger.info(`Validating facility with ID ${facilityId} in the database`);
                const dbFacility = await facilityRepository.getFacilityById(facilityId);
                expect(dbFacility).toMatchObject({
                    id: facilityId,
                    name: facilityData.facilityName,
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
            });
        } finally {
            await AllureUtil.step(
                page,
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
            Logger.info('--- END TEST: Add a new facility ---');
        }
    });
});
