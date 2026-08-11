import { Page, Locator } from '@playwright/test';
import { BasePage } from '@src/pages/base/BasePage';
import { Common } from '@src/pages/components/Common';
import { Sidebar } from '@src/pages/components/Sidebar';
import { Toast } from '@src/pages/components/Toast';
import { Logger } from '@src/reporting/logging/Logger';
import { FacilityFormData } from '@src/models/ui/FacilityUiModel';
import { FacilityApiClient } from '@src/api/clients/FacilityApiClient';
import { DataGrid } from '@src/pages/components/DataGrid';

export interface FacilityDetails {
    facilityName: string;
    facilityAddressLineOne: string;
    facilityAddressLineTwo: string;
    city: string;
    pinCode: string;
    state: string;
    country: string;
    regionName: string;
    verifyToastMessage: string;
}

export const facilityTimeregion = '-06:00 GMT';

export const facilityHeaders = [
    'S No.',
    'Name',
    'Address',
    'City',
    'State',
    'Country',
    'Time Region',
    'Zip Code',
    'Regions',
    'Streams',
    'Actions',
];

export class Facilities extends BasePage {
    private readonly facilityName: Locator;
    private readonly facilityAddressLineOne: Locator;
    private readonly facilityAddressLineTwo: Locator;
    private readonly city: Locator;
    private readonly pinCode: Locator;
    private readonly state: Locator;
    private readonly country: Locator;
    private readonly addTimeregionDropdown: Locator;
    private readonly editTimeregionDropdown: Locator;
    private readonly timeregionOption: Locator;
    private readonly regionName: Locator;
    private readonly common: Common;
    private readonly sidebar: Sidebar;
    private readonly toast: Toast;
    private readonly datagrid: DataGrid;

    constructor(page: Page) {
        super(page);

        this.common = new Common(page);
        this.sidebar = new Sidebar(page);
        this.toast = new Toast(page);
        this.datagrid = new DataGrid(page);

        this.facilityName = page.getByProfile('textbox', { name: 'Name' });
        this.facilityAddressLineOne = page.getByLabel('Address Line 1');
        this.facilityAddressLineTwo = page.getByLabel('Address Line 2');
        this.city = page.getByProfile('textbox', { name: 'City' });
        this.pinCode = page.getByProfile('textbox', { name: 'Pin Code' });
        this.state = page.getByProfile('textbox', { name: 'State/Province' });
        this.country = page.locator('input[name="country"]');
        this.addTimeregionDropdown = page
            .getByProfile('dialog', { name: 'Add Facility' })
            .getByProfile('combobox');
        this.editTimeregionDropdown = page
            .getByProfile('dialog', { name: 'Edit Facility' })
            .getByProfile('combobox');
        this.timeregionOption = page.locator('li[data-value="-06:00 GMT"]');
        this.regionName = page.getByLabel('Region Name');
    }

    async navigateToFacilities(): Promise<void> {
        Logger.info('Clicking on Setup menu');
        await this.sidebar.navigateToMenuItem('Setup');

        Logger.info('Clicking on Facility submenu');
        await this.sidebar.navigateToMenuItem('Facilities');

        await this.common.validateModuleHeader('Facilities');
        Logger.info('Validated the Header module is Facilities');
    }

    async clickOnAddFacility(): Promise<void> {
        Logger.info('Clicking on Add Facility button');
        await this.common.clickAddButton('Facility');
    }

    async enterFacilityName(details: Pick<FacilityDetails, 'facilityName'>): Promise<void> {
        Logger.info('Entering the Facility name');
        await this.facilityName.clear();
        await this.facilityName.fill(details.facilityName);
        Logger.info(`Entered Facility Name as ${details.facilityName}`);
    }

    async enterFacilityAddressLineOne(
        details: Pick<FacilityDetails, 'facilityAddressLineOne'>,
    ): Promise<void> {
        Logger.info('Entering Address Line 1');
        await this.facilityAddressLineOne.clear();
        await this.facilityAddressLineOne.fill(details.facilityAddressLineOne);
        Logger.info(`Entered Address Line 1 as ${details.facilityAddressLineOne}`);
    }

    async enterFacilityAddressLineTwo(
        details: Pick<FacilityDetails, 'facilityAddressLineTwo'>,
    ): Promise<void> {
        Logger.info('Entering Address Line 2');
        await this.facilityAddressLineTwo.clear();
        await this.facilityAddressLineTwo.fill(details.facilityAddressLineTwo);
        Logger.info(`Entered Address Line 2 as ${details.facilityAddressLineTwo}`);
    }

    async enterCity(details: Pick<FacilityDetails, 'city'>): Promise<void> {
        Logger.info('Entering City');
        await this.city.clear();
        await this.city.fill(details.city);
        Logger.info(`Entered City as ${details.city}`);
    }

    async enterPinCode(details: Pick<FacilityDetails, 'pinCode'>): Promise<void> {
        Logger.info('Entering Pin Code');
        await this.pinCode.clear();
        await this.pinCode.fill(details.pinCode);
        Logger.info(`Entered Pin Code as ${details.pinCode}`);
    }

