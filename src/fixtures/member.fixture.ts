import { test as base, expect } from '@src/fixtures/api.fixture';
import { MemberApiClient } from '@src/api/clients/MemberApiClient';
import { MemberRepository } from '@src/database/repositories/MemberRepository';

export const test = base.extend<{
    memberApiClient: MemberApiClient;
    memberRepository: MemberRepository;
}>({
    memberApiClient: async ({ api }, use) => {
        await use(api.member);
    },
    memberRepository: async ({ db }, use) => {
        await use(db.member);
    },
});

export { expect };