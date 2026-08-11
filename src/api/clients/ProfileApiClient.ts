import { APIRequestContext, expect } from '@playwright/test';
import { BaseApiClient } from '@src/api/base/BaseApiClient';
import { ProfileFormData } from '@src/models/ui/ProfileUiModel';
import {
    ProfileApiItem,
    ProfileApiResponse,
    SingleProfileMinimalApiResponse,
    validateProfileList,
    validateSingleProfile,
    validateMinimalProfileList,
    ProfileCreatePayload,
    ProfileUpdatePayload,
    ProfileResponse,
} from '@src/models/api/ProfileApiModel';
import { config } from '@src/config/environment';
import { ProfileEndpoints } from '@src/api/endpoints/ProfileEndpoints';
import { Logger } from '@src/reporting/logging/Logger';

export class ProfileApiClient extends BaseApiClient {
    constructor(request: APIRequestContext) {
        super(request);
    }

    /**
     * Gets member profiles using GET /api/member/get-profiles
     */
    async getMemberProfiles(): Promise<unknown> {
        const response = await this.sendRequest('GET', ProfileEndpoints.GET_USER_ROLES);
        expect(
            response.ok(),
            `GET ${ProfileEndpoints.GET_USER_ROLES} failed with status ${response.status()}`,
        ).toBeTruthy();
        return await response.json();
    }

    /**
     * Deactivates a profile using DELETE /api/deactivate-profile/{profile_id}
     */
    async deactivateProfile(profileId: number): Promise<void> {
        const response = await this.sendRequest('DELETE', ProfileEndpoints.DEACTIVATE(profileId));
        expect(
            response.ok(),
            `DELETE ${ProfileEndpoints.DEACTIVATE(profileId)} failed with status ${response.status()}`,
        ).toBeTruthy();
    }

    /**
     * Gets all profiles using GET /api/profiles/
     */
    async getAllProfiles(): Promise<ProfileApiResponse> {
        const response = await this.sendRequest('GET', ProfileEndpoints.GET_ALL);
        expect(
            response.ok(),
            `GET ${ProfileEndpoints.GET_ALL} failed with status ${response.status()}`,
        ).toBeTruthy();
        const body = (await response.json()) as ProfileApiResponse;
        const valid = validateProfileList(body);
        if (!valid) {
            throw new Error(
                `AJV Profile List validation failed: ${JSON.stringify(validateProfileList.errors, null, 2)}`,
            );
        }
        return body;
    }

    /**
     * Creates a profile using POST /api/profiles/
     */
    async createProfile(profileData: ProfileFormData | ProfileCreatePayload): Promise<ProfileApiItem> {
        const payload =
            'profileName' in profileData
                ? {
                      name: profileData.profileName,
                      description: profileData.profileDescription,
                      client_id: config.createdBy || 1,
                      profile_privileges: [],
                  }
                : profileData;

        const response = await this.sendRequest('POST', ProfileEndpoints.CREATE, {
            data: payload,
        });

        expect(
            response.ok(),
            `POST ${ProfileEndpoints.CREATE} failed with status ${response.status()}`,
        ).toBeTruthy();
        const body = (await response.json()) as ProfileResponse;
        const valid = validateSingleProfile(body);
        if (!valid) {
            throw new Error(
                `AJV Single Profile validation failed for POST: ${JSON.stringify(validateSingleProfile.errors, null, 2)}`,
            );
        }
        return body.data;
    }

    /**
     * Gets a profile by ID using GET /api/profiles/{id}
     */
    async getProfileById(id: number): Promise<ProfileApiItem> {
        const response = await this.sendRequest('GET', ProfileEndpoints.GET_BY_ID(id));
        expect(
            response.ok(),
            `GET ${ProfileEndpoints.GET_BY_ID(id)} failed with status ${response.status()}`,
        ).toBeTruthy();
        const body = (await response.json()) as ProfileResponse;
        const valid = validateSingleProfile(body);
        if (!valid) {
            throw new Error(
                `AJV Single Profile validation failed for ID ${id}: ${JSON.stringify(validateSingleProfile.errors, null, 2)}`,
            );
        }
        return body.data;
    }

    /**
     * Finds a profile by name and returns its complete details.
     */
    async getProfileByName(name: string, retries = 5, delayMs = 500): Promise<ProfileApiItem> {
        let profile;
        for (let i = 0; i < retries; i++) {
            const profileList = await this.getAllProfiles();
            profile = profileList.data.find((item) => item.name === name);
            if (profile) {
                break;
            }
            if (i < retries - 1) {
                Logger.info(`Profile "${name}" not found in list, retrying in ${delayMs}ms... (attempt ${i + 1}/${retries})`);
                await new Promise((resolve) => setTimeout(resolve, delayMs));
            }
        }

        expect(profile, `Profile "${name}" was not found in the profile list`).toBeDefined();
        if (!profile) {
            throw new Error(`Profile "${name}" was not found in the profile list`);
        }

        return this.getProfileById(profile.id);
    }

