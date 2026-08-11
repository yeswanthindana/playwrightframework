/**
 * Centralized API endpoints for GPU Nodes (hardware-environment) operations.
 */
export const ComputeNodesEndpoints = {
    /**
     * POST /api/hardware-environment/
     * Creates a new GPU node.
     */
    CREATE: '/api/hardware-environment/',

    /**
     * GET /api/hardware-environment/
     * Retrieves all GPU nodes.
     */
    GET_ALL: '/api/hardware-environment/',

    /**
     * GET /api/hardware-environment/minimal
     * Retrieves minimal details of GPU nodes.
     */
    GET_MINIMAL: '/api/hardware-environment/minimal',

    /**
     * GET /api/hardware-environment/{id}
     * Retrieves details for a specific GPU node.
     */
    GET_BY_ID: (id: number) => `/api/hardware-environment/${id}`,

    /**
     * PATCH /api/hardware-environment/{id}
     * Updates details of an existing GPU node.
     */
    UPDATE: (id: number) => `/api/hardware-environment/${id}`,

    /**
     * DELETE /api/hardware-environment/{id}
     * Deletes (deactivates) a specific GPU node.
     */
    DELETE: (id: number) => `/api/hardware-environment/${id}`,
};
