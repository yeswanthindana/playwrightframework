/**
 * Centralized API endpoints for Facility operations.
 */
export const FacilityEndpoints = {
    /**
     * POST /api/facility/
     * Creates a new facility.
     */
    CREATE: '/api/facility/',

    /**
     * GET /api/facility/
     * Retrieves all facilities.
     */
    GET_ALL: '/api/facility/',

    /**
     * GET /api/facility/minimal
     * Retrieves minimal facility details.
     */
    GET_MINIMAL: '/api/facility/minimal',

    /**
     * GET /api/facility/{id}
     * Retrieves details for a specific facility.
     */
    GET_BY_ID: (id: number) => `/api/facility/${id}`,

    /**
     * PATCH /api/facility/{id}
     * Updates details of an existing facility.
     */
    UPDATE: (id: number) => `/api/facility/${id}`,

    /**
     * DELETE /api/facility/{id}
     * Deletes (deactivates) a specific facility.
     */
    DELETE: (id: number) => `/api/facility/${id}`,
};
