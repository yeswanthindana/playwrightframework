import { expect, test } from '@src/fixtures/index';
import {
    ProfilePage,
    createProfileThroughUi,
    createUniqueProfilesData,
    openProfilesPage,
    populateProfileForm,
} from '@src/pages/setup/profiles/ProfilePage';
import { AllureUtil } from '@src/reporting/allure/AllureUtil';
import { Common } from '@src/pages/components/Common';
import { Logger } from '@src/reporting/logging/Logger';
import { addProfile, editProfile } from '@src/test-data/profiles/profiles.json';

test.describe('Edit Profile tests', () => {
    test.describe.configure({ mode: 'serial' });

    test('View an existing profile @Profile', async ({
        page,
        profileApiClient,
        profileRepository,
    }, testInfo) => {
        Logger.info('--- START TEST: View an existing profile ---');
        await AllureUtil.setTestDetails({
            epic: 'Security',
            feature: 'Profiles',
            story: 'View Profile',
            severity: 'critical',
            owner: 'Yesh',
            tags: ['Regression', 'UI'],
            parentSuite: 'SentinelX',
            suite: 'Profile Module',
            subSuite: 'View Profile'
        });

        const profileData = createUniqueProfilesData(addProfile, testInfo.workerIndex, 'view');
        const profilePayload = {
            ...profileData,
            verifyToastMessage: addProfile.toastMessage,
        };
        const profilePage = new ProfilePage(page);
        const common = new Common(page);

        let profileId: number | undefined;

        try {
            await AllureUtil.step(page, 'Prerequisite: Create the profile required by this test', async () => {
                Logger.info(`Creating required profile through UI: ${profilePayload.profileName}`);
                const created = await createProfileThroughUi(page, profileApiClient, profilePayload);
                profileId = created.id;
                Logger.info(`Required profile created successfully. ID: ${profileId}`);
            });

            await AllureUtil.step(page, 'Open Profiles and search for the profile', async () => {
                await openProfilesPage(page, profilePage);
                Logger.info(`Searching for profile: ${profilePayload.profileName}`);
                await common.enterSearchText(profilePayload.profileName);
            });

            await AllureUtil.step(page, 'Open the profile details', async () => {
                await common.clickViewIcon();
            });

            await AllureUtil.step(page, 'Validate all profile fields', async () => {
                Logger.info('Validating profile fields on details page...');
                await common.verifyFieldValue(page, 'Name', profilePayload.profileName);
                await common.verifyFieldValue(page, 'Description', profilePayload.profileDescription);
                Logger.info('Successfully verified all profile details fields.');
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
            Logger.info('--- END TEST: View an existing profile ---');
        }
    });

    test('Edit an existing profile @Profile', async ({
        page,
        profileApiClient,
        profileRepository,
    }, testInfo) => {
        Logger.info('--- START TEST: Edit an existing profile ---');
        await AllureUtil.setTestDetails({
            epic: 'Security',
            feature: 'Profiles',
            story: 'Edit Profile',
            severity: 'critical',
            owner: 'Yesh',
            tags: ['Regression', 'UI'],
            parentSuite: 'SentinelX',
            suite: 'Profile Module',
            subSuite: 'Edit Profile'
        });

        const originalProfile = createUniqueProfilesData(addProfile, testInfo.workerIndex, 'edit-original');
        const originalPayload = {
            ...originalProfile,
            verifyToastMessage: addProfile.toastMessage,
        };
        const updatedProfile = createUniqueProfilesData(editProfile, testInfo.workerIndex, 'edit-updated');
        const profilePage = new ProfilePage(page);
        const common = new Common(page);

        let profileId: number | undefined;

        try {
            await AllureUtil.step(page, 'Prerequisite: Create the profile required by this test', async () => {
                Logger.info(`Creating original profile through UI: ${originalPayload.profileName}`);
                const created = await createProfileThroughUi(page, profileApiClient, originalPayload);
                profileId = created.id;
                Logger.info(`Original profile created successfully. ID: ${profileId}`);
            });

            await AllureUtil.step(page, 'Search for the original profile', async () => {
                await openProfilesPage(page, profilePage);
                Logger.info(`Searching for original profile: ${originalPayload.profileName}`);
                await common.enterSearchText(originalPayload.profileName);
            });

            await AllureUtil.step(page, 'Open the profile editor', async () => {
                await common.clickEditIcon();
            });

            await AllureUtil.step(page, 'Update all profile fields', async () => {
                Logger.info(
                    `Updating profile form with edit values. New Name: ${updatedProfile.profileName}`,
                );
                await populateProfileForm(profilePage, updatedProfile);
            });

            await AllureUtil.step(page, 'Save the profile changes', async () => {
                await common.clickUpdateButton();
            });

            await AllureUtil.step(page, 'Validate the updated profile in the API', async () => {
                Logger.info(`Validating updated profile in API by name: ${updatedProfile.profileName}`);
                const apiProfile = await profileApiClient.getProfileByName(updatedProfile.profileName);
                expect(apiProfile.id).toBe(profileId);
                expect(apiProfile).toMatchObject({
                    name: updatedProfile.profileName,
                    description: updatedProfile.profileDescription,
                    is_active: true,
                });
                Logger.info('Successfully validated updated profile through API.');
            });

            await AllureUtil.step(page, 'Validate all updated fields in the database', async () => {
                if (profileId === undefined) {
                    throw new Error('Profile ID is unavailable');
                }
                Logger.info(`Validating updated profile in database for ID ${profileId}`);
                const dbProfile = await profileRepository.getProfileById(profileId);
                expect(dbProfile).toMatchObject({
                    id: profileId,
                    name: updatedProfile.profileName,
                    description: updatedProfile.profileDescription,
                    isActive: true,
                });
                Logger.info('Successfully validated updated profile in the database.');
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
            Logger.info('--- END TEST: Edit an existing profile ---');
        }
    });
});