    async enterState(details: Pick<FacilityDetails, 'state'>): Promise<void> {
        Logger.info('Entering State/Province');
        await this.state.clear();
        await this.state.fill(details.state);
        Logger.info(`Entered State/Province as ${details.state}`);
    }

    async enterCountry(details: Pick<FacilityDetails, 'country'>): Promise<void> {
        Logger.info('Entering Country');
        await this.country.clear();
        await this.country.fill(details.country);
        Logger.info(`Entered Country as ${details.country}`);
    }

    async selectTimeregionWhenAdding(): Promise<void> {
        Logger.info('Selecting Timeregion');
        await this.addTimeregionDropdown.click();
        await this.timeregionOption.click();
        Logger.info('Timeregion selected successfully');
    }

    async selectTimeregionWhenEditing(): Promise<void> {
        Logger.info('Selecting Timeregion');
        await this.editTimeregionDropdown.click();
        await this.timeregionOption.click();
        Logger.info('Timeregion selected successfully');
    }

    async click_on_edit_facility() {
        Logger.info('Clicking on Edit Facility Button');
        await this.common.clickEditIcon();
    }

    async click_on_delete_facility() {
        Logger.info('Clicking on Delete Facility Button');
        await this.common.clickDeleteIcon();
    }

    async click_on_delete_specific_facility() {
        Logger.info('Clicking on Delete Facility Button');
        await this.common.clickDeleteIcon();
    }

    async enterRegionName(details: Pick<FacilityDetails, 'regionName'>): Promise<void> {
        Logger.info('Entering Region Name');
        await this.regionName.clear();
        await this.regionName.fill(details.regionName);
        Logger.info(`Entered Region Name as ${details.regionName}`);
    }

    async verifyToastMessage(details: Pick<FacilityDetails, 'verifyToastMessage'>): Promise<void> {
        Logger.info('Verifying toast message');
        await this.toast.verifyToastMessage(details.verifyToastMessage);
        Logger.info(`Verified the toast message ${details.verifyToastMessage}`);
    }
}

export function createUniqueFacilityData(
    baseData: FacilityFormData,
    workerIndex: number,
    suffix: string,
): FacilityFormData {
    const uniqueValue = `${Date.now()}-${workerIndex}-${suffix}`;
    return { ...baseData, facilityName: `${baseData.facilityName}-${uniqueValue}` };
}

export async function openFacilitiesPage(page: Page, facilitiesPage: Facilities): Promise<void> {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await facilitiesPage.navigateToFacilities();
}

export async function populateFacilityForm(
    facilitiesPage: Facilities,
    facility: FacilityFormData,
): Promise<void> {
    await facilitiesPage.enterFacilityName({ facilityName: facility.facilityName });
    await facilitiesPage.enterFacilityAddressLineOne({
        facilityAddressLineOne: facility.facilityAddressLineOne,
    });
    await facilitiesPage.enterFacilityAddressLineTwo({
        facilityAddressLineTwo: facility.facilityAddressLineTwo,
    });
    await facilitiesPage.enterCity({ city: facility.city });
    await facilitiesPage.enterPinCode({ pinCode: facility.pinCode });
    await facilitiesPage.enterState({ state: facility.state });
    await facilitiesPage.enterCountry({ country: facility.country });
}

export async function createFacilityThroughUi(
    page: Page,
    facilityApiClient: FacilityApiClient,
    facilityData: FacilityFormData,
): Promise<{ id: number; data: FacilityFormData }> {
    const facilitiesPage = new Facilities(page);
    const common = new Common(page);
    const datagrid = new DataGrid(page);

    await openFacilitiesPage(page, facilitiesPage);
    await facilitiesPage.clickOnAddFacility();
    await populateFacilityForm(facilitiesPage, facilityData);
    await facilitiesPage.selectTimeregionWhenAdding();
    await common.clickSaveButton();
    //await facilitiesPage.verifyToastMessage({ verifyToastMessage: facilityData.verifyToastMessage });
    await datagrid.verifyHeaders([
        'S No.',
        'Name',
        'Address',
        'City',
        'State',
        'Country',
        'Time Region',
        'Zip Code',
        'Regions',
        'Streams',
        'Actions',
    ]);
    await common.enterSearchText(facilityData.facilityName);
    await datagrid.verifyRowByField('name', facilityData.facilityName, {
        name: facilityData.facilityName,
        address_line_1: facilityData.facilityAddressLineOne,
        city: facilityData.city,
        state: facilityData.state,
        country: facilityData.country,
        timeRegionName: facilityTimeregion,
        pincode: facilityData.pinCode,
        regions_count: '0',
        active_streams_count: '0',
    });

    await datagrid.verifyActionsForRow(0, ['View', 'Edit', 'Delete']);

    const createdFacility = await facilityApiClient.getFacilityByName(facilityData.facilityName);
    Logger.info(`Created Facility: ${createdFacility}`);

    return {
        id: createdFacility.id,
        data: facilityData,
    };
}
