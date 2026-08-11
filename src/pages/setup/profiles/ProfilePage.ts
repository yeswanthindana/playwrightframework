import { Page, Locator } from '@playwright/test';
import { BasePage } from '@src/pages/base/BasePage';
import { Common } from '@src/pages/components/Common';
import { Toast } from '@src/pages/components/Toast';
import { Logger } from '@src/reporting/logging/Logger';
import { PermissionGrid } from '@src/pages/components/PermissionGrid';
import { Sidebar } from '@src/pages/components/Sidebar';
import { ProfileFormData } from '@src/models/ui/ProfileUiModel';
import { ProfileApiClient } from '@src/api/clients/ProfileApiClient';

export interface ProfileDetails {
    profileName: string;
    profileDescription: string;
    groupName?: string;
    verifyToastMessage?: string;
}

export class ProfilePage extends BasePage {
    private readonly profileName: Locator;
    private readonly profileDescription: Locator;
    private readonly privileges: Locator;
    private readonly streams: Locator;
    private readonly feedGroupsAndPanes: Locator;
    private readonly permissionsGrid: PermissionGrid;
    private readonly common: Common;
    private readonly toast: Toast;
    private readonly groupName: Locator;
    private readonly sidebar: Sidebar;

    constructor(page: Page) {
        super(page);

        this.profileName = page.getByPlaceholder('Department Manager');
        this.profileDescription = page.getByPlaceholder(
            'Manages members, assigns profiles, and configures stream access.',
        );
        this.privileges = page.getByProfile('button', { name: 'Privileges', exact: true });
        this.streams = page.getByProfile('button', { name: 'Streams', exact: true });
        this.feedGroupsAndPanes = page.getByProfile('button', { name: 'FeedGroups', exact: true });
        this.permissionsGrid = new PermissionGrid(page);
        this.common = new Common(page);
        this.toast = new Toast(page);
        this.sidebar = new Sidebar(page);
        this.groupName = page.getByPlaceholder('Group Name');
    }

    async navigateToProfiles(): Promise<void> {
        Logger.info('Navigating to Security menu');
        await this.sidebar.navigateToMenuItem('Security');

        Logger.info('Navigating to Profiles submenu');
        await this.sidebar.navigateToMenuItem('Profiles');
    }

    async clickOnAddProfile(): Promise<void> {
        Logger.info('Clicking on Add Profile button');
        await this.common.clickAddButton('Profile');
    }

    async enterProfileName(details: Pick<ProfileDetails, 'profileName'>): Promise<void> {
        Logger.info('Clearing Profile Name text field');
        await this.profileName.clear();
        Logger.info(`Entering Profile Name as ${details.profileName}`);
        await this.profileName.fill(details.profileName);
    }

    async enterGroupName(details: Pick<ProfileDetails, 'groupName'>): Promise<void> {
        const name = details.groupName || 'Group Name';
        Logger.info('Clearing Group Name text field');
        await this.groupName.clear();
        Logger.info(`Entering Group Name as ${name}`);
        await this.groupName.fill(name);
    }

    async enterProfileDescription(details: Pick<ProfileDetails, 'profileDescription'>): Promise<void> {
        Logger.info('Clearing Profile Description text field');
        await this.profileDescription.clear();
        Logger.info(`Entering Profile Description as ${details.profileDescription}`);
        await this.profileDescription.fill(details.profileDescription);
    }

    async clickAllFeatures(): Promise<void> {
        Logger.info('Clicking Features');
        await this.permissionsGrid.enableFeature('Features');
    }

    async verifyToastMessage(details: Pick<ProfileDetails, 'verifyToastMessage'>): Promise<void> {
        if (details.verifyToastMessage) {
            Logger.info('Verifying toast message');
            await this.toast.verifyToastMessage(details.verifyToastMessage);
            Logger.info(`Verified the toast message ${details.verifyToastMessage}`);
        }
    }
}

export function createUniqueProfilesData(
    baseData: ProfileFormData,
    workerIndex: number,
    suffix: string,
): ProfileFormData {
    const uniqueValue = `${Date.now()}-${workerIndex}-${suffix}`;
    return { ...baseData, profileName: `${baseData.profileName}-${uniqueValue}` };
}

export async function openProfilesPage(page: Page, profilePage: ProfilePage): Promise<void> {
    await page.goto('/dashboard');
    await profilePage.navigateToProfiles();
}

export async function populateProfileForm(profilePage: ProfilePage, profile: ProfileFormData): Promise<void> {
    await profilePage.enterProfileName({ profileName: profile.profileName });
    await profilePage.enterProfileDescription({ profileDescription: profile.profileDescription });
}

export async function createProfileThroughUi(
    page: Page,
    profileApiClient: ProfileApiClient,
    profileData: ProfileFormData & { groupName?: string; verifyToastMessage?: string },
): Promise<{ id: number; data: ProfileFormData }> {
    const profilePage = new ProfilePage(page);
    const common = new Common(page);

    await openProfilesPage(page, profilePage);
    await profilePage.clickOnAddProfile();
    await populateProfileForm(profilePage, profileData);
    await profilePage.clickAllFeatures();
    await common.clickNextButton();
    await common.clickNextButton();
    await common.clickAddButton('Group');
    await profilePage.enterGroupName({ groupName: profileData.groupName || 'Group Name' });
    await common.clickAddButton();
    await common.clickFinishButton();

    if (profileData.verifyToastMessage) {
        await profilePage.verifyToastMessage({ verifyToastMessage: profileData.verifyToastMessage });
    }

    const createdProfile = await profileApiClient.getProfileByName(profileData.profileName);

    return {
        id: createdProfile.id,
        data: profileData,
    };
}
