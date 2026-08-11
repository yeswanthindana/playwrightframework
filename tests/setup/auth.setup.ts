import { expect, test as setup } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { LoginPage } from '@src/pages/authentication/LoginPage';
import { config } from '@src/config/environment';
import { SavedSessionStorage, sessionStoragePath } from '@src/fixtures/baseFixture';

setup('Authenticate member', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login(config.membername, config.password);

    await expect(page).toHaveURL(/\/dashboard(?:[/?#]|$)/);
    await expect(page.getByLabel('Profile')).toBeVisible();

    await mkdir(path.dirname(sessionStoragePath), { recursive: true });

    await page.context().storageState({ path: 'playwright/.auth/member.json' });

    const savedSession = await page.evaluate<SavedSessionStorage>(() => ({
        origin: window.location.origin,
        entries: Object.fromEntries(
            Array.from({ length: window.sessionStorage.length }, (_, index) => {
                const key = window.sessionStorage.key(index);
                if (key === null) {
                    throw new Error(
                        'Session storage changed while authentication was being saved.',
                    );
                }
                return [key, window.sessionStorage.getItem(key) ?? ''];
            }),
        ),
    }));

    if (Object.keys(savedSession.entries).length === 0) {
        throw new Error(
            'Login succeeded, but no session storage values were available to persist.',
        );
    }

    await writeFile(sessionStoragePath, JSON.stringify(savedSession, null, 2), {
        encoding: 'utf8',
        mode: 0o600,
    });
});
