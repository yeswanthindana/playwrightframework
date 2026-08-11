import { test, expect } from '@playwright/test';
import { AllureUtil } from '../src/utils/AllureUtil';
import { Logger } from '../src/utils/logger';
import { JsonDataUtil } from '../src/utils/jsonUtils';

const facilityIdKey = 'facilityId';
const facilityNameKey = 'facilityName';

function saveRealTimeFacilityState(facilityId: string, facilityName: string) {
    JsonDataUtil.saveValue(facilityIdKey, facilityId);
    JsonDataUtil.saveValue(facilityNameKey, facilityName);
}

function getRunTimeFacilityId(): number {
    return JsonDataUtil.getValue<number>(facilityIdKey);
}

test.describe.serial('Facility API CRUD', () => {
    test.afterAll(() => {
        JsonDataUtil.removeValue(facilityIdKey);
        JsonDataUtil.removeValue(facilityNameKey);
    });
    test('Create Facility via API', async ({ request }) => {
        await AllureUtil.setTestDetails(
            'Setup',
            'Facilities',
            'Create Facility via API',
            'critical',
        );
        await AllureUtil.addOwner('Yeswanth');
        await AllureUtil.addTag('API-e2e');
        const facilityName = `Automation Facility ${Date.now()}`;
        const requestBody = {
            name: facilityName,
            address_line_1: '123 Test Street',
            address_line_2: 'Suite 10',
            city: 'Hyderabad',
            state: 'Telangana',
            country: 'India',
            pincode: '500001',
            timeregion: '+05:30 GMT',
            regions: [],
            created_by: 50,
        };
        Logger.info('Request Body : ' + JSON.stringify(requestBody, null, 2));
        const response = await request.post('/api/facility/', {
            data: requestBody,
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        });
        const responseBody = await response.json();
        Logger.info('Response Body : ' + JSON.stringify(responseBody, null, 2));
        expect(response.status()).toBe(201);
        expect(responseBody.status).toBe('success');

        const facilityId = responseBody.data.id;
        Logger.info('Facility ID : ' + facilityId);
        saveRealTimeFacilityState(facilityId, facilityName);
    });

    test('Edit Facility via API', async ({ request }) => {
        await AllureUtil.setTestDetails(
            'Regression',
            'Facilities',
            'Edit Facility via API',
            'critical',
        );
        await AllureUtil.addOwner('Yeswanth');
        await AllureUtil.addTag('API-e2e');

        const facilityId = getRunTimeFacilityId();
        const updatedFacilityName = `Updated Automation Facility ${Date.now()}`;

        const requestBody = {
            name: updatedFacilityName,
            address_line_1: `123 Test Street ${Date.now()}`,
            address_line_2: `Suite 10 ${Date.now()}`,
            city: `Hyderabad ${Date.now()}`,
            state: 'Telangana',
            country: 'India',
            pincode: '500001',
            timeregion: '+05:30 GMT',
            regions: [],
            updated_by: 50,
        };
        Logger.info('Request Body : ' + JSON.stringify(requestBody, null, 2));
        const response = await request.patch(`/api/facility/${facilityId}`, {
            data: requestBody,
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        });
        const responseBody = await response.json();
        Logger.info('Response Body : ' + JSON.stringify(responseBody, null, 2));
        expect(response.status()).toBe(200);
        expect(responseBody.status).toBe('success');

        JsonDataUtil.saveValue(facilityNameKey, updatedFacilityName);
    });

    test('Delete Facility via API', async ({ request }) => {
        await AllureUtil.addOwner('Yeswanth');
        await AllureUtil.addTag('API-e2e');

        const facilityId = getRunTimeFacilityId();

        const requestBody = {
            updated_by: 50,
        };
        Logger.info('Request Body : ' + JSON.stringify(requestBody, null, 2));
        const response = await request.delete(`/api/facility/${facilityId}`, {
            data: requestBody,
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        });
        const responseBody = await response.json();
        Logger.info('Response Body : ' + JSON.stringify(responseBody, null, 2));
        expect(response.status()).toBe(200);
        expect(responseBody.status).toBe('success');
    });
});
