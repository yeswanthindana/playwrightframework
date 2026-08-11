import { expect, test } from '@src/fixtures/index';
import {
    Facilities,
    openFacilitiesPage,
    populateFacilityForm,
} from '@src/pages/setup/facilities/FacilityPage';
import { AllureUtil } from '@src/reporting/allure/AllureUtil';
import { JsonDataUtil } from '@src/utils/JsonDataUtil';
import { Common } from '@src/pages/components/Common';
import { Toast } from '@src/pages/components/Toast';
import { Logger } from '@src/reporting/logging/Logger';
import {
    deleteFacility,
    editFacility,
    validFacility,
} from '@src/test-data/facilities/facilities.json';

const facilityIdKey = 'facilityId';
const facilityNameKey = 'facilityName';

const uniqueFacilityName = `Mumbai-E2E-${Date.now()}`;
const uniqueEditName = `Mumbai-E2E-Edit-${Date.now()}`;
const testFacility = { ...validFacility, facilityName: uniqueFacilityName };
const testEditFacility = { ...editFacility, facilityName: uniqueEditName };

function saveRuntimeFacilityState(facilityId: number, facilityName: string): void {
    JsonDataUtil.saveValue(facilityIdKey, facilityId);
    JsonDataUtil.saveValue(facilityNameKey, facilityName);
}

function getRuntimeFacilityId(): number {
    return JsonDataUtil.getValue<number>(facilityIdKey);
}

function getRuntimeFacilityName(): string {
    return JsonDataUtil.getValue<string>(facilityNameKey);
}

