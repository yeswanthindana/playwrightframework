import { test, expect } from '@playwright/test';
import { LoginPage } from '../../src/pages/Authentication/LoginPage';
import { config } from '../../src/config/environment';

// test.use({
//     storageState: { cookies: [], origins: [] },
// });

test('Verify member login functionality', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login(config.membername, config.password);
    await expect(page).toHaveURL(/dashboard/);
});
