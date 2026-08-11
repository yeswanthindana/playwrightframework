import { Page, expect, Locator } from '@playwright/test';
import { BasePage } from '@src/pages/base/BasePage';
import { Sidebar } from '@src/pages/components/Sidebar';
import { Logger } from '@src/reporting/logging/Logger';
import { Common } from '@src/pages/components/Common';
import { ComputeNodesData } from '@src/models/ui/ComputeNodesUiModel';
import { ComputeNodesApiClient } from '@src/api/clients/ComputeNodesApiClient';

export interface ComputeNodeDetails {
    name: string;
    ipAddress: string;
    framesFolderPath: string;
    membername: string;
    password: string;
    maxStreams: number;
    updatedName: string;
    updatedMaxNoOfStreams: number;
}

export class ComputeNodes extends BasePage {
    private readonly name: Locator;
    private readonly ipAddressInput: Locator;
    private readonly framesFolderPath: Locator;
    private readonly membername: Locator;
    private readonly gpuPassword: Locator;
    private readonly validateButton: Locator;
    private readonly maxStreams: Locator;
    private readonly common: Common;
    private readonly sidebar: Sidebar;

    constructor(page: Page) {
        super(page);
        this.common = new Common(page);
        this.sidebar = new Sidebar(page);
        this.name = page.locator('input[name="name"]');
        this.ipAddressInput = page.locator('input[name="ip_address"]');
        this.framesFolderPath = page.locator('input[name="frames_folder_path"]');
        this.membername = page.locator('input[name="ssh_membername"]');
        this.gpuPassword = page.locator('input[name="ssh_password"]');
        this.validateButton = page.locator('button:has-text("Validate")');
        this.maxStreams = page.locator('input[name="max_streams"]');
    }

    async navigate_To_ComputeNodes() {
        Logger.info('Navigating to Setup menu...');
        await this.common.navigateToMenuItem('Setup');
        Logger.info('Opening GPU Nodes page...');
        await this.common.navigateToMenuItem('GPU Nodes');
        await expect(this.page).toHaveURL(/compute-nodes/);
        Logger.success('Successfully navigated to GPU Nodes page.');
    }

    async click_Add_ComputeNode() {
        Logger.info("Clicking 'Add GPU Node' button...");
        await this.common.clickByAriaLabel('Add GPU Node');
        await this.name.waitFor({ state: 'visible' });
        Logger.success("'Add GPU Node' dialog opened.");
    }

