import { expect, test } from '@src/fixtures/index';
import {
    ProfilePage,
    createProfileThroughUi,
    createUniqueProfilesData,
    openProfilesPage,
} from '@src/pages/setup/profiles/ProfilePage';
import { AllureUtil } from '@src/reporting/allure/AllureUtil';
import { Common } from '@src/pages/components/Common';
import { Toast } from '@src/pages/components/Toast';
import { Logger } from '@src/reporting/logging/Logger';
import { addProfile } from '@src/test-data/profiles/profiles.json';

test.describe('Delete Profile tests', () => {
    test.describe.configure({ mode: 'serial' });

    test('Delete an existing profile @Profile', async ({
        page,
        profileApiClient,
        profileRepository,
    }, testInfo) => {
        Logger.info('--- START TEST: Delete an existing profile ---');
        await AllureUtil.setTestDetails({
            epic: 'Security',
            feature: 'Profiles',
            story: 'Delete Profile',
            severity: 'critical',
            owner: 'Yesh',
            tags: ['Regression', 'UI'],
            parentSuite: 'SentinelX',
            suite: 'Profile Module',
            subSuite: 'Delete Profile'
        });

        const profileData = createUniqueProfilesData(addProfile, testInfo.workerIndex, 'delete');
        const profilePayload = {
            ...profileData,
            verifyToastMessage: addProfile.toastMessage,
        };
        const profilePage = new ProfilePage(page);
        const common = new Common(page);
        const toast = new Toast(page);

        let profileId: number | undefined;

        try {
            await AllureUtil.step(page, 'Prerequisite: Create the profile required by this test', async () => {
                Logger.info(`Creating required profile through UI: ${profilePayload.profileName}`);
                const created = await createProfileThroughUi(page, profileApiClient, profilePayload);
                profileId = created.id;
                Logger.info(`Required profile created successfully. ID: ${profileId}`);
            });

            await AllureUtil.step(page, 'Search for the profile', async () => {
                await openProfilesPage(page, profilePage);
                Logger.info(`Searching for profile to delete: ${profilePayload.profileName}`);
                await common.enterSearchText(profilePayload.profileName);
            });

            await AllureUtil.step(page, 'Open the delete confirmation', async () => {
                await common.clickDeleteIcon();
            });

            await AllureUtil.step(page, 'Confirm the deletion', async () => {
                await common.clickDeleteButton();
            });

            await AllureUtil.step(page, 'Validate the deletion toast', async () => {
                await toast.verifyToastMessage(`${profilePayload.profileName} Profile deleted successfully`);
            });

            await AllureUtil.step(
                page,
                'Validate the profile is inactive in the database',
                async () => {
                    if (profileId === undefined) {
                        throw new Error('Profile ID is unavailable');
                    }
                    Logger.info(`Validating profile with ID ${profileId} is inactive in database`);
                    const dbProfile = await profileRepository.getProfileById(profileId);
                    expect(dbProfile.isActive).toBe(false);
                    Logger.info(`Successfully verified profile ID ${profileId} is now inactive.`);
                },
            );
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
            Logger.info('--- END TEST: Delete an existing profile ---');
        }
    });
});