    /**
     * Updates an existing profile using PATCH /api/profiles/{id}
     */
    async patchProfile(id: number, updateData: ProfileUpdatePayload): Promise<ProfileApiItem> {
        const response = await this.sendRequest('PATCH', ProfileEndpoints.UPDATE(id), {
            data: updateData,
        });
        expect(
            response.ok(),
            `PATCH ${ProfileEndpoints.UPDATE(id)} failed with status ${response.status()}`,
        ).toBeTruthy();
        const body = (await response.json()) as ProfileResponse;
        const valid = validateSingleProfile(body);
        if (!valid) {
            throw new Error(
                `AJV Single Profile validation failed for PATCH ID ${id}: ${JSON.stringify(validateSingleProfile.errors, null, 2)}`,
            );
        }
        return body.data;
    }

    /**
     * Updates an existing profile (legacy support)
     */
    async updateProfile(id: number, updateData: Partial<ProfileFormData>): Promise<ProfileApiItem> {
        const payload: ProfileUpdatePayload = {};
        if (updateData.profileName !== undefined) {
            payload.name = updateData.profileName;
        }
        if (updateData.profileDescription !== undefined) {
            payload.description = updateData.profileDescription;
        }
        return this.patchProfile(id, payload);
    }

    /**
     * Deletes a profile using DELETE /api/profiles/{id}
     */
    async deleteProfile(id: number): Promise<void> {
        const response = await this.sendRequest('DELETE', ProfileEndpoints.DELETE(id));
        expect(
            response.ok(),
            `DELETE ${ProfileEndpoints.DELETE(id)} failed with status ${response.status()}`,
        ).toBeTruthy();
    }

    /**
     * Updates a profile using PUT /api/profiles/{profile_id}
     */
    async updateProfilePut(profileId: number, profileData: unknown): Promise<unknown> {
        const response = await this.sendRequest('PUT', ProfileEndpoints.PUT_UPDATE(profileId), {
            data: profileData,
        });
        expect(
            response.ok(),
            `PUT ${ProfileEndpoints.PUT_UPDATE(profileId)} failed with status ${response.status()}`,
        ).toBeTruthy();
        return await response.json();
    }

    /**
     * Gets full profile details using GET /api/profiles/{profile_id}/full
     */
    async getProfileFull(profileId: number): Promise<unknown> {
        const response = await this.sendRequest('GET', ProfileEndpoints.GET_FULL(profileId));
        expect(
            response.ok(),
            `GET ${ProfileEndpoints.GET_FULL(profileId)} failed with status ${response.status()}`,
        ).toBeTruthy();
        return await response.json();
    }

    /**
     * Gets streams by profile using GET /api/profiles/{profile_id}/streams
     */
    async getProfileStreams(profileId: number): Promise<SingleProfileMinimalApiResponse> {
        const response = await this.sendRequest('GET', ProfileEndpoints.GET_CAMERAS(profileId));
        expect(
            response.ok(),
            `GET ${ProfileEndpoints.GET_CAMERAS(profileId)} failed with status ${response.status()}`,
        ).toBeTruthy();
        const body = (await response.json()) as SingleProfileMinimalApiResponse;
        const valid = validateMinimalProfileList(body);
        if (!valid) {
            throw new Error(
                `AJV Minimal Profile List validation failed: ${JSON.stringify(validateMinimalProfileList.errors, null, 2)}`,
            );
        }
        return body;
    }

    /**
     * Gets minimal profile data using GET /api/profile/minimal (legacy/fallback support)
     */
    async getMinimalProfiles(): Promise<SingleProfileMinimalApiResponse> {
        const response = await this.sendRequest('GET', ProfileEndpoints.GET_MINIMAL);
        expect(
            response.ok(),
            `GET ${ProfileEndpoints.GET_MINIMAL} failed with status ${response.status()}`,
        ).toBeTruthy();
        const body = (await response.json()) as SingleProfileMinimalApiResponse;
        const valid = validateMinimalProfileList(body);
        if (!valid) {
            throw new Error(
                `AJV Minimal Profile List validation failed: ${JSON.stringify(validateMinimalProfileList.errors, null, 2)}`,
            );
        }
        return body;
    }

    /**
     * Updates profile layout using PUT /api/profiles/{profile_id}/layout
     */
    async updateProfileLayout(profileId: number, layoutData: unknown): Promise<unknown> {
        const response = await this.sendRequest('PUT', ProfileEndpoints.UPDATE_LAYOUT(profileId), {
            data: layoutData,
        });
        expect(
            response.ok(),
            `PUT ${ProfileEndpoints.UPDATE_LAYOUT(profileId)} failed with status ${response.status()}`,
        ).toBeTruthy();
        return await response.json();
    }

    /**
     * Gets profile layout using GET /api/profiles/{profile_id}/layout
     */
    async getProfileLayout(profileId: number): Promise<unknown> {
        const response = await this.sendRequest('GET', ProfileEndpoints.GET_LAYOUT(profileId));
        expect(
            response.ok(),
            `GET ${ProfileEndpoints.GET_LAYOUT(profileId)} failed with status ${response.status()}`,
        ).toBeTruthy();
        return await response.json();
    }

    /**
     * Deletes profile layout using DELETE /api/profiles/{profile_id}/layout
     */
    async deleteProfileLayout(profileId: number): Promise<unknown> {
        const response = await this.sendRequest('DELETE', ProfileEndpoints.DELETE_LAYOUT(profileId));
        expect(
            response.ok(),
            `DELETE ${ProfileEndpoints.DELETE_LAYOUT(profileId)} failed with status ${response.status()}`,
        ).toBeTruthy();
        return await response.json();
    }
}

export default ProfileApiClient;
