import { test as base, expect } from '@src/fixtures/api.fixture';
import { ProfileApiClient } from '@src/api/clients/ProfileApiClient';
import { ProfilesRepository } from '@src/database/repositories/ProfileRepository';

export const test = base.extend<{
    profileApiClient: ProfileApiClient;
    profileRepository: ProfilesRepository;
}>({
    profileApiClient: async ({ api }, use) => {
        await use(api.profile);
    },
    profileRepository: async ({ db }, use) => {
        await use(db.profile);
    },
});

export { expect };
