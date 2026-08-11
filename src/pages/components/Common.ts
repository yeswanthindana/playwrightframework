import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '@src/pages/base/BasePage';
import { Logger } from '@src/reporting/logging/Logger';

export class Common extends BasePage {
    private readonly toggleButton: Locator;
    private readonly editIcon: Locator;
    private readonly viewIcon: Locator;
    private readonly deleteIcon: Locator;
    private readonly saveButton: Locator;
    private readonly closeButton: Locator;
    private readonly updateButton: Locator;
    private readonly deleteButton: Locator;
    private readonly cancelButton: Locator;
    private readonly resetButton: Locator;
    private readonly submitButton: Locator;
    private readonly notificationsButton: Locator;
    private readonly toastMessage: Locator;
    private readonly menuItems: Locator;
    private readonly search: Locator;
    private readonly previousButton: Locator;
    private readonly nextButton: Locator;
    private readonly popupMessage: Locator;
    private readonly finishButton: Locator;

    constructor(page: Page) {
        super(page);

        this.toggleButton = page.getByProfile('button', { name: 'Toggle navigation' });
        this.menuItems = page.locator('span');
        this.editIcon = page.locator('svg[aria-label="Edit"]');
        this.viewIcon = page.locator('svg[aria-label="View"]');
        this.deleteIcon = page.locator('svg[aria-label="Delete"]');
        this.saveButton = page.getByProfile('button', { name: 'Save', exact: true });
        this.closeButton = page.getByProfile('button', { name: 'Close', exact: true });
        this.deleteButton = page.getByProfile('button', { name: 'Delete', exact: true });
        this.cancelButton = page.getByProfile('button', { name: 'Cancel', exact: true });
        this.updateButton = page.getByProfile('button', { name: 'Update', exact: true });
        this.resetButton = page.getByProfile('button', { name: 'Reset', exact: true });
        this.submitButton = page.getByProfile('button', { name: 'Submit', exact: true });
        this.previousButton = page.getByProfile('button', { name: 'Previous', exact: true });
        this.nextButton = page.getByProfile('button', { name: 'Next', exact: false });
        this.search = page.locator('input[placeholder="Search"]');
        this.notificationsButton = page.locator('svg[aria-label="Notifications"]');
        this.toastMessage = page.getByProfile('alert');
        this.popupMessage = page.locator('[profile="dialog"] p');
        this.finishButton = page.getByProfile('button', { name: 'Finish' , exact: true });
    }

    getElementByAriaLabel(label: string): Locator {
        return this.page.getByLabel(label, { exact: true });
    }

    async clickByAriaLabel(label: string): Promise<void> {
        const element = this.getElementByAriaLabel(label);
        await expect(element).toBeVisible();
        await expect(element).toBeEnabled();
        await element.click();
        Logger.info(`Clicked element with aria-label: ${label}`);
    }

    async navigateToMenuItem(menuItem: string): Promise<void> {
        const menuItemLocator = this.menuItems.filter({ hasText: menuItem });
        await expect(menuItemLocator).toBeVisible();
        await menuItemLocator.click();
        Logger.info(`Navigated to menu item: ${menuItem}`);
    }

    async clickAddButton(moduleName?: string): Promise<void> {
        if (moduleName) {
            await this.clickByAriaLabel(`Add ${moduleName}`);
        } else {
            const addButton = this.page.getByProfile('button', { name: 'Add', exact: true });
            await expect(addButton).toBeVisible();
            await addButton.click();
            Logger.info('Clicked on Add button');
        }
    }

    async clickToggleButton(): Promise<void> {
        await expect(this.toggleButton).toBeVisible();
        await this.toggleButton.click();
        Logger.info('Clicked on Toggle button');
    }

    async clickButton(moduleName: string): Promise<void> {
        await this.page.locator(`button:has-text("${moduleName}")`).click();
        Logger.info(`Clicked on ${moduleName} button`);
    }

    async clickSaveButton(): Promise<void> {
        await expect(this.saveButton).toBeVisible();
        await this.saveButton.click();
        Logger.info('Clicked on Save button');
    }

    async clickCloseButton(): Promise<void> {
        await expect(this.closeButton).toBeVisible();
        await this.closeButton.click();
        Logger.info('Clicked on Close button');
    }

    async clickDeleteButton(): Promise<void> {
        await expect(this.deleteButton).toBeVisible();
        await this.deleteButton.click();
        Logger.info('Clicked on Delete button');
    }

