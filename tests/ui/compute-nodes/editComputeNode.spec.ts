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
import { updateComputeNode, validComputeNodes } from '@src/test-data/computeNodes/computeNodes.json';
import computeNodesData from '@src/test-data/computeNodes/computeNodes.json';

test.describe('Edit GPU Node tests', () => {
    test.describe.configure({ mode: 'serial' });

    test('View an existing GPU Node @ComputeNodes', async ({
        page,
        computeNodeApiClient,
        computeNodeRepository,
    }, testInfo) => {
        Logger.info('--- START TEST: View GPU Node ---');
        await AllureUtil.setTestDetails({
            epic: 'Setup',
            feature: 'GPU Nodes',
            story: 'View GPU Node',
            severity: 'normal',
            owner: 'Shaik Nowreen',
            tags: ['Regression', 'UI'],
            parentSuite: 'SentinelX',
            suite: 'GPU Node Module',
            subSuite: 'View GPU Node'
        });
        const computeNodeData = createUniqueComputeNodeData(validComputeNodes, testInfo.workerIndex, 'view');
        const gpuPage = new ComputeNodes(page);
        const common = new Common(page);
        let computeNodeId: number | undefined;
        try {
            await AllureUtil.step(page, 'Prerequisite: Create GPU Node', async () => {
                const created = await createComputeNodeThroughUi(page, computeNodeApiClient, computeNodeData);
                computeNodeId = created.id;
            });
            await AllureUtil.step(page, 'Search GPU Node', async () => {
                await openComputeNodePage(page, gpuPage);
                await common.enterSearchText(computeNodeData.name);
            });
            await AllureUtil.step(page, 'Verify GPU Node in list', async () => {
                await gpuPage.verifyComputeNodeInList(computeNodeData.name);
            });
            await AllureUtil.step(page, 'Validate GPU Node from API', async () => {
                const apiNode = await computeNodeApiClient.getComputeNodeByName(computeNodeData.name);
                expect(apiNode.name).toBe(computeNodeData.name);
            });
        } finally {
            await AllureUtil.step(page, 'Postrequisite: Deactivate the created GPU Node', async () => {
                if (computeNodeId === undefined) {
                    Logger.warn('Postrequisite skipped because GPU Node ID is unavailable.');
                    return;
                }
                Logger.info(`Postrequisite: Deactivating GPU Node ID ${computeNodeId}`);
                await computeNodeRepository.deactivateComputeNode(computeNodeId);
                Logger.info(`Postrequisite completed for GPU Node ID ${computeNodeId}`);
            });
            Logger.info('--- END TEST: View GPU Node ---');
        }
    });

    test('Edit existing GPU Node @ComputeNodes', async ({
        page,
        computeNodeApiClient,
        computeNodeRepository,
    }, testInfo) => {
        await AllureUtil.setTestDetails({
            epic: 'Setup',
            feature: 'GPU Nodes',
            story: 'Edit GPU Node',
            severity: 'normal',
            owner: 'Shaik Nowreen',
            tags: ['Regression', 'UI'],
            parentSuite: 'SentinelX',
            suite: 'GPU Node Module',
            subSuite: 'Edit GPU Node'
        });
        const originalData = createUniqueComputeNodeData(
            validComputeNodes,
            testInfo.workerIndex,
            'edit-original',
        );
        const updatedData = {
            ...originalData,
            gpu_nodeName: `${originalData.name}-updated`,
            gpu_maxStreams: updateComputeNode.updated_max_no_of_streams,
        };
        const gpuPage = new ComputeNodes(page);
        const common = new Common(page);
        let computeNodeId: number | undefined;

        try {
            await AllureUtil.step(page, 'Prerequisite: Create GPU Node', async () => {
                const created = await createComputeNodeThroughUi(page, computeNodeApiClient, originalData);
                computeNodeId = created.id;
            });
            await openComputeNodePage(page, gpuPage);
            await common.enterSearchText(originalData.name);
            await common.clickEditIcon();
            await gpuPage.update_computeNode_details({
                name: originalData.name,
                updatedName: updatedData.gpu_nodeName,
                updatedMaxNoOfStreams: updatedData.gpu_maxStreams,
            });

            const updateResponse = page.waitForResponse(
                (response) =>
                    response.url().includes('/api/hardware-environment/') &&
                    ['PUT', 'PATCH'].includes(response.request().method()) &&
                    response.status() === 200,
            );

            await common.clickUpdateButton();
            const toast = new Toast(page);
            await toast.verifyToastMessage(
                computeNodesData.updateComputeNode.updated_computeNode_toast_message,
            );
            await updateResponse;
            const apiNode = await computeNodeApiClient.getComputeNodeByName(updatedData.gpu_nodeName);
            expect(apiNode).toMatchObject({
                name: updatedData.gpu_nodeName,
                maxStreams: updatedData.gpu_maxStreams,
            });
            const dbNode = await computeNodeRepository.getComputeNodeById(computeNodeId);
            expect(dbNode).toMatchObject({
                id: computeNodeId,
                name: updatedData.gpu_nodeName,
                maxStreams: updatedData.gpu_maxStreams,
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
