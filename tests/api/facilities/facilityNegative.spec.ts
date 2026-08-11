import { expect, test } from '@src/fixtures/index';
import { AllureUtil } from '@src/reporting/allure/AllureUtil';
import { validFacility } from '@src/test-data/facilities/facilities.json';
import { config } from '@src/config/environment';

test.describe('Facilities API Negative Validations', () => {
    test.beforeEach(async () => {
        await AllureUtil.setTestDetails({
            epic: 'Facilities Management',
            feature: 'API Negative Validations',
            story: 'Facilities API Negative Validations',
            severity: 'normal',
            owner: 'Priyank',
            tags: ['API', 'Negative'],
            parentSuite: 'SentinelX',
            suite: 'Facility Module',
            subSuite: 'API Negative Validations',
        });
    });

    test('Create Facility with Missing Name field @TC-LOC-API-005', async ({
        facilityApiClient,
    }) => {
        await AllureUtil.addTestCase('TC-LOC-API-005');
        const payload = {
            address_line_1: validFacility.facilityAddressLineOne,
            address_line_2: validFacility.facilityAddressLineTwo,
            city: validFacility.city,
            pincode: validFacility.pinCode,
            state: validFacility.state,
            country: validFacility.country,
            timeregion: '-06:00 GMT',
            regions: [],
            created_by: config.createdBy,
        };

        const response = await facilityApiClient.sendRequest('POST', '/api/facility/', {
            data: payload,
        });

        expect(response.ok()).toBeFalsy();
        expect(response.status()).toBe(422);
    });

    test('Create Duplicate Facility @TC-LOC-API-006', async ({
        facilityApiClient,
        facilityRepository,
    }) => {
        await AllureUtil.addTestCase('TC-LOC-API-006');
        const facilityName = `API-DUP-${Date.now()}`;
        const payload = {
            name: facilityName,
            address_line_1: validFacility.facilityAddressLineOne,
            address_line_2: validFacility.facilityAddressLineTwo,
            city: validFacility.city,
            pincode: validFacility.pinCode,
            state: validFacility.state,
            country: validFacility.country,
            timeregion: '-06:00 GMT',
            regions: [],
            created_by: config.createdBy,
        };

        const response1 = await facilityApiClient.sendRequest('POST', '/api/facility/', {
            data: payload,
        });
        const createdBody = await response1.json();
        const facilityId = createdBody.data.id;

        try {
            const response2 = await facilityApiClient.sendRequest('POST', '/api/facility/', {
                data: payload,
            });
            expect(response2.ok()).toBeFalsy();
            expect(response2.status()).toBe(409);
        } finally {
            if (facilityId) {
                await AllureUtil.actionStep(
                    'Postrequisite: Deactivate the created facility',
                    async () => {
                        await facilityRepository.deactivateFacility(facilityId);
                    },
                );
            }
        }
    });

    test('Retrieve Non-existent Facility ID @TC-LOC-API-007', async ({ facilityApiClient }) => {
        await AllureUtil.addTestCase('TC-LOC-API-007');
        const response = await facilityApiClient.sendRequest('GET', '/api/facility/999999');
        expect(response.ok()).toBeFalsy();
        expect(response.status()).toBe(404);
    });

    test('Update Non-existent Facility ID @TC-LOC-API-008', async ({ facilityApiClient }) => {
        await AllureUtil.addTestCase('TC-LOC-API-008');
        const response = await facilityApiClient.sendRequest('PATCH', '/api/facility/999999', {
            data: {
                name: 'NonExistentUpdate',
                updated_by: config.createdBy,
            },
        });
        expect(response.ok()).toBeFalsy();
        expect(response.status()).toBe(422);
    });

    test('Delete Non-existent Facility ID @TC-LOC-API-009', async ({ facilityApiClient }) => {
        await AllureUtil.addTestCase('TC-LOC-API-009');
        const response = await facilityApiClient.sendRequest('DELETE', '/api/facility/999999', {
            data: {
                updated_by: config.createdBy,
            },
        });
        expect(response.ok()).toBeFalsy();
        expect(response.status()).toBe(404);
    });
});
