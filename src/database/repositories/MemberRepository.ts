import { executeQuery } from '@src/database/connection/DatabaseClient';
import { MemberDbRow } from '@src/models/database/MemberDbModel';
import { expect } from '@playwright/test';
import { AllureUtil } from '@src/reporting/allure/AllureUtil';

export class MemberRepository {
    /**
     * Retrieves a member row from public.memberdetails by ID.
     */
    async getMemberById(id: number): Promise<MemberDbRow> {
        const result = await executeQuery<MemberDbRow>(
            `
                SELECT
                    id,
                    firstname,
                    lastname,
                    membername,
                    is_active AS "isActive"
                FROM public.memberdetails
                WHERE id = $1
            `,
            [id],
        );
        expect(result.rowCount, `Member with ID ${id} was not found in the database`).toBe(1);
        const row = result.rows[0];
        if (!row) {
            throw new Error(`Member with ID ${id} was not found in the database`);
        }
        return row;
    }

    /**
     * Retrieves a member row from public.memberdetails by Firstname.
     */
    async getMemberByName(firstname: string): Promise<MemberDbRow> {
        const result = await executeQuery<MemberDbRow>(
            `
                SELECT
                    id,
                    firstname,
                    lastname,
                    membername,
                    is_active AS "isActive"
                FROM public.memberdetails
                WHERE firstname = $1
            `,
            [firstname],
        );
        expect(result.rowCount, `Member with name "${firstname}" was not found in the database`).toBe(
            1,
        );
        const row = result.rows[0];
        if (!row) {
            throw new Error(`Member with name "${firstname}" was not found in the database`);
        }
        return row;
    }

    /**
     * Soft deletes/deactivates a member by setting is_active = false.
     */
    async deactivateMember(id: number | undefined): Promise<void> {
        if (id === undefined) {
            return;
        }
        const result = await executeQuery<{ id: number; isActive: boolean }>(
            `
                UPDATE public.memberdetails
                SET is_active = false
                WHERE id = $1
                RETURNING id, is_active AS "isActive"
            `,
            [id],
        );
        expect(result.rowCount, `Member ${id} was not deactivated`).toBe(1);
        expect(result.rows[0]?.isActive, `Member ${id} is still active`).toBe(false);
        await AllureUtil.attachJson('Member deactivation evidence', {
            entity: 'Member',
            id,
            isActive: false,
            verifiedAt: new Date().toISOString(),
        });
    }
}