test.describe.serial('Facility e2e CRUD tests', () => {
    test.afterAll(() => {
        JsonDataUtil.removeValue(facilityIdKey);
        JsonDataUtil.removeValue(facilityNameKey);
    });

    test('Add a new facility @Facility', async ({
        page,
        facilityApiClient,
        facilityRepository,
    }) => {
        Logger.info('--- START TEST: Add a new facility ---');
        await AllureUtil.setTestDetails({
            epic: 'Facilities Management',
            feature: 'E2E Workflows',
            story: 'Add Facility',
            severity: 'critical',
            owner: 'Priyank',
            tags: ['Regression', 'E2E'],
            parentSuite: 'SentinelX',
            suite: 'Facility Module',
            subSuite: 'Create Facility'
        });

        const facilitiesPage = new Facilities(page);
        const common = new Common(page);

        await AllureUtil.step(page, 'Open dashboard and navigate to Facilities', async () => {
            await openFacilitiesPage(page, facilitiesPage);
        });

        await AllureUtil.step(page, 'Open the Add Facility dialog', async () => {
            await facilitiesPage.clickOnAddFacility();
        });

        await AllureUtil.step(page, 'Populate the new facility form', async () => {
            Logger.info(`Populating facility form with name: ${testFacility.facilityName}`);
            await populateFacilityForm(facilitiesPage, testFacility);
        });

        await AllureUtil.step(page, 'Populate the timeregion', async () => {
            await facilitiesPage.selectTimeregionWhenAdding();
        });

        await AllureUtil.step(page, 'Save the facility', async () => {
            await common.clickSaveButton();
        });

        await AllureUtil.step(page, 'Validate the success toast', async () => {
            await facilitiesPage.verifyToastMessage({
                verifyToastMessage: testFacility.verifyToastMessage,
            });
        });

        let facilityId: number | undefined;

        await AllureUtil.step(page, 'Resolve the created facility from the API', async () => {
            Logger.info(
                `Resolving created facility from API by name: ${testFacility.facilityName}`,
            );
            const createdFacility = await facilityApiClient.getFacilityByName(
                testFacility.facilityName,
            );

            expect(createdFacility).toMatchObject({
                name: testFacility.facilityName,
                addressLineOne: testFacility.facilityAddressLineOne,
                addressLineTwo: testFacility.facilityAddressLineTwo,
                city: testFacility.city,
                state: testFacility.state,
                country: testFacility.country,
                pinCode: testFacility.pinCode,
                timeregion: '-06:00 GMT',
            });

            facilityId = createdFacility.id;
            Logger.info(`Resolved facility ID from API: ${facilityId}`);
            saveRuntimeFacilityState(facilityId, testFacility.facilityName);
        });

        await AllureUtil.step(page, 'Validate the created facility in the database', async () => {
            if (facilityId === undefined) {
                throw new Error('Created facility id should be available before the DB check');
            }
            Logger.info(`Validating facility with ID ${facilityId} in the database`);
            const dbFacility = await facilityRepository.getFacilityById(facilityId);
            expect(dbFacility).toMatchObject({
                id: facilityId,
                name: testFacility.facilityName,
                addressLineOne: testFacility.facilityAddressLineOne,
                addressLineTwo: testFacility.facilityAddressLineTwo,
                city: testFacility.city,
                state: testFacility.state,
                country: testFacility.country,
                pincode: testFacility.pinCode,
                timeregion: '-06:00 GMT',
                isActive: true,
            });
            Logger.info('Successfully validated facility in the database.');
        });
        Logger.info('--- END TEST: Add a new facility ---');
    });

    test('View an existing facility @Facility', async ({ page }) => {
        Logger.info(
            `--- START TEST: View an existing facility (Target Name: ${getRuntimeFacilityName()}) ---`,
        );
        await AllureUtil.setTestDetails({
            epic: 'Facilities Management',
            feature: 'E2E Workflows',
            story: 'View Facility',
            severity: 'critical',
            owner: 'Priyank',
            tags: ['Regression', 'E2E'],
            parentSuite: 'SentinelX',
            suite: 'Facility Module',
            subSuite: 'View Facility'
        });

        const facilitiesPage = new Facilities(page);
        const common = new Common(page);

        await AllureUtil.step(page, 'Open dashboard and navigate to Facilities', async () => {
            await openFacilitiesPage(page, facilitiesPage);
        });

        await AllureUtil.step(page, 'Search for the saved facility', async () => {
            Logger.info(`Searching for facility: ${getRuntimeFacilityName()}`);
            await common.enterSearchText(getRuntimeFacilityName());
        });

        await AllureUtil.step(page, 'Open the facility details', async () => {
            await common.clickViewIcon(getRuntimeFacilityName());
        });

        await AllureUtil.step(page, 'Validate the facility fields', async () => {
            Logger.info('Validating facility fields on details page...');
            await common.verifyFieldValue(page, 'Name', testFacility.facilityName);
            await common.verifyFieldValue(
                page,
                'Address Line 1',
                testFacility.facilityAddressLineOne,
            );
            await common.verifyFieldValue(
                page,
                'Address Line 2',
                testFacility.facilityAddressLineTwo,
            );
            await common.verifyFieldValue(page, 'City', testFacility.city);
            await common.verifyFieldValue(page, 'Pin Code', testFacility.pinCode);
            await common.verifyFieldValue(page, 'State/Province', testFacility.state);
            await common.verifyFieldValue(page, 'Country', testFacility.country);
            Logger.info('Successfully verified all facility details fields.');
        });
        Logger.info('--- END TEST: View an existing facility ---');
    });

    test('Edit an existing facility @Facility', async ({ page, facilityRepository }) => {
        Logger.info(
            `--- START TEST: Edit an existing facility (Target Name: ${getRuntimeFacilityName()}, ID: ${getRuntimeFacilityId()}) ---`,
        );
        await AllureUtil.setTestDetails({
            epic: 'Facilities Management',
            feature: 'E2E Workflows',
            story: 'Edit Facility',
            severity: 'critical',
            owner: 'Priyank',
            tags: ['Regression', 'E2E'],
            parentSuite: 'SentinelX',
            suite: 'Facility Module',
            subSuite: 'Edit Facility'
        });

        const facilitiesPage = new Facilities(page);
        const common = new Common(page);

        await AllureUtil.step(page, 'Open dashboard and navigate to Facilities', async () => {
            await openFacilitiesPage(page, facilitiesPage);
        });

        await AllureUtil.step(page, 'Search for the saved facility', async () => {
            Logger.info(`Searching for facility: ${getRuntimeFacilityName()}`);
            await common.enterSearchText(getRuntimeFacilityName());
        });

        await AllureUtil.step(page, 'Open the facility editor', async () => {
            await common.clickEditIcon(getRuntimeFacilityName());
        });

        await AllureUtil.step(page, 'Update the facility details', async () => {
            Logger.info(
                `Updating facility form with edit values. New Name: ${testEditFacility.facilityName}`,
            );
            await populateFacilityForm(facilitiesPage, testEditFacility);
        });

        await AllureUtil.step(page, 'Populate the timeregion', async () => {
            await facilitiesPage.selectTimeregionWhenEditing();
        });

        await AllureUtil.step(page, 'Persist the facility changes', async () => {
            await common.clickUpdateButton();
        });

        await AllureUtil.step(page, 'Store the updated facility name', async () => {
            saveRuntimeFacilityState(getRuntimeFacilityId(), testEditFacility.facilityName);
            Logger.info(
                `Stored new runtime state: Name = ${testEditFacility.facilityName}, ID = ${getRuntimeFacilityId()}`,
            );
        });

        await AllureUtil.step(page, 'Validate the updated facility in the database', async () => {
            Logger.info(`Validating updated facility in database for ID ${getRuntimeFacilityId()}`);
            const dbFacility = await facilityRepository.getFacilityById(getRuntimeFacilityId());
            expect(dbFacility).toMatchObject({
                id: getRuntimeFacilityId(),
                name: testEditFacility.facilityName,
                addressLineOne: testEditFacility.facilityAddressLineOne,
                addressLineTwo: testEditFacility.facilityAddressLineTwo,
                city: testEditFacility.city,
                state: testEditFacility.state,
                country: testEditFacility.country,
                pincode: testEditFacility.pinCode,
                timeregion: '-06:00 GMT',
                isActive: true,
            });
            Logger.info('Successfully validated updated facility in the database.');
        });
        Logger.info('--- END TEST: Edit an existing facility ---');
    });

    test('Delete an existing facility @Facility', async ({ page, facilityRepository }) => {
        Logger.info(
            `--- START TEST: Delete an existing facility (Target Name: ${getRuntimeFacilityName()}, ID: ${getRuntimeFacilityId()}) ---`,
        );
        await AllureUtil.setTestDetails({
            epic: 'Facilities Management',
            feature: 'E2E Workflows',
            story: 'Delete Facility',
            severity: 'critical',
            owner: 'Priyank',
            tags: ['Regression', 'E2E'],
            parentSuite: 'SentinelX',
            suite: 'Facility Module',
            subSuite: 'Delete Facility'
        });

        const facilitiesPage = new Facilities(page);
        const common = new Common(page);
        const toast = new Toast(page);

        await AllureUtil.step(page, 'Open dashboard and navigate to Facilities', async () => {
            await openFacilitiesPage(page, facilitiesPage);
        });

        await AllureUtil.step(page, 'Search for the saved facility', async () => {
            Logger.info(`Searching for facility to delete: ${getRuntimeFacilityName()}`);
            await common.enterSearchText(getRuntimeFacilityName());
        });

        await AllureUtil.step(page, 'Open the delete confirmation', async () => {
            await common.clickDeleteIcon(getRuntimeFacilityName());
        });

        await AllureUtil.step(page, 'Confirm the deletion', async () => {
            await common.clickDeleteButton();
        });

        await AllureUtil.step(page, 'Validate the delete toast', async () => {
            await toast.verifyToastMessage(deleteFacility.verifyToastMessage);
        });

        await AllureUtil.step(
            page,
            'Validate the facility is inactive in the database',
            async () => {
                Logger.info(
                    `Validating facility with ID ${getRuntimeFacilityId()} is inactive in database`,
                );
                const dbFacility = await facilityRepository.getFacilityById(getRuntimeFacilityId());
                expect(dbFacility.isActive).toBe(false);
                Logger.info(
                    `Successfully verified facility ID ${getRuntimeFacilityId()} is now inactive.`,
                );
            },
        );
        Logger.info('--- END TEST: Delete an existing facility ---');
    });
});
