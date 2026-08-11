import { Page, Locator } from '@playwright/test';
import { BasePage } from '@src/pages/base/BasePage';
import { Common } from '@src/pages/components/Common';
import { Toast } from '@src/pages/components/Toast';
import { Logger } from '@src/reporting/logging/Logger';
import { PermissionGrid } from '@src/pages/components/PermissionGrid';
import { Sidebar } from '@src/pages/components/Sidebar';
import { MemberFormData } from '@src/models/ui/MemberUiModel';
import { MemberApiClient } from '@src/api/clients/MemberApiClient';

export interface MemberDetails {
    memberName: string;
    email: string;
    verifyToastMessage: string;
}

export class MemberPage extends BasePage {
    private readonly memberName: Locator;
    private readonly memberEmail: Locator;
    private readonly permissionsGrid: PermissionGrid;
    private readonly common: Common;
    private readonly toast: Toast;
    private readonly sidebar: Sidebar;

    constructor(page: Page) {
        super(page);

        this.common = new Common(page);
        this.sidebar = new Sidebar(page);
        this.toast = new Toast(page);
        this.memberName = page.getByProfile('textbox', { name: 'Name', exact: true });
        this.memberEmail = page.getByProfile('textbox', { name: 'Email', exact: true });
        this.permissionsGrid = new PermissionGrid(page);
    }

    async navigateToMembers(): Promise<void> {
        Logger.info('Clicking on Security menu');
        await this.sidebar.navigateToMenuItem('Security');

        Logger.info('Clicking on Members submenu');
        await this.sidebar.navigateToMenuItem('Members');
    }

    async clickOnAddMembers(): Promise<void> {
        Logger.info(`Clicking on Add Members Button`);
        await this.common.clickAddButton('Member');
    }

    async enterMemberName(details: Pick<MemberDetails, 'memberName'>): Promise<void> {
        Logger.info(`Clearing Member Name text field`);
        await this.memberName.clear();
        Logger.info(`Entering Member Name: ${details.memberName}`);
        await this.memberName.fill(details.memberName);
    }

    async enterEmail(details: Pick<MemberDetails, 'email'>): Promise<void> {
        Logger.info(`Clearing Email text field`);
        await this.memberEmail.clear();
        Logger.info(`Entering Email: ${details.email}`);
        await this.memberEmail.fill(details.email);
    }

    async selectProfile(profileName: string): Promise<void> {
        Logger.info(`Selecting Profile: ${profileName}`);
        await this.common.clickOnDropdownOption('Select Profile', profileName);
    }
}

export function createUniqueMemberData(baseData: MemberFormData, workerIndex: number, suffix: string): MemberFormData {
    const uniqueValue = `${Date.now()}-${workerIndex}-${suffix}`;
    return { ...baseData, email: `${baseData.email.split('@')[0]}-${uniqueValue}@aether.com` };
}

export async function openMemberPage(page: Page, memberPage: MemberPage): Promise<void> {
    await page.goto('/dashboard');
    await memberPage.navigateToMembers();
}

export async function populateMemberForm(memberPage: MemberPage, member: MemberFormData): Promise<void> {
    await memberPage.enterMemberName({ memberName: member.firstname });
    await memberPage.enterEmail({ email: member.email });
}

export async function  createMemberThroughUi(
    page: Page,
    memberApiClient: MemberApiClient,
    member: MemberFormData,
    profileName: string,
): Promise<{ id: number; data: MemberFormData }> {
    const memberPage = new MemberPage(page);
    await openMemberPage(page, memberPage);
    await memberPage.clickOnAddMembers();
    await populateMemberForm(memberPage, member);
    await memberPage.selectProfile(profileName);
    const common = new Common(page);
    await common.clickSaveButton();

    if (member.verifyToastMessage) {
        const toast = new Toast(page);
        await toast.verifyToastMessage(member.verifyToastMessage);
    }

    const createdMember = await memberApiClient.getMemberByEmail(member.email);
    return {
        id: createdMember.member_id,
        data: member,
    };
}