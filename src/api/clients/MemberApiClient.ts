import { APIRequestContext } from "playwright-core";
import { BaseApiClient } from "@src/api/base/BaseApiClient";
import { MemberFormData } from "@src/models/ui/MemberUiModel";
import {
    MemberApiItem,
    RawMemberApiItem,
    validateMemberList,
    validateRawMemberList,
    validateRawSingleMember,
    MemberApiResponse
} from '@src/models/api/MemberApiModels';
import { config } from '@src/config/environment';
import { expect } from "playwright/test";
import { MemberEndpoints } from "@src/api/endpoints/MemberEndpoints";
import { Logger } from "@src/reporting/logging/Logger";

function isMemberApiResponse(value: unknown): value is MemberApiResponse {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        return false;
    }

    const response = value as Record<string, unknown>;
    return typeof response.status === 'string' && typeof response.message === 'string' && Array.isArray(response.data);
}

function isRawMemberApiItemArray(value: unknown): value is RawMemberApiItem[] {
    return Array.isArray(value);
}

interface MemberCreationApiResponse {
    member_id: number;
    first_name?: string;
    firstname?: string;
    client_id?: number;
    clientid?: number;
    last_name?: string | null;
    lastname?: string | null;
    profile_id: number;
    profile_name?: string | null;
    email: string;
    super_member: boolean;
    is_verified: boolean;
    temp_inactive?: boolean;
}

export class MemberApiClient extends BaseApiClient {
    constructor(request: APIRequestContext) {
        super(request);
    }

    /**
     * Creates a new member via POST /api/add_member
     */
    async createMember(memberData: MemberFormData, profileId?: number): Promise<MemberApiItem> {
        let finalProfileId = profileId;
        if (!finalProfileId) {
            try {
                const profilesResponse = await this.sendRequest('GET', '/api/profiles/');
                const profilesBody = await profilesResponse.json() as { data: Array<{ name: string; id: number }> };
                const auditorProfile = profilesBody.data.find((r) => r.name === 'Auditor');
                finalProfileId = auditorProfile ? auditorProfile.id : 25;
            } catch {
                finalProfileId = 25;
            }
        }

        const response = await this.sendRequest('POST', MemberEndpoints.CREATE, {
            data: {
                client_id: 1,
                first_name: memberData.firstname,
                email: memberData.email,
                super_member: false,
                is_verified: false,
                profile_id: finalProfileId,
                temp_inactive: false
            }
        });
        expect(response.ok(), `POST ${MemberEndpoints.CREATE} failed with status ${response.status()}`).toBeTruthy();

        const body = (await response.json()) as MemberCreationApiResponse;
        const mappedMember: MemberApiItem = {
            member_id: body.member_id,
            firstname: body.first_name || body.firstname || '',
            clientid: body.client_id || body.clientid || 1,
            lastname: body.last_name || body.lastname || null,
            profile_id: body.profile_id,
            profile_name: body.profile_name || null,
            email: body.email,
            super_member: body.super_member,
            is_verified: body.is_verified,
            temp_inactive: body.temp_inactive || false
        };

        const valid = validateRawSingleMember(mappedMember);
        if (!valid) {
            throw new Error(`AJV Single Member Validation failed for POST: ${JSON.stringify(validateRawSingleMember.errors, null, 2)}`);
        }

        return mappedMember;
    }

    /**
     * Gets all members via GET api/member/get-members
     */
    async getAllMembers(): Promise<MemberApiResponse> {
        const response = await this.sendRequest('GET', MemberEndpoints.GET_ALL);
        expect(response.ok(), `GET ${MemberEndpoints.GET_ALL} failed with status ${response.status()}`).toBeTruthy();

        const body = (await response.json()) as unknown;
        if (Array.isArray(body)) {
            const valid = validateRawMemberList(body);
            if (!valid) {
                throw new Error(`AJV Member List Validation failed for GET array response: ${JSON.stringify(validateRawMemberList.errors, null, 2)}`);
            }
            if (!isRawMemberApiItemArray(body)) {
                throw new Error('GET /api/member/get-members returned an unexpected array shape');
            }
            return { status: '', message: '', data: body };
        }

        const valid = validateMemberList(body);
        if (!valid) {
            throw new Error(`AJV Member List Validation failed for GET: ${JSON.stringify(validateMemberList.errors, null, 2)}`);
        }

        if (!isMemberApiResponse(body)) {
            throw new Error('GET /api/member/get-members returned an unexpected response shape');
        }

        return body;
    }

