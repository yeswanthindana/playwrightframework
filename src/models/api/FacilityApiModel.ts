import Ajv from 'ajv';

// Create AJV instance for JSON schema validation
const ajv = new Ajv({
    allErrors: true, // Report all validation errors
    coerceTypes: true, // Automatically convert compatible types
    useDefaults: true, // Apply default values from schema
});

// Standardized representation for testing assertions
export interface FacilityApiItem {
    // done
    id: number;
    name: string;
    addressLineOne: string;
    addressLineTwo: string | null;
    city: string;
    state: string;
    country: string;
    pinCode: string;
    timeregion: string;
}

// Raw item representation from GET all / list response
export interface RawFacilityApiItem {
    id: number;
    name: string;
    address_line_1: string;
    address_line_2: string | null;
    city: string;
    state: string;
    country: string;
    pincode: string;
    timeregion: string;
    regions_count: number;
    active_streams_count: number;
}

export interface FacilityApiResponse {
    //done
    status: string;
    message: string;
    data: RawFacilityApiItem[];
}

export interface SingleRawFacilityMinimalApiItem {
    id: number;
    name: string;
}

export interface SingleFacilityMinimalApiResponse {
    //done
    status: string;
    message: string;
    data: SingleRawFacilityMinimalApiItem[];
}

// Raw item representation from GET single response
export interface SingleRawFacilityApiItem {
    id: number;
    name: string;
    address_line_1: string;
    address_line_2: string | null;
    city: string;
    state: string;
    country: string;
    pincode: string;
    timeregion: string;
    regions?: object[];
}

export interface SingleFacilityApiResponse {
    status: string;
    message: string;
    data: SingleRawFacilityApiItem;
}

// AJV Schema for single facility item (returned in GET /api/facility/{id} or POST response)
export const singleFacilitySchema = {
    type: 'object', // Root response must be a JSON object
    properties: {
        // Define expected root properties
        status: { type: 'string' }, // Response status
        message: { type: 'string' }, // Response message
        data: {
            // Contains the facility details
            type: 'object', // Data must be an object
            properties: {
                // Define expected facility fields
                id: { type: 'integer' }, // Unique facility ID
                name: { type: 'string' }, // Facility name
                address_line_1: { type: 'string' }, // Primary address
                address_line_2: { type: ['string', 'null'] }, // Secondary address (optional)
                city: { type: 'string' }, // City name
                state: { type: 'string' }, // State name
                country: { type: 'string' }, // Country name
                pincode: { type: 'string' }, // Postal code
                timeregion: { type: 'string' }, // Facility timeregion
                regions: {
                    type: 'array', // Regions must be an array
                    items: { type: 'object' }, // Each region must be an object
                },
            },
            required: [
                // Mandatory fields in the facility object
                'id',
                'name',
                'address_line_1',
                'city',
                'state',
                'country',
                'pincode',
                'timeregion',
            ],
        },
    },
    required: ['status', 'message', 'data'], // Required root-level fields
    additionalProperties: true, // Allow extra fields in the response
};

// AJV Schema for facility list response (returned in GET /api/facility/)
export const facilityListSchema = {
    type: 'object', // Root response must be a JSON object
    properties: {
        // Define expected root properties
        status: { type: 'string' }, // Response status
        message: { type: 'string' }, // Response message
        data: {
            // Contains the list of facilities
            type: 'array', // Data must be an array
            items: {
                // Validation rules for each facility
                type: 'object', // Each facility must be an object
                properties: {
                    // Define expected facility fields
                    id: { type: 'integer' }, // Unique facility ID
                    name: { type: 'string' }, // Facility name
                    address_line_1: { type: 'string' }, // Primary address
                    address_line_2: { type: ['string', 'null'] }, // Secondary address (optional)
                    city: { type: 'string' }, // City name
                    state: { type: 'string' }, // State name
                    country: { type: 'string' }, // Country name
                    pincode: { type: 'string' }, // Postal code
                    timeregion: { type: 'string' }, // Facility timeregion
                    regions_count: { type: 'integer' }, // Total regions
                    active_streams_count: { type: 'integer' }, // Total active streams
                },
                required: [
                    // Mandatory fields for every facility
                    'id',
                    'name',
                    'address_line_1',
                    'city',
                    'state',
                    'country',
                    'pincode',
                    'timeregion',
                ],
            },
        },
    },
    required: ['status', 'message', 'data'], // Required root-level fields
    additionalProperties: true, // Allow extra fields in the response
};

export const facilityMinimalListSchema = {
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
                },
                required: ['id', 'name'],
                additionalProperties: true,
            },
        },
    },
};

// Compile the single facility schema into a reusable validation function
export const validateSingleFacility = ajv.compile(singleFacilitySchema); //done

// Compile the facility list schema into a reusable validation function
export const validateFacilityList = ajv.compile(facilityListSchema); //done

export const validateMinimalFacilityList = ajv.compile(facilityMinimalListSchema); //done
