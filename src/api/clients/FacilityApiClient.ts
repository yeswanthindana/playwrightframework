import { APIRequestContext, expect } from '@playwright/test';
import { BaseApiClient } from '@src/api/base/BaseApiClient';
import { FacilityFormData } from '@src/models/ui/FacilityUiModel';
import {
    FacilityApiItem,
    validateFacilityList,
    validateSingleFacility,
    FacilityApiResponse,
    SingleFacilityMinimalApiResponse,
    SingleFacilityApiResponse,
    validateMinimalFacilityList,
} from '@src/models/api/FacilityApiModel';
import { config } from '@src/config/environment';
import { FacilityEndpoints } from '@src/api/endpoints/FacilityEndpoints';

export class FacilityApiClient extends BaseApiClient {
    constructor(request: APIRequestContext) {
        super(request);
    }
    async createFacility(facilityData: FacilityFormData) {
        const response = await this.sendRequest('POST', FacilityEndpoints.CREATE, {
            data: {
                name: facilityData.facilityName,
                address_line_1: facilityData.facilityAddressLineOne,
                address_line_2: facilityData.facilityAddressLineTwo,
                city: facilityData.city,
                pincode: facilityData.pinCode,
                state: facilityData.state,
                country: facilityData.country,
                timeregion: '-06:00 GMT',
                regions: [],
                created_by: config.createdBy,
            },
        });
        expect(response.ok(), `POST ${FacilityEndpoints.CREATE} failed with status ${response.status()}`,).toBeTruthy();

        const body = (await response.json()) as SingleFacilityApiResponse;
        const valid = validateSingleFacility(body);
        if (!valid) {
            throw new Error(
                `AJV Single Facility validation failed for POST: ${JSON.stringify(validateSingleFacility.errors, null, 2)}`,
            );
        }
        const data = body.data;
        return {
            id: data.id,
            name: data.name,
            addressLineOne: data.address_line_1,
            addressLineTwo: data.address_line_2,
            city: data.city,
            state: data.state,
            country: data.country,
            pinCode: data.pincode,
            timeregion: data.timeregion,
        };
    }

    /**
     * Gets all facilities via GET /api/facility/
     */
    async getAllFacilities(): Promise<FacilityApiResponse> {
        const response = await this.sendRequest('GET', FacilityEndpoints.GET_ALL);
        expect(
            response.ok(),
            `GET ${FacilityEndpoints.GET_ALL} failed with status ${response.status()}`,
        ).toBeTruthy();

        const body = (await response.json()) as FacilityApiResponse;
        const valid = validateFacilityList(body);
        if (!valid) {
            throw new Error(
                `AJV Facility List validation failed: ${JSON.stringify(validateFacilityList.errors, null, 2)}`,
            );
        }

        return body;
    }

    /**
     * Gets single facility details via GET /api/facility/{id}
     */
    async getFacilityById(id: number): Promise<FacilityApiItem> {
        const response = await this.sendRequest('GET', FacilityEndpoints.GET_BY_ID(id));
        expect(
            response.ok(),
            `GET ${FacilityEndpoints.GET_BY_ID(id)} failed with status ${response.status()}`,
        ).toBeTruthy();

        const body = (await response.json()) as SingleFacilityApiResponse;
        const valid = validateSingleFacility(body);
        if (!valid) {
            throw new Error(
                `AJV Single Facility validation failed for ID ${id}: ${JSON.stringify(validateSingleFacility.errors, null, 2)}`,
            );
        }

        const data = body.data;
        return {
            id: data.id,
            name: data.name,
            addressLineOne: data.address_line_1,
            addressLineTwo: data.address_line_2,
            city: data.city,
            state: data.state,
            country: data.country,
            pinCode: data.pincode,
            timeregion: data.timeregion,
        };
    }

    /**
     * Resolves a facility by name. Hits list endpoint, gets ID, and fetches full details via single endpoint.
     */
    async getFacilityByName(name: string): Promise<FacilityApiItem> {
        const listBody = await this.getAllFacilities();
        const facility = listBody.data.find((item) => item.name === name);
        expect(facility, `Facility "${name}" was not found in the list response`).toBeDefined();
        if (!facility) {
            throw new Error(`Facility "${name}" was not found in the list response`);
        }
        return await this.getFacilityById(facility.id);
    }

    /**
     * Updates an existing facility via PATCH /api/facility/{id}
     */
    async updateFacility(id: number, updateData: Partial<FacilityFormData>,): Promise<FacilityApiItem> {
        const patchPayload: Record<string, unknown> = {
            updated_by: config.createdBy,
            regions: [],
        };
        if (updateData.facilityName !== undefined) {
            patchPayload.name = updateData.facilityName;
        }
        if (updateData.facilityAddressLineOne !== undefined) {
            patchPayload.address_line_1 = updateData.facilityAddressLineOne;
        }
        if (updateData.facilityAddressLineTwo !== undefined) {
            patchPayload.address_line_2 = updateData.facilityAddressLineTwo;
        }
        if (updateData.city !== undefined) {
            patchPayload.city = updateData.city;
        }
        if (updateData.pinCode !== undefined) {
            patchPayload.pincode = updateData.pinCode;
        }
        if (updateData.state !== undefined) {
            patchPayload.state = updateData.state;
        }
        if (updateData.country !== undefined) {
            patchPayload.country = updateData.country;
        }

        const response = await this.sendRequest('PATCH', FacilityEndpoints.UPDATE(id), {
            data: patchPayload,
        });
        expect(response.ok(), `PATCH ${FacilityEndpoints.UPDATE(id)} failed with status ${response.status()}`,).toBeTruthy();

        const body = (await response.json()) as SingleFacilityApiResponse;
        const valid = validateSingleFacility(body);
        if (!valid) {
            throw new Error(
                `AJV Single Facility validation failed for PATCH ID ${id}: ${JSON.stringify(validateSingleFacility.errors, null, 2)}`,
            );
        }

        const data = body.data;
        return {
            id: data.id,
            name: data.name,
            addressLineOne: data.address_line_1,
            addressLineTwo: data.address_line_2,
            city: data.city,
            state: data.state,
            country: data.country,
            pinCode: data.pincode,
            timeregion: data.timeregion,
        };
    }

    /**
     * Deletes (deactivates) an existing facility via DELETE /api/facility/{id}
     */
    async deleteFacility(id: number): Promise<void> {
        const response = await this.sendRequest('DELETE', FacilityEndpoints.DELETE(id), {
            data: {
                updated_by: config.createdBy,
            },
        });
        expect(
            response.ok(),
            `DELETE ${FacilityEndpoints.DELETE(id)} failed with status ${response.status()}`,
        ).toBeTruthy();
    }

    async getMinimalFacilities(): Promise<SingleFacilityMinimalApiResponse> {
        const response = await this.sendRequest('GET', FacilityEndpoints.GET_MINIMAL);
        expect(
            response.ok(),
            `GET ${FacilityEndpoints.GET_MINIMAL} failed with status ${response.status()}`,
        ).toBeTruthy();

        const body = (await response.json()) as SingleFacilityMinimalApiResponse;

        const valid = validateMinimalFacilityList(body);
        if (!valid) {
            throw new Error(
                `AJV Facility List validation failed: ${JSON.stringify(validateMinimalFacilityList.errors, null, 2)}`,
            );
        }
        return body;
    }
}
