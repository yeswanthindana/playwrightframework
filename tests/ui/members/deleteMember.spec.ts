import { test, expect } from '@src/fixtures/index';
import { AllureUtil } from '@src/reporting/allure/AllureUtil';
import { Common } from '@src/pages/components/Common';
import { Toast } from '@src/pages/components/Toast';
import { Logger } from '@src/reporting/logging/Logger';
import { deleteMember } from '@src/test-data/members/members.json';
import { createUniqueMemberData, openMemberPage, MemberPage } from '@src/pages/setup/members/MemberPage';

test.describe('Delete Member tests', () => {
    test.describe.configure({ mode: 'serial' });

    test('Delete an existing member @Member', async ({ page, memberApiClient, memberRepository }, testInfo) => {
        Logger.info('--- START TEST: Delete an existing member ---');
        await AllureUtil.setTestDetails({
            epic: 'Setup',
            feature: 'Members',
            story: 'Delete Member',
            severity: 'normal',
            owner: 'Priyank',
            tags: ['Regression', 'UI'],
            parentSuite: 'SentinelX',
            suite: 'Member Module',
            subSuite: 'Delete Member'
        });

        const memberData = createUniqueMemberData(deleteMember, testInfo.workerIndex, 'del');
        let memberId: number | undefined;

        try {
            await AllureUtil.step(page, 'Prerequisite: Create member via API', async () => {
                const apiMember = await memberApiClient.createMember(memberData);
                memberId = apiMember.member_id;
                Logger.info(`Member created via API for deletion. ID: ${memberId}`);
            });

            await AllureUtil.step(page, 'Test: Delete member through the UI and validate deactivation', async () => {
                const memberPage = new MemberPage(page);
                const common = new Common(page);
                const toast = new Toast(page);

                await openMemberPage(page, memberPage);
                await common.enterSearchText(memberData.email);
                await common.clickDeleteIcon(memberData.email);
                await common.clickDeleteButton();
                await toast.verifyToastMessage(deleteMember.verifyToastMessage);
                Logger.info('Member deleted successfully through UI.');
                if (memberId === undefined) {
                    throw new Error('Member ID is unavailable');
                }
                const dbMember = await memberRepository.getMemberById(memberId);
                expect(dbMember.isActive).toBe(false);
                Logger.info('Successfully verified member is deactivated in the database.');
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
            Logger.info('--- END TEST: Delete an existing member ---');
        }
    });
});
