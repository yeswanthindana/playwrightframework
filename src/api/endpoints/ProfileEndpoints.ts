/**
 * Centralized API endpoints for Profile and member group operations.
 */
export const ProfileEndpoints = {
    /**
     * GET /api/member/get-profiles
     * Retrieves profile options for member.
     */
    GET_USER_ROLES: '/api/member/get-profiles',

    /**
     * DELETE /api/deactivate-profile/{profileId}
     * Deactivates a specific profile.
     */
    DEACTIVATE: (profileId: number) => `/api/deactivate-profile/${profileId}`,

    /**
     * GET /api/profiles/
     * Retrieves all profiles.
     */
    GET_ALL: '/api/profiles/',

    /**
     * POST /api/profiles
     * Creates a new profile.
     */
    CREATE: '/api/profiles/',

    /**
     * GET /api/profiles/{id}
     * Retrieves details for a specific profile by ID.
     */
    GET_BY_ID: (id: number) => `/api/profiles/${id}`,

    /**
     * PATCH /api/profiles/{id}
     * Partially updates an existing profile.
     */
    UPDATE: (id: number) => `/api/profiles/${id}`,

    /**
     * DELETE /api/profiles/{id}
     * Deletes a specific profile by ID.
     */
    DELETE: (id: number) => `/api/profiles/${id}`,

    /**
     * PUT /api/profiles/{profileId}
     * Updates/replaces a profile.
     */
    PUT_UPDATE: (profileId: number) => `/api/profiles/${profileId}`,

    /**
     * GET /api/profiles/{profileId}/full
     * Retrieves full profile and privilege details.
     */
    GET_FULL: (profileId: number) => `/api/profiles/${profileId}/full`,

    /**
     * GET /api/profiles/{profileId}/streams
     * Retrieves stream associations for a specific profile.
     */
    GET_CAMERAS: (profileId: number) => `/api/profiles/${profileId}/streams`,

    /**
     * GET /api/profile/minimal
     * Retrieves minimal profiles list (fallback).
     */
    GET_MINIMAL: '/api/profile/minimal',

    /**
     * PUT /api/profiles/{profileId}/layout
     * Updates/saves dashboard layout for a profile.
     */
    UPDATE_LAYOUT: (profileId: number) => `/api/profiles/${profileId}/layout`,

    /**
     * GET /api/profiles/{profileId}/layout
     * Retrieves dashboard layout for a profile.
     */
    GET_LAYOUT: (profileId: number) => `/api/profiles/${profileId}/layout`,

    /**
     * DELETE /api/profiles/{profileId}/layout
     * Deletes dashboard layout for a profile.
     */
    DELETE_LAYOUT: (profileId: number) => `/api/profiles/${profileId}/layout`,
};
