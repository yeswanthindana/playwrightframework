import { executeQuery } from '@src/database/connection/DatabaseClient';
import { ComputeNodesDBRow } from '@src/models/database/ComputeNodesDbModel';
import { expect } from '@playwright/test';
import { AllureUtil } from '@src/reporting/allure/AllureUtil';

export class ComputeNodesRepository {
    //=======================================================
    // Retrieves a facility row from public.facilities by ID.
    //=======================================================

    async getComputeNodeById(id: number): Promise<ComputeNodesDBRow> {
        const result = await executeQuery<ComputeNodesDBRow>(
            `
                SELECT
                    id,
                    name,
                    ip_address AS "ipAddress",
                    hostname,
                    max_streams AS "maxStreams",
                    config_details AS "configDetails",
                    frames_folder_path AS "framesFolderPath",
                    ssh_membername AS "sshMembername",
                    ssh_password AS "sshPassword",
                    gpu_count AS "gpuCount",
                    is_active AS "isActive"
                FROM public.hardware_environments
                WHERE id = $1
            `,
            [id],
        );

        expect(result.rowCount, `GPU Node with ID ${id} was not found in the database`).toBe(1);

        const row = result.rows[0];

        if (!row) {
            throw new Error(`GPU Node with ID ${id} was not found in the database`);
        }

        return row;
    }

    //=======================================================
    // Retrieves a facility row from public.facilities by Name
    //=======================================================

    async getComputeNodeByName(name: string): Promise<ComputeNodesDBRow> {
        const result = await executeQuery<ComputeNodesDBRow>(
            `
                SELECT
                    id,
                    name,
                    ip_address AS "ipAddress",
                    hostname,
                    max_streams AS "maxStreams",
                    config_details AS "configDetails",
                    frames_folder_path AS "framesFolderPath",
                    ssh_membername AS "sshMembername",
                    ssh_password AS "sshPassword",
                    gpu_count AS "gpuCount",
                    is_active AS "isActive"
                FROM public.hardware_environments
                WHERE name = $1
            `,
            [name],
        );

        expect(result.rowCount, `GPU Node with name "${name}" was not found in the database`).toBe(
            1,
        );

        const row = result.rows[0];

        if (!row) {
            throw new Error(`GPU Node with name "${name}" was not found in the database`);
        }

        return row;
    }

    //=================================================================
    // Soft deletes/deactivates a facility by setting is_active = false
    //=================================================================

    async deactivateComputeNode(id: number | undefined): Promise<void> {
        if (id === undefined) {
            return;
        }

        const result = await executeQuery<{ id: number; isActive: boolean }>(
            `
                UPDATE public.hardware_environments
                SET is_active = false
                WHERE id = $1
                RETURNING id, is_active AS "isActive"
            `,
            [id],
        );
        expect(result.rowCount, `GPU Node ${id} was not deactivated`).toBe(1);
        expect(result.rows[0]?.isActive, `GPU Node ${id} is still active`).toBe(false);
        await AllureUtil.attachJson('GPU Node deactivation evidence', {
            entity: 'GPU Node',
            id,
            isActive: false,
            verifiedAt: new Date().toISOString(),
        });
    }
}
