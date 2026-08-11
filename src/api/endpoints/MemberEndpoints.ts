/**
 * Centralized API endpoints for Member operations.
 */
export const MemberEndpoints = {
    /**
     * POST /api/member/
     * Creates a new member.
     */
    CREATE: '/api/add_member',
    GET_ALL: '/api/member/get-members',
    UPDATE: '/api/update_member',
    DELETE: (id: number, updatedBy: number) => `/api/deactivate-member/${id}?updated_by=${updatedBy}`,
};