    async enter_ComputeNode_Name(details: Pick<ComputeNodeDetails, 'name'>): Promise<void> {
        Logger.info(`Node Name: ${details.name}`);
        await this.name.fill(details.name);
        Logger.info(`Entered GPU Node name: ${details.name} successfully`);
    }
    async enter_IPAddress(details: Pick<ComputeNodeDetails, 'ipAddress'>): Promise<void> {
        Logger.info(`IP Address: ${details.ipAddress}`);
        await this.ipAddressInput.fill(details.ipAddress);
        Logger.info(`Entered IP Address: ${details.ipAddress} successfully`);
    }
    async enter_FramefolderPath(details: Pick<ComputeNodeDetails, 'framesFolderPath'>): Promise<void> {
        Logger.info(`Frames Folder Path: ${details.framesFolderPath}`);
        await this.framesFolderPath.fill(details.framesFolderPath);
        Logger.info(`Entered Frame Folder Path: ${details.framesFolderPath}, successfully`);
    }
    async enter_MemberName(details: Pick<ComputeNodeDetails, 'membername'>): Promise<void> {
        Logger.info(`SSH Membername: ${details.membername}`);
        await this.membername.fill(details.membername);
        Logger.info(`Entered SSH Membername: ${details.membername}, successfully`);
    }
    async enter_Password(details: Pick<ComputeNodeDetails, 'password'>): Promise<void> {
        Logger.info('Entering SSH Password...');
        await this.gpuPassword.fill(details.password);
        Logger.info(`Entered SSH Password ${details.password}, successfully`);
        Logger.success('GPU Node details entered successfully.');
    }
    async click_Validate(): Promise<void> {
        Logger.info('Clicking Validate button...');
        await expect(this.validateButton).toBeVisible();
        await expect(this.validateButton).toBeEnabled();
        await this.validateButton.click();
        Logger.info('Waiting for node validation...');
    }
    // Method to verify the GPU Node validation message
    async verifyNodeSuccessMessage(expectedMessage: string): Promise<void> {
        Logger.info('Waiting for GPU Node validation message...');

        try {
            const messageLocator = this.page.getByText(expectedMessage, { exact: true });
            await expect(messageLocator).toBeVisible({ timeout: 30000 });
            Logger.info('GPU Node validation message is visible.');
            const actualMessage = (await messageLocator.innerText()).trim();
            Logger.info(`Actual validation message: "${actualMessage}"`);
            if (actualMessage === expectedMessage) {
                Logger.success(
                    `Expected validation message verified successfully: "${expectedMessage}"`,
                );
            } else {
                Logger.error(
                    `Validation message mismatch. Expected: "${expectedMessage}" | Actual: "${actualMessage}"`,
                );
                throw new Error(
                    `Validation failed. Expected "${expectedMessage}" but received "${actualMessage}"`,
                );
            }
        } catch (error) {
            Logger.error(
                `Failed to verify GPU Node validation message. Expected: "${expectedMessage}"`,
            );
            throw error;
        }
    }
    // Method to enter the maximum number of streams
    async enter_Max_Streams(details: Pick<ComputeNodeDetails, 'maxStreams'>): Promise<void> {
        Logger.info(`Entering Maximum Streams: ${details.maxStreams.toString()}`);
        await this.maxStreams.fill(details.maxStreams.toString());
        Logger.success('Maximum Streams value entered.');
    }
    // Method to click the "Save" button
    async click_Save() {
        Logger.info('Clicking Save button...');
        await this.common.clickSaveButton();
        Logger.info('Waiting for GPU Node creation...');
        Logger.success('Save button clicked.');
    }
    async search_ComputeNode(nodeName: string) {
        Logger.info(`Searching for GPU Node: ${nodeName}`);
        await this.common.enterSearchText(nodeName);
    }
    async verifyComputeNodeInList(nodeName: string): Promise<void> {
        Logger.info(`Verifying presence of GPU Node: ${nodeName} in the list...`);
        const nodeLocator = this.page.locator(`text=${nodeName}`);
        await expect(nodeLocator).toBeVisible({ timeout: 10000 });
        Logger.success(`GPU Node: ${nodeName} is present in the list.`);
    }
    async update_computeNode_details(
        details: Pick<ComputeNodeDetails, 'name' | 'updatedName' | 'updatedMaxNoOfStreams'>,
    ): Promise<void> {
        Logger.info(`Clearing the GPU Node existing name: ${details.name}`);
        await this.name.clear();
        Logger.info(`Entering new GPU Node name: ${details.updatedName}`);
        await this.name.fill(details.updatedName);
        Logger.info(`Updated GPU Node name: ${details.updatedName}`);
        await this.maxStreams.clear();
        await this.maxStreams.fill(details.updatedMaxNoOfStreams.toString());
        Logger.info(`Updated Maxinum no of streams: ${details.updatedMaxNoOfStreams}`);
    }

    async verifyUpdateSuccessMessage(expectedMessage: string): Promise<void> {
        const toast = this.page.getByProfile('alert');
        await expect(toast).toBeVisible({ timeout: 10000 });
        const message = await toast.textContent();
        Logger.info(`Actual update message: ${message}`);
        expect(message).toContain(expectedMessage);
    }
}

export function createUniqueComputeNodeData(
    baseData: ComputeNodesData,
    workerIndex: number,
    suffix: string,
): ComputeNodesData {
    const uniqueValue = `${Date.now()}-${workerIndex}-${suffix}`;
    return { ...baseData, name: `${baseData.name}-${uniqueValue}` };
}

export async function openComputeNodePage(page: Page, computeNodePage: ComputeNodes): Promise<void> {
    await page.goto('/dashboard');
    await computeNodePage.navigate_To_ComputeNodes();
}

export async function populateComputeNodeForm(
    computeNodesPage: ComputeNodes,
    facility: ComputeNodesData,
): Promise<void> {
    await computeNodesPage.enter_ComputeNode_Name({ name: facility.name });
    await computeNodesPage.enter_IPAddress({ ipAddress: facility.ipAddressInput });
    await computeNodesPage.enter_FramefolderPath({ framesFolderPath: facility.framesFolderPath });
    await computeNodesPage.enter_MemberName({ membername: facility.membername });
    await computeNodesPage.enter_Password({ password: facility.password });
    await computeNodesPage.enter_Max_Streams({ maxStreams: facility.max_no_of_streams });
}

export async function createComputeNodeThroughUi(
    page: Page,
    ComputeNodesApiClient: ComputeNodesApiClient,

    computeNodeData: ComputeNodesData,
): Promise<{ id: number; data: ComputeNodesData }> {
    const computeNodesPage = new ComputeNodes(page);

    await openComputeNodePage(page, computeNodesPage);
    await computeNodesPage.click_Add_ComputeNode();
    await populateComputeNodeForm(computeNodesPage, computeNodeData);
    await computeNodesPage.click_Validate();
    await computeNodesPage.click_Save();
    await computeNodesPage.verifyNodeSuccessMessage(computeNodeData.toast_message);

    const createComputeNode = await ComputeNodesApiClient.getComputeNodeByName(computeNodeData.name);
    return {
        id: createComputeNode.id,
        data: computeNodeData,
    };
}
