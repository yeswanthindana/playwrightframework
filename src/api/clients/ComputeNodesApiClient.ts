import { APIRequestContext, expect } from '@playwright/test';
import { BaseApiClient } from '@src/api/base/BaseApiClient';
import { ComputeNodesData } from '@src/models/ui/ComputeNodesUiModel';
import {
    ComputeNodesApiItem,
    ComputeNodesApiResponse,
    SingleComputeNodesMinimalApiResponse,
    SingleComputeNodesApiResponse,
    validateSingleComputeNode,
    validateComputeNodeList,
    validateMinimalComputeNodeList,
} from '@src/models/api/ComputeNodesApiModel';
import { config } from '@src/config/environment';
import { ComputeNodesEndpoints } from '@src/api/endpoints/ComputeNodesEndpoints';

// ============================================================================
// Creating a New GPU Node via POST /api/hardware-environment/
// ============================================================================

export class ComputeNodesApiClient extends BaseApiClient {
    constructor(request: APIRequestContext) {
        super(request);
    }
    async createComputeNode(computeNodeData: ComputeNodesData) {
        const response = await this.sendRequest('POST', ComputeNodesEndpoints.CREATE, {
            data: {
                name: computeNodeData.name,
                ipAddress: computeNodeData.ipAddressInput,
                frameFolderPath: computeNodeData.framesFolderPath,
                membername: computeNodeData.membername,
                password: computeNodeData.password,
                maxNoStreams: computeNodeData.max_no_of_streams,
                hostname: computeNodeData.host_name,
                count: computeNodeData.gpu_count,
                configDetails: computeNodeData.config_details,
                created_by: config.createdBy,
            },
        });
        expect(
            response.ok(),
            `POST ${ComputeNodesEndpoints.CREATE} failed with status ${response.status()}`,
        ).toBeTruthy();

        const body = (await response.json()) as SingleComputeNodesApiResponse;
        const valid = validateSingleComputeNode(body);
        if (!valid) {
            throw new Error(
                `AJV Single GPU Node validation failed for POST: ${JSON.stringify(validateSingleComputeNode.errors, null, 2)}`,
            );
        }
        const data = body.data;
        return {
            id: data.id,
            name: data.name,
            ipAddress: data.ip_address,
            hostName: data.hostname,
            frameFolders: data.frames_folder_path,
            maxStreams: data.max_streams,
            configDetails: data.config_details,
            sshMemberName: data.ssh_membername,
            gpuCount: data.gpu_count,
        };
    }

    // ============================================================================
    // Get All GPU Nodes via GET /api/hardware-environment/
    // ============================================================================

    async getAllComputeNodes(): Promise<ComputeNodesApiResponse> {
        const response = await this.sendRequest('GET', ComputeNodesEndpoints.GET_ALL);
        expect(
            response.ok(),
            `GET ${ComputeNodesEndpoints.GET_ALL} failed with status ${response.status()}`,
        ).toBeTruthy();
        const body = (await response.json()) as ComputeNodesApiResponse;
        const valid = validateComputeNodeList(body);
        if (!valid) {
            throw new Error(
                `AJV GPU Nodes List validation failed: ${JSON.stringify(validateComputeNodeList.errors, null, 2)}`,
            );
        }
        return body;
    }

    // ============================================================================
    // Get Single GPU Nodes via GET /api/hardware-environment/{id}
    // ============================================================================

    async getComputeNodeById(id: number): Promise<ComputeNodesApiItem> {
        const response = await this.sendRequest('GET', ComputeNodesEndpoints.GET_BY_ID(id));
        expect(
            response.ok(),
            `GET ${ComputeNodesEndpoints.GET_BY_ID(id)} failed with status ${response.status()}`,
        ).toBeTruthy();
        const body = (await response.json()) as SingleComputeNodesApiResponse;
        const valid = validateSingleComputeNode(body);
        if (!valid) {
            throw new Error(
                `AJV Single Facility validation failed for ID ${id}: ${JSON.stringify(validateSingleComputeNode.errors, null, 2)}`,
            );
        }
        const data = body.data;
        return {
            id: data.id,
            name: data.name,
            ipAddress: data.ip_address,
            hostname: data.hostname,
            framesFolderPath: data.frames_folder_path,
            maxStreams: data.max_streams,
            configDetails: data.config_details,
            sshMembername: data.ssh_membername,
            gpuCount: data.gpu_count,
            activeStreamCount: data.activeStreamCount,
            status: data.status,
        };
    }

