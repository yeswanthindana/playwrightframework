import { expect, test } from '@src/fixtures/index';
import {
    ComputeNodes,
    createComputeNodeThroughUi,
    createUniqueComputeNodeData,
    openComputeNodePage,
} from '@src/pages/setup/compute-nodes/ComputeNodesPage';
import { AllureUtil } from '@src/reporting/allure/AllureUtil';
import { Common } from '@src/pages/components/Common';
import { Toast } from '@src/pages/components/Toast';
import { Logger } from '@src/reporting/logging/Logger';
import { deleteComputeNode, validComputeNodes } from '@src/test-data/computeNodes/computeNodes.json';

test.describe('Delete GPU Node tests', () => {
    test.describe.configure({ mode: 'serial' });

    test('Delete existing GPU Node @ComputeNodes', async ({
        page,
        computeNodeApiClient,
        computeNodeRepository,
    }, testInfo) => {
        await AllureUtil.setTestDetails({
            epic: 'Setup',
            feature: 'GPU Nodes',
            story: 'Delete GPU Node',
            severity: 'normal',
            owner: 'Shaik Nowreen',
            tags: ['Regression', 'UI'],
            parentSuite: 'SentinelX',
            suite: 'GPU Node Module',
            subSuite: 'Delete GPU Node'
        });
        const computeNodeData = createUniqueComputeNodeData(validComputeNodes, testInfo.workerIndex, 'delete');
        const gpuPage = new ComputeNodes(page);
        const common = new Common(page);
        const toast = new Toast(page);
        let computeNodeId: number | undefined;

        try {
            await AllureUtil.step(page, 'Prerequisite: Create GPU Node', async () => {
                const created = await createComputeNodeThroughUi(page, computeNodeApiClient, computeNodeData);
                computeNodeId = created.id;
            });
            await AllureUtil.step(page, 'Test: Delete GPU Node through the UI', async () => {
                await openComputeNodePage(page, gpuPage);
                await common.enterSearchText(computeNodeData.name);
                await common.clickDeleteIcon();
                await common.clickDeleteButton();
                await toast.verifyToastMessage(deleteComputeNode.delete_computeNode_toast_message);

                const dbNode = await computeNodeRepository.getComputeNodeById(computeNodeId);
                expect(dbNode.isActive).toBe(false);
            });
        } finally {
            await AllureUtil.step(page, 'Postrequisite: Deactivate the created GPU Node', async () => {
                if (computeNodeId) {
                    Logger.info(`Postrequisite: Deactivating GPU Node ID ${computeNodeId}`);
                    await computeNodeRepository.deactivateComputeNode(computeNodeId);
                    Logger.info(`Postrequisite completed for GPU Node ID ${computeNodeId}`);
                } else {
                    Logger.warn('Postrequisite skipped because GPU Node ID is unavailable.');
                }
            });
        }
    });
});
