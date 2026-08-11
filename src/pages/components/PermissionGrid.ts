import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '@src/pages/base/BasePage';
import { Logger } from '@src/reporting/logging/Logger';

export type PermissionType = 'add' | 'edit' | 'delete';

export class PermissionGrid extends BasePage {
    private readonly permission: Locator;

    constructor(page: Page) {
        super(page);

        this.permission = page.locator('div.grid.grid-cols-5');
    }

    getFeatureRow(featureName: string) {
        const feature = this.page.getByText(featureName, { exact: true });
        const featureRow = this.permission.filter({ has: feature }).first();
        return featureRow;
    }

    getFeatureCheckbox(featureName: string) {
        return this.getFeatureRow(featureName).locator('input[type="checkbox"]').first();
    }

    getPermissionCheckbox(featureName: string, permission: PermissionType) {
        const permissionIndex: Record<PermissionType, number> = {
            add: 1,
            edit: 2,
            delete: 3,
        };
        return this.getFeatureRow(featureName)
            .locator('input[type="checkbox"]')
            .nth(permissionIndex[permission]);
    }

    async enableFeature(featureName: string) {
        const checkbox = this.getFeatureCheckbox(featureName);

        await expect(checkbox).toBeVisible();
        await checkbox.click();
        await expect(checkbox).toBeChecked();

        Logger.info(`Enabled feature ${featureName}`);
    }

    async disableFeature(featureName: string) {
        const checkbox = this.getFeatureCheckbox(featureName);

        await expect(checkbox).toBeVisible();
        await checkbox.click();
        await expect(checkbox).not.toBeChecked();

        Logger.info(`Disabled feature ${featureName}`);
    }

    async enablePermission(featureName: string, permision: PermissionType) {
        const permissionCheckBox = this.getPermissionCheckbox(featureName, permision);

        await expect(permissionCheckBox).toBeVisible();
        await permissionCheckBox.click();
        await expect(permissionCheckBox).toBeChecked();

        Logger.info(`Enable permission ${permision} for feature ${featureName}`);
    }

    async disablePermission(featureName: string, permision: PermissionType) {
        const permissionCheckBox = this.getPermissionCheckbox(featureName, permision);

        await expect(permissionCheckBox).toBeVisible();
        await permissionCheckBox.click();
        await expect(permissionCheckBox).not.toBeChecked();

        Logger.info(`Disabled permission of type ${permision} for feature Name ${featureName}`);
    }

    async enableAllPermissions(featureName: string) {
        await this.enablePermission(featureName, 'add');
        await this.enablePermission(featureName, 'edit');
        await this.enablePermission(featureName, 'delete');

        Logger.info(`Enabled all permissions for feature ${featureName}`);
    }

    async disableAllPermissions(featureName: string) {
        await this.disablePermission(featureName, 'add');
        await this.disablePermission(featureName, 'edit');
        await this.disablePermission(featureName, 'delete');

        Logger.info(`Disabled all permissions for featuree ${featureName}`);
    }

    async verifyFeatureState(featureName: string, expectedState: boolean) {
        const checkBox = this.getFeatureCheckbox(featureName);
        await expect(checkBox).toBeVisible();

        if (expectedState) {
            await expect(checkBox).toBeChecked();
        } else {
            await expect(checkBox).not.toBeChecked();
        }

        Logger.info(
            `Verified status of ${featureName} is ${expectedState ? 'enabled' : 'disabled'}`,
        );
    }

    async verifyPermissionState(
        featureName: string,
        permission: PermissionType,
        expectedState: boolean,
    ): Promise<void> {
        const checkBox = this.getPermissionCheckbox(featureName, permission);
        await expect(checkBox).toBeVisible();

        if (expectedState) {
            await expect(checkBox).toBeChecked();
        } else {
            await expect(checkBox).not.toBeChecked();
        }

        Logger.info(
            `Verified ${permission} permission for ${featureName} is ${expectedState ? 'enabled' : 'disabled'}`,
        );
    }
}
