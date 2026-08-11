import { mergeTests } from '@playwright/test';
import { test as baseTest } from '@src/fixtures/baseFixture';
import { test as apiTest } from '@src/fixtures/api.fixture';
import { test as facilityTest } from '@src/fixtures/facility.fixture';
import { test as memberTest } from '@src/fixtures/member.fixture';
import { test as profileTest } from '@src/fixtures/profile.fixture';
import { test as computeNodeTest } from '@src/fixtures/computeNode.fixture';

export const test = mergeTests(baseTest, apiTest, facilityTest, memberTest, profileTest, computeNodeTest);
export { expect } from '@playwright/test';