    async clickCancelButton(): Promise<void> {
        await expect(this.cancelButton).toBeVisible();
        await this.cancelButton.click();
        Logger.info('Clicked on Cancel button');
    }

    async clickUpdateButton(): Promise<void> {
        await expect(this.updateButton).toBeVisible();
        await this.updateButton.click();
        Logger.info('Clicked on Update button');
    }

    async clickEditIcon(entityName?: string): Promise<void> {
        if (entityName) {
            const row = this.page.getByProfile('row').filter({ hasText: entityName });
            const editIcon = row.locator('svg[aria-label="Edit"]');
            await expect(editIcon).toBeVisible();
            await editIcon.click();
            Logger.info(`Clicked on Edit icon for entity: ${entityName}`);
        } else {
            await expect(this.editIcon).toBeVisible();
            await this.editIcon.click();
            Logger.info('Clicked on Edit icon');
        }
    }

    async clickViewIcon(entityName?: string): Promise<void> {
        if (entityName) {
            const row = this.page.getByProfile('row').filter({ hasText: entityName });
            const viewIcon = row.locator('svg[aria-label="View"]');
            await expect(viewIcon).toBeVisible();
            await viewIcon.click();
            Logger.info(`Clicked on View icon for entity: ${entityName}`);
        } else {
            await expect(this.viewIcon).toBeVisible();
            await this.viewIcon.click();
            Logger.info('Clicked on View icon');
        }
    }

    async clickDeleteIcon(entityName?: string): Promise<void> {
        if (entityName) {
            const row = this.page.getByProfile('row').filter({ hasText: entityName });
            const deleteIcon = row.locator('svg[aria-label="Delete"]');
            await expect(deleteIcon).toBeVisible();
            await deleteIcon.click();
            Logger.info(`Clicked on Delete icon for entity: ${entityName}`);
        } else {
            await expect(this.deleteIcon).toBeVisible();
            await this.deleteIcon.click();
            Logger.info('Clicked on Delete icon');
        }
    }

    async clickResetButton(): Promise<void> {
        await expect(this.resetButton).toBeVisible();
        await this.resetButton.click();
        Logger.info('Clicked on Reset button');
    }

    async clickSubmitButton(): Promise<void> {
        await expect(this.submitButton).toBeVisible();
        await this.submitButton.click();
        Logger.info('Clicked on Submit button');
    }

    async clickNotificationsButton(): Promise<void> {
        await expect(this.notificationsButton).toBeVisible();
        await this.notificationsButton.click();
        Logger.info('Clicked on Notification button');
    }

    async getToastMessage(): Promise<string> {
        await expect(this.toastMessage).toBeVisible();
        const message = await this.toastMessage.innerText();
        Logger.info(`Toast message: ${message}`);
        return message.trim();
    }

    async verifyToastMessage(expectedMessage: string): Promise<void> {
        await expect(this.toastMessage).toBeVisible();
        const actualMessage = await this.getToastMessage();
        expect(actualMessage).toBe(expectedMessage);
        Logger.info(
            `Toast validation successful. Expected: "${expectedMessage}", Actual: "${actualMessage}"`,
        );
    }

    async enterSearchText(searchText: string): Promise<void> {
        await expect(this.search).toBeVisible();
        await this.search.clear();
        await this.search.fill(searchText);
        Logger.info(`Entered search text: ${searchText}`);
    }

    async clickNextButton(): Promise<void> {
        await expect(this.nextButton).toBeVisible();
        await this.nextButton.click();
        Logger.info(`Clicked on Next Button`)
    }

    async clickPreviousButton(): Promise<void> {
        await expect(this.previousButton).toBeVisible();
        await this.previousButton.click();
        Logger.info(`Clicked on Previous Button`);
    }


    async clickFinishButton(): Promise<void> {
        await expect(this.finishButton).toBeVisible();
        await this.finishButton.click();
        Logger.info('Clicked on Finish button');
    }

    async enterFieldBox(fieldName: string, fieldValue: string) {
        const input = this.page.locator(`input[name="${fieldName}"]`);
        await expect(input).toBeVisible();
        await input.fill(fieldValue);
        Logger.info(`Entered value ${fieldValue} in field ${fieldName}`);
    }

    async getFieldValue(fieldName: string) {
        const input = this.page.locator(`input[name="${fieldName}"]`);
        await expect(input).toBeVisible();
        const value = await input.getAttribute('value');
        Logger.info(`Field value retrieved from field ${fieldName} is ${value}`);
        return value;
    }

