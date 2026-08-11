import { expect, test } from '../../src/fixtures/facilitiesFixture';
import { AllureUtil } from '../../../src/utils/AllureUtil';
import { deleteFacility, editFacility, validFacility } from '../../../src/test-data/facilities.json';

test.describe.serial('Facility API e2e CRUD tests', () => {
    let facilityId: number;
    let facilityName: string;

    test('Create Facility via API', async ({ facilityApiClient, facilityRepository }) => {
        await AllureUtil.setTestDetails(
            'Setup',
            'Facilities',
            'Create Facility via API',
            'critical',
        );
        await AllureUtil.addOwner('Priyank');
        await AllureUtil.addTag('API-e2e');

        facilityName = `API-E2E-${Date.now()}`;
        const facilityData = { ...validFacility, facilityName };

        const created = await facilityApiClient.createFacility(facilityData);
        expect(created.id).toBeDefined();
        facilityId = created.id;

        // DB check
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
    });

    test('Read Facility via API', async ({ facilityApiClient }) => {
        await AllureUtil.setTestDetails('Setup', 'Facilities', 'Read Facility via API', 'critical');
        await AllureUtil.addOwner('Priyank');
        await AllureUtil.addTag('API-e2e');

        // Get by ID
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

        // Get by Name
        const apiFacilityByName = await facilityApiClient.getFacilityByName(facilityName);
        expect(apiFacilityByName.id).toBe(facilityId);
    });

    test('Update Facility via API', async ({ facilityApiClient, facilityRepository }) => {
        await AllureUtil.setTestDetails(
            'Setup',
            'Facilities',
            'Update Facility via API',
            'critical',
        );
        await AllureUtil.addOwner('Priyank');
        await AllureUtil.addTag('API-e2e');

        const updatedName = `${facilityName}-updated`;
        const updateData = { ...editFacility, facilityName: updatedName };

        const updated = await facilityApiClient.updateFacility(facilityId, updateData);
        expect(updated.name).toBe(updatedName);

        // DB check
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
    });

    test('Delete Facility via API', async ({ facilityApiClient, facilityRepository }) => {
        await AllureUtil.setTestDetails(
            'Setup',
            'Facilities',
            'Delete Facility via API',
            'critical',
        );
        await AllureUtil.addOwner('Priyank');
        await AllureUtil.addTag('API-e2e');

        await facilityApiClient.deleteFacility(facilityId);

        // DB check
        const dbFacility = await facilityRepository.getFacilityById(facilityId);
        expect(dbFacility.isActive).toBe(false);
    });
});
