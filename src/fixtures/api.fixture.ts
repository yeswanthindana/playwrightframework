import { test as base } from '@src/fixtures/baseFixture';
export { expect } from '@src/fixtures/baseFixture';
import { ApiClients } from '@src/api/ApiClients';

export const test = base.extend<{
    api: ApiClients;
}>({
    api: async ({ request }, use) => {
        await use(new ApiClients(request));
    },
});
