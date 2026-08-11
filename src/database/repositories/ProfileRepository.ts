import { executeQuery } from '@src/database/connection/DatabaseClient';
import { expect } from '@playwright/test';
import { ProfileDbRow } from '@src/models/database/ProfileDbModel';
import { AllureUtil } from '@src/reporting/allure/AllureUtil';

export class ProfilesRepository {
    async getProfileById(id: number): Promise<ProfileDbRow> {
        const result = await executeQuery<ProfileDbRow>(
            `
            SELECT 
                id,
                name,
                description,
                is_system_super_admin as "SystemAdministrator",
                is_active As "isActive",
                created_by As "createdBy",
                updated_by As "updatedBy"
            FROM public.profiles
            WHERE id = $1
             `,
            [id],
        );

        expect(result.rowCount, `Profiles with ${id} was not found`).toBe(1);
        const row = result.rows[0];
        if (!row) {
            throw new Error(`No profile with id ${id} found.`);
        }
        return row;
    }

    async getProfileByName(name: string): Promise<ProfileDbRow> {
        const result = await executeQuery<ProfileDbRow>(
            `
            SELECT 
                 id,
                 name,
                 description,
                 is_system_super_admin as "SystemAdministrator",
                 is_active As "isActive",
                 created_by As "createdBy",
                 updated_by As "updatedBy"
                 FROM public.profiles
                 WHERE name = $1
            `,
            [name],
        );
        expect(result.rowCount, `Profiles with ${name} was not found`).toBe(1);

        const row = result.rows[0];
        if (!row) {
            throw new Error(`No profile with name ${name} found.`);
        }
        return row;
    }

    async deactivateProfile(id: number): Promise<void> {
        const result = await executeQuery<{ id: number; isActive: boolean }>(
            `
        UPDATE 
        public.profiles
        SET is_active = false
        WHERE id = $1
        RETURNING id, is_active AS "isActive"`,
            [id],
        );
        expect(result.rowCount, `Profile ${id} was not deactivated`).toBe(1);
        expect(result.rows[0]?.isActive, `Profile ${id} is still active`).toBe(false);
        await AllureUtil.attachJson('Profile deactivation evidence', {
            entity: 'Profile',
            id,
            isActive: false,
            verifiedAt: new Date().toISOString(),
        });
    }
}