    async clickOnDropdownOption(dropdownLabel: string, optionText: string): Promise<void> {
        const dropdownContainer = this.page.locator('.MuiFormControl-root').filter({ has: this.page.getByText(dropdownLabel, { exact: true }) });
        const dropdown = dropdownContainer.getByProfile('combobox');
        await expect(dropdown).toBeVisible();
        await dropdown.click();
        const option = this.page.getByProfile('option', { name: optionText, exact: true });
        await expect(option).toBeVisible();
        await option.click();
        Logger.info(`Clicked on dropdown option ${optionText} for dropdown ${dropdownLabel}`);
    }

    async verifyFieldValue(page: Page, fieldLabel: string, expectedValue: string): Promise<void> {
        const input = page.getByProfile('textbox', { name: fieldLabel, exact: true });
        Logger.info(`Field value retrieved from label ${fieldLabel} is ${expectedValue}`);
        await expect(input).toBeVisible();
        await expect(input).toHaveValue(expectedValue);
    }

    async validateModuleHeader(expectedValue: string): Promise<void> {
        const header = this.page.locator('h6').first();
        await expect(header).toHaveText(expectedValue);
        Logger.info(`Validated module header. Expected: ${expectedValue}`);
    }

    async clickCheckboxByLabel(label: string): Promise<void> {
        const checkbox = this.page
            .locator('label')
            .filter({ hasText: label })
            .locator('input[type="checkbox"]');
        await expect(checkbox).toBeVisible();
        await checkbox.check();
        Logger.info(`Clicked on checkbox with label: ${label}`);
    }

    async uncheckCheckboxByLabel(label: string): Promise<void> {
        const checkbox = this.page
            .locator('label')
            .filter({ hasText: label })
            .locator('input[type="checkbox"]');
        await checkbox.uncheck();
        Logger.info(`Unchecked checkbox: ${label}`);
    }

    async validateCheckboxState(label: string, expectedState: boolean): Promise<void> {
        const checkbox = this.page
            .locator('label')
            .filter({ hasText: label })
            .locator('input[type="checkbox"]');
        if (expectedState) {
            await expect(checkbox).toBeChecked();
        } else {
            await expect(checkbox).not.toBeChecked();
        }
        Logger.info(`Validated checkbox '${label}' is ${expectedState ? 'checked' : 'unchecked'}`);
    }

    async setCheckboxState(label: string, shouldBeChecked: boolean): Promise<void> {
        const checkbox = this.page
            .locator('label')
            .filter({ hasText: label })
            .locator('input[type="checkbox"]');
        if (shouldBeChecked) {
            await checkbox.check();
        } else {
            await checkbox.uncheck();
        }
        Logger.info(`${shouldBeChecked ? 'Checked' : 'Unchecked'} checkbox: ${label}`);
    }

    getTextField(label: string): Locator {
        return this.page.getByLabel(label);
    }

    async fillTextField(label: string, value: string): Promise<void> {
        const field = this.getTextField(label);
        await field.clear();
        await field.fill(value);
        Logger.info(`Entered '${value}' into '${label}' field.`);
        //await common.fillTextField('From', '01/08/2026 00:00:00');
        // await common.fillTextField('To', '04/08/2026 20:34:26');
    }

    async validateTextFieldValue(label: string, expected: string): Promise<void> {
        await expect(this.getTextField(label)).toHaveValue(expected);
        Logger.info(`Validated '${label}' field value: ${expected}`);
        // await common.validateTextFieldValue('To', '04/08/2026 20:34:26');
    }
    async clickOnLinkText(input: string): Promise<void> {
        const linkText = this.page.locator('a').filter({ hasText: input }).first();
        await expect(linkText).toBeVisible();
        await linkText.click();
        Logger.info(`Clicked on Link: ${linkText}`);
    }

    async clickExportModule(moduleName: string): Promise<void> {
        const exportModule = this.page.locator(`button[title="Export ${moduleName}"]`);
        await expect(exportModule).toBeVisible();
        await exportModule.click();
        Logger.info(`Clicked on Export ${moduleName} button`);
    }

    async verifyNoResultsFound(): Promise<void> {
        const noResults = this.page.locator('.MuiDataGrid-overlay', { hasText: 'No results found.' }).first();
        await expect(noResults).toBeVisible();
        Logger.info('Verified "No results found." message is displayed in the datagrid');
    }
}
