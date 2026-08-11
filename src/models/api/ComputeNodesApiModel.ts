import Ajv from 'ajv';

// Create AJV instance for JSON schema validation
const ajv = new Ajv({
    allErrors: true, // Report all validation errors
    coerceTypes: true, // Automatically convert compatible types
    useDefaults: true, // Apply default values from schema
});

// Standardized representation for testing assertions
export interface ComputeNodesApiItem {
    id: number;
    name: string;
    ipAddress: string;
    hostname: string;
    framesFolderPath: string;
    maxStreams: number;
    configDetails: string;
    sshMembername: string;
    gpuCount: number;
    activeStreamCount: number;
    status: boolean;
}

// Raw item representation from GET All Hardware Environments
export interface RawComputeNodesApiItem {
    id: number;
    name: string;
    ip_address: string;
    hostname: string;
    frames_folder_path: string;
    max_streams: number;
    config_details: string;
    ssh_membername: string;
    gpu_count: number;
    active_stream_count: number;
    status: boolean;
}

export interface ComputeNodesApiResponse {
    status: string;
    message: string;
    data: RawComputeNodesApiItem[];
}

// Minimal GPU nodes Item
export interface SingleRawComputeNodesMinimalApiItem {
    id: number;
    name: string;
}

export interface SingleComputeNodesMinimalApiResponse {
    status: string;
    message: string;
    data: SingleRawComputeNodesMinimalApiItem[];
}

// Raw representation from GET GPU Node by ID
export interface SingleRawComputeNodesApiItem {
    id: number;
    name: string;
    ip_address: string;
    hostname: string;
    frames_folder_path: string;
    max_streams: number;
    config_details: string;
    ssh_membername: string;
    gpu_count: number;
    activeStreamCount: number;
    status: boolean;
}

export interface SingleComputeNodesApiResponse {
    status: string;
    message: string;
    data: SingleRawComputeNodesApiItem;
}

// ============================================================================
// AJV Schema - GET GPU Nodes By ID
// ============================================================================

export const singleComputeNodesSchema = {
    type: 'object',
    properties: {
        status: {
            type: 'string',
        },
        message: {
            type: 'string',
        },
        data: {
            type: 'object',
            properties: {
                id: { type: 'integer' },
                name: { type: 'string' },
                ip_address: { type: 'string' },
                hostname: { type: 'string' },
                frames_folder_path: { type: 'string' },
                max_streams: { type: 'integer' },
                config_details: { type: 'string' },
                ssh_membername: { type: 'string' },
                gpu_count: { type: 'integer' },
            },
            required: [
                'id',
                'name',
                'ip_address',
                'hostname',
                'frames_folder_path',
                'max_streams',
                'config_details',
                'ssh_membername',
                'gpu_count',
            ],
        },
    },
    required: ['status', 'message', 'data'],
    additionalProperties: true,
};

// ============================================================================
// AJV Schema - GET All GPU Nodes
// ============================================================================

export const computeNodeListSchema = {
    type: 'object',
    properties: {
        status: {
            type: 'string',
        },
        message: {
            type: 'string',
        },
        data: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'integer' },
                    name: { type: 'string' },
                    ip_address: { type: 'string' },
                    hostname: { type: 'string' },
                    frames_folder_path: { type: 'string' },
                    max_streams: { type: 'integer' },
                    config_details: { type: 'string' },
                    ssh_membername: { type: 'string' },
                    gpu_count: { type: 'integer' },
                    active_stream_count: { type: 'integer' },
                    status: { type: 'boolean' },
                },
                required: [
                    'id',
                    'name',
                    'ip_address',
                    'hostname',
                    'frames_folder_path',
                    'max_streams',
                    'config_details',
                    'ssh_membername',
                    'gpu_count',
                    'active_stream_count',
                    'status',
                ],
            },
        },
    },
    required: ['status', 'message', 'data'],
    additionalProperties: true,
};

// ============================================================================
// AJV Schema - GET Minimal GPU Nodes
// ============================================================================

export const computeNodesMinimalListSchema = {
    type: 'object',
    properties: {
        status: {
            type: 'string',
        },
        message: {
            type: 'string',
        },
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
    required: ['status', 'message', 'data'],
    additionalProperties: true,
};

// ============================================================================
// AJV Schema - SSH Validation
// ============================================================================

export const validateSSHSchema = {
    type: 'object',
    properties: {
        status: {
            type: 'string',
        },
        message: {
            type: 'string',
        },
    },
    required: ['status', 'message'],
    additionalProperties: true,
};

// ============================================================================
// AJV Validators
// ============================================================================

// Compile the single gpu node schema
export const validateSingleComputeNode = ajv.compile(singleComputeNodesSchema);

// Compile the gpu node list schema
export const validateComputeNodeList = ajv.compile(computeNodeListSchema);

// Compile the minimal gpu node schema
export const validateMinimalComputeNodeList = ajv.compile(computeNodesMinimalListSchema);

// Compile the SSH validation schema
export const validateSSHResponse = ajv.compile(validateSSHSchema);
