import { expect, test } from '@src/fixtures/index';
import {
    createProfileThroughUi,
    createUniqueProfilesData,
} from '@src/pages/setup/profiles/ProfilePage';
import { AllureUtil } from '@src/reporting/allure/AllureUtil';
import { Logger } from '@src/reporting/logging/Logger';
import { addProfile } from '@src/test-data/profiles/profiles.json';

test.describe('Create Profile tests', () => {
    test.describe.configure({ mode: 'serial' });

    test('Add a new profile @Profile', async ({ page, profileApiClient, profileRepository }, testInfo) => {
        Logger.info('--- START TEST: Add a new profile ---');
        await AllureUtil.setTestDetails({
            epic: 'Security',
            feature: 'Profiles',
            story: 'Create Profile',
            severity: 'critical',
            owner: 'Yesh',
            tags: ['Regression', 'UI'],
            parentSuite: 'SentinelX',
            suite: 'Profile Module',
            subSuite: 'Create Profile'
        });

        const profileData = createUniqueProfilesData(addProfile, testInfo.workerIndex, 'add');
        const profilePayload = { ...profileData, verifyToastMessage: addProfile.toastMessage };

        let profileId: number | undefined;

        try {
            await AllureUtil.step(page, 'Prerequisite: Create a profile through the UI', async () => {
                Logger.info(`Creating profile through UI: ${profilePayload.profileName}`);
                const created = await createProfileThroughUi(page, profileApiClient, profilePayload);
                profileId = created.id;
                Logger.info(`Profile created through UI successfully. ID: ${profileId}`);
            });

            await AllureUtil.step(page, 'Validate the profile through the API', async () => {
                Logger.info(`Validating profile through API by name: ${profilePayload.profileName}`);
                const apiProfile = await profileApiClient.getProfileByName(profilePayload.profileName);
                expect(apiProfile).toMatchObject({
                    name: profilePayload.profileName,
                    description: profilePayload.profileDescription,
                    is_active: true,
                });
                Logger.info('Successfully validated profile through API.');
            });

            await AllureUtil.step(page, 'Validate the profile in the database', async () => {
                if (profileId === undefined) {
                    throw new Error('Profile ID is unavailable');
                }
                Logger.info(`Validating profile with ID ${profileId} in the database`);
                const dbProfile = await profileRepository.getProfileById(profileId);
                expect(dbProfile).toMatchObject({
                    id: profileId,
                    name: profilePayload.profileName,
                    description: profilePayload.profileDescription,
                    isActive: true,
                });
                Logger.info('Successfully validated profile in the database.');
            });
        } finally {
            await AllureUtil.step(page, 'Postrequisite: Deactivate the created profile', async () => {
                if (profileId === undefined) {
                    Logger.warn('Postrequisite skipped because Profile ID is unavailable.');
                    return;
                }
                Logger.info(`Postrequisite: Deactivating profile ID ${profileId}`);
                await profileRepository.deactivateProfile(profileId);
                Logger.info(`Postrequisite completed for profile ID ${profileId}`);
            });
            Logger.info('--- END TEST: Add a new profile ---');
        }
    });
});