    // =======================================================================================================
    // Resolves a GPU Node by name. Hits list endpoint, gets ID, and fetches full details via single endpoint.
    // =======================================================================================================
    async getComputeNodeByName(name: string): Promise<ComputeNodesApiItem> {
        const listBody = await this.getAllComputeNodes();
        const computeNode = listBody.data.find((item) => item.name === name);
        expect(computeNode, `computeNode "${name}" was not found in the list response`).toBeDefined();
        if (!computeNode) {
            throw new Error(`Gpu Node "${name}" was not found in the list response`);
        }
        return await this.getComputeNodeById(computeNode.id);
    }

    // ======================================================================
    // Updates an existing gpu node via PATCH /api/hardware-environment/{id}
    // ======================================================================

    async updateComputeNode(id: number, updateData: Partial<ComputeNodesData>): Promise<ComputeNodesApiItem> {
        const patchPayload: Record<string, unknown> = {
            updated_by: config.createdBy,
        };
        if (updateData.name !== undefined) {
            patchPayload.name = updateData.name;
        }
        if (updateData.ipAddressInput !== undefined) {
            patchPayload.ipaddress = updateData.ipAddressInput;
        }
        if (updateData.framesFolderPath !== undefined) {
            patchPayload.framefolder = updateData.framesFolderPath;
        }
        if (updateData.membername !== undefined) {
            patchPayload.membername = updateData.membername;
        }
        if (updateData.password !== undefined) {
            patchPayload.password = updateData.password;
        }
        if (updateData.max_no_of_streams !== undefined) {
            patchPayload.maxstreams = updateData.max_no_of_streams;
        }

        const response = await this.sendRequest('PATCH', ComputeNodesEndpoints.UPDATE(id), {
            data: patchPayload,
        });
        expect(
            response.ok(),
            `PATCH ${ComputeNodesEndpoints.UPDATE(id)} failed with status ${response.status()}`,
        ).toBeTruthy();

        const body = (await response.json()) as SingleComputeNodesApiResponse;
        const valid = validateSingleComputeNode(body);
        if (!valid) {
            throw new Error(
                `AJV Single Facility validation failed for PATCH ID ${id}: ${JSON.stringify(validateSingleComputeNode.errors, null, 2)}`,
            );
        }

        const data = body.data;
        return {
            id: data.id,
            name: data.name,
            ipAddress: data.ip_address,
            hostname: data.hostname,
            framesFolderPath: data.frames_folder_path,
            maxStreams: data.max_streams,
            configDetails: data.config_details,
            sshMembername: data.ssh_membername,
            gpuCount: data.gpu_count,
            activeStreamCount: data.activeStreamCount,
            status: data.status,
        };
    }

    // =============================================================================
    // Deletes (deactivates) an existing facility via DELETE /api/facility/{id}
    // =============================================================================

    async deleteComputeNode(id: number): Promise<void> {
        const response = await this.sendRequest('DELETE', ComputeNodesEndpoints.DELETE(id), {
            data: {
                updated_by: config.createdBy,
            },
        });
        expect(
            response.ok(),
            `DELETE ${ComputeNodesEndpoints.DELETE(id)} failed with status ${response.status()}`,
        ).toBeTruthy();
    }

    async getMinimalComputeNode(): Promise<SingleComputeNodesMinimalApiResponse> {
        const response = await this.sendRequest('GET', ComputeNodesEndpoints.GET_MINIMAL);
        expect(
            response.ok(),
            `GET ${ComputeNodesEndpoints.GET_MINIMAL} failed with status ${response.status()}`,
        ).toBeTruthy();
        const body = (await response.json()) as SingleComputeNodesMinimalApiResponse;
        const valid = validateMinimalComputeNodeList(body);
        if (!valid) {
            throw new Error(
                `AJV Facility List validation failed: ${JSON.stringify(validateMinimalComputeNodeList.errors, null, 2)}`,
            );
        }
        return body;
    }
}
