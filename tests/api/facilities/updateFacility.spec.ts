import { expect, test } from '@src/fixtures/index';
import { AllureUtil } from '@src/reporting/allure/AllureUtil';
import { Logger } from '@src/reporting/logging/Logger';
import { editFacility, validFacility } from '@src/test-data/facilities/facilities.json';

test('Update Facility via API @TC-LOC-API-003', async ({ facilityApiClient, facilityRepository }) => {
    await AllureUtil.setTestDetails({
        epic: 'Facilities Management',
        feature: 'API Workflows',
        story: 'Update Facility via API',
        severity: 'critical',
        owner: 'Priyank',
        tags: ['API', 'Regression'],
        testCaseId: 'TC-LOC-API-003',
        parentSuite: 'SentinelX',
        suite: 'Facility Module',
        subSuite: 'Update Facility via API'
    });

    const facilityName = `API-UPDATE-${Date.now()}`;
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

        const updatedName = `${facilityName}-updated`;
        const updateData = { ...editFacility, facilityName: updatedName };

        await AllureUtil.actionStep(
            'Test: Update the facility via API',
            async () => {
                if (facilityId === undefined) {
                    throw new Error('Facility ID is unavailable');
                }
                const updated = await facilityApiClient.updateFacility(facilityId, updateData);
                expect(updated.name).toBe(updatedName);
                Logger.info(`Updated facility via API successfully. ID: ${facilityId}`);
            },
        );

        await AllureUtil.actionStep(
            'Test: Validate the updated facility in the database',
            async () => {
                if (facilityId === undefined) {
                    throw new Error('Facility ID is unavailable');
                }
                Logger.info(`Validating updated facility with ID ${facilityId} in the database`);
                const dbFacility = await facilityRepository.getFacilityById(facilityId);
                expect(dbFacility).toMatchObject({
                    id: facilityId,
                    name: updatedName,
                    addressLineOne: updateData.facilityAddressLineOne,
                    addressLineTwo: updateData.facilityAddressLineTwo,
                    city: updateData.city,
                    state: updateData.state,
                    country: updateData.country,
                    pincode: updateData.pinCode,
                    timeregion: '-06:00 GMT',
                    isActive: true,
                });
                Logger.info('Successfully validated updated facility in the database.');
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