    /**
     * Gets single member details via GET /api/member/{id}
     */
    async getMemberById(id: number, retries = 5, delayMs = 500): Promise<MemberApiItem> {
        let member;
        for (let i = 0; i < retries; i++) {
            const allMembers = await this.getAllMembers();
            member = allMembers.data.find((item) => item.member_id === id);
            if (member) {
                break;
            }
            if (i < retries - 1) {
                Logger.info(`Member ID ${id} not found in list, retrying in ${delayMs}ms... (attempt ${i + 1}/${retries})`);
                await new Promise((resolve) => setTimeout(resolve, delayMs));
            }
        }

        expect(member, `Member with ID ${id} was not found`).toBeDefined();
        if (!member) {
            throw new Error(`Member with ID ${id} was not found`);
        }

        const valid = validateRawSingleMember(member);
        if (!valid) {
            throw new Error(`AJV Single Member validation failed for ID ${id}: ${JSON.stringify(validateRawSingleMember.errors, null, 2)}`);
        }
        return member;
    }

    /**
     * Resolves a member by email.
     */
    async getMemberByEmail(email: string, retries = 5, delayMs = 500): Promise<MemberApiItem> {
        let member;
        for (let i = 0; i < retries; i++) {
            const listBody = await this.getAllMembers();
            member = listBody.data.find((item) => item.email === email);
            if (member) {
                break;
            }
            if (i < retries - 1) {
                Logger.info(`Member "${email}" not found in list, retrying in ${delayMs}ms... (attempt ${i + 1}/${retries})`);
                await new Promise((resolve) => setTimeout(resolve, delayMs));
            }
        }

        expect(member, `Member "${email}" was not found in the list response`).toBeDefined();
        if (!member) {
            throw new Error(`Member "${email}" was not found in the list response`);
        }
        return await this.getMemberById(member.member_id);
    }

    /**
     * Updates an existing member via PUT /api/update_member
     */
    async updateMember(id: number, updateData: Partial<MemberFormData>, profileId?: number): Promise<MemberApiItem> {
        let finalProfileId = profileId;
        if (!finalProfileId) {
            try {
                const currentMember = await this.getMemberById(id);
                finalProfileId = currentMember.profile_id;
            } catch {
                finalProfileId = 25;
            }
        }

        const response = await this.sendRequest('PUT', MemberEndpoints.UPDATE, {
            data: {
                client_id: 1,
                email: updateData.email,
                first_name: updateData.firstname,
                is_verified: true,
                profile_id: finalProfileId,
                super_member: false,
                temp_inactive: false,
                member_id: id
            }
        });
        expect(response.ok(), `PUT ${MemberEndpoints.UPDATE} failed with status ${response.status()}`).toBeTruthy();

        const body = (await response.json()) as MemberCreationApiResponse;
        const mappedMember: MemberApiItem = {
            member_id: body.member_id,
            firstname: body.first_name || body.firstname || '',
            clientid: body.client_id || body.clientid || 1,
            lastname: body.last_name || body.lastname || null,
            profile_id: body.profile_id,
            profile_name: body.profile_name || null,
            email: body.email,
            super_member: body.super_member,
            is_verified: body.is_verified,
            temp_inactive: body.temp_inactive || false
        };

        const valid = validateRawSingleMember(mappedMember);
        if (!valid) {
            throw new Error(`AJV Single Member validation failed for PUT ID ${id}: ${JSON.stringify(validateRawSingleMember.errors, null, 2)}`);
        }

        return mappedMember;
    }

    /**
     * Deletes (deactivates) an existing member via DELETE /api/deactivate-member/{id}
     */
    async deleteMember(id: number): Promise<void> {
        const response = await this.sendRequest('DELETE', MemberEndpoints.DELETE(id, config.createdBy));
        expect(response.ok(), `DELETE ${MemberEndpoints.DELETE(id, config.createdBy)} failed with status ${response.status()}`).toBeTruthy();
    }


}
