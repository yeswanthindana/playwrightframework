import { test, expect } from '@src/fixtures/index';
import { AllureUtil } from '@src/reporting/allure/AllureUtil';
import { Common } from '@src/pages/components/Common';
import { Toast } from '@src/pages/components/Toast';
import { Logger } from '@src/reporting/logging/Logger';
import { addMember, editMember } from '@src/test-data/members/members.json';
import { createUniqueMemberData, openMemberPage, MemberPage } from '@src/pages/setup/members/MemberPage';

test.describe('Edit Member tests', () => {
    test.describe.configure({ mode: 'serial' });

    test('Edit an existing member @Member', async ({ page, memberApiClient, memberRepository }, testInfo) => {
        Logger.info('--- START TEST: Edit an existing member ---');
        await AllureUtil.setTestDetails({
            epic: 'Setup',
            feature: 'Members',
            story: 'Edit Member',
            severity: 'normal',
            tags: ['Regression', 'UI'],
            parentSuite: 'SentinelX',
            suite: 'Member Module',
            subSuite: 'Edit Member'
        });

        const initialData = createUniqueMemberData(addMember, testInfo.workerIndex, 'edit-init');
        const updatedData = createUniqueMemberData(editMember, testInfo.workerIndex, 'edit-upd');

        let memberId: number | undefined;

        try {
            await AllureUtil.step(page, 'Prerequisite: Create initial member via API', async () => {
                const apiMember = await memberApiClient.createMember(initialData);
                memberId = apiMember.member_id;
                Logger.info(`Initial member created via API. ID: ${memberId}`);
            });

            await AllureUtil.step(page, 'Test: Edit member through the UI and validate updates', async () => {
                const memberPage = new MemberPage(page);
                const common = new Common(page);
                const toast = new Toast(page);

                await openMemberPage(page, memberPage);
                await common.enterSearchText(initialData.email);
                await common.clickEditIcon(initialData.email);

                await memberPage.enterMemberName({ memberName: updatedData.firstname });
                await common.clickUpdateButton();
                await toast.verifyToastMessage(editMember.verifyToastMessage);
                Logger.info('Member updated successfully through UI.');
                if (memberId === undefined) {
                    throw new Error('Member ID is unavailable');
                }
                const apiMember = await memberApiClient.getMemberById(memberId);
                expect(apiMember.firstname).toBe(updatedData.firstname);
                Logger.info('Successfully validated updated member through API.');
                const dbMember = await memberRepository.getMemberById(memberId);
                expect(dbMember.firstname).toBe(updatedData.firstname);
                Logger.info('Successfully validated updated member in the database.');
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
            Logger.info('--- END TEST: Edit an existing member ---');
        }
    });
});
