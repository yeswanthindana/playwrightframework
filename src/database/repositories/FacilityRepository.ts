import { executeQuery } from '@src/database/connection/DatabaseClient';
import { FacilityDbRow } from '@src/models/database/FacilityDbModel';
import { expect } from '@playwright/test';
import { AllureUtil } from '@src/reporting/allure/AllureUtil';

export class FacilityRepository {
    /**
     * Retrieves a facility row from public.facilities by ID.
     */
    async getFacilityById(id: number): Promise<FacilityDbRow> {
        const result = await executeQuery<FacilityDbRow>(
            `
                SELECT
                    id,
                    name,
                    address_line_1 AS "addressLineOne",
                    address_line_2 AS "addressLineTwo",
                    city,
                    state,
                    country,
                    pincode,
                    timeregion,
                    is_active AS "isActive"
                FROM public.facilities
                WHERE id = $1
            `,
            [id],
        );

        expect(result.rowCount, `Facility with ID ${id} was not found in the database`).toBe(1);
        const row = result.rows[0];
        if (!row) {
            throw new Error(`Facility with ID ${id} was not found in the database`);
        }
        return row;
    }

    /**
     * Retrieves a facility row from public.facilities by Name.
     */
    async getFacilityByName(name: string): Promise<FacilityDbRow> {
        const result = await executeQuery<FacilityDbRow>(
            `
                SELECT
                    id,
                    name,
                    address_line_1 AS "addressLineOne",
                    address_line_2 AS "addressLineTwo",
                    city,
                    state,
                    country,
                    pincode,
                    timeregion,
                    is_active AS "isActive"
                FROM public.facilities
                WHERE name = $1
            `,
            [name],
        );

        expect(result.rowCount, `Facility with name "${name}" was not found in the database`).toBe(
            1,
        );
        const row = result.rows[0];
        if (!row) {
            throw new Error(`Facility with name "${name}" was not found in the database`);
        }
        return row;
    }

    /**
     * Soft deletes/deactivates a facility by setting is_active = false.
     */
    async deactivateFacility(id: number | undefined): Promise<void> {
        if (id === undefined) {
            return;
        }
        const result = await executeQuery<{ id: number; isActive: boolean }>(
            `
                UPDATE public.facilities
                SET is_active = false
                WHERE id = $1
                RETURNING id, is_active AS "isActive"
            `,
            [id],
        );
        expect(result.rowCount, `Facility ${id} was not deactivated`).toBe(1);
        expect(result.rows[0]?.isActive, `Facility ${id} is still active`).toBe(false);
        await AllureUtil.attachJson('Facility deactivation evidence', {
            entity: 'Facility',
            id,
            isActive: false,
            verifiedAt: new Date().toISOString(),
        });
    }
}
