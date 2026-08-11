import Ajv from 'ajv';

// Create AJV instance for JSON schema validation
const ajv = new Ajv({
    allErrors: true,   // Report all validation errors
    coerceTypes: true, // Automatically convert compatible types
    useDefaults: true, // Apply default values from schema
});

// Standardized representation for testing assertions
export interface MemberApiItem {
    member_id: number;
    clientid: number;
    profile_id: number;
    profile_name: string | null;
    firstname: string;
    lastname: string | null;
    email: string;
    super_member: boolean;
    is_verified: boolean;
    temp_inactive: boolean;
}

// Raw item representation from GET all / list response
export interface RawMemberApiItem {
    member_id: number;
    clientid: number;
    profile_id: number;
    profile_name: string | null;
    firstname: string;
    lastname: string | null;
    email: string;
    super_member: boolean;
    is_verified: boolean;
    temp_inactive: boolean;
}

export interface MemberApiResponse {
    status: string;
    message: string;
    data: RawMemberApiItem[];
}

export interface SingleRawMemberApiItem {
    member_id: number;
    clientid: number;
    profile_id: number;
    profile_name: string | null;
    firstname: string;
    lastname: string | null;
    email: string;
    super_member: boolean;
    is_verified: boolean;
    temp_inactive: boolean;
}

export interface MemberListArrayResponse {
    data: RawMemberApiItem[];
}

export interface SingleRawMemberMinimalApiItem {
    id: number;
    name: string;
}

export interface SingleMemberMinimalApiResponse {
    status: string;
    message: string;
    data: SingleRawMemberMinimalApiItem[];
}

export interface SingleMemberApiResponse {
    status: string;
    message: string;
    data: RawMemberApiItem[];
}

// AJV Schema for single member item
export const singleMemberSchema = {
    type: 'object',
    properties: {
        status: { type: 'string' },
        message: { type: 'string' },
        data: {
            type: 'object',
            properties: {
                member_id: { type: 'integer' },
                clientid: { type: 'integer' },
                profile_id: { type: 'integer' },
                profile_name: { type: ['string', 'null'] },
                firstname: { type: 'string' },
                lastname: { type: ['string', 'null'] },
                email: { type: 'string' },
                super_member: { type: 'boolean' },
                is_verified: { type: 'boolean' },
                temp_inactive: { type: 'boolean' }
            },
            required: ['member_id', 'email', 'profile_id', 'firstname']
        }
    },
    required: ['status', 'message', 'data'],
    additionalProperties: true
};

// AJV Schema for member list response
export const memberListSchema = {
    type: 'object',
    properties: {
        status: { type: 'string' },
        message: { type: 'string' },
        data: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    member_id: { type: 'integer' },
                    clientid: { type: 'integer' },
                    profile_id: { type: 'integer' },
                    profile_name: { type: ['string', 'null'] },
                    firstname: { type: 'string' },
                    lastname: { type: ['string', 'null'] },
                    email: { type: 'string' },
                    super_member: { type: 'boolean' },
                    is_verified: { type: 'boolean' },
                    temp_inactive: { type: 'boolean' }
                },
                required: ['member_id', 'email', 'profile_id', 'firstname']
            }
        }
    },
    required: ['status', 'message', 'data'],
    additionalProperties: true
};

export const rawMemberListSchema = {
    type: 'array',
    items: {
        type: 'object',
        properties: {
            member_id: { type: 'integer' },
            clientid: { type: 'integer' },
            profile_id: { type: 'integer' },
            profile_name: { type: ['string', 'null'] },
            firstname: { type: 'string' },
            lastname: { type: ['string', 'null'] },
            email: { type: 'string' },
            super_member: { type: 'boolean' },
            is_verified: { type: 'boolean' },
            temp_inactive: { type: 'boolean' }
        },
        required: ['member_id', 'email', 'profile_id', 'firstname'],
        additionalProperties: true
    }
};

export const rawSingleMemberSchema = {
    type: 'object',
    properties: {
        member_id: { type: 'integer' },
        clientid: { type: 'integer' },
        profile_id: { type: 'integer' },
        profile_name: { type: ['string', 'null'] },
        firstname: { type: 'string' },
        lastname: { type: ['string', 'null'] },
        email: { type: 'string' },
        super_member: { type: 'boolean' },
        is_verified: { type: 'boolean' },
        temp_inactive: { type: 'boolean' }
    },
    required: ['member_id', 'email', 'profile_id', 'firstname'],
    additionalProperties: true
};

export const memberMinimalListSchema = {
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
                    name: { type: 'string' }
                },
                required: ['id', 'name'],
                additionalProperties: true
            }
        }
    }
};

export const validateSingleMember = ajv.compile(singleMemberSchema);
export const validateMemberList = ajv.compile(memberListSchema);
export const validateRawMemberList = ajv.compile(rawMemberListSchema);
export const validateRawSingleMember = ajv.compile(rawSingleMemberSchema);
export const validateMinimalMemberList = ajv.compile(memberMinimalListSchema);
