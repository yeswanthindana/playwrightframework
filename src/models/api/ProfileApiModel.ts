import Ajv from 'ajv';

// Create AJV instance for JSON schema validation
const ajv = new Ajv({
    allErrors: true, // Report all validation errors
    coerceTypes: true, // Automatically convert compatible types
    useDefaults: true, // Apply default values from schema
});

// Profile API models matching openapi.json

export interface PrivilegeCreate {
    screen_id: number;
    can_add?: boolean;
    can_edit?: boolean;
    can_delete?: boolean;
}

export interface ProfileStreamItem {
    stream_id: number;
}

export interface LayoutStream {
    stream_id: number;
    order_index: number;
}

export interface ProfileLayoutGroup {
    id?: number | null;
    name: string;
    order_index: number;
    panes_per_row: number;
    layout_streams?: LayoutStream[];
}

export interface ProfileCreatePayload {
    name: string;
    description?: string | null;
    client_id: number;
    profile_privileges: PrivilegeCreate[];
    profile_streams?: ProfileStreamItem[];
    profile_layout_groups?: ProfileLayoutGroup[] | null;
}

export interface ProfileUpdatePayload {
    name?: string;
    description?: string | null;
    client_id?: number;
    profile_privileges?: PrivilegeCreate[];
    profile_streams?: ProfileStreamItem[];
    profile_layout_groups?: ProfileLayoutGroup[] | null;
}

export interface ProfileRead {
    id: number;
    name: string;
    description?: string | null;
    client_id: number;
    is_active: boolean;
    is_system_super_admin: boolean;
}

export interface ProfileAllRead {
    id: number;
    name: string;
    description?: string | null;
    client_id: number;
    is_system_super_admin: boolean;
    member_count: number;
}

export interface ProfileStreamsMinimal {
    id: number;
    name: string;
    facility_id: number;
}

// Success responses

export interface ProfileResponse {
    status: string;
    message: string;
    data: ProfileRead;
}

export interface ProfileAllListResponse {
    status: string;
    message: string;
    data: ProfileAllRead[];
}

export interface ProfileStreamsMinimalResponse {
    status: string;
    message: string;
    data: ProfileStreamsMinimal[];
}

// AJV Schema for single ProfileRead response (SuccessResponse[ProfileRead])
export const singleProfileSchema = {
    type: 'object',
    properties: {
        status: { type: 'string' },
        message: { type: 'string' },
        data: {
            type: 'object',
            properties: {
                id: { type: 'integer' },
                name: { type: 'string' },
                description: { type: ['string', 'null'] },
                client_id: { type: 'integer' },
                is_active: { type: 'boolean' },
                is_system_super_admin: { type: 'boolean' },
            },
            required: ['id', 'name', 'client_id', 'is_active'],
        },
    },
    required: ['status', 'message', 'data'],
    additionalProperties: true,
};

// AJV Schema for list of ProfileAllRead response (SuccessResponse[list[ProfileAllRead]])
export const profileListSchema = {
    type: 'object',
    properties: {
        status: { type: 'string' },
        message: { type: 'string' },
        data: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    name: { type: 'string' },
                    description: { type: ['string', 'null'] },
                    client_id: { type: 'integer' },
                    is_system_super_admin: { type: 'boolean' },
                    member_count: { type: 'integer' },
                },
                required: ['id', 'name', 'client_id', 'member_count'],
            },
        },
    },
    required: ['status', 'message', 'data'],
    additionalProperties: true,
};

// AJV Schema for ProfileStreamsMinimal list response (SuccessResponse[List[ProfileStreamsMinimal]])
export const profileStreamsMinimalListSchema = {
    type: 'object',
    properties: {
        status: { type: 'string' },
        message: { type: 'string' },
        data: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    name: { type: 'string' },
                    facility_id: { type: 'integer' },
                },
                required: ['id', 'name', 'facility_id'],
            },
        },
    },
    required: ['status', 'message', 'data'],
    additionalProperties: true,
};

// Compile AJV validation functions
export const validateSingleProfile = ajv.compile(singleProfileSchema);
export const validateProfileList = ajv.compile(profileListSchema);
export const validateProfileStreamsMinimalList = ajv.compile(profileStreamsMinimalListSchema);

// Legacy support aliases
export type ProfileApiItem = ProfileRead;
export type RawProfileApiItem = ProfileAllRead;
export type ProfileApiResponse = ProfileAllListResponse;
export type SingleProfileMinimalApiResponse = ProfileStreamsMinimalResponse;
export const validateMinimalProfileList = validateProfileStreamsMinimalList;
export const validateMinimalProfileListErrors = validateProfileStreamsMinimalList;
