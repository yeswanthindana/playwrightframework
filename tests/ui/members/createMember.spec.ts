import { test as base, expect } from '@src/fixtures/index';
import { AllureUtil } from '@src/reporting/allure/AllureUtil';
import { Logger } from '@src/reporting/logging/Logger';
import { addMember } from '@src/test-data/members/members.json';
import { createUniqueMemberData, createMemberThroughUi } from '@src/pages/setup/members/MemberPage';
import { createProfileThroughUi, createUniqueProfilesData } from '@src/pages/setup/profiles/ProfilePage';
import { addProfile } from '@src/test-data/profiles/profiles.json';
import { ProfileApiClient } from '@src/api/clients/ProfileApiClient';

const test = base.extend<{ profileApiClient: ProfileApiClient }>({
    profileApiClient: async ({ api }, use) => {
        await use(api.profile);
    },
});

test.describe('Create Member tests', () => {
    test.describe.configure({ mode: 'serial' });

    test('Add a new member @Member', async ({ page, memberApiClient, memberRepository, profileApiClient }, testInfo) => {
        Logger.info('--- START TEST: Add a new member ---');
        await AllureUtil.setTestDetails({
            epic: 'Setup',
            feature: 'Members',
            story: 'Create Member',
            severity: 'critical',
            owner: 'Priyank',
            tags: ['Regression', 'UI'],
            parentSuite: 'SentinelX',
            suite: 'Member Module',
            subSuite: 'Create Member'
        });

        const memberData = createUniqueMemberData(addMember, testInfo.workerIndex, 'add');
        const profileData = createUniqueProfilesData(addProfile, testInfo.workerIndex, 'add-profile');
        let memberId: number | undefined;
        let createdProfileName = '';

        try {
            await AllureUtil.step(page, 'Prerequisite: Create a profile', async () => {
                Logger.info(`Creating profile through UI: ${profileData.profileName}`);
                const createdProfile = await createProfileThroughUi(page, profileApiClient, profileData);
                createdProfileName = createdProfile.data.profileName;
            });

            await AllureUtil.step(page, 'Prerequisite: Create a member through the UI', async () => {
                Logger.info(`Creating member through UI: ${memberData.firstname}`);
                const created = await createMemberThroughUi(page, memberApiClient, memberData, createdProfileName);
                memberId = created.id;
                Logger.info(`Member created through UI successfully. ID: ${memberId}`);
            });

            await AllureUtil.step(page, 'Test: Validate the created member', async () => {
                if (memberId === undefined) {
                    throw new Error('Member ID is unavailable');
                }
                Logger.info(`Validating member through API by ID: ${memberId}`);
                const apiMember = await memberApiClient.getMemberById(memberId);
                expect(apiMember).toMatchObject({
                    firstname: memberData.firstname,
                    email: memberData.email,
                    profile_name: createdProfileName
                });
                Logger.info('Successfully validated member through API.');
                Logger.info(`Validating member with ID ${memberId} in the database`);
                const dbMember = await memberRepository.getMemberById(memberId);
                expect(dbMember).toMatchObject({
                    id: memberId,
                    firstname: memberData.firstname,
                    isActive: true,
                });
                Logger.info('Successfully validated member in the database.');
            });

        } finally {
            await AllureUtil.step(page, 'Postrequisite: Deactivate the created member', async () => {
                if (memberId === undefined) {
                    Logger.warn('Postrequisite skipped because Member ID is unavailable.');
                    return;
                }
                Logger.info(`Postrequisite: Deactivating member ID ${memberId}`);
                await memberRepository.deactivateMember(memberId);
                Logger.info(`Postrequisite completed for member ID ${memberId}`);
            });
            Logger.info('--- END TEST: Add a new member ---');
        }
    });
});
