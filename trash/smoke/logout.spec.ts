import { test, expect } from '@playwright/test';
import { DashboardPage } from '../../src/pages/Dashboard/DashboardPage';
import { LoginPage } from '../../src/pages/Authentication/LoginPage';
import { config } from '../../src/config/environment';

// test.use({
//     storageState: { cookies: [], origins: [] },
// });

test('Verify member logout functionality', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.login(config.membername, config.password);
    await page.waitForLoadState('networkidle'); // wait untill dashboard loaded
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.logout();
    await expect(page).toHaveURL(/login/);
});
