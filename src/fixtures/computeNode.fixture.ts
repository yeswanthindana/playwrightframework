import { test as base, expect } from '@src/fixtures/api.fixture';
import { ComputeNodesApiClient } from '@src/api/clients/ComputeNodesApiClient';
import { ComputeNodesRepository } from '@src/database/repositories/ComputeNodesRepository';

export const test = base.extend<{
    computeNodeApiClient: ComputeNodesApiClient;
    computeNodeRepository: ComputeNodesRepository;
}>({
    computeNodeApiClient: async ({ api }, use) => {
        await use(api.computeNodes);
    },
    computeNodeRepository: async ({ db }, use) => {
        await use(db.computeNodes);
    },
});
export { expect };
