import { test as base, expect } from '@src/fixtures/api.fixture';
import { FacilityApiClient } from '@src/api/clients/FacilityApiClient';
import { FacilityRepository } from '@src/database/repositories/FacilityRepository';

export const test = base.extend<{
    facilityApiClient: FacilityApiClient;
    facilityRepository: FacilityRepository;
}>({
    facilityApiClient: async ({ api }, use) => {
        await use(api.facility);
    },
    facilityRepository: async ({ db }, use) => {
        await use(db.facility);
    },
});

export { expect };
