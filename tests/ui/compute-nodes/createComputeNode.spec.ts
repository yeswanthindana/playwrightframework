import { expect, test } from '@src/fixtures/index';
import {
    createComputeNodeThroughUi,
    createUniqueComputeNodeData,
} from '@src/pages/setup/compute-nodes/ComputeNodesPage';
import { AllureUtil } from '@src/reporting/allure/AllureUtil';
import { Logger } from '@src/reporting/logging/Logger';
import { validComputeNodes } from '@src/test-data/computeNodes/computeNodes.json';

test.describe('Create GPU Node tests', () => {
    test.describe.configure({ mode: 'serial' });

    test('Add a new GPU Node @ComputeNodes', async ({
        page,
        computeNodeApiClient,
        computeNodeRepository,
    }, testInfo) => {
        Logger.info('--- START TEST: Add GPU Node ---');
        await AllureUtil.setTestDetails({
            epic: 'Setup',
            feature: 'GPU Nodes',
            story: 'Create GPU Node',
            severity: 'critical',
            owner: 'Shaik Nowreen',
            tags: ['Regression', 'UI'],
            parentSuite: 'SentinelX',
            suite: 'GPU Node Module',
            subSuite: 'Create GPU Node'
        });
        const computeNodeData = createUniqueComputeNodeData(validComputeNodes, testInfo.workerIndex, 'add');

        let computeNodeId: number | undefined;

        try {
            await AllureUtil.step(page, 'Prerequisite: Create GPU Node through UI', async () => {
                Logger.info(`Creating GPU Node: ${computeNodeData.name}`);
                const created = await createComputeNodeThroughUi(page, computeNodeApiClient, computeNodeData);
                computeNodeId = created.id;
                Logger.info(`GPU Node created successfully ID: ${computeNodeId}`);
            });

            await AllureUtil.step(page, 'Validate GPU Node through API', async () => {
                const apiNode = await computeNodeApiClient.getComputeNodeByName(computeNodeData.name);
                expect(apiNode).toMatchObject({
                    name: computeNodeData.name,
                    ipAddress: computeNodeData.ipAddressInput,
                    framesFolderPath: computeNodeData.framesFolderPath,
                    sshMembername: computeNodeData.membername,
                    maxStreams: computeNodeData.max_no_of_streams,
                });
                Logger.info('GPU Node API validation successful');
            });

            await AllureUtil.step(page, 'Validate GPU Node in Database', async () => {
                if (computeNodeId === undefined) {
                    throw new Error('GPU Node ID unavailable');
                }
                const dbNode = await computeNodeRepository.getComputeNodeById(computeNodeId);
                expect(dbNode).toMatchObject({
                    id: computeNodeId,
                    name: computeNodeData.name,
                    ipAddress: computeNodeData.ipAddressInput,
                    framesFolderPath: computeNodeData.framesFolderPath,
                    sshMembername: computeNodeData.membername,
                    maxStreams: computeNodeData.max_no_of_streams,
                    isActive: true,
                });
                Logger.info('GPU Node DB validation successful');
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
            Logger.info('--- END TEST: Add GPU Node ---');
        }
    });
});
