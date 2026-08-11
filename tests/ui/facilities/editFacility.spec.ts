import { expect, test } from '@src/fixtures/index';
import {
    Facilities,
    createFacilityThroughUi,
    createUniqueFacilityData,
    facilityHeaders,
    facilityTimeregion,
    openFacilitiesPage,
    populateFacilityForm,
} from '@src/pages/setup/facilities/FacilityPage';
import { AllureUtil } from '@src/reporting/allure/AllureUtil';
import { Common } from '@src/pages/components/Common';
import { Logger } from '@src/reporting/logging/Logger';
import { editFacility, validFacility } from '@src/test-data/facilities/facilities.json';
import { DataGrid } from '@src/pages/components/DataGrid';

test.describe('Edit Facility tests', () => {
    test.describe.configure({ mode: 'parallel' });

    test('View an existing facility @Facility @TC-LOC-002', async ({
        page,
        facilityApiClient,
        facilityRepository,
    }, testInfo) => {
        Logger.info('--- START TEST: View an existing facility ---');
        await AllureUtil.setTestDetails({
            epic: 'Facilities Management',
            feature: 'UI Workflows',
            story: 'View Facility',
            severity: 'critical',
            owner: 'Priyank',
            tags: ['Regression', 'UI'],
            testCaseId: 'TC-LOC-002',
            parentSuite: 'SentinelX',
            suite: 'Facility Module',
            subSuite: 'View Facility'
        });

        const facilityData = createUniqueFacilityData(validFacility, testInfo.workerIndex, 'view');
        const facilitiesPage = new Facilities(page);
        const common = new Common(page);
        const datagrid = new DataGrid(page);

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

            await AllureUtil.step(page, 'Open Facilities and search for the facility', async () => {
                await openFacilitiesPage(page, facilitiesPage);
                Logger.info(`Searching for facility: ${facilityData.facilityName}`);
                await common.enterSearchText(facilityData.facilityName);

                await datagrid.verifyHeaders(facilityHeaders);
                await datagrid.verifyRowByField('name', facilityData.facilityName, {
                    name: facilityData.facilityName,
                    address_line_1: facilityData.facilityAddressLineOne,
                    city: facilityData.city,
                    state: facilityData.state,
                    country: facilityData.country,
                    timeRegionName: facilityTimeregion,
                    pincode: facilityData.pinCode,
                    regions_count: '0',
                    active_streams_count: '0',
                });
                await datagrid.verifyActionsForRow(0, ['View', 'Edit', 'Delete']);
            });

            await AllureUtil.step(page, 'Open the facility details', async () => {
                await common.clickViewIcon();
            });

            await AllureUtil.step(page, 'Validate all facility fields', async () => {
                Logger.info('Validating facility fields on details page...');
                await common.verifyFieldValue(page, 'Name', facilityData.facilityName);
                await common.verifyFieldValue(
                    page,
                    'Address Line 1',
                    facilityData.facilityAddressLineOne,
                );
                await common.verifyFieldValue(
                    page,
                    'Address Line 2',
                    facilityData.facilityAddressLineTwo,
                );
                await common.verifyFieldValue(page, 'City', facilityData.city);
                await common.verifyFieldValue(page, 'Pin Code', facilityData.pinCode);
                await common.verifyFieldValue(page, 'State/Province', facilityData.state);
                await common.verifyFieldValue(page, 'Country', facilityData.country);
                Logger.info('Successfully verified all facility details fields.');
            });
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
            Logger.info('--- END TEST: View an existing facility ---');
        }
    });

    test('Edit an existing facility @Facility @TC-LOC-003', async ({
        page,
        facilityApiClient,
        facilityRepository,
    }, testInfo) => {
        Logger.info('--- START TEST: Edit an existing facility ---');
        await AllureUtil.setTestDetails({
            epic: 'Facilities Management',
            feature: 'UI Workflows',
            story: 'Edit Facility',
            severity: 'critical',
            owner: 'Priyank',
            tags: ['Regression', 'UI'],
            description: 'Verify facility update form, save changes, and validate on API and DB.',
            testCaseId: 'TC-LOC-003',
            parentSuite: 'SentinelX',
            suite: 'Facility Module',
            subSuite: 'Edit Facility'
        });

        const originalFacility = createUniqueFacilityData(
            validFacility,
            testInfo.workerIndex,
            'edit-original',
        );
        const updatedFacility = createUniqueFacilityData(
            editFacility,
            testInfo.workerIndex,
            'edit-updated',
        );
        const facilitiesPage = new Facilities(page);
        const common = new Common(page);
        const datagrid = new DataGrid(page);

        let facilityId: number | undefined;

        try {
            await AllureUtil.step(page, 'Prerequisite: Create the facility required by this test', async () => {
                Logger.info(
                    `Creating original facility through UI: ${originalFacility.facilityName}`,
                );
                const created = await createFacilityThroughUi(
                    page,
                    facilityApiClient,
                    originalFacility,
                );
                facilityId = created.id;
                Logger.info(`Original facility created successfully. ID: ${facilityId}`);
            });

            await AllureUtil.step(page, 'Search for the original facility', async () => {
                await openFacilitiesPage(page, facilitiesPage);
                Logger.info(`Searching for original facility: ${originalFacility.facilityName}`);
                await common.enterSearchText(originalFacility.facilityName);
            });

            await AllureUtil.step(page, 'Open the facility editor', async () => {
                await common.clickEditIcon();
            });

            await AllureUtil.step(page, 'Update all facility fields', async () => {
                Logger.info(
                    `Updating facility form with edit values. New Name: ${updatedFacility.facilityName}`,
                );
                await populateFacilityForm(facilitiesPage, updatedFacility);
            });

            await AllureUtil.step(page, 'Save the facility changes', async () => {
                await common.clickUpdateButton();
            });

            await AllureUtil.step(page, 'Verify the updated facility in the search grid', async () => {
                await common.enterSearchText(updatedFacility.facilityName);
                await datagrid.verifyHeaders(facilityHeaders);
                await datagrid.verifyRowByField('name', updatedFacility.facilityName, {
                    name: updatedFacility.facilityName,
                    address_line_1: updatedFacility.facilityAddressLineOne,
                    city: updatedFacility.city,
                    state: updatedFacility.state,
                    country: updatedFacility.country,
                    timeRegionName: facilityTimeregion,
                    pincode: updatedFacility.pinCode,
                    regions_count: '0',
                    active_streams_count: '0',
                });
                await common.enterSearchText(updatedFacility.facilityName);
                await datagrid.verifyActionsForRow(0, ['View', 'Edit', 'Delete']);
            });

            await AllureUtil.step(page, 'Validate the updated facility in the API', async () => {
                Logger.info(
                    `Validating updated facility in API by name: ${updatedFacility.facilityName}`,
                );
                const apiFacility = await facilityApiClient.getFacilityByName(
                    updatedFacility.facilityName,
                );
                expect(apiFacility.id).toBe(facilityId);
                expect(apiFacility).toMatchObject({
                    name: updatedFacility.facilityName,
                    addressLineOne: updatedFacility.facilityAddressLineOne,
                    addressLineTwo: updatedFacility.facilityAddressLineTwo,
                    city: updatedFacility.city,
                    state: updatedFacility.state,
                    country: updatedFacility.country,
                    pinCode: updatedFacility.pinCode,
                    timeregion: '-06:00 GMT',
                });
                Logger.info('Successfully validated updated facility through API.');
            });

            await AllureUtil.step(page, 'Validate all updated fields in the database', async () => {
                if (facilityId === undefined) {
                    throw new Error('Facility ID is unavailable');
                }
                Logger.info(`Validating updated facility in database for ID ${facilityId}`);
                const dbFacility = await facilityRepository.getFacilityById(facilityId);
                expect(dbFacility).toMatchObject({
                    id: facilityId,
                    name: updatedFacility.facilityName,
                    addressLineOne: updatedFacility.facilityAddressLineOne,
                    addressLineTwo: updatedFacility.facilityAddressLineTwo,
                    city: updatedFacility.city,
                    state: updatedFacility.state,
                    country: updatedFacility.country,
                    pincode: updatedFacility.pinCode,
                    timeregion: '-06:00 GMT',
                    isActive: true,
                });
                Logger.info('Successfully validated updated facility in the database.');
            });
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
            Logger.info('--- END TEST: Edit an existing facility ---');
        }
    });
});
